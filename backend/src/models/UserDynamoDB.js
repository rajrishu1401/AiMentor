import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoDb from "../config/dynamodb.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const TABLE_NAME = process.env.DYNAMODB_USERS_TABLE || "hackveda-users";

class UserDynamoDB {
  constructor(data) {
    this.userId = data.userId;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.globalSkills = data.globalSkills || [];
    this.roadmaps = data.roadmaps || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Static method: Create new user
  static async create(userData) {
    const userId = uuidv4();
    const now = new Date().toISOString();

    const user = {
      userId,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      globalSkills: userData.globalSkills || [],
      roadmaps: userData.roadmaps || [],
      createdAt: now,
      updatedAt: now
    };

    const params = {
      TableName: TABLE_NAME,
      Item: user
    };

    await dynamoDb.send(new PutCommand(params));
    return new UserDynamoDB(user);
  }

  // Static method: Find user by userId
  static async findById(userId) {
    const params = {
      TableName: TABLE_NAME,
      Key: { userId }
    };

    const result = await dynamoDb.send(new GetCommand(params));
    
    if (!result.Item) {
      return null;
    }

    return new UserDynamoDB(result.Item);
  }

  // Static method: Find user by email (using GSI)
  static async findOne(query) {
    if (query.email) {
      return await UserDynamoDB.findByEmail(query.email);
    }
    throw new Error("Only email queries are supported");
  }

  // Static method: Find user by email using GSI
  static async findByEmail(email) {
    const params = {
      TableName: TABLE_NAME,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email
      }
    };

    const result = await dynamoDb.send(new QueryCommand(params));
    
    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return new UserDynamoDB(result.Items[0]);
  }

  // Static method: Update user
  static async update(userId, updates) {
    const now = new Date().toISOString();
    
    // Build update expression dynamically
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach((key, index) => {
      const placeholder = `#attr${index}`;
      const valuePlaceholder = `:val${index}`;
      
      updateExpressions.push(`${placeholder} = ${valuePlaceholder}`);
      expressionAttributeNames[placeholder] = key;
      expressionAttributeValues[valuePlaceholder] = updates[key];
    });

    // Always update the updatedAt timestamp
    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = now;

    const params = {
      TableName: TABLE_NAME,
      Key: { userId },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW"
    };

    const result = await dynamoDb.send(new UpdateCommand(params));
    return new UserDynamoDB(result.Attributes);
  }

  // Instance method: Save current instance
  async save() {
    this.updatedAt = new Date().toISOString();

    const params = {
      TableName: TABLE_NAME,
      Item: {
        userId: this.userId,
        name: this.name,
        email: this.email,
        password: this.password,
        globalSkills: this.globalSkills.map(skill => ({
          ...skill,
          lastUpdated: skill.lastUpdated instanceof Date ? skill.lastUpdated.toISOString() : skill.lastUpdated,
          confidenceHistory: skill.confidenceHistory?.map(h => ({
            value: h.value,
            date: h.date instanceof Date ? h.date.toISOString() : h.date
          })) || []
        })),
        roadmaps: this.roadmaps,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      }
    };

    await dynamoDb.send(new PutCommand(params));
    return this;
  }

  // Instance method: Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Static method: Hash password
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  // Instance method: Select specific fields (for compatibility)
  select(fields) {
    // This is a no-op for DynamoDB, but kept for API compatibility
    return this;
  }
}

export default UserDynamoDB;
