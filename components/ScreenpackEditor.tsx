
import React, { useState, useRef } from 'react';
import { ScreenpackConfig } from '../types';
import { Grid3X3, Image as ImageIcon, AlertTriangle, CheckCircle, Maximize, Layers, MousePointer2 } from 'lucide-react';

interface ScreenpackEditorProps {
    config: ScreenpackConfig;
    setConfig: (config: ScreenpackConfig) => void;
}

export const ScreenpackEditor: React.FC<ScreenpackEditorProps> = ({ config, setConfig }) => {
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    
    // Visual settings
    const [opacity, setOpacity] = useState(0.5);
    const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });
    const [showOnTop, setShowOnTop] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [dragging, setDragging] = useState<'grid' | 'bg' | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initPos, setInitPos] = useState({ x: 0, y: 0 });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setBgImage(url);
        }
    };

    // Calculate grid dimensions
    const gridWidth = (config.columns * config.cellSize[0]) + ((config.columns - 1) * config.cellSpacing[0]);
    const gridHeight = (config.rows * config.cellSize[1]) + ((config.rows - 1) * config.cellSpacing[1]);
    
    // Drag Logic
    const handleMouseDown = (e: React.MouseEvent, type: 'grid' | 'bg') => {
        e.stopPropagation();
        setDragging(type);
        setDragStart({ x: e.clientX, y: e.clientY });
        if (type === 'grid') {
            setInitPos({ x: config.pos[0], y: config.pos[1] });
        } else {
            setInitPos({ x: bgOffset.x, y: bgOffset.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging) return;
        const dx = (e.clientX - dragStart.x) / scale; // Adjust delta by zoom scale
        const dy = (e.clientY - dragStart.y) / scale;
        
        if (dragging === 'grid') {
            setConfig({
                ...config,
                pos: [Math.round(initPos.x + dx), Math.round(initPos.y + dy)]
            });
        } else {
            setBgOffset({ x: Math.round(initPos.x + dx), y: Math.round(initPos.y + dy) });
        }
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    // Validation
    const errors = [];
    if (config.rows < 1) errors.push("Rows must be >= 1");
    if (config.columns < 1) errors.push("Columns must be >= 1");
    if (config.cellSize[0] <= 0 || config.cellSize[1] <= 0) errors.push("Cell Size must be positive");

    // Helpers to identify cursor cells
    const getCellIndex = (r: number, c: number) => (r * config.columns) + c;
    const p1Index = getCellIndex(config.p1CursorStartCell[0], config.p1CursorStartCell[1]);
    const p2Index = getCellIndex(config.p2CursorStartCell[0], config.p2CursorStartCell[1]);

    return (
        <div className="flex h-full gap-4">
            {/* Controls */}
            <div className="w-80 flex-shrink-0 flex flex-col gap-4 rounded-lg border border-zinc-800 bg-black p-4 overflow-y-auto custom-scrollbar">
                 <h3 className="flex items-center gap-2 border-b border-zinc-800 pb-3 font-semibold text-zinc-200">
                    <Grid3X3 className="h-4 w-4 text-zinc-400" />
                    Screenpack Layout
                </h3>
                
                <div className="space-y-6">
                    {/* Background / SFF Mock */}
                    <div className="rounded bg-zinc-950 p-3 border border-zinc-800 space-y-3">
                        <label className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-2">
                            <ImageIcon className="h-3 w-3" /> SFF / Background Layer
                        </label>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-zinc-800 file:text-white" />
                        
                        {bgImage && (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-zinc-500">Opacity: {Math.round(opacity * 100)}%</label>
                                    <input type="range" min="0" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        onClick={() => setShowOnTop(!showOnTop)}
                                        className={`w-full flex items-center justify-center gap-1 py-1 px-2 rounded text-[10px] font-bold border ${showOnTop ? 'bg-zinc-800 border-zinc-500 text-white' : 'bg-black border-zinc-700 text-zinc-500'}`}
                                    >
                                        <Layers className="h-3 w-3" /> {showOnTop ? 'Front' : 'Back'}
                                    </button>
                                </div>
                            </div>
                        )}
                        <p className="text-[10px] text-zinc-600">Tip: Upload a screenshot of your game to align the grid perfectly. Drag image to adjust offset.</p>
                    </div>

                    {/* Dimensions */}
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase text-zinc-500">Grid Dimensions</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400">Rows</label>
                                <input type="number" value={config.rows} onChange={(e) => setConfig({...config, rows: parseInt(e.target.value) || 1})} className="w-full rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-white" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400">Columns</label>
                                <input type="number" value={config.columns} onChange={(e) => setConfig({...config, columns: parseInt(e.target.value) || 1})} className="w-full rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-white" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Cell Config */}
                     <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase text-zinc-500">Cell Configuration</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400">Size (W x H)</label>
                                <div className="flex gap-1">
                                    <input type="number" value={config.cellSize[0]} onChange={(e) => setConfig({...config, cellSize: [parseInt(e.target.value) || 1, config.cellSize[1]]})} className="w-full rounded bg-zinc-900 border border-zinc-700 px-1 py-1 text-white text-center" />
                                    <input type="number" value={config.cellSize[1]} onChange={(e) => setConfig({...config, cellSize: [config.cellSize[0], parseInt(e.target.value) || 1]})} className="w-full rounded bg-zinc-900 border border-zinc-700 px-1 py-1 text-white text-center" />
                                </div>
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400">Spacing (X , Y)</label>
                                <div className="flex gap-1">
                                    <input type="number" value={config.cellSpacing[0]} onChange={(e) => setConfig({...config, cellSpacing: [parseInt(e.target.value) || 0, config.cellSpacing[1]]})} className="w-full rounded bg-zinc-900 border border-zinc-700 px-1 py-1 text-white text-center" />
                                    <input type="number" value={config.cellSpacing[1]} onChange={(e) => setConfig({...config, cellSpacing: [config.cellSpacing[0], parseInt(e.target.value) || 0]})} className="w-full rounded bg-zinc-900 border border-zinc-700 px-1 py-1 text-white text-center" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                     {/* Position Manual */}
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase text-zinc-500">Origin Position</h4>
                        <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400">Pos X</label>
                                <input type="number" value={config.pos[0]} onChange={(e) => setConfig({...config, pos: [parseInt(e.target.value) || 0, config.pos[1]]})} className="w-full rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-white" />
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400">Pos Y</label>
                                <input type="number" value={config.pos[1]} onChange={(e) => setConfig({...config, pos: [config.pos[0], parseInt(e.target.value) || 0]})} className="w-full rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Cursors */}
                    <div className="rounded bg-zinc-900/50 border border-zinc-800 p-3">
                         <h4 className="text-[10px] font-bold uppercase text-zinc-400 mb-2 flex items-center gap-1">
                             <MousePointer2 className="h-3 w-3" /> Start Cursors
                         </h4>
                         <div className="space-y-2">
                             <div className="flex items-center justify-between text-xs">
                                 <span className="text-zinc-300 font-bold">P1 Start (Row, Col)</span>
                                 <div className="flex gap-1 w-20">
                                     <input type="number" value={config.p1CursorStartCell[0]} onChange={(e) => setConfig({...config, p1CursorStartCell: [parseInt(e.target.value)||0, config.p1CursorStartCell[1]]})} className="w-full bg-zinc-950 border border-zinc-700 text-center rounded text-white" />
                                     <input type="number" value={config.p1CursorStartCell[1]} onChange={(e) => setConfig({...config, p1CursorStartCell: [config.p1CursorStartCell[0], parseInt(e.target.value)||0]})} className="w-full bg-zinc-950 border border-zinc-700 text-center rounded text-white" />
                                 </div>
                             </div>
                             <div className="flex items-center justify-between text-xs">
                                 <span className="text-zinc-500 font-bold">P2 Start (Row, Col)</span>
                                 <div className="flex gap-1 w-20">
                                     <input type="number" value={config.p2CursorStartCell[0]} onChange={(e) => setConfig({...config, p2CursorStartCell: [parseInt(e.target.value)||0, config.p2CursorStartCell[1]]})} className="w-full bg-zinc-950 border border-zinc-700 text-center rounded text-white" />
                                     <input type="number" value={config.p2CursorStartCell[1]} onChange={(e) => setConfig({...config, p2CursorStartCell: [config.p2CursorStartCell[0], parseInt(e.target.value)||0]})} className="w-full bg-zinc-950 border border-zinc-700 text-center rounded text-white" />
                                 </div>
                             </div>
                         </div>
                    </div>
                    
                    {/* Validation */}
                    {errors.length > 0 ? (
                        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded text-xs text-zinc-300">
                            <div className="flex items-center gap-2 mb-1 font-bold"><AlertTriangle className="h-3 w-3" /> Errors</div>
                            <ul className="list-disc pl-4">{errors.map((e,i) => <li key={i}>{e}</li>)}</ul>
                        </div>
                    ) : (
                         <div className="bg-zinc-900 border border-zinc-800 p-2 rounded text-xs text-zinc-400 flex items-center gap-2">
                             <CheckCircle className="h-3 w-3" /> Valid Configuration
                         </div>
                    )}
                </div>
            </div>

            {/* Visualizer */}
            <div className="flex-1 bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden relative flex flex-col shadow-inner">
                <div className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur p-1 rounded flex items-center gap-3 text-xs text-white border border-white/10">
                    <Maximize className="h-3 w-3 text-zinc-400" />
                    <span className="font-mono">{(scale * 100).toFixed(0)}%</span>
                    <input type="range" min="0.5" max="3" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-20 accent-white h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                
                <div 
                    ref={containerRef}
                    className="flex-1 overflow-auto relative cursor-grab active:cursor-grabbing bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-repeat"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div 
                        className="relative origin-top-left transition-transform duration-75"
                        style={{ 
                            width: 1280, 
                            height: 720, 
                            transform: `scale(${scale})`,
                            backgroundColor: '#000'
                        }}
                    >
                        {/* Reference Image Layer */}
                        {bgImage && (
                            <div 
                                className="absolute cursor-move group border border-transparent hover:border-zinc-400/50"
                                onMouseDown={(e) => handleMouseDown(e, 'bg')}
                                style={{
                                    left: bgOffset.x,
                                    top: bgOffset.y,
                                    zIndex: showOnTop ? 20 : 0,
                                    opacity: opacity
                                }}
                            >
                                <img src={bgImage} alt="Reference" className="pointer-events-none max-w-none" />
                                <div className="absolute top-0 left-0 bg-white text-black text-[8px] px-1 opacity-0 group-hover:opacity-100 pointer-events-none">IMG</div>
                            </div>
                        )}
                        
                        {/* The Grid Container */}
                        <div 
                            className="absolute border-2 border-zinc-500/50 bg-white/5 hover:bg-white/10 hover:border-white transition-colors z-10"
                            onMouseDown={(e) => handleMouseDown(e, 'grid')}
                            style={{
                                left: config.pos[0],
                                top: config.pos[1],
                                width: gridWidth,
                                height: gridHeight,
                                display: 'grid',
                                gridTemplateColumns: `repeat(${config.columns}, ${config.cellSize[0]}px)`,
                                gridTemplateRows: `repeat(${config.rows}, ${config.cellSize[1]}px)`,
                                gap: `${config.cellSpacing[1]}px ${config.cellSpacing[0]}px`,
                                cursor: dragging === 'grid' ? 'grabbing' : 'move'
                            }}
                        >
                            {Array.from({ length: config.rows * config.columns }).map((_, i) => {
                                const isP1 = i === p1Index;
                                const isP2 = i === p2Index;
                                return (
                                <div 
                                    key={i} 
                                    className={`
                                        border flex items-center justify-center text-[8px] select-none relative
                                        ${isP1 ? 'border-white bg-white/20 text-white' : 
                                          isP2 ? 'border-zinc-500 bg-zinc-500/20 text-zinc-300' : 
                                          'border-white/10 text-white/30'}
                                    `}
                                >
                                    {i + 1}
                                    {isP1 && <span className="absolute top-0 right-0.5 text-[6px] font-bold">P1</span>}
                                    {isP2 && <span className="absolute bottom-0 right-0.5 text-[6px] font-bold">P2</span>}
                                </div>
                            )})}
                            
                            {/* Drag Handle Indicator */}
                            <div className="absolute -top-6 -left-0.5 text-[10px] text-zinc-300 font-mono font-bold bg-black/80 px-2 py-0.5 rounded pointer-events-none border border-zinc-700">
                                Grid: {config.pos[0]}, {config.pos[1]}
                            </div>
                        </div>
                        
                        {/* Screen Borders Reference (720p) */}
                        <div className="absolute inset-0 border border-zinc-800 pointer-events-none w-[1280px] h-[720px] z-30">
                            <span className="absolute top-0 right-0 p-1 text-[10px] text-zinc-700 font-mono">1280x720 Viewport</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
