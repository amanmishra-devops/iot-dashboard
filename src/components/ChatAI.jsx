import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiSend, FiMic, FiMicOff } from 'react-icons/fi';
import '../styles/ChatAI.css';
import API_URL from '../config';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function ChatAI({ token, onRelayChange }) {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I control your light. Try: "turn on the light", "light jalao", or "band karo".' }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim]   = useState('');   // live transcript preview
  const [lang, setLang]         = useState('hi-IN');
  const bottomRef  = useRef(null);
  const recRef     = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async (text) => {
    const msg = text.trim();
    if (!msg) return;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/ai-command`,
        { command: msg },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { role: 'bot', content: res.data.response }]);
      // Sync relay state to Dashboard instantly
      if (res.data.relay_state && onRelayChange) onRelayChange(res.data.relay_state);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', content: 'Error occurred. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const startListening = useCallback(() => {
    if (!SR) {
      alert('Speech recognition is not supported in this browser. Use Chrome.');
      return;
    }

    // Fresh instance every time — avoids stale closure completely
    const r = new SR();
    r.lang            = lang;
    r.continuous      = false;
    r.interimResults  = true;

    r.onstart = () => setListening(true);

    r.onresult = (e) => {
      let interim = '';
      let final   = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterim(interim);
      if (final) {
        setInterim('');
        setListening(false);
        r.stop();
        send(final);
      }
    };

    r.onerror = (e) => {
      console.error('Speech error:', e.error);
      setListening(false);
      setInterim('');
      if (e.error === 'not-allowed') {
        setMessages(prev => [...prev, { role: 'bot', content: 'Microphone access denied. Please allow mic in browser settings.' }]);
      }
    };

    r.onend = () => {
      setListening(false);
      setInterim('');
    };

    recRef.current = r;
    r.start();
  }, [lang, send]);

  const stopListening = () => {
    recRef.current?.stop();
    setListening(false);
    setInterim('');
  };

  const toggleMic = () => {
    if (listening) stopListening();
    else startListening();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) send(input);
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div>
          <h2>AI Assistant</h2>
          <p>Control your light using natural language or voice</p>
        </div>
        {/* Language toggle */}
        <div className="lang-toggle">
          <button
            className={lang === 'hi-IN' ? 'active' : ''}
            onClick={() => setLang('hi-IN')}
            title="Hindi"
          >हि</button>
          <button
            className={lang === 'en-IN' ? 'active' : ''}
            onClick={() => setLang('en-IN')}
            title="English"
          >EN</button>
        </div>
      </div>

      <div className="chat-messages-area">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-row ${msg.role}`}>
            <div className="message-bubble">{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="message-row bot">
            <div className="typing-dots"><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-wrap">
        {/* Live transcript preview */}
        {interim && (
          <div className="interim-preview">
            <span className="interim-dot" /> {interim}
          </div>
        )}
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            type="text"
            placeholder={listening ? 'Listening...' : 'Type a command or ask anything...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || listening}
          />
          {listening && <span className="listening-badge">Listening</span>}
          <button
            type="button"
            className={`mic-btn ${listening ? 'listening' : ''}`}
            onClick={toggleMic}
            title={SR ? (listening ? 'Stop' : 'Speak') : 'Not supported'}
            disabled={!SR}
          >
            {listening ? <FiMicOff size={15} /> : <FiMic size={15} />}
          </button>
          <button type="submit" className="send-btn" disabled={loading || !input.trim() || listening}>
            <FiSend size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
