import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

export const cn  = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const uid = () => uuidv4();
export const now = () => Date.now();
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function safeJson<T>(raw: string, fallback: T): T {
  try { return JSON.parse(raw.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim()) as T; }
  catch { return fallback; }
}

export function truncate(s: string, n: number) { return s.length > n ? s.slice(0,n)+"…" : s; }
export function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""); }
export function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US",{ month:"short",day:"numeric",hour:"2-digit",minute:"2-digit" });
}
export function formatBytes(b: number) {
  if (b < 1024) return b+"B"; if (b < 1024*1024) return (b/1024).toFixed(1)+"KB";
  return (b/(1024*1024)).toFixed(1)+"MB";
}
export function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1] ?? "");
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(file);
  });
}
export function downloadText(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content],{type:"text/plain;charset=utf-8"}));
  const a = document.createElement("a"); a.href=url; a.download=name; a.click();
  URL.revokeObjectURL(url);
}
export function downloadJson(name: string, data: unknown) { downloadText(name, JSON.stringify(data,null,2)); }

export const PRIORITY_COLORS: Record<string,string> = {
  low:"#00e676", medium:"#ffab00", high:"#ff9800", critical:"#ff1744"
};
export const STATUS_COLORS: Record<string,string> = {
  todo:"#7a99b8", "in-progress":"#00d8ff", review:"#ffab00", done:"#00e676"
};
