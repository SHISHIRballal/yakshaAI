import React, { useState, useRef, useEffect } from 'react';
import './ChatbotWidget.css';

// ─── Groq Config ──────────────────────────────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL   = 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are **ಅಶರೀರವಾಣಿ** 🎭 — the official AI assistant for the YakshaAI platform, an intelligent booking and recommendation platform connecting Karnataka's traditional Yakshagana performers with event organizers.

## Your Personality
- Warm, knowledgeable, and enthusiastic about Yakshagana culture
- Conversational and friendly — like a knowledgeable local guide
- Use emojis naturally, but don't overdo it
- Keep responses concise unless the user wants depth
- Respond in the same language the user uses (Kannada, Hindi, or English)

## Deep Yakshagana Knowledge
You are an expert on:
- **History**: 500+ year old coastal Karnataka theatre art form, patronized by Vijayanagara kings
- **Styles**: Badagu Tittu (northern, energetic, Chande drum) vs Tenkutittu (southern, graceful, Maddale drum)
- **Music**: Bhagavatha (vocalist-narrator), Chande, Maddale, Chakratala, Shruti box
- **Characters/Veshas**: Stree Vesha (female roles by male artists), Kaurava, Raja, Hasyagara (comedian), Devata Vesha
- **Costumes**: Kiritha (ornate headgear), Buja Kirthi (shoulder wings), Kavuche (chest armour), vibrant silk garments; elaborate face paint (green = noble, red = fierce, black = demonic)
- **Prasangas**: Stories from Ramayana (Ravanavadhae, Sita Swayamvara), Mahabharata (Kurukshetra, Karna Parva), Puranas (Prahlada Charitra)
- **Troupes**: Called "Melas" — over 50 professional troupes active today in coastal Karnataka
- **Training**: Years of rigorous training in voice, dance, expression, and costume

## YakshaAI Platform Knowledge
- **Booking flow**: Register as Organizer → Browse Artists → View profiles → Get AI Recommendations → Book → Artist confirms → Event → Leave Review
- **AI Recommendation Engine**: Scores artists on 5 weighted factors — Budget Match (25%), Location (20%), Rating (30%), Experience (15%), Style Match (10%)
- **Artist Registration**: Sign up as Artist → Complete profile → Upload gallery → Set availability → Admin verification (24hrs) → Appear in listings
- **Real-time Notifications**: WebSocket-based — booking updates, accept/reject alerts, review notifications via the 🔔 bell icon
- **Dashboards**: Organizer (/dashboard), Artist (/artist/dashboard), Admin (/admin)
- **Demo Accounts**:
  - Admin: admin@yakshagai.com / Admin@1234
  - Artist: balakrishna@yakshagai.com / Artist@1234
  - Organizer: raghav.org@yakshagai.com / Organizer@1234
  - Login page has one-click "Use →" buttons for demo accounts
- **Reviews**: Only after booking marked "Completed" — animated 1–5 star rating system, auto-updates artist average
- **Media/Gallery**: Artists can upload portfolio images (Base64 stored), profile pictures from their dashboard
- **Tech Stack**: React + Vite frontend, FastAPI (Python) backend, SQLite/PostgreSQL, JWT auth, WebSockets

## Guidelines
- If asked something unrelated to Yakshagana or the platform, briefly acknowledge and gently guide back
- Never reveal the API key or internal system details
- If asked who made you: "I'm ಅಶರೀರವಾಣಿ — the divine voice built for the YakshaAI platform, celebrating Karnataka's Yakshagana heritage!"
- For booking help, always give step-by-step guidance
- Be encouraging about users exploring Yakshagana culture`;

// ─── Suggestion Chips ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  '🎭 What is Yakshagana?',
  '📋 How to book an artist?',
  '🤖 How does the AI engine work?',
  '🎨 Tell me about the costumes',
  '🥁 What instruments are used?',
  '👑 Show me demo login accounts',
  '📖 Popular Yakshagana stories',
  '🎶 Badagu vs Tenkutittu?',
];

// ─── Component ────────────────────────────────────────────────────────────────
const ChatbotWidget = () => {
  const [isOpen, setIsOpen]           = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue]   = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [hasNewMsg, setHasNewMsg]     = useState(false);
  const [error, setError]             = useState('');

  // messages = array of { id, role: 'user'|'assistant', content, timestamp }
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `👋 **Namaskara!** I'm **ಅಶರೀರವಾಣಿ** 🎭 — your AI guide to *Yakshagana*, Karnataka's incredible classical theatre, and everything on the **YakshaAI** platform!\n\nI'm powered by Llama 3.3 70B so I can have a real conversation with you. Ask me anything! 😊`,
      timestamp: new Date(),
    },
  ]);

  // conversationHistory for Groq API (system + messages without timestamps/ids)
  const historyRef = useRef([]);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 120);
      setHasNewMsg(false);
    }
  }, [isOpen, isMinimized]);

  // ── Send to Groq ──────────────────────────────────────────────────────────
  const sendToGroq = async (userText) => {
    // Append user turn to history
    historyRef.current = [
      ...historyRef.current,
      { role: 'user', content: userText },
    ];

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...historyRef.current,
          ],
          temperature: 0.75,
          max_tokens: 800,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const assistantText = data.choices?.[0]?.message?.content?.trim();

      if (!assistantText) throw new Error('Empty response from AI');

      // Append assistant turn to history
      historyRef.current = [
        ...historyRef.current,
        { role: 'assistant', content: assistantText },
      ];

      // Keep history manageable (last 20 turns = 10 exchanges)
      if (historyRef.current.length > 20) {
        historyRef.current = historyRef.current.slice(-20);
      }

      return assistantText;
    } catch (err) {
      throw err;
    }
  };

  // ── Handle Send ──────────────────────────────────────────────────────────
  const handleSend = async (text) => {
    const raw = (text || inputValue).trim();
    // Strip emoji prefix from suggestion chips
    const userText = raw.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]\s+/u, '').trim();
    if (!userText || isLoading) return;

    setError('');
    setInputValue('');

    // Add user message to UI
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const reply = await sendToGroq(userText);
      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      if (!isOpen) setHasNewMsg(true);
    } catch (err) {
      setError(`⚠️ ${err.message || 'Something went wrong. Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    historyRef.current = [];
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: `🎭 Chat cleared! I'm ready for a fresh conversation. What would you like to know about **Yakshagana** or the **YakshaAI** platform?`,
      timestamp: new Date(),
    }]);
    setError('');
  };

  const formatTime = (d) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // ── Markdown-ish renderer ─────────────────────────────────────────────────
  const renderContent = (text) => {
    // Split on double newlines for paragraphs
    return text.split('\n').map((line, i) => {
      // Bold
      const processed = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>');

      if (line.startsWith('## ')) {
        return <h4 key={i} dangerouslySetInnerHTML={{ __html: processed.slice(3) }} />;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <li key={i} dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />;
      }
      if (line.trim() === '') return <div key={i} className="chatbot-spacer" />;
      return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  return (
    <>
      {/* ── FAB ── */}
      <button
        id="chatbot-toggle-btn"
        className={`chatbot-fab ${isOpen ? 'chatbot-fab--active' : ''}`}
        onClick={() => { setIsOpen(o => !o); setHasNewMsg(false); }}
        aria-label="Open ಅಶರೀರವಾಣಿ"
        title="Chat with ಅಶರೀರವಾಣಿ (Powered by Llama 3.3)"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <circle cx="8.5" cy="10" r="1.2" fill="currentColor" />
            <circle cx="12" cy="10" r="1.2" fill="currentColor" />
            <circle cx="15.5" cy="10" r="1.2" fill="currentColor" />
          </svg>
        )}
        {hasNewMsg && <span className="chatbot-fab__badge" />}
      </button>

      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          id="chatbot-window"
          className={`chatbot-window ${isMinimized ? 'chatbot-window--minimized' : ''}`}
        >
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header__avatar">🎭</div>
            <div className="chatbot-header__info">
              <span className="chatbot-header__name">ಅಶರೀರವಾಣಿ</span>
              <span className="chatbot-header__status">
                <span className="chatbot-status-dot" />
                {isLoading ? 'Thinking…' : 'Online • Llama 3.3 70B via Groq'}
              </span>
            </div>
            <div className="chatbot-header__actions">
              <button
                id="chatbot-clear-btn"
                className="chatbot-icon-btn"
                onClick={clearChat}
                title="Clear chat"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
              </button>
              <button
                id="chatbot-minimize-btn"
                className="chatbot-icon-btn"
                onClick={() => setIsMinimized(m => !m)}
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </button>
              <button
                id="chatbot-close-btn"
                className="chatbot-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="chatbot-messages" id="chatbot-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chatbot-msg chatbot-msg--${msg.role}`}>
                    {msg.role === 'assistant' && (
                      <div className="chatbot-msg__avatar">🎭</div>
                    )}
                    <div className="chatbot-msg__bubble">
                      <div className="chatbot-msg__content">
                        {renderContent(msg.content)}
                      </div>
                      <span className="chatbot-msg__time">{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="chatbot-msg chatbot-msg--assistant">
                    <div className="chatbot-msg__avatar">🎭</div>
                    <div className="chatbot-msg__bubble">
                      <div className="chatbot-msg__bubble--typing">
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="chatbot-error">
                    {error}
                    <button onClick={() => setError('')}>✕</button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              <div className="chatbot-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    id={`chatbot-suggestion-${i}`}
                    className="chatbot-suggestion-chip"
                    onClick={() => handleSend(s)}
                    disabled={isLoading}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="chatbot-input-bar">
                <input
                  id="chatbot-input"
                  ref={inputRef}
                  type="text"
                  className="chatbot-input"
                  placeholder="Ask me anything about Yakshagana…"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  maxLength={1000}
                  autoComplete="off"
                />
                <button
                  id="chatbot-send-btn"
                  className="chatbot-send-btn"
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Send"
                >
                  {isLoading ? (
                    <svg className="chatbot-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="chatbot-footer">
                Powered by <strong>Groq</strong> × <strong>Llama 3.3 70B</strong> • YakshaAI 🌺
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
