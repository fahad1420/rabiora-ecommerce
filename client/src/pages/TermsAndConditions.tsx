import { Link } from "wouter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { RabioraFooter } from "@/components/RabioraFooter";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

export default function TermsAndConditions() {
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

          <article className="policy-card">
            <div className="policy-header">
              <div className="policy-icon-badge">
                <FileText size={28} />
              </div>
              <div>
                <span className="badge">Legal & Policy</span>
                <h1>Terms & Conditions</h1>
                <p className="policy-effective">Last updated: August 2026</p>
              </div>
            </div>

            <div className="policy-body">
              <section>
                <h2>1. Introduction & Acceptance</h2>
                <p>
                  Welcome to <strong>Rabiora</strong>. By accessing our website (<code>rabiora-ecommerce.vercel.app</code>), creating an account, browsing our curated collection of premium Pakistani Three-Piece fashion, or placing an order, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2>2. Account Registration & Security</h2>
                <p>
                  To place an order on Rabiora, customers must register or log in using a valid Bangladesh mobile number or email address. You are responsible for maintaining the confidentiality of your account credentials and password. Any activity conducted through your authenticated account is your responsibility.
                </p>
              </section>

              <section>
                <h2>3. Products & Pricing</h2>
                <p>
                  All products featured on Rabiora are authentic, premium-quality Pakistani Three-Piece dresses. Product prices are listed in Bangladeshi Taka (BDT ৳) and include applicable taxes unless stated otherwise. We strive to display accurate descriptions, fabric details, and high-resolution images. However, actual colors may slightly vary due to device screen calibrations and photographic lighting.
                </p>
              </section>

              <section>
                <h2>4. Ordering & Stock Availability</h2>
                <p>
                  Orders placed through our standard cart checkout or the instant <strong>Buy Now</strong> flow are subject to product availability and confirmation. In the rare event that an item is out of stock after your order has been placed, our customer support team will notify you immediately for a replacement or cancellation.
                </p>
              </section>

              <section>
                <h2>5. Payment Methods & Verification</h2>
                <p>
                  Rabiora offers secure payment options across Bangladesh:
                </p>
                <ul>
                  <li><strong>Cash on Delivery (COD):</strong> Pay in cash directly to the courier upon parcel delivery.</li>
                  <li><strong>bKash / Nagad / Rocket (Manual Transfer):</strong> Send payment to our official merchant/personal wallet number displayed during checkout, then enter your Transaction ID (TrxID) and submitted amount. Orders paid via manual mobile wallet are processed once payment verification is confirmed by our accounts team.</li>
                </ul>
              </section>

              <section>
                <h2>6. Shipping & Delivery</h2>
                <p>
                  We provide nationwide delivery across Bangladesh:
                </p>
                <ul>
                  <li><strong>Inside Dhaka:</strong> Free / Standard delivery within 24–48 hours.</li>
                  <li><strong>Outside Dhaka:</strong> Courier delivery (৳120 standard charge) within 2–4 business days.</li>
                </ul>
              </section>

              <section>
                <h2>7. Returns & Exchange Policy</h2>
                <p>
                  Customer satisfaction is our utmost priority. If you receive a damaged, defective, or incorrect product, you must notify our customer service within <strong>48 hours</strong> of delivery with proof of the issue. Items must be unwashed, unworn, and with all original tags attached for an exchange or resolution.
                </p>
              </section>

              <section>
                <h2>8. Contact & Customer Support</h2>
                <p>
                  For any questions, order updates, or inquiries regarding our terms, reach us via:
                </p>
                <ul>
                  <li><strong>WhatsApp:</strong> <a href="https://wa.me/8801349529274" target="_blank" rel="noopener noreferrer">+880 1349-529274</a></li>
                  <li><strong>Messenger:</strong> <a href="https://www.facebook.com/share/14wjzGNSqz8/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">Rabiora Official Facebook Support</a></li>
                  <li><strong>Email:</strong> support@rabiora.com</li>
                </ul>
              </section>
            </div>
          </article>
        </div>
      </main>

      <RabioraFooter />
    </div>
  );
}
