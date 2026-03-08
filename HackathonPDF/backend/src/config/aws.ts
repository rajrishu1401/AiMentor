/**
 * AWS SDK client factory for HackathonPDF
 * Reads credentials from environment variables / IAM role
 */

import { S3Client } from '@aws-sdk/client-s3';
import { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { AWS_REGION } from '../shared/constants';

function buildCredentials() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (accessKeyId && secretAccessKey) {
        return { credentials: { accessKeyId, secretAccessKey } };
    }

    // Fall back to IAM role / credential chain
    return {};
}

export function createS3Client(): S3Client {
    return new S3Client({
        region: process.env.AWS_REGION || AWS_REGION,
        ...buildCredentials(),
    });
}

export function createBedrockAgentRuntimeClient(): BedrockAgentRuntimeClient {
    return new BedrockAgentRuntimeClient({
        region: process.env.AWS_REGION || AWS_REGION,
        ...buildCredentials(),
    });
}

export function createBedrockRuntimeClient(): BedrockRuntimeClient {
    return new BedrockRuntimeClient({
        region: process.env.AWS_REGION || AWS_REGION,
        ...buildCredentials(),
    });
}
