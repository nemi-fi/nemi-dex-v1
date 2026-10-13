import type { AztecAddress } from "@aztec/aztec.js/addresses";
import { NO_WAIT } from "@aztec/aztec.js/contracts";
import { L1FeeJuicePortalManager } from "@aztec/aztec.js/ethereum";
import { FeeJuicePaymentMethodWithClaim } from "@aztec/aztec.js/fee";
import { Fq, Fr } from "@aztec/aztec.js/fields";
import { createLogger } from "@aztec/aztec.js/log";
import { waitForTx, type AztecNode } from "@aztec/aztec.js/node";
import { getFeeJuiceBalance } from "@aztec/aztec.js/utils";
import { createEthereumChain } from "@aztec/ethereum/chain";
import { createExtendedL1Client } from "@aztec/ethereum/client";
import { retryUntil } from "@aztec/foundation/retry";
import { FeeJuiceContract } from "@aztec/noir-contracts.js/FeeJuice";
import { ProtocolContractAddress } from "@aztec/protocol-contracts";
import { sutils } from "@nemi-fi/utils";
import { Hex } from "ox";
import { assert } from "ts-essentials";
import type { Account } from "../sdk.js";

const AMOUNT = 1000000000000000000000n;

/** Generous, because on a network settling on a real L1 inclusion can take many minutes. */
const L1_TO_L2_MESSAGE_TIMEOUT_SECONDS = 30 * 60;

const anvilPrivateKey =
  "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6";

type FaucetParams = {
  aztecNode: sutils.EnhancedAztecNode<sutils.SupportedAvmChains>;
};

export async function faucet(params: FaucetParams) {
  const privateKey = getPrivateKeyByChain(params.aztecNode.chain);
  const aztecPrivateKey = Hex.concat("0x00", Hex.slice(privateKey, 1));
  const wallet = await sutils.createIsomorphicTestWallet(params.aztecNode);
  const accountManager = await wallet.createSchnorrAccount(
    Fr.fromString(aztecPrivateKey),
    new Fr(0), // salt
    Fq.fromString(aztecPrivateKey),
  );
  if (
    (await getFeeJuiceBalance(accountManager.address, params.aztecNode)) >
    AMOUNT / 2n
  ) {
    console.log("using existing account");
    return await sutils.registerAccount(accountManager);
  }

  console.log("minting & bridging...");
  const portal = await getPortal(params);
  const claim = await portal.bridgeTokensPublic(
    accountManager.address,
    AMOUNT,
    true /* mint */,
  );
  console.log("claim", claim);
  const paymentMethod = new FeeJuicePaymentMethodWithClaim(
    accountManager.address,
    claim,
  );

  await waitForL1ToL2Message(params.aztecNode, claim.messageHash);

  console.log("deploying account...");
  const account = sutils.ensureAccountDeployed(
    accountManager,
    params.aztecNode,
    paymentMethod,
  );
  return account;
}

export async function faucetTo({
  to,
  account,
  aztecNode,
}: {
  to: AztecAddress;
  account: Account;
} & FaucetParams) {
  const bal = await getFeeJuiceBalance(to, aztecNode);
  if (bal > AMOUNT / 2n) {
    console.log(`fee juice balance of ${to} is sufficient (${bal})`);
    return;
  }

  console.log(`minting & bridging fee juice to ${to}...`);
  const portal = await getPortal({ aztecNode });
  const claim = await portal.bridgeTokensPublic(to, AMOUNT, true /* mint */);

  await waitForL1ToL2Message(aztecNode, claim.messageHash);

  const feeJuice = FeeJuiceContract.at(
    ProtocolContractAddress.FeeJuice,
    account.wallet,
  );
  const { txHash } = await feeJuice.methods
    .claim(to, claim.claimAmount, claim.claimSecret, claim.messageLeafIndex)
    .send({ from: account.address, wait: NO_WAIT });
  console.log("claim tx", txHash.toString());
  await waitForTx(aztecNode, txHash, { timeout: sutils.AZTEC_TX_WAIT_TIMEOUT });
}

async function getPortal({ aztecNode }: FaucetParams) {
  const { l1ChainId } = await aztecNode.getNodeInfo();
  const l1Url = sutils.l1RpcUrls[aztecNode.chain.id];
  const l1Chain = createEthereumChain([l1Url], l1ChainId);
  const extendedClient = createExtendedL1Client(
    l1Chain.rpcUrls,
    getPrivateKeyByChain(aztecNode.chain),
    l1Chain.chainInfo,
  );

  console.log("Using L1 account", extendedClient.account.address);

  const portal = await L1FeeJuicePortalManager.new(
    aztecNode,
    extendedClient,
    createLogger("l1-fee-juice-portal"),
  );
  return portal;
}

/**
 * Waits until a bridged L1 to L2 message can actually be consumed on L2.
 *
 * Bridging only submits the message on L1; the sequencer has to pick it up before a claim
 * can be simulated, otherwise it fails with "No L1 to L2 message found". Waiting a fixed
 * couple of L2 blocks is enough against a local network, where blocks are produced on
 * demand, but not against a network settling on a real L1, where inclusion takes minutes.
 * So wait for the message itself rather than for blocks.
 */
async function waitForL1ToL2Message(
  aztecNode: AztecNode,
  messageHash: Hex.Hex,
) {
  console.log("waiting for the L1 to L2 message to be available on L2...");
  await retryUntil(
    async () =>
      (await aztecNode.getL1ToL2MessageMembershipWitness(
        "latest",
        Fr.fromHexString(messageHash),
      )) != null,
    `L1 to L2 message ${messageHash}`,
    L1_TO_L2_MESSAGE_TIMEOUT_SECONDS,
    5 /* poll interval, seconds */,
  );
  console.log("L1 to L2 message is available on L2");
}

function getPrivateKeyByChain(chain: sutils.SupportedAvmChains) {
  if (chain.id === sutils.supportedAvmChains.localNetwork.id) {
    return anvilPrivateKey;
  }

  const sepoliaPrivateKey = process.env.SEPOLIA_PRIVATE_KEY;
  assert(
    typeof sepoliaPrivateKey === "string",
    "SEPOLIA_PRIVATE_KEY is not set",
  );
  return sepoliaPrivateKey as Hex.Hex;
}
