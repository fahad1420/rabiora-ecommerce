import { MessageCircle } from "lucide-react";

export function WhatsAppFloatingButton() {
  const whatsappUrl = "https://wa.me/8801349529274?text=" + encodeURIComponent("Hello Rabiora, I would like to inquire about your Pakistani collection.");

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="rabiora-whatsapp-float"
      aria-label="Chat with Rabiora on WhatsApp"
      title="Chat on WhatsApp (+8801349529274)"
    >
      <div className="whatsapp-float-icon-wrapper">
        <MessageCircle size={26} className="whatsapp-svg" />
      </div>
      <span className="whatsapp-float-label">Chat with us</span>
    </a>
  );
}

