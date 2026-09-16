import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, ArrowRight, Package, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const taka = (v: number) => `৳${v.toLocaleString("en-BD")}`;

export function MobileSearchModal({ isOpen, onClose }: MobileSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const catalogue = trpc.catalogue.list.useQuery(undefined, {
    staleTime: 1000 * 60 * 3,
  });

  useEffect(() => {
    if (isOpen) {
      // Prevent body scrolling while modal is open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      
      // Auto-focus input with safe timeout for iOS keyboard
      const focusTimer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);

      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(focusTimer);
      };
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    if (!catalogue.data || !searchTerm.trim()) return [];
    const term = searchTerm.trim().toLowerCase();
    return catalogue.data
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(term) ||
          (p.fabric && p.fabric.toLowerCase().includes(term)) ||
          (p.color && p.color.toLowerCase().includes(term)) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(term)) ||
          (p.details && p.details.toLowerCase().includes(term)) ||
          (p.sku && p.sku.toLowerCase().includes(term))
        );
      })
      .slice(0, 15);
  }, [catalogue.data, searchTerm]);

  const handleProductSelect = (product: any) => {
    onClose();
    setLocation(`/products/${product.slug || product.id}`);
  };

  if (!isOpen) return null;

  return (
    <div className="mobile-search-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search Catalogue">
      <div
        className="mobile-search-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Header Bar */}
        <div className="mobile-search-header">
          <div className="mobile-search-input-box">
            <Search size={18} className="search-icon-inside" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search three-piece, lawn, silk, cotton..."
              className="mobile-search-input"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchTerm("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear query"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            className="mobile-search-close-btn"
            onClick={onClose}
            aria-label="Close search"
          >
            Cancel
          </button>
        </div>

        {/* Quick Search Tag Chips */}
        {!searchTerm.trim() && (
          <div className="mobile-search-suggestions">
            <div className="search-hint-header">
              <Sparkles size={14} className="text-amber-400" />
              <span className="search-hint-label">Popular Searches:</span>
            </div>
            <div className="search-tags-row">
              {[
                "Pakistani Three Piece",
                "Luxury Lawn",
                "Pure Cotton",
                "Silk & Organza",
                "Embroidered",
                "Party Wear",
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="search-tag-chip"
                  onClick={() => setSearchTerm(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Search Results List */}
        <div className="mobile-search-results">
          {searchTerm.trim() && filteredProducts.length === 0 ? (
            <div className="search-empty-state">
              <Package size={40} className="empty-icon" />
              <p className="empty-title">No collections found matching "{searchTerm}"</p>
              <p className="empty-subtitle">
                Try searching by fabric (Lawn, Cotton, Silk), color (Black, Red, Pink), or collection name.
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const coverImg =
                product.images?.find((img: any) => img.isCover)?.storageUrl ||
                product.images?.[0]?.storageUrl ||
                "";
              const inStock = product.isInStock !== false && (product.stockQuantity === undefined || product.stockQuantity > 0);

              return (
                <article
                  key={product.id}
                  className="search-result-item"
                  onClick={() => handleProductSelect(product)}
                >
                  {coverImg ? (
                    <img
                      src={coverImg}
                      alt={product.name}
                      className="search-result-thumb"
                      loading="lazy"
                    />
                  ) : (
                    <div className="search-result-thumb-fallback">No Img</div>
                  )}

                  <div className="search-result-info">
                    <div className="search-result-category-row">
                      <span className="search-result-category">
                        {product.categoryName || "Pakistani Collection"}
                      </span>
                      <span className={`search-stock-tag ${inStock ? "in-stock" : "out-of-stock"}`}>
                        {inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>

                    <h4 className="search-result-title">{product.name}</h4>

                    <div className="search-result-pricing">
                      <span className="search-price">{taka(product.priceTaka)}</span>
                      {product.oldPriceTaka && product.oldPriceTaka > product.priceTaka && (
                        <span className="search-old-price">{taka(product.oldPriceTaka)}</span>
                      )}
                      {product.discountPercent > 0 && (
                        <span className="search-discount-badge">-{product.discountPercent}%</span>
                      )}
                    </div>
                  </div>

                  <ArrowRight size={18} className="search-result-arrow" aria-hidden="true" />
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
