import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { useLanguage } from "@/contexts/LanguageContext";

const taka = (amount: number) => `৳${amount.toLocaleString("en-BD")}`;

export default function Cart() {
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const { t } = useLanguage();

  return (
    <div className="page-shell">
      <RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />

      <main className="cart-page">
        <div className="container">
          <div className="section-title">
            <span>{t("yourCart")}</span>
            <h2>{t("cartTitle")}</h2>
          </div>

          {cart.isLoading ? (
            <div className="catalogue-state">{t("loadingCart")}</div>
          ) : cart.items.length === 0 ? (
            <div className="empty-cart">
              <ShoppingBag size={48} className="empty-icon text-muted" />
              <h2>{t("emptyCart")}</h2>
              <p>{t("cartEmptyCopy")}</p>
              <Link href="/#products" className="btn">
                {t("continueShopping")}
              </Link>
            </div>
          ) : (
            <div className="cart-layout-grid">
              <div className="cart-items">
                {cart.items.map((item) => (
                  <article className="cart-item" key={item.productId}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} />
                    ) : (
                      <div className="cart-item-placeholder">No Image</div>
                    )}
                    <div className="cart-info">
                      <div className="cart-title-row">
                        <h3>{item.name}</h3>
                        <button
                          className="remove-btn"
                          disabled={cart.isMutating}
                          onClick={() => cart.update(item.productId, 0)}
                          title={t("remove")}
                          aria-label={t("remove")}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>

                      <p className="cart-item-unit-price">{taka(item.priceTaka)} per item</p>

                      <div className="cart-item-bottom-row">
                        <div className="qty-box">
                          <button
                            aria-label={t("decreaseQuantity")}
                            disabled={cart.isMutating}
                            onClick={() => cart.update(item.productId, item.quantity - 1)}
                          >
                            <Minus size={14} aria-hidden="true" />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            aria-label={t("increaseQuantity")}
                            disabled={cart.isMutating || item.quantity >= item.stockQuantity}
                            onClick={() => cart.update(item.productId, item.quantity + 1)}
                          >
                            <Plus size={14} aria-hidden="true" />
                          </button>
                        </div>

                        <strong className="cart-item-total">{taka(item.lineTotalTaka)}</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="cart-summary">
                <h3>Order Summary</h3>
                <div className="cart-summary-line">
                  <span>{t("subtotal")}</span>
                  <strong>{taka(cart.subtotalTaka)}</strong>
                </div>
                <p className="delivery-note">{t("deliveryAtCheckout")}</p>

                <Link href="/checkout" className="btn checkout-proceed-btn">
                  <span>{t("placeOrder")}</span>
                  <ArrowRight size={16} />
                </Link>
              </aside>
            </div>
          )}
        </div>
      </main>

      <RabioraFooter />
    </div>
  );
}
