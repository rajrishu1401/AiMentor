import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Create DynamoDB client
// AWS SDK will automatically use IAM role credentials when running on EC2
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1"
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
