import { ConfirmToast } from "@/components/ConfirmToast";
import { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import { toast as toast_ } from "sonner";

export const toast = {
  log(msg, options) {
    const a = toast_(msg, options);
    return a;
  },
  success(msg) {
    const a = toast_.success(msg);
    return a;
  },
  error(msg) {
    const a = toast_.error(sutils.errorToString(msg));
    return a;
  },
  dismiss(id) {
    toast_.dismiss(id);
  },
  promise(promise, msgs, options?) {
    toast_.promise(promise, { ...msgs, ...options });
    return promise;
  },
  confirm(props, options) {
    return new Promise<boolean>((resolve) => {
      const id = toast_(
        <ConfirmToast
          {...props}
          onResult={(result) => {
            toast_.dismiss(id);
            resolve(result);
          }}
        />,
        options,
      );
    });
  },
} satisfies interfaceSdk.IToastService;
