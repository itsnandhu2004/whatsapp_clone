import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getConversations, getAllUsers, uploadAvatar } from "../../utils/api";
import ChatListItem from "./ChatListItem";
import UserListItem from "./UserListItem";
import ProfilePanel from "./ProfilePanel";
import ImageModal from "../Common/ImageModal";

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const Sidebar = ({ selectedUser, onSelectUser, refreshTrigger }) => {
  const { user, logout, updateUser } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [tab, setTab] = useState("chats");
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await uploadAvatar(formData);
      if (res.data.success) {
        updateUser(res.data.data);
        // Immediately close the image modal if it's open so it doesn't just hang around after change
        setViewingUser(null);
      }
    } catch (err) {
      console.error("Failed to upload avatar", err);
      alert("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data.data);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      setAllUsers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, [refreshTrigger]);

  // Refresh conversations when a new message arrives
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchConversations();
    socket.on("new_message", handler);
    return () => socket.off("new_message", handler);
  }, [socket]);

  const getInitials = (name) => name?.charAt(0).toUpperCase() || "?";

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.user.username.toLowerCase().includes(search.toLowerCase());
    const isArchived = user?.archivedChats?.includes(c.user._id.toString());
    
    if (tab === "chats") {
      return matchesSearch && !isArchived;
    } else if (tab === "archived") {
      return matchesSearch && isArchived;
    }
    return matchesSearch;
  });

  const filteredUsers = allUsers.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sidebar" style={{ position: "relative", overflow: "hidden" }}>
      <ImageModal 
        isOpen={!!viewingUser} 
        onClose={() => setViewingUser(null)}
        imageUrl={viewingUser?.avatar}
        fallbackName={viewingUser?.username}
        isOwnProfile={viewingUser?._id === user?._id}
        onChangeClick={() => fileInputRef.current?.click()}
        uploadingAvatar={uploadingAvatar}
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: "none" }} 
        accept="image/*" 
        onChange={handleFileChange}
      />

      <ProfilePanel 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
        user={user} 
        onAvatarClick={() => setViewingUser(user)} 
        uploadingAvatar={uploadingAvatar} 
      />
      
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <div 
            className="sidebar-header-avatar" 
            onClick={() => setViewingUser(user)}
            style={{ cursor: "pointer" }}
            title="Profile details"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} />
            ) : (
              <div>{getInitials(user?.username)}</div>
            )}
          </div>
          <span className="sidebar-header-name">{user?.username}</span>
        </div>
        <div className="sidebar-header-actions">
          {/* A new chat button in case they want to start one without finding the tab */}
          <button className="icon-btn" title="New Chat" onClick={() => setTab("users")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          {/* EditIcon repurposed to open Profile Panel */}
          <button className="icon-btn" title="Profile Options" onClick={() => setShowProfile(true)}>
            <EditIcon />
          </button>
          <button className="icon-btn" title="Logout" onClick={logout}>
            <LogoutIcon />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-bar">
          <SearchIcon />
          <input
            placeholder="Search or start new chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <div
          className={`sidebar-tab ${tab === "chats" || tab === "archived" ? "active" : ""}`}
          onClick={() => setTab("chats")}
        >
          Chats
        </div>
        <div
          className={`sidebar-tab ${tab === "users" ? "active" : ""}`}
          onClick={() => setTab("users")}
        >
          People
        </div>
      </div>

      {/* List */}
      <div className="chat-list">
        {tab === "chats" && user?.archivedChats?.length > 0 && !search && (
          <div className="archived-banner-btn" onClick={() => setTab("archived")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "16px" }}>
              <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
            </svg>
            Archived
            <span className="archived-count">{user.archivedChats.length}</span>
          </div>
        )}
        {tab === "archived" && (
          <div className="archived-header-back" onClick={() => setTab("chats")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "16px" }}>
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to Chats
          </div>
        )}
        {tab === "chats" || tab === "archived" ? (
          loading ? (
            <div className="loading-messages">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 68, borderRadius: 12 }}
                />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="empty-conversations">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
              </svg>
              <h3>No {tab === "archived" ? "archived chats" : "conversations yet"}</h3>
              <p>{tab === "archived" ? "Your archived chats will appear here" : "Go to People tab to start chatting"}</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ChatListItem
                key={conv.user._id}
                conversation={conv}
                isActive={selectedUser?._id === conv.user._id}
                isOnline={onlineUsers[conv.user._id] ?? conv.user.isOnline}
                onClick={() => onSelectUser(conv.user)}
                onAvatarClick={setViewingUser}
              />
            ))
          )
        ) : (
          filteredUsers.length === 0 ? (
            <div className="empty-conversations">
              <h3>No users found</h3>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <UserListItem
                key={u._id}
                user={u}
                isActive={selectedUser?._id === u._id}
                isOnline={onlineUsers[u._id] ?? u.isOnline}
                onClick={() => { onSelectUser(u); setTab("chats"); }}
                onAvatarClick={setViewingUser}
              />
            ))
          )
        )}
      </div>
    </div>
  );
};

export default Sidebar;
