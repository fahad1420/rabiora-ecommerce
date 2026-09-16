import { ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export interface FeaturedProduct {
  id: number | string;
  slug?: string;
  name: string;
  categoryName?: string;
  isInStock?: boolean;
  stockQuantity?: number;
  images?: Array<{ storageUrl: string; altText?: string; isCover?: boolean }>;
}

interface FeaturedCarousel3DProps {
  products: FeaturedProduct[];
}

export function FeaturedCarousel3D({ products }: FeaturedCarousel3DProps) {
  const utils = trpc.useUtils();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);
  const total = products.length;

  const nextSlide = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Automatic continuous 2-second rotation loop
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 2000);
    return () => clearInterval(interval);
  }, [total, isPaused, nextSlide]);

  // Touch & Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null) {
      if (touchDeltaXRef.current > 45) {
        prevSlide();
      } else if (touchDeltaXRef.current < -45) {
        nextSlide();
      }
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
    setTimeout(() => setIsPaused(false), 2000);
  };

  if (!products || products.length === 0) return null;

  return (
    <div
      className="carousel-3d-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Left/Right Navigation Buttons */}
      {total > 1 && (
        <>
          <button
            type="button"
            className="carousel-3d-nav-btn prev"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous Featured Product"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="carousel-3d-nav-btn next"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next Featured Product"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* 3D Track */}
      <div className="carousel-3d-stage">
        {products.map((product, idx) => {
          // Calculate relative position around active index
          let offset = idx - activeIndex;
          if (offset < -Math.floor(total / 2)) offset += total;
          if (offset > Math.floor(total / 2)) offset -= total;

          // For small arrays (e.g. 2 or 3 items)
          if (total === 2 && offset === -1) offset = -1;

          const isActive = offset === 0;
          const isVisible = Math.abs(offset) <= 2;
          const coverImage =
            product.images?.find((img) => img.isCover) ?? product.images?.[0];
          const productUrl = `/products/${product.slug || product.id}`;
          const inStock = product.isInStock !== false && (product.stockQuantity === undefined || product.stockQuantity > 0);

          let cardClass = "carousel-3d-card";
          if (isActive) cardClass += " is-active";
          else if (offset === -1) cardClass += " is-prev";
          else if (offset === 1) cardClass += " is-next";
          else if (offset === -2) cardClass += " is-far-prev";
          else if (offset === 2) cardClass += " is-far-next";
          else cardClass += " is-hidden";

          if (!isVisible && total > 5) {
            return null;
          }

          return (
            <div
              key={product.id}
              className={cardClass}
              style={{
                "--offset": offset,
                "--abs-offset": Math.abs(offset),
              } as React.CSSProperties}
            >
              <Link
                href={productUrl}
                className="carousel-3d-card-inner"
                title={`View ${product.name}`}
                onMouseEnter={() => {
                  const targetSlug = product.slug || String(product.id);
                  if (targetSlug) utils.catalogue.bySlug.prefetch({ slug: targetSlug });
                }}
                onTouchStart={() => {
                  const targetSlug = product.slug || String(product.id);
                  if (targetSlug) utils.catalogue.bySlug.prefetch({ slug: targetSlug });
                }}
              >
                <div className="carousel-3d-media-wrapper">
                  {coverImage ? (
                    <img
                      src={coverImage.storageUrl}
                      alt={coverImage.altText || product.name}
                      loading="lazy"
                      decoding="async"
                      className="carousel-3d-img"
                    />
                  ) : (
                    <div className="carousel-3d-fallback">{product.name}</div>
                  )}
                  <div className="carousel-3d-ambient-glow" />
                  <div className="carousel-3d-gradient-layer" />
                </div>

                {/* Top Stock / Availability & Curated Badges */}
                <div className="carousel-3d-top-bar">
                  <span className="carousel-3d-tag">
                    <Sparkles size={11} className="tag-sparkle" />
                    <span>Featured #{String(idx + 1).padStart(2, "0")}</span>
                  </span>
                  <span className={`carousel-3d-stock-badge ${inStock ? "in-stock" : "out-of-stock"}`}>
                    {inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>

                {/* Bottom Overlay: Only Category & Product Name */}
                <div className="carousel-3d-glass-content">
                  <div className="carousel-3d-meta-group">
                    <span className="carousel-3d-category-tag">
                      {product.categoryName || "Pakistani Three Piece"}
                    </span>
                    <h3 className="carousel-3d-title">{product.name}</h3>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      {total > 1 && (
        <div className="carousel-3d-dots">
          {products.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              className={`carousel-3d-dot ${idx === activeIndex ? "active" : ""}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

