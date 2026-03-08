import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
// MongoDB connection removed - now using DynamoDB
// import connectDB from "./src/config/db.js";

const PORT = process.env.PORT || 5012;

const startServer = async () => {
  try {
    // DynamoDB doesn't require connection setup - uses AWS SDK
    console.log("✅ Using DynamoDB for data storage");
    console.log(`📊 Table: ${process.env.DYNAMODB_USERS_TABLE}`);
    console.log(`🌍 Region: ${process.env.AWS_REGION}`);
    
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server failed to start", err);
  }
};

startServer();
