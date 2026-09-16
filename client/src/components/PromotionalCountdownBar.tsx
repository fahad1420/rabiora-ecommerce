import { ArrowRight, Flame, Sparkles, Timer, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export function PromotionalCountdownBar() {
  const settings = trpc.settings.get.useQuery();
  const [isDismissed, setIsDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  const promoActive = settings.data?.promoActive;
  const promoText = settings.data?.promoText || "Special Discount on Authentic Pakistani Lawn & Silk!";
  const promoDiscountText = settings.data?.promoDiscountText || "10% OFF";
  const promoCountdownEnd = settings.data?.promoCountdownEnd;
  const promoCountdownActive = settings.data?.promoCountdownActive !== false;
  const promoButtonText = settings.data?.promoButtonText || "Shop Sale";
  const promoLink = settings.data?.promoLink || "/#products";

  useEffect(() => {
    if (sessionStorage.getItem("rabiora_promobar_dismissed") === "true") {
      setIsDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (!promoActive || !promoCountdownActive || !promoCountdownEnd) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const targetTime = new Date(promoCountdownEnd).getTime();
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
  }, [promoActive, promoCountdownActive, promoCountdownEnd]);

  if (!promoActive || isDismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    sessionStorage.setItem("rabiora_promobar_dismissed", "true");
    setIsDismissed(true);
  };

  return (
    <aside
      className="promo-countdown-bar"
      aria-label="Promotional Announcement and Countdown"
    >
      <div className="container promo-bar-container">
        <div className="promo-bar-content">
          <div className="promo-bar-badge">
            <Flame size={14} className="promo-flame-icon" />
            <span>{promoDiscountText}</span>
          </div>

          <p className="promo-bar-text">
            {promoText}
          </p>

          {promoCountdownActive && timeLeft && !timeLeft.isExpired && (
            <div className="promo-timer-group" title="Offer ends in">
              <Timer size={13} className="promo-timer-icon" />
              <div className="promo-timer-digits">
                {timeLeft.days > 0 && (
                  <>
                    <span className="timer-unit">
                      <strong>{String(timeLeft.days).padStart(2, "0")}</strong>d
                    </span>
                    <span className="timer-sep">:</span>
                  </>
                )}
                <span className="timer-unit">
                  <strong>{String(timeLeft.hours).padStart(2, "0")}</strong>h
                </span>
                <span className="timer-sep">:</span>
                <span className="timer-unit">
                  <strong>{String(timeLeft.minutes).padStart(2, "0")}</strong>m
                </span>
                <span className="timer-sep">:</span>
                <span className="timer-unit">
                  <strong>{String(timeLeft.seconds).padStart(2, "0")}</strong>s
                </span>
              </div>
            </div>
          )}

          <Link href={promoLink} className="promo-bar-btn">
            <span>{promoButtonText}</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <button
          type="button"
          className="promo-bar-close"
          onClick={handleDismiss}
          aria-label="Dismiss promotional bar"
        >
          <X size={14} />
        </button>
      </div>
    </aside>
  );
}

