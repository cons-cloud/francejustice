import { getAIConfig, reportKeyFailure, markKeyActive, getAvailableGeminiKeys } from "./aiKeyManager";
/**
 * Transcribe physical scanned documents or photos using AI Vision OCR
 * Priority: 1. Google Gemini Vision (avec pool de clés résilient)  2. Anthropic Claude Vision  3. OpenAI GPT-4o
 */
export async function performVisionOCR(dataUrl: string, fileName?: string): Promise<string> {
  const config = getAIConfig();
  const ocrPrompt = "Vous êtes un module OCR juridique d élite. Transcrivez INTÉGRALEMENT tout le texte visible dans ce document numérisé (lettres, chiffres, dates, montants en euros, noms, articles de loi, signatures). Ne faites aucun résumé : restituez fidèlement le texte intégral avec les sauts de ligne appropriés.";

  const base64Data = dataUrl.split(",")[1] || "";
  let rawMime = (dataUrl.split(";")[0] || "").replace("data:", "").toLowerCase() || "image/jpeg";
  const validMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const mimeType = validMimes.includes(rawMime) ? rawMime : "image/jpeg";

  // Provider 1: Google Gemini Vision (Pool de clés avec basculement automatique sur 402/429/401)
  const geminiKeys = getAvailableGeminiKeys();
  const geminiModels = [
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite"
  ];

  for (const gKey of geminiKeys) {
    let keyDepleted = false;
    for (const gModel of geminiModels) {
      if (keyDepleted) break;
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${gKey}`, {
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
        } else if (res.status === 402 || res.status === 429 || res.status === 401) {
          console.warn(`[OCR] Gemini clé ${gKey.substring(0, 12)}... status ${res.status} (Crédits épuisés), basculement sur la clé suivante...`);
          await reportKeyFailure("gemini", "quota_exceeded", `HTTP ${res.status}`, gKey);
          keyDepleted = true;
          break; // Try next key in geminiKeys pool!
        } else if (res.status === 503) {
          console.warn(`[OCR] Gemini ${gModel} 503 (Spike temporaire) - basculement immédiat vers le modèle suivant...`);
          await new Promise(r => setTimeout(r, 200));
        } else {
          console.warn(`[OCR] Gemini ${gModel} status ${res.status}, essai du suivant...`);
        }
      } catch (e: any) {
        console.warn("Vision OCR Gemini trigger:", e?.message);
      }
    }
  }

  // Provider 2: Anthropic Claude Vision (Fallback haute précision - API keys only, not usr tokens)
  if (config.anthropic_key && config.anthropic_key.startsWith('sk-ant-api') && config.anthropic_status !== "invalid_key") {
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
 * Checks if a byte sequence starts with a valid zlib header (RFC 1950)
 * CMF method must be 8 (deflate) and (CMF * 256 + FLG) % 31 === 0
 */
function hasZlibHeader(bytes: Uint8Array): boolean {
  if (!bytes || bytes.length < 2) return false;
  const cmf = bytes[0];
  const flg = bytes[1];
  if ((cmf & 0x0f) !== 8) return false;
  return (cmf * 256 + flg) % 31 === 0;
}

/**
 * Safely decompresses a PDF stream using browser-native DecompressionStream
 * with explicit reader/writer error catching to prevent unhandled promise rejections.
 */
async function safeDecompressPdfStream(rawBytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === 'undefined' || !rawBytes || rawBytes.length < 2) return '';

  const formats: ('deflate' | 'deflate-raw')[] = hasZlibHeader(rawBytes)
    ? ['deflate', 'deflate-raw']
    : ['deflate-raw'];

  for (const fmt of formats) {
    try {
      const ds = new DecompressionStream(fmt);
      const writer = ds.writable.getWriter();
      const reader = ds.readable.getReader();

      const writePromise = writer.write(rawBytes)
        .then(() => writer.close())
        .catch(() => {});

      const chunks: Uint8Array[] = [];
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read().catch(() => ({ value: undefined, done: true }));
        if (value) chunks.push(value);
        done = streamDone;
      }
      await writePromise;

      let totalLen = 0;
      for (const c of chunks) totalLen += c.length;
      if (totalLen === 0) continue;
      const combined = new Uint8Array(totalLen);
      let offset = 0;
      for (const c of chunks) {
        combined.set(c, offset);
        offset += c.length;
      }
      return new TextDecoder('latin1').decode(combined);
    } catch {
      // Cleanly handled: invalid stream, try next format
    }
  }
  return '';
}

/**
 * Rigorously checks if extracted string is genuine readable human text
 * rather than binary noise, font tables, or stream artifacts.
 */
export function isValidHumanText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 30) return false;

  // 1. Ratio of printable characters (ASCII printable, accented Latin-1, standard whitespace)
  let printableCount = 0;
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if ((code >= 32 && code <= 126) || (code >= 160 && code <= 383) || code === 10 || code === 13 || code === 9) {
      printableCount++;
    }
  }
  const printableRatio = printableCount / trimmed.length;
  if (printableRatio < 0.88) return false;

  // 2. Tokenize words (sequences of letters)
  const tokens = trimmed.match(/[a-zA-ZÀ-ÿ]{2,}/g) || [];
  if (tokens.length < 5) return false;

  // 3. Check for presence of common French / natural language words
  const commonFrenchWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'en', 'et', 'ou', 'pour', 'par', 'sur',
    'dans', 'avec', 'sans', 'est', 'sont', 'a', 'au', 'aux', 'qui', 'que', 'ce', 'cette', 'ces',
    'il', 'elle', 'ils', 'elles', 'nous', 'vous', 'je', 'tu', 'se', 'sa', 'son', 'ses', 'leur',
    'leurs', 'ne', 'pas', 'plus', 'tout', 'tous', 'toute', 'toutes', 'cour', 'tribunal', 'juge',
    'jugement', 'decision', 'décision', 'ordonnance', 'arret', 'arrêt', 'droit', 'droits', 'article',
    'parties', 'demandeur', 'defendeur', 'défendeur', 'avocat', 'affaire', 'fait', 'date', 'somme',
    'euros', 'euro', 'monsieur', 'madame', 'societe', 'société', 'considérant', 'attendu', 'motifs',
    'dispositif', 'appel', 'chambre', 'loi', 'code', 'civil', 'pénal', 'commerce', 'contrat',
    'divorce', 'enfant', 'enfants', 'pension', 'prestation', 'vice', 'expertise', 'requete', 'requête'
  ]);

  let commonWordMatches = 0;
  for (const token of tokens) {
    if (commonFrenchWords.has(token.toLowerCase())) {
      commonWordMatches++;
    }
  }

  const minRequiredMatches = trimmed.length > 200 ? 4 : (trimmed.length > 80 ? 2 : 1);
  if (commonWordMatches < minRequiredMatches) {
    return false;
  }

  // 4. Check average word length to filter out long unbroken binary strings
  const totalWordLength = tokens.reduce((acc, t) => acc + t.length, 0);
  const avgWordLength = totalWordLength / tokens.length;
  if (avgWordLength > 18 || avgWordLength < 2) {
    return false;
  }

  return true;
}

/**
 * Advanced multi-strategy PDF text extractor operating directly in the browser.
 * Safely copies ArrayBuffers to prevent detached buffer errors, decompresses
 * Flate streams using native DecompressionStream, and decodes Tj/TJ text operators.
 * Rejects binary garbage so that OCR Vision can properly trigger on scanned documents.
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
          // Only use decomp if successfully decompressed; DO NOT fall back to raw binary bytes!
          decompressed = decomp || '';
        } catch (_decompErr) {
          decompressed = '';
        }
      } else {
        // If not Flate, only examine rawData if it is NOT a compressed or binary image filter
        const isBinaryFilter = /\/(?:DCTDecode|JPXDecode|CCITTFaxDecode|JBIG2Decode|Filter|XObject)/i.test(dictPrefix);
        if (!isBinaryFilter) {
          decompressed = rawData;
        } else {
          decompressed = '';
        }
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

      // Ensure extracted text is genuine human language, not raw binary stream noise
      if (fullText.length > 25 && isValidHumanText(fullText)) {
        console.log(`[NativeStreamParser] ✅ Texte valide extrait du flux PDF (${fullText.length} caractères)`);
        return fullText;
      } else {
        console.log(`[NativeStreamParser] ℹ️ Données de flux non textuelles (${fullText.length} car.) rejetées en faveur de l'OCR Vision`);
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
/**
 * Fast direct extraction of scanned JPEG images directly from the PDF byte buffer
 * Used as high-reliability fallback if PDF.js fails to initialize in the browser.
 */
function extractEmbeddedJpegImagesFromBuffer(buffer: ArrayBuffer, maxImages = 6): string[] {
  try {
    const bytes = new Uint8Array(buffer);
    const results: string[] = [];
    let i = 0;
    while (i < bytes.length - 4 && results.length < maxImages) {
      // Detect JPEG SOI (Start of Image): 0xFF, 0xD8, 0xFF
      if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8 && bytes[i + 2] === 0xFF) {
        const start = i;
        i += 3;
        let end = -1;
        while (i < bytes.length - 1) {
          if (bytes[i] === 0xFF && bytes[i + 1] === 0xD9) {
            end = i + 2;
            break;
          }
          i++;
        }
        if (end !== -1 && (end - start) > 5000) { // Keep images > 5KB (filter out tiny icons/stamps)
          const imageBytes = bytes.subarray(start, end);
          let binary = '';
          const chunkSize = 8192;
          for (let c = 0; c < imageBytes.length; c += chunkSize) {
            binary += String.fromCharCode.apply(null, Array.from(imageBytes.subarray(c, c + chunkSize)));
          }
          const base64 = btoa(binary);
          results.push(`data:image/jpeg;base64,${base64}`);
        }
      } else {
        i++;
      }
    }
    return results;
  } catch (_e) {
    return [];
  }
}

/**
 * Converts a PDF buffer to a base64 image (up to maxPages pages) using PDF.js loaded from CDN,
 * with direct embedded JPEG extraction fallback for scanned documents.
 */
async function convertPdfPagesToImages(buffer: ArrayBuffer, maxPages = 25): Promise<string[]> {
  try {
    if (!buffer || buffer.byteLength === 0) return [];
    // Dynamically load PDF.js from CDN if not already available
    const pdfjsLib = await loadPdfJs();
    if (pdfjsLib) {
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
      if (dataUrls.length > 0) return dataUrls;
    }
  } catch (err) {
    console.warn('PDF.js conversion error:', err);
  }

  // Fallback: extract embedded JPEG streams directly from PDF buffer
  try {
    const embeddedImages = extractEmbeddedJpegImagesFromBuffer(buffer.slice(0), maxPages);
    if (embeddedImages.length > 0) {
      console.log(`[OCR] ✅ Extraction directe de ${embeddedImages.length} image(s) JPEG depuis le flux PDF`);
      return embeddedImages;
    }
  } catch (_embErr) {}

  return [];
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
        // Fallback to jsDelivr CDN
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
        fallbackScript.onload = () => {
          const lib = (window as any).pdfjsLib;
          if (lib) {
            try {
              const workerCode = `importScripts("https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js");`;
              const blob = new Blob([workerCode], { type: 'application/javascript' });
              lib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
            } catch (_wErr) {
              lib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
            }
            _pdfjsLib = lib;
          }
          resolve(lib || null);
        };
        fallbackScript.onerror = () => {
          console.warn('[PDF.js] Impossible de charger les CDN PDF.js');
          resolve(null);
        };
        document.head.appendChild(fallbackScript);
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
 * Extracts 100% of native digital text locally without any OCR or network latency (up to 150 pages)
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
    const maxPages = Math.min(pdf.numPages, 150);
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
    if (fullText.length > 25 && isValidHumanText(fullText)) {
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
 * 1. Convert pages to images via PDF.js (up to 25 pages)
 * 2. Run Vision OCR on each page
 * 3. Concatenate results
 */
export async function ocrScannedPdf(buffer: ArrayBuffer, fileName?: string): Promise<string> {
  console.log('[OCR] Tentative OCR Vision sur PDF scanné:', fileName);
  if (!buffer || buffer.byteLength === 0) {
    return `[Pièce PDF "${fileName || 'Document'}" reçue pour analyse juridique]`;
  }

  const pageImages = await convertPdfPagesToImages(buffer.slice(0), 25);

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
          if (nativeText && nativeText.trim().length > 30 && isValidHumanText(nativeText)) {
            cleanText = sanitizeExtractedText(nativeText);
          }
        } catch (_nativeErr) {}

        // STEP 2: Pure-JS PDF stream decompressor fallback (DecompressionStream deflate)
        if (!cleanText || cleanText.length < 40) {
          try {
            const rawText = await extractTextFromPDFBuffer(getBufferCopy());
            if (rawText && rawText.trim().length > 30 && isValidHumanText(rawText)) {
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
              content: ocrText.length > 500000 ? ocrText.substring(0, 500000) + "\n...[Texte OCR tronqué pour analyse]" : ocrText,
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
          content: cleanText.length > 500000 ? cleanText.substring(0, 500000) + "\n...[Texte du document tronqué pour analyse]" : cleanText,
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
          content: cleanText.length > 500000 ? cleanText.substring(0, 500000) + "\n...[Texte du document tronqué pour analyse]" : cleanText,
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
          content: cleanText.length > 500000 ? cleanText.substring(0, 500000) + "\n...[Texte de la présentation tronqué]" : cleanText,
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
          content: cleanText.length > 500000 ? cleanText.substring(0, 500000) + "\n...[Texte du document tronqué pour analyse]" : cleanText,
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
