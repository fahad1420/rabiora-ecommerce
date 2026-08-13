import { Heart } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { trpc } from "@/lib/trpc";

export default function Wishlist() {
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const catalogue = trpc.catalogue.list.useQuery();
  const products = (catalogue.data ?? []).filter((product) => wishlist.ids.includes(product.id));
  return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />
    <main className="products wishlist-page"><div className="container"><div className="section-title"><span>Your Wishlist</span><h2>Saved Favorites</h2></div>
      {products.length === 0 ? <div className="empty-cart"><Heart size={30} /><h2>Your Wishlist is Empty</h2><p>Save the pieces you love and come back to them anytime.</p></div> : <div className="products-grid">{products.map((product) => <ProductCard key={product.id} product={product} onAddCart={(id) => cart.add(id)} onToggleWishlist={(id) => wishlist.toggle(id)} wishlisted />)}</div>}
    </div></main><RabioraFooter /></div>;
}
