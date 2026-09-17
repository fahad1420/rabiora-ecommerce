import { Heart, ShoppingCart, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";

import { ProductCard } from "@/components/ProductCard";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { trpc } from "@/lib/trpc";

const taka = (amount: number) =>
  `৳${amount.toLocaleString("en-BD")}`;

export default function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug ?? "";

  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const utils = trpc.useUtils();
  const customer = trpc.customer.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });
  const { t } = useLanguage();

  // Instant Cache Lookup: Check if product was already fetched in catalogue.list
  const cachedList = utils.catalogue.list.getData();
  const cachedProduct = useMemo(() => {
    if (!slug || !cachedList) return undefined;
    return cachedList.find(
      (item) =>
        item.slug === slug ||
        String(item.id) === slug ||
        String(item.legacyId) === slug
    );
  }, [slug, cachedList]);

  const productQuery = trpc.catalogue.bySlug.useQuery(
    { slug },
    {
      enabled: Boolean(slug),
      placeholderData: cachedProduct,
      staleTime: 1000 * 60 * 5,
    },
  );

  const allProductsQuery = trpc.catalogue.list.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });

  const product = productQuery.data ?? cachedProduct;

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("description");

  const reviewsQuery = trpc.customer.productReviews.useQuery(
    { productId: product?.id ?? 0 },
    { enabled: Boolean(product?.id), staleTime: 1000 * 60 * 5 },
  );

  useEffect(() => {
    setSelectedImage(0);
    setQuantity(1);
  }, [product?.id]);

  const relatedProducts = useMemo(
    () =>
      (allProductsQuery.data ?? [])
        .filter((item) => item.id !== product?.id)
        .slice(0, 4),
    [allProductsQuery.data, product?.id],
  );

  const addCart = (productId: number | string) => {
    for (let i = 0; i < quantity; i++) {
      cart.add(productId);
    }
  };

  const handleBuyNow = (productId?: number | string) => {
    const id = productId ?? product?.id;
    if (!id) return;
    const targetUrl = `/checkout?buyNowProductId=${id}&qty=${quantity}`;
    if (!customer.data) {
      navigate(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    } else {
      navigate(targetUrl);
    }
  };

  const reviews = reviewsQuery.data ?? [];

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  if (productQuery.isLoading && !product) {
    return (
      <div className="page-shell">
        <RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />
        <main className="container" style={{ padding: "40px 0", minHeight: "60vh" }}>
          <div className="catalogue-state">{t("loadingProduct")}</div>
        </main>
        <RabioraFooter />
      </div>
    );
  }

  if ((productQuery.isError && !product) || !product) {
    return (
      <div className="page-shell">
        <RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />
        <main className="catalogue-state">{t("productUnavailable")}</main>
        <RabioraFooter />
      </div>
    );
  }

  const mainImage = product.images[selectedImage] ?? product.images[0];
  const whatsAppOrderUrl = `https://wa.me/8801349529274?text=${encodeURIComponent(
    `Hello Rabiora, I want to order:\n• Product: ${product.name}\n• Price: ৳${product.priceTaka.toLocaleString("en-BD")}\n• Quantity: ${quantity}\n• URL: https://www.rabiora.com/products/${product.slug}`
  )}`;

  return (
    <div className="page-shell">
      <RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />

      <main>
        {/* Breadcrumb Navigation */}
        <div className="container product-breadcrumb-row">
          <a href="/">Home</a>
          <span>/</span>
          <a href="/#products">{product.categoryName || "Pakistani Three Piece"}</a>
          <span>/</span>
          <span className="current-breadcrumb">{product.name}</span>
        </div>

        <section className="product-details-section">
          <div className="container details-wrapper">
            {/* Gallery Column */}
            <div className="details-gallery">
              <div className="main-image-container">
                {product.discountPercent > 0 && (
                  <span className="discount-badge-large">-{product.discountPercent}% OFF</span>
                )}
                {mainImage ? (
                  <img
                    className="main-image"
                    src={mainImage.storageUrl}
                    alt={mainImage.altText || product.name}
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <div className="image-fallback detail-fallback">
                    {t("imageUnavailable")}
                  </div>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="gallery" aria-label={t("imageGallery")}>
                  {product.images.map((image, index) => (
                    <button
                      aria-label={t("viewImage", { index: index + 1, name: product.name })}
                      className={index === selectedImage ? "thumb active" : "thumb"}
                      key={`${image.storageUrl}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                    >
                      <img src={image.storageUrl} alt="" loading="lazy" decoding="async" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Overview & Action Column */}
            <div className="details-content">
              <div className="product-category-brand-tag">
                {product.categoryName || "Pakistani Three Piece"} {product.sku ? `• SKU: ${product.sku}` : ""}
              </div>

              <h1 className="product-title-heading">{product.name}</h1>

              {reviews.length > 0 && (
                <div className="product-rating-summary">
                  <div className="product-rating-stars">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        size={16}
                        fill={index < Math.round(averageRating) ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <strong>{averageRating.toFixed(1)}</strong>
                  <span>({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span>
                </div>
              )}

              <div className="price-display-block">
                <span className="price-current">{taka(product.priceTaka)}</span>
                {product.oldPriceTaka ? (
                  <span className="price-original">{taka(product.oldPriceTaka)}</span>
                ) : null}
              </div>

              {/* Stock Status Indicator */}
              <div className="product-stock-badge-wrap">
                {product.isInStock ? (
                  <span className="stock-pill in-stock">
                    <span className="stock-dot" /> In Stock • Ready for Immediate Delivery
                  </span>
                ) : (
                  <span className="stock-pill out-of-stock">
                    <span className="stock-dot" /> {t("outOfStock")}
                  </span>
                )}
              </div>

              {/* Quantity Stepper & Actions */}
              {product.isInStock && (
                <div className="product-purchase-action-group">
                  <div className="quantity-control-wrap">
                    <span className="quantity-label">Quantity</span>
                    <div className="quantity-stepper">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="quantity-val">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(product.stockQuantity || 10, q + 1))}
                        disabled={quantity >= (product.stockQuantity || 10)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="product-buttons detail-buttons">
                    <button
                      className="btn detail-add-bag-btn"
                      type="button"
                      onClick={() => addCart(product.id)}
                    >
                      <ShoppingCart size={18} aria-hidden="true" />
                      <span>{t("addToCart")}</span>
                    </button>

                    <button
                      className="btn detail-buy-now-btn"
                      type="button"
                      onClick={() => handleBuyNow()}
                    >
                      <span>{t("buyNow")}</span>
                    </button>
                  </div>

                  <div className="secondary-action-row">
                    <a
                      href={whatsAppOrderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-order-btn"
                      title="Order directly on WhatsApp"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.077-1.803-.409-1.503-.625-2.435-2.148-2.51-2.247-.075-.1-.605-.805-.605-1.537s.38-1.09.516-1.238c.135-.148.293-.185.39-.185.099 0 .198.002.284.006.091.004.212-.034.331.253.123.298.423 1.03.46 1.104.037.074.062.161.012.26-.049.099-.074.16-.148.247-.074.086-.156.193-.223.26-.075.074-.153.155-.066.304.087.149.387.638.831 1.032.572.508 1.054.665 1.203.74.149.074.236.062.323-.037.087-.1.371-.433.47-.582.099-.148.198-.124.333-.074.136.049.864.407 1.012.481.149.074.248.112.284.173.037.062.037.359-.107.764z"/>
                      </svg>
                      <span>Order on WhatsApp</span>
                    </a>

                    <button
                      className={`wishlist-toggle-pill ${wishlist.ids.includes(product.id) ? "active" : ""}`}
                      type="button"
                      aria-pressed={wishlist.ids.includes(product.id)}
                      onClick={() => wishlist.toggle(product.id)}
                    >
                      <Heart
                        size={17}
                        aria-hidden="true"
                        fill={wishlist.ids.includes(product.id) ? "currentColor" : "none"}
                      />
                      <span>{wishlist.ids.includes(product.id) ? "Saved in Wishlist" : "Add to Wishlist"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Collapsible Accordion Tabs */}
              <div className="product-accordions-group">
                {/* 1. Description */}
                <details className="product-accordion-item" open>
                  <summary className="product-accordion-summary">
                    <span>Product Description & Fabric</span>
                  </summary>
                  <div className="product-accordion-body">
                    <p>{product.details || "Authentic handcrafted luxury Pakistani Three-Piece collection with intricate embroidery and premium finish."}</p>
                    {product.fabric && (
                      <p className="meta-line"><strong>Fabric:</strong> {product.fabric}</p>
                    )}
                    {product.color && (
                      <p className="meta-line"><strong>Color:</strong> {product.color}</p>
                    )}
                  </div>
                </details>

                {/* 2. Fabric Care */}
                <details className="product-accordion-item">
                  <summary className="product-accordion-summary">
                    <span>Fabric Care Instructions</span>
                  </summary>
                  <div className="product-accordion-body">
                    <ul>
                      <li>Dry clean recommended for heavy embroidered pieces.</li>
                      <li>Gentle hand wash in cold water with mild detergent for lawn fabrics.</li>
                      <li>Do not bleach or tumble dry. Dry in shade to maintain color brilliance.</li>
                      <li>Iron at medium temperature on reverse side of embroidery.</li>
                    </ul>
                  </div>
                </details>

                {/* 3. Delivery & Returns */}
                <details className="product-accordion-item">
                  <summary className="product-accordion-summary">
                    <span>Delivery & 48-Hour Exchange Policy</span>
                  </summary>
                  <div className="product-accordion-body">
                    <ul>
                      <li><strong>Dhaka City:</strong> Free delivery within 24-48 hours.</li>
                      <li><strong>Outside Dhaka:</strong> ৳120 standard courier delivery within 2-3 business days.</li>
                      <li><strong>Cash on Delivery & Mobile Wallet:</strong> bKash, Nagad, Rocket, and COD accepted.</li>
                      <li><strong>48-Hour Exchange:</strong> Hassle-free exchange policy if you find any sizing or defect issue.</li>
                    </ul>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </section>

        {/* PUBLIC PRODUCT REVIEWS */}
        <section className="product-reviews-section">
          <div className="container">
            <div className="section-title">
              <span>Customer Feedback</span>

              <h2>Product Reviews</h2>
            </div>

            {reviewsQuery.isLoading ? (
              <div className="reviews-loading">
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="reviews-empty">
                <Star
                  size={28}
                  aria-hidden="true"
                />

                <strong>
                  No reviews yet
                </strong>

                <span>
                  Be the first customer to
                  review this product.
                </span>
              </div>
            ) : (
              <>
                <div className="public-review-summary">
                  <div className="public-review-score">
                    <strong>
                      {averageRating.toFixed(
                        1,
                      )}
                    </strong>

                    <div className="public-review-stars">
                      {Array.from({
                        length: 5,
                      }).map(
                        (_, index) => (
                          <Star
                            key={index}
                            size={20}
                            fill={
                              index <
                              Math.round(
                                averageRating,
                              )
                                ? "currentColor"
                                : "none"
                            }
                          />
                        ),
                      )}
                    </div>

                    <span>
                      Based on{" "}
                      {reviews.length}{" "}
                      {reviews.length === 1
                        ? "review"
                        : "reviews"}
                    </span>
                  </div>
                </div>

                <div className="public-reviews-list">
                  {reviews.map(
                    (review) => (
                      <article
                        key={review.id}
                        className="public-review-card"
                      >
                        <div className="public-review-header">
                          <div className="public-review-avatar">
                            {(review.userId
                              .toString()
                              .slice(-1) ||
                              "C"
                            ).toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              Verified Customer
                            </strong>

                            <div className="public-review-stars small">
                              {Array.from({
                                length: 5,
                              }).map(
                                (_, index) => (
                                  <Star
                                    key={
                                      index
                                    }
                                    size={
                                      15
                                    }
                                    fill={
                                      index <
                                      review.rating
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                ),
                              )}
                            </div>
                          </div>

                          <time>
                            {new Date(
                              review.createdAt,
                            ).toLocaleDateString(
                              "en-BD",
                              {
                                year: "numeric",
                                month:
                                  "short",
                                day: "numeric",
                              },
                            )}
                          </time>
                        </div>

                        <p>
                          {review.review}
                        </p>

                        <span className="verified-review-label">
                          ✓ Verified purchase
                        </span>
                      </article>
                    ),
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="products related-products">
          <div className="container">
            <div className="section-title">
              <span>
                {t("youMayLike")}
              </span>

              <h2>
                {t("relatedProducts")}
              </h2>
            </div>

            <div className="products-grid">
              {relatedProducts.map(
                (item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    onAddCart={addCart}
                    onBuyNow={handleBuyNow}
                    onToggleWishlist={(id) =>
                      wishlist.toggle(id)
                    }
                    wishlisted={wishlist.ids.includes(
                      item.id,
                    )}
                  />
                ),
              )}
            </div>
          </div>
        </section>
      </main>

      <RabioraFooter />
    </div>
  );
}