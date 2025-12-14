
import React, { useState, useMemo } from 'react';
import { CharacterDef, GridSettings } from '../types';
import { generateId } from '../services/parser';
import { UnlockBuilder } from './UnlockBuilder';
import { openFilePicker, openAudioPicker } from '../services/fileSystem';
import { Plus, X, Music, MapPin, Hash, Star, FolderOpen, Search, Fingerprint, Zap, Palette, Monitor, Cpu, Filter, SortAsc, SortDesc, EyeOff, User } from 'lucide-react';
import { playHover, playSelect, playCancel } from '../services/audio';

interface GridEditorProps {
  characters: CharacterDef[];
  setCharacters: (chars: CharacterDef[]) => void;
  gridSettings: GridSettings;
  setGridSettings: (settings: GridSettings) => void;
  availableFiles: string[];
  availableStages: string[];
}

const StatHexagon = ({ char }: { char: CharacterDef | undefined }) => {
    const size = 140;
    const center = size / 2;
    const radius = 50;
    
    const stats = useMemo(() => {
        if (!char) return [0,0,0,0,0,0];
        const ai = char.aiLevel || 1; 
        const ord = char.order || 1;
        const isBonus = char.bonus ? 100 : 20;
        const isHidden = char.unlock ? 100 : 30;
        const res = char.localcoord ? 100 : 50;
        const nameLen = (char.name.length * 5) % 100;

        return [
            Math.min(100, ai * 12), // Top: AI
            Math.min(100, ord * 10), // Top Right: Order
            isBonus, // Bottom Right: Utility
            res, // Bottom: Tech
            isHidden, // Bottom Left: Rarity
            50 + nameLen // Top Left: Spirit
        ];
    }, [char]);

    const getPoly = (values: number[], r: number) => values.map((val, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const dist = (val / 100) * r;
        return `${center + dist * Math.cos(angle)},${center + dist * Math.sin(angle)}`;
    }).join(' ');

    const bgPoly = getPoly([100,100,100,100,100,100], radius);
    const statPoly = getPoly(stats, radius);

    return (
        <div className="relative w-full flex justify-center py-4 bg-zinc-950 rounded border border-zinc-800">
            {char?.portraitUrl ? (
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                    <img src={char.portraitUrl} alt="" className="max-h-full max-w-full object-contain mix-blend-screen" />
                </div>
            ) : null}
            <svg width={size} height={size} className="relative z-10">
                <polygon points={bgPoly} fill="none" stroke="#333" strokeWidth="1" />
                <polygon points={getPoly([50,50,50,50,50,50], radius)} fill="none" stroke="#333" strokeWidth="0.5" strokeDasharray="2,2" />
                <polygon points={statPoly} fill="rgba(255, 255, 255, 0.1)" stroke="#fff" strokeWidth="2" />
                <text x={center} y={15} fill="#888" fontSize="8" textAnchor="middle" fontWeight="bold">AI</text>
                <text x={size-20} y={40} fill="#888" fontSize="8" textAnchor="middle" fontWeight="bold">ORD</text>
                <text x={size-20} y={100} fill="#888" fontSize="8" textAnchor="middle" fontWeight="bold">UTL</text>
                <text x={center} y={size-5} fill="#888" fontSize="8" textAnchor="middle" fontWeight="bold">RES</text>
                <text x={20} y={100} fill="#888" fontSize="8" textAnchor="middle" fontWeight="bold">RAR</text>
                <text x={20} y={40} fill="#888" fontSize="8" textAnchor="middle" fontWeight="bold">SPI</text>
            </svg>
        </div>
    );
};

export const GridEditor: React.FC<GridEditorProps> = ({
  characters,
  setCharacters,
  gridSettings,
  setGridSettings,
  availableFiles,
  availableStages
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Advanced Filter State
  const [filterMode, setFilterMode] = useState<'all' | 'hidden' | 'bonus' | 'missing_stage'>('all');
  const [sortBy, setSortBy] = useState<'none' | 'name' | 'order' | 'ai'>('none');
  const [showFilters, setShowFilters] = useState(false);

  const handleUpdateChar = (id: string, updates: Partial<CharacterDef>) => {
    setCharacters(characters.map(c => c.id === id ? { ...c, ...updates } : c));
    if (updates.id && id === selectedId) {
        setSelectedId(updates.id);
    }
  };

  const handleRemoveChar = (id: string) => {
    playCancel();
    if (confirm('Remove this fighter from the roster?')) {
      setCharacters(characters.filter(c => c.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  const handleAddChar = () => {
    playSelect();
    const newChar: CharacterDef = {
      id: generateId(),
      name: 'randomselect',
      stage: '',
      order: 1
    };
    setCharacters([...characters, newChar]);
    setSelectedId(newChar.id);
  };

  const handleBrowseStage = async (charId: string) => {
      playSelect();
      const result = await openFilePicker();
      if (result) {
          handleUpdateChar(charId, { stage: `stages/${result.name}` });
      }
  };

  const selectedChar = characters.find(c => c.id === selectedId);

  // --- Filtering Logic ---
  const displayIndices = useMemo(() => {
      // 1. Map to enrich with original index
      let mapped = characters.map((c, i) => ({ ...c, originalIndex: i }));

      // 2. Search
      if (searchTerm) {
          mapped = mapped.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }

      // 3. Filter
      if (filterMode === 'hidden') mapped = mapped.filter(c => !!c.unlock);
      if (filterMode === 'bonus') mapped = mapped.filter(c => c.bonus === 1);
      if (filterMode === 'missing_stage') mapped = mapped.filter(c => !c.stage && c.name !== 'randomselect' && c.name !== 'blank');

      // 4. Sort (Only affects visualization order if we were rendering a list, 
      // but for a Grid we usually want to keep positions unless explicitly reordering the array.
      // However, for "Find in Grid", we just dim the non-matches.
      // So here we just return the Set of indices that MATCH the criteria.)
      
      return new Set(mapped.map(m => m.originalIndex));

  }, [characters, searchTerm, filterMode]);


  return (
    <div className="flex h-full gap-4">
      
      {/* LEFT COLUMN: Properties */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        {selectedChar ? (
            <div className="flex flex-col gap-0 h-full">
                {/* Character Banner */}
                <div className="bg-zinc-900 p-1 mb-2 border border-zinc-700">
                    <div className="bg-black p-3 flex flex-col items-center border border-zinc-800">
                        <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase mb-1">Entry #{characters.indexOf(selectedChar) + 1}</span>
                        <h2 className="text-2xl font-black italic text-white truncate w-full text-center uppercase tracking-tighter" style={{fontFamily: 'Teko'}}>
                            {selectedChar.name}
                        </h2>
                    </div>
                </div>

                <StatHexagon char={selectedChar} />
                
                <div className="flex-1 overflow-y-auto mt-2 pr-1 custom-scrollbar space-y-3 bg-zinc-950/90 p-3 border border-zinc-800 relative">
                     <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-600"></div>
                     <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-600"></div>

                     {/* Main ID */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1"><Fingerprint className="h-3 w-3"/> Def Name / ID</label>
                        <input
                            type="text"
                            list="char-list"
                            value={selectedChar.name}
                            onChange={(e) => handleUpdateChar(selectedChar.id, { name: e.target.value })}
                            className="w-full bg-black border border-zinc-700 text-white px-2 py-1 text-sm font-bold focus:border-white outline-none"
                        />
                        <datalist id="char-list">
                            <option value="randomselect" />
                            <option value="blank" />
                            {availableFiles.map(f => <option key={f} value={f} />)}
                        </datalist>
                    </div>

                    {/* Stage & Music */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1"><MapPin className="h-3 w-3"/> Stage</label>
                            <div className="flex gap-1">
                                <input
                                    type="text"
                                    list="stage-list"
                                    value={selectedChar.stage || ''}
                                    onChange={(e) => handleUpdateChar(selectedChar.id, { stage: e.target.value })}
                                    className="w-full bg-black border border-zinc-700 text-white px-2 py-1 text-xs focus:border-white outline-none"
                                />
                                <button onClick={() => handleBrowseStage(selectedChar.id)} className="bg-zinc-800 px-1.5 text-zinc-300 border border-zinc-600 hover:bg-zinc-700"><FolderOpen className="h-3 w-3" /></button>
                            </div>
                            <datalist id="stage-list">
                                {availableStages.map(f => <option key={f} value={f} />)}
                            </datalist>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1"><Music className="h-3 w-3"/> BGM</label>
                             <input
                                type="text"
                                value={selectedChar.music || ''}
                                onChange={(e) => handleUpdateChar(selectedChar.id, { music: e.target.value })}
                                className="w-full bg-black border border-zinc-700 text-white px-2 py-1 text-xs focus:border-white outline-none"
                            />
                        </div>
                    </div>

                    {/* Stats Row 1: Order & AI */}
                    <div className="grid grid-cols-2 gap-2 p-2 bg-zinc-900/30 border border-zinc-800">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase flex items-center gap-1"><Hash className="h-3 w-3"/> Order</label>
                            <input
                                type="number"
                                value={selectedChar.order || 1}
                                onChange={(e) => handleUpdateChar(selectedChar.id, { order: parseInt(e.target.value) || 1 })}
                                className="w-full bg-black border border-zinc-700 text-white px-2 py-1 text-sm font-bold text-center"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase flex items-center gap-1"><Cpu className="h-3 w-3"/> AI Lvl</label>
                            <input
                                type="number"
                                min="0" max="8"
                                value={selectedChar.aiLevel || ''}
                                onChange={(e) => handleUpdateChar(selectedChar.id, { aiLevel: parseInt(e.target.value) || undefined })}
                                placeholder="Def"
                                className="w-full bg-black border border-zinc-700 text-white px-2 py-1 text-sm text-center"
                            />
                        </div>
                    </div>

                    {/* Stats Row 2: LocalCoord & Palettes */}
                     <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase flex items-center gap-1"><Monitor className="h-3 w-3"/> Res</label>
                            <input
                                type="number"
                                value={selectedChar.localcoord || ''}
                                onChange={(e) => handleUpdateChar(selectedChar.id, { localcoord: parseInt(e.target.value) || undefined })}
                                placeholder="e.g. 320"
                                className="w-full bg-black border border-zinc-700 text-white px-2 py-1 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase flex items-center gap-1"><Palette className="h-3 w-3"/> Pal</label>
                            <input
                                type="text"
                                value={selectedChar.palettes || ''}
                                onChange={(e) => handleUpdateChar(selectedChar.id, { palettes: e.target.value })}
                                placeholder="1,2,3"
                                className="w-full bg-black border border-zinc-700 text-white px-2 py-1 text-xs"
                            />
                        </div>
                    </div>

                     {/* Flags */}
                     <div className="flex gap-2 text-[10px] uppercase font-bold text-zinc-400">
                         <label className="flex items-center gap-2 cursor-pointer select-none bg-zinc-900 px-2 py-1 border border-zinc-800 hover:bg-zinc-800 flex-1 justify-center">
                            <input 
                                type="checkbox" 
                                checked={!!selectedChar.bonus}
                                onChange={(e) => handleUpdateChar(selectedChar.id, { bonus: e.target.checked ? 1 : undefined })}
                                className="accent-white"
                            />
                            Bonus
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer select-none bg-zinc-900 px-2 py-1 border border-zinc-800 hover:bg-zinc-800 flex-1 justify-center">
                            <input 
                                type="checkbox" 
                                checked={selectedChar.vsscreen === 0}
                                onChange={(e) => handleUpdateChar(selectedChar.id, { vsscreen: e.target.checked ? 0 : 1 })}
                                className="accent-white"
                            />
                            No VS
                         </label>
                     </div>

                     <UnlockBuilder 
                        value={selectedChar.unlock || ''}
                        onChange={(val) => handleUpdateChar(selectedChar.id, { unlock: val })}
                        availableChars={characters}
                    />
                     
                     <button
                        onClick={() => handleRemoveChar(selectedChar.id)}
                        className="w-full bg-black hover:bg-zinc-900 text-red-500 border border-red-900/50 py-2 text-xs font-bold uppercase tracking-wider mt-4"
                      >
                        REMOVE ENTRY
                      </button>
                </div>
            </div>
        ) : (
             <div className="h-full flex flex-col items-center justify-center text-zinc-700 border border-zinc-800 bg-black p-6 text-center">
                 <Zap className="h-16 w-16 mb-4 opacity-20" />
                 <p className="font-bold text-lg text-zinc-500 uppercase tracking-widest">Select a Fighter</p>
                 <p className="text-xs text-zinc-700">Configure parameters or select an empty slot to begin.</p>
             </div>
        )}
      </div>

      {/* RIGHT COLUMN: Grid */}
      <div className="flex-1 flex flex-col gap-2">
         {/* Top Control Bar */}
         <div className="flex flex-col bg-black border-b border-zinc-800 pb-2 px-2 gap-2">
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 border ${showFilters ? 'bg-zinc-900 border-white text-white' : 'border-zinc-800 text-zinc-500'}`}
                    >
                        <Filter className="h-3 w-3" /> Filters
                    </button>
                     <div className="flex items-center gap-2">
                         <span className="text-[10px] text-zinc-500 font-bold uppercase">Grid</span>
                         <input type="number" className="w-10 bg-black text-white text-center text-xs border border-zinc-800" value={gridSettings.rows} onChange={(e) => setGridSettings({...gridSettings, rows: Math.max(1, parseInt(e.target.value) || 1)})} />
                         <span className="text-zinc-600">x</span>
                         <input type="number" className="w-10 bg-black text-white text-center text-xs border border-zinc-800" value={gridSettings.cols} onChange={(e) => setGridSettings({...gridSettings, cols: Math.max(1, parseInt(e.target.value) || 1)})} />
                     </div>
                 </div>
                 
                 {/* Search */}
                 <div className="flex items-center gap-2">
                     <Search className="h-4 w-4 text-zinc-500" />
                     <input 
                        type="text" 
                        placeholder="FILTER BY NAME..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-black text-white text-xs px-2 py-1 w-48 border border-zinc-800 focus:border-white outline-none uppercase font-bold"
                     />
                     <button onClick={handleAddChar} className="bg-white hover:bg-zinc-200 text-black px-4 py-1 text-xs font-bold uppercase transform -skew-x-12 border border-zinc-400">
                         + ADD SLOT
                     </button>
                 </div>
             </div>

             {/* Expanded Filters */}
             {showFilters && (
                 <div className="bg-zinc-900/50 p-2 flex items-center gap-4 border-t border-zinc-800 animate-in slide-in-from-top-2">
                     <div className="flex items-center gap-2 text-xs">
                         <span className="text-zinc-500 font-bold uppercase">Show:</span>
                         <select value={filterMode} onChange={(e:any) => setFilterMode(e.target.value)} className="bg-black text-white border border-zinc-800 text-xs px-2 py-0.5">
                             <option value="all">Everything</option>
                             <option value="hidden">Hidden / Unlockable</option>
                             <option value="bonus">Bonus Stages</option>
                             <option value="missing_stage">Missing Stage Def</option>
                         </select>
                     </div>
                     <div className="flex items-center gap-2 text-xs">
                         <span className="text-zinc-500 font-bold uppercase">Sort:</span>
                          <button onClick={() => setSortBy('name')} className={`px-2 py-0.5 border ${sortBy === 'name' ? 'bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-500'}`}>Name</button>
                          <button onClick={() => setSortBy('order')} className={`px-2 py-0.5 border ${sortBy === 'order' ? 'bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-500'}`}>Order</button>
                          <button onClick={() => setSortBy('ai')} className={`px-2 py-0.5 border ${sortBy === 'ai' ? 'bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-500'}`}>AI</button>
                     </div>
                 </div>
             )}
         </div>

         {/* The Grid */}
         <div className="flex-1 overflow-auto bg-black p-4 border border-zinc-900 shadow-inner custom-scrollbar relative">
             <div 
                className="grid gap-2"
                style={{ 
                  gridTemplateColumns: `repeat(${gridSettings.cols}, minmax(0, 1fr))`
                }}
             >
                {characters.map((char, idx) => {
                  const isMatch = displayIndices.has(idx);
                  const isSelected = selectedId === char.id;

                  return (
                    <div
                        key={char.id}
                        onMouseEnter={() => playHover()}
                        onClick={() => { playSelect(); setSelectedId(char.id); }}
                        className={`
                            relative aspect-[4/3] cursor-pointer flex flex-col items-center justify-end
                            transition-all duration-75 overflow-hidden group
                            ${isSelected ? 'kof-selected z-10 scale-105' : 'kof-grid-slot hover:border-zinc-500'}
                            ${!isMatch ? 'opacity-10 grayscale brightness-50' : 'opacity-100'}
                        `}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                        
                        {char.portraitUrl ? (
                            <img src={char.portraitUrl} alt={char.name} className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                <User className="h-10 w-10 text-white" />
                            </div>
                        )}

                        <div className="relative z-10 w-full bg-black/80 text-center py-1 border-t border-zinc-800">
                            <span className={`text-[9px] font-bold uppercase leading-tight truncate px-1 block ${isSelected ? 'text-white' : 'text-zinc-400'}`} style={{fontFamily: 'Teko'}}>
                                {char.name}
                            </span>
                        </div>
                        
                        {char.order && (
                            <div className="absolute top-0 right-0 bg-zinc-900/80 text-zinc-300 text-[8px] font-bold px-1.5 py-0.5 border-l border-b border-zinc-800 font-mono">
                                {char.order}
                            </div>
                        )}
                        
                        <div className="absolute top-0 left-1 text-[12px] font-black text-white/10 select-none">
                            {idx + 1}
                        </div>

                         {char.bonus === 1 && (
                            <div className="absolute top-1 left-1 text-white"><Star className="h-3 w-3 fill-white" /></div>
                        )}
                        {char.unlock && (
                            <div className="absolute top-4 left-1 text-zinc-500"><Fingerprint className="h-3 w-3" /></div>
                        )}
                        {!char.stage && char.name !== 'randomselect' && char.name !== 'blank' && (
                            <div className="absolute bottom-6 right-1 text-white text-[8px] bg-black px-1 border border-white">
                                NO STAGE
                            </div>
                        )}
                    </div>
                )})}
             </div>
         </div>
      </div>
    </div>
  );
};
