// Demo mode flag - set to true to use mock data without backend
export const DEMO_MODE = false;

// Mock user data
export const DEMO_USER = {
    name: "Demo User",
    email: "demo@codementor.ai",
    token: "demo_token_12345"
};

// Mock roadmaps data
export const DEMO_ROADMAPS = [
    {
        subject: "Java",
        level: "Advanced",
        goals: "Master advanced Java concepts",
        topics: [
            {
                title: "Advanced Java Language Features",
                description: "Learn Advanced Java Language Features",
                subtopics: [
                    {
                        title: "Concurrency and multithreading",
                        description: "Learn about Concurrency and multithreading in detail",
                        completed: false,
                        content: {
                            theory: `Concurrency and multithreading in Java allow multiple threads to run concurrently, improving the performance of applications by utilizing the full capacity of multi-core processors. Java provides built-in support for multithreading through the java.lang.Thread class and the java.util.concurrent package. Key concepts include thread creation, synchronization, thread communication, and the use of Executors, Callables, and Futures for managing thread pools and asynchronous tasks. Advanced topics cover the use of locks, semaphores, and the Fork/Join framework for parallel processing.

Watch more`,
                            youtubeQuery: "Java concurrency and multithreading tutorial",
                            skills: [
                                "Implementing multithreading using java.lang.Thread",
                                "Using java.util.concurrent package for advanced concurrency",
                                "Applying synchronization techniques to avoid race conditions",
                                "Managing thread pools with Executors and Callables",
                                "Utilizing locks, semaphores, and the Fork/Join framework"
                            ]
                        },
                        quiz: {
                            questions: [
                                {
                                    question: "In the context of multithreading, what is the primary advantage of using threads over processes?",
                                    options: [
                                        "Threads require less memory",
                                        "Threads are faster to create and destroy",
                                        "Threads can share data more easily",
                                        "All of the above"
                                    ],
                                    correctAnswer: 3
                                },
                                {
                                    question: "Which of the following is a common challenge when dealing with multithreaded applications?",
                                    options: [
                                        "Increased memory usage",
                                        "Difficulty in debugging",
                                        "Higher CPU utilization",
                                        "Reduced I/O operations"
                                    ],
                                    correctAnswer: 1
                                },
                                {
                                    question: "What is a race condition in the context of multithreading?",
                                    options: [
                                        "A condition where multiple threads execute in a specific order",
                                        "A condition where the output depends on the sequence of thread execution",
                                        "A condition where threads are waiting for each other to finish",
                                        "A condition where threads are executing independently"
                                    ],
                                    correctAnswer: 1
                                },
                                {
                                    question: "Which synchronization mechanism is used to ensure that only one thread can access a critical section of code at a time?",
                                    options: [
                                        "Semaphore",
                                        "Mutex",
                                        "Condition variable",
                                        "Monitor"
                                    ],
                                    correctAnswer: 3
                                },
                                {
                                    question: "In Java, which keyword is used to declare a method that can be accessed concurrently by multiple threads?",
                                    options: [
                                        "synchronized",
                                        "concurrent",
                                        "threadsafe",
                                        "volatile"
                                    ],
                                    correctAnswer: 0
                                }
                            ]
                        }
                    },
                    {
                        title: "Java Memory Model",
                        description: "Learn about Java Memory Model in detail",
                        completed: false
                    }
                ]
            }
        ]
    },
    {
        subject: "Python",
        level: "Beginner",
        goals: "Learn Python fundamentals",
        topics: [
            {
                title: "Python Basics",
                description: "Learn Python Basics",
                subtopics: [
                    {
                        title: "Variables and Data Types",
                        description: "Understanding Python variables and data types",
                        completed: false,
                        content: {
                            theory: `Python is a dynamically typed language, which means you don't need to declare variable types explicitly. Variables are created when you assign a value to them.

## Basic Data Types

1. **Numbers**: int, float, complex
2. **Strings**: Text data enclosed in quotes
3. **Booleans**: True or False
4. **Lists**: Ordered, mutable collections
5. **Tuples**: Ordered, immutable collections
6. **Dictionaries**: Key-value pairs

## Example

\`\`\`python
# Numbers
age = 25
price = 19.99
complex_num = 3 + 4j

# Strings
name = "Alice"
message = 'Hello, World!'

# Boolean
is_active = True

# Lists
numbers = [1, 2, 3, 4, 5]

# Dictionary
person = {"name": "Bob", "age": 30}
\`\`\``,
                            youtubeQuery: "Python variables and data types tutorial",
                            skills: [
                                "Understanding Python data types",
                                "Working with variables",
                                "Type conversion",
                                "Using lists and dictionaries"
                            ]
                        },
                        quiz: {
                            questions: [
                                {
                                    question: "Which of the following is a mutable data type in Python?",
                                    options: ["Tuple", "String", "List", "Integer"],
                                    correctAnswer: 2
                                },
                                {
                                    question: "What is the output of: type(3.14)?",
                                    options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'number'>"],
                                    correctAnswer: 1
                                },
                                {
                                    question: "How do you create a dictionary in Python?",
                                    options: [
                                        "[]",
                                        "()",
                                        "{}",
                                        "<>"
                                    ],
                                    correctAnswer: 2
                                }
                            ]
                        }
                    },
                    {
                        title: "Control Flow",
                        description: "If statements, loops, and control structures",
                        completed: false
                    }
                ]
            }
        ]
    }
];

// Mock lesson data
export const DEMO_LESSON = {
    title: "Array Basics",
    content: `
# Introduction to Arrays

Arrays are one of the most fundamental data structures in computer science. They store elements in contiguous memory locations, allowing for efficient access and manipulation.

## Key Concepts

1. **Fixed Size**: Arrays have a predetermined size
2. **Index-based Access**: Elements are accessed using indices (0-based)
3. **Homogeneous**: All elements are of the same type

## Time Complexity

- Access: O(1)
- Search: O(n)
- Insertion: O(n)
- Deletion: O(n)

## Example

\`\`\`javascript
// Creating an array
const numbers = [1, 2, 3, 4, 5];

// Accessing elements
console.log(numbers[0]); // 1

// Modifying elements
numbers[2] = 10;

// Iterating
for (let i = 0; i < numbers.length; i++) {
  console.log(numbers[i]);
}
\`\`\`
  `,
    hasQuiz: true,
    hasCoding: true
};

// Mock quiz data
export const DEMO_QUIZ = {
    questions: [
        {
            question: "What is the time complexity of accessing an element in an array?",
            options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
            correctAnswer: 0
        },
        {
            question: "Arrays in JavaScript are:",
            options: ["Fixed size", "Dynamic size", "Immutable", "None of the above"],
            correctAnswer: 1
        },
        {
            question: "What is the index of the first element in an array?",
            options: ["1", "0", "-1", "Depends on language"],
            correctAnswer: 1
        }
    ]
};

// Mock coding challenge
export const DEMO_CODING = {
    title: "Find Maximum Element",
    description: "Write a function that finds the maximum element in an array.",
    starterCode: `function findMax(arr) {
  // Your code here
  
}

// Test cases
console.log(findMax([1, 5, 3, 9, 2])); // Should return 9
console.log(findMax([-1, -5, -3])); // Should return -1`,
    solution: `function findMax(arr) {
  if (arr.length === 0) return null;
  
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}`
};
