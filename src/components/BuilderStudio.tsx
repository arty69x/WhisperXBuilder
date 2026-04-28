import React, { useState } from "react";
import { Hammer, Plus, Download, Sparkles, Loader, Layout, Target, ChevronRight, CheckCircle2, Package, Monitor, FileArchive } from "lucide-react";
import JSZip from "jszip";
import { cn, uid, now, downloadText } from "../lib/utils";
import { geminiStream, writeToSystem } from "../lib/gemini";
import { useAppStore, TEMPLATES } from "../store";
import type { LockspecDoc, TemplateId } from "../types";

export function BuilderStudio() {
  const { lockspecs, activeLockspecId, addLockspec, updateLockspec, setActiveLockspecId } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [previewTab, setPreviewTab] = useState<"preview" | "output">("preview");
  
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

  const exportLockspec = () => {
    if (!active) return;
    downloadText(`${active.name.toLowerCase().replace(/ /g, "_")}_lockspec.json`, JSON.stringify(active, null, 2));
  };

  const exportProject = async () => {
    if (!active) return;
    const zip = new JSZip();
    
    // Construct dummy project structure based on lockspec
    zip.file("lockspec.json", JSON.stringify(active, null, 2));
    active.modules.forEach(m => {
       zip.folder(m.replace("-", "/")).file("index.tsx", `// ${m} module\nexport const ${m.replace(/-/g, "")} = () => <div />;`);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.name.toLowerCase().replace(/ /g, "_")}_export.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deployToSystem = async () => {
    const pathInput = window.prompt("SYNC_POINT (e.g., scripts/setup.sh):", "blueprint_output.sh");
    if (!pathInput) return;

    try {
      await writeToSystem(pathInput, output);
      alert(`[SYNC_SUCCESS]: Blueprint deployed to ${pathInput}`);
    } catch (err: any) {
      alert(`[SYNC_FAULT]: ${err.message}`);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 bg-white grid-bg overflow-hidden italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-red-600 border-4 border-black flex items-center justify-center text-white shadow-[4px_4px_0_black]">
            <Hammer size={18} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight italic leading-none">Builder Studio</h2>
            <p className="text-[8px] md:text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest mt-1">Synthesize Applications v2.1</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={handleStartWizard} className="btn bg-[#ffab00] hover:bg-[#ffc107] flex-1 md:flex-none py-2 text-xs md:text-sm"><Layout size={14}/> Wizard</button>
          <button onClick={exportProject} className="btn flex-1 md:flex-none py-2 text-xs md:text-sm"><FileArchive size={14}/> Export Project</button>
          <button onClick={exportLockspec} className="btn flex-1 md:flex-none py-2 text-xs md:text-sm"><FileArchive size={14}/> Export Lockspec</button>
          <button onClick={() => {
             const l = { id:uid(), name:"New Blank", version:"1.0.0", stack:"React", objective:"", modules:[], constraints:[], geminiModel:"gemini-3-flash-preview" as any, thinkingEnabled:true, createdAt:now() };
             addLockspec(l);
             setActiveLockspecId(l.id);
          }} className="btn btn-accent flex-1 md:flex-none py-2 text-xs md:text-sm"><Plus size={14}/> Blank</button>
        </div>
      </div>

      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-6">
          <div className="panel w-full max-w-4xl p-0 bg-white border-4 md:border-8 border-black shadow-[10px_10px_0_black] md:shadow-[20px_20px_0_black] flex flex-col max-h-[90vh]">
            <div className="panel-header bg-black text-white flex justify-between items-center px-4 md:px-8 py-4 md:py-6 shrink-0">
               <div className="flex items-center gap-3 md:gap-4">
                  <Package className="text-yellow-400 w-5 h-5 md:w-6 md:h-6" />
                  <h3 className="text-lg md:text-2xl font-black uppercase tracking-tighter">Genesis Wizard // {wizardStep}/4</h3>
               </div>
               <button onClick={() => setShowWizard(false)} className="text-2xl md:text-3xl font-black hover:text-red-500 transition-colors">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-4 md:space-y-8">
              {wizardStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => handleSelectTemplate(t)}
                      className="p-4 md:p-8 border-4 border-black text-left hover:bg-yellow-50 transition-all group flex flex-col h-full bg-white shadow-[6px_6px_0_black] hover:shadow-[10px_10px_0_black] hover:-translate-y-1">
                      <span className="text-3xl md:text-5xl mb-4 md:mb-6 block group-hover:rotate-12 transition-transform">{t.icon}</span>
                      <h4 className="font-black text-base md:text-xl uppercase mb-2 md:mb-3">{t.label}</h4>
                      <p className="text-[10px] md:text-[11px] font-bold text-gray-400 leading-relaxed flex-1 mb-4 md:mb-6 italic">{t.description}</p>
                      <div className="text-[9px] md:text-[10px] font-mono font-black border-t-2 border-black pt-3 md:pt-4 flex justify-between items-center text-blue-600">
                         <span>SELECT_ARCH</span>
                         <ChevronRight size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {wizardStep === 2 && (
                <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right duration-300">
                   <div className="space-y-1 md:space-y-2">
                      <label className="text-[9px] md:text-xs font-black uppercase text-gray-400 italic">Project Name</label>
                      <input value={wizardConfig.name} onChange={e => setWizardConfig({...wizardConfig, name: e.target.value})}
                        className="w-full bg-white border-2 md:border-4 border-black p-3 md:p-4 text-xl md:text-2xl font-black uppercase outline-none focus:bg-blue-50" placeholder="NAME..." />
                   </div>
                   <div className="space-y-1 md:space-y-2">
                      <label className="text-[9px] md:text-xs font-black uppercase text-gray-400 italic">Core Stack</label>
                      <input value={wizardConfig.stack} onChange={e => setWizardConfig({...wizardConfig, stack: e.target.value})}
                        className="w-full bg-white border-2 md:border-4 border-black p-3 md:p-4 text-xs md:text-sm font-black outline-none focus:bg-green-50" placeholder="React, Node..." />
                   </div>
                   <div className="space-y-1 md:space-y-2">
                      <label className="text-[9px] md:text-xs font-black uppercase text-gray-400 italic">Mission</label>
                      <textarea value={wizardConfig.description} onChange={e => setWizardConfig({...wizardConfig, description: e.target.value})}
                        className="w-full bg-white border-2 md:border-4 border-black p-3 md:p-4 text-xs md:text-sm font-bold h-32 md:h-40 resize-none outline-none focus:bg-yellow-50" />
                   </div>
                   <div className="flex justify-between pt-4 md:pt-8">
                      <button onClick={() => setWizardStep(1)} className="btn">Back</button>
                      <button onClick={() => setWizardStep(3)} disabled={!wizardConfig.name} className="btn btn-accent px-8 md:px-12">Next</button>
                   </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right duration-300">
                   <h4 className="text-[9px] md:text-xs font-black uppercase text-gray-400">Inject Modules</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {["ghost-team", "vision-pipeline", "builder", "doc-atelier", "theme-lab", "github"].map(mod => {
                        const active = wizardConfig.modules.includes(mod);
                        return (
                          <button key={mod} onClick={() => {
                            const next = active ? wizardConfig.modules.filter(m => m !== mod) : [...wizardConfig.modules, mod];
                            setWizardConfig({...wizardConfig, modules: next});
                          }}
                          className={cn("p-4 md:p-6 border-4 font-black uppercase text-[10px] md:text-xs flex items-center justify-between transition-all",
                            active ? "bg-black text-white border-black" : "bg-white text-black border-gray-200 hover:border-black")}>
                            {mod.replace("-"," ")}
                            {active && <CheckCircle2 size={16} className="text-green-400" />}
                          </button>
                        )
                      })}
                   </div>
                   <div className="flex justify-between pt-8">
                      <button onClick={() => setWizardStep(2)} className="btn">Back</button>
                      <button onClick={() => setWizardStep(4)} className="btn btn-accent px-8 md:px-12">Review</button>
                   </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="max-w-2xl mx-auto animate-in scale-95 duration-300">
                   <div className="p-4 md:p-8 border-4 border-black bg-gray-50 space-y-4 md:space-y-6">
                      <div className="flex items-center gap-3 md:gap-4 text-blue-600 mb-2">
                        <CheckCircle2 size={24} className="md:w-8 md:h-8" />
                        <h4 className="text-xl md:text-3xl font-black uppercase tracking-tighter">Final Review</h4>
                      </div>
                      <div className="space-y-2 md:space-y-4 text-[10px] md:text-sm font-bold">
                         <p><span className="text-gray-400">DESIGNATION:</span> {wizardConfig.name}</p>
                         <p><span className="text-gray-400">TECHNOLOGY:</span> {wizardConfig.stack}</p>
                         <p><span className="text-gray-400">MODULES:</span> {wizardConfig.modules.join(", ")}</p>
                      </div>
                   </div>
                   <div className="flex justify-between pt-8 md:pt-12">
                      <button onClick={() => setWizardStep(3)} className="btn">Back</button>
                      <button onClick={finalizeWizard} className="btn btn-success px-8 md:px-12 py-3 md:py-4 text-base md:text-lg">Initialize</button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!active ? (
         <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-8 border-dashed border-gray-100 p-10 md:p-20 grayscale opacity-30 text-center">
            <Target size={80} className="md:w-32 md:h-32 mb-6 md:mb-8" />
            <p className="font-black uppercase tracking-widest text-lg md:text-2xl">Awaiting Directives</p>
         </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 md:gap-12 overflow-y-auto lg:overflow-hidden lg:pb-0 pb-20 scrollbar-hide">
          <div className="w-full lg:w-1/3 space-y-6 lg:space-y-8 lg:overflow-y-auto lg:pr-6 scrollbar-hide shrink-0">
             <div className="panel p-6 md:p-8 space-y-6 md:space-y-8 bg-white border-4 border-black shadow-[8px_8px_0_black] md:shadow-[10px_10px_0_black]">
                <div className="space-y-2">
                   <label className="text-[9px] md:text-[10px] font-mono font-black uppercase text-gray-400 italic">Project Name</label>
                   <input value={active.name} onChange={e => updateLockspec(active.id, { name: e.target.value })} 
                      className="w-full bg-transparent border-b-4 md:border-b-8 border-black font-black text-xl md:text-3xl uppercase outline-none focus:text-blue-600 transition-colors" />
                </div>
                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                     <label className="text-[9px] md:text-[10px] font-mono font-black uppercase text-gray-400 italic">Version</label>
                     <div className="flex gap-2">
                       <input value={active.version} onChange={e => updateLockspec(active.id, { version: e.target.value })} 
                          className="flex-1 bg-transparent border-b-4 border-black font-black text-lg uppercase outline-none focus:text-blue-600" />
                       <button onClick={() => updateLockspec(active.id, { version: (parseFloat(active.version)+0.1).toFixed(1) })} className="btn px-2 text-[10px]">AUTO_UP</button>
                     </div>
                  </div>
                  <div className="space-y-2 flex-1">
                     <label className="text-[9px] md:text-[10px] font-mono font-black uppercase text-gray-400 italic">Model</label>
                     <select value={active.geminiModel} onChange={e => updateLockspec(active.id, { geminiModel: e.target.value as any })}
                        className="w-full bg-transparent border-b-4 border-black font-black text-sm uppercase outline-none">
                        {["gemini-3-flash-preview", "gemini-3.1-pro-preview", "gemini-1.5-flash", "gemini-1.5-pro"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                     </select>
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] md:text-[10px] font-mono font-black uppercase text-gray-400 italic">Constraints</label>
                   <div className="flex flex-wrap gap-2">
                     {["Performance", "Security", "Scalability", "SEO", "Accessibility"].map(c => (
                        <button key={c} onClick={() => {
                          const next = active.constraints.includes(c) ? active.constraints.filter(x => x !== c) : [...active.constraints, c];
                          updateLockspec(active.id, { constraints: next });
                        }} className={cn("px-3 py-1 font-black text-[10px] border-2", active.constraints.includes(c) ? "bg-black text-white" : "bg-white")}>{c}</button>
                     ))}
                   </div>
                </div>                
                <div className="space-y-2">
                   <label className="text-[9px] md:text-[10px] font-mono font-black uppercase text-gray-400 italic">Modules</label>
                   <div className="flex flex-wrap gap-2">
                     {["ghost-team", "vision-pipeline", "builder", "doc-atelier", "theme-lab", "github"].map(m => (
                        <button key={m} onClick={() => {
                          const next = active.modules.includes(m) ? active.modules.filter(x => x !== m) : [...active.modules, m];
                          updateLockspec(active.id, { modules: next });
                        }} className={cn("px-3 py-1 font-black text-[10px] border-2", active.modules.includes(m) ? "bg-black text-white" : "bg-white")}>{m}</button>
                     ))}
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] md:text-[10px] font-mono font-black uppercase text-gray-400 italic">Operational Objectives</label>
                   <textarea value={active.objective} onChange={e => updateLockspec(active.id, { objective: e.target.value })} 
                      className="w-full bg-white border-2 md:border-4 border-black h-48 md:h-64 p-4 md:p-6 font-bold text-sm md:text-base resize-none outline-none focus:bg-blue-50" />
                </div>
                <div className="flex flex-col gap-3 md:gap-4">
                  <button onClick={generate} disabled={isGenerating} className="btn btn-success w-full justify-center py-4 md:py-6 text-lg md:text-xl shadow-[4px_4px_0_black] md:shadow-[6px_6px_0_black]">
                    {isGenerating ? <Loader className="animate-spin" /> : <Sparkles />} 
                    <span className="ml-4">INIT_SYNTH</span>
                  </button>
                  <button onClick={() => {
                        const next = lockspecs.filter(l => l.id !== active.id);
                        useAppStore.setState({ lockspecs: next, activeLockspecId: next[0]?.id || null });
                    }}
                    className="btn btn-danger w-full py-2 text-[9px] md:text-[10px] opacity-70">
                    Purge Spec
                  </button>
                </div>
             </div>
          </div>
          
          <div className="flex-1 flex flex-col bg-[#070c12] text-[#00e676] min-h-[400px] lg:min-h-0 relative border-4 md:border-8 border-black overflow-hidden shadow-[10px_10px_0_gray] md:shadow-[15px_15px_0_gray]">
             <div className="bg-black border-b-4 border-black p-3 md:p-4 flex items-center justify-between">
                <div className="flex gap-2">
                   <button onClick={() => setPreviewTab("preview")} className={cn("px-3 py-1 font-black text-[9px] uppercase", previewTab === "preview" ? "bg-white text-black" : "bg-black text-gray-500")}>LIVE_PREVIEW</button>
                   <button onClick={() => setPreviewTab("output")} className={cn("px-3 py-1 font-black text-[9px] uppercase", previewTab === "output" ? "bg-white text-black" : "bg-black text-gray-500")}>GEN_OUTPUT</button>
                </div>
                <span className="text-[8px] md:text-[10px] font-mono font-black tracking-[0.2em] md:tracking-[0.3em] uppercase text-gray-500 truncate ml-4">Kernel.log // {active.name.toLowerCase().replace(/ /g,"-")}</span>
             </div>
             
             {previewTab === "preview" ? (
                 <pre className="flex-1 p-4 md:p-8 font-mono text-[10px] md:text-sm overflow-auto leading-loose scrollbar-hide selection:bg-green-500 selection:text-black">
                     {JSON.stringify(active, null, 2)}
                 </pre>
             ) : (
                 <pre className="flex-1 p-4 md:p-8 font-mono text-[10px] md:text-sm overflow-auto leading-loose scrollbar-hide selection:bg-green-500 selection:text-black">
                    {output || (isGenerating ? "// Parsing architectural directives..." : "// Awaiting input stream...")}
                 </pre>
             )}
             
             {previewTab === "output" && output && (
               <div className="p-4 md:p-6 bg-black border-t-4 border-black flex flex-wrap justify-end gap-3 md:gap-4">
                 <button onClick={() => downloadText(`${active.name}.sh`, output)} className="px-4 md:px-6 py-2 md:py-3 bg-white text-black font-black text-[10px] md:text-xs uppercase hover:bg-yellow-400 flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0_gray]">
                   <Download size={14}/> Discharge
                 </button>
                 <button onClick={deployToSystem} className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 bg-green-500 text-black font-black text-[10px] md:text-xs uppercase hover:brightness-110 flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0_gray]">
                   <Monitor size={14}/> SYSTEM_SYNC
                 </button>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
