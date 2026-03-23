import React, { useState, useEffect, useRef } from "react";
import { getStatuses, createStatus } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import StatusPreviewModal from "./StatusPreviewModal";

const StatusSidebar = ({ onSelectStatusGroup }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [statusGroups, setStatusGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchStatuses = async () => {
    try {
      const res = await getStatuses();
      setStatusGroups(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const fetchFresh = () => fetchStatuses();
    socket.on("new_status", fetchFresh);
    socket.on("status_viewed", fetchFresh);
    socket.on("status_deleted", fetchFresh);
    return () => {
      socket.off("new_status", fetchFresh);
      socket.off("status_viewed", fetchFresh);
      socket.off("status_deleted", fetchFresh);
    };
  }, [socket]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setPreviewFile(file);
    e.target.value = null; // allow choosing the same file again if aborted
  };

  const handleConfirmUpload = async () => {
    setUploading(true);
    const formData = new FormData();
    formData.append("media", previewFile);
    formData.append("mediaType", previewFile.type.startsWith("video") ? "video" : "image");

    try {
      await createStatus(formData);
      setPreviewFile(null);
      fetchStatuses();
    } catch (err) {
      console.error("Failed to post status", err);
    } finally {
      setUploading(false);
    }
  };

  const myStatusGroup = statusGroups.find(g => g.user._id === user._id);
  const otherStatusGroups = statusGroups.filter(g => g.user._id !== user._id);

  // Separate unread (recent) and read (viewed)
  const recentUpdates = otherStatusGroups.filter(g => !g.statuses.every(s => s.viewers?.some(v => v._id === user._id)));
  const viewedUpdates = otherStatusGroups.filter(g => g.statuses.every(s => s.viewers?.some(v => v._id === user._id)));

  const renderGroup = (group, isViewed) => (
    <div className="status-item" key={group.user._id} onClick={() => onSelectStatusGroup(group)}>
      <div className="chat-item-avatar">
        <div className={`status-avatar-ring ${isViewed ? 'viewed' : ''}`}>
          {group.user.avatar ? 
            <img src={group.user.avatar} className="status-avatar-inner" alt={group.user.username} /> : 
            <div className="status-avatar-inner">{group.user.username.charAt(0).toUpperCase()}</div>
          }
        </div>
      </div>
      <div className="chat-item-content">
        <div className="chat-item-row">
          <div className="chat-item-name">{group.user.username}</div>
        </div>
        <div className="chat-item-preview">
          {new Date(group.statuses[group.statuses.length - 1].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="sidebar" style={{ position: "relative" }}>
      {previewFile && (
        <StatusPreviewModal 
          file={previewFile} 
          onConfirm={handleConfirmUpload} 
          onCancel={() => setPreviewFile(null)} 
          loading={uploading} 
        />
      )}

      <div className="sidebar-header" style={{ padding: "16px", backgroundColor: "var(--bg-primary)" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "600", color: "var(--text-primary)" }}>Status</h2>
      </div>

      <div className="chat-list" style={{ backgroundColor: "var(--bg-primary)" }}>
        {/* My Status */}
        <div className="status-item" onClick={() => myStatusGroup ? onSelectStatusGroup(myStatusGroup) : fileInputRef.current.click()}>
          <div className="chat-item-avatar">
            <div className={`status-avatar-ring ${myStatusGroup ? '' : 'add-status'}`}>
              {user.avatar ? 
                <img src={user.avatar} className="status-avatar-inner" alt="My Status" /> : 
                <div className="status-avatar-inner">{user.username.charAt(0).toUpperCase()}</div>
              }
              {!myStatusGroup && <div className="add-status-plus">+</div>}
            </div>
          </div>
          <div className="chat-item-content">
            <div className="chat-item-name">My status</div>
            <div className="chat-item-preview">
              {myStatusGroup ? "Click to view your updates" : "Click to add status update"}
            </div>
          </div>
        </div>
        <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*,video/*" onChange={handleFileChange} />

        {loading ? (
          <div style={{ padding: "16px", color: "var(--text-secondary)" }}>Loading...</div>
        ) : (
          <>
            {/* Recent updates */}
            {recentUpdates.length > 0 && (
              <>
                <div style={{ padding: "12px 16px", color: "var(--accent)", fontSize: "0.9rem", fontWeight: "500", textTransform: "uppercase" }}>
                  Recent updates
                </div>
                {recentUpdates.map((group) => renderGroup(group, false))}
              </>
            )}

            {/* Viewed updates */}
            {viewedUpdates.length > 0 && (
              <>
                <div style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: "500", textTransform: "uppercase", marginTop: "12px" }}>
                  Viewed updates
                 </div>
                {viewedUpdates.map((group) => renderGroup(group, true))}
              </>
            )}

            {recentUpdates.length === 0 && viewedUpdates.length === 0 && (
               <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                 <p>No recent updates</p>
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StatusSidebar;
