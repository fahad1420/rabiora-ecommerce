import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import {
  clearGuestWishlist,
  getGuestCartToken,
  getGuestWishlist,
} from "@/lib/guestIdentity";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { startSocialLogin } from "@/const";
import { ArrowLeft, CheckCircle2, Lock, Mail, Phone, ShieldCheck, Sparkles, User } from "lucide-react";

type ResetStep = "request" | "verify";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function AuthPage({
  mode,
}: {
  mode: "login" | "register";
}) {
  const [, navigate] = useLocation();
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStep, setResetStep] = useState<ResetStep>("request");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const [error, setError] = useState("");

  const register = trpc.customer.register.useMutation();
  const login = trpc.customer.login.useMutation();

  const requestEmailPasswordReset = trpc.customer.requestEmailPasswordReset.useMutation();
  const resetPasswordByEmail = trpc.customer.resetPasswordByEmail.useMutation();

  const mergeGuestWishlist = trpc.wishlist.mergeGuest.useMutation();
  const utils = trpc.useUtils();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      let result;
      if (mode === "register") {
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          setError("A valid email address is required to register.");
          return;
        }

        result = await register.mutateAsync({
          name,
          phone,
          email: email.trim().toLowerCase(),
          password,
          anonymousToken: getGuestCartToken(),
        });
      } else {
        result = await login.mutateAsync({
          phone,
          password,
          anonymousToken: getGuestCartToken(),
        });
      }

      if (result && "token" in result && typeof result.token === "string") {
        try {
          localStorage.setItem("rabiora_customer_token", result.token);
        } catch {}
      }

      const guestWishlist = getGuestWishlist();

      if (guestWishlist.length > 0) {
        await mergeGuestWishlist.mutateAsync({
          productIds: guestWishlist,
        });

        clearGuestWishlist();
      }

      await utils.customer.me.invalidate();
      await utils.auth.me.invalidate();
      await utils.wishlist.list.invalidate();

      if (result?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/account");
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t("continueError"),
      );
    }
  };

  const handleRequestReset = async (event: FormEvent) => {
    event.preventDefault();

    setResetError("");
    setResetMessage("");

    const targetEmail = resetEmail.trim().toLowerCase();
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setResetError("Please enter a valid registered email address.");
      return;
    }

    try {
      const result = await requestEmailPasswordReset.mutateAsync({
        email: targetEmail,
      });
      setResetStep("verify");
      setResetMessage(result.message || "Password recovery instructions and code have been sent to your email.");
    } catch (cause) {
      setResetError(
        cause instanceof Error
          ? cause.message
          : "Unable to request password recovery.",
      );
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();

    setResetError("");
    setResetMessage("");

    if (newPassword.length < 8) {
      setResetError("Password must contain at least 8 characters.");
      return;
    }

    const targetEmail = resetEmail.trim().toLowerCase();

    try {
      const res = await resetPasswordByEmail.mutateAsync({
        email: targetEmail,
        otpCode: otpCode.trim(),
        newPassword,
      });
      setResetMessage(res.message || "Password reset successfully. You can now log in.");

      setPassword("");
      setOtpCode("");
      setNewPassword("");

      setTimeout(() => {
        setShowForgotPassword(false);
        setResetStep("request");
        setResetMessage("");
      }, 1800);
    } catch (cause) {
      setResetError(
        cause instanceof Error
          ? cause.message
          : "Unable to reset password. Please verify your 6-digit recovery code.",
      );
    }
  };
  const pending = register.isPending || login.isPending;
  const resetPending =
    requestEmailPasswordReset.isPending ||
    resetPasswordByEmail.isPending;

  return (
    <div className="page-shell auth-page-shell">
      <RabioraHeader
        cartCount={cart.count}
        wishlistCount={wishlist.count}
      />

      <main className="auth-page">
        {/* Subtle Ambient 4-Corner Lights */}
        <div className="auth-ambient-glow auth-glow-tl" aria-hidden="true" />
        <div className="auth-ambient-glow auth-glow-tr" aria-hidden="true" />
        <div className="auth-ambient-glow auth-glow-bl" aria-hidden="true" />
        <div className="auth-ambient-glow auth-glow-br" aria-hidden="true" />

        {showForgotPassword && mode === "login" ? (
          <form
            className="auth-card luxury-auth-card"
            onSubmit={
              resetStep === "request"
                ? handleRequestReset
                : handleResetPassword
            }
          >
            <div className="auth-card-top-accent" />

            <div className="auth-badge-wrap">
              <span className="badge auth-badge">
                <Lock size={12} className="mr-1.5" />
                Password Recovery
              </span>
            </div>

            <h1 className="auth-title">
              {resetStep === "request"
                ? "Forgot Password?"
                : "Reset Your Password"}
            </h1>

            <p className="auth-subtitle">
              {resetStep === "request"
                ? "Enter your registered email address to receive password recovery instructions and a secure 6-digit recovery code."
                : "Enter the 6-digit verification code sent to your email and create a new secure password."}
            </p>

            <div className="auth-fields-group">
              <label className="auth-field-label">
                <span>Registered Email Address</span>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    required
                    type="email"
                    placeholder="name@example.com"
                    value={resetEmail}
                    disabled={resetStep === "verify"}
                    onChange={(event) => setResetEmail(event.target.value)}
                  />
                </div>
              </label>

              {resetStep === "verify" && (
                <>
                  <label className="auth-field-label">
                    <span>6-Digit Verification Code</span>
                    <div className="auth-input-wrapper">
                      <ShieldCheck size={16} className="auth-input-icon" />
                      <input
                        required
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                        value={otpCode}
                        onChange={(event) =>
                          setOtpCode(
                            event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6),
                          )
                        }
                      />
                    </div>
                  </label>

                  <label className="auth-field-label">
                    <span>New Password</span>
                    <div className="auth-input-wrapper">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        required
                        type="password"
                        minLength={8}
                        maxLength={72}
                        placeholder="Minimum 8 characters"
                        value={newPassword}
                        onChange={(event) =>
                          setNewPassword(
                            event.target.value,
                          )
                        }
                      />
                    </div>
                  </label>
                </>
              )}
            </div>

            {resetError && (
              <p className="form-error auth-alert" role="alert">
                {resetError}
              </p>
            )}

            {resetMessage && (
              <p className="form-success auth-alert" role="status">
                <CheckCircle2 size={16} className="inline mr-1" />
                {resetMessage}
              </p>
            )}

            <button
              className="btn btn-luxury-primary auth-submit-btn"
              disabled={resetPending}
            >
              {resetPending
                ? t("pleaseWait")
                : resetStep === "request"
                  ? "Send Recovery Code"
                  : "Set New Password & Sign In"}
            </button>

            {resetStep === "verify" && (
              <div className="auth-resend-row">
                <button
                  type="button"
                  className="auth-link-secondary"
                  disabled={resetPending}
                  onClick={handleRequestReset}
                >
                  Resend Code
                </button>
                <span className="auth-divider-dot">•</span>
                <button
                  type="button"
                  className="auth-link-secondary"
                  disabled={resetPending}
                  onClick={() => {
                    setResetStep("request");
                    setResetMessage("");
                    setResetError("");
                    setOtpCode("");
                    setNewPassword("");
                  }}
                >
                  Change Email
                </button>
              </div>
            )}

            <p className="auth-switch">
              <button
                type="button"
                className="auth-text-button flex-center gap-1"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetStep("request");
                  setResetMessage("");
                  setResetError("");
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </p>
          </form>
        ) : (
          <form
            className="auth-card luxury-auth-card"
            onSubmit={submit}
          >
            <div className="auth-card-top-accent" />

            <div className="auth-badge-wrap">
              <span className="badge auth-badge">
                <Sparkles size={12} className="mr-1.5" />
                {mode === "login" ? "Welcome Back" : "Exclusive Membership"}
              </span>
            </div>

            <h1 className="auth-title">
              {mode === "login"
                ? t("welcomeBack")
                : t("createYourAccount")}
            </h1>

            <p className="auth-subtitle">
              {mode === "login"
                ? "Sign in to access your Rabiora orders, wishlist & VIP benefits."
                : "Join Rabiora for handcrafted Pakistani luxury fashion and fast delivery."}
            </p>

            {/* Auth0 / OAuth Social Logins */}
            <div className="social-auth-container">
              <button
                type="button"
                className="btn-social-auth btn-social-google"
                onClick={() => startSocialLogin("google")}
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                className="btn-social-auth btn-social-facebook"
                onClick={() => startSocialLogin("facebook")}
              >
                <FacebookIcon />
                <span>Continue with Facebook</span>
              </button>
            </div>

            <div className="auth-or-separator">
              <span>or continue with credentials</span>
            </div>

            <div className="auth-fields-group">
              {mode === "register" && (
                <label className="auth-field-label">
                  <span>{t("name")}</span>
                  <div className="auth-input-wrapper">
                    <User size={16} className="auth-input-icon" />
                    <input
                      required
                      placeholder="Your Full Name"
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                    />
                  </div>
                </label>
              )}

              {mode === "register" && (
                <label className="auth-field-label">
                  <span>Email Address <small style={{ color: "var(--accent)" }}>(Required)</small></span>
                  <div className="auth-input-wrapper">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      required
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                    />
                  </div>
                </label>
              )}

              <label className="auth-field-label">
                <span>{mode === "login" ? `${t("bangladeshPhone")} / Email` : t("bangladeshPhone")}</span>
                <div className="auth-input-wrapper">
                  <Phone size={16} className="auth-input-icon" />
                  <input
                    required
                    inputMode={mode === "login" ? "text" : "tel"}
                    placeholder={mode === "login" ? "01XXXXXXXXX or email" : "01XXXXXXXXX"}
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                  />
                </div>
              </label>

              <label className="auth-field-label">
                <div className="flex justify-between items-center w-full">
                  <span>{t("password")}</span>
                  {mode === "login" && (
                    <button
                      type="button"
                      className="auth-forgot-link"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setResetStep("request");
                        setResetError("");
                        setResetMessage("");
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    required
                    type="password"
                    minLength={8}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                  />
                </div>
              </label>
            </div>

            {error && (
              <p
                className="form-error auth-alert"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              className="btn btn-luxury-primary auth-submit-btn"
              disabled={pending}
            >
              {pending
                ? t("pleaseWait")
                : mode === "login"
                  ? t("login")
                  : t("register")}
            </button>

            <p className="auth-switch">
              {mode === "login" ? (
                <>
                  {t("newToRabiora")}{" "}
                  <Link href="/register" className="auth-switch-link">
                    {t("register")}
                  </Link>
                </>
              ) : (
                <>
                  {t("alreadyMember")}{" "}
                  <Link href="/login" className="auth-switch-link">
                    {t("login")}
                  </Link>
                </>
              )}
            </p>
          </form>
        )}
      </main>

      <RabioraFooter />
    </div>
  );
}