import React, { useState, useRef, useMemo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { LiveProvider, LivePreview, LiveError, LiveEditor } from "react-live";
import * as LucideIcons from "lucide-react";
import { 
  Eye, Upload, Play, Download, Trash2, RefreshCw, ImageIcon, 
  Code, Monitor, AlertCircle, CheckCircle2, History, ChevronLeft, 
  ChevronRight, Layout, Palette, Box, Layers, Copy
} from "lucide-react";
import { cn, uid, now, downloadText, fileToBase64 } from "../lib/utils";
import { geminiStream, writeToSystem } from "../lib/gemini";
import { useAppStore } from "../store";
import type { VisionSession, VisionStage, VisionStageId } from "../types";

type OutputTab = "blueprint" | "code" | "preview";

export function VisionPipeline() {
  const { visionSessions, addVisionSession, updateVisionSession, setActiveVisionId, activeVisionId } = useAppStore();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<{stage: string, message: string} | null>(null);
  const [activeTab, setActiveTab] = useState<OutputTab>("blueprint");
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile/small screens
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const active = visionSessions.find(s => s.id === activeVisionId) ?? null;
  const sessions = useMemo(() => [...visionSessions].sort((a, b) => b.createdAt - a.createdAt), [visionSessions]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const STAGES: { id: VisionStageId; label: string }[] = [
    { id: "identification", label: "UI Element Identification" },
    { id: "layout", label: "Structure Mapping" },
    { id: "colors", label: "Color Palette Extraction" },
    { id: "codegen", label: "Code Generation" }
  ];

  const handleImage = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const session: VisionSession = {
        id: uid(),
        name: file.name.split('.')[0] || "New Session",
        imageMimeType: file.type,
        imageBase64: base64,
        stages: STAGES.map(s => ({ ...s, status: "idle" })),
        generatedCode: "",
        blueprint: "",
        createdAt: now(),
        updatedAt: now()
      };
      addVisionSession(session);
      setActiveVisionId(session.id);
      setError(null);
      setActiveTab("blueprint");
    } catch (err: any) {
      setError({ stage: "Upload", message: err.message });
    }
  };

  const run = async () => {
    if (!active || isRunning) return;
    setIsRunning(true);
    setError(null);
    
    updateVisionSession(active.id, { 
      generatedCode: "", 
      blueprint: "",
      stages: active.stages.map(s => ({ ...s, status: "idle" as const })),
      updatedAt: now()
    });

    try {
      const prompt = `Analyze this UI screenshot and perform these specific tasks:
1. UI_ELEMENT_IDENTIFICATION: Identify all major components (headers, buttons, cards, inputs).
2. LAYOUT_STRUCTURE_MAPPING: Define the grid/flex layout hierarchy.
3. COLOR_PALETTE_EXTRACTION: List all primary, secondary, and accent colors in Hex/HSL.
4. REACT_CODEGEN: Write a complete, production-ready React component using Tailwind CSS.

Output your response using these exact delimiters:
[BLUEPRINT_START]
(Include identification, layout, and colors here)
[BLUEPRINT_END]
[CODE_START]
(Include the full React code here)
[CODE_END]`;

      let fullBuffer = "";
      let currentStage: VisionStageId = "identification";

      await geminiStream(prompt, {
        imagePart: { data: active.imageBase64!, mimeType: active.imageMimeType! },
        onChunk: (chunk) => {
          fullBuffer += chunk;
          
          // Basic stage progression logic based on keywords in stream
          let nextStage = currentStage;
          if (fullBuffer.toLowerCase().includes("layout")) nextStage = "layout";
          if (fullBuffer.toLowerCase().includes("color") || fullBuffer.toLowerCase().includes("palette")) nextStage = "colors";
          if (fullBuffer.toLowerCase().includes("react") || fullBuffer.includes("[CODE_START]")) nextStage = "codegen";

          if (nextStage !== currentStage) {
            updateVisionSession(active.id, {
              stages: active.stages.map(s => {
                if (s.id === currentStage) return { ...s, status: "done" as const };
                if (s.id === nextStage) return { ...s, status: "active" as const };
                return s;
              })
            });
            currentStage = nextStage;
            if (nextStage === "codegen") setActiveTab("code");
          } else if (active.stages.every(s => s.status === 'idle')) {
             // Set first stage to active if all are idle
             updateVisionSession(active.id, {
               stages: active.stages.map((s, i) => i === 0 ? { ...s, status: "active" as const } : s)
             });
          }

          // Parse buffer for live preview
          const blueprintMatch = fullBuffer.match(/\[BLUEPRINT_START\]([\s\S]*?)(\[BLUEPRINT_END\]|$)/);
          const codeMatch = fullBuffer.match(/\[CODE_START\]([\s\S]*?)(\[CODE_END\]|$)/);
          
          updateVisionSession(active.id, { 
            blueprint: blueprintMatch ? blueprintMatch[1].trim() : "Extracting blueprint...",
            generatedCode: codeMatch ? codeMatch[1].trim() : (codeMatch ? "" : "Synthesizing code...")
          });
        },
        onDone: (final) => {
          const blueprintMatch = final.match(/\[BLUEPRINT_START\]([\s\S]*?)\[BLUEPRINT_END\]/);
          const codeMatch = final.match(/\[CODE_START\]([\s\S]*?)\[CODE_END\]/);
          
          updateVisionSession(active.id, { 
            blueprint: blueprintMatch ? blueprintMatch[1].trim() : "",
            generatedCode: codeMatch ? codeMatch[1].trim() : "",
            stages: active.stages.map(s => ({ ...s, status: "done" as const })),
            updatedAt: now()
          });
          setIsRunning(false);
          setActiveTab("code");
        },
        onError: (err) => {
          setError({ stage: currentStage, message: err.message });
          setIsRunning(false);
          updateVisionSession(active.id, { 
            stages: active.stages.map(s => s.status === 'active' ? { ...s, status: 'error' as const } : s)
          });
        }
      });
    } catch (err: any) {
      setError({ stage: "Neural Link", message: err.message });
      setIsRunning(false);
    }
  };

  const applyToSystem = async () => {
    if (!active?.generatedCode) return;
    const match = active.generatedCode.match(/```(?:tsx|typescript|ts|js|jsx)?\n([\s\S]*?)```/i);
    const code = match ? match[1] : active.generatedCode;
    
    const pathInput = window.prompt("SYNC_POINT (e.g., src/components/VisionResult.tsx):", `src/components/${active.id.slice(0,8)}_module.tsx`);
    if (!pathInput) return;

    try {
      await writeToSystem(pathInput, code);
      alert(`[SYNC_COMPLETED]: Module deployed to host filesystem at ${pathInput}`);
    } catch (err: any) {
      alert(`[SYNC_ERROR]: ${err.message}`);
    }
  };

  return (
    <div className="h-full flex bg-white grid-bg overflow-hidden italic">
      {/* Session History Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 bg-white z-50 flex flex-col transition-all duration-500 border-r-8 border-black shadow-[20px_0_0_rgba(0,0,0,0.1)] md:relative md:shadow-none md:z-30",
        sidebarOpen ? "translate-x-0 w-80" : "-translate-x-full w-80 md:w-0 md:translate-x-0"
      )}>
        <div className="p-6 border-b-8 border-black bg-black text-white flex items-center justify-between">
           <div className="flex items-center gap-3">
             <History size={20} className="text-yellow-400" />
             <span className="text-xs font-black uppercase tracking-widest italic">Core_Archive</span>
           </div>
           <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-white/20 md:hidden">
             <Box size={24} />
           </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-white">
          {sessions.map(s => (
            <button key={s.id} onClick={() => setActiveVisionId(s.id)}
              className={cn(
                "w-full text-left p-3 border-4 flex flex-col gap-1 transition-all",
                activeVisionId === s.id ? "bg-black text-white border-black shadow-[4px_4px_0_gray]" : "bg-white border-transparent hover:border-black"
              )}>
              <span className="text-[10px] font-black uppercase truncate">{s.name}</span>
              <span className="text-[8px] font-mono opacity-50">{new Date(s.createdAt).toLocaleString()}</span>
            </button>
          ))}
          {sessions.length === 0 && (
            <div className="p-8 text-center text-gray-300 text-[10px] font-black uppercase">Null Set // 0 Sessions</div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-10 shrink-0 gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-12 h-12 border-8 border-black hover:bg-yellow-400 bg-white flex items-center justify-center transition-colors">
              {sidebarOpen ? <ChevronLeft size={28}/> : <History size={28}/>}
            </button>
            <div className="w-12 h-12 bg-black border-4 border-black flex items-center justify-center text-white shadow-[8px_8px_0_black]">
              <Eye size={24} />
            </div>
            <div>
              <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter leading-none italic">Vision Pipeline</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-black text-white text-[8px] font-black uppercase">v2.5_Stable</span>
                <p className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest">Screenshot-to-Code Synthesis</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             {active && (
               <button onClick={run} className="btn btn-accent flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-8 py-2 md:py-3" disabled={isRunning}>
                 {isRunning ? <RefreshCw className="animate-spin" size={14}/> : <Play size={14}/>} 
                 <span className="text-sm md:text-lg">{isRunning ? "RUNNING..." : "INIT_SYNTHESIS"}</span>
               </button>
             )}
             {active && !isRunning && (
               <button onClick={() => { updateVisionSession(active.id, { blueprint: "", generatedCode: "" }); setError(null); }} className="btn btn-danger flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3">
                 <RefreshCw size={14}/> <span className="text-sm md:text-lg">RESET</span>
               </button>
             )}
          </div>
        </header>

        {error && (
          <div className="mx-4 md:mx-8 mb-6 p-4 bg-red-50 border-4 border-red-600 flex items-center gap-4 text-red-600 animate-in slide-in-from-top fade-in">
            <AlertCircle size={24} className="shrink-0" />
            <div>
              <p className="font-black uppercase text-xs">Stage Fault: {error.stage}</p>
              <p className="text-sm font-bold">{error.message}</p>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto px-4 md:px-8 flex flex-col gap-6 md:gap-8 scrollbar-hide pb-20">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center border-8 border-dashed border-gray-100 p-10 md:p-20 grayscale opacity-20 hover:opacity-100 transition-opacity cursor-pointer relative text-center min-h-[300px]">
              <Upload size={64} className="text-black mb-6 md:w-20 md:h-20" />
              <p className="text-sm md:text-xl font-black uppercase tracking-widest underline decoration-black underline-offset-8">Ingress Source Image</p>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])} />
            </div>
          ) : (
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 md:gap-10 h-full">
              {/* Left Column: Image & Status */}
              <div className="space-y-4 md:space-y-6 flex flex-col min-h-0">
                 <div className="panel p-0 overflow-hidden border-4 md:border-8 border-black shadow-[8px_8px_0_black] md:shadow-[15px_15px_0_black] bg-black group relative">
                    <img src={`data:${active.imageMimeType};base64,${active.imageBase64}`} className="w-full h-auto object-contain max-h-[50vh] mx-auto transition-transform duration-500 group-hover:scale-105" alt="UI Source" />
                    <button className="absolute top-2 right-2 p-2 bg-black text-white border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Layers size={14}/>
                    </button>
                 </div>

                 <div className="panel p-4 md:p-8 bg-white border-4 border-black shadow-[6px_6px_0_black] md:shadow-[10px_10px_0_black]">
                    <div className="flex items-center justify-between mb-4 md:mb-8 pb-3 md:pb-4 border-b-4 border-black">
                      <span className="text-[9px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2">
                         <ImageIcon size={12}/> Analysis Pipeline Status
                      </span>
                      {isRunning && <span className="text-[10px] md:text-[10px] font-mono font-black text-blue-600 animate-pulse uppercase">Syncing...</span>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                      {active.stages.map((s) => (
                        <div key={s.id} className="flex flex-col gap-2">
                          <div className={cn("h-2 md:h-3 border-2 border-black transition-all duration-300",
                            s.status === 'done' ? "bg-green-500" :
                            s.status === 'active' ? "bg-yellow-400 animate-pulse" :
                            s.status === 'error' ? "bg-red-500" : "bg-gray-100"
                          )} />
                          <span className={cn("text-[8px] md:text-[9px] font-black uppercase tracking-tighter truncate",
                            s.status === 'active' ? "text-yellow-600" : s.status === 'done' ? "text-green-600" : s.status === 'error' ? "text-red-600" : "text-gray-400"
                          )}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                 </div>

                 <div className="flex-1 hidden lg:block border-4 border-dashed border-gray-100 rounded-xl p-4 md:p-8 flex items-center justify-center text-center">
                    <p className="text-[10px] font-black uppercase text-gray-200 tracking-widest leading-loose">
                      Neural Interface // Ready for command <br/>
                      Awaiting screenshot ingress <br/>
                      {active.id}
                    </p>
                 </div>
              </div>

              {/* Right Column: Output Tabs */}
              <div className="panel p-0 flex flex-col bg-[#070c12] text-[#00e676] border-4 md:border-8 border-black shadow-[10px_10px_0_gray] md:shadow-[20px_20px_0_gray] overflow-hidden min-h-[500px]">
                 <div className="bg-black border-b-4 border-black flex items-center px-2 md:px-0">
                    <button onClick={() => setActiveTab("blueprint")}
                      className={cn(
                        "px-4 md:px-8 py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                        activeTab === 'blueprint' ? "bg-[#070c12] text-[#00e676] border-r-4 border-black" : "bg-black text-gray-500"
                      )}>
                      <Layout size={14}/> Blueprint
                    </button>
                    <button onClick={() => setActiveTab("code")}
                      className={cn(
                        "px-4 md:px-8 py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                        activeTab === 'code' ? "bg-[#070c12] text-[#00e676] border-x-4 border-black" : "bg-black text-gray-500"
                      )}>
                      <Code size={14}/> Synthesis
                    </button>
                    <button onClick={() => setActiveTab("preview")}
                      className={cn(
                        "px-4 md:px-8 py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                        activeTab === 'preview' ? "bg-[#070c12] text-yellow-400 border-l-4 border-black" : "bg-black text-gray-400"
                      )}>
                      <Layers size={14}/> DESIGN_PREVIEW
                    </button>
                    <div className="flex-1" />
                    {isRunning && <RefreshCw size={12} className="animate-spin opacity-50 mr-4" />}
                 </div>

                 <div className="flex-1 p-4 md:p-8 font-mono text-[10px] md:text-xs overflow-auto leading-loose selection:bg-green-500 selection:text-black markdown-body h-full custom-markdown scrollbar-hide relative group">
                    {activeTab === "blueprint" ? (
                       <div className="space-y-6">
                         {active.blueprint ? (
                           <>
                             <div className="flex flex-col sm:flex-row gap-2 mb-4 bg-white p-2 border-b-4 border-black">
                               <button onClick={() => handleCopy(active.blueprint!)} 
                                 className="p-3 bg-white text-black border-4 border-black shadow-[4px_4px_0_black] hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px] w-full sm:w-auto">
                                 {copied ? <CheckCircle2 size={14} className="text-green-600"/> : <Copy size={14}/>}
                                 {copied ? "COPIED" : "COPY_BLUEPRINT"}
                               </button>
                               <button onClick={() => downloadText(`${active.name || 'blueprint'}.md`, active.blueprint!)} 
                                 className="p-3 bg-white text-black border-4 border-black shadow-[4px_4px_0_black] hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px] w-full sm:w-auto">
                                 <Download size={14}/> DOWNLOAD_MD
                               </button>
                             </div>
                             <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{active.blueprint}</Markdown>
                           </>
                         ) : (
                           <span className="opacity-50 italic">{isRunning ? "// Analyzing UI elements..." : "// Awaiting instruction stream..."}</span>
                         )}
                       </div>
                    ) : activeTab === "code" ? (
                       <div className="h-full relative">
                         {active.generatedCode ? (
                           <>
                             <div className="flex flex-col sm:flex-row gap-2 mb-4 bg-[#070c12] p-2 border-b-4 border-black">
                               <button onClick={() => handleCopy(active.generatedCode!)} 
                                 className="p-3 bg-white text-black border-4 border-black shadow-[4px_4px_0_black] hover:bg-yellow-400 flex items-center justify-center gap-2 font-black uppercase text-[10px] w-full sm:w-auto">
                                 {copied ? <CheckCircle2 size={14} className="text-green-600"/> : <Copy size={14}/>}
                                 {copied ? "COPIED" : "COPY_CODE"}
                               </button>
                             </div>
                             <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{active.generatedCode.startsWith('```') ? active.generatedCode : '```tsx\n' + active.generatedCode + '\n```'}</Markdown>
                           </>
                         ) : (
                           <span className="opacity-50 italic">{isRunning ? "// Initiating neural synthesis..." : "// Awaiting instruction stream..."}</span>
                         )}
                       </div>
                     ) : (
                       <div className="h-full relative p-4 bg-white overflow-auto">
                         {active.generatedCode ? (
                             <LiveProvider 
                               key={active.generatedCode}
                               code={active.generatedCode.replace(/^```[a-z]*\n/i, '').replace(/```$/g, '').trim()} 
                               scope={{ React, ...LucideIcons, cn }}
                               noInline={false}
                             >
                               <button 
                                 onClick={() => setIsFullscreen(true)}
                                 className="mb-2 px-3 py-1 bg-black text-yellow-400 font-black text-[9px] uppercase border-2 border-black hover:bg-gray-800"
                               >
                                 Open_Full_Screen
                               </button>

                               <div className="flex flex-col gap-4">
                                 <div className="border-4 border-black shadow-[4px_4px_0_black] bg-white min-h-[500px] overflow-auto">
                                   <LivePreview />
                                 </div>
                                 <div className="border-4 border-black bg-gray-900 text-white p-4 font-mono text-xs overflow-auto max-h-[200px]">
                                    <h5 className="font-black text-[10px] uppercase mb-2">Editor_Code</h5>
                                    <LiveEditor className="!bg-transparent" />
                                 </div>
                               </div>
                               <div className="mt-4 p-4 border-2 border-black bg-white">
                                 <h5 className="font-black text-[10px] uppercase mb-2">Editor_Console</h5>
                                 <LiveError className="text-red-600 text-xs font-mono whitespace-pre-wrap" />
                               </div>
                               
                               {isFullscreen && (
                                  <div className="fixed inset-0 z-[100] bg-white p-6 flex flex-col">
                                    <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-2">
                                      <h2 className="text-xl font-black uppercase">Live_Preview_Full</h2>
                                      <button 
                                        onClick={() => setIsFullscreen(false)}
                                        className="px-4 py-2 bg-red-600 text-white font-black uppercase text-xs border-4 border-black shadow-[4px_4px_0_black]"
                                      >
                                        Close
                                      </button>
                                    </div>
                                    <div className="flex-1 border-8 border-black shadow-[10px_10px_0_black] overflow-auto">
                                      <LivePreview className="w-full h-full" />
                                    </div>
                                  </div>
                               )}
                             </LiveProvider>
                         ) : (
                           <div className="flex flex-col items-center justify-center space-y-8 py-10 h-full opacity-60">
                              <div className="w-20 h-20 bg-yellow-400 border-8 border-black flex items-center justify-center shadow-[8px_8px_0_black]">
                                 <Layout size={40} className="text-black" />
                              </div>
                              <div className="text-center max-w-md">
                                 <h4 className="text-xl font-black uppercase mb-2">Live UX Interpretation</h4>
                                 <p className="text-[10px] leading-relaxed uppercase">
                                   The synthesis kernel is currently interpreting your screenshot.
                                   Once identified, a live snippet of the expected output will appear here.
                                 </p>
                              </div>
                           </div>
                         )}
                       </div>
                    )}
                 </div>

                 <div className="p-4 md:p-6 bg-black border-t-4 border-black flex flex-wrap justify-end gap-3">

                    {activeTab === "code" && active.generatedCode && (
                       <>
                         <button onClick={() => downloadText(`generated_code.tsx`, active.generatedCode!)} 
                            className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 bg-white text-black font-black text-[10px] md:text-xs uppercase hover:bg-yellow-400 border-4 border-black shadow-[4px_4px_0_gray] flex items-center justify-center gap-2">
                            <Download size={14}/> Discharge
                         </button>
                         <button onClick={applyToSystem} 
                            className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 bg-green-500 text-black font-black text-[10px] md:text-xs uppercase hover:brightness-110 border-4 border-black shadow-[4px_4px_0_gray] flex items-center justify-center gap-2">
                            <Monitor size={14}/> SYSTEM_DEPLOY
                         </button>
                       </>
                    )}
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
