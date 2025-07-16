import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
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
                                                       <div dangerouslySetInnerHTML={{ __html: msg.text }} />
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
