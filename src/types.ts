// ════════════════════════════════════════════════════════
// WhisperX Builder MAX v2 — Unified Type System
// ════════════════════════════════════════════════════════

// ─── Gemini ──────────────────────────────────────────────
export type GeminiModelId =
  | "gemini-3-flash-preview"
  | "gemini-3.1-pro-preview"
  | "gemini-1.5-flash"
  | "gemini-1.5-pro";

export interface GeminiModel {
  id: GeminiModelId;
  label: string;
  supportsThinking: boolean;
}

// ─── App Settings ────────────────────────────────────────
export interface AppSettings {
  aiEnabled:             boolean;
  safeMode:              boolean;
  dryRun:                boolean;
  geminiApiKey:          string;
  geminiModel:           GeminiModelId;
  geminiThinkingEnabled: boolean;
  geminiThinkingBudget:  number;
  maxImportChars:        number;
  theme:                 ThemeId;
  sidebarOpen:           boolean;
}

// ─── User / Auth ────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  tempEmail?: string;
}

// ─── Project Templates ──────────────────────────────────
export type TemplateId = "blog" | "ecommerce" | "portfolio" | "saas" | "llm-app";

export interface ProjectTemplate {
  id: TemplateId;
  label: string;
  description: string;
  icon: string;
  stack: string[];
  initialModules: string[];
  objective: string;
}

// ─── Agents ──────────────────────────────────────────────
export type AgentId = "REX"|"ARIA"|"KODE"|"LUMA"|"SAGE"|"NOX"|"SOL"|"VOX"|"ZENS";

export interface Agent {
  id: AgentId;
  name: string;
  role: string;
  color: string;
  glow: string;
  description: string;
  specialties: string[];
  model: GeminiModelId;
  thinkingEnabled: boolean;
}

// ─── Chat ────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user"|"assistant"|"system";
  agentId?: AgentId;
  content: string;
  thinking?: string;
  timestamp: number;
  streaming?: boolean;
  model?: GeminiModelId;
  tokensUsed?: number;
}

// ─── Vision Pipeline ─────────────────────────────────────
export type VisionStageId =
  | "upload"|"blueprint"|"tokens"|"patterns"
  | "codegen"|"rules"|"refine"|"export"
  | "identification"|"layout"|"colors";

export interface VisionStage {
  id: VisionStageId;
  label: string;
  status: "idle"|"active"|"done"|"error";
  output?: string;
  tokensUsed?: number;
  durationMs?: number;
  error?: string;
}

export interface VisionSession {
  id: string;
  name: string;
  imageBase64?: string;
  imageMimeType?: string;
  stages: VisionStage[];
  lockspec?: string;
  blueprint?: string;
  generatedCode?: string;
  generatedHtml?: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Lockspec / Builder ──────────────────────────────────
export interface LockspecDoc {
  id: string;
  name: string;
  version: string;
  stack: string;
  objective: string;
  modules: string[];
  constraints: string[];
  geminiModel: GeminiModelId;
  thinkingEnabled: boolean;
  createdAt: number;
}

export type BuildStage =
  | "idle"|"audit"|"types"|"gemini"|"store"
  | "components"|"pages"|"api"|"tests"|"build"|"done"|"error";

export interface BuildRun {
  id: string;
  lockspecId: string;
  stage: BuildStage;
  log: string[];
  output?: string;
  startedAt: number;
  completedAt?: number;
  error?: string;
}

// ─── Skill Forge ─────────────────────────────────────────
export interface SkillDraft {
  id: string;
  name: string;
  description: string;
  body: string;
  testCases: SkillTestCase[];
  evalScore?: number;
  status: "draft"|"testing"|"ready"|"packaged";
  createdAt: number;
  updatedAt: number;
}

export interface SkillTestCase {
  id: string;
  prompt: string;
  expectedBehavior: string;
  result?: string;
  passed?: boolean;
  latencyMs?: number;
}

// ─── Doc Atelier ─────────────────────────────────────────
export type DocStage = "context"|"refinement"|"reader-test";
export interface DocSection {
  id: string;
  title: string;
  content: string;
  status: "placeholder"|"draft"|"refined";
  wordCount?: number;
}
export interface DocProject {
  id: string;
  title: string;
  type: string;
  audience: string;
  stage: DocStage;
  sections: DocSection[];
  context: string;
  readerTestResult?: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Themes ──────────────────────────────────────────────
export type ThemeId =
  | "midnight-galaxy"|"ocean-depths"|"sunset-boulevard"
  | "forest-canopy"|"modern-minimalist"|"golden-hour"
  | "arctic-frost"|"desert-rose"|"tech-innovation"|"botanical-garden";

export interface ThemeSpec {
  id: ThemeId;
  name: string;
  emoji: string;
  bg: string;
  bgAlt: string;
  accent: string;
  accentAlt: string;
  text: string;
  textMuted: string;
  border: string;
  fontDisplay: string;
  description: string;
}

// ─── Gallery ─────────────────────────────────────────────
export type GalleryItemType = "prompt"|"vision"|"code"|"agent"|"flow"|"skill"|"doc"|"chart";
export interface GalleryItem {
  id: string;
  type: GalleryItemType;
  title: string;
  content: string;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
  createdAt: number;
  meta?: Record<string,unknown>;
}

// ─── Tasks ───────────────────────────────────────────────
export type TaskStatus   = "todo"|"in-progress"|"review"|"done";
export type TaskPriority = "low"|"medium"|"high"|"critical";
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: AgentId;
  dueDate?: string;
  tags: string[];
  createdAt: number;
  completedAt?: number;
}

// ─── GitHub ──────────────────────────────────────────────
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string|null;
  language: string|null;
  stargazers_count: number;
  open_issues_count: number;
  updated_at: string;
  html_url: string;
}
export interface GitHubIssue {
  id: number;
  title: string;
  state: "open" | "closed";
  html_url: string;
}

export interface GitHubState {
  isConnected: boolean;
  user: any;
  repos: GitHubRepo[];
}

export interface GitHubReview {
  summary: string;
  architecture: string;
  issues: { severity:"low"|"medium"|"high"; message:string; file?:string }[];
  suggestions: string[];
  strengths: string[];
  score: number;
}

// ─── Modules ─────────────────────────────────────────────
export type ModuleId =
  | "ghost-team"|"vision-pipeline"|"canvas"|"mermaid"|"whiteboard"
  | "tasks"|"charts"|"presentation"|"gallery"|"github"
  | "builder"|"skill-forge"|"theme-lab"|"doc-atelier"|"settings";

// ─── DB / Persistence ────────────────────────────────────
export interface AppDB {
  settings: AppSettings;
  gallery: GalleryItem[];
  tasks: Task[];
  skills: SkillDraft[];
  lockspecs: LockspecDoc[];
  buildRuns: BuildRun[];
  docs: DocProject[];
  visionSessions: VisionSession[];
  updatedAt: number;
}
