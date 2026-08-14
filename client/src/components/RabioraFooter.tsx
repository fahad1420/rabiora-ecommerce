import { useLanguage } from "@/contexts/LanguageContext";
import { Github, Linkedin } from "lucide-react";

export function RabioraFooter() {
  const { t } = useLanguage();
  return <footer className="rabiora-footer">
    <div className="container">
      <p>© {new Date().getFullYear()} Rabiora. {t("allRightsReserved")}</p>
      <p>{t("designedDevelopedBy")} <strong>Fahad Hossain</strong></p>
      <div className="developer-links" aria-label="Developer profiles"><a href="https://github.com/fahad1420" target="_blank" rel="noopener noreferrer" aria-label="Fahad Hossain on GitHub" title="GitHub"><Github size={15} strokeWidth={1.9} aria-hidden="true" /></a><a href="https://www.linkedin.com/in/fahad-hossain1420" target="_blank" rel="noopener noreferrer" aria-label="Fahad Hossain on LinkedIn" title="LinkedIn"><Linkedin size={15} strokeWidth={1.9} aria-hidden="true" /></a></div>
    </div>
  </footer>;
}
