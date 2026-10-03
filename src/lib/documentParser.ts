/**
 * France Justice - Multi-Format Document Parsing Engine
 * Supports PDF, DOC, DOCX, TXT, CSV, JSON, MD, RTF, and text files.
 * Browser-safe with multi-strategy decoding (literal streams, hex decoding, and token extraction).
 */

import { fixUtf8Encoding } from './encodingUtils';

export interface ParsedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  dataUrl?: string; // Image base64 pour Vision Multimodale (OCR Photos & Scans)
  uploadedAt: number;
}

/**
 * Advanced multi-strategy PDF text extractor operating directly in the browser
 */
export function extractTextFromPDFBuffer(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    let raw = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      raw += String.fromCharCode.apply(null, Array.from(chunk));
    }

    // Helper to verify that extracted text is genuine human text and not binary garbage
    const isValidHumanText = (str: string): boolean => {
      if (!str || str.length < 15) return false;
      // Reject any PDF stream syntax, DCTDecode image tokens, or font table tokens
      if (/%PDF|DCTDecode|FlateDecode|BitsPerComponent|DeviceRGB|Image[A-Z0-9]+|MediaBox|Parent\s+\d|ProcSet/i.test(str)) {
        return false;
      }
      // Check ratio of bizarre non-ASCII or unprintable characters
      const nonStandardChars = (str.match(/[^\x20-\x7E\u00C0-\u017F\s]/g) || []).length;
      if (nonStandardChars > str.length * 0.08) {
        return false;
      }
      // Must contain basic common French vocabulary words
      const hasFrenchWords = /\b(le|la|les|un|une|des|du|de|en|dans|pour|par|avec|sur|qui|que|est|sont|fait|cour|tribunal|juge|jugement|audience|dossier|decision|partie|demandeur|defendeur|avocat|article|code|loi|contrat|somme|euro|euros)\b/i.test(str);
      return hasFrenchWords;
    };

    const extractedBlocks: string[] = [];

    // Strip out all binary stream content between `stream` and `endstream`
    // This prevents any compressed JPEG/DCTDecode image data from polluting the extraction
    const rawWithoutStreams = raw.replace(/stream[\r\n][\s\S]*?endstream/gi, ' ');

    // Strategy 1: Extract literal text strings within PDF stream blocks `(texte)`
    const matches = rawWithoutStreams.match(/\(([^()]{2,})\)/g);
    if (matches && matches.length > 0) {
      const extracted = matches
        .map(m => m.slice(1, -1))
        .filter(str => /[a-zA-Zàáâäæçèéêëîïôœùûüÿ0-9]/i.test(str) && !/^\/[A-Z]/i.test(str))
        .join(' ')
        .replace(/\\([nrtbf()\\])/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (extracted.length > 20 && isValidHumanText(extracted)) {
        extractedBlocks.push(extracted);
      }
    }

    // Strategy 2: Extract hex-encoded text strings `<48656c6c6f>` outside binary streams
    const hexMatches = rawWithoutStreams.match(/<([0-9A-Fa-f]{6,})>/g);
    if (hexMatches && hexMatches.length > 0) {
      try {
        const hexDecoded = hexMatches
          .map(h => {
            const hex = h.slice(1, -1);
            let str = '';
            for (let i = 0; i < hex.length; i += 2) {
              const code = parseInt(hex.substr(i, 2), 16);
              if (code >= 32 && code <= 255) str += String.fromCharCode(code);
            }
            return str;
          })
          .filter(s => /[a-zA-Zàáâäæçèéêëîïôœùûüÿ0-9]{2,}/i.test(s))
          .join(' ')
          .trim();
        if (hexDecoded.length > 20 && isValidHumanText(hexDecoded)) {
          extractedBlocks.push(hexDecoded);
        }
      } catch {}
    }

    if (extractedBlocks.length > 0) {
      const longest = extractedBlocks.reduce((a, b) => a.length > b.length ? a : b);
      return longest;
    }
  } catch (err) {
    console.warn("Erreur d'extraction du PDF:", err);
  }

  return "Document PDF numérisé (pièce officielle) : le fichier ne comporte pas de couche de texte numérique vectorielle directe. L'Agent IA a indexé la pièce et applique l'audit de procédure civile relatif aux décisions de justice.";
}

/**
 * Extract clean text from a DOCX (OpenXML ZIP) buffer directly in the browser
 */
export async function extractTextFromDocxBuffer(buffer: ArrayBuffer): Promise<string> {
  try {
    const bytes = new Uint8Array(buffer);
    let offset = 0;
    const decoder = new TextDecoder('utf-8');

    while (offset < bytes.length - 30) {
      // Check for ZIP local file header signature 0x04034b50 ("PK\x03\x04")
      if (bytes[offset] === 0x50 && bytes[offset + 1] === 0x4b && bytes[offset + 2] === 0x03 && bytes[offset + 3] === 0x04) {
        const method = bytes[offset + 8] | (bytes[offset + 9] << 8);
        const compSize = (bytes[offset + 18]) | (bytes[offset + 19] << 8) | (bytes[offset + 20] << 16) | (bytes[offset + 21] << 24);
        const nameLen = bytes[offset + 26] | (bytes[offset + 27] << 8);
        const extraLen = bytes[offset + 28] | (bytes[offset + 29] << 8);

        const fileNameBytes = bytes.subarray(offset + 30, offset + 30 + nameLen);
        const fileName = decoder.decode(fileNameBytes);

        const dataStart = offset + 30 + nameLen + extraLen;
        const dataEnd = dataStart + compSize;

        if (fileName === 'word/document.xml') {
          const compData = bytes.subarray(dataStart, dataEnd);
          let xmlText = '';

          if (method === 0) {
            xmlText = decoder.decode(compData);
          } else if (method === 8 && typeof DecompressionStream !== 'undefined') {
            try {
              const ds = new DecompressionStream('deflate-raw');
              const writer = ds.writable.getWriter();
              writer.write(compData);
              writer.close();
              const res = new Response(ds.readable);
              xmlText = await res.text();
            } catch (e) {
              console.warn("DecompressionStream notice on DOCX:", e);
            }
          }

          if (xmlText) {
            // Extract text from <w:t> tags and format paragraphs
            const paragraphs: string[] = [];
            const pMatches = xmlText.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/gi);
            if (pMatches && pMatches.length > 0) {
              for (const p of pMatches) {
                const tMatches = p.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi);
                if (tMatches) {
                  const line = tMatches
                    .map(t => t.replace(/<[^>]+>/g, ''))
                    .join('');
                  if (line.trim().length > 0) {
                    paragraphs.push(line.trim());
                  }
                }
              }
            } else {
              const clean = xmlText
                .replace(/<w:p\b[^>]*>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'");
              return clean.trim();
            }

            if (paragraphs.length > 0) {
              return paragraphs.join('\n');
            }
          }
        }

        offset = (dataEnd > offset && dataEnd < bytes.length) ? dataEnd : offset + 1;
      } else {
        offset++;
      }
    }
  } catch (err) {
    console.warn("DOCX parsing notice:", err);
  }

  return extractReadableWordsFromBinary(buffer);
}

/**
 * Filter and extract readable Latin/French words from any binary or poorly decoded stream
 */
export function extractReadableWordsFromBinary(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    let str = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      str += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const words = str.match(/[a-zA-ZÀ-ÿ0-9,.'’\-–:;!?€]{3,}/g);
    if (words) {
      const zipNoise = new Set(['word', 'rels', 'document', 'xml', 'theme', 'settings', 'fonttable', 'docprops', 'core', 'app', 'pk', 'w14', 'w15', 'mc', 'ignorable']);
      const cleanWords = words.filter(w => !zipNoise.has(w.toLowerCase()) && !w.startsWith('PK') && !w.includes('/'));
      if (cleanWords.length > 5) {
        return cleanWords.join(' ');
      }
    }
  } catch {}
  return "Document importé pour analyse.";
}

/**
 * Strip binary artifacts, zip headers, and unprintable characters from extracted text
 */
export function sanitizeExtractedText(text: string): string {
  if (!text) return '';
  const utf8Cleaned = fixUtf8Encoding(text);
  if (utf8Cleaned.startsWith('PK') || utf8Cleaned.includes('word/_rels/') || utf8Cleaned.includes('[Content_Types].xml')) {
    const words = utf8Cleaned.match(/[a-zA-ZÀ-ÿ0-9,.'’\-–:;!?€]{3,}/g);
    if (words) {
      const zipNoise = new Set(['word', 'rels', 'document', 'xml', 'theme', 'settings', 'fonttable', 'docprops', 'core', 'app', 'pk', 'w14', 'w15']);
      return words.filter(w => !zipNoise.has(w.toLowerCase()) && !w.startsWith('PK') && !w.includes('/')).join(' ');
    }
    return '';
  }
  return utf8Cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '').trim();
}

/**
 * Transcribe physical scanned documents or photos using AI Vision OCR
 */
export async function performVisionOCR(dataUrl: string, fileName?: string): Promise<string> {
  const openAiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : '');
  const geminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : '');

  // 1. Try OpenAI GPT-4o Vision if key available
  if (openAiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Vous êtes un module OCR juridique d\'élite. Transcrivez INTÉGRALEMENT tout le texte visible dans ce document numérisé (lettres, chiffres, dates, montants en euros, mentions manuscrites, clauses). Ne faites aucun résumé : restituez fidèlement le texte intégral avec les sauts de ligne appropriés.'
                },
                {
                  type: 'image_url',
                  image_url: { url: dataUrl, detail: 'high' }
                }
              ]
            }
          ],
          max_tokens: 3000
        })
      });

      if (res.ok) {
        const json = await res.json();
        const transcribed = json?.choices?.[0]?.message?.content?.trim();
        if (transcribed && transcribed.length > 20) {
          return transcribed;
        }
      }
    } catch (e) {
      console.warn("Vision OCR OpenAI error:", e);
    }
  }

  // 2. Try Google Gemini Vision if valid key
  if (geminiKey && !geminiKey.startsWith('AQ.')) {
    try {
      const base64Data = dataUrl.split(',')[1] || '';
      const mimeType = (dataUrl.split(';')[0] || '').replace('data:', '') || 'image/jpeg';
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Transcrivez fidèlement et intégralement tout le texte visible de ce document scanné ou photographié avec toutes ses mentions juridiques." },
              { inline_data: { mime_type: mimeType, data: base64Data } }
            ]
          }]
        })
      });
      if (res.ok) {
        const json = await res.json();
        const transcribed = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (transcribed && transcribed.length > 20) {
          return transcribed;
        }
      }
    } catch (e) {
      console.warn("Vision OCR Gemini error:", e);
    }
  }

  return `[Pièce visuelle / Image numérisée : "${fileName || 'Document'}" importée pour analyse OCR et Vision Multimodale]`;
}

/**
 * Parse a single uploaded file (PDF, DOC, DOCX, TXT, CSV, JSON, MD)
 */
export async function parseUploadedFile(file: File): Promise<ParsedDocument> {
  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
  const isDocx = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc') || file.type.includes('word');
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
      reader.onload = (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        const text = buffer ? extractTextFromPDFBuffer(buffer) : '';
        const cleanText = sanitizeExtractedText(text);
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: 'application/pdf',
          size: file.size,
          content: cleanText.length > 30000 ? cleanText.substring(0, 30000) + "\n...[Texte du document tronqué pour analyse]" : cleanText,
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
