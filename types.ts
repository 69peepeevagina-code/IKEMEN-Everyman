
export interface CharacterDef {
  id: string;
  name: string;
  stage?: string;
  music?: string;
  order?: number;
  includeStage?: number; // 0 or 1
  exclude?: number; // 0 or 1
  paramStr?: string; // Stores raw extra params if parsing fails
  bonus?: number; // 0 or 1
  unlock?: string; // Lua condition string
  
  // New Stats
  aiLevel?: number; // ai=X
  localcoord?: number; // localcoord=X or localcoord=X,Y (store as string or number)
  palettes?: string; // pal=1,2,3...
  vsscreen?: number; // vsscreen=0 or 1
  
  portraitUrl?: string; // Blob URL for 9000,1
}

export interface SelectOptions {
  arcadeStartBattles: number;
  arcadeMaxBattles: number;
  teamStartBattles: number;
  teamMaxBattles: number;
  survivalMaxBattles: number;
  musicVictory?: string;
  [key: string]: number | string | undefined; // Allow other loose options
}

export interface ScreenpackConfig {
  rows: number;
  columns: number;
  pos: [number, number]; // x, y
  cellSize: [number, number]; // w, h
  cellSpacing: [number, number]; // x, y
  wrapping: number; // 0 or 1
  showEmptyCursor: number; // 0 or 1
  p1CursorStartCell: [number, number]; // row, col
  p2CursorStartCell: [number, number]; // row, col
  portraitScale: [number, number];
}

export interface SelectDefData {
  characters: CharacterDef[];
  extraStages: string[];
  options: SelectOptions;
  rawContent?: string;
}

export interface SystemDefData {
    selectInfo: ScreenpackConfig;
    rawContent?: string; // To preserve other parts of system.def
}

export interface GridSettings {
  rows: number;
  cols: number;
}

export interface IkemenConfig {
    motif: string; // "data/system.def"
    // We can add more config.json fields here if needed
}

export type AssetType = 'character' | 'stage' | 'screenpack';
