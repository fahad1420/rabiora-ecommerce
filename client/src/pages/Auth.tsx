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

  const [resetStep, setResetStep] =
    useState<ResetStep>("request");

  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const [error, setError] = useState("");

  const register = trpc.customer.register.useMutation();
  const login = trpc.customer.login.useMutation();

  const requestPasswordReset =
    trpc.customer.requestPasswordReset.useMutation();

  const resetPassword =
    trpc.customer.resetPassword.useMutation();

  const mergeGuestWishlist =
    trpc.wishlist.mergeGuest.useMutation();

  const utils = trpc.useUtils();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      if (mode === "register") {
        await register.mutateAsync({
          name,
          phone,
          password,
          anonymousToken: getGuestCartToken(),
        });
      } else {
        await login.mutateAsync({
          phone,
          password,
          anonymousToken: getGuestCartToken(),
        });
      }

      const guestWishlist = getGuestWishlist();

      if (guestWishlist.length > 0) {
        await mergeGuestWishlist.mutateAsync({
          productIds: guestWishlist,
        });

        clearGuestWishlist();
      }

      await utils.customer.me.invalidate();
      await utils.wishlist.list.invalidate();

      navigate("/account");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t("continueError"),
      );
    }
  };

  const handleRequestReset = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setResetError("");
    setResetMessage("");
    setDevOtp("");

    try {
      const result =
        await requestPasswordReset.mutateAsync({
          phone,
        });

      setResetStep("verify");

      if (result.devOtp) {
        setDevOtp(result.devOtp);
        setResetMessage(
          "Verification code generated. Use the code shown below.",
        );
      } else {
        setResetMessage(
          "If an account exists for this phone number, a verification code has been sent.",
        );
      }
    } catch (cause) {
      setResetError(
        cause instanceof Error
          ? cause.message
          : "Unable to request password reset.",
      );
    }
  };

  const handleResetPassword = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setResetError("");
    setResetMessage("");

    if (newPassword.length < 8) {
      setResetError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    try {
      await resetPassword.mutateAsync({
        phone,
        otpCode,
        newPassword,
      });

      setResetMessage(
        "Password reset successfully. You can now log in with your new password.",
      );

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
          : "Unable to reset password.",
      );
    }
  };

  const pending =
    register.isPending || login.isPending;

  const resetPending =
    requestPasswordReset.isPending ||
    resetPassword.isPending;

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
              Reset Password
            </span>

            <h1>
              {resetStep === "request"
                ? "Forgot your password?"
                : "Create a new password"}
            </h1>

            <p>
              {resetStep === "request"
                ? "Enter your registered Bangladesh phone number to reset your password."
                : "Enter the verification code and choose a new password."}
            </p>

            <label>
              {t("bangladeshPhone")}
              <input
                required
                inputMode="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                disabled={resetStep === "verify"}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
              />
            </label>

            {resetStep === "verify" && (
              <>
                <label>
                  Verification Code
                  <input
                    required
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
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
                  <div className="form-success">
                    <strong>Development OTP:</strong>{" "}
                    {devOtp}
                  </div>
                )}

                <label>
                  New Password
                  <input
                    required
                    type="password"
                    minLength={8}
                    maxLength={72}
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
              <p
                className="form-error"
                role="alert"
              >
                {resetError}
              </p>
            )}

            {resetMessage && (
              <p
                className="form-success"
                role="status"
              >
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
                  ? "Send Verification Code"
                  : "Reset Password"}
            </button>

            {resetStep === "verify" && (
              <button
                type="button"
                className="btn"
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
                Change Phone Number
              </button>
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
                Back to Login
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
            {t("bangladeshPhone")}
            <input
              required
              inputMode="tel"
              placeholder="01XXXXXXXXX"
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