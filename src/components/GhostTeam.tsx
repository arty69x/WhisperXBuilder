import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Trash2, Download, Ghost, Copy, Sparkles, Check } from "lucide-react";
import { cn, uid, now, formatDate, downloadJson } from "../lib/utils";
import { geminiStream } from "../lib/gemini";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatTyping]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || chatTyping) return;
    setInput("");
    setThinkingBuffer("");

    const agent = AGENTS.find(a => a.id === activeAgent)!;
    addMessage({ id:uid(), role:"user", content:text, timestamp:now() });
    setChatTyping(true);
    addMessage({ id:uid(), role:"assistant", agentId:activeAgent, content:"", streaming:true,
                 timestamp:now(), model:agent.model });

    let full = "", thinking = "";
    await geminiStream(text, {
      model: agent.model,
      systemInstruction: SYSTEM(activeAgent, geminiThinkingEnabled && agent.thinkingEnabled),
      onChunk: (chunk) => {
        full += chunk; 
        updateLastMessage(full, thinking);
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      },
      onDone: (text) => { updateLastMessage(text, thinking); setChatTyping(false); },
      onError: (err) => { updateLastMessage(`[Error] ${err.message}`); setChatTyping(false); },
    });
  }, [input, chatTyping, activeAgent, geminiThinkingEnabled, addMessage, updateLastMessage, setChatTyping]);

  const handleKey = (e: React.KeyboardEvent) => { if (e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(); }};

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white grid-bg italic">
      <div className="flex items-center justify-between px-8 py-6 border-b-4 border-black flex-shrink-0 bg-white">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black flex items-center justify-center text-white border-4 border-black shadow-[4px_4px_0_gray]">
            <Ghost size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight italic text-black">Ghost Team Matrix</h2>
            <p className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">9 Nodes // Gemini_Protocol</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={clearMessages} className="btn btn-danger py-1 px-3 text-[10px] uppercase font-black"><Trash2 size={12}/> Purge</button>
        </div>
      </div>

      <div className="flex-shrink-0 grid grid-cols-9 gap-0 border-b-4 border-black bg-white overflow-x-auto scrollbar-hide">
        {AGENTS.map((a) => (
          <button key={a.id} onClick={() => setActiveAgent(a.id)}
            className={cn("group flex flex-col items-center gap-2 p-4 transition-all border-r-4 border-black last:border-r-0 min-w-[100px]",
              activeAgent===a.id ? "bg-yellow-50" : "hover:bg-gray-50")}
            style={activeAgent===a.id ? { backgroundColor: a.color + '11' } : {}}>
            <div className="w-10 h-10 border-4 border-black flex items-center justify-center text-[11px] font-black transition-transform group-hover:scale-110 shadow-[4px_4px_0_black]"
              style={{ background: activeAgent===a.id ? a.color : 'white', color: activeAgent===a.id ? 'white' : 'black' }}>
              {a.id.slice(0,2)}
            </div>
            <span className={cn("text-[8px] font-black uppercase tracking-tighter transition-colors",
               activeAgent===a.id ? "text-black" : "text-gray-400 group-hover:text-black")}>{a.name}</span>
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center grayscale opacity-10">
             <Ghost size={80} />
             <p className="text-[10px] font-black uppercase mt-4 tracking-[0.3em]">Awaiting Ingress Communications</p>
          </div>
        ) : (
          messages.map((msg) => {
            const agent = msg.agentId ? AGENTS.find(a => a.id === msg.agentId) : null;
            return (
              <div key={msg.id} className={cn("flex gap-6", msg.role==="user"?"justify-end":"justify-start")}>
                <div className={cn("max-w-[70%] space-y-4", msg.role==="user" && "flex flex-col items-end")}>
                  {agent && (
                     <div className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-6 border-2 border-black flex items-center justify-center text-[8px] font-black" style={{ background: agent.color, color: 'white' }}>{agent.id.slice(0,2)}</div>
                        <span className="text-[10px] font-black uppercase italic text-gray-500">{agent.name} <span className="text-blue-500">// {agent.role}</span></span>
                     </div>
                  )}
                  <div className={cn("px-8 py-6 border-4 border-black font-bold text-sm whitespace-pre-wrap relative shadow-[10px_10px_0_black]",
                    msg.role==="user" ? "bg-white" : "bg-white")}>
                    <div className="markdown-body">
                      <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] text-gray-400 font-mono font-bold uppercase">
                     <span>{formatDate(msg.timestamp)}</span>
                     <button 
                       onClick={() => {
                         navigator.clipboard.writeText(msg.content);
                       }}
                       className="flex items-center gap-1 hover:text-black transition-colors">
                        <Copy size={10} /> CLONE_DATA
                     </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-8 border-t-4 border-black bg-white">
        <div className="flex gap-6 items-end max-w-4xl mx-auto">
          <div className="relative flex-1">
             <textarea value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={handleKey}
               rows={1} placeholder={`Communicate with ${activeAgent}…`}
               className="w-full bg-white border-4 border-black p-6 font-bold text-sm outline-none focus:bg-yellow-50 shadow-[8px_8px_0_black] scrollbar-hide resize-none" />
             <div className="absolute -top-3 -left-3 px-2 py-1 bg-black text-white text-[8px] font-black uppercase tracking-widest">Input Buffer</div>
          </div>
          <button onClick={send} disabled={!input.trim()||chatTyping} className="btn bg-[#ffab00] hover:bg-[#ffc107] p-6 shadow-[8px_8px_0_black] flex-shrink-0">
             <Send size={24}/>
          </button>
        </div>
      </div>
    </div>
  );
}
