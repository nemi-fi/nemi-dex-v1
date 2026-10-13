import type { Fr } from "@aztec/aztec.js/fields";
import type { EmbeddedWallet } from "@aztec/wallets/embedded";

export async function getSingleKeyAccount(
  wallet: EmbeddedWallet,
  secretKey: Fr,
  alias: string,
) {
  const { Fq, Fr } = await import("@aztec/aztec.js/fields");
  const { poseidon2Hash } = await import("@aztec/foundation/crypto/poseidon");

  // Aztec v5 removed the implicit signing key derivation, so it has to be passed in. Derive
  // it from the secret so a given secretKey still maps to a single account.
  const signingKey = Fq.fromBufferReduce(
    (await poseidon2Hash([secretKey])).toBuffer(),
  );

  const salt = new Fr(0); // must be 0 for determinism (same secretKey -> same account)
  const manager = await wallet.createSchnorrInitializerlessAccount(
    secretKey,
    salt,
    signingKey,
    alias,
  );
  return manager;
}
