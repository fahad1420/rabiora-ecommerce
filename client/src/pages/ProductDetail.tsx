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
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

  useEffect(() => setSelectedImage(0), [product?.id]);

  const relatedProducts = useMemo(() => (allProductsQuery.data ?? []).filter((item) => item.id !== product?.id).slice(0, 4), [allProductsQuery.data, product?.id]);
  const addCart = (productId: number) => cart.add(productId);

  if (productQuery.isLoading) return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="catalogue-state">{t("loadingProduct")}</main></div>;
  if (productQuery.isError || !product) return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="catalogue-state">{t("productUnavailable")}</main><RabioraFooter /></div>;
  const mainImage = product.images[selectedImage] ?? product.images[0];

  return <div className="page-shell">
    <RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />
    <main>
      <section className="product-details-section">
        <div className="container details-wrapper">
          <div className="details-gallery">
            {mainImage ? <img className="main-image" src={mainImage.storageUrl} alt={mainImage.altText} /> : <div className="image-fallback detail-fallback">{t("imageUnavailable")}</div>}
            <div className="gallery" aria-label={t("imageGallery")}>
              {product.images.map((image, index) => <button aria-label={t("viewImage", { index: index + 1, name: product.name })} className={index === selectedImage ? "thumb active" : "thumb"} key={image.storageUrl} type="button" onClick={() => setSelectedImage(index)}><img src={image.storageUrl} alt="" /></button>)}
            </div>
          </div>
          <div className="details-content">
            <span className="badge">{t("premium")}</span>
            <h1>{product.name}</h1>
            <div className="price"><span className="new-price">{taka(product.priceTaka)}</span>{product.oldPriceTaka && <span className="old-price">{taka(product.oldPriceTaka)}</span>}</div>
            <p><strong>{t("category")}:</strong> {product.categoryName}</p>
            <p><strong>{t("fabric")}:</strong> {product.fabric}</p>
            <p><strong>{t("color")}:</strong> {product.color}</p>
            <p><strong>{t("availability")}:</strong> <span className={product.isInStock ? "in-stock" : "stock-note"}>{product.isInStock ? t("inStock") : t("outOfStock")}</span></p>
            <hr />
            <h3>{t("description")}</h3>
            <p>{product.details}</p>
            <div className="product-buttons detail-buttons">
              <button className="cart-btn" type="button" disabled={!product.isInStock} onClick={() => addCart(product.id)}><ShoppingCart size={18} aria-hidden="true" /> {t("addToCart")}</button>
              <button className="btn buy-now" type="button" disabled={!product.isInStock} onClick={() => addCart(product.id)}>{t("buyNow")}</button>
            </div>
            <button className="wishlist-btn" type="button" aria-pressed={wishlist.ids.includes(product.id)} onClick={() => wishlist.toggle(product.id)}><Heart size={17} aria-hidden="true" fill={wishlist.ids.includes(product.id) ? "currentColor" : "none"} /> {wishlist.ids.includes(product.id) ? t("savedWishlist") : t("addToWishlist")}</button>
          </div>
        </div>
      </section>
      <section className="products related-products">
        <div className="container">
          <div className="section-title"><span>{t("youMayLike")}</span><h2>{t("relatedProducts")}</h2></div>
          <div className="products-grid">{relatedProducts.map((item) => <ProductCard key={item.id} product={item} onAddCart={addCart} onToggleWishlist={(id) => wishlist.toggle(id)} wishlisted={wishlist.ids.includes(item.id)} />)}</div>
        </div>
      </section>
    </main>
    <RabioraFooter />
  </div>;
}
