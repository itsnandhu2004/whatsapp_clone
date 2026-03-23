import React, { useState, useEffect, useRef, useCallback } from "react";
import { format, isToday, isYesterday, parseISO, isSameDay } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useCall } from "../../context/CallContext";
import { getMessages, sendMessage, markAsRead, deleteMessage, editMessage, clearChat, blockUser, unblockUser, archiveChat, unarchiveChat, reactToMessage } from "../../utils/api";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import ImageModal from "../Common/ImageModal";

const getInitials = (name) => name?.charAt(0).toUpperCase() || "?";

const formatDateDivider = (dateStr) => {
  const date = typeof dateStr === "string" ? parseISO(dateStr) : new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
};

const formatLastSeen = (dateStr) => {
  if (!dateStr) return "offline";
  const date = typeof dateStr === "string" ? parseISO(dateStr) : new Date(dateStr);
  if (isToday(date)) return `last seen today at ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `last seen yesterday at ${format(date, "h:mm a")}`;
  return `last seen ${format(date, "dd/MM/yyyy")} at ${format(date, "h:mm a")}`;
};

const TypingIndicator = () => (
  <div className="message-bubble-wrapper received">
    <div className="typing-indicator">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  </div>
);

const ArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

const ChatWindow = ({ selectedUser, onBack, onChatUpdate }) => {
  const { user, updateUser } = useAuth();
  const { socket, onlineUsers, lastSeenMap, typingUsers, emitMessageRead } = useSocket();
  const { callUser } = useCall();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [viewingAvatar, setViewingAvatar] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [deletingMessage, setDeletingMessage] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const optionsMenuRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevSelectedUser = useRef(null);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isOnline = onlineUsers[selectedUser?._id] ?? selectedUser?.isOnline;
  const lastSeenStr = lastSeenMap[selectedUser?._id] ?? selectedUser?.lastSeen;
  const isTyping = typingUsers[selectedUser?._id];

  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Fetch messages when selected user changes
  useEffect(() => {
    if (!selectedUser) return;
    if (prevSelectedUser.current === selectedUser._id) return;
    prevSelectedUser.current = selectedUser._id;

    const fetchMsgs = async () => {
      setLoading(true);
      setMessages([]);
      try {
        const res = await getMessages(selectedUser._id);
        setMessages(res.data.data);
        // Mark as read
        await markAsRead(selectedUser._id);
        emitMessageRead(selectedUser._id, user._id);
        if (onChatUpdate) onChatUpdate();
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMsgs();
  }, [selectedUser, user._id, emitMessageRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) scrollToBottom("auto");
  }, [messages.length, scrollToBottom]);

  // Scroll when typing indicator appears/disappears
  useEffect(() => {
    if (isTyping) scrollToBottom();
  }, [isTyping, scrollToBottom]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const newMessageHandler = (msg) => {
      const isRelevant =
        (msg.sender._id === selectedUser._id && msg.receiver._id === user._id) ||
        (msg.sender._id === user._id && msg.receiver._id === selectedUser._id);

      if (isRelevant) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        // Mark as read if received
        if (msg.sender._id === selectedUser._id) {
          markAsRead(selectedUser._id).catch(() => {});
          emitMessageRead(selectedUser._id, user._id);
        }
      }
    };

    const deleteHandler = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true, content: "" } : m))
      );
    };

    const editHandler = (msg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, content: msg.content, isEdited: true } : m))
      );
    };

    const reactionHandler = (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
    };

    socket.on("new_message", newMessageHandler);
    socket.on("message_deleted", deleteHandler);
    socket.on("message_edited", editHandler);
    socket.on("message_reaction", reactionHandler);
    
    return () => {
      socket.off("new_message", newMessageHandler);
      socket.off("message_deleted", deleteHandler);
      socket.off("message_edited", editHandler);
      socket.off("message_reaction", reactionHandler);
    };
  }, [socket, selectedUser, user._id, emitMessageRead]);

  // Listen for read receipts
  useEffect(() => {
    if (!socket || !selectedUser) return;
    const handler = ({ receiverId }) => {
      if (receiverId === selectedUser._id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender._id === user._id ? { ...m, isRead: true } : m
          )
        );
      }
    };
    socket.on("message_read", handler);
    return () => socket.off("message_read", handler);
  }, [socket, user._id, selectedUser]);

  const handleSend = async (payload) => {
    if (!selectedUser || sending) return;
    setSending(true);
    try {
      if (editingMessage) {
        await editMessage(editingMessage._id, payload.content);
        setEditingMessage(null);
      } else {
        await sendMessage(payload);
      }
      // Message will arrive via socket (or be locally updated for sender in some setups, but here we wait for socket)
    } catch (err) {
      console.error("Failed to send/edit message:", err);
      alert(err.response?.data?.message || "Failed to submit message");
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (msg, emoji) => {
    try {
      await reactToMessage(msg._id, emoji);
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  const handleDeleteRequest = (msg) => {
    setDeletingMessage(msg);
  };

  const handleConfirmDelete = async (type) => {
    if (!deletingMessage) return;
    try {
      if (type === "me") {
        await deleteMessage(deletingMessage._id, "me");
        setMessages((prev) => prev.filter((m) => m._id !== deletingMessage._id));
      } else if (type === "everyone") {
        await deleteMessage(deletingMessage._id, "everyone");
        // Socket will handle the UI update
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
      alert(err.response?.data?.message || "Failed to delete message");
    } finally {
      setDeletingMessage(null);
    }
  };

  const handleConfirmClearChat = async () => {
    try {
      await clearChat(selectedUser._id);
      setMessages([]);
      setClearingChat(false);
      setShowOptionsMenu(false);
      if (onChatUpdate) onChatUpdate();
    } catch (err) {
      console.error("Failed to clear chat:", err);
      alert(err.response?.data?.message || "Failed to clear chat");
    }
  };

  const isBlocked = user?.blockedUsers?.includes(selectedUser?._id);

  const handleBlock = async () => {
    try {
      const res = await blockUser(selectedUser._id);
      updateUser(res.data.data);
      setShowOptionsMenu(false);
    } catch (err) {
      console.error("Failed to block user:", err);
      alert(err.response?.data?.message || "Failed to block user");
    }
  };

  const handleUnblock = async () => {
    try {
      const res = await unblockUser(selectedUser._id);
      updateUser(res.data.data);
      setShowOptionsMenu(false);
    } catch (err) {
      console.error("Failed to unblock user:", err);
      alert(err.response?.data?.message || "Failed to unblock user");
    }
  };

  const isArchived = user?.archivedChats?.includes(selectedUser?._id);

  const handleArchive = async () => {
    try {
      const res = await archiveChat(selectedUser._id);
      updateUser(res.data.data);
      setShowOptionsMenu(false);
    } catch (err) {
      console.error("Failed to archive user:", err);
      alert(err.response?.data?.message || "Failed to archive user");
    }
  };

  const handleUnarchive = async () => {
    try {
      const res = await unarchiveChat(selectedUser._id);
      updateUser(res.data.data);
      setShowOptionsMenu(false);
    } catch (err) {
      console.error("Failed to unarchive user:", err);
      alert(err.response?.data?.message || "Failed to unarchive user");
    }
  };

  if (!selectedUser) {
    return (
      <div className="chat-window chat-window-empty">
        <div className="chat-window-empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h2>WhatsApp Clone</h2>
        <p>Select a conversation or start a new chat from the People tab</p>
      </div>
    );
  }

  // Group messages by date for dividers
  const groupedMessages = [];
  let lastDate = null;
  const filteredMessages = messages.filter((msg) => {
    if (!searchQuery.trim()) return true;
    return msg.content && msg.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  filteredMessages.forEach((msg) => {
    const msgDate = typeof msg.createdAt === "string" ? parseISO(msg.createdAt) : new Date(msg.createdAt);
    if (!lastDate || !isSameDay(lastDate, msgDate)) {
      groupedMessages.push({ type: "divider", date: msg.createdAt, id: `divider-${msg.createdAt}` });
      lastDate = msgDate;
    }
    groupedMessages.push({ type: "message", data: msg, id: msg._id });
  });

  return (
    <div className="chat-window">
      {deletingMessage && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <h3>Delete message?</h3>
            <div className="modal-actions-col">
              {deletingMessage.sender._id === user._id && (
                <button className="btn-danger" onClick={() => handleConfirmDelete("everyone")}>Delete for everyone</button>
              )}
              <button className="btn-secondary" onClick={() => handleConfirmDelete("me")}>Delete for me</button>
              <button className="btn-outline" onClick={() => setDeletingMessage(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {clearingChat && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <h3>Clear this chat?</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
              This will delete all messages for you. The other person will still see them.
            </p>
            <div className="modal-actions-col">
              <button className="btn-danger" onClick={handleConfirmClearChat}>Clear chat</button>
              <button className="btn-outline" onClick={() => setClearingChat(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <ImageModal 
        isOpen={viewingAvatar} 
        onClose={() => setViewingAvatar(false)}
        imageUrl={selectedUser?.avatar}
        fallbackName={selectedUser?.username}
        isOwnProfile={false}
      />
      {/* Header */}
      <div className="chat-window-header">
        <div className="chat-window-header-left">
          <button className="icon-btn" onClick={onBack} style={{ display: "none" }} id="back-btn">
            <ArrowLeft />
          </button>
          <div 
            className="chat-item-avatar" 
            onClick={() => setViewingAvatar(true)}
            style={{ cursor: "pointer" }}
          >
            <div className="avatar">
              {selectedUser.avatar ? (
                <img src={selectedUser.avatar} alt={selectedUser.username} />
              ) : (
                getInitials(selectedUser.username)
              )}
            </div>
            {isOnline && <span className="online-dot" />}
          </div>
          <div className="chat-window-header-info">
            <h3>{selectedUser.username}</h3>
            <p className={isTyping ? "" : isOnline ? "online" : ""}>
              {isTyping ? "typing..." : isOnline ? "online" : formatLastSeen(lastSeenStr)}
            </p>
          </div>
        </div>
        <div className="sidebar-header-actions">
          {/* Call Buttons */}
          <button className="icon-btn" title="Audio Call" onClick={() => callUser(selectedUser._id, false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </button>
          <button className="icon-btn" title="Video Call" onClick={() => callUser(selectedUser._id, true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </button>

          <button className={`icon-btn ${isSearching ? "active-search" : ""}`} title="Search" onClick={() => setIsSearching(!isSearching)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <div className="header-options-wrapper" ref={optionsMenuRef} style={{ position: "relative" }}>
            <button className={`icon-btn ${showOptionsMenu ? "active-search" : ""}`} title="More options" onClick={() => setShowOptionsMenu(!showOptionsMenu)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
            {showOptionsMenu && (
              <div className="header-options-dropdown">
                <button onClick={() => { setShowOptionsMenu(false); setClearingChat(true); }}>
                  Clear chat
                </button>
                {isBlocked ? (
                  <button onClick={handleUnblock}>Unblock contact</button>
                ) : (
                  <button onClick={handleBlock}>Block contact</button>
                )}
                {isArchived ? (
                  <button onClick={handleUnarchive}>Unarchive chat</button>
                ) : (
                  <button onClick={handleArchive}>Archive chat</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {isSearching && (
        <div className="chat-search-bar">
          <div className="chat-search-input-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
          <button className="close-search-btn" onClick={() => { setIsSearching(false); setSearchQuery(""); }}>
            Close
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="messages-container">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
            <div className="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 32 }}>
            No messages yet. Say hello! 👋
          </div>
        ) : (
          groupedMessages.map((item, index) =>
            item.type === "divider" ? (
              <div className="message-date-divider" key={item.id}>
                <span>{formatDateDivider(item.date)}</span>
              </div>
            ) : (
              <MessageBubble
                key={item.id}
                message={item.data}
                isSent={item.data.sender._id === user._id}
                onEdit={setEditingMessage}
                onDelete={handleDeleteRequest}
                onReact={handleReact}
                isLast={index === groupedMessages.length - 1}
              />
            )
          )
        )}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isBlocked ? (
        <div className="blocked-contact-banner" onClick={handleUnblock}>
          <p>You blocked this contact. Tap to unblock.</p>
        </div>
      ) : (
        <MessageInput
          onSend={handleSend}
          receiverId={selectedUser._id}
          disabled={sending}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
        />
      )}
    </div>
  );
};

export default ChatWindow;
