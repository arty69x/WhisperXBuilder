import React, { useState } from "react";
import { Settings as SettingsIcon, Shield, Zap, Key, Sparkles, Eye, EyeOff, Github, BrainCircuit } from "lucide-react";
import { useAppStore } from "../store";
import { GEMINI_MODELS } from "../lib/gemini";

export function Settings() {
  const { 
    geminiModel, setGeminiModel, 
    geminiThinkingEnabled, setGeminiThinkingEnabled,
    geminiThinkingBudget, setGeminiThinkingBudget,
    geminiApiKey, setGeminiApiKey,
    githubClientId, setGitHubClientId,
    githubClientSecret, setGitHubClientSecret,
    safeMode, setSafeMode,
    auth
  } = useAppStore();

  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="h-full flex flex-col p-4 md:p-8 bg-white grid-bg overflow-y-auto italic scrollbar-hide">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-black border-4 border-black flex items-center justify-center text-white shadow-[4px_4px_0_gray]">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight leading-none">System Settings</h2>
            <p className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest mt-1">Environment Core Configuration</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-8 pb-10">
        {/* Synthesis Config */}
        <section className="panel p-6 md:p-8 bg-white border-4 border-black shadow-[10px_10px_0_black] space-y-6">
          <div className="flex items-center gap-2 text-blue-600 border-b-4 border-black pb-4">
             <Zap size={18}/> <h3 className="font-black text-sm uppercase italic">Synthesis Core</h3>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-black uppercase text-gray-400">Primary Model</label>
                <select value={geminiModel} onChange={e => setGeminiModel(e.target.value as any)} 
                  className="w-full bg-white border-4 border-black p-4 font-black uppercase text-sm outline-none focus:bg-yellow-50 shadow-[4px_4px_0_black]">
                  {GEMINI_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.label} {m.supportsThinking ? "(Thinking)" : ""}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono font-black uppercase text-gray-400">Thinking Budget ({geminiThinkingBudget} tokens)</label>
                <div className="flex items-center gap-4 h-[60px]">
                  <input type="range" min="128" max="4096" step="128" 
                    value={geminiThinkingBudget} onChange={e => setGeminiThinkingBudget(parseInt(e.target.value))}
                    disabled={!geminiThinkingEnabled}
                    className="flex-1 accent-black h-2 bg-gray-200 border-2 border-black rounded-none appearance-none cursor-pointer" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-4 p-4 border-4 border-black bg-white hover:bg-gray-50 cursor-pointer transition-colors shadow-[4px_4px_0_black]">
                 <input type="checkbox" checked={geminiThinkingEnabled} onChange={e => setGeminiThinkingEnabled(e.target.checked)} 
                   className="w-6 h-6 border-4 border-black accent-black focus:ring-0" />
                 <div className="flex flex-col">
                    <span className="text-xs font-black uppercase">Enable Reasoning</span>
                    <span className="text-[8px] font-bold text-gray-400 italic">Increases synthesis quality.</span>
                 </div>
              </label>

              <label className="flex items-center gap-4 p-4 border-4 border-black bg-white hover:bg-red-50 cursor-pointer transition-colors shadow-[4px_4px_0_gray]">
                 <input type="checkbox" checked={safeMode} onChange={e => setSafeMode(e.target.checked)} 
                   className="w-6 h-6 border-4 border-black accent-black focus:ring-0" />
                 <div className="flex flex-col">
                    <span className="text-xs font-black uppercase">Safe Mode Matrix</span>
                    <span className="text-[8px] font-bold text-gray-400 italic">Enforces stricter payload filtering.</span>
                 </div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-black uppercase text-gray-400">Gemini Ingress Key</label>
              <div className="relative">
                <input type={showApiKey ? "text" : "password"} 
                  value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key..."
                  className="w-full bg-white border-4 border-black p-4 font-mono text-sm outline-none focus:bg-yellow-50 shadow-[4px_4px_0_black]" />
                <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:scale-110 transition-transform">
                  {showApiKey ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* GitHub Integration */}
        <section className="panel p-6 md:p-8 bg-white border-4 border-black shadow-[10px_10px_0_black] space-y-6">
          <div className="flex items-center gap-2 text-indigo-600 border-b-4 border-black pb-4">
             <Github size={18}/> <h3 className="font-black text-sm uppercase italic">Integrations // GitHub</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-black uppercase text-gray-400">Client ID</label>
              <input type="text" value={githubClientId} onChange={e => setGitHubClientId(e.target.value)}
                placeholder="gh_client_id..."
                className="w-full bg-white border-4 border-black p-4 font-mono text-xs outline-none focus:bg-blue-50 shadow-[4px_4px_0_black]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-black uppercase text-gray-400">Client Secret</label>
              <input type="password" value={githubClientSecret} onChange={e => setGitHubClientSecret(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-white border-4 border-black p-4 font-mono text-xs outline-none focus:bg-blue-50 shadow-[4px_4px_0_black]" />
            </div>
          </div>
          <p className="text-[9px] font-bold text-gray-400 italic">Credentials are stored in local storage and injected into server sessions securely.</p>
        </section>

        {/* System Monitoring */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="panel p-6 md:p-8 bg-black text-[#00e676] border-4 border-black shadow-[8px_8px_0_black] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#00e676]/30 pb-2">
               <Shield size={16}/> <h3 className="font-mono font-black text-xs uppercase">Security Integrity</h3>
            </div>
            <div className="font-mono text-[9px] space-y-2 uppercase font-bold">
               <p className="flex justify-between"><span>RUNTIME:</span> <span className="text-white">STRICT_SANDBOX</span></p>
               <p className="flex justify-between"><span>EGRESS:</span> <span className="text-white">PORT_3000</span></p>
               <p className="flex justify-between"><span>ENCRYPTION:</span> <span className="text-white">AES_256_LOCAL</span></p>
            </div>
          </section>

          <section className="panel p-6 md:p-8 bg-black text-strobe-blue border-4 border-black shadow-[8px_8px_0_black] space-y-4">
            <div className="flex items-center gap-2 border-b border-strobe-blue/30 pb-2">
               <BrainCircuit size={16}/> <h3 className="font-mono font-black text-xs uppercase">Neural Stats</h3>
            </div>
            <div className="font-mono text-[9px] space-y-2 uppercase font-bold">
               <p className="flex justify-between"><span>MODEL:</span> <span className="text-white">{geminiModel}</span></p>
               <p className="flex justify-between"><span>BUDGET:</span> <span className="text-white">{geminiThinkingBudget} TKN</span></p>
               <p className="flex justify-between"><span>STATUS:</span> <span className="text-white">{safeMode ? "ARMED" : "UNRESTRICTED"}</span></p>
            </div>
          </section>
        </div>

        <section className="panel p-6 md:p-8 bg-black text-white border-4 border-black shadow-[10px_10px_0_strobe-blue] space-y-6">
           <div className="flex items-center gap-2 border-b border-white/20 pb-4">
              <Key size={18} className="text-strobe-yellow" />
              <h3 className="font-black text-sm uppercase italic">Cryptographic Ingress</h3>
           </div>
           
           <div className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-gray-500">Active Session JWT</label>
                 <div className="p-4 bg-white/5 border border-white/10 font-mono text-[8px] break-all text-strobe-blue">
                    {auth.token || "NO_ACTIVE_SESSION"}
                 </div>
              </div>

              <div className="pt-4 p-4 border-t-2 border-dashed border-white/10">
                 <div className="flex items-center justify-between text-strobe-green">
                    <span className="text-[10px] font-black uppercase">Secret All Value Matrix</span>
                    <Sparkles size={14} />
                 </div>
                 <p className="text-[8px] font-bold text-gray-400 italic mt-2">All secrets are maintained in local state and used only for API calls. Use .env for production overrides.</p>
              </div>
           </div>
        </section>

        <div className="text-center pt-8">
           <p className="text-[9px] font-mono font-black text-gray-300 uppercase tracking-[0.4em]">WhisperX Builder MAX // Core_Build_v2.5</p>
        </div>
      </div>
    </div>
  );
}
