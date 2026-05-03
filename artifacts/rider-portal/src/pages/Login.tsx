import { useState } from "react";
import { useRider } from "@/contexts/RiderContext";

export default function Login() {
  const { login } = useRider();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !pin.trim()) return;
    setLoading(true);
    setError("");
    const success = await login(phone.trim(), pin);
    if (!success) setError("Invalid phone or PIN. Try rider / 1234");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary px-6 pt-14 pb-10 text-white">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl mb-4">🛵</div>
        <h1 className="text-3xl font-bold leading-tight">Fittrac<br />Rider App</h1>
        <p className="text-white/70 mt-1 text-sm">Sign in to start earning</p>
      </div>

      <div className="flex-1 px-6 py-8">
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 802 345 6789 or 'rider'"
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-border bg-card text-foreground text-base focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your 4-digit PIN"
              maxLength={6}
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-border bg-card text-foreground text-base focus:outline-none focus:border-primary tracking-widest transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !phone || !pin}
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in…</>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-8 bg-accent/50 rounded-2xl p-4">
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Demo Credentials</div>
          <div className="text-sm text-foreground space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Phone/ID:</span><span className="font-mono font-semibold">rider</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">PIN:</span><span className="font-mono font-semibold">1234</span></div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
          <span>🌿</span>
          <span>Part of the Fittrac Kitchen ecosystem — Nigeria's wellness food platform</span>
        </div>
      </div>
    </div>
  );
}
