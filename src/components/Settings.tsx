import React from "react";
import { Settings as SettingsIcon, Shield, Zap, Key, Sparkles } from "lucide-react";
import { useAppStore } from "../store";

export function Settings() {
  const { geminiModel, setGeminiModel, geminiThinkingEnabled, setGeminiThinkingEnabled } = useAppStore();

  return (
    <div className="h-full flex flex-col p-8 bg-white grid-bg overflow-hidden italic">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black border-4 border-black flex items-center justify-center text-white shadow-[4px_4px_0_gray]">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">System Settings</h2>
            <p className="text-[10px] font-mono text-gray-400 uppercase font-black">Environment Core Configuration</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl space-y-8 overflow-y-auto pr-4 scrollbar-hide">
        <section className="panel p-8 bg-white border-4 border-black shadow-[10px_10px_0_black] space-y-6">
          <div className="flex items-center gap-2 text-blue-600 border-b-2 border-black pb-2">
             <Zap size={16}/> <h3 className="font-black text-xs uppercase italic">Directives & Logic</h3>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-black uppercase text-gray-400">Primary Synthesis Model</label>
              <select value={geminiModel} onChange={e => setGeminiModel(e.target.value as any)} 
                className="w-full bg-white border-4 border-black p-4 font-black uppercase text-sm outline-none focus:bg-yellow-50">
                <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
            </div>
            
            <label className="flex items-center gap-4 p-4 border-4 border-black bg-white hover:bg-gray-50 cursor-pointer transition-colors shadow-[4px_4px_0_black]">
               <input type="checkbox" checked={geminiThinkingEnabled} onChange={e => setGeminiThinkingEnabled(e.target.checked)} 
                 className="w-6 h-6 border-4 border-black accent-black focus:ring-0" />
               <div className="flex flex-col">
                  <span className="text-xs font-black uppercase">Enable Deep Reasoning Mode</span>
                  <span className="text-[9px] font-bold text-gray-400 italic">Increases synthesis quality but adds processing overhead.</span>
               </div>
            </label>
          </div>
        </section>

        <section className="panel p-8 bg-black text-[#00e676] border-4 border-black shadow-[10px_10px_0_gray] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#00e676]/30 pb-2">
             <Shield size={16}/> <h3 className="font-mono font-black text-xs uppercase">Security Integrity</h3>
          </div>
          <div className="font-mono text-[10px] space-y-2">
             <p className="flex justify-between"><span>RUNTIME:</span> <span>STRICT_SANDBOX</span></p>
             <p className="flex justify-between"><span>INTERFACE:</span> <span>IFRAME_PROTOCOL</span></p>
             <p className="flex justify-between"><span>EGRESS_PORT:</span> <span>3000 (HARDCODED)</span></p>
             <p className="flex justify-between"><span>CORE_EPOCH:</span> <span>2027_GEN_4</span></p>
          </div>
        </section>

        <section className="panel p-8 bg-black text-white border-4 border-black shadow-[10px_10px_0_strobe-blue] space-y-6">
           <div className="flex items-center gap-2 border-b border-white/20 pb-4">
              <Key size={18} className="text-strobe-yellow" />
              <h3 className="font-black text-sm uppercase italic">Cryptographic Ingress</h3>
           </div>
           
           <div className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-gray-500">Active Session JWT</label>
                 <div className="p-4 bg-white/5 border border-white/10 font-mono text-[9px] break-all text-strobe-blue">
                    {useAppStore.getState().auth.token || "NO_ACTIVE_SESSION"}
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-gray-500">Client UUID Identifier</label>
                 <div className="p-4 bg-white/5 border border-white/10 font-mono text-[9px] text-strobe-yellow">
                    {useAppStore.getState().auth.user?.id || "ANONYMOUS_NODE"}
                 </div>
              </div>

              <div className="pt-4 p-4 border-t-2 border-dashed border-white/10">
                 <div className="flex items-center justify-between text-strobe-green">
                    <span className="text-[10px] font-black uppercase">Secret All Value Matrix</span>
                    <Sparkles size={14} />
                 </div>
                 <p className="text-[9px] font-bold text-gray-400 italic mt-2">All environmental variables and secrets are injected via the secure .env interface and strictly separated from the client bundle.</p>
              </div>
           </div>
        </section>

        <div className="text-center pt-8 border-t-2 border-dashed border-gray-200">
           <p className="text-[10px] font-mono font-black text-gray-300 uppercase tracking-[0.4em]">WhisperX Builder MAX // Core_Build_v2.1</p>
        </div>
      </div>
    </div>
  );
}
