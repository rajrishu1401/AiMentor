/**
 * s3Service.ts
 * Handles upload and deletion of PDF files in Amazon S3.
 */

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { createS3Client } from '../config/aws';
import { S3Location } from '../shared/types';
import { S3_BUCKET_NAME, S3_UPLOAD_TIMEOUT } from '../shared/constants';
import { logger } from '../utils/logger';

/**
 * Upload a PDF buffer to S3 under a UUID key, returning the S3 location.
 */
export async function uploadToS3(
    buffer: Buffer,
    fileName: string,
    userId: string,
    mimeType: string
): Promise<S3Location> {
    const s3 = createS3Client();
    const documentId = uuidv4();
    const key = `uploads/${documentId}.pdf`;
    const bucket = S3_BUCKET_NAME;

    logger.info('S3 upload starting', { userId, fileName, bytes: buffer.length, key });

    const upload = s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
            Metadata: {
                originalFileName: encodeURIComponent(fileName),
                userId,
                uploadedAt: new Date().toISOString(),
            },
        })
    );

    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('S3 upload timeout')), S3_UPLOAD_TIMEOUT)
    );

    await Promise.race([upload, timeout]);

    const location: S3Location = { bucket, key, uri: `s3://${bucket}/${key}` };
    logger.info('S3 upload complete', { uri: location.uri });
    return location;
}

/**
 * Delete a file from S3. Errors are logged but not re-thrown so they
 * do not disrupt the main request flow.
 */
export async function deleteFromS3(location: S3Location): Promise<void> {
    const s3 = createS3Client();

    try {
        logger.info('S3 delete starting', { uri: location.uri });
        await s3.send(new DeleteObjectCommand({ Bucket: location.bucket, Key: location.key }));
        logger.info('S3 delete complete', { uri: location.uri });
    } catch (err) {
        logger.error('S3 delete failed (non-fatal)', {
            uri: location.uri,
            error: err instanceof Error ? err.message : String(err),
        });
    }
}
