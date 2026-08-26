import {
  Award,
  ChevronRight,
  Headphones,
  HeartHandshake,
  Mail,
  Phone,
  Send,
  Shirt,
  Sparkles,
  Truck,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ProductCard } from "@/components/ProductCard";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { OfferBannerSlider } from "@/components/OfferBannerSlider";
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

function WhyCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="why-card">
      <div className="why-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "featured">("all");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { t } = useLanguage();
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const customer = trpc.customer.me.useQuery();

  // Newsletter State
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribePhone, setSubscribePhone] = useState("");
  const [residency, setResidency] = useState<"inside_bangladesh" | "outside_bangladesh">("inside_bangladesh");
  const [subscribeSuccess, setSubscribeSuccess] = useState("");
  const [subscribeError, setSubscribeError] = useState("");

  const subscribeMutation = trpc.subscribe.useMutation();

  const productsQuery = trpc.catalogue.list.useQuery({
    query: search || undefined,
    featured: filter === "featured" ? true : undefined,
  });

  const featuredQuery = trpc.catalogue.list.useQuery({
    featured: true,
  });

  const reviewsQuery = trpc.customer.homeReviews.useQuery();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const shouldShow = window.scrollY > 420;
          setShowBackToTop((prev) => (prev !== shouldShow ? shouldShow : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const carouselImages = useMemo(() => {
    const images = (featuredQuery.data ?? []).flatMap((product) =>
      product.images.slice(0, 2)
    );
    return [...images, ...images];
  }, [featuredQuery.data]);

  const addCart = useCallback((productId: number | string) => {
    cart.add(productId);
  }, [cart.add]);

  const handleBuyNow = useCallback((productId: number | string) => {
    const targetUrl = `/checkout?buyNowProductId=${productId}&qty=1`;
    if (!customer.data) {
      navigate(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    } else {
      navigate(targetUrl);
    }
  }, [customer.data, navigate]);

  const toggleWishlist = useCallback((id: number | string) => {
    wishlist.toggle(id);
  }, [wishlist.toggle]);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    setSubscribeError("");
    setSubscribeSuccess("");

    try {
      const res = await subscribeMutation.mutateAsync({
        email: subscribeEmail,
        phone: subscribePhone,
        residency,
      });
      setSubscribeSuccess(res.message);
      setSubscribeEmail("");
      setSubscribePhone("");
    } catch (err: any) {
      setSubscribeError(err.message || "Failed to subscribe. Please try again.");
    }
  };

  return (
    <div className="page-shell">
      <RabioraHeader
        searchValue={search}
        onSearchChange={setSearch}
        cartCount={cart.count}
        wishlistCount={wishlist.count}
      />

      <main>
        {/* Luxury Editorial Hero Section */}
        <section className="hero" id="home">
          <div className="container hero-content">
            <div className="hero-text">
              <span className="badge hero-badge">
                <Sparkles size={13} className="hero-badge-icon" />
                {t("premiumCollection") || "Premium Collection"}
              </span>

              <h1>
                RABIORA <br />
                <span className="hero-subtitle-highlight">Premium Pakistani Three Piece</span>
              </h1>

              <p className="hero-tagline">
                Elegance • Comfort • Confidence
              </p>
              <p className="hero-copy">
                Discover authentic handcrafted luxury Pakistani Three-Piece collections. Crafted with pure lawn, premium cotton, and intricate embroidery for timeless elegance.
              </p>

              <div className="hero-buttons">
                <a href="#products" className="btn hero-primary-btn">
                  Shop Collection <ChevronRight size={16} />
                </a>
                <a href="#about" className="btn-outline hero-secondary-btn">
                  Explore Story
                </a>
              </div>
            </div>

            <div className="hero-image" aria-hidden="true">
              <div className="hero-image-backdrop" />
              <div className="hero-floating-card">
                <strong>100% Authentic</strong>
                <span>Handcrafted Pakistani Design</span>
              </div>
            </div>
          </div>
        </section>

        {/* Promotional Offer Banner Slider */}
        <OfferBannerSlider />

        {/* Featured Collection Slider */}
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
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Products Grid Section */}
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
                    onBuyNow={handleBuyNow}
                    onToggleWishlist={toggleWishlist}
                    wishlisted={wishlist.ids.includes(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Compact Why Customers Love Us Section */}
        <section className="why-us">
          <div className="container">
            <div className="section-title">
              <span>{t("whyRabiora")}</span>
              <h2>{t("whyLove")}</h2>
            </div>

            <div className="why-grid">
              <WhyCard
                icon={<Shirt size={26} />}
                title={t("premiumFabric")}
                text={t("premiumFabricCopy")}
              />
              <WhyCard
                icon={<Truck size={26} />}
                title={t("fastDelivery")}
                text={t("fastDeliveryCopy")}
              />
              <WhyCard
                icon={<Award size={26} />}
                title={t("trustedQuality")}
                text={t("trustedQualityCopy")}
              />
              <WhyCard
                icon={<Headphones size={26} />}
                title={t("support")}
                text={t("supportCopy")}
              />
            </div>
          </div>
        </section>

        {/* Customer Reviews Section */}
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
            ) : reviewsQuery.data && reviewsQuery.data.length > 0 ? (
              <div className="home-reviews-grid">
                {reviewsQuery.data.map((review) => (
                  <article key={review.id} className="home-review-card">
                    <div className="home-review-header">
                      <div>
                        <strong>{review.customerName || "Verified Customer"}</strong>
                        <div className="home-review-stars" aria-label={`${review.rating} out of 5 stars`}>
                          {"★".repeat(review.rating)}
                          {"☆".repeat(5 - review.rating)}
                        </div>
                      </div>
                      <span className="home-review-date">
                        {new Date(review.createdAt).toLocaleDateString("en-BD", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="home-review-text">“{review.review}”</p>
                    <div className="home-review-footer">
                      <span className="verified-review-label">✓ Verified Purchase</span>
                      <span className="home-review-product">{review.productName}</span>
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

        {/* About Section */}
        <section id="about" className="about">
          <div className="container">
            <div className="section-title">
              <span>{t("about")}</span>
              <h2>{t("aboutStore")}</h2>
            </div>
            <p>{t("aboutCopy")}</p>
          </div>
        </section>

        {/* Payment Methods Section */}
        <section className="payment">
          <div className="container">
            <div className="section-title">
              <span>{t("paymentMethods")}</span>
              <h2>{t("easyPayment")}</h2>
            </div>

            <div className="payment-grid">
              {paymentMethods.map(([src, alt]) => (
                <div className="payment-badge-card" key={alt}>
                  <img src={src} alt={alt} loading="lazy" />
                  <span>{alt}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stay Tuned / Subscription Section */}
        <section className="stay-tuned-section">
          <div className="container">
            <div className="stay-tuned-card">
              <div className="stay-tuned-header">
                <span className="badge">Newsletter</span>
                <h2>STAY TUNED WITH RABIORA</h2>
                <p>
                  Subscribe to receive exclusive collection drops, VIP discounts, and luxury Pakistani fashion updates directly to your inbox.
                </p>
              </div>

              <form className="stay-tuned-form" onSubmit={handleSubscribe}>
                <div className="stay-tuned-inputs">
                  <div className="form-input-group">
                    <Mail size={17} className="input-icon" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-input-group">
                    <Phone size={17} className="input-icon" />
                    <input
                      type="tel"
                      required
                      placeholder="Mobile number (01XXXXXXXXX)"
                      value={subscribePhone}
                      onChange={(e) => setSubscribePhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="stay-tuned-residency">
                  <label className={`residency-option ${residency === "inside_bangladesh" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="residency"
                      value="inside_bangladesh"
                      checked={residency === "inside_bangladesh"}
                      onChange={() => setResidency("inside_bangladesh")}
                    />
                    <span>I live in Bangladesh</span>
                  </label>

                  <label className={`residency-option ${residency === "outside_bangladesh" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="residency"
                      value="outside_bangladesh"
                      checked={residency === "outside_bangladesh"}
                      onChange={() => setResidency("outside_bangladesh")}
                    />
                    <span>I live outside Bangladesh</span>
                  </label>
                </div>

                {subscribeError && (
                  <p className="form-error" role="alert">{subscribeError}</p>
                )}
                {subscribeSuccess && (
                  <p className="form-success" role="status">{subscribeSuccess}</p>
                )}

                <button
                  type="submit"
                  className="btn stay-tuned-btn"
                  disabled={subscribeMutation.isPending}
                >
                  <Send size={16} />
                  <span>{subscribeMutation.isPending ? "Subscribing..." : "SUBSCRIBE"}</span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <RabioraFooter />
    </div>
  );
}