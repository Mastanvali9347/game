import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Shield, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { connectSocket, getSocket } from '../services/socket';
import './ChatBox.css';

const ChatBox = ({ roomId, messages = [], currentUserId, currentUserName, setMessages }) => {
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const pickerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const socket = getSocket();
    if (!socket) return;

    const messageData = {
      room_id: roomId,
      text,
      user_id: currentUserId,
      name: currentUserName,
      time: new Date().toLocaleTimeString()
    };

    socket.emit('chat_message_socket', messageData);

    setInput('');
  };

  return (
    <div className="chat-container">

      <div className="chat-header">
        <div className="chat-header-info">
          <MessageSquare size={16} className="text-indigo-400" />
          <h3 className="chat-header-title">In-Game Chat</h3>
        </div>
        <span className="chat-live-badge">LIVE</span>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isMe = msg.user_id === currentUserId;
          const isSystem = msg.type === 'system';

          if (isSystem) {
            return (
              <div key={i} className="system-msg-container">
                <div className="system-msg">
                  {msg.showIcon && <Shield size={10} />}
                  {msg.text}
                </div>
              </div>
            );
          }

          return (
            <div key={i} className={`message-wrapper ${isMe ? 'message-me' : 'message-other'}`}>
              {!isMe && (
                <span className="message-sender">
                  {msg.name || 'User'}
                </span>
              )}

              <div className={`bubble ${isMe ? 'bubble-me' : 'bubble-other'}`}>
                {msg.text}
                <div className="message-time">{msg.time}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-form">
        <div className="input-wrapper">
          {showEmojiPicker && (
            <div className="emoji-picker-popup" ref={pickerRef}>
              <EmojiPicker 
                onEmojiClick={onEmojiClick} 
                theme="dark"
                searchDisabled
                skinTonesDisabled
                width="100%"
                height={350}
              />
            </div>
          )}

          <button
            type="button"
            className="emoji-toggle"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile size={20} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something..."
            className="chat-input"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="send-button"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;