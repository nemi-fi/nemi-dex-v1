import { sutils } from "@nemi-fi/utils";
import { CoreService } from "./core/CoreService.js";
import { CurrencyListService } from "./core/CurrencyListService.js";
import { CurrencyService } from "./core/CurrencyService.js";
import { LoggerService } from "./core/LoggerService.js";
import { TestService } from "./core/TestService.js";
import { TransactionTrackerService } from "./core/TransactionTrackerService.js";
import { DeploymentsService } from "./dev/DeploymentsService.js";
import { AmmService } from "./dex/AmmService.js";
import { AmmRouter } from "./dex/routers/AmmRouter.js";
import { UniversalRouter } from "./dex/routers/UniversalRouter.js";
import { SwapApiService } from "./dex/server/SwapApiService.js";
import {
  wrapToastWithLogger,
  type IAztecService,
  type IToastService,
} from "./types.js";
import { CapabilitiesService } from "./wallet/CapabilitiesService.js";
import { EmbeddedWalletService } from "./wallet/EmbeddedWalletService.js";
import { WalletService } from "./wallet/WalletService.js";

export * from "./core/AztecService.js";
export * from "./core/CoreService.js";
export * from "./core/CurrencyListService.js";
export * from "./core/CurrencyService.js";
export * from "./core/LoggerService.js";
export * from "./core/TransactionTrackerService.js";
export * from "./dex/AmmService.js";
export * from "./dex/routers/AmmRouter.js";
export * from "./dex/routers/UniversalRouter.js";
export * from "./types.js";
export * from "./wallet/CapabilitiesService.js";
export * from "./wallet/EmbeddedWalletService.js";
export * from "./wallet/WalletService.js";

export function createCore(
  aztec: IAztecService,
  notWrappedToast: IToastService,
) {
  const logger = new LoggerService();
  const toast = wrapToastWithLogger(notWrappedToast, logger);
  const core = new CoreService(aztec, logger, toast);
  const transactionTracker = new TransactionTrackerService(core, toast, logger);
  const currencyList = new CurrencyListService(core, logger);
  const currency = new CurrencyService(core, transactionTracker);

  return {
    logger,
    aztec,
    core,
    currency,
    currencyList,
    transactionTracker,
    toast,
  };
}

export function createCoreForTesting() {
  const chainName = sutils.ChainNameSchema.parse(
    process.env.CHAIN ??
      ("localNetwork" satisfies keyof typeof sutils.supportedAvmChains),
  );
  const chain = sutils.supportedAvmChains[chainName];
  const core = createCoreForDeploying({ chain });
  const test = new TestService(core.core);
  return {
    ...core,
    test, // specifically expose here for testing only
  };
}

// TODO(security): nuke this function
export function createCoreForDeploying(aztec: IAztecService) {
  const core = createCore(aztec, testingToast);
  const deployments = new DeploymentsService(core.core, core.logger);
  return {
    ...core,
    deployments,
  };
}

export function createWallet(sdk: ReturnType<typeof createCore>) {
  const embeddedWallet = new EmbeddedWalletService("embedded-wallet", sdk.core);
  const capabilities = new CapabilitiesService(sdk.core, sdk.currencyList);
  const wallet = new WalletService(
    sdk.core,
    embeddedWallet,
    capabilities,
    sdk.toast,
  );
  return {
    ...sdk,
    wallet,
    embeddedWallet,
  };
}

export function createDex(sdk: ReturnType<typeof createCore>) {
  const amm = new AmmService(
    sdk.core,
    sdk.transactionTracker,
    sdk.currencyList,
    sdk.currency,
    sdk.logger,
  );
  const ammRouter = new AmmRouter(amm);
  const universalRouter = new UniversalRouter(
    sdk.core,
    sdk.transactionTracker,
    sdk.logger,
    [ammRouter],
  );

  return {
    amm,
    universalRouter,
  };
}

// TODO(security): move this and all backend services to a separate package
export function createBackend(
  sdk: ReturnType<typeof createCore> & ReturnType<typeof createDex>,
) {
  const swapApi = new SwapApiService(
    sdk.core,
    sdk.currencyList,
    sdk.universalRouter,
  );
  return {
    swapApi,
  };
}

export const testingToast: IToastService = {
  dismiss: () => {},
  log: (msg, options) => {
    // TODO(error handling): add error handling
    console.log(msg, options);
    return "";
  },
  success: (msg) => {
    console.log(msg);
    return "";
  },
  error: (err) => {
    console.error(err);
    return "";
  },
  promise: async (promise, msgs) => {
    console.log(msgs.loading);
    try {
      const result = await promise;
      console.log(msgs.success);
      return result;
    } catch (error) {
      console.error(msgs.error, error);
      throw error;
    }
  },
};
