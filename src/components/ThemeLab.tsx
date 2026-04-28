import React from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { Palette, Box, Layers, MousePointer2, Settings2, Sparkles } from "lucide-react";
import { useAppStore } from "../store";
import { cn } from "../lib/utils";

export function ThemeLab() {
  const { theme, setTheme } = useAppStore();

  const PRIMARY_PALETTE = [
    { name: "Brutalist White", color: "#ffffff", border: "#000000" },
    { name: "Toxic Green", color: "#16a34a", border: "#000000" },
    { name: "Vivid Blue", color: "#2563eb", border: "#000000" },
    { name: "Cyber Yellow", color: "#eab308", border: "#000000" },
    { name: "Deep Red", color: "#dc2626", border: "#000000" },
    { name: "Solid Black", color: "#000000", border: "#ffffff" },
  ];

  return (
    <div className="h-full flex flex-col p-8 bg-white grid-bg overflow-hidden italic">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-400 border-4 border-black flex items-center justify-center text-black shadow-[4px_4px_0_black]">
            <Palette size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">Theme Lab</h2>
            <p className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest">Aesthetic Synthesis Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 border-4 border-black bg-white font-black text-xs uppercase shadow-[4px_4px_0_black]">
           <Sparkles size={14} className="text-yellow-500" /> Auto-Balance Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 flex-1 overflow-y-auto pr-4 scrollbar-hide">
        <div className="space-y-8">
          <section className="space-y-6">
             <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 border-b-4 border-black pb-2">
                <Box size={16} /> Color Foundation
             </h3>
             <div className="grid grid-cols-2 gap-4">
                {PRIMARY_PALETTE.map((p) => (
                   <button key={p.name} 
                      className="group flex items-center gap-4 p-4 border-4 border-black bg-white shadow-brutal transition-all hover:-translate-y-1 hover:bg-black hover:text-white">
                      <div className="w-10 h-10 border-2 border-black" style={{ backgroundColor: p.color }} />
                      <div className="text-left">
                         <p className="text-[10px] font-black uppercase">{p.name}</p>
                         <p className="text-[8px] font-mono opacity-50">{p.color}</p>
                      </div>
                   </button>
                ))}
             </div>
          </section>

          <section className="space-y-6">
             <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 border-b-4 border-black pb-2">
                <Sparkles size={16} /> Node Vector Simulation
             </h3>
             <div className="panel p-0 bg-black h-48 overflow-hidden relative group">
                <svg className="w-full h-full opacity-40">
                   <pattern id="node-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="#2563eb" />
                   </pattern>
                   <rect width="100%" height="100%" fill="url(#node-grid)" />
                   
                   <motion.circle 
                     animate={{ cx: [100, 250, 150], cy: [50, 150, 80] }}
                     transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                     r="40" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="10 5" 
                   />
                   <motion.circle 
                     animate={{ cx: [300, 100, 200], cy: [150, 50, 120] }}
                     transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                     r="30" fill="none" stroke="#16a34a" strokeWidth="2" strokeDasharray="5 5" 
                   />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-white border-4 border-black p-4 shadow-brutal-sm group-hover:scale-110 transition-transform">
                      <span className="text-[10px] font-black uppercase italic">2027_NODE_ACTIVE</span>
                   </div>
                </div>
             </div>
          </section>

          <section className="space-y-6">
             <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 border-b-4 border-black pb-2">
                <Layers size={16} /> Geometric Parameters
             </h3>
             <div className="grid grid-cols-1 gap-4">
                {["Shadow Depth", "Border Weight", "Grid Density", "Animation Velocity"].map(param => (
                   <div key={param} className="space-y-2">
                      <div className="flex justify-between font-black uppercase text-[10px]">
                         <span>{param}</span>
                         <span className="text-blue-600">80%</span>
                      </div>
                      <div className="h-6 border-4 border-black relative bg-white overflow-hidden">
                         <div className="absolute inset-0 bg-black animate-[pulse_2s_infinite]" style={{ width: '80%' }} />
                      </div>
                   </div>
                ))}
             </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-6">
             <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 border-b-4 border-black pb-2">
                <MousePointer2 size={16} /> Interaction HUD
             </h3>
             <div className="panel p-8 bg-white border-4 border-black shadow-[15px_15px_0_black] space-y-6">
                <div className="space-y-2">
                   <div className="w-full h-8 bg-black flex items-center px-4 gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                   </div>
                   <div className="p-4 border-4 border-black bg-white font-bold text-xs leading-relaxed italic">
                      "I've analyzed your project constraints. The current geometric balance is optimized for high-impact visual delivery."
                   </div>
                </div>
                <div className="flex gap-4">
                   <button 
                    onClick={() => {
                        confetti({
                            particleCount: 150,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: ['#2563eb', '#dc2626', '#eab308', '#16a34a']
                        });
                    }}
                    className="btn btn-accent flex-1">Apply Logic</button>
                   <button onClick={() => setTheme("midnight-galaxy")} className="btn flex-1">Discard</button>
                </div>
             </div>
          </section>

          <section className="space-y-6">
             <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 border-b-4 border-black pb-2">
                <Settings2 size={16} /> Global Injection
             </h3>
             <div className="p-6 border-4 border-black bg-black text-[#00e676] font-mono text-[10px] space-y-2 leading-tight">
                <p>/* Theme Variable Injection */</p>
                <p>--brutalist-bg: #FFFFFF;</p>
                <p>--brutalist-accent: #2563EB;</p>
                <p>--brutalist-shadow: 12px 12px 0px #000000;</p>
                <p>--kerning: -0.05em;</p>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
