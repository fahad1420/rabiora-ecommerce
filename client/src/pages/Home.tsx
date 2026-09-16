import {
  ArrowUpRight,
  Award,
  CheckCircle2,
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
import { Link, useLocation } from "wouter";
import { ProductCard } from "@/components/ProductCard";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { OfferBannerSlider } from "@/components/OfferBannerSlider";
import { FeaturedCarousel3D } from "@/components/FeaturedCarousel3D";
import { MiddleFlashSaleBar } from "@/components/MiddleFlashSaleBar";
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
  const settingsQuery = trpc.settings.get.useQuery();

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

  // Handle hash scrolling (e.g., #flash-sale or #products) reliably across all devices
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace("#", "");
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 120);
      }
    };

    handleHashScroll();
    window.addEventListener("hashchange", handleHashScroll);
    return () => window.removeEventListener("hashchange", handleHashScroll);
  }, []);

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

        {/* Admin Configured Featured Spotlight Picture / Product */}
        {settingsQuery.data?.featuredPictureUrl && (
          <section className="featured-spotlight-section">
            <div className="container">
              <a
                href={
                  settingsQuery.data.featuredPictureLink ||
                  (settingsQuery.data.featuredProductId ? `/products/${settingsQuery.data.featuredProductId}` : "#products")
                }
                className="featured-spotlight-card"
                title={settingsQuery.data.featuredTitle || "Featured Collection"}
              >
                <img
                  src={settingsQuery.data.featuredPictureUrl}
                  alt={settingsQuery.data.featuredTitle || "Featured Luxury Collection"}
                  className="featured-spotlight-image"
                  loading="lazy"
                />
                {settingsQuery.data.featuredTitle && (
                  <div className="featured-spotlight-overlay">
                    <span className="badge">Featured Spotlight</span>
                    <h3>{settingsQuery.data.featuredTitle}</h3>
                    <span className="featured-spotlight-btn">Explore Now →</span>
                  </div>
                )}
              </a>
            </div>
          </section>
        )}

        {/* Featured Collection — 3D Horizontal Card Carousel */}
        <section id="featured" className="featured-3d-showcase-section">
          <div className="container">
            <div className="section-title">
              <span className="section-kicker">{t("featuredCollection")}</span>
              <h2>{t("featuredHeading")}</h2>
              <p className="section-subtitle">{t("featuredCopy")}</p>
            </div>

            {featuredQuery.isLoading ? (
              <div className="catalogue-state">
                {t("loadingCollection") || "Loading featured showcase..."}
              </div>
            ) : featuredQuery.isError ? (
              <div className="catalogue-state">
                {t("collectionUnavailable") || "Featured showcase is currently unavailable."}
              </div>
            ) : featuredQuery.data && featuredQuery.data.length > 0 ? (
              <FeaturedCarousel3D products={featuredQuery.data} />
            ) : null}
          </div>
        </section>

        {/* Middle Promotional / Flash Sale Bar (Between Featured Collection & Main Products) */}
        <MiddleFlashSaleBar />

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

        {/* Luxury Why Rabiora Section */}
        <section className="why-us">
          <div className="container">
            <div className="section-title">
              <span className="section-kicker">{t("whyRabiora")}</span>
              <h2>{t("whyLove")}</h2>
              <p className="section-subtitle">Experience timeless craftsmanship and unmatched luxury with our curated collection of authentic Pakistani attire.</p>
            </div>

            <div className="why-grid">
              <article className="why-card luxury-why-card">
                <div className="why-icon-wrap">
                  <Shirt size={24} className="why-icon-svg" />
                </div>
                <h3>{t("premiumFabric")}</h3>
                <p>{t("premiumFabricCopy")}</p>
              </article>

              <article className="why-card luxury-why-card">
                <div className="why-icon-wrap">
                  <Truck size={24} className="why-icon-svg" />
                </div>
                <h3>{t("fastDelivery")}</h3>
                <p>{t("fastDeliveryCopy")}</p>
              </article>

              <article className="why-card luxury-why-card">
                <div className="why-icon-wrap">
                  <Award size={24} className="why-icon-svg" />
                </div>
                <h3>{t("trustedQuality")}</h3>
                <p>{t("trustedQualityCopy")}</p>
              </article>

              <article className="why-card luxury-why-card">
                <div className="why-icon-wrap">
                  <Headphones size={24} className="why-icon-svg" />
                </div>
                <h3>{t("support")}</h3>
                <p>{t("supportCopy")}</p>
              </article>
            </div>
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section id="reviews" className="reviews">
          <div className="container">
            <div className="section-title">
              <span className="section-kicker">{t("customerReviews")}</span>
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

        {/* Luxury About Section */}
        <section id="about" className="about luxury-about-section">
          <div className="container">
            <div className="about-luxury-card">
              <div className="about-luxury-content">
                <span className="badge about-badge">
                  <Sparkles size={13} className="mr-1.5" />
                  Our Heritage & Passion
                </span>
                <h2>{t("aboutStore")}</h2>
                <div className="about-gold-divider" />
                <p className="about-lead-text">
                  Rabiora represents the pinnacle of luxury Pakistani fashion in Bangladesh. Every piece in our collection is curated for the discerning woman who appreciates fine craftsmanship, authentic heritage, and timeless elegance.
                </p>
                <p className="about-secondary-text">
                  {t("aboutCopy")}
                </p>
                
                <div className="about-pillars-grid">
                  <div className="about-pillar-item">
                    <span className="pillar-number">01</span>
                    <div>
                      <strong>Authentic Lawn & Silk</strong>
                      <p>Imported pure fabrications with soft feel and durable weave.</p>
                    </div>
                  </div>
                  <div className="about-pillar-item">
                    <span className="pillar-number">02</span>
                    <div>
                      <strong>Artisanal Embroidery</strong>
                      <p>Intricate needlework with gold thread, sequins, and organza cutwork.</p>
                    </div>
                  </div>
                  <div className="about-pillar-item">
                    <span className="pillar-number">03</span>
                    <div>
                      <strong>VIP Customer Care</strong>
                      <p>Direct WhatsApp styling advice and hassle-free exchange policy.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Methods Section */}
        <section className="payment">
          <div className="container">
            <div className="section-title">
              <span className="section-kicker">{t("paymentMethods")}</span>
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

        {/* Compact & Proportional Stay Tuned / Subscription Section */}
        <section className="stay-tuned-section">
          <div className="container">
            <div className="stay-tuned-card luxury-stay-tuned">
              <div className="stay-tuned-header">
                <span className="badge stay-tuned-badge">
                  <Mail size={12} className="mr-1.5" />
                  Exclusive Updates
                </span>
                <h2>STAY TUNED WITH RABIORA</h2>
                <p>
                  Subscribe for new seasonal arrivals, VIP discount codes, and curated Pakistani fashion drops.
                </p>
              </div>

              <form className="stay-tuned-form" onSubmit={handleSubscribe}>
                <div className="stay-tuned-inputs">
                  <div className="form-input-group">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-input-group">
                    <Phone size={16} className="input-icon" />
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
                  <p className="form-success" role="status">
                    <CheckCircle2 size={16} className="inline mr-1" />
                    {subscribeSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn-luxury-primary stay-tuned-btn"
                  disabled={subscribeMutation.isPending}
                >
                  <Send size={15} />
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