import { DEMO_MODE, DEMO_ROADMAPS } from '../config/demoMode';

const API_BASE = "http://localhost:5012/api";

export const apiRequest = async (url, method = "GET", body) => {
  // Demo mode - return mock data
  if (DEMO_MODE) {
    return handleDemoRequest(url, method, body);
  }

  // Real API call
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body ? JSON.stringify(body) : null
    });

    if (!res.ok) {
      try {
        const json = await res.json();
        throw new Error(json.message || `Request failed with status ${res.status}`);
      } catch {
        throw new Error(`Request failed with status ${res.status}`);
      }
    }

    return await res.json();
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.error("Backend server is not running on port 5002");
      throw new Error("Backend server is not available. Please start the backend.");
    }
    throw error;
  }
};

// Handle demo mode requests
function handleDemoRequest(url, method, body) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`✅ Demo Mode: ${method} ${url}`);

      // Get roadmaps
      if (url === "/learning/my-roadmaps") {
        resolve({ roadmaps: DEMO_ROADMAPS });
      }

      // Create roadmap
      else if (url === "/learning/create-roadmap" && method === "POST") {
        const newRoadmap = {
          subject: body.subject || "New Subject",
          level: body.level || "Beginner",
          goals: body.goals || "",
          topics: [
            {
              title: "Getting Started",
              description: "Introduction to the subject",
              subtopics: [
                { title: "Introduction", description: "Basic introduction", completed: false },
                { title: "Setup", description: "Setup your environment", completed: false }
              ]
            }
          ]
        };
        resolve({ roadmap: newRoadmap });
      }

      // Delete roadmap
      else if (url === "/learning/delete-roadmap" && method === "POST") {
        resolve({ success: true });
      }

      // Get subtopic content (lesson)
      else if (url === "/learning/generate-subtopic-content" && method === "POST") {
        const { roadmapIndex, topicIndex, subtopicIndex } = body;

        // Get the specific subtopic from demo data
        const roadmap = DEMO_ROADMAPS[roadmapIndex];
        if (roadmap && roadmap.topics[topicIndex]) {
          const topic = roadmap.topics[topicIndex];
          if (topic.subtopics && topic.subtopics[subtopicIndex]) {
            const subtopic = topic.subtopics[subtopicIndex];

            if (subtopic.content) {
              resolve({
                content: subtopic.content.theory,
                youtubeQuery: subtopic.content.youtubeQuery,
                skills: subtopic.content.skills,
                hasQuiz: !!subtopic.quiz,
                hasCoding: false
              });
              return;
            }
          }
        }

        // Fallback content
        resolve({
          content: "This is demo content. Enable backend to see actual lesson content.",
          youtubeQuery: "programming tutorial",
          skills: ["Demo skill 1", "Demo skill 2"],
          hasQuiz: false,
          hasCoding: false
        });
      }

      // Get quiz
      else if (url === "/learning/generate-quiz" && method === "POST") {
        const { roadmapIndex, topicIndex, subtopicIndex } = body;

        // Get the specific subtopic quiz from demo data
        const roadmap = DEMO_ROADMAPS[roadmapIndex];
        if (roadmap && roadmap.topics[topicIndex]) {
          const topic = roadmap.topics[topicIndex];
          if (topic.subtopics && topic.subtopics[subtopicIndex]) {
            const subtopic = topic.subtopics[subtopicIndex];

            if (subtopic.quiz) {
              resolve({
                questions: subtopic.quiz.questions,
                hasCoding: false
              });
              return;
            }
          }
        }

        // Fallback quiz
        resolve({
          questions: [
            {
              question: "This is a demo quiz. What is 2 + 2?",
              options: ["3", "4", "5", "6"],
              correctAnswer: 1
            }
          ],
          hasCoding: false
        });
      }

      // Default response
      else {
        resolve({ success: true });
      }
    }, 300);
  });
}
