import React from "react";

const getInitials = (name) => name?.charAt(0).toUpperCase() || "?";

const UserListItem = ({ user, isActive, isOnline, onClick, onAvatarClick }) => {
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
          <span className="chat-item-time" style={{ fontSize: "0.7rem" }}>
            {isOnline ? (
              <span style={{ color: "var(--accent)" }}>online</span>
            ) : (
              "offline"
            )}
          </span>
        </div>
        <div className="chat-item-row">
          <span className="chat-item-preview">{user.status || user.email}</span>
        </div>
      </div>
    </div>
  );
};

export default UserListItem;
