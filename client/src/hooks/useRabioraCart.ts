import { trpc } from "@/lib/trpc";
import { getGuestCartToken } from "@/lib/guestIdentity";

export function useRabioraCart() {
  const token = getGuestCartToken();
  const utils = trpc.useUtils();
  const cart = trpc.cart.get.useQuery({ anonymousToken: token });
  const invalidate = () => utils.cart.get.invalidate({ anonymousToken: token });
  const add = trpc.cart.add.useMutation({ onSuccess: invalidate });
  const update = trpc.cart.update.useMutation({ onSuccess: invalidate });
  return {
    token,
    items: cart.data?.items ?? [],
    subtotalTaka: cart.data?.subtotalTaka ?? 0,
    count: (cart.data?.items ?? []).reduce((total, item) => total + item.quantity, 0),
    isLoading: cart.isLoading,
    add: (productId: number, quantity = 1) => add.mutateAsync({ anonymousToken: token, productId, quantity }),
    update: (productId: number, quantity: number) => update.mutateAsync({ anonymousToken: token, productId, quantity }),
    isMutating: add.isPending || update.isPending,
  };
}
