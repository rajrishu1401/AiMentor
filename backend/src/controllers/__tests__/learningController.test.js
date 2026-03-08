import { describe, it, expect } from '@jest/globals';

describe('Coding Decision Logic', () => {
  describe('Keyword detection for isCoding', () => {
    const implementationKeywords = [
      'implement',
      'build',
      'write',
      'algorithm',
      'function',
      'program'
    ];

    const theoreticalTitles = [
      'Introduction to Arrays',
      'Understanding Data Structures',
      'Overview of Sorting Techniques',
      'Comparison of Search Methods',
      'History of Computer Science'
    ];

    const codingTitles = [
      'Implement Binary Search',
      'Build a Linked List',
      'Write a Sorting Algorithm',
      'Algorithm Implementation',
      'Function to Calculate Fibonacci',
      'Program to Reverse a String'
    ];

    it('should detect implementation keywords in subtopic titles', () => {
      codingTitles.forEach(title => {
        const lowerTitle = title.toLowerCase();
        const hasKeyword = implementationKeywords.some(k => lowerTitle.includes(k));
        
        expect(hasKeyword).toBe(true);
      });
    });

    it('should not detect implementation keywords in theoretical titles', () => {
      theoreticalTitles.forEach(title => {
        const lowerTitle = title.toLowerCase();
        const hasKeyword = implementationKeywords.some(k => lowerTitle.includes(k));
        
        expect(hasKeyword).toBe(false);
      });
    });

    it('should handle case-insensitive keyword matching', () => {
      const titles = [
        'IMPLEMENT a stack',
        'Build A Queue',
        'Write An Algorithm'
      ];

      titles.forEach(title => {
        const lowerTitle = title.toLowerCase();
        const hasKeyword = implementationKeywords.some(k => lowerTitle.includes(k));
        
        expect(hasKeyword).toBe(true);
      });
    });
  });
});
