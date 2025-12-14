
import React from 'react';
import { Menu, Save, FileText, Settings, Sparkles, FolderSearch, Upload, FileCode, Grid3X3, Disc, Users, Layers } from 'lucide-react';
import { NotificationToast, NotificationState } from './NotificationToast';
import { playHover, playSelect } from '../services/audio';

interface EditorLayoutProps {
  children: React.ReactNode;
  onExport: () => void;
  onOpen: () => void;
  onScanChars: () => void;
  onScanStages: () => void;
  onAIModalOpen: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notification: NotificationState | null;
  onCloseNotification: () => void;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({ 
  children, 
  onExport, 
  onOpen,
  onScanChars,
  onScanStages,
  onAIModalOpen,
  activeTab, 
  setActiveTab,
  notification,
  onCloseNotification
}) => {
  
  const handleNavClick = (tab: string) => {
    playSelect();
    setActiveTab(tab);
  };

  return (
    <div className="flex h-screen w-full flex-col font-sans selection:bg-white/20 overflow-hidden bg-black text-white">
      {/* Notification Toast */}
      {notification && (
        <NotificationToast 
          notification={notification} 
          onClose={onCloseNotification} 
        />
      )}

      {/* Top Header - Monochrome */}
      <header className="flex-shrink-0 relative z-20">
          <div className="h-1 w-full bg-gradient-to-r from-zinc-800 via-white to-zinc-800"></div>
          <div className="bg-gradient-to-b from-zinc-900 to-black border-b border-zinc-800 flex items-center justify-between px-6 py-2 shadow-lg">
               {/* Left: Title Block */}
               <div className="flex items-center gap-4">
                   <div className="text-4xl font-black italic tracking-tighter text-white transform -skew-x-12" style={{textShadow: '0 0 10px rgba(255,255,255,0.2)'}}>
                       IKEMEN <span className="text-zinc-500">GO</span>
                   </div>
                   <div className="h-8 w-px bg-zinc-800 transform skew-x-12 mx-2"></div>
                   <div className="flex flex-col justify-center">
                       <span className="text-[10px] text-zinc-400 font-bold tracking-[0.2em] uppercase">Select Definition</span>
                       <span className="text-xs text-white font-mono uppercase">System: <span className="text-zinc-500">Ready</span></span>
                   </div>
               </div>

               {/* Right: Action Buttons (Skewed) */}
               <div className="flex items-center gap-1">
                   <HeaderButton onClick={onOpen} icon={<Upload className="h-3 w-3" />} label="Load" />
                   <HeaderButton onClick={onScanChars} icon={<FolderSearch className="h-3 w-3" />} label="Scan" />
                   <div className="w-4"></div>
                   <HeaderButton onClick={onAIModalOpen} icon={<Sparkles className="h-3 w-3" />} label="AI" />
                   <HeaderButton onClick={onExport} icon={<Save className="h-4 w-4" />} label="SAVE DATA" big />
               </div>
          </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Navigation */}
        <aside className="w-20 flex-shrink-0 flex flex-col bg-black border-r border-zinc-800 z-10 relative">
          <NavButton active={activeTab === 'characters'} onClick={() => handleNavClick('characters')} icon={<Users />} label="TEAM" />
          <NavButton active={activeTab === 'screenpack'} onClick={() => handleNavClick('screenpack')} icon={<Grid3X3 />} label="GUI" />
          <NavButton active={activeTab === 'stages'} onClick={() => handleNavClick('stages')} icon={<Disc />} label="MAP" />
          <NavButton active={activeTab === 'motifs'} onClick={() => handleNavClick('motifs')} icon={<Layers />} label="MOTIF" />
          <NavButton active={activeTab === 'settings'} onClick={() => handleNavClick('settings')} icon={<Settings />} label="OPT" />
          <NavButton active={activeTab === 'code'} onClick={() => handleNavClick('code')} icon={<FileText />} label="SRC" />
          <div className="flex-1 bg-gradient-to-b from-transparent to-zinc-900/50"></div>
        </aside>

        {/* Workspace */}
        <main className="flex-1 overflow-auto p-4 relative z-0">
            {children}
        </main>
      </div>
    </div>
  );
};

const HeaderButton = ({ onClick, icon, label, big }: any) => {
    return (
        <button
            onMouseEnter={() => playHover()}
            onClick={() => { playSelect(); onClick(); }}
            className={`
                group relative overflow-hidden
                transform -skew-x-12 border transition-all duration-150
                flex items-center justify-center
                ${big 
                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:bg-zinc-200' 
                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-500'}
                ${big ? 'px-6 py-1 text-lg font-bold' : 'px-3 py-1 text-sm font-bold'}
            `}
        >
            <div className="transform skew-x-12 flex items-center gap-1.5 uppercase font-sans">
                {icon}
                {label}
            </div>
            {/* Shiny effect */}
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12 group-hover:animate-shine transition-all"></div>
        </button>
    )
};

const NavButton = ({ active, onClick, icon, label }: any) => {
    return (
      <button
        onMouseEnter={() => playHover()}
        onClick={onClick}
        className={`
            w-full aspect-square flex flex-col items-center justify-center gap-1 
            transition-all duration-200 group relative border-b border-zinc-900
            ${active ? 'bg-white text-black' : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900'}
        `}
      >
        <div className={`transform transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase font-mono">{label}</span>
      </button>
    );
};
