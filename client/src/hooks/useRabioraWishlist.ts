import { useEffect, useState } from "react";
import { clearGuestWishlist, getGuestWishlist, subscribeGuestWishlist, toggleGuestWishlist } from "@/lib/guestIdentity";
import { trpc } from "@/lib/trpc";

export function useRabioraWishlist() {
  const customer = trpc.customer.me.useQuery();
  const authenticated = Boolean(customer.data);
  const remote = trpc.wishlist.list.useQuery(undefined, { enabled: authenticated });
  const utils = trpc.useUtils();
  const [guestIds, setGuestIds] = useState<number[]>(() => getGuestWishlist());
  useEffect(() => subscribeGuestWishlist(() => setGuestIds(getGuestWishlist())), []);
  const add = trpc.wishlist.add.useMutation({ onSuccess: () => utils.wishlist.list.invalidate() });
  const remove = trpc.wishlist.remove.useMutation({ onSuccess: () => utils.wishlist.list.invalidate() });
  const ids = authenticated ? (remote.data ?? []).map((item) => item.productId) : guestIds;
  return {
    authenticated,
    customer: customer.data,
    ids,
    count: ids.length,
    remoteItems: remote.data ?? [],
    toggle: async (productId: number) => {
      if (!authenticated) { toggleGuestWishlist(productId); return; }
      if (ids.includes(productId)) await remove.mutateAsync({ productId });
      else await add.mutateAsync({ productId });
    },
    clearGuest: clearGuestWishlist,
  };
}
