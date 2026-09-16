import { Heart, LogIn, Menu, Moon, Search, ShieldCheck, ShoppingCart, Sun, User, UserCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { MobileSearchModal } from "./MobileSearchModal";
import { PromotionalCountdownBar } from "./PromotionalCountdownBar";

type RabioraHeaderProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  cartCount: number;
  wishlistCount?: number;
};

const logoUrl = "/uploads/images/branding/rabiora-logo.jpeg";

export function RabioraHeader({ searchValue = "", onSearchChange, cartCount, wishlistCount = 0 }: RabioraHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t, toggleLanguage } = useLanguage();
  const customer = trpc.customer.me.useQuery();
  const isLoggedIn = Boolean(customer.data);
  const isAdmin = customer.data?.role === "admin";
  const accountTooltip = customer.data?.name?.trim() || (isLoggedIn ? "My Account" : "Sign In");

  useEffect(() => {
    if (!drawerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  const announcementsQuery = trpc.announcements.list.useQuery();
  const announcements = announcementsQuery.data || [];
  const defaultAnnouncements = [
    { id: "def-1", text: t("freeDelivery") || "Free Delivery Inside Dhaka City", link: "/#products" },
    { id: "def-2", text: t("premiumCollection") || "100% Authentic Handcrafted Pakistani Three Piece", link: "/#products" },
    { id: "def-3", text: t("codAvailable") || "Cash on Delivery Available Nationwide in Bangladesh", link: "/#products" },
  ];
  const activeAnnouncements = announcements.length > 0 ? announcements : defaultAnnouncements;

  // Triplicate items for a completely seamless, continuous, right-to-left marquee loop
  const marqueeItems = [...activeAnnouncements, ...activeAnnouncements, ...activeAnnouncements];

  return (
    <>
      <PromotionalCountdownBar />

      {/* Continuous Right-to-Left Announcement Marquee Bar */}
      <div className="announcement single-line-announcement" aria-label="Announcements">
        <div className="announcement-marquee-container">
          <div className="announcement-marquee-track">
            {marqueeItems.map((item, idx) => (
              <span key={`${item.id || "ann"}-${idx}`} className="announcement-marquee-item">
                {item.link ? (
                  <a href={item.link} className="announcement-copy announcement-link">
                    {item.text}
                  </a>
                ) : (
                  <span className="announcement-copy">{item.text}</span>
                )}
                <span className="announcement-marquee-separator" aria-hidden="true">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <header className="rabiora-header">
        <div className="container header-inner">
          <Link href="/" className="rabiora-logo" aria-label="Rabiora home">
            <img src={logoUrl} alt="Rabiora" />
            <span>Rabiora</span>
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="/#home">{t("home")}</a>
            <a href="/#products">{t("products")}</a>
            <a href="/#reviews">{t("reviews")}</a>
            <a href="/#about">{t("about")}</a>
            <a href="/#contact">{t("contact")}</a>
          </nav>

          <div className="header-actions">
            {/* Desktop Search Input Box */}
            <label className="search-box desktop-only-action" aria-label="Search products">
              <input
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder={t("search")}
              />
              <Search size={18} aria-hidden="true" />
            </label>

            {/* Mobile Header Quick Search Icon Trigger */}
            <button
              type="button"
              className="header-icon mobile-search-header-trigger"
              aria-label="Open Search"
              onClick={() => setIsSearchModalOpen(true)}
            >
              <Search size={20} />
            </button>

            <button
              type="button"
              className="header-utility language-toggle"
              aria-label={t("languageLabel")}
              onClick={toggleLanguage}
            >
              {t("language")}
            </button>

            <button
              type="button"
              className="header-utility theme-toggle"
              aria-label={t("themeLabel")}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
              <span className="utility-label">{theme === "dark" ? t("lightMode") : t("darkMode")}</span>
            </button>

            <Link
              href={isLoggedIn ? "/account" : "/login"}
              className={`header-user-icon-btn desktop-only-action ${isLoggedIn ? "logged-in" : ""}`}
              aria-label={accountTooltip}
              title={accountTooltip}
            >
              {isLoggedIn ? (
                <UserCheck size={20} className="user-icon active" aria-hidden="true" />
              ) : (
                <User size={20} className="user-icon" aria-hidden="true" />
              )}
            </Link>

            {isAdmin && (
              <Link href="/admin" className="header-admin-link" aria-label="Admin dashboard" title="Admin Dashboard">
                <ShieldCheck size={16} aria-hidden="true" />
                <span className="admin-badge-text">Admin</span>
              </Link>
            )}

            <Link href="/wishlist" className="header-icon desktop-only-action" aria-label={t("wishlist")}>
              <Heart size={21} />
              {wishlistCount > 0 && <span>{wishlistCount}</span>}
            </Link>

            <Link href="/cart" className="header-icon desktop-only-action" aria-label={t("cart", { count: cartCount })}>
              <ShoppingCart size={21} />
              {cartCount > 0 && <span>{cartCount}</span>}
            </Link>

            <button
              className="menu-button"
              type="button"
              aria-label={t("openNavigation")}
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Instant Search Modal */}
      <MobileSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {drawerOpen && (
        <>
          <button className="drawer-overlay" onClick={closeDrawer} aria-label={t("closeNavigation")} />
          <aside className="mobile-drawer" aria-label="Mobile navigation">
            <button className="drawer-close" onClick={closeDrawer} aria-label={t("closeNavigation")}>
              <X size={26} />
            </button>
            <nav>
              <a href="/#home" onClick={closeDrawer}>{t("home")}</a>
              <a href="/#products" onClick={closeDrawer}>{t("products")}</a>
              <a href="/#reviews" onClick={closeDrawer}>{t("reviews")}</a>
              <a href="/#about" onClick={closeDrawer}>{t("about")}</a>
              <a href="/#contact" onClick={closeDrawer}>{t("contact")}</a>
              <Link href={isLoggedIn ? "/account" : "/login"} onClick={closeDrawer} className="mobile-account-link">
                {isLoggedIn ? <UserCheck size={18} aria-hidden="true" /> : <User size={18} aria-hidden="true" />}
                <span>{isLoggedIn ? (customer.data?.name?.trim() || "My Account") : "Sign In"}</span>
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={closeDrawer} className="mobile-admin-link">
                  <ShieldCheck size={17} aria-hidden="true" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </nav>
            <div className="drawer-preferences">
              <button type="button" onClick={toggleLanguage}>{t("language")}</button>
              <button type="button" onClick={toggleTheme}>{theme === "dark" ? t("lightMode") : t("darkMode")}</button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
