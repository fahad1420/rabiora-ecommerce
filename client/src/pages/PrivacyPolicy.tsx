import { Link } from "wouter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { RabioraFooter } from "@/components/RabioraFooter";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { ArrowLeft, Lock, Shield } from "lucide-react";

export default function PrivacyPolicy() {
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
                <Shield size={28} />
              </div>
              <div>
                <span className="badge">Data & Privacy</span>
                <h1>Privacy Policy</h1>
                <p className="policy-effective">Last updated: August 2026</p>
              </div>
            </div>

            <div className="policy-body">
              <section>
                <h2>1. Commitment to Your Privacy</h2>
                <p>
                  At <strong>Rabiora</strong>, we respect your personal privacy and are committed to safeguarding the data you share with us. This Privacy Policy outlines how we collect, use, store, and protect your information when you interact with our e-commerce platform, register an account, or order Pakistani Three-Piece fashion.
                </p>
              </section>

              <section>
                <h2>2. Information We Collect</h2>
                <p>
                  We collect information that is strictly necessary to provide an effortless and personalized shopping experience:
                </p>
                <ul>
                  <li><strong>Account Information:</strong> Name, Bangladesh mobile number, email address, and securely hashed passwords (using industry-standard bcrypt encryption).</li>
                  <li><strong>Order & Delivery Data:</strong> Recipient name, contact phone number, delivery address, district area, and selected payment details.</li>
                  <li><strong>Payment Verification Records:</strong> Transaction IDs (TrxID) and submitted amounts for bKash, Nagad, and Rocket payments (we never store sensitive banking PINs or OTPs).</li>
                  <li><strong>Newsletter & Stay Tuned Data:</strong> Email address, mobile phone number, and residency selection for customer subscribers.</li>
                  <li><strong>Shopping Preferences:</strong> Cart items, saved wishlist items, and review submissions.</li>
                </ul>
              </section>

              <section>
                <h2>3. How We Use Your Information</h2>
                <p>Your information is used strictly to:</p>
                <ul>
                  <li>Process, confirm, package, and dispatch your orders.</li>
                  <li>Provide automated order status updates and WhatsApp delivery notifications.</li>
                  <li>Maintain your authenticated customer shopping dashboard, cart, and wishlist across sessions.</li>
                  <li>Deliver daily fashion updates, new collection arrivals, and exclusive promotional offers (if you opted into our newsletter).</li>
                  <li>Improve website performance, reliability, and security.</li>
                </ul>
              </section>

              <section>
                <h2>4. Data Storage & Security</h2>
                <p>
                  Rabiora implements strict technical security measures. All communication is encrypted via TLS/HTTPS. Passwords are never stored in plaintext, and customer session tokens are cryptographically signed using JWT algorithms. Your data is stored on secure, enterprise-grade cloud database infrastructure with automated backups.
                </p>
              </section>

              <section>
                <h2>5. Third-Party Sharing</h2>
                <p>
                  We do not sell, rent, or trade your personal information. We only share necessary delivery information (such as your name, phone number, and address) with trusted courier logistics partners strictly for parcel delivery purposes.
                </p>
              </section>

              <section>
                <h2>6. Your Rights & Data Control</h2>
                <p>
                  You have full control over your personal data. You can view, update, or edit your name and email address at any time through your <strong>My Account</strong> dashboard. If you wish to delete your account or unsubscribe from marketing emails, contact our support team.
                </p>
              </section>

              <section>
                <h2>7. Contacting Us</h2>
                <p>
                  If you have questions regarding our privacy practices or your data, please contact:
                </p>
                <ul>
                  <li><strong>WhatsApp:</strong> <a href="https://wa.me/8801349529274" target="_blank" rel="noopener noreferrer">+880 1349-529274</a></li>
                  <li><strong>Messenger:</strong> <a href="https://www.facebook.com/share/14wjzGNSqz8/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">Facebook Customer Care</a></li>
                  <li><strong>Email:</strong> privacy@rabiora.com</li>
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

