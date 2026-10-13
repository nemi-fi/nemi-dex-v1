# Security Audit — `pool_manager` Noir contracts

**Scope:** `packages/contracts/noir/pool_manager/src/{main.nr,lib.nr,reserves.nr}`
**Framework:** Aztec.nr / `aztec` v5.1.0, `token` (aztec-standards) v5.1.0-rc.1, Noir (u128 arithmetic reverts on overflow)
**Contract:** `PoolManager` — a multi-pool, Uniswap-V2-style constant-product AMM with identity privacy (amounts/actions are public; the actor is hidden).
**Auditor:** automated review (Claude). This is a best-effort review, not a guarantee of completeness. No formal verification or on-chain testing of exploits was performed. Severities reflect on-chain impact assuming the contract can be called directly (i.e., not trusting the frontend).

---

## How this differs from the reference AMM (why several protections are missing)

This contract is derived from the official Aztec `amm_contract` example, but with a fundamental change: the reference AMM is a **single pool with two fixed config tokens** and **derives reserves from the AMM's actual token balances**. `PoolManager` is instead a **multi-pool router over arbitrary caller-supplied token addresses** and tracks reserves in **internal storage updated from the amounts the caller reported** (`reserves: Map<AztecAddress, Map<AztecAddress, PublicMutable<Reserves>>>`).

That redesign drops three protections the reference contract has:

1. it validates `token_in != token_out` (`SAME_TOKEN_SWAP`) — **absent here**;
2. it validates the tokens belong to the configured pool — **not applicable, but replaced by nothing** (any token pair is accepted, in any order);
3. it measures reserves from **actual balance deltas** — here reserves are trusted from reported/enqueued amounts (see the `TODO(security)` comments the code already carries).

Most findings below stem from that redesign.

---

## Severity summary

| #   | Severity | Title                                                                                                       | Status   |
| --- | -------- | ----------------------------------------------------------------------------------------------------------- | -------- |
| H-1 | High     | Pool key is not canonicalized: `add`/`remove` use caller order, `swap` uses sorted order                    | Fixed    |
| H-2 | High     | No `token0 != token1` check — degenerate self-pairs / self-path swaps accepted                              | Fixed    |
| H-3 | High     | Reserves trusted from reported amounts, not measured balance deltas (fee-on-transfer / non-standard tokens) | Open     |
| H-4 | High     | Unrestricted admin: contract upgrade + admin change can drain every pool                                    | Open     |
| M-1 | Medium   | `u128` overflow in the K-invariant / `sqrt` bricks swaps once a pool grows (DoS)                            | Open     |
| M-2 | Medium   | Missing input validation in `add_liquidity` (min≤desired, non-zero) and no deadline anywhere                | Fixed    |
| M-3 | Medium   | External token call happens before reserve write (checks-effects-interactions not followed)                 | Fixed    |
| L-1 | Low      | `_remove_liquidity` correctness depends on fragile enqueue ordering of `_reduce_total_supply`               | Open     |
| L-2 | Low      | `get_amount_in` dead code with unexplained `+1`; `sqrt` root-hint multiply can overflow                     | Fixed    |
| L-3 | Low      | No security tests (`tests::nothing` is empty)                                                               | Open     |
| I-1 | Info     | Amount/action/timing are public by design — correlation can degrade the identity privacy                    | Accepted |

Every finding is Open as of this report. The Status column is updated by the pull request that
fixes each one, so this table stays the index of what is and is not addressed.

---

## High

### H-1 — Pool identity is not canonicalized between `add`/`remove` and `swap`

`add_liquidity`, `_add_liquidity`, `remove_liquidity`, `_remove_liquidity` key both the **LP pool id** and the **reserves map** by the **caller-supplied token order**:

- `main.nr:114,167,246,285` — `let pool_id = get_pool_id(token0, token1);` (caller order; `get_pool_id` = `poseidon2([token0, token1])`, which is order-sensitive — `lib.nr:76`).
- `main.nr:218,310` — `self.storage.reserves.at(token0.target_contract).at(token1.target_contract).write(...)` (caller order).

But `swap_exact_tokens_for_tokens` **canonicalizes** by sorting before touching reserves (`main.nr:366-367,397`):

```rust
tokens_sorted[i] = token_a.to_field().lt(token_b.to_field());
let (token0, token1) = sort_values(tokens_sorted[i], token_a, token_b);
// reads/writes reserves.at(token0).at(token1)  // always ascending
```

`sort_values`/`get_pool_id` are only ever used in canonical form inside `swap`; `add`/`remove` never sort.

**Impact:** the contract's safety silently depends on every caller passing tokens in ascending order. If a caller (a direct integrator, or a frontend bug) calls `add_liquidity(B, A, …)` with `B > A`:

- reserves are written to slot `[B][A]`, and LP tokens are minted under `pool_id = poseidon2([B, A])`;
- every `swap` for that pair reads/writes slot `[A][B]` (ascending) — a **different** storage location — so the deposited liquidity is **invisible and unswappable**, earns no fees, and is siloed from the canonical pool;
- `get_reserves`/`total_supply` views (also caller-order) disagree with what `swap` actually uses, misleading integrators.

Two "pools" can thus exist for one pair (`[A][B]` and `[B][A]`) with independent reserves and independent LP supplies. This is a correctness violation and a fund-fragmentation / lockup risk. The current frontend happens to sort (`sutils.sortTokens`), which is exactly why this is dangerous: the invariant is enforced off-chain only.

**Recommendation:** canonicalize inside the contract. Sort `(token0, token1)` at the top of `add_liquidity`/`remove_liquidity` (and derive `pool_id` and the reserves key from the sorted pair), exactly as `swap` does — or assert `token0.to_field().lt(token1.to_field())` and reject non-canonical input.

---

### H-2 — Missing `token0 != token1` validation

No function asserts the two tokens differ. The reference AMM asserts `SAME_TOKEN_SWAP`/identical-address; here it is absent in `add_liquidity` (`main.nr:104`), `remove_liquidity` (`main.nr:239`), and `swap_exact_tokens_for_tokens` (`path[0]` may equal `path[1]`, `main.nr:331`).

**Impact:** a self-pair pool (`token0 == token1`) produces a degenerate `Reserves` where `reserve0` and `reserve1` are two counters over the _same_ underlying token balance, and `get_amount_out`/the K-invariant run with `reserve_in == reserve_out`. At minimum this is a footgun that lets users create broken pools and lock funds; combined with H-3 (reserves not measured from balances) it is a candidate for arithmetic abuse, since a single real token balance backs two independently-tracked reserves. Uniswap V2 rejects this outright (`IDENTICAL_ADDRESSES`).

**Recommendation:** `assert(token0 != token1, "NemiV1: IDENTICAL_ADDRESSES")` in add/remove, and `assert(path[0] != path[path.len()-1], ...)` (and adjacent-hop inequality) in swap.

---

### H-3 — Reserves are trusted from reported amounts, not measured from balance deltas

Reserves are updated from the amounts passed through the private→public enqueue, not from the AMM's real token-balance change. The code flags this itself:

- `main.nr:156` `// TODO(security): calculate amount0_transferred and amount1_transferred based on balance changes`
- `main.nr:371,388` `// TODO(security): calculate … based on balance changes`
- `reserves.nr:40,57,73` `// TODO(security): reserveX = balance_beforeX - balance_afterX …`

`_add_liquidity` grows reserves by `amount0/amount1` derived from `amount0_transferred = amount0_desired` (`main.nr:157,173,208,218`); `_swap` treats `last_amount_out = amount_in` (`main.nr:372`); reserves are the source of truth for pricing and the K-check.

**Impact:** because **any** token address is accepted (H-1/H-2 context), a pool can contain a **fee-on-transfer, rebasing, or otherwise non-standard token** for which "amount requested" ≠ "amount actually received/held". Then the internal reserves **overstate** the tokens the contract really holds. All downstream math (`get_amounts_to_add`, `get_amount_out`, the `K` invariant in `reserves.nr:81`) operates on phantom reserves, so the pool can promise more output than it can pay and become insolvent; honest LPs / swappers in such a pool can be shortchanged. The reference AMM avoids this by computing reserves from measured balances.

**Recommendation:** measure `amount_transferred` and `amount_out` from actual balance deltas of `self.address` for each token (read balance before, read after, take the difference), accounting for the multi-pool sharing of one token contract across pools; or restrict pools to a vetted token allowlist. At minimum, document that only standard, non-fee-on-transfer tokens are safe and enforce it.

---

### H-4 — Unrestricted admin can upgrade the contract and drain all pools

`update_to` (`main.nr:477`) and `set_update_delay` (`main.nr:485`) let the admin change the contract's class id via the `ContractInstanceRegistry`, and `set_admin` (`main.nr:92`) transfers admin in one step. There is no timelock enforced by _this_ contract (it delegates the delay to the registry and the admin can also set that delay), no two-step handover, and a single EOA-style admin.

**Impact:** the admin can replace `PoolManager`'s code with arbitrary logic that transfers out every pool's tokens — a total loss / rug for all LPs. This is the most severe _practical_ risk and the contract already carries `// TODO(security): nuke all update related methods` (`main.nr:476`) and `// TODO(security): remove this…` intent.

**Recommendation:** remove upgradeability for production, or gate it behind a governance/timelock the admin cannot shorten, make `set_admin` two-step, and consider renouncing admin after launch. At minimum document the trust assumption prominently.

---

## Medium

### M-1 — `u128` overflow in the K-invariant and `sqrt` (denial of service as pools grow)

Noir `u128` arithmetic **reverts on overflow** (it does not wrap — confirmed against the Noir integer docs), so these are DoS, not silent K-bypass:

- `reserves.nr:82-83` — `reserve0_adjusted * reserve1_adjusted >= self.reserve0 * self.reserve1 * FEE_DENOMINATOR * FEE_DENOMINATOR`. With `FEE_DENOMINATOR = 1000`, the right side is `r0 * r1 * 1_000_000`, and `*_adjusted ≈ r * 1000`. For reserves on the order of `2^64` per side (≈18 tokens at 18 decimals), the products exceed `u128::MAX (≈3.4e38)` and the multiplication reverts — so **`swap` becomes permanently impossible** once a pool holds a moderate amount of liquidity.
- `reserves.nr:28` — `sqrt(amount0 * amount1, …)`: `amount0 * amount1` overflows for large first deposits; `lib.nr:54-56` — `root_hint * root_hint` / `(root_hint+1)^2` overflow for large roots.

LPs can still `remove_liquidity` (its path does not hit the K-check), so this is DoS-on-swap rather than a hard lockup, but it makes larger pools unusable.

**Recommendation:** perform the K-invariant and `sqrt` intermediate products in a wider type (e.g., `U256`/field-based mul) or bound reserves to a safe range; Uniswap V2 uses 112-bit reserves inside 256-bit math for exactly this reason.

### M-2 — Missing input validation and no deadline

- `add_liquidity` (`main.nr:104`) does not assert `amount0_min <= amount0_desired`, `amount1_min <= amount1_desired`, or that the desired amounts are non-zero (the reference AMM validates min ≤ max and max > 0). Bad inputs currently revert deep inside `get_amounts_to_add`/`sqrt` (via underflow/`INSUFFICIENT_*`) instead of failing fast, and a `min > desired` mistake wastes a full proving cycle.
- None of `add_liquidity` / `remove_liquidity` / `swap_exact_tokens_for_tokens` take a **deadline**. A transaction pending in the pool can be mined much later at a stale price; `amount_out_min` / `amountX_min` bound price but not time.

**Recommendation:** add early `assert`s for the ordering/non-zero invariants, and add a `deadline` parameter checked against the timestamp in the public phase.

### M-3 — External call before state write (checks-effects-interactions)

In `_swap_exact_tokens_for_tokens`, the output token transfer (`transfer_public_to_commitment`, `main.nr:391`) executes **before** reserves are persisted (`main.nr:396-399`); similarly `_add_liquidity`/`_remove_liquidity` transfer before writing reserves. `#[only_self]` plus the fact that the state-changing entrypoints are `#[external("private")]` (unreachable from a public callback) block the classic cross-function reentrancy, so this is **not** currently exploitable for theft. However, because arbitrary token contracts are callable (H-1/H-2/H-3), a malicious token can, during its transfer, re-enter `PoolManager`'s public view functions and observe pre-write reserves, and the ordering is fragile against future refactors that add non-`only_self` public mutators.

**Recommendation:** follow checks-effects-interactions — compute and persist the new reserves before the external token transfers — and keep every reserve-mutating public function `#[only_self]`. The `// TODO(security): protect against reentrancy attack` (`main.nr:10`) and `// TODO(security): move state persistence inside Reserves::swap` (`main.nr:395`) should be resolved.

---

## Low / Informational

### L-1 — `_remove_liquidity` relies on enqueue ordering

`total_supply_before_burn = total_supply.read() + liquidity_burned` (`main.nr:291-292`) is only correct because `_burn_private` enqueues `_reduce_total_supply` (`main.nr:465`) _before_ `remove_liquidity` enqueues `_remove_liquidity` (`main.nr:261`), so the supply is already reduced when it is read back and re-added. This is currently correct but silently breaks if the enqueue order is ever reordered. Prefer passing the pre-burn supply explicitly, or reading supply before the burn.

### L-2 — Dead code and minor arithmetic smells

`get_amount_in` (`lib.nr:18`) was never called and carried `+1 // TODO(security): why is +1 needed?` (the `+1` rounded the required input up so that rounding favors the pool rather than the trader). Fixed: the dead function has been removed. `sqrt`'s `root_hint` bounds multiplication (`lib.nr:54-56`) shares the overflow caveat from M-1 and is tracked there.

### L-3 — No security tests

`tests::nothing` (`main.nr:508-513`) is an empty placeholder (`// TODO(security): add tests`). There is no coverage for the invariants above (canonical ordering, K-invariant, first-deposit `MINIMUM_LIQUIDITY`, refund paths, admin gating). Add negative tests for each finding.

### I-1 — Privacy limitation is by design, but amount/timing correlation is real

The contract intentionally hides identity but publishes token addresses, exact amounts, and actions via public execution and the `AddLiquidity`/`RemoveLiquidity`/`Swap` events (`main.nr:48-78,222,314,401`). Unique amounts, or add-then-remove round-trips, are correlatable and can deanonymize the "private" actor. This matches the documented model ("does not provide function privacy") — flagged so it is an explicit, accepted trade-off. (The events are also marked `// TODO: nuke this event. It's used for testing only.` — remove before production to shrink the public surface.)

---

## Notes on things that are _not_ bugs

- **First-depositor inflation ("donation") attack does not apply.** Because reserves are internal accounting (H-3) rather than read from balances, a direct token donation to the contract does not move `reserves`, so the classic share-price-inflation attack against the first LP is not reachable here. (H-3 is the price paid for that immunity.)
- **`MINIMUM_LIQUIDITY` locking** (`reserves.nr:6,27-29`; `_finalize_mint_to_private` adds it to `total_supply` with no owner, `main.nr:452`) correctly leaves a permanently-unwithdrawable sliver, matching Uniswap V2.
- **`liquidity_hint` cannot be gamed:** `sqrt` asserts it is exactly `floor(sqrt(value))` (`lib.nr:53-58`), and it is ignored for non-initial deposits.
