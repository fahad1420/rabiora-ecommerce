import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import { AuthPage } from "./pages/Auth";
import Account from "./pages/Account";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Admin from "./pages/Admin";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/products/:slug" component={ProductDetail} />
    <Route path="/cart" component={Cart} />
    <Route path="/wishlist" component={Wishlist} />
    <Route path="/login"><AuthPage mode="login" /></Route>
    <Route path="/register"><AuthPage mode="register" /></Route>
    <Route path="/account" component={Account} />
    <Route path="/checkout" component={Checkout} />
    <Route path="/order-confirmation/:orderNumber" component={OrderConfirmation} />
    <Route path="/admin" component={Admin} />
    <Route path="/admin/products" component={Admin} />
    <Route path="/admin/orders" component={Admin} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Router /><Toaster /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
