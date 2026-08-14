import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { clearGuestWishlist, getGuestCartToken, getGuestWishlist } from "@/lib/guestIdentity";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const [, navigate] = useLocation();
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { t } = useLanguage();
  const register = trpc.customer.register.useMutation();
  const login = trpc.customer.login.useMutation();
  const mergeGuestWishlist = trpc.wishlist.mergeGuest.useMutation();
  const utils = trpc.useUtils();
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    try {
      if (mode === "register") await register.mutateAsync({ name, phone, password, anonymousToken: getGuestCartToken() });
      else await login.mutateAsync({ phone, password, anonymousToken: getGuestCartToken() });
      const guestWishlist = getGuestWishlist();
      if (guestWishlist.length > 0) {
        await mergeGuestWishlist.mutateAsync({ productIds: guestWishlist });
        clearGuestWishlist();
      }
      await utils.customer.me.invalidate();
      await utils.wishlist.list.invalidate();
      navigate("/account");
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("continueError")); }
  };
  const pending = register.isPending || login.isPending;
  return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="auth-page"><form className="auth-card" onSubmit={submit}><span className="badge">{t("account")}</span><h1>{mode === "login" ? t("welcomeBack") : t("createYourAccount")}</h1><p>{mode === "login" ? t("loginCopy") : t("registerCopy")}</p>{mode === "register" && <label>{t("name")}<input required value={name} onChange={(event) => setName(event.target.value)} /></label>}<label>{t("bangladeshPhone")}<input required inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(event) => setPhone(event.target.value)} /></label><label>{t("password")}<input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="btn" disabled={pending}>{pending ? t("pleaseWait") : mode === "login" ? t("login") : t("register")}</button><p className="auth-switch">{mode === "login" ? <>{t("newToRabiora")} <Link href="/register">{t("register")}</Link></> : <>{t("alreadyMember")} <Link href="/login">{t("login")}</Link></>}</p></form></main><RabioraFooter /></div>;
}
