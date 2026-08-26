import { Check, Copy, Info, Lock, ShoppingBag, Truck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
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
  const [location, navigate] = useLocation();
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const customer = trpc.customer.me.useQuery();
  const settings = trpc.settings.get.useQuery();

  // URL search params for Buy Now flow
  const searchParams = new URLSearchParams(window.location.search);
  const buyNowProductId = searchParams.get("buyNowProductId");
  const buyNowQty = Number(searchParams.get("qty") || "1");

  // Buy now product lookup if applicable
  const catalogue = trpc.catalogue.list.useQuery();
  const buyNowProduct = useMemo(() => {
    if (!buyNowProductId || !catalogue.data) return null;
    return catalogue.data.find(
      (p) => String(p.id) === String(buyNowProductId) || String(p.slug) === String(buyNowProductId)
    );
  }, [buyNowProductId, catalogue.data]);

  const isBuyNow = Boolean(buyNowProductId && buyNowProduct);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [districtArea, setDistrictArea] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash on Delivery");
  const [transactionId, setTransactionId] = useState("");
  const [submittedAmountTaka, setSubmittedAmountTaka] = useState("");
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const checkout = trpc.order.checkout.useMutation();

  useEffect(() => {
    if (customer.data) {
      if (customer.data.name && !customerName) setCustomerName(customer.data.name);
      if (customer.data.phone && !customerPhone) setCustomerPhone(customer.data.phone);
    }
  }, [customer.data]);

  const manualWallet = paymentMethod !== "Cash on Delivery";
  const expectedDelivery = useMemo(() => (/dhaka/i.test(districtArea) ? 0 : 120), [districtArea]);

  // Pricing calculations
  const subtotal = useMemo(() => {
    if (isBuyNow && buyNowProduct) {
      return buyNowProduct.priceTaka * Math.max(1, buyNowQty);
    }
    return cart.subtotalTaka;
  }, [isBuyNow, buyNowProduct, buyNowQty, cart.subtotalTaka]);

  const grandTotal = subtotal + expectedDelivery;

  // Dynamic payment numbers
  const paymentNumbers: Record<string, string> = {
    bKash: settings.data?.bkashNumber || "+8801349529274",
    Nagad: settings.data?.nagadNumber || "+8801349529274",
    Rocket: settings.data?.rocketNumber || "+8801349529274",
  };

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num.replace(/\s+/g, ""));
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!customer.data) {
      navigate(`/login?redirect=${encodeURIComponent(location)}`);
      return;
    }

    try {
      const order = await checkout.mutateAsync({
        anonymousToken: getGuestCartToken(),
        customerName,
        customerPhone,
        districtArea,
        fullAddress,
        paymentMethod,
        transactionId: manualWallet ? transactionId : undefined,
        submittedAmountTaka: manualWallet ? Number(submittedAmountTaka) : undefined,
        buyNowItem: isBuyNow && buyNowProduct ? { productId: buyNowProduct.id, quantity: Math.max(1, buyNowQty) } : undefined,
      });

      await utils.cart.get.invalidate({ anonymousToken: getGuestCartToken() });

      if (order.clickToWhatsAppUrl) {
        sessionStorage.setItem(`rabiora_order_whatsapp_${order.orderNumber}`, order.clickToWhatsAppUrl);
        window.open(order.clickToWhatsAppUrl, "_blank", "noopener,noreferrer");
      }

      navigate(`/order-confirmation/${order.orderNumber}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("checkoutError"));
    }
  };

  // If customer is not authenticated
  if (customer.isLoading) {
    return (
      <div className="page-shell">
        <RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />
        <main className="catalogue-state">{t("loadingCheckout")}</main>
        <RabioraFooter />
      </div>
    );
  }

  if (!customer.data) {
    return (
      <div className="page-shell">
        <RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />
        <main className="auth-required-checkout">
          <div className="container">
            <div className="auth-required-card">
              <div className="auth-icon-badge">
                <Lock size={30} />
              </div>
              <span className="badge">Authentication Required</span>
              <h1>Sign In to Complete Your Order</h1>
              <p>
                To track your orders, ensure delivery verification, and maintain your invoice history, please sign in or register your Rabiora account.
              </p>
              <div className="auth-required-actions">
                <Link href={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`} className="btn">
                  Sign In / Register
                </Link>
                <Link href="/" className="btn-outline">
                  Return to Storefront
                </Link>
              </div>
            </div>
          </div>
        </main>
        <RabioraFooter />
      </div>
    );
  }

  // If cart is empty and not buy-now
  if (!isBuyNow && cart.items.length === 0 && !cart.isLoading) {
    return (
      <div className="page-shell">
        <RabioraHeader cartCount={0} wishlistCount={wishlist.count} />
        <main className="empty-checkout">
          <ShoppingBag size={48} className="empty-icon" />
          <h1>{t("emptyCheckout")}</h1>
          <p>{t("emptyCheckoutCopy")}</p>
          <Link href="/#products" className="btn">
            Explore Collection
          </Link>
        </main>
        <RabioraFooter />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />

      <main className="checkout-page">
        <div className="container checkout-layout">
          <form className="checkout-form" onSubmit={submit}>
            <div className="section-title align-left">
              <span>{t("secureCheckout")}</span>
              <h1>{isBuyNow ? "Direct Buy Now Checkout" : t("completeOrder")}</h1>
            </div>

            {/* Delivery Section */}
            <section className="checkout-section-block">
              <h2>{t("deliveryDetails")}</h2>
              <div className="form-fields">
                <label>
                  {t("fullName")}
                  <input
                    required
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Enter recipient full name"
                  />
                </label>

                <label>
                  {t("phoneNumber")}
                  <input
                    required
                    inputMode="tel"
                    placeholder="01XXXXXXXXX"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                  />
                </label>

                <label>
                  {t("districtArea")}
                  <input
                    required
                    placeholder="e.g., Tongi, Gazipur / Dhanmondi, Dhaka"
                    value={districtArea}
                    onChange={(event) => setDistrictArea(event.target.value)}
                  />
                </label>

                <label>
                  {t("fullAddress")}
                  <textarea
                    required
                    minLength={8}
                    placeholder="House number, road number, landmark, area details"
                    value={fullAddress}
                    onChange={(event) => setFullAddress(event.target.value)}
                  />
                </label>
              </div>
            </section>

            {/* Payment Method Section */}
            <section className="checkout-section-block">
              <h2>{t("paymentMethod")}</h2>
              <div className="payment-method-selector-grid">
                {methods.map((method) => {
                  const isSelected = paymentMethod === method;
                  return (
                    <label
                      className={`payment-method-tile ${isSelected ? "active" : ""}`}
                      key={method}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={isSelected}
                        onChange={() => setPaymentMethod(method)}
                      />
                      <span className="payment-method-name">{method}</span>
                    </label>
                  );
                })}
              </div>

              {manualWallet && (
                <div className="manual-wallet-card">
                  <div className="manual-wallet-header">
                    <Info size={18} />
                    <strong>How to pay via {paymentMethod}:</strong>
                  </div>

                  <div className="manual-wallet-number-row">
                    <span className="wallet-label">Send Money to:</span>
                    <strong className="wallet-number">{paymentNumbers[paymentMethod] || "+8801349529274"}</strong>
                    <button
                      type="button"
                      className="copy-number-btn"
                      onClick={() => handleCopyNumber(paymentNumbers[paymentMethod] || "+8801349529274")}
                      title="Copy phone number"
                    >
                      {copiedNumber === (paymentNumbers[paymentMethod] || "+8801349529274") ? (
                        <>
                          <Check size={14} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy
                        </>
                      )}
                    </button>
                  </div>

                  <p className="wallet-guide">
                    1. Send the order amount (<strong>{taka(grandTotal)}</strong>) to the {paymentMethod} number above. <br />
                    2. Enter your Transaction ID (TrxID) and Submitted Amount below for instant verification.
                  </p>

                  <div className="manual-wallet-inputs">
                    <label>
                      {t("transactionId")} (TrxID)
                      <input
                        required
                        placeholder="e.g., 9XF839KA72"
                        value={transactionId}
                        onChange={(event) => setTransactionId(event.target.value)}
                      />
                    </label>

                    <label>
                      {t("submittedAmount")} (৳ BDT)
                      <input
                        required
                        type="number"
                        min="1"
                        step="1"
                        placeholder={String(grandTotal)}
                        value={submittedAmountTaka}
                        onChange={(event) => setSubmittedAmountTaka(event.target.value)}
                      />
                    </label>
                  </div>
                </div>
              )}
            </section>

            {error && (
              <p className="form-error" role="alert">{error}</p>
            )}

            <button className="btn checkout-submit-btn" disabled={checkout.isPending}>
              {checkout.isPending ? t("placingOrder") : `${t("confirmOrder")} • ${taka(grandTotal)}`}
            </button>
          </form>

          {/* Checkout Order Summary Aside */}
          <aside className="checkout-summary">
            <h2>{t("orderSummary")}</h2>

            <div className="checkout-summary-items">
              {isBuyNow && buyNowProduct ? (
                <div className="checkout-item-row">
                  <div className="item-meta">
                    <strong>{buyNowProduct.name}</strong>
                    <span>Quantity: {Math.max(1, buyNowQty)}</span>
                  </div>
                  <strong>{taka(buyNowProduct.priceTaka * Math.max(1, buyNowQty))}</strong>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div className="checkout-item-row" key={item.productId}>
                    <div className="item-meta">
                      <strong>{item.name}</strong>
                      <span>{item.quantity} × {taka(item.priceTaka)}</span>
                    </div>
                    <strong>{taka(item.lineTotalTaka)}</strong>
                  </div>
                ))
              )}
            </div>

            <div className="checkout-calc-block">
              <div className="checkout-line">
                <span>{t("subtotal")}</span>
                <strong>{taka(subtotal)}</strong>
              </div>

              <div className="checkout-line">
                <span>
                  <Truck size={14} className="inline-icon" /> {t("delivery")}
                </span>
                <strong>
                  {expectedDelivery === 0 ? "Free (Dhaka City)" : taka(expectedDelivery)}
                </strong>
              </div>

              <div className="checkout-grand">
                <span>{t("estimatedTotal")}</span>
                <strong>{taka(grandTotal)}</strong>
              </div>
            </div>

            <p className="order-guarantee-note">
              🔒 100% Authentic Pakistani Three-Piece Guaranteed • 48-Hour Hassle-Free Exchange
            </p>
          </aside>
        </div>
      </main>

      <RabioraFooter />
    </div>
  );
}
