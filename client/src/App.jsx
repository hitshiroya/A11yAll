import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

// --- Helper function to extract and validate URLs ---
const urlRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/[a-zA-Z0-9]+\.[^\s]{2,}|[a-zA-Z0-9]+\.[^\s]{2,})/gi;

function extractAndValidateUrl(text) {
  const matches = text.match(urlRegex);
  if (matches && matches.length > 0) {
    const potentialUrl = matches[0].startsWith('http') ? matches[0] : `https://${matches[0]}`;
    try {
      const urlObj = new URL(potentialUrl);
      if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
        return urlObj.href;
      }
    } catch (e) {
      return null;
    }
  }
  return null;
}
// --- End Helper ---

function App() {
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedUrl, setDetectedUrl] = useState(null);

  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleQuestionChange = useCallback((e) => {
    const text = e.target.value;
    setCurrentQuestion(text);
    const url = extractAndValidateUrl(text);
    setDetectedUrl(url);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentQuestion.trim()) return;

    const userMessage = { type: 'user', text: currentQuestion };
    setMessages((prev) => [...prev, userMessage]);
    setCurrentQuestion('');
    setDetectedUrl(null);
    setLoading(true);
    setError(null);

    try {
      let response;
      if (detectedUrl) {
        response = await axios.post('http://localhost:5000/api/scan-url', { url: detectedUrl });
        console.log(`[Frontend] Sending scan request for: ${detectedUrl}`);
      } else {
        response = await axios.post('http://localhost:5000/api/chat-general', { question: userMessage.text });
        console.log(`[Frontend] Sending general chat request.`);
      }

      if (response.data.success) {
        const aiMessage = { type: 'ai', text: response.data.answer };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        setError(response.data.message || 'Unknown error from server.');
        setMessages((prev) => [...prev, { type: 'ai', text: 'Error: Unable to get a response.' }]);
      }

    } catch (err) {
      let errorMessage = 'Failed to connect to backend.';
      if (err.response) {
        errorMessage = err.response.data.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'No response from backend. Check if server is running.';
      } else {
        errorMessage = `Error: ${err.message}`;
      }
      setError(errorMessage);
      setMessages((prev) => [...prev, { type: 'ai', text: `Error occurred: ${errorMessage}` }]);
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return 'Analyzing...';
    if (detectedUrl) return '🔍 Scan URL';
    return '✨ Send';
  };

  const getPlaceholderText = () => {
    if (loading) return "AI is thinking...";
    if (detectedUrl) return `🔗 URL detected: ${detectedUrl}`;
    return "Ask about accessibility or paste a URL to scan...";
  };

  return (
    <div className="App">
      {/* Skip link for screen readers */}
      <a href="#main-chat" className="skip-link">
        Skip to main chat area
      </a>
      
      <header role="banner">
        <h1>🚀 A11yAll</h1>
        <p>Your AI-powered accessibility consultant at your fingertips!</p>
      </header>

      <main id="main-chat" className="chat-container" role="main" ref={chatRef}>
        <div 
          className="messages-display" 
          role="log" 
          aria-live="polite" 
          aria-label="Chat conversation"
        >
          {messages.length === 0 ? (
            <div className="welcome-message" role="region" aria-label="Welcome message">
              <h3>👋 Welcome to A11yAll!</h3>
              <p>🎯 Get instant accessibility insights and expert guidance</p>
              <p>💡 Ask questions or provide a URL for comprehensive analysis</p>
              <p>🌟 Example: "Can you check accessibility for www.facebook.com?"</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`message ${msg.type}`}
                role={msg.type === 'ai' ? 'article' : 'article'}
                aria-label={`${msg.type === 'ai' ? 'AI assistant' : 'User'} message`}
              >
                {msg.type === 'ai' ? (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Headers with accessible contrast
                      h1: ({node, ...props}) => (
                        <h1 style={{
                          color: 'var(--text-primary)',
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          marginBottom: '1rem',
                          marginTop: '1.5rem',
                          borderBottom: '2px solid var(--border-primary)',
                          paddingBottom: '0.5rem',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text'
                        }} {...props} />
                      ),
                      h2: ({node, ...props}) => (
                        <h2 style={{
                          color: 'var(--text-primary)',
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          marginBottom: '0.75rem',
                          marginTop: '1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text'
                        }} {...props} />
                      ),
                      h3: ({node, ...props}) => (
                        <h3 style={{
                          color: 'var(--accent-primary)',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          marginBottom: '0.5rem',
                          marginTop: '1rem',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text'
                        }} {...props} />
                      ),
                      // Paragraphs with proper spacing
                      p: ({node, ...props}) => (
                        <p style={{
                          marginBottom: '1rem',
                          lineHeight: '1.6',
                          color: 'var(--text-primary)',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text'
                        }} {...props} />
                      ),
                      // Enhanced bullet points
                      ul: ({node, ...props}) => (
                        <ul style={{
                          paddingLeft: '1.5rem',
                          marginBottom: '1rem',
                          listStyleType: 'disc',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text'
                        }} {...props} />
                      ),
                      li: ({node, ...props}) => (
                        <li style={{
                          marginBottom: '0.5rem',
                          lineHeight: '1.5',
                          color: 'var(--text-primary)',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text'
                        }} {...props} />
                      ),
                      // Numbered lists
                      ol: ({node, ...props}) => (
                        <ol style={{
                          paddingLeft: '1.5rem',
                          marginBottom: '1rem',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text'
                        }} {...props} />
                      ),
                      // Bold text highlighting
                      strong: ({node, ...props}) => (
                        <strong style={{
                          color: 'var(--accent-primary)',
                          fontWeight: '600',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text'
                        }} {...props} />
                      ),
                      // Enhanced code styling
                      code: ({node, inline, ...props}) => 
                        inline ? (
                          <code style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--accent-primary)',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            border: '1px solid var(--border-primary)',
                            fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace',
                            userSelect: 'text',
                            WebkitUserSelect: 'text',
                            MozUserSelect: 'text',
                            msUserSelect: 'text'
                          }} {...props} />
                        ) : (
                          <code style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            padding: '1rem',
                            borderRadius: '8px',
                            display: 'block',
                            fontSize: '0.875rem',
                            overflow: 'auto',
                            border: '1px solid var(--border-primary)',
                            fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace',
                            marginBottom: '1rem',
                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
                            userSelect: 'text',
                            WebkitUserSelect: 'text',
                            MozUserSelect: 'text',
                            msUserSelect: 'text'
                          }} {...props} />
                        ),
                      // Horizontal rules
                      hr: ({node, ...props}) => (
                        <hr style={{
                          margin: '2rem 0',
                          border: 'none',
                          borderTop: '1px solid var(--border-primary)'
                        }} {...props} />
                      ),
                      // Enhanced tables
                      table: ({node, ...props}) => (
                        <table style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          marginBottom: '1rem',
                          fontSize: '0.875rem',
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text'
                        }} {...props} />
                      ),
                      th: ({node, ...props}) => (
                        <th style={{
                          padding: '0.75rem',
                          borderBottom: '2px solid var(--border-primary)',
                          textAlign: 'left',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          backgroundColor: 'var(--bg-secondary)',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text'
                        }} {...props} />
                      ),
                      td: ({node, ...props}) => (
                        <td style={{
                          padding: '0.75rem',
                          borderBottom: '1px solid var(--border-secondary)',
                          color: 'var(--text-primary)',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text'
                        }} {...props} />
                      ),
                      // Enhanced blockquotes
                      blockquote: ({node, ...props}) => (
                        <blockquote style={{
                          borderLeft: '4px solid var(--accent-primary)',
                          paddingLeft: '1rem',
                          marginLeft: '0',
                          marginBottom: '1rem',
                          fontStyle: 'italic',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'rgba(121, 192, 255, 0.1)',
                          padding: '1rem',
                          borderRadius: '0 8px 8px 0',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text'
                        }} {...props} />
                      )
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  <div>{msg.text}</div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="message ai" aria-live="polite">
              <div className="loading-dots">
                🤖 Our Expert is analyzing your request
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div 
            className="error-message" 
            role="alert" 
            aria-live="assertive"
            tabIndex="-1"
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="message-input-form" role="form">
          <label htmlFor="message-input" className="sr-only">
            Type your accessibility question or paste a URL to scan
          </label>
          <textarea
            id="message-input"
            value={currentQuestion}
            onChange={handleQuestionChange}
            placeholder={getPlaceholderText()}
            rows="1"
            disabled={loading}
            aria-label="Ask your question or provide a URL"
            aria-describedby={detectedUrl ? "url-detected" : undefined}
            style={{
              transition: 'height 0.2s ease',
              height: 'auto',
              minHeight: '56px'
            }}
          />
          {detectedUrl && (
            <div id="url-detected" className="sr-only">
              URL detected: {detectedUrl}
            </div>
          )}
          <button 
            type="submit" 
            disabled={loading || !currentQuestion.trim()}
            aria-describedby="button-description"
          >
            {getButtonText()}
          </button>
          <div id="button-description" className="sr-only">
            {detectedUrl ? 'Analyze the detected URL for accessibility issues' : 'Send your message to the AI assistant'}
          </div>
        </form>
      </main>

      <footer role="contentinfo">
        <p>Crafted with accessibility in mind by Hit Shiroya</p>
      </footer>
    </div>
  );
}

export default App;
