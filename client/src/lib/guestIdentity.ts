const GUEST_CART_TOKEN_KEY = "rabiora_guest_cart_token";
const GUEST_WISHLIST_KEY = "rabiora_guest_wishlist";
const WISHLIST_EVENT = "rabiora-wishlist-updated";

export function getGuestCartToken() {
  let token = window.localStorage.getItem(GUEST_CART_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID().replace(/-/g, "");
    window.localStorage.setItem(GUEST_CART_TOKEN_KEY, token);
  }
  return token;
}

export function getGuestWishlist() {
  try {
    const value = JSON.parse(window.localStorage.getItem(GUEST_WISHLIST_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is number => Number.isInteger(id) && id > 0) : [];
  } catch { return []; }
}

export function toggleGuestWishlist(productId: number) {
  const current = getGuestWishlist();
  const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId];
  window.localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(WISHLIST_EVENT));
  return next;
}

export function subscribeGuestWishlist(listener: () => void) {
  window.addEventListener(WISHLIST_EVENT, listener);
  return () => window.removeEventListener(WISHLIST_EVENT, listener);
}

export function clearGuestWishlist() {
  window.localStorage.removeItem(GUEST_WISHLIST_KEY);
  window.dispatchEvent(new Event(WISHLIST_EVENT));
}
