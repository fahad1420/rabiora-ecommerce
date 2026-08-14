import { Heart, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export type CatalogueProductCard = {
  id: number;
  name: string;
  slug: string;
  priceTaka: number;
  oldPriceTaka: number | null;
  discountPercent: number;
  categoryName: string;
  isInStock: boolean;
  images: { storageUrl: string; altText: string; isCover: boolean }[];
};

const taka = (amount: number) => `৳${amount.toLocaleString("en-BD")}`;

export function ProductCard({ product, onAddCart, onToggleWishlist, wishlisted = false }: { product: CatalogueProductCard; onAddCart: (productId: number) => void; onToggleWishlist?: (productId: number) => void; wishlisted?: boolean }) {
  const coverImage = product.images.find((image) => image.isCover) ?? product.images[0];
  const { t } = useLanguage();
  return <article className="product-card">
    <div className="product-image">
      {product.discountPercent > 0 && <span className="discount">-{product.discountPercent}%</span>}
      <button className={wishlisted ? "image-wishlist active" : "image-wishlist"} type="button" aria-label={`${wishlisted ? t("removeWishlist") : t("addWishlist")}: ${product.name}`} onClick={() => onToggleWishlist?.(product.id)}><Heart size={16} fill={wishlisted ? "currentColor" : "none"} /></button>
      {coverImage ? <img src={coverImage.storageUrl} alt={coverImage.altText} /> : <div className="image-fallback">{t("imageUnavailable")}</div>}
    </div>
    <div className="product-info">
      <h3>{product.name}</h3>
      <p className="category">{product.categoryName}</p>
      <div className="price"><span className="new-price">{taka(product.priceTaka)}</span>{product.oldPriceTaka && <span className="old-price">{taka(product.oldPriceTaka)}</span>}</div>
      {!product.isInStock && <p className="stock-note">{t("outOfStock")}</p>}
      <div className="product-buttons">
        <button className="cart-btn" type="button" disabled={!product.isInStock} onClick={() => onAddCart(product.id)}><ShoppingCart size={17} aria-hidden="true" /> {t("addToCart")}</button>
        <Link href={`/products/${product.slug}`} className="details-btn">{t("viewDetails")} <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  </article>;
}
