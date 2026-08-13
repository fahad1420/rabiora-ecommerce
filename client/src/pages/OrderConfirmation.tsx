import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useRoute, Link } from "wouter";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { trpc } from "@/lib/trpc";

const taka = (value: number) => `৳${value.toLocaleString("en-BD")}`;
export default function OrderConfirmation() {
  const [, params] = useRoute("/order-confirmation/:orderNumber");
  const orderNumber = params?.orderNumber ?? "";
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const confirmation = trpc.order.confirmation.useQuery({ orderNumber }, { enabled: Boolean(orderNumber) });
  const [whatsappUrl, setWhatsappUrl] = useState("");
  useEffect(() => { setWhatsappUrl(sessionStorage.getItem(`rabiora_order_whatsapp_${orderNumber}`) ?? ""); }, [orderNumber]);
  if (confirmation.isLoading) return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="catalogue-state">Loading your order confirmation...</main></div>;
  if (!confirmation.data) return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="empty-checkout"><h1>Order confirmation unavailable</h1><Link href="/" className="btn">Return Home</Link></main><RabioraFooter /></div>;
  const order = confirmation.data;
  return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="confirmation-page"><div className="confirmation-card"><CheckCircle2 size={58} /><span className="badge">Order Received</span><h1>Thank You for Your Order</h1><p>Your order has been recorded with status <strong>pending</strong>. We will confirm it shortly.</p><div className="order-number">{order.orderNumber}</div><div className="confirmation-details"><p><span>Payment method</span><strong>{order.paymentMethod}</strong></p><p><span>Delivery charge</span><strong>{order.deliveryChargeTaka === 0 ? "Free inside Dhaka" : taka(order.deliveryChargeTaka)}</strong></p><p><span>Total</span><strong>{taka(order.totalTaka)}</strong></p></div>{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn">Send Order on WhatsApp</a>}<Link href="/" className="text-button">Continue Shopping</Link></div></main><RabioraFooter /></div>;
}
