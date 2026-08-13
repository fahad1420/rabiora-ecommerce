import { Heart, ShoppingCart } from "lucide-react";
import { Link } from "wouter";

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
  return <article className="product-card">
    <div className="product-image">
      {product.discountPercent > 0 && <span className="discount">-{product.discountPercent}%</span>}
      <button className={wishlisted ? "image-wishlist active" : "image-wishlist"} type="button" aria-label={`Toggle ${product.name} in wishlist`} onClick={() => onToggleWishlist?.(product.id)}><Heart size={16} fill={wishlisted ? "currentColor" : "none"} /></button>
      {coverImage ? <img src={coverImage.storageUrl} alt={coverImage.altText} /> : <div className="image-fallback">Image unavailable</div>}
    </div>
    <div className="product-info">
      <h3>{product.name}</h3>
      <p className="category">{product.categoryName}</p>
      <div className="price"><span className="new-price">{taka(product.priceTaka)}</span>{product.oldPriceTaka && <span className="old-price">{taka(product.oldPriceTaka)}</span>}</div>
      {!product.isInStock && <p className="stock-note">Out of stock</p>}
      <div className="product-buttons">
        <button className="cart-btn" type="button" disabled={!product.isInStock} onClick={() => onAddCart(product.id)}><ShoppingCart size={17} /> Add To Cart</button>
        <Link href={`/products/${product.slug}`} className="details-btn">View Details <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  </article>;
}
