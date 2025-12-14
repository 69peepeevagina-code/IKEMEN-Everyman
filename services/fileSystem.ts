
import JSZip from 'jszip';
import { AssetType, IkemenConfig } from '../types';
import { parseSffV1 } from './sffParser';

export type DirectoryInput = any; // Union of FileSystemDirectoryHandle | FileList

const isIgnoredDef = (filename: string) => {
  const lower = filename.toLowerCase();
  return ['intro.def', 'ending.def', 'fight.def', 'common1.cns'].includes(lower);
};

// Helper for user-friendly error messages
const handleFSError = (e: any, context: string): never => {
    console.error(`FileSystem Error [${context}]:`, e);
    if (e.name === 'NotAllowedError') {
        throw new Error(`Permission denied: Unable to access ${context}. Please grant permission when prompted.`);
    }
    if (e.name === 'NotFoundError') {
        throw new Error(`Item not found: ${context}. It may have been moved or deleted.`);
    }
    if (e.name === 'AbortError') {
        throw new Error('Operation cancelled by user.');
    }
    throw new Error(`Error accessing ${context}: ${e.message || 'Unknown error'}`);
};

// --- Fallback Helpers ---

const openFilePickerFallback = (acceptTypes: Record<string, string[]>): Promise<{content: string, name: string, file: File} | null> => {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        // Construct accept string e.g. .def,.mp3
        const accept = Object.values(acceptTypes).flat().join(',');
        input.accept = accept;
        input.style.display = 'none';
        document.body.appendChild(input);
        
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
                const isAudio = file.type.startsWith('audio/') || accept.includes('.mp3');
                let content = '';
                if (!isAudio) {
                    content = await file.text();
                }
                document.body.removeChild(input);
                resolve({ content, name: file.name, file });
            } else {
                document.body.removeChild(input);
                resolve(null);
            }
        };
        input.oncancel = () => {
            document.body.removeChild(input);
            resolve(null);
        };
        input.click();
    });
}

const openDirectoryPickerFallback = (): Promise<FileList | null> => {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true; 
        // @ts-ignore
        input.directory = true; 
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = (e: any) => {
            if (e.target.files && e.target.files.length > 0) {
                document.body.removeChild(input);
                resolve(e.target.files);
            } else {
                document.body.removeChild(input);
                resolve(null);
            }
        };
        input.oncancel = () => {
             document.body.removeChild(input);
             resolve(null);
        };
        input.click();
    });
}

// --- Scanners ---

export const scanCharactersLoader = async (input: DirectoryInput): Promise<string[]> => {
  if (!input) throw new Error("No directory selected for scanning characters.");
  
  const results: string[] = [];

  try {
    // Handle FileSystemDirectoryHandle (Native API)
    if (input && typeof input.values === 'function') {
        const dirHandle = input as FileSystemDirectoryHandle;
        for await (const entry of (dirHandle as any).values()) {
            if (entry.kind === 'file') {
                if (entry.name.endsWith('.def') && !isIgnoredDef(entry.name) && entry.name !== 'select.def' && entry.name !== 'system.def') {
                    results.push(entry.name);
                }
            } else if (entry.kind === 'directory') {
                try {
                    const subDirHandle = await dirHandle.getDirectoryHandle(entry.name);
                    // Check for {dirname}.def
                    let found = false;
                    try {
                        await subDirHandle.getFileHandle(`${entry.name}.def`);
                        results.push(`${entry.name}/${entry.name}.def`);
                        found = true;
                    } catch {
                        // ignore
                    }

                    if (!found) {
                         // Check for any .def
                         for await (const subEntry of (subDirHandle as any).values()) {
                            if (subEntry.kind === 'file' && subEntry.name.endsWith('.def') && !isIgnoredDef(subEntry.name) && subEntry.name !== 'select.def' && subEntry.name !== 'system.def') {
                                results.push(`${entry.name}/${subEntry.name}`);
                            }
                        }
                    }
                } catch (e) {
                    console.warn("Skipping unreadable character directory:", entry.name);
                }
            }
        }
        return results.sort();
    }
    
    // Handle FileList (Fallback)
    if (input instanceof FileList || (input && input.length !== undefined)) {
         const files = input as FileList;
         const foundPaths = new Set<string>();
         
         for (let i = 0; i < files.length; i++) {
             const file = files[i];
             const path = file.webkitRelativePath || file.name;
             const parts = path.split('/');
             
             if (file.name.endsWith('.def') && !isIgnoredDef(file.name) && file.name !== 'select.def' && file.name !== 'system.def') {
                 if (parts.length >= 2) {
                     const relPath = parts.slice(1).join('/');
                     foundPaths.add(relPath);
                 } else {
                     foundPaths.add(file.name);
                 }
             }
         }
         return Array.from(foundPaths).sort();
    }

  } catch (e: any) {
      handleFSError(e, 'Characters Directory');
  }

  return [];
};

export const scanStagesLoader = async (input: DirectoryInput): Promise<string[]> => {
  if (!input) throw new Error("No directory selected for scanning stages.");
  const results: string[] = [];

  try {
    if (input && typeof input.values === 'function') {
        const dirHandle = input as FileSystemDirectoryHandle;
        for await (const entry of (dirHandle as any).values()) {
            if (entry.kind === 'file') {
                if (entry.name.endsWith('.def')) {
                    results.push(`stages/${entry.name}`);
                }
            } else if (entry.kind === 'directory') {
                const subDirHandle = await dirHandle.getDirectoryHandle(entry.name);
                for await (const subEntry of (subDirHandle as any).values()) {
                    if (subEntry.kind === 'file' && subEntry.name.endsWith('.def')) {
                        results.push(`stages/${entry.name}/${subEntry.name}`);
                    }
                }
            }
        }
        return results.sort();
    }

    // Handle FileList (Fallback)
    if (input instanceof FileList || (input && input.length !== undefined)) {
         const files = input as FileList;
         const foundPaths = new Set<string>();

         for (let i = 0; i < files.length; i++) {
             const file = files[i];
             if (file.name.endsWith('.def')) {
                 const path = file.webkitRelativePath || file.name;
                 const parts = path.split('/');
                 const relPath = parts.length > 1 ? parts.slice(1).join('/') : file.name;
                 foundPaths.add(`stages/${relPath}`);
             }
         }
         return Array.from(foundPaths).sort();
    }
  } catch (e: any) {
      handleFSError(e, 'Stages Directory');
  }
  return [];
};

export const scanMotifsLoader = async (input: DirectoryInput): Promise<string[]> => {
    if (!input) return [];
    const results: string[] = [];
    try {
        if (input && typeof input.values === 'function') {
            const dirHandle = input as FileSystemDirectoryHandle;
            // Check root data/system.def
            try {
                await dirHandle.getFileHandle('system.def');
                results.push('data/system.def');
            } catch {}

            // Check subfolders
            for await (const entry of (dirHandle as any).values()) {
                if (entry.kind === 'directory') {
                    const subHandle = await dirHandle.getDirectoryHandle(entry.name);
                    try {
                        await subHandle.getFileHandle('system.def');
                        results.push(`data/${entry.name}/system.def`);
                    } catch {}
                }
            }
        }
        
        // Handle FileList (Fallback)
        if (input instanceof FileList || (input && input.length !== undefined)) {
            const files = input as FileList;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.name === 'system.def') {
                    const path = file.webkitRelativePath || file.name;
                    const parts = path.split('/');
                    if (parts.length > 1) {
                         const relPath = parts.slice(1).join('/');
                         results.push(`data/${relPath}`);
                    }
                }
            }
        }

    } catch (e) {
        console.warn("Error scanning motifs", e);
    }
    return results;
}

// --- Portrait Loader ---

export const getCharacterPortrait = async (charName: string, defPath: string, rootDir: DirectoryInput): Promise<string | null> => {
    if (!rootDir) return null;

    try {
        let defFile: File | null = null;
        let dirHandle: FileSystemDirectoryHandle | null = null;
        let fileList: FileList | null = null;
        
        // 1. Locate the DEF file to find the SFF filename
        if (rootDir && typeof rootDir.getDirectoryHandle === 'function') {
            // Native API
            dirHandle = rootDir as FileSystemDirectoryHandle;
            const parts = defPath.split('/');
            let currentDir = dirHandle;
            
            // Traverse to file
            for (let i = 0; i < parts.length - 1; i++) {
                currentDir = await currentDir.getDirectoryHandle(parts[i]);
            }
            const fileHandle = await currentDir.getFileHandle(parts[parts.length - 1]);
            defFile = await fileHandle.getFile();
            
            // We need to keep track of the char's directory handle for the SFF
            dirHandle = currentDir;
        } else {
            // FileList Fallback
            fileList = rootDir as FileList;
            // defPath is relative to the root 'chars' folder (e.g. "kfm/kfm.def")
            // We need to match loose.
            for (let i = 0; i < fileList.length; i++) {
                const f = fileList[i];
                const rel = f.webkitRelativePath.split('/').slice(1).join('/');
                if (rel === defPath || f.name === defPath) {
                    defFile = f;
                    break;
                }
            }
        }

        if (!defFile) return null;

        // 2. Parse DEF to find sprite = xxx.sff
        const text = await defFile.text();
        const lines = text.split(/\r?\n/);
        let sffName = '';
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.toLowerCase().startsWith('sprite')) {
                const parts = trimmed.split('=');
                if (parts.length > 1) {
                    sffName = parts[1].trim().split(',')[0].trim(); // Handle inline comments or params
                }
                break;
            }
        }
        
        if (!sffName) return null;

        // 3. Load SFF File
        let sffFile: File | null = null;
        
        if (dirHandle) {
             // SFF is usually relative to DEF
             const sffHandle = await dirHandle.getFileHandle(sffName);
             sffFile = await sffHandle.getFile();
        } else if (fileList && defFile) {
             // We need to construct the path relative to the DEF file in the FileList
             const defFullPath = defFile.webkitRelativePath;
             const basePath = defFullPath.substring(0, defFullPath.lastIndexOf('/') + 1);
             const targetPath = basePath + sffName;
             
             for (let i = 0; i < fileList.length; i++) {
                 if (fileList[i].webkitRelativePath === targetPath) {
                     sffFile = fileList[i];
                     break;
                 }
             }
             // Fallback: try case insensitive match
             if (!sffFile) {
                 const targetLower = targetPath.toLowerCase();
                 for (let i = 0; i < fileList.length; i++) {
                     if (fileList[i].webkitRelativePath.toLowerCase() === targetLower) {
                         sffFile = fileList[i];
                         break;
                     }
                 }
             }
        }

        if (!sffFile) return null;

        // 4. Parse SFF
        const buffer = await sffFile.arrayBuffer();
        return parseSffV1(buffer);

    } catch (e) {
        console.warn(`Failed to load portrait for ${charName}:`, e);
        return null;
    }
}

// --- Config I/O ---

export const readIkemenConfig = async (rootDir: DirectoryInput): Promise<IkemenConfig | null> => {
    try {
        if (!rootDir || typeof rootDir.getDirectoryHandle !== 'function') return null;
        const saveHandle = await rootDir.getDirectoryHandle('save');
        const configHandle = await saveHandle.getFileHandle('config.json');
        const file = await configHandle.getFile();
        const text = await file.text();
        return JSON.parse(text);
    } catch (e) {
        console.warn("Could not read save/config.json", e);
        return null;
    }
}

export const writeIkemenConfig = async (rootDir: DirectoryInput, config: IkemenConfig): Promise<void> => {
    try {
        if (!rootDir || typeof rootDir.getDirectoryHandle !== 'function') throw new Error("Browser does not support saving files directly.");
        const saveHandle = await rootDir.getDirectoryHandle('save', {create: true});
        const configHandle = await saveHandle.getFileHandle('config.json', {create: true});
        const writable = await configHandle.createWritable();
        await writable.write(JSON.stringify(config, null, 2));
        await writable.close();
    } catch (e: any) {
        handleFSError(e, 'Config Write');
    }
}


// --- Pickers ---

export const openFilePicker = async (acceptTypes: Record<string, string[]> = {'text/plain': ['.def']}): Promise<{content: string, name: string, file: File} | null> => {
  try {
    if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
        try {
            const [fileHandle] = await (window as any).showOpenFilePicker({
                types: [{ description: 'Files', accept: acceptTypes }],
                multiple: false
            });
            const file = await fileHandle.getFile();
            const content = acceptTypes['audio/*'] ? '' : await file.text();
            return { content, name: file.name, file };
        } catch (err: any) {
            if (err.name === 'AbortError') return null;
            throw err;
        }
    }
    return openFilePickerFallback(acceptTypes);
  } catch (e: any) {
      handleFSError(e, 'File Picker');
      return null;
  }
};

export const openDirectoryPicker = async (): Promise<DirectoryInput | null> => {
    try {
        if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
            try {
                return await (window as any).showDirectoryPicker();
            } catch (err: any) {
                if (err.name === 'AbortError') return null;
                throw err;
            }
        }
        return openDirectoryPickerFallback();
    } catch (e: any) {
        handleFSError(e, 'Directory Picker');
        return null;
    }
}

export const openAudioPicker = async () => {
    return openFilePicker({'audio/*': ['.mp3', '.ogg', '.wav', '.flac']});
}

// --- Installer ---

export const installAssetFromUrl = async (
    url: string, 
    rootDirHandle: DirectoryInput, 
    type: AssetType,
    onProgress?: (msg: string) => void
): Promise<string> => {
  
  onProgress?.("Downloading...");
  let blob: Blob;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Network Error: ${response.statusText}`);
    blob = await response.blob();
  } catch(e: any) {
      console.warn("Fetch failed (CORS or Network), trying direct link.");
      // Fallback: Create a direct download link
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      // Attempt to set filename if possible
      const fname = url.split('/').pop() || `${type}_download.zip`;
      a.download = fname;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Return empty string to indicate no automatic install was performed
      // The UI will likely show "Done." which is acceptable for a manual download hand-off
      return "";
  }

  // Check capability for writing
  if (!rootDirHandle || typeof (rootDirHandle as any).getFileHandle !== 'function') {
      onProgress?.("Browser doesn't support direct install. Downloading ZIP...");
      
      const a = document.createElement('a');
      const tempUrl = URL.createObjectURL(blob);
      a.href = tempUrl;
      const fileName = url.split('/').pop() || `${type}_download.zip`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(tempUrl);
      
      // Attempt to guess return value so UI updates
      try {
          const zip = new JSZip();
          const loadedZip = await zip.loadAsync(blob);
          const entries = Object.keys(loadedZip.files);
          const defFile = entries.find(e => e.endsWith('.def'));
          
          if (defFile) {
             if (type === 'character') {
                 if (defFile.includes('/')) return defFile;
                 const base = defFile.replace('.def', '');
                 return `${base}/${defFile}`;
             }
             if (type === 'stage') return `stages/${defFile}`;
             if (type === 'screenpack') return `data/${defFile}`;
          }
      } catch (e) {
          console.warn("Could not read zip for name guessing", e);
      }
      
      return "";
  }

  // Native File System Logic
  try {
    const dirHandle = rootDirHandle as FileSystemDirectoryHandle;
    onProgress?.("Unzipping...");
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(blob);
    const entries = Object.keys(loadedZip.files);

    onProgress?.("Writing files...");
    
    let isLoose = false;
    const defFile = entries.find(e => e.endsWith('.def'));
    if (defFile && !defFile.includes('/')) {
        isLoose = true;
    }
    
    let installedDef = '';

    if (type === 'character') {
         for (const filename of entries) {
            const fileData = loadedZip.files[filename];
            if (fileData.dir) continue;
            
            let targetPath = filename;
            if (isLoose && defFile) {
                const folderName = defFile.replace('.def', '');
                targetPath = `${folderName}/${filename}`;
            }

            const content = await fileData.async('blob');
            await writeFile(dirHandle, targetPath, content);
            
            if (filename.endsWith('.def') && !installedDef) {
                installedDef = isLoose ? `${defFile!.replace('.def','')}/${defFile}` : filename;
            }
         }
    } else if (type === 'stage') {
        for (const filename of entries) {
            const fileData = loadedZip.files[filename];
             if (fileData.dir) continue;
             const content = await fileData.async('blob');
             await writeFile(dirHandle, filename, content);
             if (filename.endsWith('.def') && !installedDef) installedDef = `stages/${filename}`;
        }
    } else if (type === 'screenpack') {
        for (const filename of entries) {
             const fileData = loadedZip.files[filename];
             if (fileData.dir) continue;
             const content = await fileData.async('blob');
             await writeFile(dirHandle, filename, content);
             if (filename.endsWith('system.def') && !installedDef) {
                 installedDef = `data/${filename}`;
             }
        }
    }

    return installedDef;
  } catch (e: any) {
      handleFSError(e, `${type} Installation`);
      return '';
  }
};

async function writeFile(rootDir: FileSystemDirectoryHandle, path: string, content: Blob) {
    const parts = path.split('/').filter(p => p);
    const fileName = parts.pop()!;
    
    let currentDir = rootDir;
    for (const part of parts) {
        currentDir = await currentDir.getDirectoryHandle(part, { create: true });
    }
    
    const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
}
