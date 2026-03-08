import { parseQuizText } from '../parseQuizText.js';

describe('parseQuizText', () => {
  test('Parses correctly formatted quiz text', () => {
    const text = `Q1: Which of the following problems is most suitable for a recursive solution?
A) Finding the maximum value in an array
B) Calculating the factorial of a number
C) Sorting an array using bubble sort
D) Performing a binary search on a sorted array
ANSWER: B
EXPLANATION: Calculating the factorial of a number naturally lends itself to a recursive solution where the problem is broken down into smaller subproblems.
SKILLS: Problem identification, recursion application

Q2: What is a common pitfall to avoid when implementing recursion?
A) Using loops instead of recursive calls
B) Forgetting to include a base case
C) Using too many variables
D) Writing long functions
ANSWER: B
EXPLANATION: Forgetting to include a base case can lead to infinite recursion and stack overflow.
SKILLS: Recursion implementation, error avoidance`;

    const quizzes = parseQuizText(text);

    expect(quizzes).toHaveLength(2);
    
    // First quiz
    expect(quizzes[0].question).toBe('Which of the following problems is most suitable for a recursive solution?');
    expect(quizzes[0].options).toHaveLength(4);
    expect(quizzes[0].correctOptionIndex).toBe(1); // B
    expect(quizzes[0].explanation).toContain('factorial');
    expect(quizzes[0].skillsTested).toContain('Problem identification');
    
    // Second quiz
    expect(quizzes[1].question).toBe('What is a common pitfall to avoid when implementing recursion?');
    expect(quizzes[1].correctOptionIndex).toBe(1); // B
  });

  test('Parses quiz text without blank lines between questions', () => {
    const text = `Q1: What is recursion?
A) A loop
B) A function calling itself
C) An array
D) A variable
ANSWER: B
EXPLANATION: Recursion is when a function calls itself.
SKILLS: Recursion basics
Q2: What is a base case?
A) The first case
B) The stopping condition
C) The last case
D) The error case
ANSWER: B
EXPLANATION: A base case is the stopping condition for recursion.
SKILLS: Base case understanding`;

    const quizzes = parseQuizText(text);

    expect(quizzes).toHaveLength(2);
    expect(quizzes[0].question).toBe('What is recursion?');
    expect(quizzes[1].question).toBe('What is a base case?');
  });

  test('Handles lowercase answer letters', () => {
    const text = `Q1: Test question?
A) Option A
B) Option B
C) Option C
D) Option D
ANSWER: c
EXPLANATION: Test explanation
SKILLS: Test skill`;

    const quizzes = parseQuizText(text);

    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].correctOptionIndex).toBe(2); // C
  });

  test('Skips malformed questions and continues parsing', () => {
    const text = `Q1: Valid question?
A) Option A
B) Option B
C) Option C
D) Option D
ANSWER: A
EXPLANATION: Valid explanation
SKILLS: Valid skill

Q2: Missing options?
ANSWER: B
EXPLANATION: This should be skipped
SKILLS: Invalid

Q3: Another valid question?
A) Option A
B) Option B
C) Option C
D) Option D
ANSWER: D
EXPLANATION: Another valid explanation
SKILLS: Another skill`;

    const quizzes = parseQuizText(text);

    expect(quizzes).toHaveLength(2);
    expect(quizzes[0].question).toBe('Valid question?');
    expect(quizzes[1].question).toBe('Another valid question?');
  });

  test('Throws error when no valid questions found', () => {
    const text = `This is not a valid quiz format
Just some random text
No questions here`;

    expect(() => parseQuizText(text)).toThrow('No valid quiz questions generated');
  });

  test('Handles questions with extra whitespace', () => {
    const text = `
    Q1:    What is recursion?    
    A)   A loop   
    B)   A function calling itself   
    C)   An array   
    D)   A variable   
    ANSWER:   B   
    EXPLANATION:   Recursion is when a function calls itself.   
    SKILLS:   Recursion basics   
    `;

    const quizzes = parseQuizText(text);

    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].question).toBe('What is recursion?');
    expect(quizzes[0].options[0]).toBe('A loop');
  });

  test('Handles missing skills line', () => {
    const text = `Q1: Test question?
A) Option A
B) Option B
C) Option C
D) Option D
ANSWER: A
EXPLANATION: Test explanation`;

    const quizzes = parseQuizText(text);

    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].skillsTested).toEqual([]);
  });

  test('Handles missing explanation line', () => {
    const text = `Q1: Test question?
A) Option A
B) Option B
C) Option C
D) Option D
ANSWER: A
SKILLS: Test skill`;

    const quizzes = parseQuizText(text);

    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].explanation).toBe('Explanation unavailable.');
  });
});
