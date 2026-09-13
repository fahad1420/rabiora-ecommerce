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

type ResetStep = "request" | "verify";

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
  const [password, setPassword] = useState("");

  const [showForgotPassword, setShowForgotPassword] =
    useState(false);

  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetStep, setResetStep] = useState<ResetStep>("request");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const [error, setError] = useState("");

  const register = trpc.customer.register.useMutation();
  const login = trpc.customer.login.useMutation();

  const requestPasswordReset = trpc.customer.requestPasswordReset.useMutation();
  const requestEmailPasswordReset = trpc.customer.requestEmailPasswordReset.useMutation();
  const resetPassword = trpc.customer.resetPassword.useMutation();
  const resetPasswordByEmail = trpc.customer.resetPasswordByEmail.useMutation();

  const mergeGuestWishlist = trpc.wishlist.mergeGuest.useMutation();
  const utils = trpc.useUtils();

  const isEmailIdentifier = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      let result;
      if (mode === "register") {
        result = await register.mutateAsync({
          name,
          phone,
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
    setDevOtp("");

    const target = (resetIdentifier || phone).trim();
    if (!target) {
      setResetError("Please enter your registered email address.");
      return;
    }

    try {
      if (isEmailIdentifier(target)) {
        const result = await requestEmailPasswordReset.mutateAsync({
          email: target,
        });

        setResetStep("verify");
        if (result.otpCode) {
          setDevOtp(result.otpCode);
        }
        setResetMessage(result.message || "A 6-digit verification code has been generated for your email.");
      } else {
        const result = await requestPasswordReset.mutateAsync({
          phone: target,
        });

        setResetStep("verify");
        if (result.devOtp) {
          setDevOtp(result.devOtp);
          setResetMessage("Verification code generated. Use the code shown below.");
        } else {
          setResetMessage("If an account exists for this phone number, a verification code has been sent.");
        }
      }
    } catch (cause) {
      setResetError(
        cause instanceof Error
          ? cause.message
          : "Unable to request password reset.",
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

    const target = (resetIdentifier || phone).trim();

    try {
      if (isEmailIdentifier(target)) {
        const res = await resetPasswordByEmail.mutateAsync({
          email: target,
          otpCode: otpCode.trim(),
          newPassword,
        });
        setResetMessage(res.message || "Password reset successfully. You can now log in.");
      } else {
        await resetPassword.mutateAsync({
          phone: target,
          otpCode: otpCode.trim(),
          newPassword,
        });
        setResetMessage("Password reset successfully. You can now log in with your new password.");
      }

      setPassword("");
      setOtpCode("");
      setNewPassword("");

      setTimeout(() => {
        setShowForgotPassword(false);
        setResetStep("request");
        setResetMessage("");
        setDevOtp("");
      }, 1800);
    } catch (cause) {
      setResetError(
        cause instanceof Error
          ? cause.message
          : "Unable to reset password. Please check your verification code.",
      );
    }
  };

  const pending = register.isPending || login.isPending;
  const resetPending =
    requestPasswordReset.isPending ||
    requestEmailPasswordReset.isPending ||
    resetPassword.isPending ||
    resetPasswordByEmail.isPending;

  if (showForgotPassword && mode === "login") {
    return (
      <div className="page-shell">
        <RabioraHeader
          cartCount={cart.count}
          wishlistCount={wishlist.count}
        />

        <main className="auth-page">
          <form
            className="auth-card"
            onSubmit={
              resetStep === "request"
                ? handleRequestReset
                : handleResetPassword
            }
          >
            <span className="badge">
              Password Recovery
            </span>

            <h1>
              {resetStep === "request"
                ? "Forgot your password?"
                : "Enter Verification Code"}
            </h1>

            <p>
              {resetStep === "request"
                ? "Enter your registered email address or phone number to receive a 6-digit recovery code."
                : "Enter the 6-digit verification code sent to your email and set your new password."}
            </p>

            <label>
              Email Address / Mobile Number
              <input
                required
                type="text"
                placeholder="name@example.com or 01XXXXXXXXX"
                value={resetIdentifier || phone}
                disabled={resetStep === "verify"}
                onChange={(event) => {
                  setResetIdentifier(event.target.value);
                  setPhone(event.target.value);
                }}
              />
            </label>

            {resetStep === "verify" && (
              <>
                <label>
                  6-Digit Verification Code
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
                </label>

                {devOtp && (
                  <div className="form-success" style={{ margin: "4px 0", fontSize: "12px" }}>
                    <strong>Verification Code:</strong> {devOtp}
                  </div>
                )}

                <label>
                  New Password
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
                </label>
              </>
            )}

            {resetError && (
              <p className="form-error" role="alert">
                {resetError}
              </p>
            )}

            {resetMessage && (
              <p className="form-success" role="status">
                {resetMessage}
              </p>
            )}

            <button
              className="btn"
              disabled={resetPending}
            >
              {resetPending
                ? t("pleaseWait")
                : resetStep === "request"
                  ? "Send Recovery Code"
                  : "Set New Password & Login"}
            </button>

            {resetStep === "verify" && (
              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ flex: 1, fontSize: "12px", padding: "8px 4px" }}
                  disabled={resetPending}
                  onClick={handleRequestReset}
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ flex: 1, fontSize: "12px", padding: "8px 4px" }}
                  disabled={resetPending}
                  onClick={() => {
                    setResetStep("request");
                    setResetMessage("");
                    setResetError("");
                    setDevOtp("");
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
                className="auth-text-button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetStep("request");
                  setResetMessage("");
                  setResetError("");
                  setDevOtp("");
                }}
              >
                Back to Sign In
              </button>
            </p>
          </form>
        </main>

        <RabioraFooter />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <RabioraHeader
        cartCount={cart.count}
        wishlistCount={wishlist.count}
      />

      <main className="auth-page">
        <form
          className="auth-card"
          onSubmit={submit}
        >
          <span className="badge">
            {t("account")}
          </span>

          <h1>
            {mode === "login"
              ? t("welcomeBack")
              : t("createYourAccount")}
          </h1>

          <p>
            {mode === "login"
              ? t("loginCopy")
              : t("registerCopy")}
          </p>

          {mode === "register" && (
            <label>
              {t("name")}
              <input
                required
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </label>
          )}

          <label>
            {mode === "login" ? `${t("bangladeshPhone")} / Email` : t("bangladeshPhone")}
            <input
              required
              inputMode={mode === "login" ? "text" : "tel"}
              placeholder={mode === "login" ? "01XXXXXXXXX or email" : "01XXXXXXXXX"}
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
            />
          </label>

          <label>
            {t("password")}
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />
          </label>

          {mode === "login" && (
            <p className="auth-switch">
              <button
                type="button"
                className="auth-text-button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setResetStep("request");
                  setResetError("");
                  setResetMessage("");
                  setDevOtp("");
                }}
              >
                Forgot password?
              </button>
            </p>
          )}

          {error && (
            <p
              className="form-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="btn"
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
                <Link href="/register">
                  {t("register")}
                </Link>
              </>
            ) : (
              <>
                {t("alreadyMember")}{" "}
                <Link href="/login">
                  {t("login")}
                </Link>
              </>
            )}
          </p>
        </form>
      </main>

      <RabioraFooter />
    </div>
  );
}