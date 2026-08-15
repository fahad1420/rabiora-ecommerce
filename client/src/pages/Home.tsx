import {
  Award,
  ChevronUp,
  HeartHandshake,
  Headphones,
  Search,
  Shirt,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

const paymentMethods = [
  ["/uploads/images/payment/bkash.jpg", "bKash"],
  ["/uploads/images/payment/nagad.png", "Nagad"],
  ["/uploads/images/payment/rocket.png", "Rocket"],
  ["/uploads/images/payment/cash-on-delivery.jpg", "Cash On Delivery"],
] as const;

export default function Home() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "featured">("all");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { t } = useLanguage();
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();

  const productsQuery = trpc.catalogue.list.useQuery({
    query: search || undefined,
    featured: filter === "featured" ? true : undefined,
  });

  const featuredQuery = trpc.catalogue.list.useQuery({
    featured: true,
  });

  const reviewsQuery = trpc.customer.homeReviews.useQuery();

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 420);

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const carouselImages = useMemo(() => {
    const images = (featuredQuery.data ?? []).flatMap((product) =>
      product.images.slice(0, 2),
    );

    return [...images, ...images];
  }, [featuredQuery.data]);

  const addCart = (productId: number) => cart.add(productId);

  return (
    <div className="page-shell">
      <RabioraHeader
        searchValue={search}
        onSearchChange={setSearch}
        cartCount={cart.count}
        wishlistCount={wishlist.count}
      />

      <main>
        <section className="hero" id="home">
          <div className="container hero-content">
            <div className="hero-text">
              <span className="badge">{t("premium")}</span>
              <h1>{t("heroHeading")}</h1>
              <p>{t("heroCopy")}</p>

              <div className="hero-buttons">
                <a href="#products" className="btn">
                  {t("shopNow")}
                </a>

                <a href="#contact" className="btn-outline">
                  {t("contact")}
                </a>
              </div>
            </div>

            <div className="hero-image" aria-hidden="true" />
          </div>
        </section>

        <section className="featured-section">
          <div className="container">
            <div className="section-title">
              <span>{t("featuredCollection")}</span>
              <h2>{t("featuredHeading")}</h2>
              <p>{t("featuredCopy")}</p>
            </div>

            <div className="featured-slider">
              <div className="featured-track">
                {carouselImages.map((image, index) => (
                  <img
                    src={image.storageUrl}
                    alt={image.altText}
                    key={`${image.storageUrl}-${index}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="products" className="products">
          <div className="container">
            <div className="section-title">
              <span>{t("latestCollection")}</span>
              <h2>{t("latestHeading")}</h2>
              <p>{t("latestCopy")}</p>
            </div>

            <div className="product-filter">
              <button
                className={filter === "all" ? "active" : ""}
                type="button"
                onClick={() => setFilter("all")}
              >
                {t("allProducts")}
              </button>

              <button
                className={filter === "featured" ? "active" : ""}
                type="button"
                onClick={() => setFilter("featured")}
              >
                {t("featured")}
              </button>
            </div>

            {productsQuery.isLoading ? (
              <div className="catalogue-state">
                {t("loadingCollection")}
              </div>
            ) : productsQuery.isError ? (
              <div className="catalogue-state">
                {t("collectionUnavailable")}
              </div>
            ) : (
              <div className="products-grid">
                {productsQuery.data?.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddCart={addCart}
                    onToggleWishlist={(id) => wishlist.toggle(id)}
                    wishlisted={wishlist.ids.includes(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="why-us">
          <div className="container">
            <div className="section-title">
              <span>{t("whyRabiora")}</span>
              <h2>{t("whyLove")}</h2>
            </div>

            <div className="why-grid">
              <WhyCard
                icon={<Shirt />}
                title={t("premiumFabric")}
                text={t("premiumFabricCopy")}
              />

              <WhyCard
                icon={<Truck />}
                title={t("fastDelivery")}
                text={t("fastDeliveryCopy")}
              />

              <WhyCard
                icon={<Award />}
                title={t("trustedQuality")}
                text={t("trustedQualityCopy")}
              />

              <WhyCard
                icon={<Headphones />}
                title={t("support")}
                text={t("supportCopy")}
              />
            </div>
          </div>
        </section>

        {/* Customer Reviews */}
        <section id="reviews" className="reviews">
          <div className="container">
            <div className="section-title">
              <span>{t("customerReviews")}</span>
              <h2>{t("whatCustomersSay")}</h2>
            </div>

            {reviewsQuery.isLoading ? (
              <div className="reviews-empty">
                <HeartHandshake size={32} />
                <p>Loading customer reviews...</p>
              </div>
            ) : reviewsQuery.isError ? (
              <div className="reviews-empty">
                <HeartHandshake size={32} />
                <p>Unable to load customer reviews.</p>
              </div>
            ) : reviewsQuery.data &&
              reviewsQuery.data.length > 0 ? (
              <div className="home-reviews-grid">
                {reviewsQuery.data.map((review) => (
                  <article
                    key={review.id}
                    className="home-review-card"
                  >
                    <div className="home-review-header">
                      <div>
                        <strong>
                          {review.customerName ||
                            "Verified Customer"}
                        </strong>

                        <div
                          className="home-review-stars"
                          aria-label={`${review.rating} out of 5 stars`}
                        >
                          {"★".repeat(review.rating)}
                          {"☆".repeat(5 - review.rating)}
                        </div>
                      </div>

                      <span className="home-review-date">
                        {new Date(
                          review.createdAt,
                        ).toLocaleDateString("en-BD", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <p className="home-review-text">
                      “{review.review}”
                    </p>

                    <div className="home-review-footer">
                      <span className="verified-review-label">
                        ✓ Verified Purchase
                      </span>

                      <span className="home-review-product">
                        {review.productName}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="reviews-empty">
                <HeartHandshake size={32} />
                <p>{t("reviewsEmpty")}</p>
              </div>
            )}
          </div>
        </section>

        <section id="about" className="about">
          <div className="container">
            <div className="section-title">
              <span>{t("about")}</span>
              <h2>{t("aboutStore")}</h2>
            </div>

            <p>{t("aboutCopy")}</p>
          </div>
        </section>

        <section className="payment">
          <div className="container">
            <div className="section-title">
              <span>{t("paymentMethods")}</span>
              <h2>{t("easyPayment")}</h2>
            </div>

            <div className="payment-grid">
              {paymentMethods.map(([src, alt]) => (
                <img
                  src={src}
                  alt={alt}
                  key={alt}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="contact">
          <div className="container">
            <div className="section-title">
              <span>{t("contact")}</span>
              <h2>{t("getInTouch")}</h2>
            </div>

            <div className="contact-info">
              <p>
                <strong>{t("address")}:</strong> Mirerbazar,
                Tongi, Gazipur, Dhaka, Bangladesh
              </p>

              <p>
                <strong>{t("phone")}:</strong> +8801349529274
              </p>

              <p>
                <strong>{t("email")}:</strong>{" "}
                rabiora001@gmail.com
              </p>
            </div>

            <div className="social-links">
              <a
                href="https://www.facebook.com/profile.php?id=61588852721335"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook"
              >
                <SocialBrandIcon brand="facebook" />
              </a>

              <a
                href="https://www.instagram.com/rabiora001"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
              >
                <SocialBrandIcon brand="instagram" />
              </a>

              <a
                href="https://www.tiktok.com/@rabiora01"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                title="TikTok"
              >
                <SocialBrandIcon brand="tiktok" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {showBackToTop && (
        <button
          className="back-to-top"
          type="button"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
          aria-label={t("backToTop")}
        >
          <ChevronUp size={21} />
        </button>
      )}

      <RabioraFooter />
    </div>
  );
}

function WhyCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="why-card">
      <div className="why-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function SocialBrandIcon({
  brand,
}: {
  brand: "facebook" | "instagram" | "tiktok";
}) {
  if (brand === "instagram") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect
          x="3.4"
          y="3.4"
          width="17.2"
          height="17.2"
          rx="4.6"
        />
        <circle cx="12" cy="12" r="4.1" />
        <circle
          cx="17.35"
          cy="6.75"
          r=".85"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    );
  }

  if (brand === "facebook") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M13.8 21v-8h2.7l.4-3.1h-3.1V7.92c0-.9.25-1.52 1.58-1.52H17V3.62A21.86 21.86 0 0 0 14.61 3c-2.37 0-4 1.45-4 4.1v2.8H7.92V13h2.69v8h3.19Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M19.32 5.56a5.13 5.13 0 0 1-3.4-2.24A5.2 5.2 0 0 1 15.37 2h-3.2v13.04a2.6 2.6 0 1 1-2.6-2.6c.33 0 .65.06.95.18V9.37a5.8 5.8 0 1 0 4.85 5.73V8.49a8.3 8.3 0 0 0 4.86 1.56V6.88a5.14 5.14 0 0 1-.91-.12Z" />
    </svg>
  );
}