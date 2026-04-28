import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import localforage from "localforage";
import type {
  ModuleId, AgentId, ChatMessage, GalleryItem, Task, SkillDraft,
  LockspecDoc, BuildRun, DocProject, VisionSession, ThemeId,
  GeminiModelId, AuthState, ProjectTemplate, TemplateId, GitHubState
} from "./types";

// Configure localforage
localforage.config({
  name: "WhisperXBuilder",
  storeName: "app_state"
});

const customStorage = {
  getItem: (name: string) => localforage.getItem(name),
  setItem: (name: string, value: any) => localforage.setItem(name, value),
  removeItem: (name: string) => localforage.removeItem(name),
};

// ─── Project Templates ────────────────────────────────────────────────────────
export const TEMPLATES: ProjectTemplate[] = [
  {
    id: "blog",
    label: "Minimalist Blog",
    description: "Multi-author blog with markdown support.",
    icon: "✍️",
    stack: ["Next.js", "Tailwind", "Contentlayer"],
    initialModules: ["ghost-team", "doc-atelier"],
    objective: "Create a fast, SEO-optimized blog with dynamic routing and a clean reading interface."
  },
  {
    id: "ecommerce",
    label: "Modern Storefront",
    description: "High-conversion e-commerce engine.",
    icon: "🛍️",
    stack: ["React", "Stripe", "Supabase"],
    initialModules: ["vision-pipeline", "builder"],
    objective: "A secure e-commerce platform with cart management, payments, and inventory sync."
  },
  {
    id: "portfolio",
    label: "Creative Portfolio",
    description: "Showcase your work with style.",
    icon: "🎨",
    stack: ["React", "Framer Motion", "Tailwind"],
    initialModules: ["theme-lab", "vision-pipeline"],
    objective: "A visually stunning portfolio for developers and designers with smooth transitions."
  },
  {
    id: "saas",
    label: "2027 Holo-SaaS",
    description: "Next-gen holographic interface for SaaS.",
    icon: "💎",
    stack: ["React", "Motion", "Tailwind", "D3"],
    initialModules: ["theme-lab", "builder", "doc-atelier"],
    objective: "Create a 2027 Corporate Brutalist SaaS with holographic typography, interactive motion graphics, and full node-effect SVG integration."
  }
];

// ─── Agent Registry ───────────────────────────────────────────────────────────
export const AGENTS = [
  { id:"REX"  as AgentId, name:"REX",  role:"Security",    color:"#ff4d4d", glow:"rgba(255,77,77,0.3)",   description:"Security auditing, threat detection, vulnerability analysis.", specialties:["security","compliance","audit"],          model:"gemini-3-flash-preview"               as GeminiModelId, thinkingEnabled:false },
  { id:"ARIA" as AgentId, name:"ARIA", role:"Orchestrator", color:"#a480ff", glow:"rgba(164,128,255,0.3)", description:"Cross-agent coordination, strategy, decision synthesis.",    specialties:["orchestration","planning","synthesis"],     model:"gemini-3.1-pro-preview" as GeminiModelId, thinkingEnabled:true  },
  { id:"KODE" as AgentId, name:"KODE", role:"Developer",   color:"#00e676", glow:"rgba(0,230,118,0.3)",   description:"Engineering, code generation, architecture.",                  specialties:["typescript","react","nextjs","api"],        model:"gemini-3.1-pro-preview" as GeminiModelId, thinkingEnabled:true  },
  { id:"LUMA" as AgentId, name:"LUMA", role:"Designer",    color:"#ff4081", glow:"rgba(255,64,129,0.3)",  description:"UI/UX, design systems, visual engineering.",                   specialties:["ui","design-systems","css","motion"],       model:"gemini-3-flash-preview"               as GeminiModelId, thinkingEnabled:false },
  { id:"SAGE" as AgentId, name:"SAGE", role:"Analyst",     color:"#00d8ff", glow:"rgba(0,216,255,0.3)",   description:"Data synthesis, strategic forecasting, metrics.",              specialties:["data","reporting","forecasting"],           model:"gemini-3.1-pro-preview"   as GeminiModelId, thinkingEnabled:true  },
  { id:"NOX"  as AgentId, name:"NOX",  role:"Shadow",      color:"#7c4dff", glow:"rgba(124,77,255,0.3)",  description:"Background optimization, caching, process tuning.",            specialties:["performance","caching","infra"],            model:"gemini-3-flash-preview"               as GeminiModelId, thinkingEnabled:false },
  { id:"SOL"  as AgentId, name:"SOL",  role:"Clarity",     color:"#ffab00", glow:"rgba(255,171,0,0.3)",   description:"Documentation, user-centric writing, guides.",                 specialties:["docs","ux-writing","tutorials"],            model:"gemini-3-flash-preview"               as GeminiModelId, thinkingEnabled:false },
  { id:"VOX"  as AgentId, name:"VOX",  role:"Voice",       color:"#ff80ab", glow:"rgba(255,128,171,0.3)", description:"NLP, sentiment analysis, localization, Thai support.",         specialties:["nlp","i18n","content","thai"],              model:"gemini-3-flash-preview"               as GeminiModelId, thinkingEnabled:false },
  { id:"ZENS" as AgentId, name:"ZENS", role:"Ethics",      color:"#b0bec5", glow:"rgba(176,190,197,0.3)", description:"Compliance, ethical AI, balanced decisions, governance.",      specialties:["compliance","ethics","risk","governance"],  model:"gemini-3.1-pro-preview"   as GeminiModelId, thinkingEnabled:true  },
] as const;

// ─── Theme Registry ───────────────────────────────────────────────────────────
export const THEMES = {
  "midnight-galaxy":   { id:"midnight-galaxy"   as ThemeId, name:"Midnight Galaxy",    emoji:"🌌", bg:"#010105", bgAlt:"#08081a", accent:"#7000ff", accentAlt:"#ff0055", text:"#f0f2f5", textMuted:"rgba(148,163,184,0.5)", border:"rgba(255,255,255,0.06)", fontDisplay:"Inter",  description:"Deep cosmic purple." },
  "ocean-depths":      { id:"ocean-depths"      as ThemeId, name:"Ocean Depths",       emoji:"🌊", bg:"#010d1a", bgAlt:"#001833", accent:"#0088ff", accentAlt:"#00ccff", text:"#e8f4fd", textMuted:"rgba(148,186,204,0.5)", border:"rgba(0,136,255,0.12)",  fontDisplay:"Inter", description:"Deep-sea blues." },
  "sunset-boulevard":  { id:"sunset-boulevard"  as ThemeId, name:"Sunset Boulevard",   emoji:"🌅", bg:"#1a0505", bgAlt:"#2d0a0a", accent:"#ff6b35", accentAlt:"#ff3366", text:"#fdf0e8", textMuted:"rgba(204,148,120,0.5)", border:"rgba(255,107,53,0.12)", fontDisplay:"Inter",  description:"Warm sunset fire." },
} as const;

// ─── Store Interface ──────────────────────────────────────────────────────────
interface AppStore {
  activeModule: ModuleId;
  sidebarOpen: boolean;
  theme: ThemeId;
  geminiModel: GeminiModelId;
  geminiThinkingEnabled: boolean;
  geminiThinkingBudget: number;
  showApiKeyModal: boolean;
  showCommandPalette: boolean;

  messages: ChatMessage[];
  activeAgent: AgentId;
  chatTyping: boolean;

  gallery: GalleryItem[];
  tasks: Task[];
  skills: SkillDraft[];
  activeSkillId: string|null;
  lockspecs: LockspecDoc[];
  activeLockspecId: string|null;
  buildRuns: BuildRun[];
  docs: DocProject[];
  activeDocId: string|null;
  visionSessions: VisionSession[];
  activeVisionId: string|null;

  github: GitHubState;
  setGitHub: (patch: Partial<GitHubState>) => void;
  setGitHubRepos: (repos: any[]) => void;

  auth: AuthState;
  setAuth: (patch: Partial<AuthState>) => void;
  logout: () => void;

  setActiveModule: (m: ModuleId) => void;
  setSidebarOpen: (v: boolean) => void;
  setTheme: (t: ThemeId) => void;
  setGeminiModel: (m: GeminiModelId) => void;
  setGeminiThinkingEnabled: (v: boolean) => void;
  setGeminiThinkingBudget: (n: number) => void;
  setShowApiKeyModal: (v: boolean) => void;
  setShowCommandPalette: (v: boolean) => void;

  addMessage: (m: ChatMessage) => void;
  updateLastMessage: (content: string, thinking?: string) => void;
  clearMessages: () => void;
  setActiveAgent: (id: AgentId) => void;
  setChatTyping: (v: boolean) => void;

  addGalleryItem: (item: GalleryItem) => void;
  removeGalleryItem: (id: string) => void;
  toggleFavorite: (id: string) => void;
  togglePinned: (id: string) => void;

  addTask: (t: Task) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;

  addSkill: (s: SkillDraft) => void;
  updateSkill: (id: string, patch: Partial<SkillDraft>) => void;
  setActiveSkillId: (id: string|null) => void;

  addLockspec: (l: LockspecDoc) => void;
  updateLockspec: (id: string, patch: Partial<LockspecDoc>) => void;
  setActiveLockspecId: (id: string|null) => void;

  addBuildRun: (r: BuildRun) => void;
  updateBuildRun: (id: string, patch: Partial<BuildRun>) => void;

  addDoc: (d: DocProject) => void;
  updateDoc: (id: string, patch: Partial<DocProject>) => void;
  setActiveDocId: (id: string|null) => void;

  addVisionSession: (s: VisionSession) => void;
  updateVisionSession: (id: string, patch: Partial<VisionSession>) => void;
  setActiveVisionId: (id: string|null) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    immer((set) => ({
      activeModule: "ghost-team",
      sidebarOpen: true,
      theme: "midnight-galaxy",
      geminiModel: "gemini-3-flash-preview",
      geminiThinkingEnabled: false,
      geminiThinkingBudget: 1024,
      showApiKeyModal: false,
      showCommandPalette: false,
      messages: [],
      activeAgent: "ARIA",
      chatTyping: false,
      gallery: [],
      tasks: [],
      skills: [],
      activeSkillId: null,
      lockspecs: [],
      activeLockspecId: null,
      buildRuns: [],
      docs: [],
      activeDocId: null,
      visionSessions: [],
      activeVisionId: null,

      github: { isConnected: false, user: null, repos: [] },
      setGitHub: (patch) => set((s) => { s.github = { ...s.github, ...patch }; }),
      setGitHubRepos: (repos) => set((s) => { s.github.repos = repos; }),

      auth: { user: null, token: null },
      setAuth: (patch) => set((s) => { s.auth = { ...s.auth, ...patch }; }),
      logout: () => set((s) => { s.auth = { user: null, token: null }; }),

      setActiveModule: (m) => set((s) => { s.activeModule = m; }),
      setSidebarOpen:  (v) => set((s) => { s.sidebarOpen = v; }),
      setTheme:        (t) => set((s) => { s.theme = t; }),
      setGeminiModel:  (m) => set((s) => { s.geminiModel = m; }),
      setGeminiThinkingEnabled: (v) => set((s) => { s.geminiThinkingEnabled = v; }),
      setGeminiThinkingBudget:  (n) => set((s) => { s.geminiThinkingBudget = n; }),
      setShowApiKeyModal:    (v) => set((s) => { s.showApiKeyModal = v; }),
      setShowCommandPalette: (v) => set((s) => { s.showCommandPalette = v; }),

      addMessage:         (m)    => set((s) => { s.messages.push(m); }),
      updateLastMessage:  (c,th) => set((s) => {
        const last = s.messages[s.messages.length - 1];
        if (last?.role === "assistant") { last.content = c; if (th !== undefined) last.thinking = th; }
      }),
      clearMessages: () => set((s) => { s.messages = []; }),
      setActiveAgent: (id) => set((s) => { s.activeAgent = id; }),
      setChatTyping:  (v)  => set((s) => { s.chatTyping = v; }),

      addGalleryItem:    (item) => set((s) => { s.gallery.unshift(item); }),
      removeGalleryItem: (id)   => set((s) => { s.gallery = s.gallery.filter(i => i.id !== id); }),
      toggleFavorite: (id) => set((s) => { const i = s.gallery.find(x=>x.id===id); if(i) i.favorite=!i.favorite; }),
      togglePinned:   (id) => set((s) => { const i = s.gallery.find(x=>x.id===id); if(i) i.pinned=!i.pinned; }),

      addTask:    (t)      => set((s) => { s.tasks.push(t); }),
      updateTask: (id, p)  => set((s) => { const t=s.tasks.find(x=>x.id===id); if(t) Object.assign(t,p); }),
      removeTask: (id)     => set((s) => { s.tasks=s.tasks.filter(t=>t.id!==id); }),

      addSkill:       (sk)    => set((s) => { s.skills.unshift(sk); }),
      updateSkill:    (id,p)  => set((s) => { const sk=s.skills.find(x=>x.id===id); if(sk) Object.assign(sk,p); }),
      setActiveSkillId: (id)  => set((s) => { s.activeSkillId=id; }),

      addLockspec:       (l)   => set((s) => { s.lockspecs.unshift(l); }),
      updateLockspec:    (id,p)=> set((s) => { const l=s.lockspecs.find(x=>x.id===id); if(l) Object.assign(l,p); }),
      setActiveLockspecId:(id) => set((s) => { s.activeLockspecId=id; }),

      addBuildRun:    (r)    => set((s) => { s.buildRuns.unshift(r); }),
      updateBuildRun: (id,p) => set((s) => { const r=s.buildRuns.find(x=>x.id===id); if(r) Object.assign(r,p); }),

      addDoc:      (d)   => set((s) => { s.docs.unshift(d); }),
      updateDoc:   (id,p)=> set((s) => { const d=s.docs.find(x=>x.id===id); if(d) Object.assign(d,p); }),
      setActiveDocId:(id)=> set((s) => { s.activeDocId=id; }),

      addVisionSession:    (vs)  => set((s) => { s.visionSessions.unshift(vs); }),
      updateVisionSession: (id,p)=> set((s) => { const v=s.visionSessions.find(x=>x.id===id); if(v) Object.assign(v,p); }),
      setActiveVisionId:   (id)  => set((s) => { s.activeVisionId=id; }),
    })),
    {
      name: "wxbmax-v2-storage",
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          if (persistedState.geminiModel === "gemini-2.0-flash-exp") {
            persistedState.geminiModel = "gemini-3-flash-preview";
          }
          if (persistedState.lockspecs) {
            persistedState.lockspecs = persistedState.lockspecs.map((l: any) => ({
              ...l,
              geminiModel: l.geminiModel === "gemini-2.0-flash-exp" ? "gemini-3-flash-preview" : l.geminiModel
            }));
          }
        }
        return persistedState;
      },
      storage: createJSONStorage(() => customStorage as any),
      partialize: (s) => ({
        theme: s.theme, sidebarOpen: s.sidebarOpen,
        geminiModel: s.geminiModel, geminiThinkingEnabled: s.geminiThinkingEnabled,
        geminiThinkingBudget: s.geminiThinkingBudget,
        gallery: s.gallery, tasks: s.tasks, skills: s.skills,
        lockspecs: s.lockspecs, docs: s.docs, visionSessions: s.visionSessions,
        github: { isConnected: s.github.isConnected, user: s.github.user },
        auth: s.auth,
      }),
    }
  )
);
