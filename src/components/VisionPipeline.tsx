import React, { useState, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, Upload, Play, Download, Trash2, RefreshCw, ImageIcon, Code, Monitor } from "lucide-react";
import { cn, uid, now, downloadText, fileToBase64 } from "../lib/utils";
import { geminiText, geminiStream, writeToSystem } from "../lib/gemini";
import { useAppStore } from "../store";
import type { VisionSession, VisionStage, VisionStageId } from "../types";

const STAGE_DEFS: { id: VisionStageId; label: string; prompt: (ctx: string) => string }[] = [
  { id: "blueprint", label: "Blueprint", prompt: (ctx) => `Analyze this UI screenshot. Extract full layout specifications, colors (hex), font pairings, and component hierarchies. Context: ${ctx}` },
  { id: "codegen", label: "Code Generation", prompt: (ctx) => `Based on the blueprint, generate a production-ready React component using Tailwind CSS. Use clean architectural patterns. Context: ${ctx}` },
];

export function VisionPipeline() {
  const { visionSessions, addVisionSession, updateVisionSession, setActiveVisionId, activeVisionId } = useAppStore();
  const [isRunning, setIsRunning] = useState(false);
  const active = visionSessions.find(s => s.id === activeVisionId) ?? null;

  const handleImage = async (file: File) => {
    const base64 = await fileToBase64(file);
    const session: VisionSession = {
      id: uid(),
      imageMimeType: file.type,
      imageBase64: base64,
      stages: STAGE_DEFS.map(d => ({ id: d.id, label: d.label, status: "pending" as const })),
      generatedCode: "",
      blueprint: "",
      createdAt: now()
    };
    addVisionSession(session);
    setActiveVisionId(session.id);
  };

  const run = async () => {
    if (!active || isRunning) return;
    setIsRunning(true);

    try {
      // Stage 1: Blueprint
      const blueprintPrompt = STAGE_DEFS[0].prompt("Extracting visual DNA...");
      const updatedStages = active.stages.map(s => s.id === "blueprint" ? { ...s, status: "active" as const } : s);
      updateVisionSession(active.id, { stages: updatedStages });

      const blueprint = await geminiText(blueprintPrompt, {
        image: { inlineData: { data: active.imageBase64, mimeType: active.imageMimeType } }
      });

      // Stage 2: Codegen
      const codegenPrompt = STAGE_DEFS[1].prompt(blueprint);
      const stagesFinal = updatedStages.map(s => 
        s.id === "blueprint" ? { ...s, status: "done" as const } : 
        s.id === "codegen" ? { ...s, status: "active" as const } : s
      );
      updateVisionSession(active.id, { blueprint, stages: stagesFinal });

      await geminiStream(codegenPrompt, {
        onChunk: (chunk) => {
          updateVisionSession(active.id, { generatedCode: (useAppStore.getState().visionSessions.find(s => s.id === active.id)?.generatedCode || "") + chunk });
        },
        onDone: () => {
          const doneStages = useAppStore.getState().visionSessions.find(s => s.id === active.id)!.stages.map(s => ({ ...s, status: "done" as const }));
          updateVisionSession(active.id, { stages: doneStages });
          setIsRunning(false);
        }
      });
    } catch (err) {
      console.error(err);
      setIsRunning(false);
    }
  };

  const applyToSystem = async () => {
    if (!active?.generatedCode) return;
    const match = active.generatedCode.match(/```(?:tsx|typescript|ts|js|jsx)?\n([\s\S]*?)```/);
    const code = match ? match[1] : active.generatedCode;
    
    const pathInput = window.prompt("TARGET_PATH (e.g., src/components/VisualModule.tsx):", "src/experiments/vision_output.tsx");
    if (!pathInput) return;

    try {
      await writeToSystem(pathInput, code);
      alert(`[SYNC_SUCCESS]: Module deployed to ${pathInput}`);
    } catch (err: any) {
      alert(`[SYNC_FAULT]: ${err.message}`);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 bg-white grid-bg overflow-hidden italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-black border-4 border-black flex items-center justify-center text-white shadow-[4px_4px_0_gray]">
            <Eye size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight leading-none">Vision Pipeline</h2>
            <p className="text-[8px] md:text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest mt-1">Screenshot-to-Code Matrix</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <button onClick={run} className="btn btn-accent flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-8 py-2 md:py-3" disabled={!active || isRunning}>
             {isRunning ? <RefreshCw className="animate-spin" size={14}/> : <Play size={14}/>} <span className="text-sm md:text-lg">RUN ANALYTICS</span>
           </button>
           {active && !isRunning && (
             <button onClick={() => setActiveVisionId(null)} className="btn btn-danger flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3">
               <Trash2 size={14}/> <span className="text-sm md:text-lg">HALT</span>
             </button>
           )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 md:pr-4 flex flex-col gap-6 md:gap-8 scrollbar-hide pb-20 md:pb-0">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center border-8 border-dashed border-gray-100 p-10 md:p-20 grayscale opacity-20 hover:opacity-100 transition-opacity cursor-pointer relative text-center">
            <Upload size={64} className="text-black mb-6 md:w-20 md:h-20" />
            <p className="text-sm md:text-xl font-black uppercase tracking-widest underline decoration-black underline-offset-8">Ingress Source Image</p>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])} />
          </div>
        ) : (
          <div className="flex flex-col xl:grid xl:grid-cols-2 gap-6 md:gap-10 h-full">
            <div className="space-y-4 md:space-y-6 flex flex-col">
               <div className="panel p-0 overflow-hidden border-4 md:border-8 border-black shadow-[8px_8px_0_black] md:shadow-[15px_15px_0_black] bg-black">
                  <img src={`data:${active.imageMimeType};base64,${active.imageBase64}`} className="w-full h-auto" />
               </div>

               <div className="panel p-4 md:p-8 bg-white border-4 border-black shadow-[6px_6px_0_black] md:shadow-[10px_10px_0_black]">
                  <div className="flex items-center justify-between mb-4 md:mb-8 pb-3 md:pb-4 border-b-4 border-black">
                    <span className="text-[9px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2">
                       <ImageIcon size={12}/> Optical Trace Protocol
                    </span>
                    <span className="text-[8px] md:text-[10px] font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5">{active.stages.length} NODES</span>
                  </div>
                  <div className="flex items-center w-full px-2 md:px-4 relative mt-2">
                    <div className="absolute left-4 md:left-6 right-4 md:right-6 h-0.5 md:h-1 bg-black top-[7px] md:top-[9px] z-0"></div>
                    {active.stages.map((s) => (
                      <div key={s.id} className="flex-1 flex flex-col items-center gap-2 md:gap-3 z-10">
                        <div className={cn("w-4 h-4 md:w-6 md:h-6 border-2 md:border-4 border-black transition-all duration-300",
                          s.status === 'done' ? "bg-green-500 shadow-[2px_2px_0_black] md:shadow-[4px_4px_0_black]" :
                          s.status === 'active' ? "bg-yellow-400 shadow-[2px_2px_0_black] md:shadow-[4px_4px_0_black] scale-125" :
                          "bg-white"
                        )} />
                        <span className={cn("text-[7px] md:text-[9px] font-black uppercase tracking-tighter truncate w-full text-center px-1",
                          s.status === 'active' ? "text-yellow-600" : "text-black"
                        )}>{s.label}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="panel p-0 flex flex-col bg-[#070c12] text-[#00e676] border-4 md:border-8 border-black shadow-[10px_10px_0_gray] md:shadow-[20px_20px_0_gray] overflow-hidden min-h-[400px]">
               <div className="bg-black border-b-4 border-black p-3 md:p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                     <Code size={14} className="text-yellow-400" />
                     <span className="text-[9px] md:text-xs font-black tracking-widest uppercase truncate">Kernel.output // synthetic-tsx</span>
                  </div>
               </div>
               <div className="flex-1 p-4 md:p-8 font-mono text-[10px] md:text-xs overflow-auto leading-loose selection:bg-green-500 selection:text-black markdown-body h-full custom-markdown">
                  {active.generatedCode ? (
                    <Markdown remarkPlugins={[remarkGfm]}>{active.generatedCode}</Markdown>
                  ) : (
                    <span className="opacity-50">{isRunning ? "// Parsing visual directives..." : "// Awaiting instruction stream..."}</span>
                  )}
               </div>
               {active.generatedCode && (
                  <div className="p-4 md:p-6 bg-black border-t-4 border-black flex flex-wrap justify-end gap-3">
                     <button onClick={() => downloadText("vision-output.tsx", active.generatedCode!)} 
                        className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 bg-white text-black font-black text-[10px] md:text-xs uppercase hover:bg-yellow-400 border-4 border-black shadow-[4px_4px_0_gray] flex items-center justify-center gap-2">
                        <Download size={14}/> Discharge
                     </button>
                     <button onClick={applyToSystem} 
                        className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 bg-green-500 text-black font-black text-[10px] md:text-xs uppercase hover:brightness-110 border-4 border-black shadow-[4px_4px_0_gray] flex items-center justify-center gap-2">
                        <Monitor size={14}/> SYSTEM_DEPLOY
                     </button>
                  </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
