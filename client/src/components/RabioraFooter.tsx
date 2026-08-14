import { useLanguage } from "@/contexts/LanguageContext";

export function RabioraFooter() {
  const { t } = useLanguage();
  return <footer className="rabiora-footer">
    <div className="container">
      <p>© {new Date().getFullYear()} Rabiora. {t("allRightsReserved")}</p>
      <p>{t("designedDevelopedBy")} <strong>Fahad Hossain</strong></p>
      <p className="developer-links"><a href="https://github.com/fahad1420" target="_blank" rel="noopener noreferrer">GitHub</a><span aria-hidden="true"> · </span><a href="https://www.linkedin.com/in/fahad-hossain1420" target="_blank" rel="noopener noreferrer">LinkedIn</a></p>
    </div>
  </footer>;
}
