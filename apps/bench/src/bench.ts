import { getInitialTestAccountsData } from "@aztec-labs/accounts/testing";
import { AztecAddress } from "@aztec-labs/aztec.js/addresses";
import { Fr } from "@aztec-labs/aztec.js/fields";
import {
  PoolManagerContract,
  TokenContract,
} from "@nemi-fi/contracts/contracts";
import { sutils } from "@nemi-fi/utils";
import { getPoolId } from "@nemi-fi/v1-sdk";
import { ProvingTimeProfiler } from "./ProvingTimeProfiler.js";
import { SizesProfiler } from "./SizesProfiler.js";
import { amt, connectToWallet } from "./utils.js";

async function main() {
  const { wallet, aztecNode } = await connectToWallet();
  await profile(new SizesProfiler("bench.json", wallet, aztecNode));
  if (process.env.BENCH_PROVING_TIME) {
    await profile(
      new ProvingTimeProfiler("proving-time-bench.json", wallet, aztecNode),
    );
  }
}

async function profile(profiler: ProvingTimeProfiler | SizesProfiler) {
  const wallet = profiler.wallet;
  const initialDataList = await getInitialTestAccountsData();
  // genesis-funded test accounts are initializerless since Aztec v5, and the address
  // only matches the funded one when derived the same way
  const aliceManager = await wallet.createSchnorrInitializerlessAccount(
    initialDataList[0]!.secret,
    initialDataList[0]!.salt,
    initialDataList[0]!.signingKey,
  );
  const alice = await sutils.registerAccount(aliceManager);
  // The `Account` (for auth witnesses) is no longer carried on `WalletAccount`; get it from
  // the manager we built.
  const aliceAccount = await aliceManager.getAccount();
  const bob = await sutils.registerAccount(
    await wallet.createSchnorrInitializerlessAccount(
      initialDataList[1]!.secret,
      initialDataList[1]!.salt,
      initialDataList[1]!.signingKey,
    ),
  );
  const usdc = await deployToken(alice, "USDC");
  console.log(
    "alice",
    alice.address.toString(),
    "bob",
    bob.address.toString(),
    "usdc",
    usdc.address.toString(),
  );

  await profiler.profile([
    {
      from: alice.address,
      f: usdc.methods.mint_to_private(alice.address, amt(100000)),
    },
    {
      from: alice.address,
      f: usdc.methods.mint_to_public(alice.address, amt(100000)),
    },
  ]);
  await profiler.profile([
    {
      from: alice.address,
      f: usdc.methods.transfer_private_to_private(
        alice.address,
        bob.address,
        amt(10),
        0,
      ),
    },
    {
      from: alice.address,
      f: usdc.methods.transfer_private_to_public(
        alice.address,
        alice.address,
        amt(50),
        0,
      ),
    },
  ]);

  await profiler.profile([
    {
      from: alice.address,
      f: usdc.methods.transfer_public_to_public(
        alice.address,
        bob.address,
        amt(10),
        0,
      ),
    },
    {
      from: alice.address,
      f: usdc.methods.transfer_public_to_private(
        alice.address,
        bob.address,
        amt(10),
        0,
      ),
    },
    {
      from: alice.address,
      f: usdc.methods.burn_private(alice.address, amt(10), 0),
    },
    {
      from: alice.address,
      f: usdc.methods.burn_public(alice.address, amt(10), 0),
    },
  ]);

  const { contract: poolManager } = await PoolManagerContract.deploy(
    alice.wallet,
    alice.address,
  ).send({ from: alice.address });
  const eth = await deployToken(alice, "ETH");
  await eth.methods
    .mint_to_private(alice.address, amt(100))
    .send({ from: alice.address });
  const poolId = await getPoolId(
    usdc.address.toString(),
    eth.address.toString(),
  );

  const nonce = Fr.random();
  // the local network's block timestamps run ahead of wall-clock time (by ~20 min, which
  // eats the default TTL), and the bench does not exercise expiry, so use a generous TTL
  const deadline = sutils.deadlineFromNow(24 * 60 * 60);

  const chainInfo = await profiler.wallet.getChainInfo();

  const toAdd0Raw = 10;
  const toAdd1Raw = 10;
  await profiler.profile([
    {
      from: alice.address,
      f: poolManager.methods
        .add_liquidity(
          ...sutils.sortTokens(usdc, eth),
          amt(toAdd0Raw),
          amt(toAdd1Raw),
          amt(1),
          amt(1),
          nonce,
          amt(Math.floor(Math.sqrt(toAdd0Raw * toAdd1Raw))),
          deadline,
        )
        .with({
          authWitnesses: [
            await aliceAccount.createAuthWit(
              {
                caller: poolManager.address,
                call: await usdc.methods
                  .transfer_private_to_public_with_commitment(
                    alice.address,
                    poolManager.address,
                    amt(toAdd0Raw),
                    nonce,
                  )
                  .getFunctionCall(),
              },
              chainInfo,
            ),

            await aliceAccount.createAuthWit(
              {
                caller: poolManager.address,
                call: await eth.methods
                  .transfer_private_to_public_with_commitment(
                    alice.address,
                    poolManager.address,
                    amt(toAdd1Raw),
                    nonce,
                  )
                  .getFunctionCall(),
              },
              chainInfo,
            ),
          ],
        }),
    },
  ]);

  await profiler.profile([
    {
      from: alice.address,
      f: poolManager.methods
        .swap_exact_tokens_for_tokens(
          amt(10),
          amt(1),
          [usdc.address, eth.address],
          nonce,
          deadline,
        )
        .with({
          authWitnesses: [
            await aliceAccount.createAuthWit(
              {
                caller: poolManager.address,
                call: await usdc.methods
                  .transfer_private_to_public(
                    alice.address,
                    poolManager.address,
                    amt(10),
                    nonce,
                  )
                  .getFunctionCall(),
              },
              chainInfo,
            ),
          ],
        }),
    },
  ]);

  const { result: lpBalance } = await poolManager.methods
    .balance_of_private(BigInt(poolId), alice.address)
    .simulate({ from: alice.address });
  console.log("lpBalance", lpBalance);

  await profiler.profile([
    {
      from: alice.address,
      f: poolManager.methods.remove_liquidity(
        ...sutils.sortTokens(usdc, eth),
        lpBalance,
        amt(1),
        amt(1),
        deadline,
      ),
    },
  ]);

  await profiler.saveResults();

  async function deployToken(account: sutils.WalletAccount, symbol: string) {
    const { contract } = await TokenContract.deployWithOpts(
      { wallet: account.wallet, method: "constructor_with_minter" },
      symbol,
      symbol,
      18,
      account.address,
      AztecAddress.zero(),
    ).send({ from: account.address });
    return contract;
  }
}

main();
