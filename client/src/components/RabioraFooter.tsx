import { useLanguage } from "@/contexts/LanguageContext";

export function RabioraFooter() {
  const { t } = useLanguage();
  return <footer className="rabiora-footer">
    <div className="container">
      <p>© {new Date().getFullYear()} Rabiora. {t("allRightsReserved")}</p>
      <p>{t("designedDevelopedBy")} <strong>Fahad Hossain</strong></p>
    </div>
  </footer>;
}
