import React from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const date = typeof dateStr === "string" ? parseISO(dateStr) : new Date(dateStr);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd/MM/yy");
};

const getInitials = (name) => name?.charAt(0).toUpperCase() || "?";

const DoubleCheck = ({ read }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={read ? "#53bdeb" : "rgba(255,255,255,0.5)"}>
    <path d="M18 7l-8 8-4-4-1.5 1.5L10 18 19.5 8.5z"/>
    <path d="M22 7l-8 8" strokeWidth="2" stroke={read ? "#53bdeb" : "rgba(255,255,255,0.5)"} fill="none"/>
  </svg>
);

const ChatListItem = ({ conversation, isActive, isOnline, onClick, onAvatarClick }) => {
  const { user, lastMessage, unreadCount } = conversation;

  return (
    <div className={`chat-item ${isActive ? "active" : ""}`} onClick={onClick}>
      <div 
        className="chat-item-avatar" 
        onClick={onAvatarClick ? (e) => { e.stopPropagation(); onAvatarClick(user); } : undefined}
        style={onAvatarClick ? { cursor: "pointer" } : {}}
      >
        <div className="avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} />
          ) : (
            getInitials(user.username)
          )}
        </div>
        {isOnline && <span className="online-dot" />}
      </div>

      <div className="chat-item-content">
        <div className="chat-item-row">
          <span className="chat-item-name">{user.username}</span>
          <span className={`chat-item-time ${unreadCount > 0 ? "unread" : ""}`}>
            {formatTime(lastMessage?.createdAt)}
          </span>
        </div>
        <div className="chat-item-row">
          <span className="chat-item-preview">
            {lastMessage?.isSentByMe && (
              <DoubleCheck read={lastMessage.isRead} />
            )}
            {lastMessage?.content || "Start a conversation"}
          </span>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
