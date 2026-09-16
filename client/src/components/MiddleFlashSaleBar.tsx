import { ArrowRight, Flame, Sparkles, Timer, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ProductCard } from "@/components/ProductCard";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export function MiddleFlashSaleBar() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const customer = trpc.customer.me.useQuery();

  const flashSaleQuery = trpc.flashSale.get.useQuery(undefined, {
    staleTime: 2000,
    refetchOnWindowFocus: true,
  });

  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    days?: number;
    isExpired: boolean;
  }>({
    hours: 23,
    minutes: 59,
    seconds: 59,
    isExpired: false,
  });

  const sale = flashSaleQuery.data;

  // Real-time live ticking countdown (updates every 1s)
  useEffect(() => {
    if (!sale?.isActive) return;

    const calculateTime = () => {
      // Use configured end time or fallback
      const targetTime = sale.endTime ? new Date(sale.endTime).getTime() : Date.now() + 48 * 3600 * 1000;
      const now = Date.now();
      const diff = targetTime - now;

      if (isNaN(targetTime) || diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, days: 0, isExpired: true });
        return;
      }

      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = totalHours > 24 ? totalHours : Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: totalHours > 99 ? Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : totalHours,
        days: totalHours > 99 ? days : undefined,
        minutes,
        seconds,
        isExpired: false,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [sale?.isActive, sale?.endTime]);

  const addCart = useCallback((productId: number | string) => {
    cart.add(productId);
  }, [cart]);

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
  }, [wishlist]);

  // If sale is inactive, return null
  if (sale && !sale.isActive) {
    return null;
  }

  const products = sale?.products || [];

  return (
    <section id="flash-sale" className="flash-sale-showcase-section" aria-label="Flash Sale Showcase">
      <div className="container">
        {/* Flash Sale Header Banner with Live Countdown */}
        <div className="flash-sale-banner-card">
          <div className="flash-sale-glow-layer" />
          
          <div className="flash-sale-banner-body">
            <div className="flash-sale-left-info">
              <div className="flash-sale-badge-row">
                <span className="flash-sale-pill">
                  <Zap size={13} className="flash-icon text-amber-300" />
                  <span>{sale?.badgeText || "⚡ FLASH SALE DEAL"}</span>
                </span>
                {products.length > 0 && (
                  <span className="flash-sale-count-tag">
                    {products.length} {products.length === 1 ? "Product" : "Products"} on Sale
                  </span>
                )}
              </div>

              <h2 className="flash-sale-main-title">
                {sale?.title || "⚡ Exclusive Flash Sale — Up to 20% OFF on Selected Luxury Pieces"}
              </h2>
              <p className="flash-sale-subtitle-text">
                {sale?.subtitle || "Limited time promotional prices on handcrafted Pakistani Lawn & Silk collections"}
              </p>
            </div>

            {/* Live Countdown Timer Block */}
            <div className="flash-sale-timer-card">
              <div className="flash-sale-timer-caption">
                <Timer size={14} className="timer-icon text-teal-300" />
                <span>ENDING IN</span>
              </div>

              <div className="flash-sale-countdown-boxes">
                {timeLeft.days !== undefined && (
                  <>
                    <div className="countdown-box">
                      <span className="countdown-num">{String(timeLeft.days).padStart(2, "0")}</span>
                      <span className="countdown-label">DAYS</span>
                    </div>
                    <span className="countdown-divider">:</span>
                  </>
                )}
                <div className="countdown-box">
                  <span className="countdown-num">{String(timeLeft.hours).padStart(2, "0")}</span>
                  <span className="countdown-label">HRS</span>
                </div>
                <span className="countdown-divider">:</span>
                <div className="countdown-box">
                  <span className="countdown-num">{String(timeLeft.minutes).padStart(2, "0")}</span>
                  <span className="countdown-label">MIN</span>
                </div>
                <span className="countdown-divider">:</span>
                <div className="countdown-box">
                  <span className="countdown-num">{String(timeLeft.seconds).padStart(2, "0")}</span>
                  <span className="countdown-label">SEC</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Flash Sale Product Cards Grid */}
        <div className="flash-sale-products-grid-section">
          <div className="flash-sale-grid-header">
            <div>
              <span className="flash-sale-section-kicker">Special Selection</span>
              <h3 className="flash-sale-section-heading">Flash Sale Products</h3>
            </div>
            <p className="flash-sale-grid-subtext">
              Special promotional prices available only while countdown lasts or stock runs out.
            </p>
          </div>

          {flashSaleQuery.isLoading ? (
            <div className="catalogue-state" style={{ padding: "40px", textAlign: "center" }}>
              Loading Flash Sale products...
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state-box" style={{ padding: "35px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "12px", background: "var(--surface)" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>No products currently assigned to Flash Sale in Admin Panel.</p>
            </div>
          ) : (
            <div className="products-grid flash-sale-products-grid">
              {products.map((product: any) => (
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
      </div>
    </section>
  );
}
