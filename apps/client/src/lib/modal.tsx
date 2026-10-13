import NiceModal from "@ebay/nice-modal-react";

export const modals = {
  create: NiceModal.create,
  show: <T, C, P extends React.ComponentProps<React.FC<C>>>(
    modal: React.FC<C>,
    args: Omit<P, "id"> & {
      id?: string;
    },
  ): Promise<T> => {
    const args2 = {
      ...args,
      id: args.id ?? crypto.randomUUID(),
    } as P;
    return NiceModal.show(modal, args2);
  },
  remove: NiceModal.remove,
};
