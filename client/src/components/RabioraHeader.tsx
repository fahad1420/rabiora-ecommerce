import { Heart, Menu, Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

type RabioraHeaderProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  cartCount: number;
  wishlistCount?: number;
};

const logoUrl = "/manus-storage/profile_5d5f756e.jpeg";

export function RabioraHeader({ searchValue = "", onSearchChange, cartCount, wishlistCount = 0 }: RabioraHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  return <>
    <div className="announcement">Free Delivery Inside Dhaka <span>|</span> Premium Pakistani Three Piece Collection <span>|</span> Cash On Delivery Available</div>
    <header className="rabiora-header">
      <div className="container header-inner">
        <Link href="/" className="rabiora-logo" aria-label="Rabiora home">
          <img src={logoUrl} alt="Rabiora" />
          <span>Rabiora</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="/#home">Home</a>
          <a href="/#products">Products</a>
          <a href="/#reviews">Reviews</a>
          <a href="/#about">About</a>
          <a href="/#contact">Contact</a>
        </nav>
        <div className="header-actions">
          <label className="search-box" aria-label="Search products">
            <input value={searchValue} onChange={(event) => onSearchChange?.(event.target.value)} placeholder="Search..." />
            <Search size={18} aria-hidden="true" />
          </label>
          <a className="header-icon" href="/wishlist" aria-label="Wishlist">
            <Heart size={22} />
            <span>{wishlistCount}</span>
          </a>
          <a className="header-icon" href="/cart" aria-label={`Cart with ${cartCount} items`}>
            <ShoppingCart size={22} />
            <span>{cartCount}</span>
          </a>
          <button className="menu-button" type="button" aria-label="Open navigation" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}><Menu size={25} /></button>
        </div>
      </div>
    </header>
    {drawerOpen && <>
      <button className="drawer-overlay" onClick={closeDrawer} aria-label="Close navigation" />
      <aside className="mobile-drawer" aria-label="Mobile navigation">
        <button className="drawer-close" onClick={closeDrawer} aria-label="Close navigation"><X size={30} /></button>
        <nav>
          <a href="/#home" onClick={closeDrawer}>Home</a>
          <a href="/#products" onClick={closeDrawer}>Products</a>
          <a href="/#reviews" onClick={closeDrawer}>Reviews</a>
          <a href="/#about" onClick={closeDrawer}>About</a>
          <a href="/#contact" onClick={closeDrawer}>Contact</a>
        </nav>
      </aside>
    </>}
  </>;
}
