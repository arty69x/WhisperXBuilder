import React, { useState } from "react";
import { Hammer, Plus, Play, Download, Sparkles, Loader, Layout, Target, Box, ChevronRight, CheckCircle2, Package } from "lucide-react";
import { cn, uid, now, downloadText } from "../lib/utils";
import { geminiStream } from "../lib/gemini";
import { useAppStore, TEMPLATES } from "../store";
import type { LockspecDoc, TemplateId } from "../types";

export function BuilderStudio() {
  const { lockspecs, activeLockspecId, addLockspec, updateLockspec, setActiveLockspecId } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");
  
  // Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [wizardConfig, setWizardConfig] = useState({
    name: "",
    description: "",
    stack: "",
    modules: [] as string[]
  });

  const active = lockspecs.find(l => l.id === activeLockspecId) ?? null;

  const handleStartWizard = () => {
    setShowWizard(true);
    setWizardStep(1);
    setSelectedTemplate(null);
    setWizardConfig({ name: "", description: "", stack: "", modules: [] });
  };

  const handleSelectTemplate = (t: typeof TEMPLATES[0]) => {
    setSelectedTemplate(t.id);
    setWizardConfig({
      name: t.label,
      description: t.description,
      stack: t.stack.join(", "),
      modules: t.initialModules
    });
    setWizardStep(2);
  };

  const finalizeWizard = () => {
    const l: LockspecDoc = {
      id: uid(),
      name: wizardConfig.name,
      version: "1.0.0",
      stack: wizardConfig.stack,
      objective: wizardConfig.description,
      modules: wizardConfig.modules,
      constraints: ["Performance", "Security", "SEO"],
      geminiModel: "gemini-3-flash-preview",
      thinkingEnabled: true,
      createdAt: now()
    };
    addLockspec(l);
    setActiveLockspecId(l.id);
    setShowWizard(false);
  };

  const generate = async () => {
    if (!active || isGenerating) return;
    setIsGenerating(true);
    setOutput("");
    
    // Get global config if not override in spec
    const { geminiModel, geminiThinkingBudget } = useAppStore.getState();

    await geminiStream(`Generate a full-stack project blueprint for: ${active.objective}. 
Stack: ${active.stack}.
Modules: ${active.modules.join(", ")}.
Format as a ready-to-run shell script or deployment guide.`, {
      model: active.geminiModel || geminiModel,
      thinkingBudget: active.thinkingEnabled ? geminiThinkingBudget : undefined,
      onChunk: (chunk) => setOutput(prev => prev + chunk),
      onDone: () => setIsGenerating(false),
      onError: (err) => {
        console.error(err);
        setIsGenerating(false);
        setOutput(prev => prev + "\n\n❌ [CORE_SYSTEM_FAILURE]: " + err.message);
      },
    });
  };

  return (
    <div className="h-full flex flex-col p-8 bg-white grid-bg overflow-hidden italic">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 border-4 border-black flex items-center justify-center text-white shadow-[4px_4px_0_black]">
            <Hammer size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight italic">Builder Studio</h2>
            <p className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest">Synthesize Applications v2.1_PHASE_THREE</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleStartWizard} className="btn bg-[#ffab00] hover:bg-[#ffc107]"><Layout size={16}/> Project Wizard</button>
          <button onClick={() => {
             const l = { id:uid(), name:"New Blank", version:"1.0.0", stack:"React", objective:"", modules:[], constraints:[], geminiModel:"gemini-3-flash-preview" as any, thinkingEnabled:true, createdAt:now() };
             addLockspec(l);
             setActiveLockspecId(l.id);
          }} className="btn btn-accent"><Plus size={16}/> Blank Space</button>
        </div>
      </div>

      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="panel w-full max-w-4xl p-0 bg-white border-8 border-black shadow-[20px_20px_0_black] flex flex-col max-h-[80vh]">
            <div className="panel-header bg-black text-white flex justify-between items-center px-8 py-6">
               <div className="flex items-center gap-4">
                  <Package className="text-yellow-400" />
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Genesis Wizard // Step {wizardStep} of 4</h3>
               </div>
               <button onClick={() => setShowWizard(false)} className="text-3xl font-black hover:text-red-500 transition-colors">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-10">
              {wizardStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => handleSelectTemplate(t)}
                      className="p-8 border-4 border-black text-left hover:bg-yellow-50 transition-all group flex flex-col h-full bg-white shadow-[8px_8px_0_black] hover:shadow-[12px_12px_0_black] hover:-translate-y-2">
                      <span className="text-5xl mb-6 block group-hover:rotate-12 transition-transform">{t.icon}</span>
                      <h4 className="font-black text-xl uppercase mb-3">{t.label}</h4>
                      <p className="text-[11px] font-bold text-gray-500 leading-relaxed flex-1 mb-6 italic">{t.description}</p>
                      <div className="text-[10px] font-mono font-black border-t-2 border-black pt-4 flex justify-between items-center text-blue-600">
                        <span>SELECT ARCHETYPE</span>
                        <ChevronRight size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {wizardStep === 2 && (
                <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right duration-300">
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 italic">Project Name</label>
                      <input value={wizardConfig.name} onChange={e => setWizardConfig({...wizardConfig, name: e.target.value})}
                        className="w-full bg-white border-4 border-black p-4 text-2xl font-black uppercase outline-none focus:bg-blue-50" placeholder="PROJECT_ALPHA..." />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 italic">Core Stack (CSV)</label>
                      <input value={wizardConfig.stack} onChange={e => setWizardConfig({...wizardConfig, stack: e.target.value})}
                        className="w-full bg-white border-4 border-black p-4 text-sm font-black outline-none focus:bg-green-50" placeholder="React, Tailwind, Node..." />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 italic">Objective / Mission</label>
                      <textarea value={wizardConfig.description} onChange={e => setWizardConfig({...wizardConfig, description: e.target.value})}
                        className="w-full bg-white border-4 border-black p-4 text-sm font-bold h-40 resize-none outline-none focus:bg-yellow-50" placeholder="Deploy a serverless blog with..." />
                   </div>
                   <div className="flex justify-between pt-8">
                      <button onClick={() => setWizardStep(1)} className="btn">Back</button>
                      <button onClick={() => setWizardStep(3)} disabled={!wizardConfig.name} className="btn btn-accent px-12">Next Phase</button>
                   </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right duration-300">
                   <h4 className="text-sm font-black uppercase text-gray-400 mb-4">Select Core Modules to Inject</h4>
                   <div className="grid grid-cols-2 gap-4">
                      {["ghost-team", "vision-pipeline", "builder", "doc-atelier", "theme-lab", "github"].map(mod => {
                        const active = wizardConfig.modules.includes(mod);
                        return (
                          <button key={mod} onClick={() => {
                            const next = active ? wizardConfig.modules.filter(m => m !== mod) : [...wizardConfig.modules, mod];
                            setWizardConfig({...wizardConfig, modules: next});
                          }}
                          className={cn("p-6 border-4 font-black uppercase text-xs flex items-center justify-between transition-all",
                            active ? "bg-black text-white border-black" : "bg-white text-black border-gray-200 hover:border-black")}>
                            {mod.replace("-"," ")}
                            {active && <CheckCircle2 size={16} className="text-green-400" />}
                          </button>
                        )
                      })}
                   </div>
                   <div className="flex justify-between pt-12">
                      <button onClick={() => setWizardStep(2)} className="btn">Back</button>
                      <button onClick={() => setWizardStep(4)} className="btn btn-accent px-12">Review</button>
                   </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="max-w-2xl mx-auto animate-in scale-95 duration-300">
                   <div className="p-8 border-4 border-black bg-gray-50 space-y-6">
                      <div className="flex items-center gap-4 text-blue-600 mb-4">
                        <CheckCircle2 size={32} />
                        <h4 className="text-3xl font-black uppercase tracking-tighter">Final Configuration</h4>
                      </div>
                      <div className="space-y-4 text-sm font-bold">
                         <p><span className="text-gray-400">ARCHETYPE:</span> {selectedTemplate}</p>
                         <p><span className="text-gray-400">DESIGNATION:</span> {wizardConfig.name}</p>
                         <p><span className="text-gray-400">TECHNOLOGY:</span> {wizardConfig.stack}</p>
                         <p><span className="text-gray-400">MODULES:</span> {wizardConfig.modules.join(", ")}</p>
                      </div>
                      <div className="p-4 bg-yellow-100 border-2 border-yellow-400 text-[10px] uppercase font-black">
                         Warning: This will initialize a new lockspec and clear the current workspace buffer.
                      </div>
                   </div>
                   <div className="flex justify-between pt-12">
                      <button onClick={() => setWizardStep(3)} className="btn">Back</button>
                      <button onClick={finalizeWizard} className="btn btn-success px-12 py-4 text-lg">Initialize Project</button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!active ? (
         <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-8 border-dashed border-gray-100 p-20 grayscale opacity-30">
            <Target size={120} className="mb-8" />
            <p className="font-black uppercase tracking-widest text-2xl">Awaiting Directives // Init Workspace</p>
         </div>
      ) : (
        <div className="flex-1 flex gap-12 overflow-hidden">
          <div className="w-1/3 space-y-8 overflow-y-auto pr-6 scrollbar-hide">
             <div className="panel p-8 space-y-8 bg-white border-4 border-black shadow-[10px_10px_0_black]">
                <div className="space-y-2">
                   <label className="text-[10px] font-mono font-black uppercase text-gray-400 italic">Designation</label>
                   <input value={active.name} onChange={e => updateLockspec(active.id, { name: e.target.value })} 
                      className="w-full bg-transparent border-b-8 border-black font-black text-3xl uppercase outline-none focus:text-blue-600 transition-colors" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-mono font-black uppercase text-gray-400 italic">Operational Objectives</label>
                   <textarea value={active.objective} onChange={e => updateLockspec(active.id, { objective: e.target.value })} 
                      className="w-full bg-white border-4 border-black h-64 p-6 font-bold text-base resize-none outline-none focus:bg-blue-50 leading-relaxed" placeholder="Synthesize goals..." />
                </div>
                <div className="flex flex-col gap-4">
                  <button onClick={generate} disabled={isGenerating} className="btn btn-success w-full justify-center py-6 text-xl shadow-[6px_6px_0_black] hover:shadow-[10px_10px_0_black]">
                    {isGenerating ? <Loader className="animate-spin" /> : <Sparkles />} 
                    <span className="ml-4">INIT SYNTESIS</span>
                  </button>
                  <button 
                    onClick={() => {
                        const next = lockspecs.filter(l => l.id !== active.id);
                        useAppStore.setState({ lockspecs: next, activeLockspecId: next[0]?.id || null });
                    }}
                    className="btn btn-danger w-full py-2 text-[10px] opacity-70 hover:opacity-100">
                    Terminate Lockspec
                  </button>
                </div>
             </div>
          </div>
          
          <div className="flex-1 flex flex-col bg-[#070c12] text-[#00e676] p-0 relative border-8 border-black overflow-hidden shadow-[15px_15px_0_gray]">
             <div className="bg-black border-b-4 border-black p-4 flex items-center justify-between">
                <div className="flex gap-2">
                   <div className="w-3 h-3 bg-red-600 border-2 border-black" />
                   <div className="w-3 h-3 bg-yellow-400 border-2 border-black" />
                   <div className="w-3 h-3 bg-green-500 border-2 border-black" />
                </div>
                <span className="text-[10px] font-mono font-black tracking-[0.3em] uppercase text-gray-500">Kernel.log // {active.name.toLowerCase().replace(/ /g,"-")}.ps1</span>
             </div>
             <pre className="flex-1 p-8 font-mono text-sm overflow-auto leading-loose scrollbar-hide selection:bg-green-500 selection:text-black">
                {output || (isGenerating ? "// Parsing architectural directives..." : "// Awaiting input stream...")}
             </pre>
             {output && (
               <div className="p-6 bg-black border-t-4 border-black flex justify-end gap-4">
                 <button onClick={() => downloadText(`${active.name}.ps1`, output)} className="px-6 py-3 bg-white text-black font-black text-xs uppercase hover:bg-yellow-400 transition-colors flex items-center gap-3 border-4 border-black shadow-[4px_4px_0_gray]">
                   <Download size={14}/> Discharge Blueprint
                 </button>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
