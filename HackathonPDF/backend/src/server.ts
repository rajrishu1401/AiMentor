/**
 * server.ts — HackathonPDF Express API
 * Endpoints:
 *   GET  /api/health
 *   POST /api/learn
 *   POST /api/cleanup
 */

import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import cors from 'cors';
import { processLearningRequest } from './services/orchestrationService';
import { deleteFromS3 } from './services/s3Service';
import { logger } from './utils/logger';
import { IntentType } from './shared/types';

// ─── App setup ────────────────────────────────────────────────────────────────

const app = express();
const PORT = Number(process.env.PORT) || 5006;

// CORS configuration for production
const corsOptions = {
    origin: [
        'http://localhost:5173', // Local development
        'http://localhost:5010', // Local production
        'http://aimentor-frontend.s3-website.ap-south-1.amazonaws.com', // S3 frontend
        'http://13.232.0.142' // EC2 public IP
    ],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// ─── Multer (memory storage) ──────────────────────────────────────────────────

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ─── GET /api/health ──────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'HackathonPDF API',
        timestamp: new Date().toISOString(),
        region: process.env.AWS_REGION || 'us-east-1',
    });
});

// ─── POST /api/learn ──────────────────────────────────────────────────────────

app.post('/api/learn', upload.single('file'), async (req: Request, res: Response) => {
    try {
        // Validate file presence
        if (!req.file) {
            return res.status(400).json({
                errorCode: 'MISSING_FILE',
                message: 'No PDF file uploaded. Please attach a file with field name "file".',
            });
        }

        // Validate prompt
        const prompt = (req.body.prompt as string | undefined)?.trim();
        if (!prompt) {
            return res.status(400).json({
                errorCode: 'MISSING_PROMPT',
                message: 'No prompt provided. Include a "prompt" field in the form data.',
            });
        }

        // Intent (default: teach)
        const validIntents: IntentType[] = ['teach', 'plan', 'quiz', 'summary'];
        const rawIntent = (req.body.intent as string | undefined)?.toLowerCase() as IntentType;
        const intent: IntentType = validIntents.includes(rawIntent) ? rawIntent : 'teach';

        const userId = (req.body.userId as string | undefined) || 'anonymous';
        const sessionId = (req.body.sessionId as string | undefined) || `session-${Date.now()}`;

        logger.info('Incoming /api/learn request', {
            file: req.file.originalname,
            bytes: req.file.size,
            intent,
            userId,
            sessionId,
            promptLen: prompt.length,
        });

        const result = await processLearningRequest({
            userId,
            sessionId,
            file: req.file.buffer,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            prompt,
            intent,
        });

        // If the orchestration returned an error object, surface it
        if ('errorCode' in result) {
            return res.status(400).json(result);
        }

        return res.json(result);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected server error';
        logger.error('Unhandled error in /api/learn', { error: message });
        return res.status(500).json({
            errorCode: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred. Please try again.',
            details: message,
        });
    }
});

// ─── POST /api/cleanup ────────────────────────────────────────────────────────

app.post('/api/cleanup', async (req: Request, res: Response) => {
    try {
        const { s3Uri } = req.body as { s3Uri?: string };

        if (!s3Uri) {
            return res.status(400).json({ error: 'Provide s3Uri in the request body.' });
        }

        // Parse s3://bucket/key
        const withoutPrefix = s3Uri.replace(/^s3:\/\//, '');
        const slashIdx = withoutPrefix.indexOf('/');
        if (slashIdx === -1) {
            return res.status(400).json({ error: 'Invalid s3Uri format.' });
        }

        const bucket = withoutPrefix.slice(0, slashIdx);
        const key = withoutPrefix.slice(slashIdx + 1);

        await deleteFromS3({ bucket, key, uri: s3Uri });

        return res.json({ success: true, message: 'Document deleted from S3.' });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('Cleanup error', { error: message });
        return res.status(500).json({ error: 'Cleanup failed.', details: message });
    }
});

// ─── Global error handler ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Global error handler', { error: err.message });
    res.status(500).json({ errorCode: 'INTERNAL_SERVER_ERROR', message: err.message });
});

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    logger.info('HackathonPDF API server started', { port: PORT });
    console.log(`\n🚀  HackathonPDF API running at http://localhost:${PORT}`);
    console.log(`📚  POST http://localhost:${PORT}/api/learn`);
    console.log(`🏥  GET  http://localhost:${PORT}/api/health\n`);
});
