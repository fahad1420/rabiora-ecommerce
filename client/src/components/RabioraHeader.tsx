import { Heart, LogIn, Menu, Moon, Search, ShieldCheck, ShoppingCart, Sun, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

type RabioraHeaderProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  cartCount: number;
  wishlistCount?: number;
};

const logoUrl = "/uploads/images/branding/rabiora-logo.jpeg";

export function RabioraHeader({ searchValue = "", onSearchChange, cartCount, wishlistCount = 0 }: RabioraHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t, toggleLanguage } = useLanguage();
  const customer = trpc.customer.me.useQuery();
  const isLoggedIn = Boolean(customer.data);
  const isAdmin = customer.data?.role === "admin";
  const accountLabel = customer.data?.name?.trim() || (isLoggedIn ? "Account" : "Login");

  useEffect(() => {
    if (!drawerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  return <>
    <div className="announcement"><span className="announcement-copy">{t("freeDelivery")}</span><span aria-hidden="true">|</span><span className="announcement-copy">{t("premiumCollection")}</span><span aria-hidden="true">|</span><span className="announcement-copy">{t("codAvailable")}</span></div>
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
          <label className="search-box" aria-label="Search products">
            <input value={searchValue} onChange={(event) => onSearchChange?.(event.target.value)} placeholder={t("search")} />
            <Search size={18} aria-hidden="true" />
          </label>
          <button type="button" className="header-utility language-toggle" aria-label={t("languageLabel")} onClick={toggleLanguage}>{t("language")}</button>
          <button type="button" className="header-utility theme-toggle" aria-label={t("themeLabel")} onClick={toggleTheme}>{theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}<span className="utility-label">{theme === "dark" ? t("lightMode") : t("darkMode")}</span></button>
          <Link href={isLoggedIn ? "/account" : "/login"} className="header-account-button" aria-label={isLoggedIn ? "Account" : "Login"}>
            {isLoggedIn ? <UserRound size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
            <span className="header-account-label">{accountLabel}</span>
          </Link>
          {isAdmin && <Link href="/admin" className="header-admin-link" aria-label="Admin dashboard"><ShieldCheck size={15} aria-hidden="true" /><span>Admin</span></Link>}
          <a className="header-icon" href="/wishlist" aria-label={t("wishlist")}>
            <Heart size={22} />
            <span>{wishlistCount}</span>
          </a>
          <a className="header-icon" href="/cart" aria-label={t("cart", { count: cartCount })}>
            <ShoppingCart size={22} />
            <span>{cartCount}</span>
          </a>
          <button className="menu-button" type="button" aria-label={t("openNavigation")} aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}><Menu size={25} /></button>
        </div>
      </div>
    </header>
    {drawerOpen && <>
      <button className="drawer-overlay" onClick={closeDrawer} aria-label={t("closeNavigation")} />
      <aside className="mobile-drawer" aria-label="Mobile navigation">
        <button className="drawer-close" onClick={closeDrawer} aria-label={t("closeNavigation")}><X size={30} /></button>
        <nav>
          <a href="/#home" onClick={closeDrawer}>{t("home")}</a>
          <a href="/#products" onClick={closeDrawer}>{t("products")}</a>
          <a href="/#reviews" onClick={closeDrawer}>{t("reviews")}</a>
          <a href="/#about" onClick={closeDrawer}>{t("about")}</a>
          <a href="/#contact" onClick={closeDrawer}>{t("contact")}</a>
          <Link href={isLoggedIn ? "/account" : "/login"} onClick={closeDrawer} className="mobile-account-link">
            {isLoggedIn ? <UserRound size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
            <span>{isLoggedIn ? (customer.data?.name?.trim() || "Account") : "Login"}</span>
          </Link>
          {isAdmin && <Link href="/admin" onClick={closeDrawer} className="mobile-admin-link"><ShieldCheck size={17} aria-hidden="true" /><span>Admin</span></Link>}
        </nav>
        <div className="drawer-preferences"><button type="button" onClick={toggleLanguage}>{t("language")}</button><button type="button" onClick={toggleTheme}>{theme === "dark" ? t("lightMode") : t("darkMode")}</button></div>
      </aside>
    </>}
  </>;
}
