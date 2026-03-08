import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";

// Create DynamoDB client
// If running on EC2 with IAM role, credentials are automatic
// If running locally, use AWS credentials from ~/.aws/credentials
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: fromIni()
});

// Create Document client for easier operations
const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Remove undefined values
    convertEmptyValues: false,
    convertClassInstanceToMap: true, // Convert Date objects to strings
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export default dynamoDb;
