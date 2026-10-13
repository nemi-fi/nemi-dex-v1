use crate::lib::{FEE_DENOMINATOR, FEE_NUMERATOR};
use aztec::protocol::traits::Packable;
use nodash::TryFrom;

/// Amount of liquidity which gets locked when liquidity is provided for the first time. Its purpose is to prevent LP tokens value to be inflated.
global MINIMUM_LIQUIDITY: u128 = 1000;

// TODO(perf): use U120 and collapse into a single slot (Field)
#[derive(Default)]
pub struct Reserves {
    pub reserve0: u128,
    pub reserve1: u128,
}

impl Reserves {
    pub fn initialize() -> Self {
        Self { reserve0: 0, reserve1: 0 }
    }

    pub fn add_liquidity(
        self,
        amount0: u128,
        amount1: u128,
        total_liquidity_supply: u128,
        liquidity_hint: u128,
    ) -> (Self, u128, u128) {
        let (locked_liquidity, minted_liquidity) = if total_liquidity_supply == 0 {
            let liq = crate::lib::sqrt(amount0 * amount1, liquidity_hint) - MINIMUM_LIQUIDITY;
            (MINIMUM_LIQUIDITY, liq)
        } else {
            let liq = std::cmp::min(
                amount0 * total_liquidity_supply / self.reserve0,
                amount1 * total_liquidity_supply / self.reserve1,
            );
            (0, liq)
        };
        assert(minted_liquidity != 0, "NemiV1: INSUFFICIENT_LIQUIDITY_MINTED");

        let new_reserves = Self {
            // TODO(security): reserveX = balance_beforeX - balance_afterX but take into account that there are many pools in the same contract
            reserve0: self.reserve0 + amount0,
            reserve1: self.reserve1 + amount1,
        };
        (new_reserves, locked_liquidity, minted_liquidity)
    }

    pub fn remove_liquidity(
        self,
        liquidity_to_burn: u128,
        total_liquidity_supply: u128,
    ) -> (Self, u128, u128) {
        let amount0 = liquidity_to_burn * self.reserve0 / total_liquidity_supply;
        let amount1 = liquidity_to_burn * self.reserve1 / total_liquidity_supply;
        assert((amount0 != 0) & (amount1 != 0), "NemiV1: INSUFFICIENT_LIQUIDITY_BURNED");

        let new_reserves = Self {
            // TODO(security): reserveX = balance_beforeX - balance_afterX but take into account that there are many pools in the same contract
            reserve0: self.reserve0 - amount0,
            reserve1: self.reserve1 - amount1,
        };
        (new_reserves, amount0, amount1)
    }

    pub fn swap(
        self,
        amount0_in: u128,
        amount1_in: u128,
        amount0_out: u128,
        amount1_out: u128,
    ) -> Self {
        assert((amount0_in != 0) | (amount1_in != 0), "NemiV1: INSUFFICIENT_INPUT_AMOUNT");
        assert((amount0_out != 0) | (amount1_out != 0), "NemiV1: INSUFFICIENT_OUTPUT_AMOUNT");
        // TODO(security): reserveX = balance_beforeX - balance_afterX but take into account that there are many pools in the same contract
        let new_reserve0 = self.reserve0 + amount0_in - amount0_out;
        let new_reserve1 = self.reserve1 + amount1_in - amount1_out;
        {
            let reserve0_adjusted =
                new_reserve0 * FEE_DENOMINATOR - amount0_in * (FEE_DENOMINATOR - FEE_NUMERATOR);
            let reserve1_adjusted =
                new_reserve1 * FEE_DENOMINATOR - amount1_in * (FEE_DENOMINATOR - FEE_NUMERATOR);
            assert(
                reserve0_adjusted * reserve1_adjusted
                    >= self.reserve0 * self.reserve1 * FEE_DENOMINATOR * FEE_DENOMINATOR,
                "NemiV1: K",
            );
        }

        Self { reserve0: new_reserve0, reserve1: new_reserve1 }
    }
}

impl Packable for Reserves {
    let N: u32 = 2;
    fn pack(self) -> [Field; Self::N] {
        [self.reserve0 as Field, self.reserve1 as Field]
    }

    fn unpack(data: [Field; Self::N]) -> Self {
        Reserves { reserve0: u128::try_from(data[0]), reserve1: u128::try_from(data[1]) }
    }
}
