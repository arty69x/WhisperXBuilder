import React, { useState, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, Upload, Play, Download, Trash2, RefreshCw, ImageIcon, Code } from "lucide-react";
import { cn, uid, now, formatDate, downloadText, fileToBase64 } from "../lib/utils";
import { geminiText, geminiStream } from "../lib/gemini";
import { useAppStore } from "../store";
import type { VisionSession, VisionStage, VisionStageId } from "../types";

const STAGE_DEFS: { id: VisionStageId; label: string; prompt: (ctx: string) => string }[] = [
  { id:"blueprint", label:"Blueprint", prompt:(ctx) => `Analyze GUI: ${ctx}` },
  { id:"codegen", label:"Code Generation", prompt:(ctx) => `Generate React/Tailwind TSX: ${ctx}` },
];

export function VisionPipeline() {
  const { visionSessions, activeVisionId, addVisionSession, updateVisionSession, setActiveVisionId } = useAppStore();
  const [isRunning, setIsRunning] = useState(false);

  const active = visionSessions.find(s => s.id === activeVisionId) ?? null;

  const handleImage = async (file: File) => {
    const base64 = await fileToBase64(file);
    const session: VisionSession = {
      id: uid(), name: file.name,
      stages: STAGE_DEFS.map(s => ({ id:s.id, label:s.label, status:"idle" })),
      createdAt: now(), updatedAt: now(),
      imageBase64: base64, imageMimeType: file.type
    };
    addVisionSession(session);
    setActiveVisionId(session.id);
  };

  const run = async () => {
    if (!active || isRunning) return;
    setIsRunning(true);
    
    const { geminiModel, geminiThinkingBudget } = useAppStore.getState();
    
    // Set stages to active
    updateVisionSession(active.id, { 
      generatedCode: "",
      stages: active.stages.map(s => ({ ...s, status: s.id === 'blueprint' ? 'active' : 'idle' }))
    });

    try {
      await geminiStream(
        "Analyze this screenshot and generate high-quality React + Tailwind CSS code. Enforce the 'Corporate Brutalism' aesthetic: absolute white backgrounds, bold black borders (4px-8px), hard shadows (no blur), and uppercase black typography. Use lucide-react for all icons. Return ONLY the complete TSX code within markdown code blocks.",
        {
          model: geminiModel,
          imagePart: { mimeType: active.imageMimeType!, data: active.imageBase64! },
          thinkingBudget: geminiThinkingBudget,
          onChunk: (chunk) => {
            updateVisionSession(active.id, { 
              generatedCode: (useAppStore.getState().visionSessions.find(s => s.id === active.id)?.generatedCode || "") + chunk,
              stages: active.stages.map(s => ({ 
                ...s, 
                status: s.id === 'blueprint' ? 'done' : s.id === 'codegen' ? 'active' : 'done' 
              }))
            });
          },
          onDone: (fullText) => {
            setIsRunning(false);
            updateVisionSession(active.id, { 
              generatedCode: fullText,
              stages: active.stages.map(s => ({ ...s, status: 'done' }))
            });
          },
          onError: (err) => {
            console.error(err);
            setIsRunning(false);
            updateVisionSession(active.id, { 
              generatedCode: (useAppStore.getState().visionSessions.find(s => s.id === active.id)?.generatedCode || "") + `\n\n❌ [VISION_FAULT]: ${err.message}`,
              stages: active.stages.map(s => ({ ...s, status: 'idle' }))
            });
          }
        }
      );
    } catch (err) {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 bg-white grid-bg overflow-hidden italic">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black border-4 border-black flex items-center justify-center text-white shadow-[4px_4px_0_gray]">
            <Eye size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">Vision Pipeline</h2>
            <p className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest leading-none mt-1">Screenshot-to-Code Matrix</p>
          </div>
        </div>
        <div className="flex gap-3">
           <button onClick={run} className="btn btn-accent flex items-center gap-2 px-8 py-3" disabled={!active || isRunning}>
             {isRunning ? <RefreshCw className="animate-spin" size={16}/> : <Play size={16}/>} <span className="text-lg">RUN ANALYTICS</span>
           </button>
           {active && !isRunning && (
             <button onClick={() => setActiveVisionId(null)} className="btn btn-danger flex items-center gap-2 px-4 py-3">
               <Trash2 size={16}/> <span className="text-lg">HALT</span>
             </button>
           )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-4 flex flex-col gap-8 scrollbar-hide">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center border-8 border-dashed border-gray-100 p-20 grayscale opacity-20 hover:opacity-100 transition-opacity cursor-pointer relative">
            <Upload size={80} className="text-black mb-6" />
            <p className="text-xl font-black uppercase tracking-widest underline decoration-black underline-offset-8">Ingress Source Image</p>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-full">
            <div className="space-y-6 flex flex-col h-full">
               <div className="panel p-0 overflow-hidden border-8 border-black shadow-[15px_15px_0_black] bg-black">
                  <img src={`data:${active.imageMimeType};base64,${active.imageBase64}`} className="w-full h-auto" />
               </div>

               <div className="panel p-8 bg-white border-4 border-black shadow-[10px_10px_0_black]">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b-4 border-black">
                    <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                       <ImageIcon size={14}/> Optical Trace Protocol
                    </span>
                    <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5">{active.stages.length} NODES</span>
                  </div>
                  <div className="flex items-center w-full px-4 relative mt-2">
                    <div className="absolute left-6 right-6 h-1 bg-black top-[9px] z-0"></div>
                    {active.stages.map((s, idx) => (
                      <div key={s.id} className="flex-1 flex flex-col items-center gap-3 z-10">
                        <div className={cn("w-6 h-6 border-4 border-black transition-all duration-300",
                          s.status === 'done' ? "bg-green-500 shadow-[4px_4px_0_black]" :
                          s.status === 'active' ? "bg-yellow-400 shadow-[4px_4px_0_black] scale-125" :
                          "bg-white"
                        )} />
                        <span className={cn("text-[9px] font-black uppercase tracking-tighter truncate w-full text-center px-1",
                          s.status === 'active' ? "text-yellow-600" : "text-black"
                        )}>{s.label}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="panel p-0 flex flex-col bg-[#070c12] text-[#00e676] border-8 border-black shadow-[20px_20px_0_gray] overflow-hidden">
               <div className="bg-black border-b-4 border-black p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Code size={16} className="text-yellow-400" />
                     <span className="text-xs font-black tracking-widest uppercase">Kernel.output // synthetic-tsx</span>
                  </div>
                  <button className="text-[10px] font-black hover:text-white transition-colors">TERMINAL_FULLSCREEN</button>
               </div>
               <div className="flex-1 p-8 font-mono text-xs overflow-auto leading-loose selection:bg-green-500 selection:text-black markdown-body h-full custom-markdown">
                  {active.generatedCode ? (
                    <Markdown remarkPlugins={[remarkGfm]}>{active.generatedCode}</Markdown>
                  ) : (
                    <span className="opacity-50">{isRunning ? "// Parsing visual directives..." : "// Awaiting instruction stream..."}</span>
                  )}
               </div>
               {active.generatedCode && (
                  <div className="p-6 bg-black border-t-4 border-black flex justify-end">
                     <button onClick={() => downloadText("vision-output.tsx", active.generatedCode!)} 
                        className="px-6 py-3 bg-white text-black font-black text-xs uppercase hover:bg-yellow-400 border-4 border-black shadow-[4px_4px_0_gray] flex items-center gap-3">
                        <Download size={14}/> Discharge Module
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
