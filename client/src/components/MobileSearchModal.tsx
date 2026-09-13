import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, ArrowRight, Package } from "lucide-react";
import { Link, useLocation } from "wouter";
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
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = "";
      setSearchTerm("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    if (!catalogue.data || !searchTerm.trim()) return [];
    const term = searchTerm.trim().toLowerCase();
    return catalogue.data
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(term) ||
          p.fabric.toLowerCase().includes(term) ||
          p.color.toLowerCase().includes(term) ||
          p.categoryName?.toLowerCase().includes(term) ||
          p.details.toLowerCase().includes(term)
        );
      })
      .slice(0, 8);
  }, [catalogue.data, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="mobile-search-backdrop" onClick={onClose}>
      <div
        className="mobile-search-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search Rabiora Catalogue"
      >
        <div className="mobile-search-header">
          <div className="mobile-search-input-box">
            <Search size={18} className="search-icon-inside" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search three-piece suits, lawn, silk..."
              className="mobile-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm("")}
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

        {/* Quick Tag Pills */}
        {!searchTerm.trim() && (
          <div className="mobile-search-suggestions">
            <span className="search-hint-label">Popular Searches:</span>
            <div className="search-tags-row">
              {["Lawn Collection", "Pakistani Three Piece", "Pure Cotton", "Silk", "Party Wear"].map(
                (tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="search-tag-chip"
                    onClick={() => setSearchTerm(tag)}
                  >
                    {tag}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="mobile-search-results">
          {searchTerm.trim() && filteredProducts.length === 0 ? (
            <div className="search-empty-state">
              <Package size={36} opacity={0.5} />
              <p>No collections found matching "{searchTerm}"</p>
              <small>Try searching by color (Black, Red, Green) or fabric (Lawn, Cotton, Silk).</small>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const coverImg =
                product.images.find((img) => img.isCover)?.storageUrl ||
                product.images[0]?.storageUrl ||
                "";
              return (
                <div
                  key={product.id}
                  className="search-result-item"
                  onClick={() => {
                    onClose();
                    setLocation(`/products/${product.slug}`);
                  }}
                >
                  <img
                    src={coverImg}
                    alt={product.name}
                    className="search-result-thumb"
                    loading="lazy"
                  />
                  <div className="search-result-info">
                    <span className="search-result-category">{product.categoryName || "Pakistani Collection"}</span>
                    <strong className="search-result-title">{product.name}</strong>
                    <div className="search-result-pricing">
                      <span className="search-price">{taka(product.priceTaka)}</span>
                      {product.oldPriceTaka && product.oldPriceTaka > product.priceTaka && (
                        <span className="search-old-price">{taka(product.oldPriceTaka)}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={16} className="search-result-arrow" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

