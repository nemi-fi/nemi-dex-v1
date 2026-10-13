import { sutils } from "@nemi-fi/utils";
import type { LoggerService } from "./sdk.js";

export type ToastRenderable = string;
export type ToastOptions = {
  icon?: string;
  duration?: number;
  id?: ToastId;
};
export type ToastId = string | number;
export type IToastService = {
  log: (msg: ToastRenderable, options?: ToastOptions) => ToastId;
  success: (msg: ToastRenderable) => ToastId;
  error: (err: unknown) => ToastId;
  dismiss: (id: ToastId) => void;
  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: ToastRenderable;
      success: ToastRenderable;
      error: (e: string) => string;
    },
    options?: ToastOptions,
  ) => Promise<T>;

  confirm?(
    props: { confirmText: string; yes?: string; no?: string },
    options?: ToastOptions,
  ): Promise<boolean>;
};

export type IAztecService = {
  readonly chain: sutils.SupportedAvmChains;
};

export function wrapToastWithLogger(
  toast: IToastService,
  logger: LoggerService,
): IToastService {
  return {
    log: (...args) => {
      logger.info(...args);
      return toast.log(...args);
    },
    success: (...args) => {
      logger.info("Toast success", ...args);
      return toast.success(...args);
    },
    error: (...args) => {
      logger.error("Toast error", ...args);
      return toast.error(...args);
    },
    dismiss: (...args) => {
      logger.info("Toast dismiss", ...args);
      return toast.dismiss(...args);
    },
    promise: (promise, msgs, ...args) => {
      return toast.promise(
        sutils.iife(async () => {
          try {
            logger.info("Toast promise start", msgs.loading);
            const result = await promise;
            logger.info("Toast promise success", msgs.success, result);
            return result;
          } catch (e) {
            logger.error(
              "Toast promise error",
              msgs.error(sutils.errorToString(e)),
            );
            throw e;
          }
        }),
        msgs,
        ...args,
      );
    },
  };
}
