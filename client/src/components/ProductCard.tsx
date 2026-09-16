import { memo } from "react";
import { Heart, ShoppingBag, ShoppingCart, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

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

export const ProductCard = memo(function ProductCard({
  product,
  onAddCart,
  onBuyNow,
  onToggleWishlist,
  wishlisted = false,
}: {
  product: CatalogueProductCard;
  onAddCart?: (productId: any) => void;
  onBuyNow?: (productId: any) => void;
  onToggleWishlist?: (productId: any) => void;
  wishlisted?: boolean;
}) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const coverImage = product.images.find((image) => image.isCover) ?? product.images[0];
  const { t } = useLanguage();
  const productUrl = `/products/${product.slug || product.id}`;

  const prefetchProduct = () => {
    const slug = product.slug || String(product.id);
    if (slug) {
      utils.catalogue.bySlug.prefetch({ slug });
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".image-wishlist")) {
      return;
    }
    navigate(productUrl);
  };

  return (
    <article
      className="product-card"
      onClick={handleCardClick}
      onMouseEnter={prefetchProduct}
      onTouchStart={prefetchProduct}
      style={{ cursor: "pointer" }}
    >
      <div className="product-image">
        {product.discountPercent > 0 && (
          <span className="discount">-{product.discountPercent}%</span>
        )}
        <button
          className={`image-wishlist ${wishlisted ? "active" : ""}`}
          type="button"
          aria-label={`${wishlisted ? t("removeWishlist") : t("addWishlist")}: ${product.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist?.(product.id);
          }}
          title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} fill={wishlisted ? "currentColor" : "none"} strokeWidth={1.8} />
        </button>

        <Link href={productUrl} className="product-image-link" tabIndex={-1}>
          {coverImage ? (
            <img
              src={coverImage.storageUrl}
              alt={coverImage.altText || product.name}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="image-fallback">{t("imageUnavailable")}</div>
          )}
        </Link>
      </div>

      <div className="product-info">
        <p className="category">{product.categoryName || "Pakistani Three Piece"}</p>
        <h3 title={product.name}>
          <Link href={productUrl}>{product.name}</Link>
        </h3>

        <div className="price">
          <span className="new-price">{taka(product.priceTaka)}</span>
          {product.oldPriceTaka ? (
            <span className="old-price">{taka(product.oldPriceTaka)}</span>
          ) : null}
        </div>

        <div className="stock-status-row">
          {product.isInStock ? (
            <span className="stock-indicator in-stock">
              <span className="stock-dot" /> In Stock
            </span>
          ) : (
            <span className="stock-indicator out-of-stock">
              <span className="stock-dot" /> {t("outOfStock")}
            </span>
          )}
        </div>
      </div>
    </article>
  );
});
