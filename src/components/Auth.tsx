import React, { useState } from "react";
import { useAppStore } from "../store";
import { Loader, LogIn, UserPlus } from "lucide-react";

export function Auth() {
  const { setAuth } = useAppStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setAuth({ user: data.user, token: data.token });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white grid-bg p-6 italic">
      <div className="w-full max-w-md panel p-12 space-y-8 bg-white border-8 border-black shadow-[20px_20px_0_black] relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-strobe-blue via-strobe-red to-strobe-yellow" />
        
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-black border-4 border-black flex items-center justify-center text-white font-black text-3xl shadow-brutal-sm rotate-3 group-hover:rotate-0 transition-transform">
            WX
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-holo">WhisperX</h1>
            <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.3em] mt-2">
              {isLogin ? "IDENTITY_VERIFICATION_REQUIRED" : "NEW_NODE_REGISTRATION"}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-strobe-red text-white font-black text-[10px] uppercase text-center border-4 border-black shadow-brutal-sm">
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-1">E-mail Vector</label>
            <input type="email" placeholder="ADMIN@WHISPERX.IO" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-6 py-4 border-4 border-black font-black uppercase text-xs outline-none focus:bg-strobe-blue/5 transition-colors" />
          </div>
          
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Identity Tag</label>
              <input type="text" placeholder="USER_NODE_77" value={username} onChange={(e) => setUsername(e.target.value)} required
                className="w-full px-6 py-4 border-4 border-black font-black uppercase text-xs outline-none focus:bg-strobe-green/5 transition-colors" />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Cryptographic Key</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-6 py-4 border-4 border-black font-black text-xs outline-none focus:bg-strobe-yellow/5 transition-colors" />
          </div>

          <button type="submit" disabled={loading} className="w-full btn btn-accent py-5 text-xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
            <div className="relative flex items-center justify-center gap-3">
              {loading ? <Loader className="animate-spin" /> : (isLogin ? <LogIn /> : <UserPlus />)}
              <span>{loading ? "SYNTHESIZING..." : (isLogin ? "INITIALIZE" : "REGISTER")}</span>
            </div>
          </button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} className="w-full text-[9px] font-black uppercase text-gray-400 hover:text-black transition-colors tracking-widest">
          {isLogin ? "// REQUEST_IDENTITY_CREATION" : "// ACCESS_EXISTING_VAULT"}
        </button>
      </div>
    </div>
  );
}
