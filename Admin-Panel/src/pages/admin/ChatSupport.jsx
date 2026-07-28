import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Send, MessageSquare, RefreshCw } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import './ChatSupport.css';

/* Chat users list refreshes every 20s to show new contacts */
const REFRESH_INTERVAL = 20_000;

export default function ChatSupport() {
  const { admin } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [socket, setSocket]             = useState(null);
  const bottomRef = useRef(null);

  /* ── Auto-refresh user list ── */
  const userFetcher = useCallback(async () => {
    const { data } = await axiosInstance.get('/api/chat/users');
    return data.users || data || [];
  }, []);

  const { data: users = [], loading, countdown, refreshing, refresh } =
    useAutoRefresh(userFetcher, REFRESH_INTERVAL);

  /* ── Socket connection ── */
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const s = io(import.meta.env.VITE_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
    });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  /* ── Join room & load history when user selected ── */
  useEffect(() => {
    if (!selectedUser || !socket) return;
    setMessages([]);
    socket.emit('admin-join', { userId: selectedUser._id });
    socket.on('chat-history', (msgs) => setMessages(msgs || []));
    socket.on('receive-message', (msg) =>
      setMessages(prev => [...prev, msg])
    );
    return () => {
      socket.off('chat-history');
      socket.off('receive-message');
    };
  }, [selectedUser, socket]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !selectedUser || !socket) return;
    const msg = {
      sender: 'admin',
      senderName: admin?.name,
      text: input.trim(),
      timestamp: new Date().toISOString(),
      userId: selectedUser._id,
    };
    socket.emit('admin-message', msg);
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const roleBadge = (r) => ({
    admin: 'badge--blue', wholesaler: 'badge--green',
    retailer: 'badge--orange', user: 'badge--gray',
  }[r] || 'badge--gray');

  const formatTime = (t) => t
    ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="chat-layout">
      {/* ── User list sidebar ── */}
      <div className="chat-users">
        <div className="chat-users__header">
          <span className="chat-users__title">Users</span>
          <button
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={refresh} title="Refresh users"
          >
            <RefreshCw size={13} className={refreshing ? 'spin-anim' : ''} />
          </button>
        </div>

        {/* Live indicator */}
        <div style={{ padding: '6px 16px', fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'livePulse 2s infinite', flexShrink: 0 }} />
          Refreshes in {countdown}s
        </div>

        {loading && users.length === 0 ? (
          <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
            <div className="spinner spinner--dark" style={{ width: 24, height: 24 }} />
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: 20, fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            No users yet
          </div>
        ) : (
          users.map(u => (
            <button
              key={u._id}
              className={`chat-user-item ${selectedUser?._id === u._id ? 'chat-user-item--active' : ''}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="chat-user-item__avatar">{u.name?.[0]?.toUpperCase()}</div>
              <div className="chat-user-item__info">
                <span className="chat-user-item__name">{u.name}</span>
                <span className={`badge ${roleBadge(u.role)}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                  {u.role}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* ── Chat area ── */}
      <div className="chat-main">
        {!selectedUser ? (
          <div className="chat-empty">
            <MessageSquare size={48} color="var(--text-muted)" strokeWidth={1.5} />
            <p>Select a user to start chatting</p>
          </div>
        ) : (
          <>
            <div className="chat-main__header">
              <div className="chat-user-item__avatar" style={{ width: 38, height: 38, fontSize: 15 }}>
                {selectedUser.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{selectedUser.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {selectedUser.role}
                </p>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty" style={{ padding: 40 }}>
                  <MessageSquare size={36} color="var(--text-muted)" strokeWidth={1.5} />
                  <p style={{ fontSize: 13 }}>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i}
                    className={`chat-bubble ${m.sender === 'admin' ? 'chat-bubble--admin' : 'chat-bubble--user'}`}>
                    <p className="chat-bubble__text">{m.text || m.message}</p>
                    <span className="chat-bubble__time">{formatTime(m.timestamp || m.createdAt)}</span>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <div className="chat-input-row">
              <input
                className="chat-input"
                placeholder="Type your message…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <button
                className="btn btn--primary chat-send-btn"
                onClick={sendMessage}
                disabled={!input.trim()}
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
