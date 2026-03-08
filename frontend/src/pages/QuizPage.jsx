import { useEffect, useState, useRef } from "react";
import { apiRequest } from "../api/api";
import ReactMarkdown from 'react-markdown';
import "./QuizPage-Enhanced.css";

export default function QuizPage({ quizData, onFinish, onBack }) {
  const { roadmapIndex, topicIndex, subtopicIndex, subtopicTitle } = quizData;

  const [subtopic, setSubtopic] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Chatbot state
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: `Hi! I'm your learning assistant. I can help you understand the quiz questions and explanations. Ask me about any question using its number (Q1, Q2, etc.)!`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesRef = useRef(null);

  // Auto-scroll chat messages
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  /* ---------------------------------------------
     LOAD QUIZ (AND CHECK IF ALREADY ATTEMPTED)
  ---------------------------------------------- */
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);

        console.log("📝 Generating quizzes...");

        // 1️⃣ Ensure quizzes exist (generate if missing)
        await apiRequest(
          "/learning/generate-quizzes",
          "POST",
          {
            roadmapIndex,
            topicIndex,
            subtopicIndex
          }
        );

        console.log("📚 Fetching subtopic data...");

        // 2️⃣ Fetch subtopic with quizzes + attempts
        const res = await apiRequest(
          `/learning/my-subtopics?roadmapIndex=${roadmapIndex}&topicIndex=${topicIndex}`
        );

        console.log("✅ Subtopics response:", res);
        console.log("📊 Subtopics array:", res.subtopics);
        console.log("🎯 Current subtopic index:", subtopicIndex);

        const currentSubtopic = res.subtopics[subtopicIndex];
        console.log("📖 Current subtopic:", currentSubtopic);
        console.log("❓ Quizzes:", currentSubtopic.quizzes);
        console.log("📝 Quiz attempts:", currentSubtopic.quizAttempts);

        setSubtopic(currentSubtopic);

        // 3️⃣ Check if already attempted
        if (currentSubtopic.quizAttempts && currentSubtopic.quizAttempts.length > 0) {
          setSubmitted(true);

          const total = currentSubtopic.quizAttempts.reduce(
            (sum, a) => sum + a.score,
            0
          );
          setScore(total);
        }

      } catch (err) {
        console.error("❌ Failed to load quiz:", err);
        alert("Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, []);

  /* ---------------------------------------------
     HANDLE OPTION SELECT
  ---------------------------------------------- */
  const selectOption = (quizIndex, optionIndex) => {
    if (submitted) return;

    setAnswers(prev => ({
      ...prev,
      [quizIndex]: optionIndex
    }));
  };

  /* ---------------------------------------------
     SUBMIT QUIZ (ONE TIME)
  ---------------------------------------------- */
  const submitQuiz = async () => {
    if (Object.keys(answers).length !== subtopic.quizzes.length) {
      alert("Please answer all questions");
      return;
    }

    try {
      setSubmitting(true);

      const res = await apiRequest(
        "/learning/submit-quiz",
        "POST",
        {
          roadmapIndex,
          topicIndex,
          subtopicIndex,
          answers: Object.values(answers)
        }
      );

      setScore(res.score);
      setFeedback(res.feedback);
      setSubmitted(true);

      // Reload subtopic to get stored attempts
      const reload = await apiRequest(
        `/learning/my-subtopics?roadmapIndex=${roadmapIndex}&topicIndex=${topicIndex}`
      );

      setSubtopic(reload.subtopics[subtopicIndex]);

    } catch (err) {
      console.error("❌ Quiz submission failed:", err);
      alert("Quiz submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------
     CHATBOT FUNCTIONS
  ---------------------------------------------- */
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { type: 'user', text: chatInput };
    setMessages(prev => [...prev, userMessage]);

    const inputText = chatInput;
    setChatInput('');

    const loadingMessage = { type: 'bot', text: '...' };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await apiRequest('/learning/learning-chat', 'POST', {
        message: inputText,
        sessionId: `quiz-${roadmapIndex}-${topicIndex}-${subtopicIndex}`,
        learningContext: {
          subtopicTitle,
          quizzes: subtopic?.quizzes || [],
          currentPage: 'quiz'
        }
      });

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          type: 'bot',
          text: response.reply || 'Sorry, I could not generate a response.'
        };
        return newMessages;
      });
    } catch (error) {
      console.error('Learning Assistant error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          type: 'bot',
          text: 'Sorry, I encountered an error. Please try again.'
        };
        return newMessages;
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (text) => {
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.split('\n');
        const firstLine = lines[0].replace('```', '').trim();
        const language = firstLine || 'code';
        const codeContent = lines.slice(1, -1).join('\n');

        return (
          <div key={index} className="chat-code-block">
            <div className="chat-code-header">{language}</div>
            <pre className="chat-code-content">{codeContent}</pre>
          </div>
        );
      }

      return (
        <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
          {part}
        </span>
      );
    });
  };

  /* ---------------------------------------------
     UI STATES
  ---------------------------------------------- */
  if (loading) {
    return (
      <div className="quiz-page">
        <div className="quiz-loading">Loading quiz...</div>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      {/* Header */}
      <div className="quiz-header">
        <div className="quiz-header-left">
          <button className="btn-back" onClick={onBack}>
            ← Back
          </button>
          <h1 className="quiz-title">Quiz: {subtopicTitle}</h1>
        </div>
        <button
          className={`btn-ai-assistant ${showChatbot ? 'active' : ''} ${!submitted ? 'disabled' : ''}`}
          onClick={() => submitted && setShowChatbot(!showChatbot)}
          disabled={!submitted}
          title={!submitted ? "Complete the quiz to unlock AI Assistant" : "Chat with AI Assistant"}
        >
          🤖 AI Assistant {!submitted && '🔒'}
        </button>
      </div>

      {/* Main Content with Chatbot */}
      <div className={`quiz-main ${showChatbot ? 'with-chatbot' : ''}`}>
        {/* Questions Container */}
        <div className="questions-wrapper">
          <div className="questions-container">
            {subtopic.quizzes.map((quiz, qIndex) => {
              const attempt = subtopic.quizAttempts?.find(
                a => a.quizIndex === qIndex
              );

              return (
                <div key={qIndex} className="question-card">
                  <p className="question-text">
                    <span className="question-number">Q{qIndex + 1}.</span> {quiz.question}
                  </p>

                  <div className="options-list">
                    {quiz.options.map((opt, oIndex) => {
                      const selected =
                        submitted
                          ? attempt?.selectedOptionIndex === oIndex
                          : answers[qIndex] === oIndex;

                      const isCorrect = submitted && attempt?.isCorrect && selected;
                      const isIncorrect = submitted && !attempt?.isCorrect && selected;

                      let labelClass = "option-label";
                      if (submitted) labelClass += " disabled";
                      if (selected) labelClass += " selected";
                      if (isCorrect) labelClass += " correct";
                      if (isIncorrect) labelClass += " incorrect";

                      return (
                        <label
                          key={oIndex}
                          className={labelClass}
                          onClick={() => !submitted && selectOption(qIndex, oIndex)}
                        >
                          <div className="option-radio"></div>
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Feedback after submission */}
                  {submitted && (
                    <div className="question-feedback">
                      <p className={`feedback-status ${attempt?.isCorrect ? 'correct' : 'incorrect'}`}>
                        {attempt?.isCorrect ? "✅ Correct" : "❌ Incorrect"}
                      </p>
                      <p className="feedback-explanation">
                        <strong>Explanation:</strong> {quiz.explanation}
                      </p>
                      <p className="feedback-score">
                        Score: {attempt?.score || 0} points
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          {!submitted && (!subtopic.quizAttempts || subtopic.quizAttempts.length === 0) ? (
            <div className="quiz-actions">
              <button
                className="btn-submit-quiz"
                onClick={submitQuiz}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            </div>
          ) : (
            <>
              <div className="quiz-results">
                <h3 className="results-title">Quiz Complete!</h3>
                <div className="results-score">{score}</div>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>Total Score</p>

                {feedback && (
                  <div className="results-feedback">
                    <h4>AI Evaluator Feedback</h4>
                    <p>{feedback}</p>
                  </div>
                )}
              </div>

              <div className="quiz-actions">
                <button
                  className="btn-next-step"
                  onClick={async () => {
                    // Check if coding is needed
                    if (!subtopic.isCoding) {
                      // No coding needed, go to next subtopic
                      onFinish(false);
                      return;
                    }

                    // Coding needed, generate/fetch challenge
                    try {
                      const res = await apiRequest(
                        "/learning/generate-coding-challenge",
                        "POST",
                        {
                          roadmapIndex,
                          topicIndex,
                          subtopicIndex
                        }
                      );

                      onFinish(res.isCoding);
                    } catch (err) {
                      console.error("Failed to prepare coding challenge:", err);
                      const errorMessage = err.response?.data?.error || "Failed to prepare coding challenge";
                      alert(`${errorMessage}\n\nPlease try again.`);
                    }
                  }}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Chatbot Drawer - Only show if submitted */}
        {showChatbot && submitted && (
          <div className="chatbot-drawer">
            <div className="chatbot-header">
              <h3>🤖 Learning Assistant</h3>
              <button
                className="chatbot-close"
                onClick={() => setShowChatbot(false)}
              >
                ✕
              </button>
            </div>

            <div className="chatbot-messages" ref={chatMessagesRef}>
              {messages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.type}`}>
                  <div className="message-content">
                    {formatMessageContent(msg.text)}
                  </div>
                </div>
              ))}
            </div>

            <div className="chatbot-input-area">
              <textarea
                className="chatbot-input"
                placeholder="Ask about any question (e.g., 'Explain Q2')..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={2}
              />
              <button
                className="chatbot-send"
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
