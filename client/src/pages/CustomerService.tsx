import { useState } from "react";
import { Link, useRoute } from "wouter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { RabioraFooter } from "@/components/RabioraFooter";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import {
  ArrowLeft,
  CreditCard,
  Headphones,
  HelpCircle,
  PackageCheck,
  RefreshCw,
  Search,
  Send,
  Shirt,
  ShoppingBag,
  Truck,
} from "lucide-react";

const topics = [
  { id: "contact", label: "Contact Us", icon: Headphones },
  { id: "returns", label: "Return & Exchange", icon: RefreshCw },
  { id: "how-to-order", label: "How to Order", icon: ShoppingBag },
  { id: "fabric-care", label: "Fabric Care", icon: Shirt },
  { id: "payment", label: "Billing & Payment", icon: CreditCard },
  { id: "shipping", label: "Shipping & Delivery", icon: Truck },
  { id: "track-order", label: "Track Your Order", icon: Search },
  { id: "faq", label: "FAQ", icon: HelpCircle },
] as const;

type TopicId = (typeof topics)[number]["id"];

export default function CustomerService() {
  const [, params] = useRoute("/customer-service/:topic");
  const defaultTopic = (params?.topic as TopicId) || "contact";
  const [activeTopic, setActiveTopic] = useState<TopicId>(
    topics.some((t) => t.id === defaultTopic) ? defaultTopic : "contact"
  );
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();

  return (
    <div className="page-shell">
      <RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} />

      <main className="policy-page">
        <div className="container">
          <div className="policy-breadcrumb">
            <Link href="/" className="back-link">
              <ArrowLeft size={16} /> Back to Storefront
            </Link>
          </div>

          <div className="customer-service-layout">
            <aside className="cs-sidebar">
              <h3>Customer Service</h3>
              <nav className="cs-nav">
                {topics.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`cs-tab-btn ${activeTopic === t.id ? "active" : ""}`}
                      onClick={() => setActiveTopic(t.id)}
                    >
                      <Icon size={18} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <article className="policy-card cs-content">
              {activeTopic === "contact" && (
                <div>
                  <div className="policy-header">
                    <div className="policy-icon-badge"><Headphones size={28} /></div>
                    <div>
                      <span className="badge">Support 24/7</span>
                      <h1>Contact Us</h1>
                      <p className="policy-effective">We are here to assist you every day</p>
                    </div>
                  </div>
                  <div className="policy-body">
                    <p>Have questions about sizes, fabrics, delivery times, or need style advice? Reach out to our dedicated concierge team through any channel:</p>
                    <div className="contact-methods-grid">
                      <div className="contact-method-card">
                        <div className="cm-icon"><Send size={22} /></div>
                        <strong>WhatsApp Direct</strong>
                        <p>Instant chat with our customer specialist</p>
                        <a href="https://wa.me/8801349529274" target="_blank" rel="noopener noreferrer" className="btn-sm">
                          Chat on WhatsApp (+8801349529274)
                        </a>
                      </div>
                      <div className="contact-method-card">
                        <div className="cm-icon"><Headphones size={22} /></div>
                        <strong>Facebook Messenger</strong>
                        <p>Fast responses via our official Facebook page</p>
                        <a href="https://www.facebook.com/share/14wjzGNSqz8/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="btn-sm">
                          Message on Facebook
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTopic === "returns" && (
                <div>
                  <div className="policy-header">
                    <div className="policy-icon-badge"><RefreshCw size={28} /></div>
                    <div>
                      <span className="badge">Peace of Mind</span>
                      <h1>Return & Exchange Policy</h1>
                      <p className="policy-effective">Hassle-free 48-hour exchange guarantee</p>
                    </div>
                  </div>
                  <div className="policy-body">
                    <h2>Eligibility for Return & Exchange</h2>
                    <p>We want you to love your Pakistani Three-Piece suit. You are eligible for an exchange or return if:</p>
                    <ul>
                      <li>The product received has a manufacturing defect or stitching flaw.</li>
                      <li>The delivered product or color differs from what was ordered.</li>
                      <li>Size or piece mismatch reported within <strong>48 hours</strong> of parcel receipt.</li>
                    </ul>
                    <h2>Exchange Conditions</h2>
                    <p>Items must be in original condition with all tags, labels, and packaging intact, unworn and unwashed.</p>
                  </div>
                </div>
              )}

              {activeTopic === "how-to-order" && (
                <div>
                  <div className="policy-header">
                    <div className="policy-icon-badge"><ShoppingBag size={28} /></div>
                    <div>
                      <span className="badge">Simple Guide</span>
                      <h1>How to Place an Order</h1>
                      <p className="policy-effective">Step-by-step shopping guide on Rabiora</p>
                    </div>
                  </div>
                  <div className="policy-body">
                    <ol className="step-list">
                      <li><strong>Browse & Choose:</strong> Explore our curated Pakistani Three-Piece collections on the homepage or catalogue.</li>
                      <li><strong>Select Quantity & Option:</strong> Click <strong>Add to Cart</strong> to keep shopping, or click <strong>Buy Now</strong> to jump directly to checkout with only that item.</li>
                      <li><strong>Sign In / Create Account:</strong> Sign in with your phone number and password so your order is tracked in your account dashboard.</li>
                      <li><strong>Enter Delivery Details:</strong> Fill in your full name, mobile number, district, and detailed address.</li>
                      <li><strong>Choose Payment Method:</strong> Select Cash on Delivery or send payment via bKash, Nagad, or Rocket using the numbers provided.</li>
                      <li><strong>Confirm Order:</strong> Click Confirm Order. You will instantly receive your Order Number and an automated WhatsApp confirmation link!</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeTopic === "fabric-care" && (
                <div>
                  <div className="policy-header">
                    <div className="policy-icon-badge"><Shirt size={28} /></div>
                    <div>
                      <span className="badge">Garment Care</span>
                      <h1>Fabric Care Guide</h1>
                      <p className="policy-effective">Keep your luxury Pakistani suits looking pristine</p>
                    </div>
                  </div>
                  <div className="policy-body">
                    <p>Rabiora collections are crafted with premium pure cotton, lawn, organza, chiffon, and silk with intricate embroidery. Follow these care instructions to extend their beauty:</p>
                    <ul>
                      <li><strong>First Wash:</strong> We recommend dry cleaning or a gentle cold hand-wash with mild detergent for the first wash.</li>
                      <li><strong>Embroidery & Embellishments:</strong> Wash embroidered pieces inside out. Avoid harsh wringing or brushing over fine threadwork.</li>
                      <li><strong>Drying:</strong> Dry in shade. Avoid direct harsh sunlight to preserve color vibrancy.</li>
                      <li><strong>Ironing:</strong> Iron on medium heat on the reverse side of embellished fabrics, or use a steamer for chiffon and organza dupattas.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTopic === "payment" && (
                <div>
                  <div className="policy-header">
                    <div className="policy-icon-badge"><CreditCard size={28} /></div>
                    <div>
                      <span className="badge">Secure Transactions</span>
                      <h1>Billing & Payment Methods</h1>
                      <p className="policy-effective">Transparent and flexible payment options</p>
                    </div>
                  </div>
                  <div className="policy-body">
                    <h2>Available Payment Options</h2>
                    <ul>
                      <li><strong>Cash on Delivery (COD):</strong> Pay the courier directly in cash when receiving your parcel anywhere in Bangladesh.</li>
                      <li><strong>bKash Personal / Merchant Transfer:</strong> Send money to our official number (<code>+8801349529274</code>) and input the Transaction ID at checkout.</li>
                      <li><strong>Nagad Transfer:</strong> Send money to <code>+8801349529274</code> and input the Transaction ID.</li>
                      <li><strong>Rocket Transfer:</strong> Send money to <code>+8801349529274</code> and input the Transaction ID.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTopic === "shipping" && (
                <div>
                  <div className="policy-header">
                    <div className="policy-icon-badge"><Truck size={28} /></div>
                    <div>
                      <span className="badge">Nationwide Delivery</span>
                      <h1>Shipping & Delivery</h1>
                      <p className="policy-effective">Fast and reliable parcel shipping across Bangladesh</p>
                    </div>
                  </div>
                  <div className="policy-body">
                    <h2>Delivery Rates & Timeframes</h2>
                    <ul>
                      <li><strong>Inside Dhaka City:</strong> Free / Standard delivery within 24 to 48 hours.</li>
                      <li><strong>Outside Dhaka / All Districts:</strong> ৳120 standard courier charge, delivered safely in 2 to 4 business days.</li>
                    </ul>
                    <p>All parcels are securely bubble-wrapped with tamper-evident packaging.</p>
                  </div>
                </div>
              )}

              {activeTopic === "track-order" && (
                <div>
                  <div className="policy-header">
                    <div className="policy-icon-badge"><Search size={28} /></div>
                    <div>
                      <span className="badge">Real-Time Tracking</span>
                      <h1>Track Your Order</h1>
                      <p className="policy-effective">View live status from order to delivery</p>
                    </div>
                  </div>
                  <div className="policy-body">
                    <p>You can track any placed order in real-time:</p>
                    <ul>
                      <li>Go to your <strong><Link href="/account">My Account</Link></strong> dashboard to see all pending and shipped orders.</li>
                      <li>Click on any order to view status history (Pending → Confirmed → Shipped → Delivered).</li>
                      <li>You can also message our WhatsApp concierge anytime with your <code>RAB-...</code> order number for immediate delivery tracking.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTopic === "faq" && (
                <div>
                  <div className="policy-header">
                    <div className="policy-icon-badge"><HelpCircle size={28} /></div>
                    <div>
                      <span className="badge">Questions & Answers</span>
                      <h1>Frequently Asked Questions</h1>
                      <p className="policy-effective">Quick answers to common questions</p>
                    </div>
                  </div>
                  <div className="policy-body">
                    <div className="faq-item">
                      <strong>Q: Are all Pakistani Three-Piece collections original?</strong>
                      <p>A: Yes! Rabiora exclusively sources genuine, high-grade Pakistani Three-Piece fabrics and designer suites with verified quality checks.</p>
                    </div>
                    <div className="faq-item">
                      <strong>Q: Can I check the parcel before payment for Cash on Delivery?</strong>
                      <p>A: Yes, you may inspect the external packaging in front of the courier delivery representative.</p>
                    </div>
                    <div className="faq-item">
                      <strong>Q: Do I need an account to place an order?</strong>
                      <p>A: Yes, registering takes only 10 seconds with your mobile number, which ensures your orders and invoices are safely saved in your account dashboard.</p>
                    </div>
                  </div>
                </div>
              )}
            </article>
          </div>
        </div>
      </main>

      <RabioraFooter />
    </div>
  );
}
