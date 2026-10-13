import { Hex } from "ox";
import type { Account, CoreService } from "../sdk.js";
import { getSingleKeyAccount } from "../utils.js";

export class TestService {
  constructor(private core: CoreService) {}

  async deployTestAccount(seed: Hex.Hex): Promise<Account> {
    return await this.#deployTestAccount(seed);
  }

  async #deployTestAccount(seed: Hex.Hex) {
    const { sha256ToField } = await import("@aztec/foundation/crypto/sha256");

    const seedBigInt = Hex.toBigInt(seed);
    const secretKey = sha256ToField([seedBigInt]);
    const accountManager = await getSingleKeyAccount(
      await this.core.getTestWallet(),
      secretKey,
      `test-${seed}`,
    );
    return await this.core.ensureAccountDeployed(accountManager);
  }
}
