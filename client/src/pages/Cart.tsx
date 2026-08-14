import { Minus, Plus, Trash2 } from "lucide-react";
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
  return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />
    <main className="cart-page"><div className="container"><div className="section-title"><span>{t("yourCart")}</span><h2>{t("cartTitle")}</h2></div>
      {cart.isLoading ? <div className="catalogue-state">{t("loadingCart")}</div> : cart.items.length === 0 ? <div className="empty-cart"><h2>{t("emptyCart")}</h2><p>{t("cartEmptyCopy")}</p><Link href="/" className="btn">{t("continueShopping")}</Link></div> : <>
        <div className="cart-items">{cart.items.map((item) => <article className="cart-item" key={item.productId}>{item.imageUrl && <img src={item.imageUrl} alt={item.name} />}<div className="cart-info"><h3>{item.name}</h3><p>{taka(item.priceTaka)}</p><div className="qty-box"><button aria-label={t("decreaseQuantity")} disabled={cart.isMutating} onClick={() => cart.update(item.productId, item.quantity - 1)}><Minus size={15} aria-hidden="true" /></button><span aria-label={`${item.quantity}`}>{item.quantity}</span><button aria-label={t("increaseQuantity")} disabled={cart.isMutating || item.quantity >= item.stockQuantity} onClick={() => cart.update(item.productId, item.quantity + 1)}><Plus size={15} aria-hidden="true" /></button></div><h4>{taka(item.lineTotalTaka)}</h4><button className="remove-btn" disabled={cart.isMutating} onClick={() => cart.update(item.productId, 0)}><Trash2 size={15} aria-hidden="true" /> {t("remove")}</button></div></article>)}</div>
        <div className="cart-summary"><h3>{t("subtotal")}: <span>{taka(cart.subtotalTaka)}</span></h3><p>{t("deliveryAtCheckout")}</p><Link href="/checkout" className="btn">{t("placeOrder")}</Link></div>
      </>}
    </div></main><RabioraFooter /></div>;
}
