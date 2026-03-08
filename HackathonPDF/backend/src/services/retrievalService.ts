/**
 * retrievalService.ts
 * Keyword-based semantic retrieval: scores each chunk against the query
 * and returns the top-K most relevant chunks.
 */

import { TextChunk } from './chunkService';
import { TOP_K_CHUNKS } from '../shared/constants';
import { DocumentChunk } from '../shared/types';
import { logger } from '../utils/logger';

/**
 * Score chunks by term-frequency against query terms.
 * Returns top-K DocumentChunks sorted by score descending.
 */
export function retrieveTopChunks(
    chunks: TextChunk[],
    query: string,
    topK: number = TOP_K_CHUNKS
): DocumentChunk[] {
    // Build query terms (ignore short stop-words)
    const terms = query
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 2);

    if (terms.length === 0) {
        logger.warning('No usable query terms; falling back to first chunks');
        return chunks.slice(0, topK).map(toDocumentChunk);
    }

    // Score every chunk
    const scored = chunks.map((chunk) => {
        const lower = chunk.content.toLowerCase();
        let score = 0;
        for (const term of terms) {
            // Escape regex special chars
            const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const hits = lower.match(new RegExp(`\\b${safe}\\b`, 'g'));
            if (hits) score += hits.length;
        }
        return { chunk, rawScore: score };
    });

    // Sort descending
    scored.sort((a, b) => b.rawScore - a.rawScore);

    // If nothing matched, fall back to first chunks
    const relevant = scored.filter((s) => s.rawScore > 0);
    const selected = (relevant.length > 0 ? relevant : scored).slice(0, topK);

    // Normalise scores to [0, 1]
    const maxScore = selected[0]?.rawScore || 1;

    const result: DocumentChunk[] = selected.map(({ chunk, rawScore }) => ({
        content: chunk.content,
        score: parseFloat((rawScore / maxScore).toFixed(4)),
        chunkIndex: chunk.chunkIndex,
        sourceLocation: `chunk-${chunk.chunkIndex}`,
        metadata: { pageNumber: 0, documentId: '' },
    }));

    logger.info('Retrieval complete', { topK: result.length, topScore: result[0]?.score ?? 0 });
    return result;
}

/** Convert a raw TextChunk to a DocumentChunk with default score */
function toDocumentChunk(chunk: TextChunk): DocumentChunk {
    return {
        content: chunk.content,
        score: 0.5,
        chunkIndex: chunk.chunkIndex,
        sourceLocation: `chunk-${chunk.chunkIndex}`,
        metadata: { pageNumber: 0, documentId: '' },
    };
}
