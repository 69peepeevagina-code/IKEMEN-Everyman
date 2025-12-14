
// Simple SFF v1 Parser (PCX)
// Focuses on extracting Group 9000, Index 1 (Big Portrait) or 0 (Small)

export const parseSffV1 = (buffer: ArrayBuffer): string | null => {
    try {
        const view = new DataView(buffer);
        // Signature check: "ElecbyteSpr" (12 bytes including null)
        const signatureBytes = new Uint8Array(buffer, 0, 11);
        const signature = new TextDecoder().decode(signatureBytes);
        
        if (signature !== "ElecbyteSpr") {
             // Try simplified SFFv2 check or just fail
             // SFFv2 starts with "ElecbyteSpr" too but byte 12 is version.
             // We'll stick to v1 logic first.
        }

        let offset = 16; // First subfile header
        let loopGuard = 0;
        
        // Prioritize 9000,1 (Big), fallback to 9000,0 (Small)
        let smallPortrait: string | null = null;

        while (offset < buffer.byteLength && loopGuard < 3000) {
            loopGuard++;
            
            if (offset + 32 > buffer.byteLength) break;

            const nextOffset = view.getUint32(offset, true);
            const subfileLen = view.getUint32(offset + 4, true);
            const x = view.getInt16(offset + 8, true);
            const y = view.getInt16(offset + 10, true);
            const group = view.getUint16(offset + 12, true);
            const index = view.getUint16(offset + 14, true);
            // 16: link index
            // 18: format (0=raw, 1=invalid, 2=RLE8, 3=RLE5, 4=LZ5)
            // 20: palette id
            const dataOffset = view.getUint32(offset + 24, true);
            
            if (group === 9000) {
                if (index === 1 || index === 0) {
                    // Found portrait
                    const spriteData = new Uint8Array(buffer, dataOffset, subfileLen);
                    // PCX decode
                    const blobUrl = decodePcx(spriteData);
                    if (index === 1) return blobUrl; // Found preferred
                    if (index === 0) smallPortrait = blobUrl;
                }
            }

            if (nextOffset === 0 || nextOffset <= offset) break; // End of list
            offset = nextOffset;
        }

        return smallPortrait;
    } catch (e) {
        console.warn("Error parsing SFF", e);
        return null;
    }
};

const decodePcx = (data: Uint8Array): string | null => {
    // Basic PCX Header is 128 bytes
    if (data.length < 128) return null;
    
    // Byte 0: Manufacturer (10)
    // Byte 1: Version
    // Byte 2: Encoding (1 = RLE)
    // Byte 3: BitsPerPixel
    // Byte 8-11: Window (Xmin, Ymin, Xmax, Ymax)
    
    const xMin = data[8] | (data[9] << 8);
    const yMin = data[10] | (data[11] << 8);
    const xMax = data[12] | (data[13] << 8);
    const yMax = data[14] | (data[15] << 8);
    
    const width = xMax - xMin + 1;
    const height = yMax - yMin + 1;
    
    if (width <= 0 || height <= 0 || width > 2000 || height > 2000) return null;

    // Decode RLE
    const pixels = new Uint8Array(width * height);
    let ptr = 128; // Skip header
    let pPtr = 0;
    
    while (ptr < data.length && pPtr < pixels.length) {
        let val = data[ptr++];
        let count = 1;
        
        if ((val & 0xC0) === 0xC0) {
            count = val & 0x3F;
            if (ptr >= data.length) break;
            val = data[ptr++];
        }
        
        for (let i = 0; i < count; i++) {
            if (pPtr < pixels.length) pixels[pPtr++] = val;
        }
    }

    // Palette (256 colors)
    // Usually at the end: 0x0C followed by 768 bytes
    let palette = new Uint8Array(768);
    if (data[data.length - 769] === 0x0C) {
        for(let i=0; i<768; i++) {
            palette[i] = data[data.length - 768 + i];
        }
    } else {
        // Fallback: Grayscale or default palette?
        for(let i=0; i<256; i++) {
            palette[i*3] = i;
            palette[i*3+1] = i;
            palette[i*3+2] = i;
        }
    }

    // Render to Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    const imgData = ctx.createImageData(width, height);
    // Index 0 is transparency in MUGEN SFFv1 usually (or mask color)

    for (let i = 0; i < pixels.length; i++) {
        const idx = pixels[i];
        if (idx === 0) {
            imgData.data[i * 4 + 3] = 0; // Transparent
        } else {
            imgData.data[i * 4] = palette[idx * 3];     // R
            imgData.data[i * 4 + 1] = palette[idx * 3 + 1]; // G
            imgData.data[i * 4 + 2] = palette[idx * 3 + 2]; // B
            imgData.data[i * 4 + 3] = 255; // Alpha
        }
    }
    
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
};
