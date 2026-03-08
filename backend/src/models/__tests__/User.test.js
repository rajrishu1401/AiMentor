import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../User.js';

describe('User Model Schema Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/hackveda-test';
    
    try {
      await mongoose.connect(mongoUri);
    } catch (error) {
      console.warn('⚠️  MongoDB not available, skipping database tests');
      console.warn('To run these tests, ensure MongoDB is running or set MONGO_TEST_URI');
    }
  });

  afterAll(async () => {
    // Clean up and disconnect
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  });

  describe('SubtopicSchema defaults', () => {
    it('should have isCoding default to false for new subtopics', () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('⏭️  Skipping test - MongoDB not connected');
        return;
      }

      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        roadmaps: [{
          subject: 'Test Subject',
          level: 'Beginner',
          topics: [{
            title: 'Test Topic',
            subtopics: [{
              title: 'Test Subtopic'
            }]
          }]
        }]
      });

      const subtopic = user.roadmaps[0].topics[0].subtopics[0];
      
      expect(subtopic.isCoding).toBe(false);
    });

    it('should have executionType field in codingChallenge schema', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('⏭️  Skipping test - MongoDB not connected');
        return;
      }

      const user = new User({
        name: 'Test User',
        email: 'test2@example.com',
        password: 'hashedpassword',
        roadmaps: [{
          subject: 'Test Subject',
          level: 'Beginner',
          topics: [{
            title: 'Test Topic',
            subtopics: [{
              title: 'Test Subtopic',
              codingChallenge: {
                problemStatement: 'Test problem',
                starterCode: 'console.log("test")',
                hint: 'Test hint',
                executionType: 'stdin',
                testCases: [
                  { input: '1', expectedOutput: '1' },
                  { input: '2', expectedOutput: '2' }
                ],
                languageId: 63
              }
            }]
          }]
        }]
      });

      await user.save();

      const savedUser = await User.findOne({ email: 'test2@example.com' });
      const challenge = savedUser.roadmaps[0].topics[0].subtopics[0].codingChallenge;
      
      expect(challenge.executionType).toBe('stdin');
      expect(challenge).toHaveProperty('executionType');
    });

    it('should allow executionType to be undefined if not provided', () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('⏭️  Skipping test - MongoDB not connected');
        return;
      }

      const user = new User({
        name: 'Test User',
        email: 'test3@example.com',
        password: 'hashedpassword',
        roadmaps: [{
          subject: 'Test Subject',
          level: 'Beginner',
          topics: [{
            title: 'Test Topic',
            subtopics: [{
              title: 'Test Subtopic',
              codingChallenge: {
                problemStatement: 'Test problem',
                starterCode: 'console.log("test")',
                hint: 'Test hint',
                testCases: [
                  { input: '1', expectedOutput: '1' }
                ],
                languageId: 63
              }
            }]
          }]
        }]
      });

      const subtopic = user.roadmaps[0].topics[0].subtopics[0];
      
      // executionType should be undefined if not provided
      expect(subtopic.codingChallenge.executionType).toBeUndefined();
    });
  });
});
