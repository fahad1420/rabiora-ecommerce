export type GuestCartItem = { productId: number; quantity: number };

const CART_KEY = "rabiora_guest_cart";
const CART_EVENT = "rabiora-cart-updated";

export function readGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((item) => Number.isInteger(item.productId) && Number.isInteger(item.quantity) && item.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function guestCartCount() {
  return readGuestCart().reduce((total, item) => total + item.quantity, 0);
}

export function addToGuestCart(productId: number) {
  const cart = readGuestCart();
  const existing = cart.find((item) => item.productId === productId);
  if (existing) existing.quantity += 1;
  else cart.push({ productId, quantity: 1 });
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function subscribeToGuestCart(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CART_KEY) listener();
  };
  window.addEventListener(CART_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CART_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
