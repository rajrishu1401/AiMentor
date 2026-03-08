import { useEffect, useState, useRef } from "react";
import { apiRequest } from "../api/api";
import { parseProblemStatement } from "../utils/problemStatementParser";
import "./CodingPage.css";

export default function CodingPage({ codingData, onFinish }) {
  const { roadmapIndex, topicIndex, subtopicIndex, subtopicTitle } = codingData;

  // State
  const [subtopic, setSubtopic] = useState(null);
  const [parsedProblem, setParsedProblem] = useState(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [locked, setLocked] = useState(false);
  
  // UI State
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState(14);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [problemTab, setProblemTab] = useState('description'); // 'description', 'submissions'
  const [testResultTab, setTestResultTab] = useState('testcase'); // 'testcase', 'result'
  const [showChatbot, setShowChatbot] = useState(false);
  
  // Panel widths
  const [problemWidth, setProblemWidth] = useState(45);
  const [chatbotWidth, setChatbotWidth] = useState(20);
  const [testResultHeight, setTestResultHeight] = useState(250);
  
  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState(null);
  
  // Chatbot State
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: `Hi! I'm your coding assistant. I can help you with hints, explanations, and debugging tips for this problem!`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const chatMessagesRef = useRef(null);
  const recognitionRef = useRef(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Auto-scroll chat messages
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  /* ------------------------------------
     LOAD CODING CHALLENGE
  ------------------------------------ */
  useEffect(() => {
    const loadChallenge = async () => {
      const res = await apiRequest(
        `/learning/my-subtopics?roadmapIndex=${roadmapIndex}&topicIndex=${topicIndex}`
      );

      const current = res.subtopics[subtopicIndex];
      setSubtopic(current);
      setCode(current.codingChallenge?.starterCode || "");

      // Parse problem statement
      if (current.codingChallenge?.problemStatement) {
        const parsed = parseProblemStatement(current.codingChallenge.problemStatement);
        setParsedProblem(parsed);
      }

      if (current.codingSubmission?.noOfSubmissions > 0) {
        setLocked(true);
        setScore(current.codingSubmission.scoreForCode);
        setOutput(current.codingSubmission.lastResult?.passed 
          ? "All test cases passed! ✅" 
          : `${current.codingSubmission.lastResult?.failedTestCases} test case(s) failed`);
      }
    };

    loadChallenge();
  }, [roadmapIndex, topicIndex, subtopicIndex]);

  /* ------------------------------------
     RUN CODE
  ------------------------------------ */
  const runCode = async () => {
    try {
      setRunning(true);
      setTestResultTab('result');
      setOutput("Running code...\n\n");

      const res = await apiRequest(
        "/learning/run-code",
        "POST",
        {
          roadmapIndex,
          topicIndex,
          subtopicIndex,
          code
        }
      );

      setOutput(res.executionOutput || "Code executed successfully!");
    } catch (err) {
      console.error("❌ Code execution failed:", err);
      setOutput(`Error: ${err.message || 'Code execution failed'}`);
    } finally {
      setRunning(false);
    }
  };

  /* ------------------------------------
     SUBMIT CODE
  ------------------------------------ */
  const submitCode = async () => {
    try {
      setSubmitting(true);
      setTestResultTab('result');
      setOutput("Running code...\n\n");

      const res = await apiRequest(
        "/learning/submit-code",
        "POST",
        {
          roadmapIndex,
          topicIndex,
          subtopicIndex,
          code
        }
      );

      setOutput(res.executionOutput || "");
      setFeedback(res.feedback);
      setScore(res.score);
      setLocked(true);
      
      setMessages(prev => [...prev, {
        type: 'bot',
        text: `Great job! You scored ${res.score} points. ${res.feedback || ''}`
      }]);
    } catch (err) {
      console.error("❌ Code submission failed:", err);
      setOutput(`Error: ${err.message || 'Code submission failed'}`);
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------------
     CHATBOT FUNCTIONS
  ------------------------------------ */
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { type: 'user', text: chatInput };
    setMessages(prev => [...prev, userMessage]);

    const inputText = chatInput;
    setChatInput('');

    const loadingMessage = { type: 'bot', text: '...' };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await apiRequest('/learning/chat', 'POST', {
        message: inputText,
        sessionId: `coding-${roadmapIndex}-${topicIndex}-${subtopicIndex}`,
        problemContext: subtopic?.codingChallenge ? {
          title: subtopicTitle,
          description: subtopic.codingChallenge.problemStatement,
          hint: subtopic.codingChallenge.hint
        } : null,
        userCode: code
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
      console.error('Chatbot error:', error);
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
          <div key={index} className="code-block">
            <div className="code-block-header">{language}</div>
            <pre className="code-block-content">{codeContent}</pre>
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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Handle resize
  const handleMouseDown = (type) => (e) => {
    setIsResizing(true);
    setResizeType(type);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !resizeType) return;
      
      if (resizeType === 'problem') {
        const container = document.querySelector('.leetcode-container');
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        
        if (newWidth >= 30 && newWidth <= 60) {
          setProblemWidth(newWidth);
        }
      } else if (resizeType === 'chatbot') {
        const container = document.querySelector('.leetcode-container');
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const newWidth = ((containerRect.right - e.clientX) / containerRect.width) * 100;
        
        if (newWidth >= 15 && newWidth <= 35) {
          setChatbotWidth(newWidth);
        }
      } else if (resizeType === 'testresult') {
        const container = document.querySelector('.code-panel');
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const newHeight = containerRect.bottom - e.clientY;
        
        if (newHeight >= 150 && newHeight <= 500) {
          setTestResultHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeType(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeType]);

  if (!subtopic) return <div className="loading">Loading coding challenge...</div>;

  const codeWidth = showChatbot ? 100 - problemWidth - chatbotWidth : 100 - problemWidth;

  return (
    <div className="coding-page-container">
      {/* Header */}
      <header className="coding-header-leetcode">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">{'</>'}</div>
            <span>Coding Challenge</span>
          </div>
        </div>
        <div className="header-right">
          <button 
            className={`ai-assistant-toggle ${showChatbot ? 'active' : ''}`}
            onClick={() => setShowChatbot(!showChatbot)}
            title="AI Assistant"
          >
            <span>🤖</span>
            <span>AI Assistant</span>
          </button>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main Content - LeetCode Style */}
      <div 
        className="leetcode-container"
        style={{
          gridTemplateColumns: showChatbot 
            ? `${problemWidth}% ${codeWidth}% ${chatbotWidth}%`
            : `${problemWidth}% ${codeWidth}%`
        }}
      >
        {/* LEFT: Problem Description */}
        <div className="problem-panel-leetcode">
          {/* Problem Tabs */}
          <div className="problem-tabs">
            <button
              className={`problem-tab ${problemTab === 'description' ? 'active' : ''}`}
              onClick={() => setProblemTab('description')}
            >
              Description
            </button>
            <button
              className={`problem-tab ${problemTab === 'submissions' ? 'active' : ''}`}
              onClick={() => setProblemTab('submissions')}
            >
              Submissions
            </button>
          </div>

          {/* Problem Content */}
          <div className="problem-content-leetcode">
            {problemTab === 'description' ? (
              <>
                <h1 className="problem-title-leetcode">{subtopicTitle}</h1>
                <div className="problem-badges">
                  <span className="badge badge-medium">Challenge</span>
                </div>

                {parsedProblem && (parsedProblem.description || parsedProblem.inputFormat || parsedProblem.samples.length > 0) ? (
                  <>
                    {parsedProblem.description && (
                      <div className="problem-section-leetcode">
                        <p>{parsedProblem.description}</p>
                      </div>
                    )}

                    {parsedProblem.samples && parsedProblem.samples.length > 0 && (
                      <div className="problem-section-leetcode">
                        {parsedProblem.samples.map((sample, idx) => (
                          <div key={idx} className="example-case">
                            <div className="example-header">Example {sample.index}:</div>
                            <div className="example-content">
                              <div><strong>Input:</strong> <code>{sample.input}</code></div>
                              <div><strong>Output:</strong> <code>{sample.output}</code></div>
                              {sample.explanation && (
                                <div><strong>Explanation:</strong> {sample.explanation}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {parsedProblem.constraints && (
                      <div className="problem-section-leetcode">
                        <h3>Constraints:</h3>
                        <pre className="constraints-text">{parsedProblem.constraints}</pre>
                      </div>
                    )}

                    {subtopic?.codingChallenge?.hint && (
                      <div className="problem-section-leetcode">
                        <h3>💡 Hint:</h3>
                        <p className="hint-text">{subtopic.codingChallenge.hint}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="problem-section-leetcode">
                    <pre style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {subtopic?.codingChallenge?.problemStatement || 'Loading problem...'}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="submissions-content">
                {locked && score !== null ? (
                  <div className="submission-result">
                    <h2>Last Submission</h2>
                    <div className="score-display-large">
                      <div className="score-value">{score}/60</div>
                      <div className="score-label">Points</div>
                    </div>
                    {feedback && (
                      <div className="feedback-section">
                        <h3>Feedback:</h3>
                        <p>{feedback}</p>
                      </div>
                    )}
                    <button className="btn btn-primary" onClick={onFinish}>
                      Continue to Next Challenge →
                    </button>
                  </div>
                ) : (
                  <div className="no-submissions">
                    <p>No submissions yet. Submit your solution to see results here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div 
          className="vertical-resize-handle-leetcode" 
          onMouseDown={handleMouseDown('problem')}
        />

        {/* MIDDLE: Code Editor + Test Results */}
        <div className="code-panel">
          {/* Code Editor */}
          <div className="code-editor-section">
            <div className="code-editor-header">
              <div className="editor-tabs">
                <div className="editor-tab active">C++</div>
              </div>
              <div className="editor-actions">
                <button
                  className="btn-icon"
                  onClick={() => setShowFontMenu(!showFontMenu)}
                  title="Settings"
                >
                  ⚙️
                </button>
                {showFontMenu && (
                  <div className="font-size-dropdown">
                    {[12, 14, 16, 18, 20].map(size => (
                      <div
                        key={size}
                        className={`font-size-option ${fontSize === size ? 'active' : ''}`}
                        onClick={() => {
                          setFontSize(size);
                          setShowFontMenu(false);
                        }}
                      >
                        {size}px
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="code-editor-area">
              <textarea
                className="code-textarea-leetcode"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ fontSize: `${fontSize}px` }}
                spellCheck="false"
                disabled={locked}
              />
            </div>
          </div>

          {/* Resize Handle */}
          <div 
            className="horizontal-resize-handle-leetcode" 
            onMouseDown={handleMouseDown('testresult')}
          >
            <div className="resize-line"></div>
          </div>

          {/* Test Results */}
          <div className="test-result-section" style={{ height: `${testResultHeight}px` }}>
            <div className="test-result-header">
              <div className="test-result-tabs">
                <button
                  className={`test-tab ${testResultTab === 'testcase' ? 'active' : ''}`}
                  onClick={() => setTestResultTab('testcase')}
                >
                  Testcase
                </button>
                <button
                  className={`test-tab ${testResultTab === 'result' ? 'active' : ''}`}
                  onClick={() => setTestResultTab('result')}
                >
                  Test Result
                </button>
              </div>
              <div className="test-actions">
                <button 
                  className="btn btn-run-leetcode" 
                  onClick={runCode}
                  disabled={running || locked}
                >
                  {running ? '⏳ Run' : '▶ Run'}
                </button>
                <button 
                  className="btn btn-submit-leetcode" 
                  onClick={submitCode}
                  disabled={submitting || locked}
                >
                  {submitting ? '⏳ Submit' : locked ? '✅ Submitted' : 'Submit'}
                </button>
              </div>
            </div>

            <div className="test-result-content">
              {testResultTab === 'testcase' ? (
                <div className="testcase-view">
                  <p className="placeholder-text">Click "Run" or "Submit" to see test results</p>
                </div>
              ) : (
                <div className="result-view">
                  <pre className="result-output">
                    {output || 'Click "Run" or "Submit" to see results'}
                  </pre>
                  {locked && score !== null && (
                    <div className="result-score">
                      <div className="score-badge-large">Score: {score}/60</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resize Handle for Chatbot */}
        {showChatbot && (
          <div 
            className="vertical-resize-handle-leetcode" 
            onMouseDown={handleMouseDown('chatbot')}
          />
        )}

        {/* RIGHT: AI Assistant Drawer */}
        {showChatbot && (
          <div className="ai-panel-leetcode">
            <div className="ai-panel-header">
              <div className="ai-panel-title">
                <span>🤖</span>
                <span>AI Assistant</span>
              </div>
              <button 
                className="close-ai-btn"
                onClick={() => setShowChatbot(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="ai-messages" ref={chatMessagesRef}>
              {messages.map((message, idx) => (
                <div key={idx} className={`ai-message ${message.type}`}>
                  <div className="ai-message-avatar">
                    {message.type === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="ai-message-content">
                    {formatMessageContent(message.text)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="ai-input-container">
              <input
                type="text"
                className="ai-input"
                placeholder="Ask for hints..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="ai-send-btn" onClick={handleSendMessage}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
