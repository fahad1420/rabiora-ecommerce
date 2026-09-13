import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { MobileNavbar } from "./components/MobileNavbar";

const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const AuthPage = lazy(() =>
  import("./pages/Auth").then((module) => ({
    default: module.AuthPage,
  })),
);
const Account = lazy(() => import("./pages/Account"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(
  () => import("./pages/OrderConfirmation"),
);
const Admin = lazy(() => import("./pages/Admin"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CustomerService = lazy(() => import("./pages/CustomerService"));

function Router() {
  return (
    <Suspense
      fallback={
        <main
          className="catalogue-state"
          aria-live="polite"
        >
          Loading Rabiora…
        </main>
      }
    >
      <Switch>
        <Route path="/" component={Home} />

        <Route
          path="/products/:slug"
          component={ProductDetail}
        />

        <Route path="/cart" component={Cart} />

        <Route
          path="/wishlist"
          component={Wishlist}
        />

        <Route path="/login">
          <AuthPage mode="login" />
        </Route>

        <Route path="/register">
          <AuthPage mode="register" />
        </Route>

        <Route
          path="/account"
          component={Account}
        />

        <Route
          path="/account/orders/:orderNumber"
          component={OrderDetail}
        />

        <Route
          path="/checkout"
          component={Checkout}
        />

        <Route
          path="/order-confirmation/:orderNumber"
          component={OrderConfirmation}
        />

        <Route path="/terms" component={TermsAndConditions} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/customer-service" component={CustomerService} />
        <Route path="/customer-service/:topic" component={CustomerService} />
        <Route path="/faq" component={CustomerService} />
        <Route path="/returns" component={CustomerService} />
        <Route path="/shipping" component={CustomerService} />
        <Route path="/fabric-care" component={CustomerService} />
        <Route path="/how-to-order" component={CustomerService} />
        <Route path="/payment-help" component={CustomerService} />

        <Route
          path="/admin"
          component={Admin}
        />

        <Route
          path="/admin/products"
          component={Admin}
        />

        <Route
          path="/admin/categories"
          component={Admin}
        />

        <Route
          path="/admin/orders"
          component={Admin}
        />

        <Route
          path="/admin/customers"
          component={Admin}
        />

        <Route
          path="/admin/customers/:id"
          component={Admin}
        />

        <Route
          path="/admin/reviews"
          component={Admin}
        />

        <Route
          path="/admin/offers"
          component={Admin}
        />

        <Route
          path="/admin/coupons"
          component={Admin}
        />

        <Route
          path="/admin/subscribers"
          component={Admin}
        />

        <Route
          path="/admin/settings"
          component={Admin}
        />

        <Route path="/404" component={NotFound} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <LanguageProvider>
          <TooltipProvider>
            <Router />
            <MobileNavbar />
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}