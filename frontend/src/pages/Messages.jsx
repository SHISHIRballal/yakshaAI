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

  // 3. Select active user (from conversations or query param targetUserId)
  useEffect(() => {
    if (loading) return;

    if (targetUserId) {
      const targetId = parseInt(targetUserId, 10);
      const existing = conversations.find((c) => c.other_user_id === targetId);

      if (existing) {
        selectConversation({
          id: existing.other_user_id,
          name: existing.other_user_name,
          role: existing.other_user_role,
          photo: existing.other_user_photo,
        });
      } else {
        // Fetch user info via API or placeholder
        api.get(`/artists`).then((res) => {
          const found = res.data.find((a) => a.user_id === targetId || a.id === targetId);
          if (found) {
            selectConversation({
              id: found.user_id,
              name: found.user_name,
              role: 'artist',
              photo: found.profile_photo_url,
            });
          }
        }).catch(() => {});
      }
    } else if (conversations.length > 0 && !activeUser) {
      const first = conversations[0];
      selectConversation({
        id: first.other_user_id,
        name: first.other_user_name,
        role: first.other_user_role,
        photo: first.other_user_photo,
      });
    }
  }, [targetUserId, conversations, loading]);

  // 4. Load messages for selected conversation
  const selectConversation = async (otherUser) => {
    setActiveUser(otherUser);
    setIsTyping(false);
    setHistoryLoading(true);

    try {
      const res = await api.get(`/messages/${otherUser.id}`);
      setMessages(res.data);
      // Mark read
      await api.put(`/messages/${otherUser.id}/read`);
      if (socketRef.current) {
        socketRef.current.emit('mark_read', { sender_id: otherUser.id });
      }
      fetchConversations();
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
            {conversations.length === 0 ? (
              <div className="empty-sidebar">No conversations yet</div>
            ) : (
              conversations.map((c) => (
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
                      {c.last_message_at && (
                        <span className="conv-time">
                          {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
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
                    <h4 className="chat-username">{activeUser.name}</h4>
                    <span className="user-role-badge">{activeUser.role}</span>
                    <span className={`status-label ${onlineUsers[activeUser.id] ? 'online' : ''}`}>
                      {onlineUsers[activeUser.id] ? '🟢 Online' : '⚪ Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Thread */}
              <div className="messages-thread">
                {historyLoading ? (
                  <LoadingSpinner label="Loading messages..." />
                ) : messages.length === 0 ? (
                  <div className="chat-empty">
                    <span>👋 Say hello to <strong>{activeUser.name}</strong>!</span>
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
