import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, ShoppingBag, Heart, Search, User, ShieldAlert } from "lucide-react";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { trpc } from "@/lib/trpc";
import { MobileSearchModal } from "./MobileSearchModal";

export function MobileNavbar() {
  const [location] = useLocation();
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const customer = trpc.customer.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  if (location.startsWith("/admin")) {
    return null;
  }

  const isAdmin = customer.data?.role === "admin";

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <div className="mobile-nav-pill">
          {/* Home */}
          <Link
            href="/"
            onClick={(e) => {
              if (location === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className={`mobile-nav-item ${location === "/" ? "active" : ""}`}
            aria-label="Home"
          >
            <Home size={20} strokeWidth={location === "/" ? 2.4 : 1.8} />
            <span>Home</span>
          </Link>

          {/* Search Trigger */}
          <button
            type="button"
            className="mobile-nav-item"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search Catalogue"
          >
            <Search size={20} strokeWidth={1.8} />
            <span>Search</span>
          </button>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className={`mobile-nav-item ${location === "/wishlist" ? "active" : ""}`}
            aria-label={`Wishlist with ${wishlist.count} items`}
          >
            <div className="nav-icon-badge-wrap">
              <Heart size={20} strokeWidth={location === "/wishlist" ? 2.4 : 1.8} />
              {wishlist.count > 0 && (
                <span className="mobile-nav-badge">{wishlist.count}</span>
              )}
            </div>
            <span>Wishlist</span>
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className={`mobile-nav-item ${location === "/cart" ? "active" : ""}`}
            aria-label={`Shopping Bag with ${cart.count} items`}
          >
            <div className="nav-icon-badge-wrap">
              <ShoppingBag size={20} strokeWidth={location === "/cart" ? 2.4 : 1.8} />
              {cart.count > 0 && (
                <span className="mobile-nav-badge cart-badge-highlight">{cart.count}</span>
              )}
            </div>
            <span>Bag</span>
          </Link>

          {/* Account / Admin */}
          {isAdmin ? (
            <Link
              href="/admin"
              className={`mobile-nav-item ${location.startsWith("/admin") ? "active" : ""}`}
              aria-label="Admin Dashboard"
            >
              <ShieldAlert size={20} strokeWidth={location.startsWith("/admin") ? 2.4 : 1.8} />
              <span>Admin</span>
            </Link>
          ) : (
            <Link
              href={customer.data ? "/account" : "/login"}
              className={`mobile-nav-item ${
                location === "/account" || location === "/login" ? "active" : ""
              }`}
              aria-label="Customer Account"
            >
              <User
                size={20}
                strokeWidth={location === "/account" || location === "/login" ? 2.4 : 1.8}
              />
              <span>{customer.data ? "Account" : "Sign In"}</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Instant Search Drawer */}
      <MobileSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
