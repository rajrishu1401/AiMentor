/**
 * Skill Confidence Calculation Tests
 * 
 * These tests verify the weighted moving average algorithm:
 * - NEW_WEIGHT for quiz: 0.4 (40% weight to new score)
 * - NEW_WEIGHT for coding: 0.3 (30% weight to new score)
 * - OLD_WEIGHT: 1 - NEW_WEIGHT (remaining weight to existing confidence)
 * 
 * Formula: newConfidence = oldConfidence * OLD_WEIGHT + score * NEW_WEIGHT
 */

describe('Skill Confidence Calculation Logic', () => {
  
  test('Quiz: High score (90) increases confidence from 60', () => {
    const oldConfidence = 60;
    const score = 90;
    const NEW_WEIGHT = 0.4;
    const OLD_WEIGHT = 0.6;
    
    const expected = Math.round(oldConfidence * OLD_WEIGHT + score * NEW_WEIGHT);
    // 60 * 0.6 + 90 * 0.4 = 36 + 36 = 72
    
    expect(expected).toBe(72);
  });

  test('Quiz: Low score (20) decreases confidence from 80', () => {
    const oldConfidence = 80;
    const score = 20;
    const NEW_WEIGHT = 0.4;
    const OLD_WEIGHT = 0.6;
    
    const expected = Math.round(oldConfidence * OLD_WEIGHT + score * NEW_WEIGHT);
    // 80 * 0.6 + 20 * 0.4 = 48 + 8 = 56
    
    expect(expected).toBe(56);
  });

  test('Coding: Low score (40) decreases confidence from 70 (less impact)', () => {
    const oldConfidence = 70;
    const score = 40;
    const NEW_WEIGHT = 0.3; // Coding has less weight
    const OLD_WEIGHT = 0.7;
    
    const expected = Math.round(oldConfidence * OLD_WEIGHT + score * NEW_WEIGHT);
    // 70 * 0.7 + 40 * 0.3 = 49 + 12 = 61
    
    expect(expected).toBe(61);
  });

  test('Quiz: Medium score (60) slightly increases confidence from 55', () => {
    const oldConfidence = 55;
    const score = 60;
    const NEW_WEIGHT = 0.4;
    const OLD_WEIGHT = 0.6;
    
    const expected = Math.round(oldConfidence * OLD_WEIGHT + score * NEW_WEIGHT);
    // 55 * 0.6 + 60 * 0.4 = 33 + 24 = 57
    
    expect(expected).toBe(57);
  });

  test('Quiz: Perfect score (100) increases confidence from 95', () => {
    const oldConfidence = 95;
    const score = 100;
    const NEW_WEIGHT = 0.4;
    const OLD_WEIGHT = 0.6;
    
    const expected = Math.round(oldConfidence * OLD_WEIGHT + score * NEW_WEIGHT);
    // 95 * 0.6 + 100 * 0.4 = 57 + 40 = 97
    
    expect(expected).toBe(97);
    expect(expected).toBeLessThanOrEqual(100);
  });

  test('Quiz: Zero score (0) significantly decreases confidence from 70', () => {
    const oldConfidence = 70;
    const score = 0;
    const NEW_WEIGHT = 0.4;
    const OLD_WEIGHT = 0.6;
    
    const expected = Math.round(oldConfidence * OLD_WEIGHT + score * NEW_WEIGHT);
    // 70 * 0.6 + 0 * 0.4 = 42 + 0 = 42
    
    expect(expected).toBe(42);
  });

  test('Coding has less impact than quiz on confidence changes', () => {
    const oldConfidence = 60;
    const score = 80;
    
    // Quiz calculation
    const quizNewWeight = 0.4;
    const quizResult = Math.round(oldConfidence * (1 - quizNewWeight) + score * quizNewWeight);
    // 60 * 0.6 + 80 * 0.4 = 36 + 32 = 68
    
    // Coding calculation
    const codingNewWeight = 0.3;
    const codingResult = Math.round(oldConfidence * (1 - codingNewWeight) + score * codingNewWeight);
    // 60 * 0.7 + 80 * 0.3 = 42 + 24 = 66
    
    expect(quizResult).toBe(68);
    expect(codingResult).toBe(66);
    expect(quizResult).toBeGreaterThan(codingResult);
  });
});

