import { getAIConfig, reportKeyFailure, markKeyActive } from "./aiKeyManager";
/**
 * Transcribe physical scanned documents or photos using AI Vision OCR
 * Priority: 1. Anthropic Claude Vision  2. Google Gemini Vision  3. OpenAI GPT-4o
 */
export async function performVisionOCR(dataUrl: string, fileName?: string): Promise<string> {
  const config = getAIConfig();
  const ocrPrompt = "Vous êtes un module OCR juridique d élite. Transcrivez INTÉGRALEMENT tout le texte visible dans ce document numérisé (lettres, chiffres, dates, montants en euros, noms, articles de loi, signatures). Ne faites aucun résumé : restituez fidèlement le texte intégral avec les sauts de ligne appropriés.";

  const base64Data = dataUrl.split(",")[1] || "";
  let rawMime = (dataUrl.split(";")[0] || "").replace("data:", "").toLowerCase() || "image/jpeg";
  const validMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const mimeType = validMimes.includes(rawMime) ? rawMime : "image/jpeg";

  // Provider 1: Google Gemini Vision (Priorité absolue avec chaîne de résilience)
  if (config.gemini_key && config.gemini_status !== "invalid_key") {
    const geminiModels = [
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite"
    ];
    for (const gModel of geminiModels) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${config.gemini_key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [
              { text: ocrPrompt },
              { inline_data: { mime_type: mimeType, data: base64Data } }
            ]}]
          })
        });

        if (res.ok) {
          const json = await res.json();
          const transcribed = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (transcribed && transcribed.length > 20) {
            markKeyActive("gemini");
            console.log(`[OCR] ✅ Gemini Vision (${gModel}) - transcription réussie`);
            return transcribed;
          }
        } else if (res.status === 503) {
          console.warn(`[OCR] Gemini ${gModel} 503 (Spike temporaire) - basculement immédiat vers le modèle suivant...`);
          await new Promise(r => setTimeout(r, 300));
        } else {
          console.warn(`[OCR] Gemini ${gModel} status ${res.status}, essai du suivant...`);
        }
      } catch (e: any) {
        console.warn("Vision OCR Gemini trigger:", e?.message);
      }
    }
  }

  // Provider 2: Anthropic Claude Vision (Fallback haute précision)
  if (config.anthropic_key && config.anthropic_status !== "invalid_key") {
    const claudeVisionModels = ["claude-3-5-sonnet-20241022", "claude-3-7-sonnet-20250219", "claude-3-haiku-20240307"];
    for (const cModel of claudeVisionModels) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": config.anthropic_key,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({
            model: cModel,
            max_tokens: 4000,
            messages: [{
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mimeType as any, data: base64Data } },
                { type: "text", text: ocrPrompt }
              ]
            }]
          })
        });

        if (res.ok) {
          const json = await res.json();
          const transcribed = json?.content?.[0]?.text?.trim();
          if (transcribed && transcribed.length > 20) {
            markKeyActive("anthropic");
            console.log(`[OCR] ✅ Anthropic Claude Vision (${cModel}) - transcription réussie`);
            return transcribed;
          }
        }
      } catch (_e) {}
    }
  }

  // Provider 3: OpenAI Vision (Dernier recours)
  if (config.openai_key && config.openai_status !== "invalid_key") {
    const openAiVisionModels = ["gpt-4o-mini", "gpt-4o"];
    for (const oModel of openAiVisionModels) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + config.openai_key },
          body: JSON.stringify({
            model: oModel,
            messages: [{ role: "user", content: [
              { type: "text", text: ocrPrompt },
              { type: "image_url", image_url: { url: dataUrl, detail: "high" } }
            ]}],
            max_tokens: 3500
          })
        });

        if (res.ok) {
          const json = await res.json();
          const transcribed = json?.choices?.[0]?.message?.content?.trim();
          if (transcribed && transcribed.length > 20) {
            markKeyActive("openai");
            console.log(`[OCR] ✅ OpenAI Vision (${oModel}) - transcription réussie`);
            return transcribed;
          }
        } else {
          if (res.status === 429) {
            await reportKeyFailure("openai", "quota_exceeded", "HTTP 429 Rate Limit");
          } else if (res.status === 401) {
            await reportKeyFailure("openai", "invalid_key", "HTTP 401 Unauthorized");
          }
        }
      } catch (e: any) {
        console.warn("Vision OCR OpenAI failover trigger:", e?.message);
      }
    }
  }

  return `[Pièce visuelle / Image numérisée : "${fileName || "Document"}" importée pour analyse OCR et Vision Multimodale]`;
}


export interface ParsedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  dataUrl?: string;
  uploadedAt: number;
}

/**
 * Safely decompresses a PDF stream using browser-native DecompressionStream
 * with Response.pipeThrough() to cleanly handle invalid/non-zlib stream headers
 * without creating unhandled promise rejections.
 */
async function safeDecompressPdfStream(rawBytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === 'undefined' || rawBytes.length === 0) return '';
  for (const fmt of ['deflate', 'deflate-raw'] as const) {
    try {
      const ds = new DecompressionStream(fmt);
      const stream = new Response(rawBytes).body?.pipeThrough(ds);
      if (!stream) continue;
      const buf = await new Response(stream).arrayBuffer();
      if (buf && buf.byteLength > 0) {
        return new TextDecoder('latin1').decode(buf);
      }
    } catch {
      // Cleanly handled: invalid zlib header or non-text stream, proceed to next format
    }
  }
  return '';
}

/**
 * Advanced multi-strategy PDF text extractor operating directly in the browser.
 * Safely copies ArrayBuffers to prevent detached buffer errors, decompresses
 * Flate streams using native DecompressionStream, and decodes Tj/TJ text operators.
 */
export async function extractTextFromPDFBuffer(buffer: ArrayBuffer): Promise<string | null> {
  try {
    if (!buffer || buffer.byteLength === 0) return null;
    const safeBytes = new Uint8Array(buffer.slice(0));
    const latin1 = new TextDecoder('latin1').decode(safeBytes);

    const extractedStrings: string[] = [];

    // 1. Process all PDF content streams (stream ... endstream)
    const streamRegex = /stream[\r\n]([\s\S]*?)[\r\n]endstream/g;
    let match: RegExpExecArray | null;

    while ((match = streamRegex.exec(latin1)) !== null) {
      const rawData = match[1];
      let decompressed = '';

      // Check if preceding PDF object specifies /FlateDecode
      const streamStart = match.index;
      const dictPrefix = latin1.substring(Math.max(0, streamStart - 600), streamStart);
      const isFlate = /FlateDecode|Flate/i.test(dictPrefix);

      if (isFlate) {
        try {
          const rawBytes = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; i++) {
            rawBytes[i] = rawData.charCodeAt(i);
          }
          const decomp = await safeDecompressPdfStream(rawBytes);
          decompressed = decomp || rawData;
        } catch (_decompErr) {
          decompressed = rawData;
        }
      } else {
        decompressed = rawData;
      }

      if (decompressed && decompressed.length > 5) {
        // Extract literal text strings: (Text) Tj or ' or "
        const tjRegex = /\(([^()]{1,400})\)\s*(?:Tj|\x27|\x22)/g;
        let tjMatch: RegExpExecArray | null;
        while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
          if (tjMatch[1]) extractedStrings.push(tjMatch[1]);
        }

        // Extract array text blocks: [(Part1) -10 (Part2)] TJ
        const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
        let arrayMatch: RegExpExecArray | null;
        while ((arrayMatch = tjArrayRegex.exec(decompressed)) !== null) {
          const inner = arrayMatch[1];
          const subMatches = inner.match(/\(([^()]+)\)/g);
          if (subMatches) {
            extractedStrings.push(subMatches.map(s => s.slice(1, -1)).join(''));
          }
        }

        // Extract hex-encoded text: <00480065006C006C006F> Tj
        const hexRegex = /<([0-9A-Fa-f]{4,})>\s*(?:Tj|\x27|\x22)/g;
        let hexMatch: RegExpExecArray | null;
        while ((hexMatch = hexRegex.exec(decompressed)) !== null) {
          const hex = hexMatch[1];
          let str = '';
          for (let i = 0; i < hex.length; i += 2) {
            const code = parseInt(hex.substr(i, 2), 16);
            if (code >= 32 && code <= 255) str += String.fromCharCode(code);
          }
          if (str.length > 2) extractedStrings.push(str);
        }
      }
    }

    // 2. Fallback: Search for literal text strings outside stream boundaries
    if (extractedStrings.length === 0) {
      const literalMatches = latin1.match(/\(([^()]{3,})\)/g);
      if (literalMatches) {
        for (const m of literalMatches) {
          const clean = m.slice(1, -1).trim();
          if (clean.length > 2 && /[a-zA-Zàáâäæçèéêëîïôœùûüÿ0-9]/.test(clean)) {
            extractedStrings.push(clean);
          }
        }
      }
    }

    if (extractedStrings.length > 0) {
      const fullText = extractedStrings
        .join(' ')
        .replace(/\\([nrtbf()\\])/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (fullText.length > 15) {
        console.log(`[NativeStreamParser] ✅ Texte extrait du flux PDF (${fullText.length} caractères)`);
        return fullText;
      }
    }
  } catch (err) {
    console.warn("Erreur d'extraction native du PDF:", err);
  }

  return null;
}

/**
 * Clean up extracted text by normalizing line endings and removing control characters
 */
export function sanitizeExtractedText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Universal DOCX / Word and PPTX / PowerPoint text extractor
 */
export async function extractTextFromDocxBuffer(buffer: ArrayBuffer): Promise<string> {
  try {
    const bytes = new Uint8Array(buffer);
    let str = "";
    const len = bytes.length;
    const step = 8192;
    for (let i = 0; i < len; i += step) {
      str += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + step)));
    }
    // Extract XML text tags commonly found in DOCX (w:t) and PPTX (a:t)
    const matches = str.match(/<(?:w:t|a:t)[^>]*>([\s\S]*?)<\/(?:w:t|a:t)>/g);
    if (matches && matches.length > 0) {
      return matches
        .map(m => m.replace(/<[^>]+>/g, ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  } catch (e) {
    console.warn("Document binary text extraction notice:", e);
  }
  return '';
}

/**
 * Converts a PDF buffer to a base64 image (first N pages) using PDF.js loaded from CDN.
 * Returns an array of data URLs (one per page rendered).
 */
async function convertPdfPagesToImages(buffer: ArrayBuffer, maxPages = 5): Promise<string[]> {
  try {
    if (!buffer || buffer.byteLength === 0) return [];
    // Dynamically load PDF.js from CDN if not already available
    const pdfjsLib = await loadPdfJs();
    if (!pdfjsLib) return [];

    const data = new Uint8Array(buffer.slice(0));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    const numPages = Math.min(pdf.numPages, maxPages);
    const dataUrls: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // High resolution for better OCR

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        await page.render({ canvasContext: ctx, viewport }).promise;
        dataUrls.push(canvas.toDataURL('image/jpeg', 0.92));
      } catch (pageErr) {
        console.warn(`Erreur page ${pageNum}:`, pageErr);
      }
    }
    return dataUrls;
  } catch (err) {
    console.warn('PDF.js conversion error:', err);
    return [];
  }
}

/**
 * Lazily loads PDF.js from CDN with same-origin Blob Worker wrapper
 * to bypass browser cross-origin worker restrictions in production.
 */
let _pdfjsLib: any = null;
let _pdfjsLoadingPromise: Promise<any> | null = null;
async function loadPdfJs(): Promise<any> {
  if (_pdfjsLib) return _pdfjsLib;
  if (_pdfjsLoadingPromise) return _pdfjsLoadingPromise;
  if (typeof window === 'undefined') return null;

  // Check if already loaded
  if ((window as any).pdfjsLib) {
    _pdfjsLib = (window as any).pdfjsLib;
    return _pdfjsLib;
  }

  _pdfjsLoadingPromise = new Promise((resolve) => {
    try {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        const lib = (window as any).pdfjsLib;
        if (lib) {
          try {
            const workerCode = `importScripts("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js");`;
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            lib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
          } catch (_wErr) {
            lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
          _pdfjsLib = lib;
        }
        resolve(lib || null);
      };
      script.onerror = () => {
        console.warn('[PDF.js] Impossible de charger le CDN PDF.js');
        resolve(null);
      };
      document.head.appendChild(script);
    } catch (_loadErr) {
      resolve(null);
    }
  });

  return _pdfjsLoadingPromise;
}

/**
 * Fast direct digital text extractor using PDF.js getTextContent()
 * Extracts 100% of native digital text locally without any OCR or network latency
 */
export async function extractTextWithPdfJs(buffer: ArrayBuffer): Promise<string | null> {
  try {
    if (!buffer || buffer.byteLength === 0) return null;
    const pdfjsLib = await loadPdfJs();
    if (!pdfjsLib) return null;

    const data = new Uint8Array(buffer.slice(0));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    if (!pdf || pdf.numPages === 0) return null;

    const pageTexts: string[] = [];
    const maxPages = Math.min(pdf.numPages, 30);
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageStr = (textContent.items || [])
          .map((item: any) => item?.str || '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (pageStr && pageStr.length > 5) {
          pageTexts.push(`--- PAGE ${pageNum} ---\n${pageStr}`);
        }
      } catch (pageErr) {
        console.warn(`[PDF.js] Erreur extraction texte page ${pageNum}:`, pageErr);
      }
    }

    const fullText = pageTexts.join('\n\n').trim();
    if (fullText.length > 20) {
      console.log(`[PDF.js] ✅ Extraction numérique native réussie (${pdf.numPages} pages, ${fullText.length} caractères)`);
      return fullText;
    }
  } catch (err) {
    console.warn('[PDF.js] Erreur extraction textuelle directe:', err);
  }
  return null;
}

/**
 * Full OCR pipeline for scanned PDFs:
 * 1. Convert pages to images via PDF.js
 * 2. Run Vision OCR on each page
 * 3. Concatenate results
 */
export async function ocrScannedPdf(buffer: ArrayBuffer, fileName?: string): Promise<string> {
  console.log('[OCR] Tentative OCR Vision sur PDF scanné:', fileName);
  if (!buffer || buffer.byteLength === 0) {
    return `[Pièce PDF "${fileName || 'Document'}" reçue pour analyse juridique]`;
  }

  const pageImages = await convertPdfPagesToImages(buffer.slice(0), 5);

  if (pageImages.length === 0) {
    return `[Pièce PDF "${fileName || 'Document'}" importée pour analyse juridique]`;
  }

  const pageTexts: string[] = [];
  for (let i = 0; i < pageImages.length; i++) {
    try {
      const text = await performVisionOCR(pageImages[i], `${fileName} - Page ${i + 1}`);
      if (text) {
        pageTexts.push(`--- PAGE ${i + 1} ---\n${text}`);
      }
    } catch (e) {
      console.warn(`OCR page ${i + 1} error:`, e);
    }
  }

  if (pageTexts.length > 0) {
    console.log(`[OCR] Succès : ${pageTexts.length} page(s) transcrite(s) pour "${fileName}"`);
    return pageTexts.join('\n\n');
  }

  return `[Pièce PDF scannée "${fileName || 'Document'}" : ${pageImages.length} page(s) importée(s) pour analyse juridique]`;
}

/**
 * Parse a single uploaded file (PDF, DOC, DOCX, TXT, CSV, JSON, MD)
 */
export async function parseUploadedFile(file: File): Promise<ParsedDocument> {
  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
  const isDocx = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc') || file.type.includes('word');
  const isPptx = file.name.toLowerCase().endsWith('.pptx') || file.name.toLowerCase().endsWith('.ppt') || file.type.includes('presentation') || file.type.includes('powerpoint');
  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif|tiff)$/i.test(file.name);

  return new Promise((resolve) => {
    const reader = new FileReader();

    if (isImage) {
      reader.onload = async (event) => {
        const dataUrl = (event.target?.result as string) || '';
        let extractedText = '';
        try {
          extractedText = await performVisionOCR(dataUrl, file.name);
        } catch {
          extractedText = `[Pièce visuelle / Image numérisée : "${file.name}" importée pour analyse OCR]`;
        }
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: file.type || 'image/jpeg',
          size: file.size,
          dataUrl,
          content: extractedText,
          uploadedAt: Date.now()
        });
      };
      reader.onerror = () => {
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: file.type || 'image/jpeg',
          size: file.size,
          content: `Image "${file.name}" importée.`,
          uploadedAt: Date.now()
        });
      };
      reader.readAsDataURL(file);
    } else if (isPdf) {
      reader.onload = async (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        if (!buffer) {
          resolve({
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            type: 'application/pdf',
            size: file.size,
            content: `Pièce "${file.name}" importée.`,
            uploadedAt: Date.now()
          });
          return;
        }

        // Safely produce independent ArrayBuffer slices so that PDF.js workers cannot detach the master buffer
        const getBufferCopy = () => buffer.slice(0);

        // STEP 1: Fast direct native extraction via PDF.js getTextContent()
        let cleanText = '';
        try {
          const nativeText = await extractTextWithPdfJs(getBufferCopy());
          if (nativeText && nativeText.trim().length > 30) {
            cleanText = sanitizeExtractedText(nativeText);
          }
        } catch (_nativeErr) {}

        // STEP 2: Pure-JS PDF stream decompressor fallback (DecompressionStream deflate)
        if (!cleanText || cleanText.length < 40) {
          try {
            const rawText = await extractTextFromPDFBuffer(getBufferCopy());
            if (rawText && rawText.trim().length > 30) {
              cleanText = sanitizeExtractedText(rawText);
            }
          } catch (_rawErr) {}
        }

        // STEP 3: If still no text layer → truly a scanned/image PDF → Vision OCR
        const isScannedPdf = !cleanText || cleanText.length < 40;
        if (isScannedPdf) {
          console.log(`[OCR] PDF "${file.name}" détecté comme scan sans calque texte - activation OCR Vision...`);
          try {
            const ocrText = await ocrScannedPdf(getBufferCopy(), file.name);
            resolve({
              id: Math.random().toString(36).substring(2, 9),
              name: file.name,
              type: 'application/pdf',
              size: file.size,
              content: ocrText.length > 40000 ? ocrText.substring(0, 40000) + "\n...[Texte OCR tronqué pour analyse]" : ocrText,
              uploadedAt: Date.now()
            });
          } catch (ocrErr) {
            console.warn('OCR Vision failed:', ocrErr);
            resolve({
              id: Math.random().toString(36).substring(2, 9),
              name: file.name,
              type: 'application/pdf',
              size: file.size,
              content: `[Pièce PDF scannée "${file.name}" reçue pour analyse juridique]`,
              uploadedAt: Date.now()
            });
          }
          return;
        }

        // Normal PDF with text layer successfully extracted
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: 'application/pdf',
          size: file.size,
          content: cleanText.length > 40000 ? cleanText.substring(0, 40000) + "\n...[Texte du document tronqué pour analyse]" : cleanText,
          uploadedAt: Date.now()
        });
      };
      reader.onerror = () => {
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: 'application/pdf',
          size: file.size,
          content: `Pièce "${file.name}" importée.`,
          uploadedAt: Date.now()
        });
      };
      reader.readAsArrayBuffer(file);
    } else if (isDocx) {
      reader.onload = async (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        let text = '';
        if (buffer) {
          text = await extractTextFromDocxBuffer(buffer);
        }
        const cleanText = sanitizeExtractedText(text) || `Pièce Word "${file.name}" importée pour analyse.`;
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: file.size,
          content: cleanText.length > 30000 ? cleanText.substring(0, 30000) + "\n...[Texte du document tronqué pour analyse]" : cleanText,
          uploadedAt: Date.now()
        });
      };
      reader.onerror = () => {
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: file.size,
          content: `Document Word "${file.name}" importé.`,
          uploadedAt: Date.now()
        });
      };
      reader.readAsArrayBuffer(file);
    } else if (isPptx) {
      reader.onload = async (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        let text = '';
        if (buffer) {
          text = await extractTextFromDocxBuffer(buffer);
        }
        const cleanText = sanitizeExtractedText(text) || `Présentation PowerPoint "${file.name}" importée pour analyse.`;
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          size: file.size,
          content: cleanText.length > 30000 ? cleanText.substring(0, 30000) + "\n...[Texte de la présentation tronqué]" : cleanText,
          uploadedAt: Date.now()
        });
      };
      reader.onerror = () => {
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          size: file.size,
          content: `Présentation PowerPoint "${file.name}" importée.`,
          uploadedAt: Date.now()
        });
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        const rawText = (event.target?.result as string) || '';
        const cleanText = sanitizeExtractedText(rawText);
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          content: cleanText.length > 30000 ? cleanText.substring(0, 30000) + "\n...[Texte du document tronqué pour analyse]" : cleanText,
          uploadedAt: Date.now()
        });
      };
      reader.onerror = () => {
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          content: `Document "${file.name}" importé.`,
          uploadedAt: Date.now()
        });
      };
      reader.readAsText(file, 'UTF-8');
    }
  });
}

/**
 * Parse multiple uploaded files concurrently
 */
export async function parseMultipleFiles(files: File[] | FileList): Promise<ParsedDocument[]> {
  const fileArray = Array.from(files);
  const parsedPromises = fileArray.map(file => parseUploadedFile(file));
  return Promise.all(parsedPromises);
}

/**
 * Format active dossier documents into a structured prompt block for the AI
 */
export function formatDocumentsForPrompt(documents: ParsedDocument[]): string {
  if (!documents || documents.length === 0) return '';

  const docSections = documents.map((doc, idx) => {
    return `--- PIÈCE [${idx + 1}/${documents.length}] : "${doc.name}" (Type: ${doc.type}, Taille: ${Math.round(doc.size / 1024)} Ko) ---
CONTENU DU DOCUMENT :
${doc.content || "[Aucun texte lisible extrait de cette pièce]"}
--------------------------------------------------------`;
  }).join('\n\n');

  return `=== DOSSIER JURIDIQUE OFFICIEL : ${documents.length} PIÈCE(S) TRANSMISE(S) POUR ANALYSE CROISÉE ===
${docSections}
=== FIN DU DOSSIER TRANSMIS ===`;
}
