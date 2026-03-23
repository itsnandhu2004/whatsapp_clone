import React, { useState, useRef, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import Picker from "emoji-picker-react";

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const EmojiIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 13s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" y1="9" x2="9.01" y2="9"/>
    <line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);

const PaperclipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

const PhotoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const DocumentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const MessageInput = ({ onSend, receiverId, disabled, editingMessage, onCancelEdit }) => {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachMenuRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimerRef = useRef(null);
  const { emitTypingStart, emitTypingStop } = useSocket();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    window.requestAnimationFrame(() => {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    });
  }, [text]);

  // Load editing message content
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || "");
    }
  }, [editingMessage]);

  const handleChange = (e) => {
    setText(e.target.value);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);

    // Typing indicators
    if (receiverId) {
      emitTypingStart(receiverId);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        emitTypingStop(receiverId);
      }, 1500);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !selectedFile) return;
    if (disabled) return;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("receiverId", receiverId);
      if (trimmed) formData.append("content", trimmed);
      formData.append("attachment", selectedFile);
      onSend(formData);
    } else {
      onSend({ receiverId, content: trimmed });
    }

    setText("");
    clearFile();
    if (receiverId) emitTypingStop(receiverId);
    clearTimeout(typingTimerRef.current);
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {selectedFile && !editingMessage && (
        <div style={{ padding: "8px 16px", background: "var(--bg-secondary)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <PaperclipIcon /> {selectedFile.name}
          </span>
          <button onClick={clearFile} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}>&times;</button>
        </div>
      )}
      {editingMessage && (
        <div style={{ padding: "8px 16px", background: "var(--bg-secondary)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: "500" }}>Editing message</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "300px" }}>{editingMessage.content}</span>
          </div>
          <button onClick={() => { onCancelEdit(); setText(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem", padding: "4px" }}>&times;</button>
        </div>
      )}
      <div className="message-input-area" style={{ borderTop: (selectedFile || editingMessage) ? "none" : "1px solid var(--border)" }}>
        <div style={{ position: "relative" }} ref={emojiPickerRef}>
          <button className="icon-btn" title="Emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)} disabled={disabled}>
            <EmojiIcon />
          </button>
          {showEmojiPicker && (
            <div style={{ position: "absolute", bottom: "50px", left: "0", zIndex: 100, boxShadow: "0 4px 14px rgba(0,0,0,0.15)", borderRadius: "8px" }}>
              <Picker onEmojiClick={(emojiData) => setText(prev => prev + emojiData.emoji)} theme="dark" />
            </div>
          )}
        </div>
        <div style={{ position: "relative" }} ref={attachMenuRef}>
          <button className="icon-btn" title="Attach File" onClick={() => setShowAttachMenu(!showAttachMenu)} disabled={disabled}>
            <PaperclipIcon />
          </button>
          {showAttachMenu && (
            <div className="attach-menu-popover">
              <button className="attach-menu-btn" onClick={() => { setShowAttachMenu(false); docInputRef.current?.click(); }}>
                <div className="attach-icon-wrapper icon-purple">
                  <DocumentIcon />
                </div>
                Document
              </button>
              <button className="attach-menu-btn" onClick={() => { setShowAttachMenu(false); imageInputRef.current?.click(); }}>
                <div className="attach-icon-wrapper icon-blue">
                  <PhotoIcon />
                </div>
                Photos & Videos
              </button>
            </div>
          )}
        </div>
        <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: "none" }} />
        <input type="file" ref={docInputRef} onChange={handleFileChange} accept="*" style={{ display: "none" }} />

        <div className="message-input-box">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            disabled={disabled}
            rows={1}
          />
        </div>

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={(!text.trim() && !selectedFile) || disabled}
          title={editingMessage ? "Save edit" : "Send message"}
        >
          {editingMessage ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          ) : (
            <SendIcon />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
