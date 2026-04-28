import React, { useEffect, useState } from "react";
import { useAppStore } from "../store";
import { Github, Loader, ExternalLink, GitBranch, Star, RefreshCw } from "lucide-react";

export function GitHubModule() {
  const { github, setGitHub, setGitHubRepos } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRepos = async (token: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/github/repos", {
        headers: { Authorization: `token ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch repositories");
      setGitHubRepos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const connectGitHub = async () => {
    try {
      const res = await fetch("/api/auth/github/url");
      const { url } = await res.json();
      const popup = window.open(url, "github_oauth", "width=600,height=700");
      if (!popup) alert("Popup blocked! Please allow popups for GitHub connection.");
    } catch (err) {
      setError("Could not initialize GitHub connection.");
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "GITHUB_AUTH_SUCCESS") {
        const { token, user } = event.data;
        setGitHub({ isConnected: true, user });
        // We'll store the token in session or local storage for now
        // In a real app, it would be in a secure cookie or DB
        localStorage.setItem("gh_token", token);
        fetchRepos(token);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("gh_token");
    if (token && github.isConnected && github.repos.length === 0) {
      fetchRepos(token);
    }
  }, [github.isConnected]);

  return (
    <div className="h-full flex flex-col p-8 bg-white grid-bg overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black flex items-center justify-center text-white border-4 border-black shadow-[4px_4px_0_gray]">
            <Github size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">GitHub Forge</h2>
            <p className="text-[10px] font-mono text-gray-500 uppercase font-black">Code Synchronization Engine</p>
          </div>
        </div>

        {!github.isConnected ? (
          <button onClick={connectGitHub} className="btn btn-accent px-6">
            <Github size={16} /> <span className="ml-2">Connect GitHub</span>
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <button onClick={() => {
              const token = localStorage.getItem("gh_token");
              if (token) fetchRepos(token);
            }} disabled={loading} className="btn bg-white">
              <RefreshCw className={loading ? "animate-spin" : ""} size={14}/>
            </button>
            <div className="flex items-center gap-2 p-2 border-2 border-black bg-yellow-50">
              <img src={github.user?.avatar_url} alt="Avatar" className="w-6 h-6 border-2 border-black" />
              <span className="text-[10px] font-black uppercase">{github.user?.login}</span>
            </div>
            <button onClick={() => {
              setGitHub({ isConnected: false, user: null, repos: [] });
              localStorage.removeItem("gh_token");
            }} className="btn btn-danger py-1 px-3 text-[10px]">Disconnect</button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 border-4 border-red-600 bg-red-50 text-red-600 font-bold uppercase text-xs">
          Error: {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
        {!github.isConnected ? (
          <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-gray-200">
             <Github size={64} className="mb-4 opacity-5" />
             <p className="font-black uppercase tracking-widest text-sm text-gray-300">Connect to synchronize repositories</p>
          </div>
        ) : loading ? (
          <div className="h-full flex items-center justify-center">
             <Loader className="animate-spin text-blue-600" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {github.repos.map(repo => (
               <div key={repo.id} className="panel p-6 flex flex-col h-full group bg-white border-4 border-black shadow-[4px_4px_0_black] hover:shadow-[10px_10px_0_#2563eb] hover:-translate-y-1 transition-all">
                  <div className="flex justify-between items-start mb-4">
                     <h3 className="font-black text-lg uppercase truncate flex-1 pr-4">{repo.name}</h3>
                     <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-black">
                        <ExternalLink size={14} />
                     </a>
                  </div>
                  <p className="text-[11px] font-bold text-gray-500 mb-6 flex-1 line-clamp-3 leading-relaxed italic">
                     {repo.description || "No description provided for this repository."}
                  </p>
                  <div className="flex items-center justify-between border-t-2 border-black pt-4">
                     <div className="flex items-center gap-3 text-[10px] font-black uppercase">
                        <span className="flex items-center gap-1">
                           <Star size={12} className="text-yellow-500" /> {repo.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1">
                           <GitBranch size={12} className="text-blue-500" /> {repo.language || "N/A"}
                        </span>
                     </div>
                     <button className="text-[9px] font-black uppercase px-3 py-1 bg-black text-white hover:bg-blue-600 transition-colors">
                        Synchronize
                     </button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
