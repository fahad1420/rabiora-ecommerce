import { ArrowRight, Flame, Sparkles, Timer, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export function MiddleFlashSaleBar() {
  const flashSaleQuery = trpc.flashSale.get.useQuery();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  const sale = flashSaleQuery.data;

  useEffect(() => {
    if (!sale?.isActive || !sale?.endTime) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const targetTime = new Date(sale.endTime!).getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (isNaN(targetTime) || diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [sale?.isActive, sale?.endTime]);

  if (!sale || !sale.isActive) return null;

  return (
    <section className="middle-flash-sale-section" aria-label="Flash Sale Promotion">
      <div className="container">
        <div className="middle-flash-sale-card">
          <div className="middle-flash-sale-bg-glow" />
          <div className="middle-flash-sale-content">
            <div className="middle-flash-sale-info">
              <div className="middle-flash-sale-badge">
                <Zap size={14} className="flash-icon text-yellow-400" />
                <span>{sale.badgeText || "⚡ FLASH SALE DEAL"}</span>
                {sale.productCount > 0 && (
                  <span className="middle-flash-sale-count-badge">
                    {sale.productCount} {sale.productCount === 1 ? "Piece" : "Pieces"}
                  </span>
                )}
              </div>

              <h2 className="middle-flash-sale-title">{sale.title}</h2>
              {sale.subtitle && (
                <p className="middle-flash-sale-subtitle">{sale.subtitle}</p>
              )}
            </div>

            <div className="middle-flash-sale-action-block">
              {sale.endTime && timeLeft && !timeLeft.isExpired && (
                <div className="middle-flash-sale-timer-wrap">
                  <span className="timer-label">
                    <Timer size={13} className="inline mr-1" />
                    Offer Ends In:
                  </span>
                  <div className="middle-flash-sale-timer-digits">
                    {timeLeft.days > 0 && (
                      <div className="timer-block">
                        <span className="digit">{String(timeLeft.days).padStart(2, "0")}</span>
                        <span className="label">Days</span>
                      </div>
                    )}
                    <div className="timer-block">
                      <span className="digit">{String(timeLeft.hours).padStart(2, "0")}</span>
                      <span className="label">Hrs</span>
                    </div>
                    <span className="timer-colon">:</span>
                    <div className="timer-block">
                      <span className="digit">{String(timeLeft.minutes).padStart(2, "0")}</span>
                      <span className="label">Min</span>
                    </div>
                    <span className="timer-colon">:</span>
                    <div className="timer-block">
                      <span className="digit">{String(timeLeft.seconds).padStart(2, "0")}</span>
                      <span className="label">Sec</span>
                    </div>
                  </div>
                </div>
              )}

              <a
                href={sale.ctaLink || "#products"}
                className="btn btn-luxury-primary middle-flash-sale-cta"
              >
                <span>{sale.ctaText || "Shop Flash Sale"}</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

