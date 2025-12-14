
import React, { useState } from 'react';
import { Download, ExternalLink, Package, Loader2, Search, Globe, User, CheckCircle, AlertTriangle, Zap, Layers, MapPin } from 'lucide-react';
import { CharacterDef, AssetType } from '../types';
import { generateId } from '../services/parser';
import { installAssetFromUrl } from '../services/fileSystem';
import { searchAssets } from '../services/gemini';
import { playHover, playSelect, playSuccess, playCancel } from '../services/audio';

interface AssetDownloaderProps {
  isOpen: boolean;
  onClose: () => void;
  onImportChar: (newChars: CharacterDef[]) => void;
  onImportStage: (stagePath: string) => void;
  // Handles for different root directories
  charsDirHandle: any;
  stagesDirHandle: any;
  dataDirHandle: any;
  onRequestDir: (type: 'chars'|'stages'|'data') => Promise<any>;
}

const ANDERSON_FEATURED = [
  { name: 'KOF 2002 UM Motif', author: 'AndersonKenya1', desc: 'The definitive 2002UM experience.', id: 'kof2k2um', type: 'screenpack', url: '' },
  { name: 'CvS3 Battle Stage', author: 'Infinite', desc: 'High res crossover stage.', id: 'cvs3_stage', type: 'stage', url: '' },
  { name: 'Ryu (PotS)', author: 'Phantom.of.the.Server', desc: 'Classic gameplay.', id: 'ryu_pots', type: 'character', url: '' },
];

export const CharacterDownloader: React.FC<AssetDownloaderProps> = ({ 
    isOpen, onClose, onImportChar, onImportStage,
    charsDirHandle, stagesDirHandle, dataDirHandle, onRequestDir 
}) => {
  const [activeType, setActiveType] = useState<AssetType>('character');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [installing, setInstalling] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!searchQuery.trim()) return;
      playSelect();
      setSearching(true);
      setSearchResults([]);
      try {
          const results = await searchAssets(searchQuery, activeType);
          setSearchResults(results);
      } catch (err) {
          console.error(err);
      } finally {
          setSearching(false);
      }
  };

  const handleExternalFind = (item: any) => {
      playSelect();
      const q = encodeURIComponent(`download ${item.name} by ${item.author} ${activeType} mugen andersonkenya1`);
      window.open(`https://www.google.com/search?q=${q}`, '_blank');
  };

  const getDirHandle = async (type: AssetType) => {
      if (type === 'character') {
          if (charsDirHandle) return charsDirHandle;
          return await onRequestDir('chars');
      } else if (type === 'stage') {
          if (stagesDirHandle) return stagesDirHandle;
          return await onRequestDir('stages');
      } else {
          if (dataDirHandle) return dataDirHandle;
          return await onRequestDir('data');
      }
  };

  const handleInstall = async (item: any) => {
    playSelect();
    setError(null);
    setInstalling(item.name);
    setStatus('Checking access...');

    try {
        // Attempt to get handle, but proceed even if null (download mode)
        let handle = null;
        try {
             handle = await getDirHandle(activeType);
        } catch (e) {
            console.warn("Folder selection cancelled or failed, switching to download mode.");
        }

        if (!item.downloadUrl) {
            // Mock install for featured/no-link items
            setStatus('No Direct Link - Simulating...');
            await new Promise(r => setTimeout(r, 1000));
            // Mock result
            if (activeType === 'character') {
                const newChar: CharacterDef = {
                    id: generateId(),
                    name: item.id || item.name.replace(/\s+/g, ''),
                    stage: '',
                    order: 1
                };
                onImportChar([newChar]);
            } else if (activeType === 'stage') {
                onImportStage(`stages/${item.id || item.name}.def`);
            } else {
                alert("Installed Motif! Go to Motif Manager to activate.");
            }
            setStatus('Simulation Complete!');
            playSuccess();
             setTimeout(() => {
                setInstalling(null);
                setStatus('');
            }, 1000);
            return;
        }

        // Real Install (or Download)
        const installedPath = await installAssetFromUrl(item.downloadUrl, handle, activeType, (msg) => setStatus(msg));
        
        if (installedPath) {
             // If we got a path back (either from write or zip guess), update the editor
            if (activeType === 'character') {
                const name = installedPath.split('/').pop()?.replace('.def', '') || 'unknown';
                 const newChar: CharacterDef = {
                    id: generateId(),
                    name: name,
                    stage: '',
                    order: 1
                };
                onImportChar([newChar]);
            } else if (activeType === 'stage') {
                onImportStage(installedPath);
            } else if (activeType === 'screenpack') {
                // For screenpacks, we just notify
                if (!handle) {
                    // Download mode
                    setStatus("Downloaded!");
                }
            }

            setStatus(handle ? 'Installed Successfully!' : 'Downloaded Successfully!');
            playSuccess();
        } else {
            setStatus('Done.');
        }

        setTimeout(() => {
            setInstalling(null);
            setStatus('');
        }, 1500);

    } catch (e: any) {
        console.error(e);
        setError(e.message || 'Installation failed');
        setInstalling(null);
        playCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
      <div className="y2k-panel w-full max-w-5xl h-[700px] flex flex-col overflow-hidden text-slate-200 shadow-2xl shadow-blue-900/50">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-500/50 bg-[#050a14] px-6 py-4">
          <div className="flex items-center gap-6">
              <h3 className="flex items-center gap-2 text-2xl font-black text-white italic tracking-tighter transform -skew-x-12">
                <Globe className="h-6 w-6 text-blue-400" />
                ANDERSON<span className="text-yellow-500">NET</span>
              </h3>
              
              {/* Type Tabs */}
              <div className="flex bg-black border border-blue-800 transform -skew-x-12">
                  {[
                      {id: 'character', icon: User, label: 'FIGHTERS'},
                      {id: 'stage', icon: MapPin, label: 'STAGES'},
                      {id: 'screenpack', icon: Layers, label: 'MOTIFS'}
                  ].map((tab: any) => (
                      <button 
                        key={tab.id}
                        onClick={() => { playSelect(); setActiveType(tab.id as AssetType); setSearchResults([]); setSearchQuery(''); }}
                        onMouseEnter={playHover}
                        className={`
                            px-4 py-2 text-xs font-bold uppercase transition-all flex items-center gap-2
                            ${activeType === tab.id 
                                ? 'bg-blue-600 text-white shadow-[0_0_10px_#2563eb]' 
                                : 'text-blue-400 hover:bg-blue-900/30'}
                        `}
                      >
                          <tab.icon className="h-3 w-3" />
                          {tab.label}
                      </button>
                  ))}
              </div>
          </div>
          <button onClick={() => { playCancel(); onClose(); }} className="text-blue-400 hover:text-white transition-colors font-bold uppercase text-sm flex items-center gap-1">
             <div className="h-2 w-2 bg-red-500 animate-pulse"></div> CLOSE CONNECTION
          </button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
           
           {/* Search Bar */}
           <div className="flex gap-2 mb-6">
               <div className="relative flex-1">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Search className="h-5 w-5 text-blue-500" />
                   </div>
                   <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`SEARCH ${activeType.toUpperCase()} DATABASE...`}
                        className="w-full bg-black/80 border-2 border-blue-900 text-blue-100 pl-10 pr-4 py-3 font-mono text-sm focus:border-yellow-500 outline-none shadow-inner"
                   />
               </div>
               <button 
                onClick={(e) => handleSearch(e)}
                disabled={searching || !searchQuery}
                onMouseEnter={playHover}
                className="px-8 bg-blue-600 text-white font-bold italic transform -skew-x-12 hover:bg-blue-500 disabled:opacity-50 border-2 border-blue-400"
               >
                   {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SEARCH'}
               </button>
           </div>

           {/* Results Area */}
           <div className="flex-1 overflow-y-auto border border-blue-900/50 bg-black/60 p-4 shadow-inner custom-scrollbar">
               {status && (
                   <div className="mb-4 p-2 bg-blue-900/40 border border-blue-500 text-blue-200 text-xs font-mono animate-pulse">
                       {status}
                   </div>
               )}
               {error && (
                   <div className="mb-4 p-2 bg-red-900/40 border border-red-500 text-red-200 text-xs font-mono">
                       {error}
                   </div>
               )}

               {searchResults.length === 0 && !searching && (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="col-span-full text-center text-blue-500/50 mb-4 font-bold tracking-widest uppercase">
                           -- Featured {activeType}s --
                       </div>
                       {ANDERSON_FEATURED.filter(f => f.type === activeType).map((feat, idx) => (
                           <div key={idx} className="bg-[#050a14] border border-blue-800 p-4 hover:border-yellow-500 transition-colors group">
                               <div className="flex justify-between items-start">
                                   <div className="bg-blue-900/50 text-blue-300 text-[10px] px-2 py-0.5 rounded uppercase font-bold mb-2 inline-block">Featured</div>
                                   <Package className="h-5 w-5 text-blue-600 group-hover:text-yellow-500" />
                               </div>
                               <h4 className="font-black text-white text-lg uppercase italic">{feat.name}</h4>
                               <p className="text-xs text-slate-400 mt-1">{feat.desc}</p>
                               <button 
                                onClick={() => handleInstall(feat)}
                                className="mt-4 w-full bg-blue-800 hover:bg-yellow-600 text-white text-xs font-bold py-2 uppercase"
                               >
                                   Install / Get
                               </button>
                           </div>
                       ))}
                   </div>
               )}

               <div className="grid grid-cols-1 gap-2 mt-4">
                   {searchResults.map((res, idx) => (
                       <div key={idx} className="flex items-center justify-between bg-[#0a1020] p-3 border-l-4 border-blue-600 hover:bg-[#111a30] transition-colors group">
                           <div className="flex-1">
                               <div className="flex items-center gap-2">
                                   <h4 className="font-bold text-white text-sm uppercase tracking-wide">{res.name}</h4>
                                   {res.downloadUrl && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                               </div>
                               <div className="flex items-center gap-4 text-xs text-blue-400 font-mono mt-0.5">
                                   <span>AUTH: {res.author}</span>
                                   <span>SRC: {res.downloadUrl ? 'Direct' : 'External'}</span>
                               </div>
                               <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{res.description}</p>
                           </div>
                           <div className="flex gap-2">
                               <button 
                                onClick={() => handleExternalFind(res)}
                                onMouseEnter={playHover}
                                className="px-3 py-1 text-[10px] border border-blue-800 text-blue-400 hover:text-white hover:border-blue-400 uppercase font-bold"
                               >
                                   WEB SEARCH
                               </button>
                               <button 
                                onClick={() => handleInstall(res)}
                                disabled={!!installing}
                                onMouseEnter={playHover}
                                className="px-4 py-1 text-[10px] bg-blue-600 text-white hover:bg-yellow-500 hover:text-black uppercase font-bold disabled:opacity-50 min-w-[80px]"
                               >
                                   {res.downloadUrl ? (charsDirHandle || stagesDirHandle || dataDirHandle ? 'INSTALL' : 'DOWNLOAD') : 'SIMULATE'}
                               </button>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
           
           <div className="mt-2 flex justify-between text-[10px] text-blue-600 font-mono uppercase">
                <span>Secure Connection: TLS 1.3</span>
                <span>Powered by Gemini AI + AndersonKenya1 Index</span>
           </div>

        </div>
      </div>
    </div>
  );
};
