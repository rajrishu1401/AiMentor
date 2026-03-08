import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import User from '../UserDynamoDB.js';

describe('UserDynamoDB Model Tests', () => {
  let testUserId;

  beforeAll(async () => {
    // Note: These tests require AWS credentials and DynamoDB table to be set up
    console.log('Testing DynamoDB User model');
  });

  afterAll(async () => {
    // Cleanup test data if needed
    if (testUserId) {
      // In production, you might want to delete test users
      console.log(`Test user created: ${testUserId}`);
    }
  });

  it('should create a new user', async () => {
    const userData = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'hashedpassword123'
    };

    const user = await User.create(userData);

    expect(user).toBeDefined();
    expect(user.userId).toBeDefined();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    expect(user.globalSkills).toEqual([]);
    expect(user.roadmaps).toEqual([]);

    testUserId = user.userId;
  });

  it('should find user by userId', async () => {
    if (!testUserId) {
      console.log('Skipping: No test user created');
      return;
    }

    const user = await User.findById(testUserId);
    expect(user).toBeDefined();
    expect(user.userId).toBe(testUserId);
  });

  it('should find user by email', async () => {
    if (!testUserId) {
      console.log('Skipping: No test user created');
      return;
    }

    const user = await User.findById(testUserId);
    const foundUser = await User.findByEmail(user.email);
    
    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe(user.email);
    expect(foundUser.userId).toBe(testUserId);
  });

  it('should update user data', async () => {
    if (!testUserId) {
      console.log('Skipping: No test user created');
      return;
    }

    const updates = {
      name: 'Updated Test User'
    };

    const updatedUser = await User.update(testUserId, updates);
    
    expect(updatedUser).toBeDefined();
    expect(updatedUser.name).toBe(updates.name);
  });

  it('should save user instance', async () => {
    if (!testUserId) {
      console.log('Skipping: No test user created');
      return;
    }

    const user = await User.findById(testUserId);
    user.name = 'Instance Updated Name';
    
    const savedUser = await user.save();
    
    expect(savedUser).toBeDefined();
    expect(savedUser.name).toBe('Instance Updated Name');
  });
});
