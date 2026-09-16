import { Check, Copy, CreditCard, Info, Lock, MapPin, ShieldCheck, ShoppingBag, Tag, Truck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { getGuestCartToken } from "@/lib/guestIdentity";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getDistricts,
  getUpazilasForDistrict,
  getAreasForUpazila,
  isLocationInsideDhaka,
} from "@/data/bangladeshLocations";

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
  
  // Bangladesh Cascading Location State (District -> Upazila -> Area)
  const [selectedDistrict, setSelectedDistrict] = useState("Dhaka");
  const [selectedUpazila, setSelectedUpazila] = useState("Dhaka North (City)");
  const [selectedArea, setSelectedArea] = useState("Gulshan");
  const [streetAddress, setStreetAddress] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash on Delivery");
  const [transactionId, setTransactionId] = useState("");
  const [submittedAmountTaka, setSubmittedAmountTaka] = useState("");
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent: number;
    discountAmount: number;
    payableSubtotal: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const checkout = trpc.order.checkout.useMutation();
  const validateCouponMutation = trpc.coupon.validate.useMutation();

  const allDistricts = useMemo(() => getDistricts(), []);
  const availableUpazilas = useMemo(() => getUpazilasForDistrict(selectedDistrict), [selectedDistrict]);
  const availableAreas = useMemo(() => getAreasForUpazila(selectedDistrict, selectedUpazila), [selectedDistrict, selectedUpazila]);

  useEffect(() => {
    if (availableUpazilas.length > 0 && !availableUpazilas.includes(selectedUpazila)) {
      setSelectedUpazila(availableUpazilas[0]);
    }
  }, [availableUpazilas, selectedUpazila]);

  useEffect(() => {
    if (availableAreas.length > 0) {
      if (!availableAreas.includes(selectedArea)) {
        setSelectedArea(availableAreas[0]);
      }
    } else {
      setSelectedArea("");
    }
  }, [availableAreas, selectedArea]);

  useEffect(() => {
    if (customer.data) {
      if (customer.data.name && !customerName) setCustomerName(customer.data.name);
      if (customer.data.phone && !customerPhone) setCustomerPhone(customer.data.phone);
    }
  }, [customer.data]);

  const manualWallet = paymentMethod !== "Cash on Delivery";

  const isDhaka = useMemo(() => isLocationInsideDhaka(selectedDistrict), [selectedDistrict]);
  const expectedDelivery = useMemo(() => {
    const dhakaCharge = settings.data?.deliveryChargeDhaka ?? 0;
    const outsideDhakaCharge = settings.data?.deliveryChargeOutsideDhaka ?? 120;
    return isDhaka ? dhakaCharge : outsideDhakaCharge;
  }, [isDhaka, settings.data]);

  // Pricing calculations
  const subtotal = useMemo(() => {
    if (isBuyNow && buyNowProduct) {
      return buyNowProduct.priceTaka * Math.max(1, buyNowQty);
    }
    return cart.subtotalTaka;
  }, [isBuyNow, buyNowProduct, buyNowQty, cart.subtotalTaka]);

  // When payment method changes to COD, remove any applied coupon
  const handlePaymentMethodChange = (newMethod: PaymentMethod) => {
    setPaymentMethod(newMethod);
    if (newMethod === "Cash on Delivery") {
      if (appliedCoupon) {
        setAppliedCoupon(null);
        setCouponSuccess("");
        setCouponError("Coupons are only valid for online payment methods (bKash, Nagad, Rocket).");
      }
    } else {
      setCouponError("");
    }
  };

  const discountAmount = useMemo(() => {
    if (!appliedCoupon || paymentMethod === "Cash on Delivery") return 0;
    // Re-verify against current subtotal
    return Math.min(subtotal, Math.round((subtotal * appliedCoupon.discountPercent) / 100));
  }, [appliedCoupon, paymentMethod, subtotal]);

  const payableSubtotal = Math.max(0, subtotal - discountAmount);
  const grandTotal = payableSubtotal + expectedDelivery;

  const handleApplyCoupon = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setCouponError("");
    setCouponSuccess("");

    if (paymentMethod === "Cash on Delivery") {
      setCouponError("Coupons work only with online payment methods (bKash, Nagad, Rocket). Please select an online payment method.");
      return;
    }

    const code = couponInput.trim();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    try {
      const result = await validateCouponMutation.mutateAsync({
        code,
        subtotalTaka: subtotal,
        paymentMethod,
      });

      setAppliedCoupon({
        code: result.code,
        discountPercent: result.discountPercent,
        discountAmount: result.discountAmount,
        payableSubtotal: result.payableSubtotal,
      });
      setCouponSuccess(`${result.code} applied! ${result.discountPercent}% discount (৳${result.discountAmount.toLocaleString("en-BD")})`);
      setCouponError("");
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponSuccess("");
      setCouponError(err.message || "Invalid coupon code.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponSuccess("");
    setCouponError("");
  };

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
        districtArea: selectedDistrict,
        upazila: selectedUpazila,
        thana: selectedArea || undefined,
        area: selectedArea || undefined,
        fullAddress: streetAddress,
        paymentMethod,
        transactionId: manualWallet ? transactionId : undefined,
        submittedAmountTaka: manualWallet ? Number(submittedAmountTaka) : undefined,
        couponCode: appliedCoupon && paymentMethod !== "Cash on Delivery" ? appliedCoupon.code : undefined,
        buyNowItem: isBuyNow && buyNowProduct ? { productId: buyNowProduct.id, quantity: Math.max(1, buyNowQty) } : undefined,
      });

      await utils.cart.get.invalidate({ anonymousToken: getGuestCartToken() });

      if (order.clickToWhatsAppUrl) {
        sessionStorage.setItem(`rabiora_order_whatsapp_${order.orderNumber}`, order.clickToWhatsAppUrl);
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
        <div className="container">
          <form className="checkout-layout" onSubmit={submit}>
            <div className="checkout-form">
              <div className="section-title align-left">
                <span>{t("secureCheckout")}</span>
                <h1>{isBuyNow ? "Direct Buy Now Checkout" : t("completeOrder")}</h1>
              </div>

              {/* 1. Delivery Details Section */}
              <section className="checkout-section-block">
                <div className="checkout-section-title-row">
                  <MapPin size={20} className="text-accent" />
                  <h2>{t("deliveryDetails")}</h2>
                </div>
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

                  {/* Cascading Bangladesh Location Selection: District -> Upazila -> Area */}
                  <div className="location-selector-grid">
                    <label>
                      District / Zilla
                      <select
                        required
                        value={selectedDistrict}
                        onChange={(e) => {
                          setSelectedDistrict(e.target.value);
                        }}
                        className="location-select"
                      >
                        {allDistricts.map((d) => (
                          <option key={d} value={d}>
                            {d} {d === "Dhaka" ? "(Dhaka City)" : ""}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Upazila / Zone
                      <select
                        required
                        value={selectedUpazila}
                        onChange={(e) => {
                          setSelectedUpazila(e.target.value);
                        }}
                        className="location-select"
                      >
                        {availableUpazilas.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </label>

                    {availableAreas.length > 0 && (
                      <label>
                        Area / এলাকা
                        <select
                          required
                          value={selectedArea}
                          onChange={(e) => setSelectedArea(e.target.value)}
                          className="location-select"
                        >
                          {availableAreas.map((aItem) => (
                            <option key={aItem} value={aItem}>
                              {aItem}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>

                  <label>
                    Street Address & House Details
                    <textarea
                      required
                      minLength={8}
                      placeholder="House number, road number, flat/apartment, landmark or specific area notes"
                      value={streetAddress}
                      onChange={(event) => setStreetAddress(event.target.value)}
                    />
                  </label>
                </div>
              </section>

              {/* 2. Payment Method Section */}
              <section className="checkout-section-block">
                <div className="checkout-section-title-row">
                  <CreditCard size={20} className="text-accent" />
                  <h2>{t("paymentMethod")}</h2>
                </div>
                <div className="payment-method-luxury-grid">
                  {methods.map((method) => {
                    const isSelected = paymentMethod === method;
                    let badgeText = "Manual Pay";
                    let badgeClass = "badge-online";
                    let methodDesc = "Send Money & enter TrxID";

                    if (method === "bKash") {
                      badgeText = "Fastest Verification";
                      badgeClass = "badge-bkash";
                      methodDesc = "Pay via bKash personal send money";
                    } else if (method === "Nagad") {
                      badgeText = "Nagad Wallet";
                      badgeClass = "badge-nagad";
                      methodDesc = "Pay via Nagad personal send money";
                    } else if (method === "Rocket") {
                      badgeText = "DBBL Rocket";
                      badgeClass = "badge-rocket";
                      methodDesc = "Pay via Rocket personal send money";
                    } else if (method === "Cash on Delivery") {
                      badgeText = "Cash on Delivery";
                      badgeClass = "badge-cod";
                      methodDesc = "Pay cash when receiving parcel at doorstep";
                    }

                    return (
                      <label
                        className={`payment-luxury-card ${isSelected ? "selected" : ""} ${method.toLowerCase().replace(/\s+/g, "-")}`}
                        key={method}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={isSelected}
                          onChange={() => handlePaymentMethodChange(method)}
                          className="sr-only"
                        />
                        <div className="payment-luxury-card-inner">
                          <div className="payment-luxury-header">
                            <div className="payment-title-group">
                              <strong className="payment-method-heading">{method}</strong>
                              <span className={`payment-method-subbadge ${badgeClass}`}>{badgeText}</span>
                            </div>
                            <div className={`radio-dot ${isSelected ? "checked" : ""}`} />
                          </div>
                          <p className="payment-method-desc">{methodDesc}</p>
                        </div>
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
                      1. Send the final payable amount (<strong>{taka(grandTotal)}</strong>) to the {paymentMethod} number above using <strong>Send Money</strong>. <br />
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
            </div>

            {/* 3. Checkout Order Summary & Final Actions Aside */}
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

              {/* 4. Coupon / Discount Code Section */}
              <div className="checkout-coupon-card">
                <div className="coupon-header">
                  <Tag size={15} className="coupon-icon" />
                  <strong>Discount Coupon</strong>
                </div>

                {paymentMethod === "Cash on Delivery" ? (
                  <div className="coupon-notice-cod">
                    <small>💡 Coupons are valid exclusively for online payment methods (bKash, Nagad, Rocket).</small>
                  </div>
                ) : appliedCoupon ? (
                  <div className="coupon-applied-box">
                    <div className="coupon-applied-info">
                      <span className="coupon-badge">🏷️ {appliedCoupon.code}</span>
                      <span className="coupon-save-text">-{appliedCoupon.discountPercent}% OFF ({taka(discountAmount)})</span>
                    </div>
                    <button
                      type="button"
                      className="coupon-remove-btn"
                      onClick={handleRemoveCoupon}
                      title="Remove coupon"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="coupon-input-group">
                    <input
                      type="text"
                      placeholder="e.g. RABIORA10"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      className="coupon-input"
                    />
                    <button
                      type="button"
                      className="btn coupon-apply-btn"
                      onClick={() => handleApplyCoupon()}
                      disabled={validateCouponMutation.isPending || !couponInput.trim()}
                    >
                      {validateCouponMutation.isPending ? "Applying..." : "Apply"}
                    </button>
                  </div>
                )}

                {couponError && <p className="coupon-msg error">{couponError}</p>}
                {couponSuccess && <p className="coupon-msg success">{couponSuccess}</p>}
              </div>

              {/* 5. Final Pricing Calculation */}
              <div className="checkout-calc-block">
                <div className="checkout-line">
                  <span>{t("subtotal")}</span>
                  <strong>{taka(subtotal)}</strong>
                </div>

                {discountAmount > 0 && appliedCoupon && paymentMethod !== "Cash on Delivery" && (
                  <div className="checkout-line coupon-discount-line">
                    <span style={{ color: "var(--primary-bright, #20C4BA)", fontWeight: 600 }}>
                      Discount ({appliedCoupon.code})
                    </span>
                    <strong style={{ color: "#22c55e" }}>-{taka(discountAmount)}</strong>
                  </div>
                )}

                <div className="checkout-line">
                  <span>
                    <Truck size={14} className="inline-icon" /> {t("delivery")}
                  </span>
                  <strong>
                    {expectedDelivery === 0 ? "Free (Dhaka City)" : taka(expectedDelivery)}
                  </strong>
                </div>

                <div className="checkout-grand">
                  <span>Payable Amount</span>
                  <strong>{taka(grandTotal)}</strong>
                </div>
              </div>

              {error && (
                <p className="form-error" role="alert">{error}</p>
              )}

              {/* 6. Confirm Order Submit Button */}
              <button type="submit" className="btn checkout-submit-btn" disabled={checkout.isPending}>
                {checkout.isPending ? t("placingOrder") : `${t("confirmOrder")} • ${taka(grandTotal)}`}
              </button>

              <p className="order-guarantee-note">
                <ShieldCheck size={14} className="inline-icon" style={{ verticalAlign: "middle", display: "inline" }} /> 100% Authentic Pakistani Three-Piece Guaranteed • 48-Hour Hassle-Free Exchange
              </p>
            </aside>
          </form>
        </div>
      </main>

      <RabioraFooter />
    </div>
  );
}
