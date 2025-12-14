
import React, { useState, useEffect } from 'react';
import { Layers, Check, RefreshCw, AlertTriangle, Monitor, Download } from 'lucide-react';
import { scanMotifsLoader, readIkemenConfig, writeIkemenConfig } from '../services/fileSystem';
import { IkemenConfig } from '../types';
import { playSelect, playSuccess, playHover } from '../services/audio';

interface MotifManagerProps {
    dataDirHandle: any;
    onRequestDir: () => Promise<any>;
    rootDirHandle: any; // For config.json in save/
}

export const MotifManager: React.FC<MotifManagerProps> = ({ dataDirHandle, onRequestDir, rootDirHandle }) => {
    const [motifs, setMotifs] = useState<string[]>([]);
    const [currentMotif, setCurrentMotif] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    const scan = async () => {
        setLoading(true);
        setError('');
        try {
            let handle = dataDirHandle;
            if (!handle) {
                handle = await onRequestDir();
            }
            if (handle) {
                const found = await scanMotifsLoader(handle);
                setMotifs(found);
            }
            
            // Read config
            if (rootDirHandle) {
                const config = await readIkemenConfig(rootDirHandle);
                if (config && config.motif) {
                    setCurrentMotif(config.motif);
                }
            }

        } catch (e: any) {
            setError(e.message || "Failed to scan.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dataDirHandle && rootDirHandle) scan();
    }, [dataDirHandle, rootDirHandle]);

    const handleActivate = async (motifPath: string) => {
        playSelect();
        
        // If we have access to the file system, try to update config.json directly
        if (rootDirHandle) {
            try {
                const currentConfig = await readIkemenConfig(rootDirHandle) || {} as IkemenConfig;
                currentConfig.motif = motifPath;
                await writeIkemenConfig(rootDirHandle, currentConfig);
                setCurrentMotif(motifPath);
                playSuccess();
                return;
            } catch (e) {
                console.error(e);
                // Fallthrough to download if write fails
            }
        }

        // Fallback: Download config.json
        if (confirm("No Root Folder linked (or write failed).\nDownload a new config.json with this motif activated?")) {
            const config = { 
                motif: motifPath,
                "Debug": 0,
                "Difficulty": 4,
                "Life": 100,
                "Time": 99,
                "GameSpeed": 100,
                "Team.1VS2Life": 120,
                "Team.LoseOnKO": 0,
                "Motif": motifPath 
            };
            const blob = new Blob([JSON.stringify(config, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'config.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            playSuccess();
        }
    };

    return (
        <div className="h-full flex flex-col gap-4 p-6 bg-black text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                    <h2 className="text-2xl font-black italic uppercase text-white flex items-center gap-3">
                        <Layers className="h-6 w-6 text-zinc-500" />
                        Motif Manager
                    </h2>
                    <p className="text-sm text-zinc-500 font-mono mt-1">Select Active Screenpack (updates save/config.json)</p>
                </div>
                <button 
                    onClick={scan}
                    onMouseEnter={playHover}
                    className="flex items-center gap-2 bg-zinc-900 text-zinc-300 px-4 py-2 border border-zinc-700 hover:bg-zinc-800 hover:text-white transition-all uppercase font-bold text-xs"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Rescan Data
                </button>
            </div>

            {!dataDirHandle && (
                 <div className="bg-zinc-900 border border-zinc-700 p-4 text-zinc-300 flex items-center gap-3 justify-between">
                     <div className="flex items-center gap-3">
                         <AlertTriangle className="h-5 w-5" />
                         <span>Please select your IKEMEN root 'data' folder to scan for motifs.</span>
                     </div>
                     <button onClick={scan} className="underline font-bold text-white">SELECT FOLDER</button>
                 </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                {/* Fallback Manual Entry if no scan results */}
                {(!motifs.length || !dataDirHandle) && (
                    <div className="col-span-1 bg-zinc-900 border border-zinc-800 p-4 flex flex-col gap-2">
                        <h4 className="font-bold text-white uppercase">Manual Configuration</h4>
                        <p className="text-xs text-zinc-400">If you can't scan, enter the path manually to generate a config file.</p>
                        <input 
                            type="text" 
                            placeholder="data/system.def" 
                            className="bg-black border border-zinc-700 p-1 text-xs text-white"
                            id="manualMotifInput"
                        />
                        <button 
                            onClick={() => {
                                const val = (document.getElementById('manualMotifInput') as HTMLInputElement).value;
                                if(val) handleActivate(val);
                            }}
                            className="bg-zinc-700 text-white text-xs font-bold py-1 uppercase hover:bg-zinc-600"
                        >
                            Generate Config
                        </button>
                    </div>
                )}

                {motifs.map(motif => {
                    const isActive = currentMotif === motif || currentMotif.replace(/\\/g, '/') === motif;
                    const name = motif.split('/')[1] === 'system.def' ? 'Default' : motif.split('/')[1];

                    return (
                        <div key={motif} className={`
                            relative border p-4 transition-all group
                            ${isActive 
                                ? 'bg-zinc-900 border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                : 'bg-black border-zinc-800 hover:border-zinc-500'}
                        `}>
                            <div className="flex justify-between items-start mb-2">
                                <Monitor className={`h-8 w-8 ${isActive ? 'text-white' : 'text-zinc-700'}`} />
                                {isActive && (
                                    <div className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                        Active
                                    </div>
                                )}
                            </div>
                            
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">{name}</h3>
                            <code className="text-[10px] text-zinc-500 block mt-1 mb-4 bg-zinc-950 p-1 rounded">
                                {motif}
                            </code>

                            <button 
                                onClick={() => handleActivate(motif)}
                                disabled={isActive && !!rootDirHandle}
                                onMouseEnter={playHover}
                                className={`
                                    w-full py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2
                                    ${isActive 
                                        ? 'bg-zinc-800 text-zinc-400 cursor-default' 
                                        : 'bg-zinc-900 hover:bg-zinc-700 text-white'}
                                `}
                            >
                                {isActive ? (rootDirHandle ? 'SYSTEM READY' : 'DOWNLOAD CONFIG') : (rootDirHandle ? 'LOAD MOTIF' : 'DOWNLOAD CONFIG')}
                                {!rootDirHandle && <Download className="h-3 w-3" />}
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};
