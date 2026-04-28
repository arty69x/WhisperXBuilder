import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Trash2, Download, Ghost, Copy, Sparkles, Check, Monitor, RefreshCw } from "lucide-react";
import { cn, uid, now, formatDate, downloadJson } from "../lib/utils";
import { geminiStream, writeToSystem } from "../lib/gemini";
import { useAppStore, AGENTS } from "../store";
import type { ChatMessage, AgentId } from "../types";

const SYSTEM = (agentId: AgentId, thinkingEnabled: boolean) => {
  const a = AGENTS.find(x => x.id === agentId)!;
  return `You are ${a.name}, the ${a.role} specialist of the WhisperX Ghost Team — a 9-agent AI collective.
Role: ${a.description}
Specialties: ${a.specialties.join(", ")}.
${thinkingEnabled ? "You have extended thinking enabled." : ""}
Respond in the same language as the user.`;
};

export function GhostTeam() {
  const { messages, activeAgent, chatTyping, geminiThinkingEnabled, geminiThinkingBudget,
          addMessage, updateLastMessage, clearMessages, setActiveAgent, setChatTyping } = useAppStore();
  const [input, setInput] = useState("");
  const [thinkingBuffer, setThinkingBuffer] = useState("");
  const [applyingFile, setApplyingFile] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const send = async () => {
    if (!input.trim() || chatTyping) return;
    
    const userMsg: ChatMessage = { id: uid(), role: "user", content: input, timestamp: now() };
    addMessage(userMsg);
    setInput("");
    setChatTyping(true);
    setThinkingBuffer("");

    const assistantMsg: ChatMessage = { 
      id: uid(), 
      role: "assistant", 
      content: "", 
      timestamp: now(), 
      agentId: activeAgent 
    };
    addMessage(assistantMsg);

    try {
      await geminiStream(input, {
        systemInstruction: SYSTEM(activeAgent, geminiThinkingEnabled),
        thinkingBudget: geminiThinkingEnabled ? geminiThinkingBudget : undefined,
        onChunk: (chunk, isThinking) => {
          if (isThinking) {
            setThinkingBuffer(prev => prev + chunk);
          } else {
            updateLastMessage(chunk);
          }
        },
        onDone: () => {
          setChatTyping(false);
          setThinkingBuffer("");
        },
        onError: (err) => {
          let suggestion = "Please check your network connection or try a different model.";
          if (err.message.includes("401")) suggestion = "Authentication failed. Please verify your API Key in Settings.";
          if (err.message.includes("429")) suggestion = "Quota exceeded. Please wait a moment or check your billing status.";
          if (err.message.includes("500") || err.message.includes("503")) suggestion = "Gemini API is currently overloaded. Please try again later.";
          
          updateLastMessage(`\n\n[KERNEL.ERR]: ${err.message}\n> SUGGESTION: ${suggestion}`);
          setChatTyping(false);
          setThinkingBuffer("");
        }
      });
    } catch (err: any) {
      let suggestion = "An unexpected error occurred.";
      if (err.message.includes("401")) suggestion = "Authentication failed. Please verify your API Key in Settings.";
      updateLastMessage(`\n\n[KERNEL.ERR]: ${err.message}\n> SUGGESTION: ${suggestion}`);
      setChatTyping(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const applyToSystem = async (content: string) => {
    const match = content.match(/```(?:tsx|typescript|ts|js|jsx)?\n([\s\S]*?)```/);
    const code = match ? match[1] : content;
    
    const pathInput = window.prompt("TARGET_PATH (e.g., src/components/NewModule.tsx):", "src/experiments/output.tsx");
    if (!pathInput) return;

    setApplyingFile(pathInput);
    try {
      await writeToSystem(pathInput, code);
      alert(`[SYNC_SUCCESS]: Module deployed to ${pathInput}`);
    } catch (err: any) {
      alert(`[SYNC_FAULT]: ${err.message}`);
    } finally {
      setApplyingFile(null);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white grid-bg italic">
      <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 border-b-4 border-black flex-shrink-0 bg-white">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-black flex items-center justify-center text-white border-4 border-black shadow-[4px_4px_0_gray]">
            <Ghost size={16} className="md:w-5 md:h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight italic text-black leading-none">Ghost Matrix</h2>
            <p className="text-[8px] md:text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">9 Nodes // Gemini_3</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={clearMessages} className="btn btn-danger py-1 px-2 md:px-3 text-[9px] md:text-[10px] uppercase font-black"><Trash2 size={12}/> PURGE</button>
        </div>
      </div>

      <div className="flex-shrink-0 flex border-b-4 border-black bg-white overflow-x-auto scrollbar-hide">
        {AGENTS.map((a) => (
          <button key={a.id} onClick={() => setActiveAgent(a.id)}
            className={cn("group flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 transition-all border-r-4 border-black last:border-r-0 min-w-[70px] md:min-w-[100px]",
              activeAgent===a.id ? "bg-yellow-50" : "hover:bg-gray-50")}
            style={activeAgent===a.id ? { backgroundColor: a.color + '11' } : {}}>
            <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-black flex items-center justify-center text-[9px] md:text-[11px] font-black transition-transform group-hover:scale-110 shadow-[4px_4px_0_black]"
              style={{ background: activeAgent===a.id ? a.color : 'white', color: activeAgent===a.id ? 'white' : 'black' }}>
              {a.id.slice(0,2)}
            </div>
            <span className={cn("text-[7px] md:text-[8px] font-black uppercase tracking-tighter transition-colors",
               activeAgent===a.id ? "text-black" : "text-gray-400 group-hover:text-black")}>{a.name}</span>
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 md:space-y-12 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center grayscale opacity-10">
             <Ghost size={64} className="md:w-20 md:h-20" />
             <p className="text-[8px] md:text-[10px] font-black uppercase mt-4 tracking-[0.3em] text-center">Awaiting Ingress Communications</p>
          </div>
        ) : (
          messages.map((msg) => {
            const agent = msg.agentId ? AGENTS.find(a => a.id === msg.agentId) : null;
            return (
              <div key={msg.id} className={cn("flex gap-4 md:gap-6", msg.role==="user"?"justify-end":"justify-start")}>
                <div className={cn("max-w-[90%] md:max-w-[70%] space-y-3 md:space-y-4", msg.role==="user" && "flex flex-col items-end")}>
                  {agent && (
                     <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2 text-wrap">
                        <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-black flex items-center justify-center text-[7px] md:text-[8px] font-black shrink-0" style={{ background: agent.color, color: 'white' }}>{agent.id.slice(0,2)}</div>
                        <span className="text-[9px] md:text-[10px] font-black uppercase italic text-gray-500 truncate">{agent.name} <span className="text-strobe-blue">// {agent.role}</span></span>
                     </div>
                  )}
                  <div className={cn("px-4 md:px-8 py-4 md:py-6 border-4 border-black font-bold text-xs md:text-sm whitespace-pre-wrap relative shadow-[6px_6px_0_black] md:shadow-[10px_10px_0_black]",
                    msg.role==="user" ? "bg-white" : "bg-white")}>
                    <div className="markdown-body text-xs md:text-sm">
                      <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 md:gap-6 text-[8px] md:text-[9px] text-gray-400 font-mono font-bold uppercase transition-all">
                     <span className="shrink-0">{formatDate(msg.timestamp)}</span>
                     <button onClick={() => navigator.clipboard.writeText(msg.content)}
                       className="flex items-center gap-1 hover:text-black hover:scale-105 active:scale-95 transition-all">
                        <Copy size={10} /> CLONE_DATA
                     </button>
                     {msg.role === "assistant" && msg.content.includes("```") && (
                       <button onClick={() => applyToSystem(msg.content)} 
                         disabled={!!applyingFile}
                         className="flex items-center gap-1 text-strobe-green hover:brightness-110 hover:scale-105 active:scale-95 transition-all font-black">
                         {applyingFile ? <RefreshCw size={10} className="animate-spin"/> : <Monitor size={10} />} APPLY_TO_CORE
                       </button>
                     )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 md:p-8 border-t-4 border-black bg-white">
        <div className="flex gap-3 md:gap-6 items-end max-w-4xl mx-auto">
          <div className="relative flex-1">
             <textarea value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={handleKey}
               rows={1} placeholder={`Communicate…`}
               className="w-full bg-white border-4 border-black p-4 md:p-6 font-bold text-xs md:text-sm outline-none focus:bg-yellow-50 shadow-[4px_4px_0_black] md:shadow-[8px_8px_0_black] scrollbar-hide resize-none" />
             <div className="absolute -top-3 -left-3 px-2 py-1 bg-black text-white text-[7px] md:text-[8px] font-black uppercase tracking-widest">Input Buffer</div>
          </div>
          <button onClick={send} disabled={!input.trim()||chatTyping} className="btn bg-[#ffab00] hover:bg-[#ffc107] p-4 md:p-6 shadow-[4px_4px_0_black] md:shadow-[8px_8px_0_black] flex-shrink-0">
             <Send size={20} className="md:w-6 md:h-6"/>
          </button>
        </div>
      </div>
    </div>
  );
}
