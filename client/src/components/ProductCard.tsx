import { Heart, ShoppingBag, ShoppingCart, Zap } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export type CatalogueProductCard = {
  id: number | string;
  name: string;
  slug: string;
  priceTaka: number;
  oldPriceTaka?: number | null;
  discountPercent: number;
  categoryName: string;
  details?: string;
  fabric?: string;
  isInStock: boolean;
  images: { storageUrl: string; altText: string; isCover: boolean }[];
};

const taka = (amount: number) => `৳${amount.toLocaleString("en-BD")}`;

export function ProductCard({
  product,
  onAddCart,
  onBuyNow,
  onToggleWishlist,
  wishlisted = false,
}: {
  product: CatalogueProductCard;
  onAddCart: (productId: any) => void;
  onBuyNow?: (productId: any) => void;
  onToggleWishlist?: (productId: any) => void;
  wishlisted?: boolean;
}) {
  const coverImage = product.images.find((image) => image.isCover) ?? product.images[0];
  const { t } = useLanguage();

  return (
    <article className="product-card">
      <div className="product-image">
        {product.discountPercent > 0 && (
          <span className="discount">-{product.discountPercent}%</span>
        )}
        <button
          className={wishlisted ? "image-wishlist active" : "image-wishlist"}
          type="button"
          aria-label={`${wishlisted ? t("removeWishlist") : t("addWishlist")}: ${product.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist?.(product.id);
          }}
        >
          <Heart size={15} fill={wishlisted ? "currentColor" : "none"} />
        </button>

        <Link href={`/products/${product.slug}`} className="product-image-link" tabIndex={-1}>
          {coverImage ? (
            <img
              src={coverImage.storageUrl}
              alt={coverImage.altText || product.name}
              loading="lazy"
            />
          ) : (
            <div className="image-fallback">{t("imageUnavailable")}</div>
          )}
        </Link>
      </div>

      <div className="product-info">
        <p className="category">{product.categoryName || "Three Piece"}</p>
        <h3 title={product.name}>
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        <div className="price">
          <span className="new-price">{taka(product.priceTaka)}</span>
          {product.oldPriceTaka ? (
            <span className="old-price">{taka(product.oldPriceTaka)}</span>
          ) : null}
        </div>

        {!product.isInStock ? (
          <p className="stock-note">{t("outOfStock")}</p>
        ) : (
          <div className="product-action-split">
            <button
              className="action-btn add-cart-btn"
              type="button"
              disabled={!product.isInStock}
              onClick={() => onAddCart(product.id)}
              title={t("addToCart")}
            >
              <ShoppingCart size={14} aria-hidden="true" />
              <span>{t("addToCart")}</span>
            </button>

            <button
              className="action-btn buy-now-btn"
              type="button"
              disabled={!product.isInStock}
              onClick={() => onBuyNow?.(product.id)}
              title="Buy Now"
            >
              <Zap size={14} aria-hidden="true" />
              <span>Buy Now</span>
            </button>
          </div>
        )}

        <div className="product-footer-link">
          <Link href={`/products/${product.slug}`} className="details-link">
            {t("viewDetails")} →
          </Link>
        </div>
      </div>
    </article>
  );
}
