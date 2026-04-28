import React, { useState } from "react";
import { FlaskConical, Plus, Save, Trash2, Zap, Code, Terminal } from "lucide-react";
import { useAppStore } from "../store";
import { cn, uid, now } from "../lib/utils";
import type { SkillDraft } from "../types";

export function SkillForge() {
  const { skills, addSkill, updateSkill, activeSkillId, setActiveSkillId } = useAppStore();
  const active = skills.find(s => s.id === activeSkillId) ?? null;

  const handleNewSkill = () => {
    const s: SkillDraft = {
      id: uid(),
      name: "New Capability",
      description: "Define agent behavior...",
      body: "",
      testCases: [],
      status: "draft",
      createdAt: now(),
      updatedAt: now()
    };
    addSkill(s);
    setActiveSkillId(s.id);
  };

  return (
    <div className="h-full flex flex-col p-8 bg-white grid-bg overflow-hidden italic">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500 border-4 border-black flex items-center justify-center text-white shadow-[4px_4px_0_black]">
            <FlaskConical size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">Skill Forge</h2>
            <p className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest">Architectural Prompt Engineering</p>
          </div>
        </div>
        <button onClick={handleNewSkill} className="btn btn-success flex items-center gap-2">
          <Plus size={16}/> New Skill
        </button>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Sidebar List */}
        <div className="w-1/4 space-y-4 overflow-y-auto pr-4 scrollbar-hide">
          {skills.length === 0 ? (
            <div className="p-8 border-4 border-dashed border-gray-200 text-center text-gray-300 font-black uppercase text-xs">
              No Skills Defined
            </div>
          ) : (
            skills.map(s => (
              <button key={s.id} onClick={() => setActiveSkillId(s.id)}
                className={cn("w-full p-4 border-4 text-left transition-all",
                  activeSkillId === s.id ? "bg-black text-white border-black shadow-[4px_4px_0_gray]" : "bg-white border-black hover:bg-yellow-50 text-black shadow-[4px_4px_0_black]")}>
                <div className="font-black uppercase truncate">{s.name}</div>
                <div className="text-[9px] font-mono opacity-60 uppercase">{new Date(s.createdAt).toLocaleDateString()}</div>
              </button>
            ))
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {!active ? (
            <div className="flex-1 flex items-center justify-center panel grayscale opacity-20">
               <Zap size={64} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6 px-2 overflow-y-auto scrollbar-hide">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-black uppercase text-gray-400 italic">Skill Designation</label>
                <input value={active.name} onChange={e => updateSkill(active.id, { name: e.target.value })}
                  className="w-full bg-transparent border-b-8 border-black font-black text-3xl uppercase outline-none focus:text-green-600 transition-colors" />
              </div>

              <div className="space-y-6">
                <div className="flex border-b-4 border-black">
                   <button className="px-6 py-2 bg-black text-white font-black uppercase text-xs italic">Instructions</button>
                   <button className="px-6 py-2 border-r-4 border-black font-black uppercase text-xs italic hover:bg-gray-100">Test Scenarios</button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black uppercase text-gray-400 italic">System Instruction Matrix</label>
                    <div className="relative">
                      <textarea value={active.body} onChange={e => updateSkill(active.id, { body: e.target.value })}
                        className="w-full bg-white border-4 border-black h-64 p-6 font-bold text-sm resize-none outline-none focus:bg-green-50 leading-relaxed font-mono" />
                      <div className="absolute top-4 right-4 text-gray-200 pointer-events-none">
                        <Terminal size={48} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-mono font-black uppercase text-gray-400 italic">Injectable Scenarios ({active.testCases.length})</label>
                    <div className="grid grid-cols-1 gap-4">
                      {active.testCases.map((tc, idx) => (
                        <div key={tc.id} className="panel p-6 bg-white border-4 border-black shadow-brutal-sm space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-mono font-black text-strobe-blue mb-2">
                            <span>SESSION_ID: {tc.id.slice(0,8)}</span>
                            <button onClick={() => {
                              const next = active.testCases.filter(t => t.id !== tc.id);
                              updateSkill(active.id, { testCases: next });
                            }} className="text-strobe-red hover:bg-strobe-red hover:text-white p-1">DELETE</button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-gray-400 uppercase">Input Payload</span>
                              <textarea value={tc.prompt} onChange={e => {
                                const next = active.testCases.map(t => t.id === tc.id ? {...t, prompt: e.target.value} : t);
                                updateSkill(active.id, { testCases: next });
                              }} className="w-full bg-gray-50 border-2 border-black p-2 font-mono text-[10px] h-20 outline-none focus:bg-white" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-gray-400 uppercase">Expected Behavior</span>
                              <textarea value={tc.expectedBehavior} onChange={e => {
                                const next = active.testCases.map(t => t.id === tc.id ? {...t, expectedBehavior: e.target.value} : t);
                                updateSkill(active.id, { testCases: next });
                              }} className="w-full bg-gray-50 border-2 border-black p-2 font-mono text-[10px] h-20 outline-none focus:bg-white" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-8">
                <div className="panel p-6 bg-blue-50 border-black space-y-2 group">
                   <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Code size={16} /> <span className="font-black text-xs uppercase">Example Injection</span>
                   </div>
                   <p className="text-[10px] font-bold text-blue-800 italic">Inject specific input-output pairs to fine-tune agent behavior in this context.</p>
                   <button 
                    onClick={() => updateSkill(active.id, { testCases: [...active.testCases, { id: uid(), prompt: "", expectedBehavior: "" }] })}
                    className="btn btn-accent w-full py-2 text-[10px] mt-4">Add Example Pair</button>
                </div>
                <div className="panel p-6 bg-red-50 border-black flex flex-col justify-between">
                   <div>
                      <div className="flex items-center gap-2 text-red-600 mb-2">
                        <Trash2 size={16} /> <span className="font-black text-xs uppercase">Danger Zone</span>
                      </div>
                      <p className="text-[10px] font-bold text-red-800 italic">This cannot be undone. All tokens associated with this skill will be purged.</p>
                   </div>
                   <button 
                    onClick={() => {
                        const { skills, addSkill, updateSkill, activeSkillId, setActiveSkillId } = useAppStore.getState();
                        const nextSkills = skills.filter(s => s.id !== active.id);
                        useAppStore.setState({ skills: nextSkills, activeSkillId: nextSkills[0]?.id || null });
                    }}
                    className="btn btn-danger w-full py-2 text-[10px] mt-4">Terminate Skill</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
