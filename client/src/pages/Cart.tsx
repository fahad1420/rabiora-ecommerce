import { Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";

const taka = (amount: number) => `৳${amount.toLocaleString("en-BD")}`;

export default function Cart() {
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />
    <main className="cart-page"><div className="container"><div className="section-title"><span>Your Cart</span><h2>Shopping Cart</h2></div>
      {cart.isLoading ? <div className="catalogue-state">Loading your cart...</div> : cart.items.length === 0 ? <div className="empty-cart"><h2>Your Cart is Empty</h2><p>Add your favorite Pakistani Three Piece.</p><Link href="/" className="btn">Continue Shopping</Link></div> : <>
        <div className="cart-items">{cart.items.map((item) => <article className="cart-item" key={item.productId}>{item.imageUrl && <img src={item.imageUrl} alt={item.name} />}<div className="cart-info"><h3>{item.name}</h3><p>{taka(item.priceTaka)}</p><div className="qty-box"><button aria-label="Decrease quantity" disabled={cart.isMutating} onClick={() => cart.update(item.productId, item.quantity - 1)}><Minus size={15} /></button><span>{item.quantity}</span><button aria-label="Increase quantity" disabled={cart.isMutating || item.quantity >= item.stockQuantity} onClick={() => cart.update(item.productId, item.quantity + 1)}><Plus size={15} /></button></div><h4>{taka(item.lineTotalTaka)}</h4><button className="remove-btn" disabled={cart.isMutating} onClick={() => cart.update(item.productId, 0)}><Trash2 size={15} /> Remove</button></div></article>)}</div>
        <div className="cart-summary"><h3>Subtotal: <span>{taka(cart.subtotalTaka)}</span></h3><p>Delivery charge will be confirmed during checkout.</p><Link href="/checkout" className="btn">Place Order</Link></div>
      </>}
    </div></main><RabioraFooter /></div>;
}
