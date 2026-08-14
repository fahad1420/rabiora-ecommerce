import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useRoute, Link } from "wouter";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

const taka = (value: number) => `৳${value.toLocaleString("en-BD")}`;
export default function OrderConfirmation() {
  const [, params] = useRoute("/order-confirmation/:orderNumber");
  const orderNumber = params?.orderNumber ?? "";
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const confirmation = trpc.order.confirmation.useQuery({ orderNumber }, { enabled: Boolean(orderNumber) });
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const { t } = useLanguage();
  useEffect(() => { setWhatsappUrl(sessionStorage.getItem(`rabiora_order_whatsapp_${orderNumber}`) ?? ""); }, [orderNumber]);
  if (confirmation.isLoading) return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="catalogue-state">{t("loadingConfirmation")}</main></div>;
  if (!confirmation.data) return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="empty-checkout"><h1>{t("confirmationUnavailable")}</h1><Link href="/" className="btn">{t("returnHome")}</Link></main><RabioraFooter /></div>;
  const order = confirmation.data;
  return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="confirmation-page"><div className="confirmation-card"><CheckCircle2 size={58} aria-hidden="true" /><span className="badge">{t("orderReceived")}</span><h1>{t("thankYouOrder")}</h1><p>{t("orderPendingCopy")}</p><div className="order-number">{order.orderNumber}</div><div className="confirmation-details"><p><span>{t("paymentMethod")}</span><strong>{order.paymentMethod}</strong></p><p><span>{t("deliveryCharge")}</span><strong>{order.deliveryChargeTaka === 0 ? t("freeDhaka") : taka(order.deliveryChargeTaka)}</strong></p><p><span>{t("total")}</span><strong>{taka(order.totalTaka)}</strong></p></div>{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn">{t("sendWhatsApp")}</a>}<Link href="/" className="text-button">{t("continueShopping")}</Link></div></main><RabioraFooter /></div>;
}
