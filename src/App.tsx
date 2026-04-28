/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { GhostTeam } from './components/GhostTeam';
import { VisionPipeline } from './components/VisionPipeline';
import { BuilderStudio } from './components/BuilderStudio';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { GitHubModule } from './components/GitHubModule';
import { SkillForge } from './components/SkillForge';
import { ThemeLab } from './components/ThemeLab';
import { DocAtelier } from './components/DocAtelier';
import { useAppStore } from './store';
import { LogOut, User as UserIcon } from 'lucide-react';

async function saveWithRetry(token: string, payload: Record<string, unknown>, retries = 2) {
  for (let i = 0; i <= retries; i += 1) {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Save failed with status ${res.status}`);
      }
      return;
    } catch (error) {
      if (i >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

export default function App() {
  const { activeModule, auth, logout } = useAppStore();
  const hasHydratedFromServer = useRef(false);

  useEffect(() => {
    if (!auth.user || !auth.token || hasHydratedFromServer.current) return;

    const hydrate = async () => {
      try {
        const res = await fetch('/api/db', {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        useAppStore.setState((state) => ({
          ...state,
          lockspecs: Array.isArray(data?.lockspecs) ? data.lockspecs : state.lockspecs,
          gallery: Array.isArray(data?.gallery) ? data.gallery : state.gallery,
          tasks: Array.isArray(data?.tasks) ? data.tasks : state.tasks,
          skills: Array.isArray(data?.skills) ? data.skills : state.skills,
          docs: Array.isArray(data?.docs) ? data.docs : state.docs,
          visionSessions: Array.isArray(data?.visionSessions) ? data.visionSessions : state.visionSessions,
          theme: typeof data?.theme === 'string' ? data.theme : state.theme,
          sidebarOpen: typeof data?.sidebarOpen === 'boolean' ? data.sidebarOpen : state.sidebarOpen,
        }));
      } catch (error) {
        console.error('Hydration failed:', error);
      } finally {
        hasHydratedFromServer.current = true;
      }
    };

    hydrate();
  }, [auth.user, auth.token]);

  useEffect(() => {
    if (!auth.user || !auth.token) return;

    const saveTimer = setInterval(async () => {
      try {
        const state = useAppStore.getState();
        await saveWithRetry(auth.token!, {
          lockspecs: state.lockspecs,
          gallery: state.gallery,
          tasks: state.tasks,
          skills: state.skills,
          docs: state.docs,
          visionSessions: state.visionSessions,
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
        });
      } catch (err) {
        console.error('Auto-save failed after retries:', err);
      }
    }, 30000);

    return () => clearInterval(saveTimer);
  }, [auth.user, auth.token]);

  if (!auth.user) {
    return <Auth />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'ghost-team':
        return <GhostTeam />;
      case 'vision-pipeline':
        return <VisionPipeline />;
      case 'builder':
        return <BuilderStudio />;
      case 'github':
        return <GitHubModule />;
      case 'skill-forge':
        return <SkillForge />;
      case 'theme-lab':
        return <ThemeLab />;
      case 'doc-atelier':
        return <DocAtelier />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 h-full bg-white">
            <h1 className="text-5xl font-black uppercase tracking-tighter grad-rgby">Synthesize Underway</h1>
            <div className="w-64 h-8 border-4 border-black relative overflow-hidden bg-white">
              <div className="absolute inset-0 bg-yellow-400 animate-[move_2s_linear_infinite]" style={{ width: '40%' }} />
            </div>
            <p className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">Ghost Team // Module Expansion // v2.0</p>
            <style>{`
               @keyframes move {
                 0% { transform: translateX(-100%); }
                 100% { transform: translateX(250%); }
               }
            `}</style>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-white text-black overflow-hidden select-none font-sans border-4 border-black m-0 box-border">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden border-l-4 border-black">
        {/* Header */}
        <header className="h-20 border-b-4 border-black bg-white flex items-center justify-between px-8 flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">
                WhisperX <span className="text-strobe-blue text-holo">Builder</span>
              </h1>
              <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest mt-1">MAX_V2.0 // EVOLUTIONary IDE // 2027</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[9px] font-mono font-black uppercase text-gray-400">Environment</span>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-strobe-green border-2 border-black" />
                <span className="text-xs font-black uppercase">GEMINI_3_FLASH</span>
              </div>
            </div>

            <div className="flex items-center gap-4 border-l-4 border-black pl-8">
              <div className="w-10 h-10 border-4 border-black flex items-center justify-center bg-yellow-400 group relative">
                <UserIcon size={20} />
                <div className="absolute top-12 right-0 hidden group-hover:block z-50">
                  <div className="panel p-4 bg-white min-w-[200px] border-4 border-black shadow-[8px_8px_0_black]">
                    <p className="font-black uppercase text-[10px] mb-1">{auth.user.username}</p>
                    <p className="text-[9px] font-mono text-gray-400 mb-4">{auth.user.email}</p>
                    <button onClick={logout} className="btn btn-danger w-full py-2 text-[10px] uppercase">
                      <LogOut size={12} /> Terminate Session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Viewport Container */}
        <main className="flex-1 relative overflow-hidden bg-white">
          <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
          <div className="relative h-full overflow-hidden">{renderModule()}</div>
        </main>
      </div>
    </div>
  );
}
