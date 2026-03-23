import React from "react";
import { format, parseISO } from "date-fns";
import { useAuth } from "../../context/AuthContext";

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const date = typeof dateStr === "string" ? parseISO(dateStr) : new Date(dateStr);
  return format(date, "h:mm a");
};

const DoubleCheckIcon = ({ read }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 12.5L7 17.5L16 6"
      stroke={read ? "#53bdeb" : "rgba(255,255,255,0.5)"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 12.5L14 17.5L23 6"
      stroke={read ? "#53bdeb" : "rgba(255,255,255,0.5)"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DownArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6"/>
  </svg>
);

const SmileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const MessageBubble = ({ message, isSent, onEdit, onDelete, onReact, isLast }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = React.useState(false);
  const [showReactions, setShowReactions] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
        setShowReactions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const renderAttachment = () => {
    if (!message.attachment) return null;
    const { url, fileType, fileName } = message.attachment;

    if (fileType?.startsWith("image/")) {
      return (
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={fileName} style={{ maxWidth: "260px", borderRadius: "8px", marginBottom: "4px", cursor: "pointer" }} />
        </a>
      );
    }
    if (fileType?.startsWith("video/")) {
      return (
        <video src={url} controls style={{ maxWidth: "260px", borderRadius: "8px", marginBottom: "4px" }} />
      );
    }
    // Fallback file link
    return (
      <a href={url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "rgba(0,0,0,0.1)", borderRadius: "8px", textDecoration: "none", color: "inherit", marginBottom: "4px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span style={{ fontSize: "0.85rem", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fileName || "Download File"}</span>
      </a>
    );
  };

  return (
    <div className={`message-bubble-wrapper ${isSent ? "sent" : "received"}`}>
      <div className={`message-bubble ${isSent ? "sent" : "received"} ${message.isDeleted ? "deleted-message" : ""}`}>
        {!message.isDeleted && (
          <div className="message-options-wrapper" ref={menuRef}>
            <button className="message-dropdown-btn" onClick={() => { setShowMenu(!showMenu); setShowReactions(false); }}>
              <DownArrowIcon />
            </button>
            
            {showMenu && (
               <div className={`message-dropdown-menu ${isSent ? 'menu-sent' : 'menu-received'} ${isLast ? 'menu-up' : 'menu-down'}`}>
                <button onClick={() => { setShowMenu(false); setShowReactions(true); }}>React</button>
                {isSent && <button onClick={() => { setShowMenu(false); onEdit(message); }}>Edit</button>}
                <button onClick={() => { setShowMenu(false); onDelete(message); }}>Delete</button>
              </div>
            )}

            {showReactions && (
               <div className={`message-dropdown-menu reaction-dropdown ${isSent ? 'menu-sent' : 'menu-received'} ${isLast ? 'menu-up' : 'menu-down'}`} style={{ display: 'flex', flexDirection: 'row', gap: '8px', padding: '8px', borderRadius: '24px', minWidth: 'max-content' }}>
                 {["👍", "❤️", "😂", "😮", "😢", "🙏"].map(e => (
                   <button key={e} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", padding: "4px" }} onClick={() => { setShowReactions(false); onReact(message, e); }}>{e}</button>
                 ))}
               </div>
            )}
          </div>
        )}
        
        {message.isDeleted ? (
          <p className="message-text muted italic">
            <svg style={{ marginRight: 6, verticalAlign: 'middle' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            This message was deleted
          </p>
        ) : (
          <>
            {renderAttachment()}
            {message.content && <p className="message-text">{message.content}</p>}
            
            {/* Reaction Badges */}
            {message.reactions && message.reactions.length > 0 && (() => {
               const reactionGroups = {};
               message.reactions.forEach(r => {
                 if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = [];
                 reactionGroups[r.emoji].push(r);
               });
               
               return (
                 <div className="message-reactions" style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap", justifyContent: isSent ? "flex-end" : "flex-start", position: "absolute", bottom: "-12px", right: isSent ? "12px" : "auto", left: isSent ? "auto" : "12px" }}>
                   {Object.entries(reactionGroups).map(([emoji, reacts]) => {
                      const didIReact = reacts.some(r => r.user?._id === user?._id || r.user === user?._id);
                      return (
                        <div key={emoji} onClick={() => onReact(message, emoji)} style={{ background: didIReact ? "var(--bg-hover)" : "var(--bg-tertiary)", border: didIReact ? "1px solid var(--accent)" : "1px solid var(--border)", borderRadius: "12px", padding: "2px 6px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                          <span>{emoji}</span>
                          {reacts.length > 1 && <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{reacts.length}</span>}
                        </div>
                      );
                   })}
                 </div>
               );
            })()}
          </>
        )}
        
        <div className="message-meta">
          {message.isEdited && <span className="message-edited">(edited)</span>}
          <span className="message-time">
            {formatTime(message.createdAt)}
          </span>
          {isSent && (
            <span className={`message-status ${message.isRead ? "read" : ""}`}>
              <DoubleCheckIcon read={message.isRead} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
