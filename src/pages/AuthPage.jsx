import { useState } from "react";
import { signIn, signUp } from "../lib/auth";

export default function AuthPage({ onAuth }) {
  const [mode, setMode]       = useState("login"); // "login" | "signup"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const inp = "w-full border border-[#D6DFED] rounded px-3 py-2 text-sm font-[IBM_Plex_Sans] bg-[#EEF2F7] outline-none focus:border-[#0091DA] focus:ring-2 focus:ring-[#0091DA]/10 focus:bg-white transition-all";

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email || !password) { setError("Email and password are required."); return; }
    if (mode === "signup" && password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password);
        setSuccess("Account created! Check your email to confirm, then log in.");
        setMode("login");
      } else {
        const data = await signIn(email, password);
        onAuth(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#EEF2F7] flex flex-col">
      {/* Topbar */}
      <div className="bg-[#00338D] h-12 flex items-center px-6 shadow-md">
        <div className="w-8 h-8 bg-[#0091DA] rounded flex items-center justify-center font-mono font-bold text-xs text-white mr-3">IP</div>
        <div>
          <div className="text-xs font-bold tracking-widest text-white uppercase">Infopace Management Pvt Ltd</div>
          <div className="text-[7px] tracking-widest text-white/40 uppercase">Market Intelligence Platform</div>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#08152A] tracking-tight">
              Market <span className="text-[#0091DA] underline underline-offset-4" style={{ textDecorationThickness: 2 }}>Intelligence</span>
            </h1>
            <p className="text-sm text-[#627289] mt-2 max-w-xs mx-auto">
              {mode === "login" ? "Sign in to access your market assessments." : "Create an account to get started."}
            </p>
          </div>

          <div className="bg-white border border-[#D6DFED] rounded shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#00338D]" />

            {/* Tabs */}
            <div className="flex border-b border-[#D6DFED]">
              {["login", "signup"].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                  className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-all
                    ${mode === m ? "bg-white text-[#00338D] border-b-2 border-[#00338D]" : "bg-[#EEF2F7] text-[#627289] hover:text-[#08152A]"}`}>
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-7 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#627289]">Email Address</label>
                <input className={inp} type="email" placeholder="you@company.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#627289]">Password</label>
                <input className={inp} type="password" placeholder="Min. 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>

              {mode === "signup" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#627289]">Confirm Password</label>
                  <input className={inp} type="password" placeholder="Repeat password"
                    value={confirm} onChange={e => setConfirm(e.target.value)} />
                </div>
              )}

              {error   && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
              {success && <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{success}</div>}

              <button type="submit" disabled={loading}
                className="mt-1 px-6 py-2.5 bg-[#00338D] text-white text-sm font-semibold rounded hover:bg-[#005EB8] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Please wait…" : mode === "login" ? "Sign In →" : "Create Account →"}
              </button>

              {mode === "login" && (
                <p className="text-center text-[10px] text-[#9BAABB]">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => { setMode("signup"); setError(""); }}
                    className="text-[#0091DA] hover:underline font-semibold">Sign up free</button>
                </p>
              )}
            </form>
          </div>

          <p className="text-center text-[10px] text-[#9BAABB] mt-4">
            🔒 Your data is stored securely. We never share personal details with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
