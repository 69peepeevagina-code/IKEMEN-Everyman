
import React, { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, X } from 'lucide-react';
import { generateRoster } from '../services/gemini';
import { CharacterDef } from '../types';
import { generateId } from '../services/parser';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (newChars: CharacterDef[]) => void;
}

export const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, onApply }) => {
  const [theme, setTheme] = useState('');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!theme) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateRoster(theme, count);
      const newChars: CharacterDef[] = result.map(item => ({
        id: generateId(),
        name: item.name,
        stage: item.stage,
        order: 1
      }));
      onApply(newChars);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to generate roster.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-700 p-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <Sparkles className="h-5 w-5 text-zinc-400" />
            AI Roster Generator
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-zinc-400">
            Describe a theme (e.g., "90s Arcade Fighters", "Marvel vs Capcom Style", "Horror Movie Villains") and we'll generate a placeholder roster for you.
          </p>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-zinc-500">Theme Prompt</label>
            <input 
              type="text" 
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-black px-4 py-2 text-white focus:border-white focus:outline-none"
              placeholder="e.g. Cyberpunk Martial Artists"
            />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-semibold uppercase text-zinc-500">Character Count</label>
             <input 
                type="number" 
                min="1" max="50"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full rounded-md border border-zinc-700 bg-black px-4 py-2 text-white focus:border-white focus:outline-none"
             />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded bg-red-950/50 p-3 text-sm text-red-300 border border-red-900">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {!process.env.API_KEY && (
             <div className="flex items-center gap-2 rounded bg-zinc-800 p-3 text-sm text-zinc-300 border border-zinc-600">
               <AlertTriangle className="h-4 w-4" />
               API Key not configured in env.
             </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-800 p-4 bg-zinc-900">
          <button 
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-medium text-zinc-500 hover:text-white"
          >
            Cancel
          </button>
          <button 
            onClick={handleGenerate}
            disabled={loading || !theme}
            className="flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-bold text-black shadow-lg hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};
