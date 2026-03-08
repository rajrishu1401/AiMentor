/**
 * chunkService.ts
 * Splits extracted PDF text into overlapping chunks, capped at MAX_CHUNKS.
 */

import { CHUNK_SIZE, CHUNK_OVERLAP, MAX_CHUNKS } from '../shared/constants';
import { logger } from '../utils/logger';

export interface TextChunk {
    content: string;
    chunkIndex: number;
    startPos: number;
    endPos: number;
}

/**
 * Split text into overlapping character-level chunks.
 * Attempts to break at sentence boundaries when possible.
 *
 * @param text       Full document text
 * @param chunkSize  Target characters per chunk  (default: CHUNK_SIZE)
 * @param overlap    Overlap in characters        (default: CHUNK_OVERLAP)
 */
export function chunkText(
    text: string,
    chunkSize: number = CHUNK_SIZE,
    overlap: number = CHUNK_OVERLAP
): TextChunk[] {
    const chunks: TextChunk[] = [];

    // Normalise whitespace
    const clean = text.replace(/\s+/g, ' ').trim();

    if (!clean) {
        logger.warning('chunkText received empty text');
        return chunks;
    }

    if (clean.length <= chunkSize) {
        return [{ content: clean, chunkIndex: 0, startPos: 0, endPos: clean.length }];
    }

    let start = 0;
    let idx = 0;

    while (start < clean.length && idx < MAX_CHUNKS) {
        let end = Math.min(start + chunkSize, clean.length);

        // Try to snap to the nearest sentence boundary
        if (end < clean.length) {
            const snap = Math.max(
                clean.lastIndexOf('. ', end),
                clean.lastIndexOf('! ', end),
                clean.lastIndexOf('? ', end),
                clean.lastIndexOf('\n', end)
            );
            if (snap > start) end = snap + 2;
        }

        const content = clean.slice(start, end).trim();
        if (content) {
            chunks.push({ content, chunkIndex: idx, startPos: start, endPos: end });
            idx++;
        }

        start = end - overlap;
        if (start >= clean.length) break;
    }

    if (idx >= MAX_CHUNKS) {
        logger.warning('Chunk cap reached', { maxChunks: MAX_CHUNKS });
    }

    logger.info('Chunking complete', { totalChunks: chunks.length, textLength: clean.length });
    return chunks;
}
