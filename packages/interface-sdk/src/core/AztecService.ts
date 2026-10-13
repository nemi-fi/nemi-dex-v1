import { sutils } from "@nemi-fi/utils";
import type { IAztecService } from "../types.js";

export class AztecService implements IAztecService {
  #chainName: { current: keyof typeof sutils.supportedAvmChains };

  constructor(
    storageKey: string,
    defaultChain: keyof typeof sutils.supportedAvmChains,
  ) {
    this.#chainName = sutils.svelte.persistedState(storageKey, defaultChain);
  }

  get chain() {
    return sutils.supportedAvmChains[this.#chainName.current];
  }

  reconnect(chainName: keyof typeof sutils.supportedAvmChains) {
    this.#chainName.current = chainName;
    window.location.reload();
  }
}
