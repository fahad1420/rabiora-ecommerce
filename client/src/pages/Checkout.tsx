import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { getGuestCartToken } from "@/lib/guestIdentity";
import { trpc } from "@/lib/trpc";

const methods = ["bKash", "Nagad", "Rocket", "Cash on Delivery"] as const;
type PaymentMethod = (typeof methods)[number];
const taka = (value: number) => `৳${value.toLocaleString("en-BD")}`;

export default function Checkout() {
  const [, navigate] = useLocation();
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const [customerName, setCustomerName] = useState(wishlist.customer?.name ?? "");
  const [customerPhone, setCustomerPhone] = useState(wishlist.customer?.phone ?? "");
  const [districtArea, setDistrictArea] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash on Delivery");
  const [transactionId, setTransactionId] = useState("");
  const [submittedAmountTaka, setSubmittedAmountTaka] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();
  const checkout = trpc.order.checkout.useMutation();
  const manualWallet = paymentMethod !== "Cash on Delivery";
  const expectedDelivery = useMemo(() => /dhaka/i.test(districtArea) ? 0 : 120, [districtArea]);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    try {
      const order = await checkout.mutateAsync({ anonymousToken: getGuestCartToken(), customerName, customerPhone, districtArea, fullAddress, paymentMethod, transactionId: manualWallet ? transactionId : undefined, submittedAmountTaka: manualWallet ? Number(submittedAmountTaka) : undefined });
      await utils.cart.get.invalidate({ anonymousToken: getGuestCartToken() });
      sessionStorage.setItem(`rabiora_order_whatsapp_${order.orderNumber}`, order.clickToWhatsAppUrl);
      window.open(order.clickToWhatsAppUrl, "_blank", "noopener,noreferrer");
      navigate(`/order-confirmation/${order.orderNumber}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to place the order. Please try again."); }
  };

  if (cart.isLoading) return <div className="page-shell"><RabioraHeader cartCount={0} wishlistCount={wishlist.count} /><main className="catalogue-state">Loading checkout...</main></div>;
  if (cart.items.length === 0) return <div className="page-shell"><RabioraHeader cartCount={0} wishlistCount={wishlist.count} /><main className="empty-checkout"><h1>Your cart is empty</h1><p>Add a product before checkout.</p></main><RabioraFooter /></div>;
  return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="checkout-page"><div className="container checkout-layout"><form className="checkout-form" onSubmit={submit}><div className="section-title align-left"><span>Secure Checkout</span><h1>Complete Your Order</h1></div><section><h2>Delivery Details</h2><label>Full Name<input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></label><label>Phone Number<input required inputMode="tel" placeholder="01XXXXXXXXX" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} /></label><label>District / Area<input required placeholder="e.g., Tongi, Gazipur, Dhaka" value={districtArea} onChange={(event) => setDistrictArea(event.target.value)} /></label><label>Full Delivery Address<textarea required minLength={8} value={fullAddress} onChange={(event) => setFullAddress(event.target.value)} /></label></section><section><h2>Payment Method</h2><div className="payment-options">{methods.map((method) => <label className={paymentMethod === method ? "payment-option active" : "payment-option"} key={method}><input type="radio" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />{method}</label>)}</div>{manualWallet && <div className="manual-payment"><p><strong>{paymentMethod} manual payment</strong></p><p>Enter the transaction ID and the amount you submitted. Your payment will be reviewed manually; it is not automatically verified.</p><label>Transaction ID<input required value={transactionId} onChange={(event) => setTransactionId(event.target.value)} /></label><label>Submitted Amount (৳)<input required type="number" min="1" step="1" value={submittedAmountTaka} onChange={(event) => setSubmittedAmountTaka(event.target.value)} /></label></div>}</section>{error && <p className="form-error">{error}</p>}<button className="btn" disabled={checkout.isPending}>{checkout.isPending ? "Placing Order..." : "Confirm Order"}</button></form><aside className="checkout-summary"><h2>Order Summary</h2>{cart.items.map((item) => <div className="checkout-line" key={item.productId}><span>{item.quantity} × {item.name}</span><strong>{taka(item.lineTotalTaka)}</strong></div>)}<div className="checkout-total"><span>Subtotal</span><strong>{taka(cart.subtotalTaka)}</strong></div><div className="checkout-line"><span>Delivery</span><strong>{expectedDelivery === 0 ? "Free inside Dhaka" : taka(expectedDelivery)}</strong></div><div className="checkout-grand"><span>Estimated total</span><strong>{taka(cart.subtotalTaka + expectedDelivery)}</strong></div><p>Final totals and availability are validated by Rabiora before the order is created.</p></aside></div></main><RabioraFooter /></div>;
}
