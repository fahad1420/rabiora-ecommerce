import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { RabioraFooter } from "@/components/RabioraFooter";
import { RabioraHeader } from "@/components/RabioraHeader";
import { useRabioraCart } from "@/hooks/useRabioraCart";
import { useRabioraWishlist } from "@/hooks/useRabioraWishlist";
import { trpc } from "@/lib/trpc";

export default function Account() {
  const [, navigate] = useLocation();
  const cart = useRabioraCart();
  const wishlist = useRabioraWishlist();
  const customer = trpc.customer.me.useQuery();
  const logout = trpc.customer.logout.useMutation({ onSuccess: () => customer.refetch() });
  const updateProfile = trpc.customer.updateProfile.useMutation({ onSuccess: () => customer.refetch() });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  useEffect(() => { setName(customer.data?.name ?? ""); setEmail(customer.data?.email ?? ""); }, [customer.data?.name, customer.data?.email]);
  if (!customer.data) { navigate("/login"); return null; }
  const saveProfile = async (event: FormEvent) => { event.preventDefault(); await updateProfile.mutateAsync({ name, email }); };
  return <div className="page-shell"><RabioraHeader cartCount={cart.count} wishlistCount={wishlist.count} /><main className="account-page"><div className="account-card"><span className="badge">My Account</span><h1>{customer.data.name ?? "Rabiora Customer"}</h1><p><strong>Phone:</strong> {customer.data.phone ?? "Not provided"}</p><p><strong>Saved wishlist items:</strong> {wishlist.count}</p><form className="profile-form" onSubmit={saveProfile}><label>Name<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>Email (optional)<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><button className="btn" disabled={updateProfile.isPending}>{updateProfile.isPending ? "Saving..." : "Save Profile"}</button></form><p className="muted">Order history and saved addresses will appear here after checkout is completed.</p><button className="text-button" onClick={() => logout.mutate()}>Logout</button></div></main><RabioraFooter /></div>;
}
