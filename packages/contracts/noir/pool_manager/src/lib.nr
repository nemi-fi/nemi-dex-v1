use aztec::protocol::{address::AztecAddress, traits::ToField};

pub global FEE_NUMERATOR: u128 = 997;
pub global FEE_DENOMINATOR: u128 = 1000;

/// Given an input amount of an asset and pool reserves, returns the maximum output amount of the other asset.
pub fn get_amount_out(amount_in: u128, reserve_in: u128, reserve_out: u128) -> u128 {
    assert(amount_in != 0, "NemiV1: INSUFFICIENT_INPUT_AMOUNT");
    assert((reserve_in != 0) & (reserve_out != 0), "NemiV1: INSUFFICIENT_LIQUIDITY");

    let amount_in_with_fee = amount_in * FEE_NUMERATOR;
    let numerator = amount_in_with_fee * reserve_out;
    let denominator = reserve_in * FEE_DENOMINATOR + amount_in_with_fee;
    numerator / denominator
}

/// Given the desired amounts and reserves of token0 and token1 returns the optimal amount of token0 and token1 to be added to the pool.
pub fn get_amounts_to_add(
    amount0_desired: u128,
    amount1_desired: u128,
    amount0_min: u128,
    amount1_min: u128,
    reserve0: u128,
    reserve1: u128,
) -> (u128, u128) {
    if (reserve0 == 0) | (reserve1 == 0) {
        (amount0_desired, amount1_desired)
    } else {
        let amount1_equivalent = quote_amount(amount0_desired, reserve0, reserve1);
        if (amount1_equivalent <= amount1_desired) {
            assert(amount1_equivalent >= amount1_min, "NemiV1: INSUFFICIENT_1_AMOUNT");
            (amount0_desired, amount1_equivalent)
        } else {
            let amount0_equivalent = quote_amount(amount1_desired, reserve1, reserve0);
            // This should never happen
            assert(amount0_equivalent <= amount0_desired);

            assert(amount0_equivalent >= amount0_min, "NemiV1: INSUFFICIENT_0_AMOUNT");
            (amount0_equivalent, amount1_desired)
        }
    }
}

/// Given some amount of an asset and pool reserves, returns an equivalent amount of the other asset. Tokens should be
/// added and removed from the Pool respecting this ratio.
fn quote_amount(amount_a: u128, reserve_a: u128, reserve_b: u128) -> u128 {
    assert(amount_a != 0, "NemiV1: INSUFFICIENT_AMOUNT");
    assert((reserve_a != 0) & (reserve_b != 0), "NemiV1: INSUFFICIENT_LIQUIDITY");

    (amount_a * reserve_b) / reserve_a
}

pub fn sqrt(value: u128, root_hint: u128) -> u128 {
    assert(value >= root_hint * root_hint);
    let root_hint_plus_1 = root_hint + 1;
    assert(value < root_hint_plus_1 * root_hint_plus_1);
    root_hint
}

pub fn sort_values<T>(is_sorted: bool, a: T, b: T) -> (T, T) {
    if is_sorted {
        (a, b)
    } else {
        (b, a)
    }
}

/// Rejects a transaction that reaches public execution after the caller's deadline.
///
/// `amount*_min` bounds the price a caller accepts but not the time: a transaction sitting in the mempool can be mined
/// much later, against a pool that has moved since. Both timestamps are unix seconds.
pub fn assert_not_expired(timestamp: u64, deadline: u64) {
    assert(timestamp <= deadline, "NemiV1: EXPIRED");
}

pub fn get_pool_id(token0: AztecAddress, token1: AztecAddress) -> Field {
    let input = [token0.to_field(), token1.to_field()];
    nodash::poseidon2(input)
}

mod tests {
    use super::assert_not_expired;

    #[test]
    fn assert_not_expired_accepts_a_deadline_in_the_future_and_the_deadline_block_itself() {
        assert_not_expired(1000, 1001);
        assert_not_expired(1000, 1000);
    }

    #[test(should_fail_with = "NemiV1: EXPIRED")]
    fn assert_not_expired_rejects_a_deadline_that_has_passed() {
        assert_not_expired(1001, 1000);
    }
}
