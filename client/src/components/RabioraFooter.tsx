import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ChevronDown,
  ChevronUp,
  Github,
  Linkedin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";

export function RabioraFooter() {
  const { t } = useLanguage();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    about: false,
    categories: false,
    customerService: false,
    more: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <footer className="rabiora-footer">
      <div className="container footer-main">
        {/* Accordion 1: About Us */}
        <div className={`footer-accordion-item ${openSections.about ? "is-open" : ""}`}>
          <button
            type="button"
            className="footer-accordion-header"
            onClick={() => toggleSection("about")}
            aria-expanded={openSections.about}
          >
            <span>ABOUT US</span>
            <span className="accordion-arrow">
              {openSections.about ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>
          <div className="footer-accordion-content">
            <div className="footer-about-summary">
              <div className="footer-brand-title">
                <img
                  src="/uploads/images/branding/rabiora-logo.jpeg"
                  alt="Rabiora"
                  className="footer-logo-img"
                  loading="lazy"
                />
                <strong>RABIORA</strong>
              </div>
              <p>
                Rabiora is Bangladesh's premier destination for authentic, handcrafted Pakistani Three-Piece collections. Crafted with elegance, comfort, and confidence in every stitch.
              </p>
            </div>
          </div>
        </div>

        {/* Accordion 2: Categories */}
        <div className={`footer-accordion-item ${openSections.categories ? "is-open" : ""}`}>
          <button
            type="button"
            className="footer-accordion-header"
            onClick={() => toggleSection("categories")}
            aria-expanded={openSections.categories}
          >
            <span>CATEGORIES</span>
            <span className="accordion-arrow">
              {openSections.categories ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>
          <div className="footer-accordion-content">
            <ul className="footer-links-list">
              <li><a href="/#products">Pakistani Three Piece</a></li>
              <li><a href="/#products">Luxury Lawn Collection</a></li>
              <li><a href="/#products">Pure Cotton Three Piece</a></li>
              <li><a href="/#products">Festive Silk & Organza</a></li>
              <li><a href="/#products">Casual Summer Wear</a></li>
            </ul>
          </div>
        </div>

        {/* Accordion 3: Customer Service */}
        <div className={`footer-accordion-item ${openSections.customerService ? "is-open" : ""}`}>
          <button
            type="button"
            className="footer-accordion-header"
            onClick={() => toggleSection("customerService")}
            aria-expanded={openSections.customerService}
          >
            <span>CUSTOMER SERVICE</span>
            <span className="accordion-arrow">
              {openSections.customerService ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>
          <div className="footer-accordion-content">
            <ul className="footer-links-list">
              <li><Link href="/customer-service/contact">1. Contact Us</Link></li>
              <li><Link href="/customer-service/returns">2. Return & Exchange</Link></li>
              <li><Link href="/customer-service/how-to-order">3. How to Order</Link></li>
              <li><Link href="/customer-service/fabric-care">4. Fabric Care</Link></li>
              <li><Link href="/customer-service/payment">5. Billing & Payment</Link></li>
              <li><Link href="/customer-service/shipping">6. Shipping & Delivery</Link></li>
              <li><Link href="/customer-service/track-order">7. Track Your Order</Link></li>
              <li><Link href="/customer-service/faq">8. FAQ</Link></li>
            </ul>
          </div>
        </div>

        {/* Accordion 4: More / Legal */}
        <div className={`footer-accordion-item ${openSections.more ? "is-open" : ""}`}>
          <button
            type="button"
            className="footer-accordion-header"
            onClick={() => toggleSection("more")}
            aria-expanded={openSections.more}
          >
            <span>MORE</span>
            <span className="accordion-arrow">
              {openSections.more ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>
          <div className="footer-accordion-content">
            <ul className="footer-links-list">
              <li><Link href="/terms">1. Terms & Conditions</Link></li>
              <li><Link href="/privacy">2. Privacy Policy</Link></li>
              <li><Link href="/account">Customer Account</Link></li>
              <li><Link href="/cart">Shopping Bag</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Social & Contact Bar */}
      <div className="container footer-social-bar">
        <div className="footer-social-wrapper">
          <span className="social-label">Connect With Us:</span>
          <div className="social-icon-row">
            {/* WhatsApp */}
            <a
              href="https://wa.me/8801349529274"
              target="_blank"
              rel="noopener noreferrer"
              className="social-pill whatsapp"
              aria-label="Chat on WhatsApp (+8801349529274)"
              title="WhatsApp: +8801349529274"
            >
              <Phone size={15} />
              <span>WhatsApp</span>
            </a>

            {/* Messenger */}
            <a
              href="https://www.facebook.com/share/14wjzGNSqz8/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="social-pill messenger"
              aria-label="Message on Facebook Messenger"
              title="Facebook Messenger"
            >
              <MessageCircle size={15} />
              <span>Messenger</span>
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/share/14wjzGNSqz8/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon facebook"
              aria-label="Rabiora Facebook"
              title="Facebook"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon instagram"
              aria-label="Rabiora Instagram"
              title="Instagram"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon tiktok"
              aria-label="Rabiora TikTok"
              title="TikTok"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 00-.88-.06A6.34 6.34 0 003 15.68a6.34 6.34 0 0010.82 4.47 6.26 6.26 0 001.87-4.47V8.75a8.28 8.28 0 004.9 1.58V6.89a4.8 4.8 0 01-1-.2z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Copyright & Dev */}
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Rabiora. {t("allRightsReserved")}</p>
        <p>
          {t("designedDevelopedBy")} <strong>Fahad Hossain</strong>
        </p>
        <div className="developer-links" aria-label="Developer profiles">
          <a
            href="https://github.com/fahad1420"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fahad Hossain on GitHub"
            title="GitHub"
          >
            <Github size={14} strokeWidth={1.9} aria-hidden="true" />
          </a>
          <a
            href="https://www.linkedin.com/in/fahad-hossain1420"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fahad Hossain on LinkedIn"
            title="LinkedIn"
          >
            <Linkedin size={14} strokeWidth={1.9} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
