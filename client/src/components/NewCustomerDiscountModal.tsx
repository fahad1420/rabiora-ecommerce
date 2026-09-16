import { Check, Copy, Gift, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export function NewCustomerDiscountModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const customer = trpc.customer.me.useQuery();

  useEffect(() => {
    // Only show if not seen in this session and not permanently dismissed
    const seen = sessionStorage.getItem("rabiora_welcome_discount_seen");
    if (!seen && !customer.data) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [customer.data]);

  const handleClose = () => {
    sessionStorage.setItem("rabiora_welcome_discount_seen", "true");
    setIsOpen(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen || customer.data) return null;

  const promoCode = "WELCOME10";

  return (
    <div className="welcome-modal-backdrop" onClick={handleClose}>
      <div
        className="welcome-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome Discount Offer"
      >
        <button
          type="button"
          className="welcome-modal-close"
          onClick={handleClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="welcome-modal-badge">
          <Sparkles size={14} className="sparkle-icon" />
          <span>EXCLUSIVE WELCOME OFFER</span>
        </div>

        <div className="welcome-modal-icon-wrap">
          <Gift size={36} />
        </div>

        <h2>Get 10% OFF Your First Order</h2>
        <p className="welcome-modal-desc">
          Sign up or log in to unlock an exclusive 10% discount on authentic luxury Pakistani Three-Piece collections.
        </p>

        <div className="welcome-promo-box">
          <span className="welcome-promo-label">Use Coupon Code:</span>
          <div className="welcome-promo-code-row">
            <strong className="welcome-promo-code">{promoCode}</strong>
            <button
              type="button"
              className="welcome-copy-btn"
              onClick={() => handleCopyCode(promoCode)}
            >
              {copied ? (
                <>
                  <Check size={14} /> Copied
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="welcome-modal-actions">
          <Link
            href="/login?redirect=/"
            className="btn btn-luxury-primary welcome-signin-btn"
            onClick={handleClose}
          >
            Sign In / Register to Claim
          </Link>
          <button
            type="button"
            className="welcome-skip-btn"
            onClick={handleClose}
          >
            Maybe Later • Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}

