import { useLocation } from "wouter";

export function WhatsAppFloatingButton() {
  const [location] = useLocation();

  // Hide WhatsApp floating button on all admin routes
  if (location.startsWith("/admin")) {
    return null;
  }

  const whatsappUrl =
    "https://wa.me/8801349529274?text=" +
    encodeURIComponent("Hello Rabiora, I would like to inquire about your Pakistani collection.");

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="rabiora-whatsapp-float"
      aria-label="Chat with Rabiora on WhatsApp"
      title="Chat with Rabiora on WhatsApp (+8801349529274)"
    >
      <div className="whatsapp-float-icon-wrapper">
        <svg
          viewBox="0 0 32 32"
          width="24"
          height="24"
          fill="currentColor"
          className="whatsapp-svg"
          aria-hidden="true"
        >
          <path d="M16 2C8.28 2 2 8.28 2 16c0 2.72.78 5.26 2.12 7.42L2 30l6.76-2.1c2.1 1.26 4.56 1.98 7.24 1.98 7.72 0 14-6.28 14-14S23.72 2 16 2zm7.98 19.82c-.34.96-1.68 1.76-2.74 1.98-.72.16-1.66.28-4.82-1.04-4.04-1.68-6.66-5.8-6.86-6.06-.2-.28-1.64-2.18-1.64-4.16s1.04-2.96 1.4-3.32c.36-.36.78-.46 1.04-.46.26 0 .52 0 .74.02.24.02.56-.1.88.66.34.78 1.14 2.78 1.24 2.98.1.2.16.44.02.72-.14.28-.2.44-.4.68-.2.24-.42.54-.6.72-.2.2-.42.42-.18.82.24.4 1.06 1.74 2.28 2.82 1.56 1.38 2.88 1.82 3.28 2.02.4.2.64.18.88-.1.24-.28 1.04-1.2 1.32-1.62.28-.42.56-.34.94-.2.38.14 2.42 1.14 2.84 1.34.42.2.7.3.8.48.1.18.1 1.04-.24 2z" />
        </svg>
      </div>
      <span className="whatsapp-float-label">WhatsApp</span>
    </a>
  );
}


