mod lib;
mod reserves;

use aztec::macros::aztec;

/// This contract implements an Automated Market Maker (AMM) that maintains public state
/// while still achieving identity privacy. However, it does not provide function privacy:
/// - Anyone can observe what actions were performed.
/// - All amounts involved are visible, but who performed the action remains private.
///
/// Reentrancy: the pools' tokens are arbitrary caller-supplied contracts, so every token call is a call into untrusted
/// code. Two things keep that safe, and both must hold for any function added here:
/// - every reserve-mutating public function is `#[only_self]` and is only ever enqueued from an
///   `#[external("private")]` entrypoint, which a public callback cannot reach; and
/// - the public halves follow checks-effects-interactions: reserves and LP supply are persisted before any token call,
///   so a malicious token cannot observe or act on stale state mid-update.
#[aztec]
contract PoolManager {
    use crate::{
        lib::{assert_not_expired, get_amount_out, get_amounts_to_add, get_pool_id, sort_values},
        reserves::Reserves,
    };
    use aztec::{
        event::event_emission::emit_event_in_public,
        macros::{
            events::event,
            functions::{external, initializer, internal, only_self, view},
            storage::storage,
        },
        messages::delivery::MessageDelivery,
        protocol::{
            address::AztecAddress,
            constants::CONTRACT_INSTANCE_REGISTRY_CONTRACT_ADDRESS,
            contract_class_id::ContractClassId,
            traits::{FromField, Serialize, ToField},
        },
        state_vars::{Map, Owned, PublicMutable, StateVariable},
    };
    use contract_instance_registry::ContractInstanceRegistry;

    use balance_set::BalanceSet;
    use token::Token;

    use uint_note::{PartialUintNote, UintNote};

    #[storage]
    struct Storage<Context> {
        admin: PublicMutable<AztecAddress, Context>,
        balances: Map<Field, Owned<BalanceSet<Context>, Context>, Context>,
        total_supply: Map<Field, PublicMutable<u128, Context>, Context>,
        reserves: Map<AztecAddress, Map<AztecAddress, PublicMutable<Reserves, Context>, Context>, Context>,
    }

    // TODO: nuke this event. It's used for testing only.
    #[derive(Serialize)]
    #[event]
    struct AddLiquidity {
        token0: AztecAddress,
        token1: AztecAddress,
        amount0: u128,
        amount1: u128,
        liquidity: u128,
    }

    // TODO: nuke this event. It's used for testing only.
    #[derive(Serialize)]
    #[event]
    struct RemoveLiquidity {
        token0: AztecAddress,
        token1: AztecAddress,
        amount0: u128,
        amount1: u128,
        liquidity: u128,
    }

    // TODO: nuke this event. It's used for testing only.
    #[derive(Serialize)]
    #[event]
    struct Swap {
        token_in: AztecAddress,
        token_out: AztecAddress,
        amount_in: u128,
        amount_out: u128,
    }

    #[external("public")]
    #[initializer]
    fn constructor(admin: AztecAddress) {
        self.storage.admin.write(admin);
    }

    #[external("public")]
    #[view]
    fn get_admin() -> AztecAddress {
        self.storage.admin.read()
    }

    #[external("public")]
    fn set_admin(new_admin: AztecAddress) {
        assert(self.msg_sender() == self.storage.admin.read(), "NemiV1: UNAUTHORIZED");
        self.storage.admin.write(new_admin);
    }

    /// Privately adds liquidity to the pool. This function receives the minimum and maximum number of tokens the caller
    /// is willing to add, in order to account for changing market conditions, and will try to add as many tokens as
    /// possible.
    ///
    /// The identity of the liquidity provider is not revealed, but the action and amounts are.
    #[external("private")]
    fn add_liquidity(
        token0: AztecAddress,
        token1: AztecAddress,
        amount0_desired: u128,
        amount1_desired: u128,
        amount0_min: u128,
        amount1_min: u128,
        nonce: Field,
        liquidity_hint: u128,
        deadline: u64,
    ) {
        assert(token0.to_field().lt(token1.to_field()), "NemiV1: UNSORTED_TOKENS");
        // Fail here rather than deep inside `get_amounts_to_add`/`sqrt`, where a bad input costs the caller a full
        // proving cycle before it reverts.
        assert(
            (amount0_desired != 0) & (amount1_desired != 0),
            "NemiV1: INSUFFICIENT_INPUT_AMOUNT",
        );
        assert(
            (amount0_min <= amount0_desired) & (amount1_min <= amount1_desired),
            "NemiV1: EXCESSIVE_MIN_AMOUNT",
        );

        let pool_id = get_pool_id(token0, token1);
        let token0 = Token::at(token0);
        let token1 = Token::at(token1);

        let sender = self.msg_sender();

        // Transfer desired amounts and create refund hps
        let refund_token0_commitment = token0
            .transfer_private_to_public_with_commitment(sender, self.address, amount0_desired, nonce
                )
            .call(self.context);
        let refund_token1_commitment = token1
            .transfer_private_to_public_with_commitment(sender, self.address, amount1_desired, nonce
                )
            .call(self.context);

        // To mint liquidity tokens
        let liquidity_commitment =
            self.internal._initialize_transfer_commitment(pool_id, sender).to_field();

        // Complete the flow in public. Tokens and amounts will all be publicly known but the identity of the caller is not revealed.
        PoolManager::at(self.address)
            ._add_liquidity(
                token0.target_contract,
                token1.target_contract,
                amount0_desired,
                amount1_desired,
                amount0_min,
                amount1_min,
                refund_token0_commitment,
                refund_token1_commitment,
                liquidity_commitment.to_field(),
                liquidity_hint,
                deadline,
            )
            .enqueue(self.context);
    }

    #[external("public")]
    #[only_self]
    fn _add_liquidity(
        token0: AztecAddress,
        token1: AztecAddress,
        // TODO(security): calculate amount0_transferred and amount1_transferred based on balance changes
        amount0_transferred: u128,
        amount1_transferred: u128,
        amount0_min: u128,
        amount1_min: u128,
        refund_token0_commitment: Field,
        refund_token1_commitment: Field,
        liquidity_commitment: Field,
        liquidity_hint: u128,
        deadline: u64,
    ) {
        assert_not_expired(self.context.timestamp(), deadline);

        let reserves = self.internal._get_reserves(token0, token1);
        let pool_id = get_pool_id(token0, token1);
        let token0 = Token::at(token0);
        let token1 = Token::at(token1);

        // With the current balances known, we can calculate the token amounts to the pool, respecting the user's
        // minimum deposit preferences.
        let (amount0, amount1) = get_amounts_to_add(
            amount0_transferred,
            amount1_transferred,
            amount0_min,
            amount1_min,
            reserves.reserve0,
            reserves.reserve1,
        );

        // Mint liquidity tokens
        let total_supply = self.storage.total_supply.at(pool_id).read();
        let (new_reserves, locked_liquidity, minted_liquidity) =
            reserves.add_liquidity(amount0, amount1, total_supply, liquidity_hint);

        // Effects: persist every state change before the token calls below, so a token contract can never observe (or
        // re-enter against) stale reserves or a stale LP supply.
        self.storage.reserves.at(token0.target_contract).at(token1.target_contract).write(
            new_reserves,
        );
        self.internal._finalize_mint_to_private(
            pool_id,
            locked_liquidity,
            minted_liquidity,
            liquidity_commitment,
        );

        // Interactions: refund the excess tokens the caller transferred in.
        let refund_amount0 = amount0_transferred - amount0;
        let refund_amount1 = amount1_transferred - amount1;
        if (refund_amount0 != 0) {
            token0
                .transfer_public_to_commitment(
                    self.address,
                    refund_token0_commitment,
                    refund_amount0,
                    0,
                )
                .call(self.context);
        }
        if (refund_amount1 != 0) {
            token1
                .transfer_public_to_commitment(
                    self.address,
                    refund_token1_commitment,
                    refund_amount1,
                    0,
                )
                .call(self.context);
        }

        emit_event_in_public(
            self.context,
            AddLiquidity {
                token0: token0.target_contract,
                token1: token1.target_contract,
                amount0: amount0,
                amount1: amount1,
                liquidity: minted_liquidity,
            },
        );
    }

    /// Privately removes liquidity from the pool. This function receives how many liquidity tokens to burn, and the
    /// minimum number of tokens the caller is willing to receive, in order to account for changing market conditions.
    ///
    /// The identity of the liquidity provider is not revealed, but the action and amounts are.
    #[external("private")]
    fn remove_liquidity(
        token0: AztecAddress,
        token1: AztecAddress,
        liquidity: u128,
        amount0_min: u128,
        amount1_min: u128,
        deadline: u64,
    ) {
        assert(token0.to_field().lt(token1.to_field()), "NemiV1: UNSORTED_TOKENS");
        assert(liquidity != 0, "NemiV1: INSUFFICIENT_LIQUIDITY_BURNED");

        let pool_id = get_pool_id(token0, token1);
        let token0 = Token::at(token0);
        let token1 = Token::at(token1);

        let sender = self.msg_sender();

        // Burn liquidity
        self.internal._burn_private(pool_id, sender, liquidity);
        let completer = self.address;
        let token0_commitment =
            token0.initialize_transfer_commitment(sender, completer).call(self.context);
        let token1_commitment =
            token1.initialize_transfer_commitment(sender, completer).call(self.context);

        // Complete the flow in public. Tokens and amounts will all be publicly known but the identity of the caller is not revealed.
        PoolManager::at(self.address)
            ._remove_liquidity(
                token0.target_contract,
                token1.target_contract,
                liquidity,
                amount0_min,
                amount1_min,
                token0_commitment,
                token1_commitment,
                deadline,
            )
            .enqueue(self.context);
    }

    #[external("public")]
    #[only_self]
    fn _remove_liquidity(
        token0: AztecAddress,
        token1: AztecAddress,
        liquidity_burned: u128,
        amount0_min: u128,
        amount1_min: u128,
        token0_commitment: Field,
        token1_commitment: Field,
        deadline: u64,
    ) {
        assert_not_expired(self.context.timestamp(), deadline);

        let pool_id = get_pool_id(token0, token1);
        let token0 = Token::at(token0);
        let token1 = Token::at(token1);

        let reserves = self.internal._get_reserves(token0.target_contract, token1.target_contract);

        let total_supply_before_burn =
            self.storage.total_supply.at(pool_id).read() + liquidity_burned;

        let (new_reserves, amount0, amount1) =
            reserves.remove_liquidity(liquidity_burned, total_supply_before_burn);

        assert(
            (amount0 >= amount0_min) & (amount1 >= amount1_min),
            "NemiV1: INSUFFICIENT_AMOUNT_BURNED",
        );

        // Effects: persist the reduced reserves before paying the caller out.
        self.storage.reserves.at(token0.target_contract).at(token1.target_contract).write(
            new_reserves,
        );

        // Interactions.
        token0.transfer_public_to_commitment(self.address, token0_commitment, amount0, 0).call(
            self.context,
        );
        token1.transfer_public_to_commitment(self.address, token1_commitment, amount1, 0).call(
            self.context,
        );

        emit_event_in_public(
            self.context,
            RemoveLiquidity {
                token0: token0.target_contract,
                token1: token1.target_contract,
                amount0: amount0,
                amount1: amount1,
                liquidity: liquidity_burned,
            },
        );
    }

    global PATH_LEN: u32 = 2;
    /// Privately swaps `amount_in` `token_in` tokens for at least `amount_out_mint` `token_out` tokens with the pool.
    ///
    /// The identity of the swapper is not revealed, but the action and amounts are.
    #[external("private")]
    fn swap_exact_tokens_for_tokens(
        amount_in: u128,
        amount_out_min: u128,
        path: [AztecAddress; PATH_LEN],
        nonce: Field,
        deadline: u64,
    ) {
        for i in 0..PATH_LEN - 1 {
            assert(path[i] != path[i + 1], "NemiV1: IDENTICAL_ADDRESSES");
        }
        assert(amount_in != 0, "NemiV1: INSUFFICIENT_INPUT_AMOUNT");

        let sender = self.msg_sender();

        // We transfer the full amount in, since it is an exact amount, and prepare a partial note for the amount out,
        // which will only be known during public execution as it depends on the live balances.
        Token::at(path[0]).transfer_private_to_public(sender, self.address, amount_in, nonce).call(
            self.context,
        );
        let completer = self.address;
        let token_out_commitment = Token::at(path[path.len() - 1])
            .initialize_transfer_commitment(sender, completer)
            .call(self.context);

        PoolManager::at(self.address)
            ._swap_exact_tokens_for_tokens(
                amount_in,
                amount_out_min,
                path,
                token_out_commitment,
                deadline,
            )
            .enqueue(self.context);
    }

    #[external("public")]
    #[only_self]
    fn _swap_exact_tokens_for_tokens(
        amount_in: u128,
        amount_out_min: u128,
        path: [AztecAddress; PATH_LEN],
        token_out_commitment: Field,
        deadline: u64,
    ) {
        assert_not_expired(self.context.timestamp(), deadline);

        let mut reserves = [Reserves::default(); PATH_LEN - 1];
        let mut tokens_sorted = [false; PATH_LEN - 1];
        for i in 0..PATH_LEN - 1 {
            let (token_a, token_b) = (path[i], path[i + 1]);
            tokens_sorted[i] = token_a.to_field().lt(token_b.to_field());
            let (token0, token1) = sort_values(tokens_sorted[i], token_a, token_b);
            reserves[i] = self.internal._get_reserves(token0, token1);
        }

        // TODO(security): calculate last_amount_out based on balance changes
        // Effects: each hop's new reserves are persisted as it is computed, so every pool on the path is already
        // up to date before the output token is called below.
        let mut last_amount_out = amount_in;
        for i in 0..PATH_LEN - 1 {
            let current_reserves = reserves[i];
            let (reserve_in, reserve_out) = sort_values(
                tokens_sorted[i],
                current_reserves.reserve0,
                current_reserves.reserve1,
            );
            let amount_out = get_amount_out(last_amount_out, reserve_in, reserve_out);
            let (amount0_in, amount1_in) = sort_values(tokens_sorted[i], last_amount_out, 0);
            let (amount0_out, amount1_out) = sort_values(tokens_sorted[i], 0, amount_out);
            let new_reserves =
                current_reserves.swap(amount0_in, amount1_in, amount0_out, amount1_out);
            let (token0, token1) = sort_values(tokens_sorted[i], path[i], path[i + 1]);
            self.storage.reserves.at(token0).at(token1).write(new_reserves);
            last_amount_out = amount_out;
        }

        let token_out = Token::at(path[PATH_LEN - 1]);
        // TODO(security): calculate amount_out based on balance changes
        let amount_out = last_amount_out;
        assert(amount_out >= amount_out_min, "NemiV1: INSUFFICIENT_OUTPUT_AMOUNT");

        // Interactions.
        token_out
            .transfer_public_to_commitment(self.address, token_out_commitment, amount_out, 0)
            .call(self.context);

        emit_event_in_public(
            self.context,
            Swap {
                token_in: path[0],
                token_out: path[PATH_LEN - 1],
                amount_in: amount_in,
                amount_out: amount_out,
            },
        );
    }

    #[internal("public")]
    fn _get_reserves(token0: AztecAddress, token1: AztecAddress) -> Reserves {
        self.storage.reserves.at(token0).at(token1).read()
    }

    #[external("public")]
    #[view]
    fn get_reserves(token0: AztecAddress, token1: AztecAddress) -> [u128; 2] {
        assert(token0.to_field().lt(token1.to_field()), "NemiV1: UNSORTED_TOKENS");
        let reserves = self.storage.reserves.at(token0).at(token1).read();
        [reserves.reserve0, reserves.reserve1]
    }

    #[external("public")]
    #[view]
    fn total_supply(pool_id: Field) -> u128 {
        self.storage.total_supply.at(pool_id).read()
    }

    #[external("utility")]
    unconstrained fn balance_of_private(pool_id: Field, account: AztecAddress) -> u128 {
        self.storage.balances.at(pool_id).at(account).balance_of()
    }

    #[internal("private")]
    fn _initialize_transfer_commitment(pool_id: Field, to: AztecAddress) -> PartialUintNote {
        UintNote::partial(
            to,
            self.context,
            to,
            self.address, // completer
        )
    }

    #[internal("public")]
    fn _finalize_mint_to_private(
        pool_id: Field,
        locked_amount: u128,
        minted_amount: u128,
        commitment: Field,
    ) {
        let supply = self.storage.total_supply.at(pool_id).read() + minted_amount + locked_amount;
        self.storage.total_supply.at(pool_id).write(supply);

        let partial_note = PartialUintNote::from_field(commitment);
        let storage_slot = self.storage.balances.at(pool_id).get_storage_slot();
        partial_note.complete(self.context, self.address, storage_slot, minted_amount);
    }

    #[internal("private")]
    fn _burn_private(pool_id: Field, from: AztecAddress, amount: u128) {
        self.storage.balances.at(pool_id).at(from).sub(amount).deliver(
            MessageDelivery::onchain_constrained(),
        );
        PoolManager::at(self.address)._reduce_total_supply(pool_id, amount).enqueue(self.context);
    }

    #[external("public")]
    #[only_self]
    fn _reduce_total_supply(pool_id: Field, amount: u128) {
        // Only to be called from burn.
        let new_supply = self.storage.total_supply.at(pool_id).read() - amount;
        self.storage.total_supply.at(pool_id).write(new_supply);
    }

    // TODO(security): nuke all update related methods
    #[external("private")]
    fn update_to(new_class_id: ContractClassId) {
        PoolManager::at(self.address)._assert_is_admin(self.msg_sender()).enqueue(self.context);
        ContractInstanceRegistry::at(CONTRACT_INSTANCE_REGISTRY_CONTRACT_ADDRESS)
            .update(new_class_id)
            .enqueue(self.context);
    }

    #[external("private")]
    fn set_update_delay(new_delay: u64) {
        PoolManager::at(self.address)._assert_is_admin(self.msg_sender()).enqueue(self.context);
        ContractInstanceRegistry::at(CONTRACT_INSTANCE_REGISTRY_CONTRACT_ADDRESS)
            .set_update_delay(new_delay)
            .enqueue(self.context);
    }

    #[external("public")]
    #[only_self]
    fn _assert_is_admin(msg_sender: AztecAddress) {
        assert(msg_sender == self.storage.admin.read(), "NemiV1: UNAUTHORIZED");
    }

    #[external("public")]
    #[view]
    fn get_update_delay() -> u64 {
        ContractInstanceRegistry::at(CONTRACT_INSTANCE_REGISTRY_CONTRACT_ADDRESS)
            .get_update_delay()
            .view(self.context)
    }
}

mod tests {
    #[test]
    fn nothing() {
        // TODO(security): add tests
        // an empty test because testing fails with no test cases
    }
}
