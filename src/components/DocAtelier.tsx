import React, { useMemo, useState } from "react";
import { Book, Plus, Search, FileText, Globe, Code, PenTool, Layers, Eye, Download } from "lucide-react";
import { useAppStore } from "../store";
import { cn, uid, now, downloadText } from "../lib/utils";
import type { DocProject } from "../types";

export function DocAtelier() {
  const { docs, addDoc, updateDoc, activeDocId, setActiveDocId } = useAppStore();
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const active = docs.find((d) => d.id === activeDocId) ?? null;
  const activeSection = active?.sections.find((s) => s.id === activeSectionId) ?? null;

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) => d.title.toLowerCase().includes(q) || d.type.toLowerCase().includes(q));
  }, [docs, search]);

  const handleNewProject = () => {
    const d: DocProject = {
      id: uid(),
      title: "New SDK Docs",
      type: "guide",
      audience: "Developers",
      stage: "context",
      sections: [],
      context: "",
      createdAt: now(),
      updatedAt: now(),
    };
    addDoc(d);
    setActiveDocId(d.id);
  };

  const exportCorpus = () => {
    if (!active) return;
    const doc = [
      `# ${active.title}`,
      ``,
      `Type: ${active.type}`,
      `Audience: ${active.audience}`,
      `Stage: ${active.stage}`,
      ``,
      ...active.sections.flatMap((s) => [`## ${s.title}`, ``, s.content || "", ``]),
    ].join("\n");
    downloadText(`${active.title.toLowerCase().replace(/\s+/g, "-") || "docs"}.md`, doc);
  };

  return (
    <div className="h-full flex flex-col p-8 bg-white grid-bg overflow-hidden italic">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 border-4 border-black flex items-center justify-center text-white shadow-[4px_4px_0_black]">
            <Book size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">Doc Atelier</h2>
            <p className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest">Knowledge Base Synthesis</p>
          </div>
        </div>
        <button onClick={handleNewProject} className="btn btn-accent flex items-center gap-2">
          <Plus size={16} /> Init Corpus
        </button>
      </div>

      <div className="flex-1 flex gap-10 overflow-hidden">
        <div className="w-1/3 flex flex-col gap-6 overflow-hidden">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="QUERY DOCUMENTATION..."
              className="w-full bg-white border-4 border-black p-4 font-black uppercase text-xs outline-none focus:bg-yellow-50 pr-12 shadow-[4px_4px_0_black]"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="flex-1 overflow-y-auto pr-4 space-y-4 scrollbar-hide">
            {filteredDocs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-gray-100 grayscale opacity-40">
                <FileText size={48} className="mb-4" />
                <p className="text-[10px] font-black uppercase">No Documentation Projects</p>
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDocId(doc.id)}
                  className={cn(
                    "w-full panel p-6 text-left group transition-all border-4 shadow-[6px_6px_0_black] hover:shadow-[10px_10px_0_#2563eb]",
                    activeDocId === doc.id ? "border-blue-600" : "border-black"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-lg uppercase truncate flex-1">{doc.title}</h3>
                    <span className="text-[9px] font-mono font-black italic text-blue-600">{doc.type}</span>
                  </div>
                  <div className="flex gap-4 text-[9px] font-black uppercase text-gray-400">
                    <span className="flex items-center gap-1">
                      <Layers size={12} /> {doc.sections.length} SECTIONS
                    </span>
                    <span className={cn("px-1.5 py-0.5 border-2", doc.stage === "reader-test" ? "border-green-500 text-green-500" : "border-yellow-500 text-yellow-500")}>{doc.stage.toUpperCase()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center panel bg-white border-4 border-black border-dashed opacity-50 grayscale">
              <PenTool size={64} className="mb-6" />
              <p className="font-black uppercase tracking-[0.2em]">Select Document Project to Begin</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-8 bg-white p-8 panel border-8 border-black shadow-[20px_20px_0_black] overflow-y-auto scrollbar-hide">
              <div className="flex justify-between items-start border-b-8 border-black pb-8">
                <div className="space-y-2 flex-1 mr-8">
                  <label className="text-[10px] font-black uppercase text-gray-400">Project Identifier</label>
                  <input value={active.title} onChange={(e) => updateDoc(active.id, { title: e.target.value, updatedAt: now() })} className="w-full bg-transparent font-black text-4xl uppercase outline-none focus:text-blue-600" />
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setShowPreview(true)} className="btn btn-warning py-2 text-[10px]">
                    <Eye size={14} /> Preview Site
                  </button>
                  <button onClick={exportCorpus} className="btn btn-success py-2 text-[10px]">
                    <Download size={14} /> Deploy Corpus
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-black uppercase text-xs flex items-center gap-2">
                    <Globe size={16} /> Site Configuration
                  </h4>
                  <div className="panel p-6 bg-gray-50 border-black space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400">Target Framework</label>
                      <select value={active.type} onChange={(e) => updateDoc(active.id, { type: e.target.value, updatedAt: now() })} className="w-full bg-white border-2 border-black p-2 font-bold text-xs outline-none">
                        <option value="guide">Guide</option>
                        <option value="api">API Reference</option>
                        <option value="whitepaper">Whitepaper</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400">Theme Base</label>
                      <div className="flex gap-2">
                        <div className="w-6 h-6 bg-white border-2 border-black cursor-pointer shadow-[2px_2px_0_black]" />
                        <div className="w-6 h-6 bg-black border-2 border-black cursor-pointer shadow-[2px_2px_0_black]" />
                        <div className="w-6 h-6 bg-blue-600 border-2 border-black cursor-pointer shadow-[2px_2px_0_black]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-black uppercase text-xs flex items-center gap-2">
                    <Code size={16} /> Page Hierarchy
                  </h4>
                  <div className="space-y-2">
                    {active.sections.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setActiveSectionId(s.id)}
                        className={cn(
                          "w-full p-3 border-2 border-black bg-white font-bold text-[10px] text-left flex justify-between items-center transition-all",
                          activeSectionId === s.id ? "bg-black text-white" : "hover:bg-yellow-50"
                        )}
                      >
                        <span>{s.title.toUpperCase()}.MD</span>
                        <FileText size={12} />
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        const sid = uid();
                        updateDoc(active.id, { sections: [...active.sections, { id: sid, title: "New Page", content: "", status: "placeholder" }], updatedAt: now() });
                        setActiveSectionId(sid);
                      }}
                      className="w-full p-3 border-4 border-dashed border-gray-200 text-gray-300 font-black uppercase text-[9px] flex items-center justify-center gap-2 py-4"
                    >
                      <Plus size={14} /> New Fragment
                    </button>
                  </div>
                </div>
              </div>

              {activeSection && (
                <div className="mt-8 pt-8 border-t-8 border-black space-y-4 animate-in slide-in-from-bottom duration-300">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 mr-4">
                      <label className="text-[9px] font-black uppercase text-gray-400">Section Title</label>
                      <input
                        value={activeSection.title}
                        onChange={(e) => {
                          const next = active.sections.map((s) => (s.id === activeSection.id ? { ...s, title: e.target.value } : s));
                          updateDoc(active.id, { sections: next, updatedAt: now() });
                        }}
                        className="w-full bg-transparent font-black text-xl uppercase outline-none focus:text-strobe-blue"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const next = active.sections.filter((s) => s.id !== activeSection.id);
                        updateDoc(active.id, { sections: next, updatedAt: now() });
                        setActiveSectionId(null);
                      }}
                      className="btn btn-danger py-2 text-[10px]"
                    >
                      Purge Page
                    </button>
                  </div>
                  <div className="relative">
                    <textarea
                      value={activeSection.content}
                      onChange={(e) => {
                        const next = active.sections.map((s) => (s.id === activeSection.id ? { ...s, content: e.target.value, status: "draft" as const } : s));
                        updateDoc(active.id, { sections: next, updatedAt: now() });
                      }}
                      className="w-full bg-white border-4 border-black h-96 p-6 font-mono text-xs outline-none focus:bg-gray-50 leading-loose"
                      placeholder="# Start writing markdown..."
                    />
                    <div className="absolute bottom-4 right-4 pointer-events-none opacity-10">
                      <Code size={48} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showPreview && active && (
        <div className="fixed inset-0 z-50 bg-black/70 p-8 flex items-center justify-center">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden bg-white border-8 border-black shadow-[16px_16px_0_black] flex flex-col">
            <div className="flex items-center justify-between border-b-4 border-black px-6 py-4">
              <h3 className="font-black uppercase text-xl">Preview: {active.title}</h3>
              <button className="btn py-1" onClick={() => setShowPreview(false)}>
                Close
              </button>
            </div>
            <div className="p-6 overflow-auto space-y-4 font-mono text-sm">
              {active.sections.length === 0 ? (
                <p>No sections to preview.</p>
              ) : (
                active.sections.map((s) => (
                  <section key={s.id} className="border-2 border-black p-4">
                    <h4 className="font-black uppercase text-base mb-2">{s.title}</h4>
                    <pre className="whitespace-pre-wrap text-xs">{s.content || "(empty section)"}</pre>
                  </section>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
