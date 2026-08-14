import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Account() {
  const [, navigate] = useLocation();
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const customer = trpc.customer.me.useQuery();
  const logout = trpc.customer.logout.useMutation({ onSuccess: () => customer.refetch() });
  const updateProfile = trpc.customer.updateProfile.useMutation({ onSuccess: () => customer.refetch() });
  const orders = trpc.order.mine.useQuery(undefined, { enabled: Boolean(customer.data), refetchInterval: 30_000, refetchOnWindowFocus: true });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { t } = useLanguage();
  useEffect(() => { setName(customer.data?.name ?? ""); setEmail(customer.data?.email ?? ""); }, [customer.data?.name, customer.data?.email]);
  if (!customer.data) { navigate("/login"); return null; }
  const saveProfile = async (event: FormEvent) => { event.preventDefault(); await updateProfile.mutateAsync({ name, email }); };
  return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="account-page"><div className="account-card"><span className="badge">{t("myAccount")}</span><h1>{customer.data.name ?? t("customer")}</h1><p><strong>{t("phone")}:</strong> {customer.data.phone ?? t("phoneNotProvided")}</p><p><strong>{t("savedWishlistItems")}:</strong> {wishlist.count}</p><form className="profile-form" onSubmit={saveProfile}><label>{t("name")}<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>{t("emailOptional")}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><button className="btn" disabled={updateProfile.isPending}>{updateProfile.isPending ? t("saving") : t("saveProfile")}</button></form><section className="account-orders"><h2>{t("myOrders")}</h2>{orders.isLoading ? <p className="muted">{t("loadingOrderHistory")}</p> : orders.data?.length === 0 ? <p className="muted">{t("emptyOrderHistory")}</p> : orders.data?.map((order) => <Link key={order.id} href={`/account/orders/${order.orderNumber}`} className="account-order-link"><article><div><strong>{order.orderNumber}</strong><span className={`status-pill status-${order.status}`}>{t(order.status)}</span></div><p>{order.items.map((item) => `${item.quantity} × ${item.productName}`).join(", ")}</p><div className="account-order-bottom"><strong>৳{order.totalTaka.toLocaleString("en-BD")}</strong><span>{t("viewOrder")}</span></div></article></Link>)}</section><button className="text-button" onClick={() => logout.mutate()}>{t("logout")}</button></div></main><RabioraFooter /></div>;
}
