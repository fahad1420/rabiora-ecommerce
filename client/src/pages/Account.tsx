import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CheckCircle2,
  Clock,
  Heart,
  LogOut,
  Package,
  ShoppingBag,
  ShoppingCart,
  User,
} from "lucide-react";

const taka = (value: number) => `৳${value.toLocaleString("en-BD")}`;

export default function Account() {
  const [, navigate] = useLocation();
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const customer = trpc.customer.me.useQuery();
  const utils = trpc.useUtils();

  const logout = trpc.customer.logout.useMutation({
    onSuccess: () => {
      utils.customer.me.invalidate();
      navigate("/login");
    },
  });

  const updateProfile = trpc.customer.updateProfile.useMutation({
    onSuccess: () => {
      utils.customer.me.invalidate();
      setSaveStatus("Profile & Email saved successfully!");
      setTimeout(() => setSaveStatus(""), 4000);
    },
  });

  const orders = trpc.order.mine.useQuery(undefined, {
    enabled: Boolean(customer.data),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [saveError, setSaveError] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    if (customer.data) {
      setName(customer.data.name ?? "");
      setEmail(customer.data.email ?? "");
    }
  }, [customer.data?.name, customer.data?.email]);

  if (customer.isLoading) {
    return (
      <div className="page-shell">
        <RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />
        <main className="catalogue-state">Loading your account details...</main>
        <RabioraFooter />
      </div>
    );
  }

  if (!customer.data) {
    navigate("/login");
    return null;
  }

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaveError("");
    try {
      await updateProfile.mutateAsync({ name, email });
    } catch (err: any) {
      setSaveError(err.message || "Failed to update profile.");
    }
  };

  const pendingOrders = (orders.data || []).filter(
    (o) => o.status === "pending" || o.status === "confirmed" || o.status === "shipped"
  );
  const deliveredOrders = (orders.data || []).filter((o) => o.status === "delivered");

  return (
    <div className="page-shell">
      <RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />

      <main className="account-page">
        <div className="container account-dashboard-layout">
          {/* Left Column: Profile Card */}
          <aside className="account-sidebar">
            <div className="account-profile-card">
              <div className="profile-avatar">
                <User size={34} />
              </div>
              <h2>{customer.data.name || "Valued Customer"}</h2>
              <p className="profile-phone">📱 {customer.data.phone || "No phone number"}</p>
              {customer.data.email && (
                <p className="profile-email">✉️ {customer.data.email}</p>
              )}

              <div className="profile-quick-stats">
                <div className="stat-box">
                  <Package size={18} />
                  <strong>{orders.data?.length ?? 0}</strong>
                  <span>Orders</span>
                </div>
                <div className="stat-box">
                  <Heart size={18} />
                  <strong>{wishlist.count}</strong>
                  <span>Wishlist</span>
                </div>
                <div className="stat-box">
                  <ShoppingCart size={18} />
                  <strong>{cart.count}</strong>
                  <span>Cart</span>
                </div>
              </div>

              {/* Profile Editing Form */}
              <form className="profile-form" onSubmit={saveProfile}>
                <h3>Account Information</h3>
                <label>
                  {t("name")}
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your Full Name"
                  />
                </label>

                <label>
                  Email Address (Saved to Account)
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                  />
                </label>

                {saveStatus && (
                  <p className="form-success" role="status">{saveStatus}</p>
                )}
                {saveError && (
                  <p className="form-error" role="alert">{saveError}</p>
                )}

                <button className="btn save-profile-btn" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? t("saving") : "Save Changes"}
                </button>
              </form>

              <button
                type="button"
                className="account-logout-btn"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <LogOut size={16} />
                <span>{t("logout")}</span>
              </button>
            </div>
          </aside>

          {/* Right Column: Shopping Dashboard Activities */}
          <div className="account-main-content">
            {/* 1. Active Cart Summary */}
            {cart.items.length > 0 && (
              <section className="account-section-card cart-active-card">
                <div className="section-card-header">
                  <div>
                    <span className="badge">Current Cart</span>
                    <h2>Shopping Bag ({cart.count} items)</h2>
                  </div>
                  <Link href="/checkout" className="btn-sm">
                    Proceed to Checkout →
                  </Link>
                </div>

                <div className="account-cart-items-preview">
                  {cart.items.map((item) => (
                    <div className="account-cart-row" key={item.productId}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="account-item-thumb" />
                      ) : (
                        <div className="account-item-thumb fallback"><ShoppingBag size={18} /></div>
                      )}
                      <div className="item-details">
                        <strong>{item.name}</strong>
                        <span>Qty: {item.quantity} × {taka(item.priceTaka)}</span>
                      </div>
                      <strong className="item-price">{taka(item.lineTotalTaka)}</strong>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 2. Pending Orders */}
            <section className="account-section-card">
              <div className="section-card-header">
                <div>
                  <span className="badge">Active Deliveries</span>
                  <h2>Pending Orders ({pendingOrders.length})</h2>
                </div>
              </div>

              {orders.isLoading ? (
                <p className="muted">{t("loadingOrderHistory")}</p>
              ) : pendingOrders.length === 0 ? (
                <div className="account-empty-state">
                  <Clock size={32} />
                  <p>You have no active pending orders at this moment.</p>
                </div>
              ) : (
                <div className="account-orders-list">
                  {pendingOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.orderNumber}`}
                      className="account-order-card-link"
                    >
                      <article className="account-order-card">
                        <div className="order-topline">
                          <div>
                            <strong>{order.orderNumber}</strong>
                            <small>
                              {new Date(order.createdAt).toLocaleDateString("en-BD", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </small>
                          </div>
                          <span className={`status-pill status-${order.status}`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="order-items-thumbnails">
                          {order.items.map((item, idx) => (
                            <div className="order-thumb-item" key={item.id || idx}>
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.productName} />
                              ) : (
                                <div className="thumb-fallback"><ShoppingBag size={14} /></div>
                              )}
                              <span>{item.quantity} × {item.productName}</span>
                            </div>
                          ))}
                        </div>

                        <div className="account-order-bottom">
                          <div className="order-payment-info">
                            <span>{order.paymentMethod}</span>
                            <strong>{taka(order.totalTaka)}</strong>
                          </div>
                          <span className="view-order-cta">View Details →</span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* 3. Past Order History */}
            <section className="account-section-card">
              <div className="section-card-header">
                <div>
                  <span className="badge">Delivered</span>
                  <h2>Completed Orders ({deliveredOrders.length})</h2>
                </div>
              </div>

              {deliveredOrders.length === 0 ? (
                <p className="muted">No past delivered orders found.</p>
              ) : (
                <div className="account-orders-list">
                  {deliveredOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.orderNumber}`}
                      className="account-order-card-link"
                    >
                      <article className="account-order-card">
                        <div className="order-topline">
                          <div>
                            <strong>{order.orderNumber}</strong>
                            <small>
                              {new Date(order.createdAt).toLocaleDateString("en-BD", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </small>
                          </div>
                          <span className="status-pill status-delivered">
                            ✓ Delivered
                          </span>
                        </div>

                        <div className="account-order-bottom">
                          <div className="order-payment-info">
                            <span>{order.paymentMethod}</span>
                            <strong>{taka(order.totalTaka)}</strong>
                          </div>
                          <span className="view-order-cta">View Invoice →</span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <RabioraFooter />
    </div>
  );
}
