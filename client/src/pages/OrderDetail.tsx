import { ArrowLeft, PackageCheck } from "lucide-react";
import { Link, Redirect, useRoute } from "wouter";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { trpc } from "@/lib/trpc";

const taka = (value: number) => `৳${value.toLocaleString("en-BD")}`;
const trackingStatuses = ["pending", "confirmed", "shipped", "delivered"] as const;

export default function OrderDetail() {
  const [, params] = useRoute("/account/orders/:orderNumber");
  const orderNumber = params?.orderNumber ?? "";
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const { t } = useLanguage();
  const customer = trpc.customer.me.useQuery();
  const detail = trpc.order.detail.useQuery({ orderNumber }, { enabled: Boolean(customer.data && orderNumber), refetchInterval: 30_000, refetchOnWindowFocus: true });

  if (!customer.isLoading && !customer.data) return <Redirect to="/login" />;
  if (customer.isLoading || detail.isLoading) return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="catalogue-state">{t("loadingOrderDetails")}</main></div>;
  if (!detail.data) return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="empty-checkout"><h1>{t("orderUnavailable")}</h1><Link href="/account" className="btn">{t("backToOrders")}</Link></main><RabioraFooter /></div>;

  const order = detail.data;
  const currentStatusIndex = trackingStatuses.indexOf(order.status);
  return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="order-detail-page"><div className="container order-detail-shell"><Link href="/account" className="order-back-link"><ArrowLeft size={16} aria-hidden="true" /> {t("backToOrders")}</Link><section className="order-detail-card"><div className="order-detail-heading"><div><span className="badge">{t("orderTracking")}</span><h1>{order.orderNumber}</h1><p>{t("orderDate")}: {new Date(order.createdAt).toLocaleString()}</p></div><span className={`status-pill status-${order.status}`}>{t(order.status)}</span></div><section className="tracking-section" aria-label={t("statusTimeline")}><h2>{t("statusTimeline")}</h2><ol className="status-timeline">{trackingStatuses.map((status, index) => <li key={status} className={index <= currentStatusIndex ? "is-complete" : ""}><span aria-hidden="true">{index + 1}</span><strong>{t(status)}</strong></li>)}</ol><p className="status-refresh-note">{t("statusRefreshNote")}</p><div className="status-history">{order.statusHistory.map((entry) => <p key={entry.id}><strong>{t(entry.nextStatus)}</strong><span>{new Date(entry.createdAt).toLocaleString()}</span>{entry.adminNote && <em>{entry.adminNote}</em>}</p>)}</div></section><div className="order-detail-grid"><section><h2>{t("productDetails")}</h2><div className="order-items">{order.items.map((item) => <article key={item.id} className="order-detail-item">{item.imageUrl ? <img src={item.imageUrl} alt={item.productName} /> : <div className="order-item-fallback"><PackageCheck aria-hidden="true" /></div>}<div><strong>{item.productName}</strong>{item.sku && <small>{item.sku}</small>}<p>{t("quantity")}: {item.quantity} × {taka(item.unitPriceTaka)}</p></div><strong>{taka(item.lineTotalTaka)}</strong></article>)}</div></section><section className="order-info-panel"><h2>{t("orderSummary")}</h2><p><span>{t("subtotal")}</span><strong>{taka(order.subtotalTaka)}</strong></p><p><span>{t("deliveryCharge")}</span><strong>{order.deliveryChargeTaka === 0 ? t("freeDhaka") : taka(order.deliveryChargeTaka)}</strong></p><p className="order-detail-total"><span>{t("total")}</span><strong>{taka(order.totalTaka)}</strong></p><h2>{t("paymentMethod")}</h2><p><span>{t("paymentMethod")}</span><strong>{order.paymentMethod}</strong></p>{order.payment && <><p><span>{t("submittedAmount")}</span><strong>{order.payment.submittedAmountTaka ? taka(order.payment.submittedAmountTaka) : t("notAvailable")}</strong></p><p><span>{t("transactionId")}</span><strong>{order.payment.transactionId ?? t("notAvailable")}</strong></p></>}<h2>{t("deliveryAddress")}</h2><p className="address-copy"><strong>{order.customerName}</strong><span>{order.customerPhone}</span><span>{order.districtArea}</span><span>{order.fullAddress}</span></p></section></div></section></div></main><RabioraFooter /></div>;
}
