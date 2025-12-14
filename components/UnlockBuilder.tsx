
import React, { useState, useEffect } from 'react';
import { Lock, Code, ShieldAlert } from 'lucide-react';
import { CharacterDef } from '../types';

interface UnlockBuilderProps {
  value: string;
  onChange: (val: string) => void;
  availableChars: CharacterDef[];
}

type ConditionType = 'custom' | 'clearcount' | 'score' | 'playtime' | 'wincount' | 'losecount' | 'overall_clear' | 'mode_clear_ai';

const MODES = [
  { id: 'arcade', label: 'Arcade Battle' },
  { id: 'teamcoop', label: 'Team Co-op' },
  { id: 'netplayteamcoop', label: 'Netplay Team' },
  { id: 'survival', label: 'Survival Challenge' },
  { id: 'bossrush', label: 'Boss Rush' },
];

export const UnlockBuilder: React.FC<UnlockBuilderProps> = ({ value, onChange, availableChars }) => {
  const [type, setType] = useState<ConditionType>('custom');
  
  // Params
  const [targetChar, setTargetChar] = useState('');
  const [numericVal, setNumericVal] = useState(1);
  const [selectedMode, setSelectedMode] = useState('arcade');
  
  useEffect(() => {
    if (!value) {
        // no op
    } else if (value.includes('clearcount')) {
        setType('clearcount');
        const match = value.match(/\["(.+?)"\]/);
        if (match) setTargetChar(match[1]);
    } else if (value.includes('ranking') && value.includes('.score')) {
        setType('score');
    } else if (value.includes('playtime')) {
        setType('playtime');
    } else if (value.includes('.win')) {
        setType('wincount');
    } else if (value.includes('.lose')) {
        setType('losecount');
    } else if (value.includes('.clear') && !value.includes('clearcount') && !value.includes('ailevel')) {
        setType('overall_clear');
    }
  }, []);

  const generateLua = (currentType: ConditionType) => {
    // Helper variables for cleaner strings and robustness
    // We chain 'and' to ensure every parent table exists before accessing a child.
    const s = 'stats';
    const m = 'stats.modes';
    const sm = `stats.modes.${selectedMode}`;

    // Wraps the expression in parens and appends " or false" to ensure strict boolean return
    const boolWrap = (expr: string) => `(${expr}) or false`;

    switch (currentType) {
      case 'clearcount':
        // stats and stats.modes and stats.modes.arcade and stats.modes.arcade.clearcount and stats.modes.arcade.clearcount["Char"] >= X
        return boolWrap(`${s} and ${m} and ${sm} and ${sm}.clearcount and ${sm}.clearcount["${targetChar}"] and ${sm}.clearcount["${targetChar}"] >= ${numericVal}`);
      
      case 'score':
        // stats and stats.modes and stats.modes.arcade and stats.modes.arcade.ranking and stats.modes.arcade.ranking[1] and stats.modes.arcade.ranking[1].score >= X
        return boolWrap(`${s} and ${m} and ${sm} and ${sm}.ranking and ${sm}.ranking[1] and ${sm}.ranking[1].score and ${sm}.ranking[1].score >= ${numericVal}`);
      
      case 'playtime':
        // stats and stats.playtime and stats.playtime >= X
        return boolWrap(`${s} and ${s}.playtime and ${s}.playtime >= ${numericVal}`);
      
      case 'wincount':
        return boolWrap(`${s} and ${m} and ${sm} and ${sm}.win and ${sm}.win >= ${numericVal}`);
      
      case 'losecount':
        return boolWrap(`${s} and ${m} and ${sm} and ${sm}.lose and ${sm}.lose >= ${numericVal}`);
      
      case 'overall_clear':
        // stats and stats.modes and stats.modes.arcade and stats.modes.arcade.clear >= 1
        return boolWrap(`${s} and ${m} and ${sm} and ${sm}.clear and ${sm}.clear >= ${numericVal}`);
      
      case 'mode_clear_ai':
        // Clear >= 1 AND AI Level check
        // Check clear existence first
        const clearCheck = `${sm}.clear and ${sm}.clear >= 1`;
        // Check ranking/ai existence
        const aiCheck = `${sm}.ranking and ${sm}.ranking[1] and ${sm}.ranking[1].ailevel and ${sm}.ranking[1].ailevel >= ${Math.min(8, Math.max(1, numericVal))}`;
        
        return boolWrap(`${s} and ${m} and ${sm} and ${clearCheck} and ${aiCheck}`);
      
      default:
        return value;
    }
  };

  useEffect(() => {
     if (type !== 'custom') {
        const newVal = generateLua(type);
        if (newVal !== value) onChange(newVal);
     }
  }, [type, targetChar, numericVal, selectedMode]);

  return (
    <div className="space-y-3 rounded border border-zinc-800 bg-zinc-900 p-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-300">
            <Lock className="h-3 w-3" />
            Secret Condition
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">LUA SCRIPT</div>
      </div>
      
      <select 
        value={type}
        onChange={(e) => setType(e.target.value as ConditionType)}
        className="w-full rounded bg-black border border-zinc-700 px-2 py-1.5 text-xs text-white outline-none focus:border-white font-mono"
      >
        <option value="custom">Custom Lua Script</option>
        <option value="clearcount">Character Clear Count</option>
        <option value="score">High Score Requirement</option>
        <option value="playtime">Total Playtime (Sec)</option>
        <option value="wincount">Total Wins</option>
        <option value="overall_clear">Mode Cleared Count</option>
      </select>

      {type !== 'custom' && (
        <div className="space-y-2 animate-in fade-in duration-300 bg-zinc-800/50 p-2 rounded border border-zinc-700/50">
          
          {(type === 'score' || type === 'wincount' || type === 'losecount' || type === 'overall_clear' || type === 'mode_clear_ai') && (
             <div className="space-y-1">
               <label className="text-[9px] uppercase font-bold text-zinc-400">Target Mode</label>
               <select 
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  className="w-full rounded bg-black border border-zinc-700 px-2 py-1 text-xs text-white"
               >
                 {MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
               </select>
             </div>
          )}

          {type === 'clearcount' && (
             <div className="space-y-1">
               <label className="text-[9px] uppercase font-bold text-zinc-400">Required Character</label>
               <select 
                  value={targetChar}
                  onChange={(e) => setTargetChar(e.target.value)}
                  className="w-full rounded bg-black border border-zinc-700 px-2 py-1 text-xs text-white"
               >
                 <option value="">-- ANY --</option>
                 {availableChars.filter(c => c.name !== 'randomselect' && c.name !== 'blank').map(c => (
                   <option key={c.id} value={c.name}>{c.name}</option>
                 ))}
               </select>
             </div>
          )}

          <div className="space-y-1">
             <label className="text-[9px] uppercase font-bold text-zinc-400">
                {type === 'playtime' ? 'Time (Seconds)' : 'Threshold Value'}
             </label>
             <input 
               type="number"
               value={numericVal}
               onChange={(e) => setNumericVal(parseInt(e.target.value) || 0)}
               className="w-full rounded bg-black border border-zinc-700 px-2 py-1 text-xs text-white font-mono"
             />
          </div>
        </div>
      )}

      <div className="space-y-1 pt-2">
        <label className="flex items-center gap-1 text-[9px] uppercase font-bold text-zinc-500">
          <Code className="h-3 w-3" /> Script Preview
        </label>
        <textarea
          value={value || ''}
          readOnly={type !== 'custom'}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded bg-black p-2 font-mono text-[10px] text-zinc-300 outline-none border border-zinc-800 ${type === 'custom' ? 'focus:border-white' : 'opacity-70'}`}
          rows={3}
          placeholder="(stats and stats.modes.arcade.clear >= 1) or false"
        />
      </div>
    </div>
  );
};
