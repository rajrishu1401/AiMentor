/**
 * pdfExtractor.ts
 * Extracts raw text from a PDF buffer using pdf-parse.
 */

import { logger } from '../utils/logger';

export interface ExtractedPDF {
    text: string;
    numPages: number;
    wordCount: number;
    charCount: number;
}

// pdf-parse uses CommonJS; dynamic require keeps TypeScript happy at compile time
async function getPdfParse(): Promise<(buf: Buffer) => Promise<{ text: string; numpages: number }>> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse') as (
        buf: Buffer
    ) => Promise<{ text: string; numpages: number }>;
    return pdfParse;
}

export async function extractTextFromPDF(
    pdfBuffer: Buffer,
    fileName: string
): Promise<ExtractedPDF> {
    logger.info('PDF extraction started', { fileName, bufferBytes: pdfBuffer.length });

    try {
        const pdfParse = await getPdfParse();
        const result = await pdfParse(pdfBuffer);

        const text = result.text ?? '';
        const numPages = result.numpages ?? 0;
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        const charCount = text.length;

        logger.info('PDF extraction complete', { fileName, numPages, wordCount, charCount });

        return { text, numPages, wordCount, charCount };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error('PDF extraction failed', { fileName, error: msg });
        throw new Error(`Failed to extract text from PDF: ${msg}`);
    }
}
