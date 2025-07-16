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
    if (loading) return 'Sending...';
    if (detectedUrl) return 'Scan URL';
    return 'Send';
  };

  return (
    <div className="App">
      <header>
        <h1>Accessibility at your Fingertips!</h1>
        <p>Ask anything about accessibility, or provide a URL for a scan!</p>
      </header>

      <main className="chat-container">
        <div className="messages-display">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <p>Welcome! Start by asking a question or provide a URL to scan.</p>
              <p>Example: "Can you check accessibility for www.facebook.com?"</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type}`}>
                {msg.type === 'ai' ? (
                                                       <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Headers with professional styling
                      h1: ({node, ...props}) => (
                        <h1 style={{
                          color: '#2d3748',
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          marginBottom: '1rem',
                          marginTop: '1.5rem',
                          borderBottom: '2px solid #e2e8f0',
                          paddingBottom: '0.5rem'
                        }} {...props} />
                      ),
                      h2: ({node, ...props}) => (
                        <h2 style={{
                          color: '#2d3748',
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          marginBottom: '0.75rem',
                          marginTop: '1.25rem',
                          display: 'flex',
                          alignItems: 'center'
                        }} {...props} />
                      ),
                      h3: ({node, ...props}) => (
                        <h3 style={{
                          color: '#4a5568',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          marginBottom: '0.5rem',
                          marginTop: '1rem'
                        }} {...props} />
                      ),
                      // Paragraphs with proper spacing
                      p: ({node, ...props}) => (
                        <p style={{
                          marginBottom: '1rem',
                          lineHeight: '1.6',
                          color: '#2d3748'
                        }} {...props} />
                      ),
                      // Bullet points with ChatGPT-style formatting
                      ul: ({node, ...props}) => (
                        <ul style={{
                          paddingLeft: '1.5rem',
                          marginBottom: '1rem',
                          listStyleType: 'disc'
                        }} {...props} />
                      ),
                      li: ({node, ...props}) => (
                        <li style={{
                          marginBottom: '0.5rem',
                          lineHeight: '1.5',
                          color: '#2d3748'
                        }} {...props} />
                      ),
                      // Numbered lists
                      ol: ({node, ...props}) => (
                        <ol style={{
                          paddingLeft: '1.5rem',
                          marginBottom: '1rem'
                        }} {...props} />
                      ),
                      // Bold text highlighting
                      strong: ({node, ...props}) => (
                        <strong style={{
                          color: '#1a202c',
                          fontWeight: '600'
                        }} {...props} />
                      ),
                      // Code blocks with proper styling
                      code: ({node, inline, ...props}) => 
                        inline ? (
                          <code style={{
                            backgroundColor: '#f7fafc',
                            color: '#2d3748',
                            padding: '0.125rem 0.25rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                            border: '1px solid #e2e8f0',
                            fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                          }} {...props} />
                        ) : (
                          <code style={{
                            backgroundColor: '#f7fafc',
                            color: '#2d3748',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            display: 'block',
                            fontSize: '0.875rem',
                            overflow: 'auto',
                            border: '1px solid #e2e8f0',
                            fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            marginBottom: '1rem'
                          }} {...props} />
                        ),
                      // Horizontal rules
                      hr: ({node, ...props}) => (
                        <hr style={{
                          margin: '2rem 0',
                          border: 'none',
                          borderTop: '1px solid #e2e8f0'
                        }} {...props} />
                      ),
                      // Tables
                      table: ({node, ...props}) => (
                        <table style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          marginBottom: '1rem',
                          fontSize: '0.875rem'
                        }} {...props} />
                      ),
                      th: ({node, ...props}) => (
                        <th style={{
                          padding: '0.75rem',
                          borderBottom: '2px solid #e2e8f0',
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#2d3748'
                        }} {...props} />
                      ),
                      td: ({node, ...props}) => (
                        <td style={{
                          padding: '0.75rem',
                          borderBottom: '1px solid #f7fafc',
                          color: '#2d3748'
                        }} {...props} />
                      ),
                      // Blockquotes
                      blockquote: ({node, ...props}) => (
                        <blockquote style={{
                          borderLeft: '4px solid #3182ce',
                          paddingLeft: '1rem',
                          marginLeft: '0',
                          marginBottom: '1rem',
                          fontStyle: 'italic',
                          color: '#4a5568'
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
          <div ref={messagesEndRef} />
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSendMessage} className="message-input-form">
          <textarea
            value={currentQuestion}
            onChange={handleQuestionChange}
            placeholder={loading ? "Thinking..." : (detectedUrl ? `URL detected: ${detectedUrl}` : "Type your question here...")}
            rows="3"
            disabled={loading}
            aria-label="Ask your question or provide a URL"
          />
          <button type="submit" disabled={loading}>
            {getButtonText()}
          </button>
        </form>
      </main>

      <footer>
        <p>Made by Hit Shiroya.</p>
      </footer>
    </div>
  );
}

export default App;
