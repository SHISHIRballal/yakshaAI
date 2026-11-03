import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './Messages.css';

export default function Messages() {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const targetUserId = searchParams.get('user_id');
  const targetArtistId = searchParams.get('artist_id');

  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatInputRef = useRef(null);
  const activeUserIdRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 1. Initialize Socket.IO connection
  useEffect(() => {
    if (!token) return;

    // Use current origin or local backend URL
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    const socket = io(backendUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError('');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      setIsConnected(false);
      setError(err.message || 'Real-time connection error');
    });

    socket.on('user_status', ({ user_id, status }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [user_id]: status === 'online',
      }));
    });

    socket.on('new_message', (msg) => {
      // If message belongs to active thread, append it
      setActiveUser((currActive) => {
        if (currActive && (msg.sender_id === currActive.id || msg.receiver_id === currActive.id)) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // If message is from recipient, mark read immediately
          if (msg.sender_id === currActive.id) {
            socket.emit('mark_read', { sender_id: currActive.id });
          }
        }
        return currActive;
      });

      // Refresh conversation list to update last_message and unread_count
      fetchConversations();
    });

    socket.on('user_typing', ({ user_id, is_typing }) => {
      setActiveUser((currActive) => {
        if (currActive && currActive.id === user_id) {
          setIsTyping(is_typing);
        }
        return currActive;
      });
    });

    socket.on('messages_read', ({ reader_id }) => {
      setActiveUser((currActive) => {
        if (currActive && currActive.id === reader_id) {
          setMessages((prev) =>
            prev.map((m) => (m.sender_id === user.id ? { ...m, is_read: true } : m))
          );
        }
        return currActive;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  // 2. Fetch conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // 3. Select active user (from query params or fallback to first conversation)
  useEffect(() => {
    if (loading) return;

    if (targetUserId || targetArtistId) {
      const isArtistParam = Boolean(targetArtistId && !targetUserId);
      const queryId = parseInt(targetUserId || targetArtistId, 10);
      if (isNaN(queryId)) return;

      if (user && user.id === queryId) {
        setError('You cannot message yourself.');
        return;
      }

      // If active conversation already matches this user/artist, avoid re-fetching!
      if (activeUserIdRef.current === queryId) {
        return;
      }

      // Check existing conversations first
      const existing = conversations.find((c) => c.other_user_id === queryId);

      if (existing) {
        activeUserIdRef.current = existing.other_user_id;
        selectConversation({
          id: existing.other_user_id,
          name: existing.other_user_name,
          role: existing.other_user_role,
          photo: existing.other_user_photo,
        });
      } else {
        // Fetch recipient info from backend resolver
        const endpoint = isArtistParam
          ? `/messages/recipient/${queryId}?type=artist`
          : `/messages/recipient/${queryId}`;

        api
          .get(endpoint)
          .then((res) => {
            const data = res.data;
            if (data && data.id) {
              activeUserIdRef.current = data.id;
              selectConversation({
                id: data.id,
                name: data.name,
                role: data.role,
                photo: data.photo,
                specialization: data.specialization,
                city: data.city,
                artist_id: data.artist_id,
              });
            }
          })
          .catch((err) => {
            console.error('Failed to load recipient profile:', err);
            setError('Could not load artist profile for messaging.');
          });
      }
    } else if (conversations.length > 0 && !activeUserIdRef.current) {
      const first = conversations[0];
      activeUserIdRef.current = first.other_user_id;
      selectConversation({
        id: first.other_user_id,
        name: first.other_user_name,
        role: first.other_user_role,
        photo: first.other_user_photo,
      });
    }
  }, [targetUserId, targetArtistId, loading]);

  // 4. Load messages for selected conversation
  const selectConversation = async (otherUser) => {
    if (!otherUser || !otherUser.id) return;
    activeUserIdRef.current = otherUser.id;
    setActiveUser(otherUser);
    setIsTyping(false);
    setHistoryLoading(true);
    setError('');
    setTimeout(() => chatInputRef.current?.focus(), 150);

    try {
      const res = await api.get(`/messages/${otherUser.id}`);
      setMessages(res.data);
      // Mark read
      await api.put(`/messages/${otherUser.id}/read`);
      if (socketRef.current) {
        socketRef.current.emit('mark_read', { sender_id: otherUser.id });
      }
      // Update local unread state without triggering full list refresh
      setConversations((prev) =>
        prev.map((c) =>
          c.other_user_id === otherUser.id ? { ...c, unread_count: 0 } : c
        )
      );
    } catch (err) {
      setError('Failed to load chat history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 5. Handle Typing Notification
  const handleInputChange = (e) => {
    setInputContent(e.target.value);

    if (!activeUser || !socketRef.current) return;

    socketRef.current.emit('typing_start', { receiver_id: activeUser.id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && activeUser) {
        socketRef.current.emit('typing_stop', { receiver_id: activeUser.id });
      }
    }, 1500);
  };

  // 6. Send Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    const clean = inputContent.trim();

    if (!clean || !activeUser) return;
    if (clean.length > 2000) {
      setError('Message exceeds 2000 character limit');
      return;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socketRef.current) {
      socketRef.current.emit('typing_stop', { receiver_id: activeUser.id });
    }

    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', {
        receiver_id: activeUser.id,
        content: clean,
      });
      setInputContent('');
    } else {
      // Fallback REST send if socket temporarily disconnected
      api.post('/messages', { receiver_id: activeUser.id, content: clean })
        .then((res) => {
          setMessages((prev) => [...prev, res.data]);
          setInputContent('');
          fetchConversations();
        })
        .catch((err) => {
          setError(err.response?.data?.detail || 'Failed to send message');
        });
    }
  };

  if (loading) return <LoadingSpinner label="Loading chat..." />;

  // Synthesize new conversation item if activeUser isn't yet in saved conversations
  const displayConversations = [...conversations];
  if (activeUser && !conversations.some((c) => c.other_user_id === activeUser.id)) {
    displayConversations.unshift({
      id: `temp-${activeUser.id}`,
      other_user_id: activeUser.id,
      other_user_name: activeUser.name,
      other_user_role: activeUser.role,
      other_user_photo: activeUser.photo,
      last_message: activeUser.specialization ? `🎭 ${activeUser.specialization}` : 'New conversation',
      last_message_at: null,
      unread_count: 0,
      is_new: true,
    });
  }

  return (
    <div className="messages-page container">
      {!isConnected && (
        <div className="reconnect-banner">
          ⚠️ Connection lost. Reconnecting to chat server...
        </div>
      )}

      <div className="messages-card glass">
        {/* Sidebar — Conversation List */}
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h3>💬 Conversations</h3>
          </div>

          <div className="conversations-list">
            {displayConversations.length === 0 ? (
              <div className="empty-sidebar">No conversations yet</div>
            ) : (
              displayConversations.map((c) => (
                <div
                  key={c.id}
                  className={`conversation-item ${activeUser?.id === c.other_user_id ? 'active' : ''}`}
                  onClick={() =>
                    selectConversation({
                      id: c.other_user_id,
                      name: c.other_user_name,
                      role: c.other_user_role,
                      photo: c.other_user_photo,
                    })
                  }
                >
                  <div className="avatar-wrapper">
                    <img
                      src={c.other_user_photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.other_user_name}`}
                      alt={c.other_user_name}
                      className="avatar-img"
                    />
                    <span className={`status-dot ${onlineUsers[c.other_user_id] ? 'online' : 'offline'}`} />
                  </div>

                  <div className="conv-info">
                    <div className="conv-top">
                      <span className="conv-name">{c.other_user_name}</span>
                      {c.last_message_at ? (
                        <span className="conv-time">
                          {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : c.is_new ? (
                        <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>New</span>
                      ) : null}
                    </div>
                    <div className="conv-bottom">
                      <span className="conv-preview">{c.last_message || 'Started a conversation'}</span>
                      {c.unread_count > 0 && (
                        <span className="unread-badge">{c.unread_count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Main Window */}
        <div className="chat-window">
          {activeUser ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-user-details">
                  <img
                    src={activeUser.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeUser.name}`}
                    alt={activeUser.name}
                    className="avatar-img"
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h4 className="chat-username" style={{ margin: 0 }}>{activeUser.name}</h4>
                      <span className="user-role-badge">{activeUser.role}</span>
                      <span className={`status-label ${onlineUsers[activeUser.id] ? 'online' : ''}`}>
                        {onlineUsers[activeUser.id] ? '🟢 Online' : '⚪ Offline'}
                      </span>
                    </div>
                    {(activeUser.specialization || activeUser.city) && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gold)', marginTop: 3 }}>
                        {activeUser.specialization && <span>🎭 {activeUser.specialization}</span>}
                        {activeUser.city && <span style={{ marginLeft: 8 }}>📍 {activeUser.city}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Thread */}
              <div className="messages-thread">
                {historyLoading ? (
                  <LoadingSpinner label="Loading messages..." />
                ) : messages.length === 0 ? (
                  <div className="chat-empty" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🎭</div>
                    <h4 style={{ color: 'var(--color-gold)', marginBottom: 'var(--space-1)' }}>
                      Message {activeUser.name}
                    </h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', maxWidth: 360, margin: '0 auto' }}>
                      Direct message thread initialized. Send a message below to inquire about dates, availability, or custom prasangas!
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.sender_id === user.id;
                    return (
                      <div key={m.id || Math.random()} className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
                        <div className="message-bubble">
                          <div className="message-text">{m.content}</div>
                          <div className="message-meta">
                            <span className="message-time">
                              {new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMine && (
                              <span className={`read-icon ${m.is_read ? 'read' : ''}`}>
                                {m.is_read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {isTyping && (
                  <div className="message-row theirs">
                    <div className="message-bubble typing-bubble">
                      <span className="typing-dots">
                        <span className="dot" />
                        <span className="dot" />
                        <span className="dot" />
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form className="chat-input-bar" onSubmit={handleSendMessage}>
                {error && <div className="chat-error-toast">{error}</div>}
                <input
                  ref={chatInputRef}
                  type="text"
                  placeholder={`Write a message to ${activeUser.name}...`}
                  value={inputContent}
                  onChange={handleInputChange}
                  maxLength={2000}
                />
                <button type="submit" className="btn btn-primary" disabled={!inputContent.trim()}>
                  Send 🚀
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="placeholder-icon">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose an artist or organizer from the left sidebar to start messaging in real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
