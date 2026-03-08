/**
 * agentService.ts
 * Invokes an Amazon Bedrock Agent and streams the response back as a string.
 */

import {
    InvokeAgentCommand,
    InvokeAgentCommandInput,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { createBedrockAgentRuntimeClient } from '../config/aws';
import { DocumentChunk, IntentType, LearningOutput, SourceReference, OutputType } from '../shared/types';
import { BEDROCK_MODEL_ID, AGENT_INVOCATION_TIMEOUT } from '../shared/constants';
import { logger } from '../utils/logger';

const INTENT_PROMPTS: Record<IntentType, string> = {
    teach: `INTENT: Teach / Explain
Format your response as a clear, beginner-friendly lesson:
- Break complex concepts into simple explanations
- Use examples drawn directly from the document
- Step-by-step breakdown where appropriate
- Use headers (##) and bullet points for readability`,

    plan: `INTENT: Create a Structured Learning Plan
Format your response as a detailed study roadmap:
- Divide content into logical learning phases
- Suggest a realistic timeline (days / weeks)
- List prerequisites and dependencies
- Include milestones and self-assessment checkpoints`,

    quiz: `INTENT: Generate a Quiz
Format your response as a practice quiz:
- 10 multiple-choice questions (A / B / C / D)
- Provide the correct answer and a brief explanation for each
- Range from foundational to advanced difficulty
- Base every question strictly on the document content`,

    summary: `INTENT: Summarise
Format your response as a concise, structured summary:
- Bullet-point the most important topics
- Define key terms and concepts
- Note critical exam / interview topics if applicable
- Keep each bullet point tight and actionable`,
};

export class AgentService {
    private agentId: string;
    private agentAliasId: string;

    constructor() {
        this.agentId = process.env.BEDROCK_AGENT_ID ?? '';
        this.agentAliasId = process.env.BEDROCK_AGENT_ALIAS ?? '';

        if (!this.agentId) logger.warning('BEDROCK_AGENT_ID is not set');
        if (!this.agentAliasId) logger.warning('BEDROCK_AGENT_ALIAS is not set');
    }

    // ─────────────────────────────────────────────────────────────────────────

    async generateLearning(
        requestId: string,
        prompt: string,
        chunks: DocumentChunk[],
        intent: IntentType
    ): Promise<LearningOutput> {
        const t0 = Date.now();

        logger.info('Agent invocation starting', {
            requestId,
            agentId: this.agentId,
            intent,
            chunks: chunks.length,
        });

        const context = this.buildContext(chunks);
        const agentInput = this.buildPrompt(prompt, context, intent);

        // AWS Bedrock Agent sessionId must be alphanumeric only — strip hyphens from UUID
        const sessionId = requestId.replace(/-/g, '');
        const rawResponse = await this.invokeAgent(agentInput, sessionId);

        const processingTimeMs = Date.now() - t0;

        const output = this.buildOutput(requestId, rawResponse, chunks, intent, processingTimeMs);

        logger.info('Agent invocation complete', {
            requestId,
            processingTimeMs,
            type: output.type,
            responseChars: rawResponse.length,
        });

        return output;
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    private async invokeAgent(inputText: string, sessionId: string): Promise<string> {
        const client = createBedrockAgentRuntimeClient();

        const params: InvokeAgentCommandInput = {
            agentId: this.agentId,
            agentAliasId: this.agentAliasId,
            sessionId,
            inputText,
        };

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Bedrock Agent invocation timed out')), AGENT_INVOCATION_TIMEOUT)
        );

        const invokePromise = client.send(new InvokeAgentCommand(params));

        const response = await Promise.race([invokePromise, timeoutPromise]);

        let fullText = '';
        if (response.completion) {
            for await (const event of response.completion) {
                if (event.chunk?.bytes) {
                    fullText += new TextDecoder('utf-8').decode(event.chunk.bytes);
                }
            }
        }

        if (!fullText) {
            throw new Error('Bedrock Agent returned an empty response');
        }

        return fullText;
    }

    private buildContext(chunks: DocumentChunk[]): string {
        return chunks
            .map((c, i) =>
                `[SOURCE ${i + 1} | chunk-${c.chunkIndex} | score: ${c.score.toFixed(3)}]\n${c.content}`
            )
            .join('\n\n---\n\n');
    }

    private buildPrompt(userPrompt: string, context: string, intent: IntentType): string {
        return `You are an expert AI Mentor. Use ONLY the context below—do not use external knowledge.

${INTENT_PROMPTS[intent]}

═══════════════════════════════════════════
DOCUMENT CONTEXT:
${context}
═══════════════════════════════════════════

USER REQUEST:
${userPrompt}

Respond now following the intent instructions above.`;
    }

    private buildOutput(
        requestId: string,
        content: string,
        chunks: DocumentChunk[],
        intent: IntentType,
        processingTimeMs: number
    ): LearningOutput {
        const sourceReferences: SourceReference[] = chunks.map((c) => ({
            chunkIndex: c.chunkIndex,
            excerpt: c.content.slice(0, 160) + (c.content.length > 160 ? '…' : ''),
            relevanceScore: c.score,
        }));

        return {
            requestId,
            type: intent as OutputType,
            content,
            sourceReferences,
            generationTimestamp: new Date(),
            metadata: {
                chunksRetrieved: chunks.length,
                tokensGenerated: Math.ceil(content.length / 4),
                modelVersion: BEDROCK_MODEL_ID,
                processingTimeMs,
            },
        };
    }
}
