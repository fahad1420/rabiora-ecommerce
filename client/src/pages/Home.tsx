import { Award, ChevronUp, HeartHandshake, Headphones, Search, Shirt, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { trpc } from "@/lib/trpc";

const paymentMethods = [
  ["/manus-storage/bkash_1a854c02.jpg", "bKash"],
  ["/manus-storage/nagad_60c09914.png", "Nagad"],
  ["/manus-storage/rocket_d3c48a42.png", "Rocket"],
  ["/manus-storage/cod_f2ee44d0.jpg", "Cash On Delivery"],
] as const;

export default function Home() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "featured">("all");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const productsQuery = trpc.catalogue.list.useQuery({ query: search || undefined, featured: filter === "featured" ? true : undefined });
  const featuredQuery = trpc.catalogue.list.useQuery({ featured: true });

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const carouselImages = useMemo(() => {
    const images = (featuredQuery.data ?? []).flatMap((product) => product.images.slice(0, 2));
    return [...images, ...images];
  }, [featuredQuery.data]);
  const addCart = (productId: number) => cart.add(productId);

  return <div className="page-shell">
    <RabioraHeader searchValue={search} onSearchChange={setSearch} cartCount={cart.count} wishlistCount={wishlist.count} />
    <main>
      <section className="hero" id="home">
        <div className="container hero-content">
          <div className="hero-text">
            <span className="badge">Premium Collection</span>
            <h1>Elegant Pakistani<br />Three Piece Collection</h1>
            <p>Discover exclusive Pakistani Three Piece with premium cotton fabric, luxury finishing, and modern elegance.</p>
            <div className="hero-buttons"><a href="#products" className="btn">Shop Now</a><a href="#contact" className="btn-outline">Contact</a></div>
          </div>
          <div className="hero-image" aria-hidden="true" />
        </div>
      </section>
      <section className="featured-section">
        <div className="container">
          <div className="section-title"><span>Featured Collection</span><h2>Our Best Selling Collection</h2><p>Discover our premium Pakistani Three Piece collection, carefully selected for elegance and comfort.</p></div>
          <div className="featured-slider">
            <div className="featured-track">{carouselImages.map((image, index) => <img src={image.storageUrl} alt={image.altText} key={`${image.storageUrl}-${index}`} />)}</div>
          </div>
        </div>
      </section>
      <section id="products" className="products">
        <div className="container">
          <div className="section-title"><span>Latest Collection</span><h2>All Pakistani Three Piece</h2><p>Premium quality Pakistani Three Piece for every occasion.</p></div>
          <div className="product-filter"><button className={filter === "all" ? "active" : ""} type="button" onClick={() => setFilter("all")}>All Products</button><button className={filter === "featured" ? "active" : ""} type="button" onClick={() => setFilter("featured")}>Featured</button></div>
          {productsQuery.isLoading ? <div className="catalogue-state">Loading collection...</div> : productsQuery.isError ? <div className="catalogue-state">The collection is temporarily unavailable.</div> : <div className="products-grid">{productsQuery.data?.map((product) => <ProductCard key={product.id} product={product} onAddCart={addCart} onToggleWishlist={(id) => wishlist.toggle(id)} wishlisted={wishlist.ids.includes(product.id)} />)}</div>}
        </div>
      </section>
      <section className="why-us"><div className="container"><div className="section-title"><span>Why Rabiora?</span><h2>Why Customers Love Us</h2></div><div className="why-grid"><WhyCard icon={<Shirt />} title="Premium Fabric" text="High-quality Pakistani cotton fabric with elegant finishing." /><WhyCard icon={<Truck />} title="Fast Delivery" text="Quick delivery across Bangladesh with Cash on Delivery." /><WhyCard icon={<Award />} title="Trusted Quality" text="Every dress is carefully selected before delivery." /><WhyCard icon={<Headphones />} title="24/7 Support" text="Friendly customer support whenever you need help." /></div></div></section>
      <section id="reviews" className="reviews"><div className="container"><div className="section-title"><span>Customer Reviews</span><h2>What Our Customers Say</h2></div><div className="reviews-empty"><HeartHandshake size={32} /><p>Verified customer reviews will be shared here as they become available.</p></div></div></section>
      <section id="about" className="about"><div className="container"><div className="section-title"><span>About Rabiora</span><h2>Premium Pakistani Three Piece Store</h2></div><p>Rabiora is committed to providing premium quality Pakistani Three Piece collections with elegant designs, comfortable fabrics, and affordable prices. Our mission is to deliver trusted fashion with excellent customer service.</p></div></section>
      <section className="payment"><div className="container"><div className="section-title"><span>Payment Methods</span><h2>Easy Payment</h2></div><div className="payment-grid">{paymentMethods.map(([src, alt]) => <img src={src} alt={alt} key={alt} />)}</div></div></section>
      <section id="contact" className="contact"><div className="container"><div className="section-title"><span>Contact</span><h2>Get In Touch</h2></div><div className="contact-info"><p><strong>Address:</strong> Mirerbazar, Tongi, Gazipur, Dhaka, Bangladesh</p><p><strong>Phone:</strong> +8801349529274</p><p><strong>Email:</strong> rabiora001@gmail.com</p></div><div className="social-links"><a href="https://www.facebook.com/profile.php?id=61588852721335" target="_blank" rel="noreferrer" aria-label="Facebook">f</a><a href="https://www.instagram.com/rabiora001" target="_blank" rel="noreferrer" aria-label="Instagram">◎</a><a href="https://www.tiktok.com/@rabiora01" target="_blank" rel="noreferrer" aria-label="TikTok">♪</a></div></div></section>
    </main>
    {showBackToTop && <button className="back-to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top"><ChevronUp size={21} /></button>}
    <RabioraFooter />
  </div>;
}

function WhyCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article className="why-card"><div className="why-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>;
}
