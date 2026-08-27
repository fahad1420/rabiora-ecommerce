import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Tag } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function OfferBannerSlider() {
  const { data: offers, isLoading } = trpc.offers.list.useQuery();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeOffers = offers || [];

  useEffect(() => {
    if (activeOffers.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      if (document.hidden) return;
      setCurrentIndex((prev) => (prev + 1) % activeOffers.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [activeOffers.length, isPaused]);

  if (isLoading || activeOffers.length === 0) {
    return null;
  }

  const current = activeOffers[currentIndex] || activeOffers[0];

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + activeOffers.length) % activeOffers.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % activeOffers.length);
  };

  return (
    <section
      className="offer-banner-section"
      aria-label="Promotional Offers"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="container">
        <div className="offer-banner-card">
          <div className="offer-banner-content">
            <div className="offer-banner-badge">
              <Sparkles size={14} className="badge-sparkle" />
              <span>{current.badge || "Special Offer"}</span>
            </div>

            <h3 className="offer-banner-title">{current.title}</h3>

            {current.subtitle && (
              <p className="offer-banner-subtitle">{current.subtitle}</p>
            )}

            {current.discountCode && (
              <div className="offer-banner-code">
                <Tag size={13} />
                <span>Code: <strong>{current.discountCode}</strong></span>
              </div>
            )}

            <div className="offer-banner-actions">
              <a href={current.linkUrl || "#products"} className="offer-banner-btn">
                Claim Offer →
              </a>
            </div>
          </div>

          <div className="offer-banner-media">
            <img
              src={current.imageUrl}
              alt={current.title}
              loading="lazy"
              decoding="async"
              className="offer-banner-img"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>

          {activeOffers.length > 1 && (
            <>
              <button
                type="button"
                className="offer-slider-nav prev"
                onClick={prevSlide}
                aria-label="Previous offer"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="offer-slider-nav next"
                onClick={nextSlide}
                aria-label="Next offer"
              >
                <ChevronRight size={18} />
              </button>

              <div className="offer-slider-dots" role="tablist">
                {activeOffers.map((offer, idx) => (
                  <button
                    key={offer.id || idx}
                    type="button"
                    role="tab"
                    aria-selected={idx === currentIndex}
                    aria-label={`Slide ${idx + 1}`}
                    className={`offer-dot ${idx === currentIndex ? "active" : ""}`}
                    onClick={() => setCurrentIndex(idx)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

