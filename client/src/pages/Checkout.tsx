import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { getGuestCartToken } from "@/lib/guestIdentity";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const checkout = trpc.order.checkout.useMutation();
  const manualWallet = paymentMethod !== "Cash on Delivery";
  const expectedDelivery = useMemo(() => /dhaka/i.test(districtArea) ? 0 : 120, [districtArea]);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    try {
      const order = await checkout.mutateAsync({ anonymousToken: getGuestCartToken(), customerName, customerPhone, districtArea, fullAddress, paymentMethod, transactionId: manualWallet ? transactionId : undefined, submittedAmountTaka: manualWallet ? Number(submittedAmountTaka) : undefined });
      await utils.cart.get.invalidate({ anonymousToken: getGuestCartToken() });
      if (order.clickToWhatsAppUrl) {
        sessionStorage.setItem(`rabiora_order_whatsapp_${order.orderNumber}`, order.clickToWhatsAppUrl);
        window.open(order.clickToWhatsAppUrl, "_blank", "noopener,noreferrer");
      }
      navigate(`/order-confirmation/${order.orderNumber}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("checkoutError")); }
  };

  if (cart.isLoading) return <div className="page-shell"><RabioraHeader cartCount={0} wishlistCount={wishlist.count} /><main className="catalogue-state">{t("loadingCheckout")}</main></div>;
  if (cart.items.length === 0) return <div className="page-shell"><RabioraHeader cartCount={0} wishlistCount={wishlist.count} /><main className="empty-checkout"><h1>{t("emptyCheckout")}</h1><p>{t("emptyCheckoutCopy")}</p></main><RabioraFooter /></div>;
  return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="checkout-page"><div className="container checkout-layout"><form className="checkout-form" onSubmit={submit}><div className="section-title align-left"><span>{t("secureCheckout")}</span><h1>{t("completeOrder")}</h1></div><section><h2>{t("deliveryDetails")}</h2><label>{t("fullName")}<input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></label><label>{t("phoneNumber")}<input required inputMode="tel" placeholder="01XXXXXXXXX" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} /></label><label>{t("districtArea")}<input required placeholder="e.g., Tongi, Gazipur, Dhaka" value={districtArea} onChange={(event) => setDistrictArea(event.target.value)} /></label><label>{t("fullAddress")}<textarea required minLength={8} value={fullAddress} onChange={(event) => setFullAddress(event.target.value)} /></label></section><section><h2>{t("paymentMethod")}</h2><div className="payment-options">{methods.map((method) => <label className={paymentMethod === method ? "payment-option active" : "payment-option"} key={method}><input type="radio" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />{method}</label>)}</div>{manualWallet && <div className="manual-payment"><p><strong>{paymentMethod} {t("manualPayment")}</strong></p><p>{t("manualPaymentCopy")}</p><label>{t("transactionId")}<input required value={transactionId} onChange={(event) => setTransactionId(event.target.value)} /></label><label>{t("submittedAmount")}<input required type="number" min="1" step="1" value={submittedAmountTaka} onChange={(event) => setSubmittedAmountTaka(event.target.value)} /></label></div>}</section>{error && <p className="form-error" role="alert">{error}</p>}<button className="btn" disabled={checkout.isPending}>{checkout.isPending ? t("placingOrder") : t("confirmOrder")}</button></form><aside className="checkout-summary"><h2>{t("orderSummary")}</h2>{cart.items.map((item) => <div className="checkout-line" key={item.productId}><span>{item.quantity} × {item.name}</span><strong>{taka(item.lineTotalTaka)}</strong></div>)}<div className="checkout-total"><span>{t("subtotal")}</span><strong>{taka(cart.subtotalTaka)}</strong></div><div className="checkout-line"><span>{t("delivery")}</span><strong>{expectedDelivery === 0 ? t("freeDhaka") : taka(expectedDelivery)}</strong></div><div className="checkout-grand"><span>{t("estimatedTotal")}</span><strong>{taka(cart.subtotalTaka + expectedDelivery)}</strong></div><p>{t("orderFinalNote")}</p></aside></div></main><RabioraFooter /></div>;
}
