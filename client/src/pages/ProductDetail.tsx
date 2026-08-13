import { Heart, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { useRoute } from "wouter";
import { ProductCard } from "@/components/ProductCard";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

const taka = (amount: number) => `৳${amount.toLocaleString("en-BD")}`;

export default function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const slug = params?.slug ?? "";
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const productQuery = trpc.catalogue.bySlug.useQuery({ slug }, { enabled: Boolean(slug) });
  const allProductsQuery = trpc.catalogue.list.useQuery();
  const product = productQuery.data;
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => setSelectedImage(0), [product?.id]);

  const relatedProducts = useMemo(() => (allProductsQuery.data ?? []).filter((item) => item.id !== product?.id).slice(0, 4), [allProductsQuery.data, product?.id]);
  const addCart = (productId: number) => cart.add(productId);

  if (productQuery.isLoading) return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="catalogue-state">Loading product...</main></div>;
  if (productQuery.isError || !product) return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="catalogue-state">This product could not be found.</main><RabioraFooter /></div>;
  const mainImage = product.images[selectedImage] ?? product.images[0];

  return <div className="page-shell">
    <RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />
    <main>
      <section className="product-details-section">
        <div className="container details-wrapper">
          <div className="details-gallery">
            {mainImage ? <img className="main-image" src={mainImage.storageUrl} alt={mainImage.altText} /> : <div className="image-fallback detail-fallback">Image unavailable</div>}
            <div className="gallery" aria-label="Product image gallery">
              {product.images.map((image, index) => <button className={index === selectedImage ? "thumb active" : "thumb"} key={image.storageUrl} type="button" onClick={() => setSelectedImage(index)}><img src={image.storageUrl} alt={`View ${index + 1} of ${product.name}`} /></button>)}
            </div>
          </div>
          <div className="details-content">
            <span className="badge">Premium Collection</span>
            <h1>{product.name}</h1>
            <div className="price"><span className="new-price">{taka(product.priceTaka)}</span>{product.oldPriceTaka && <span className="old-price">{taka(product.oldPriceTaka)}</span>}</div>
            <p><strong>Category :</strong> {product.categoryName}</p>
            <p><strong>Fabric :</strong> {product.fabric}</p>
            <p><strong>Color :</strong> {product.color}</p>
            <p><strong>Availability :</strong> <span className={product.isInStock ? "in-stock" : "stock-note"}>{product.isInStock ? "In Stock" : "Out Of Stock"}</span></p>
            <hr />
            <h3>Description</h3>
            <p>{product.details}</p>
            <div className="product-buttons detail-buttons">
              <button className="cart-btn" type="button" disabled={!product.isInStock} onClick={() => addCart(product.id)}><ShoppingCart size={18} /> Add To Cart</button>
              <button className="btn buy-now" type="button" disabled={!product.isInStock} onClick={() => addCart(product.id)}>Buy Now</button>
            </div>
            <button className="wishlist-btn" type="button" onClick={() => wishlist.toggle(product.id)}><Heart size={17} fill={wishlist.ids.includes(product.id) ? "currentColor" : "none"} /> {wishlist.ids.includes(product.id) ? "Saved to Wishlist" : "Add To Wishlist"}</button>
          </div>
        </div>
      </section>
      <section className="products related-products">
        <div className="container">
          <div className="section-title"><span>You May Like</span><h2>Related Products</h2></div>
          <div className="products-grid">{relatedProducts.map((item) => <ProductCard key={item.id} product={item} onAddCart={addCart} onToggleWishlist={(id) => wishlist.toggle(id)} wishlisted={wishlist.ids.includes(item.id)} />)}</div>
        </div>
      </section>
    </main>
    <RabioraFooter />
  </div>;
}
