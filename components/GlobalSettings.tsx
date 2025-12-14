
import React from 'react';
import { SelectOptions } from '../types';
import { Music, FolderOpen, Gamepad2, Timer, Skull } from 'lucide-react';
import { openAudioPicker } from '../services/fileSystem';

interface GlobalSettingsProps {
  options: SelectOptions;
  setOptions: (opt: SelectOptions) => void;
}

export const GlobalSettings: React.FC<GlobalSettingsProps> = ({ options, setOptions }) => {

  const handleUpdate = (key: string, val: string | number) => {
    setOptions({ ...options, [key]: val });
  };

  const handleBrowseMusic = async () => {
    const result = await openAudioPicker();
    if (result) {
        handleUpdate('musicVictory', `sound/${result.name}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-zinc-800 bg-black p-6 max-w-3xl mx-auto">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-zinc-500" />
            Global Options
        </h2>
        <p className="text-sm text-zinc-400 mt-1">Configure global match settings and default overrides.</p>
      </div>

      <div className="space-y-6">
        {/* Victory Music */}
        <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <Music className="h-4 w-4 text-zinc-500" /> Global Victory Music
            </label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={options.musicVictory || ''}
                    onChange={(e) => handleUpdate('musicVictory', e.target.value)}
                    placeholder="sound/victory.mp3"
                    className="flex-1 rounded bg-zinc-900 px-3 py-2 text-sm text-white border border-zinc-700 focus:border-white outline-none"
                />
                <button 
                    onClick={handleBrowseMusic}
                    className="flex items-center gap-2 rounded bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
                >
                    <FolderOpen className="h-4 w-4" /> Browse
                </button>
            </div>
            <p className="text-xs text-zinc-500">Music played on victory screen for all characters unless overridden.</p>
        </div>

        {/* Match Counts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 rounded bg-zinc-950/50 border border-zinc-800">
                <h3 className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" /> Arcade Mode
                </h3>
                <div className="space-y-1">
                    <label className="text-xs text-zinc-400">Max Matches (Comma separated orders)</label>
                    <input 
                        type="text"
                        value={String(options['arcade.maxmatches'] || '')}
                        onChange={(e) => handleUpdate('arcade.maxmatches', e.target.value)}
                        className="w-full rounded bg-zinc-900 px-2 py-1 text-sm text-white border border-zinc-700"
                    />
                </div>
            </div>

            <div className="space-y-3 p-4 rounded bg-zinc-950/50 border border-zinc-800">
                <h3 className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                    <Timer className="h-4 w-4" /> Team Mode
                </h3>
                <div className="space-y-1">
                    <label className="text-xs text-zinc-400">Max Matches</label>
                    <input 
                        type="text"
                        value={String(options['team.maxmatches'] || '')}
                        onChange={(e) => handleUpdate('team.maxmatches', e.target.value)}
                        className="w-full rounded bg-zinc-900 px-2 py-1 text-sm text-white border border-zinc-700"
                    />
                </div>
            </div>
            
             <div className="space-y-3 p-4 rounded bg-zinc-950/50 border border-zinc-800">
                <h3 className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                    <Skull className="h-4 w-4" /> Survival Mode
                </h3>
                <div className="space-y-1">
                    <label className="text-xs text-zinc-400">Max Matches (-1 for infinite)</label>
                    <input 
                        type="text"
                        value={String(options['survival.maxmatches'] || '')}
                        onChange={(e) => handleUpdate('survival.maxmatches', e.target.value)}
                        className="w-full rounded bg-zinc-900 px-2 py-1 text-sm text-white border border-zinc-700"
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const SettingsIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
