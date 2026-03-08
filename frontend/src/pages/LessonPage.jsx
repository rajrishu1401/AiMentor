import { useEffect, useState, useRef } from "react";
import { apiRequest } from "../api/api";
import "./LessonPage.css";

export default function LessonPage({ lessonData, onBack, onStartQuiz }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  // Chatbot state
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: `Hi! I'm your learning assistant. I can help you understand this topic better. Feel free to ask me anything about the theory!`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesRef = useRef(null);

  const {
    roadmapIndex,
    topicIndex,
    subtopicIndex,
    subtopicTitle
  } = lessonData;

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);

        const res = await apiRequest(
          "/learning/generate-subtopic-content",
          "POST",
          {
            roadmapIndex,
            topicIndex,
            subtopicIndex
          }
        );

        setContent(res.content);
      } catch (err) {
        console.error("❌ Failed to load lesson:", err);
        alert("Failed to load lesson content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  // Auto-scroll chat messages
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Parse content to extract code blocks
  const parseContent = (text) => {
    if (!text) return [];

    const parts = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2].trim()
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: text }];
  };

  const copyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderContent = (text) => {
    const parts = parseContent(text);

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <div key={index} className="code-block-container">
            <div className="code-block-header">
              <span className="code-language">{part.language}</span>
              <button
                className="copy-code-btn"
                onClick={() => copyCode(part.content, index)}
              >
                {copiedIndex === index ? '✓ Copied' : '📋 Copy code'}
              </button>
            </div>
            <pre className="code-block">
              <code className={`language-${part.language}`}>
                {highlightCode(part.content, part.language)}
              </code>
            </pre>
          </div>
        );
      } else {
        return (
          <div key={index} className="text-content">
            {part.content.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        );
      }
    });
  };

  // Simple syntax highlighting
  const highlightCode = (code, language) => {
    const keywords = {
      java: ['for', 'while', 'if', 'else', 'return', 'class', 'public', 'private', 'static', 'void', 'int', 'String', 'new', 'this', 'extends', 'implements'],
      javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'async', 'await', 'import', 'export'],
      python: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'with', 'try', 'except'],
    };

    const langKeywords = keywords[language] || [];

    return code.split('\n').map((line, lineIndex) => {
      let highlightedLine = line;

      // Highlight keywords
      langKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
        highlightedLine = highlightedLine.replace(regex, '<span class="keyword">$1</span>');
      });

      // Highlight strings
      highlightedLine = highlightedLine.replace(/(["'`])(.*?)\1/g, '<span class="string">$1$2$1</span>');

      // Highlight numbers
      highlightedLine = highlightedLine.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');

      // Highlight comments
      if (language === 'java' || language === 'javascript') {
        highlightedLine = highlightedLine.replace(/(\/\/.*$)/g, '<span class="comment">$1</span>');
      } else if (language === 'python') {
        highlightedLine = highlightedLine.replace(/(#.*$)/g, '<span class="comment">$1</span>');
      }

      return (
        <div key={lineIndex} dangerouslySetInnerHTML={{ __html: highlightedLine || ' ' }} />
      );
    });
  };

  // Chatbot functions
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
        sessionId: `lesson-${roadmapIndex}-${topicIndex}-${subtopicIndex}`,
        learningContext: {
          subtopicTitle,
          theory: content?.theory || '',
          currentPage: 'theory'
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

  return (
    <div className="lesson-page">
      {/* Header */}
      <div className="lesson-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to Subtopics
        </button>
        <button 
          className={`btn-ai-assistant ${showChatbot ? 'active' : ''}`}
          onClick={() => setShowChatbot(!showChatbot)}
        >
          🤖 AI Assistant
        </button>
      </div>

      {/* Main Content with Chatbot */}
      <div className={`lesson-main ${showChatbot ? 'with-chatbot' : ''}`}>
        {/* ↓ New wrapper — centers the content, shrinks when chatbot opens */}
        <div className="lesson-container-wrap">
          <div className="lesson-container">
            <h1 className="lesson-title">{subtopicTitle}</h1>

            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading lesson content...</p>
              </div>
            )}

            {content && (
              <>
                {/* Explanation Section */}
                <section className="lesson-section">
                  <h2 className="section-title">Explanation</h2>
                  <div className="section-content">
                    {renderContent(content.theory)}
                  </div>
                </section>

                {/* Watch More Section */}
                <section className="lesson-section">
                  <h3 className="subsection-title">Watch more</h3>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                      content.youtubeQuery
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="youtube-link"
                  >
                    🔍 Search on YouTube
                  </a>
                </section>

                {/* Skills Covered Section */}
                <section className="lesson-section">
                  <h3 className="subsection-title">Skills covered</h3>
                  <ul className="skills-list">
                    {content.skills.map((skill, i) => (
                      <li key={i} className="skill-item">
                        <span className="skill-bullet">•</span>
                        {skill}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Start Quiz Button */}
                <div className="lesson-footer">
                  <button
                    className="btn-start-quiz"
                    onClick={() => onStartQuiz(lessonData)}
                  >
                    Start Quiz
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {/* end lesson-container-wrap */}

        {/* Chatbot Drawer */}
        {showChatbot && (
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
                placeholder="Ask me anything about this topic..."
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
