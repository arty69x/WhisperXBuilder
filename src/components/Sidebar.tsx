import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Ghost, Eye, Hammer, FlaskConical, Palette, Settings, 
  ChevronLeft, ChevronRight, Key, Sparkles, Github
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAppStore, THEMES } from "../store";
import type { ModuleId } from "../types";

const NAV: { id: ModuleId; label: string; icon: React.ReactNode; group: string; isNew?: boolean }[] = [
  { id:"ghost-team",      label:"Ghost Team",       icon:<Ghost size={16}/>,        group:"AI" },
  { id:"vision-pipeline", label:"Vision Pipeline",  icon:<Eye size={16}/>,          group:"AI", isNew:true },
  { id:"builder",         label:"Builder Studio",   icon:<Hammer size={16}/>,       group:"Builder", isNew:true },
  { id:"github",          label:"GitHub Forge",     icon:<Github size={16}/>,       group:"Builder", isNew:true },
  { id:"skill-forge",     label:"Skill Forge",      icon:<FlaskConical size={16}/>, group:"Builder", isNew:true },
  { id:"theme-lab",       label:"Theme Lab",        icon:<Palette size={16}/>,      group:"Builder" },
  { id:"settings",        label:"Settings",         icon:<Settings size={16}/>,     group:"System" },
];

const GROUPS = ["AI", "Builder", "System"];

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, activeModule, setActiveModule } = useAppStore();

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn("fixed md:relative z-50 flex flex-col h-screen border-r-8 transition-all duration-300 flex-shrink-0 bg-white border-black italic",
        sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full w-72 md:translate-x-0 md:w-[90px]")}>

        <div className="h-20 md:h-24 flex items-center px-6 border-b-8 border-black flex-shrink-0 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-red-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="w-10 h-10 md:w-12 md:h-12 bg-black border-4 border-black flex items-center justify-center flex-shrink-0 font-black text-lg md:text-xl text-white shadow-brutal-sm rotate-3 group-hover:rotate-0 transition-transform">
            WX
          </div>
          <div className={cn("ml-4 transition-all duration-300", 
            (sidebarOpen || false) ? "opacity-100 translate-x-0" : "md:opacity-0 md:-translate-x-10 pointer-events-none")}>
             <h1 className="text-xl font-black uppercase text-holo leading-none">WhisperX</h1>
             <p className="text-[9px] font-mono font-black text-gray-400 mt-1">BUILDER_MAX.27</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-hide py-6 md:py-8 px-4 flex flex-col space-y-3 md:space-y-4">
          {NAV.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button key={item.id} onClick={() => {
                setActiveModule(item.id);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
                className={cn("w-full flex items-center transition-all duration-200 group relative flex-shrink-0 border-4 border-black p-3 md:p-4 py-2 md:py-3",
                  isActive 
                    ? "bg-black text-white shadow-brutal-sm -translate-y-1 translate-x-1" 
                    : "bg-white text-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-1")}>
                <div className={cn("transition-transform group-hover:scale-125 group-hover:rotate-12", 
                  isActive ? "text-strobe-yellow" : "text-black")}>
                  {item.icon}
                </div>
                <span className={cn("ml-4 font-black uppercase text-[10px] tracking-widest transition-all",
                  sidebarOpen ? "opacity-100 translate-x-0" : "md:opacity-0 md:-translate-x-4 md:pointer-events-none")}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute right-2 w-2 h-2 bg-strobe-blue animate-ping" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t-8 border-black flex flex-col gap-4 bg-white">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full h-12 flex items-center justify-center border-4 border-black hover:bg-black hover:text-white transition-all shadow-brutal-sm active:shadow-none translate-x-0 active:translate-x-1 active:translate-y-1">
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </aside>
    </>
  );
}
