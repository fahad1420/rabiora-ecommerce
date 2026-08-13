import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { clearGuestWishlist, getGuestCartToken, getGuestWishlist } from "@/lib/guestIdentity";
import { trpc } from "@/lib/trpc";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const [, navigate] = useLocation();
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to continue. Please try again."); }
  };
  const pending = register.isPending || login.isPending;
  return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="auth-page"><form className="auth-card" onSubmit={submit}><span className="badge">Rabiora Account</span><h1>{mode === "login" ? "Welcome Back" : "Create Your Account"}</h1><p>{mode === "login" ? "Sign in to keep your cart and wishlist across devices." : "Create an account for faster checkout and order history."}</p>{mode === "register" && <label>Name<input required value={name} onChange={(event) => setName(event.target.value)} /></label>}<label>Bangladesh Phone Number<input required inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(event) => setPhone(event.target.value)} /></label><label>Password<input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="form-error">{error}</p>}<button className="btn" disabled={pending}>{pending ? "Please wait..." : mode === "login" ? "Login" : "Register"}</button><p className="auth-switch">{mode === "login" ? <>New to Rabiora? <Link href="/register">Create an account</Link></> : <>Already have an account? <Link href="/login">Login</Link></>}</p></form></main><RabioraFooter /></div>;
}
