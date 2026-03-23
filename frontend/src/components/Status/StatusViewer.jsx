import React, { useState, useEffect } from "react";
import { viewStatus, deleteStatus } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const StatusViewer = ({ statusGroup, onClose }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [statusGroup]);

  useEffect(() => {
    if (!statusGroup || !statusGroup.statuses.length) return;
    const timer = setTimeout(() => {
      handleNext();
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentIndex, statusGroup]);

  useEffect(() => {
    if (statusGroup && statusGroup.statuses[currentIndex]) {
       // Only mark as viewed if it's not my own status
       if (statusGroup.user._id !== user._id) {
         viewStatus(statusGroup.statuses[currentIndex]._id).catch(err => console.error(err));
       }
    }
  }, [currentIndex, statusGroup, user._id]);

  if (!statusGroup) {
    return (
      <div className="chat-window-empty">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v4l3 3"></path>
        </svg>
        <h2>Click on a contact to view their status updates</h2>
      </div>
    );
  }

  const handleNext = () => {
    if (currentIndex < statusGroup.statuses.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      onClose(); // Auto-close when done
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
    }
  };

  const currentStatus = statusGroup.statuses[currentIndex];
  const isMine = statusGroup.user._id === user._id;

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this status?")) {
      try {
        await deleteStatus(currentStatus._id);
        onClose(); // Close viewer when deleted
      } catch (err) {
        console.error("Failed to delete status", err);
      }
    }
  };

  return (
    <div style={{ flex: 1, backgroundColor: "#000", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {/* Progress Bars */}
      <div style={{ position: "absolute", top: "16px", left: "16px", right: "16px", display: "flex", gap: "4px", zIndex: 10 }}>
        {statusGroup.statuses.map((_, i) => (
          <div key={i} style={{ flex: 1, height: "3px", backgroundColor: i < currentIndex ? "#fff" : i === currentIndex ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)", borderRadius: "2px", overflow: "hidden" }}>
             {i === currentIndex && (
               <div key={currentIndex + "-" + statusGroup.user._id} style={{ height: "100%", backgroundColor: "#fff", width: "100%", animation: "progress 5s linear forwards" }} />
             )}
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ position: "absolute", top: "32px", left: "16px", display: "flex", alignItems: "center", gap: "12px", zIndex: 10 }}>
         {statusGroup.user.avatar ? 
           <img src={statusGroup.user.avatar} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="user" /> :
           <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
             {statusGroup.user.username.charAt(0).toUpperCase()}
           </div>
         }
         <div style={{ color: 'white', fontWeight: '500', textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>{isMine ? "My status" : statusGroup.user.username}</div>
         <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
           {new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </div>
      </div>

      {/* Close button */}
      <button onClick={onClose} style={{ position: "absolute", top: "32px", right: "24px", background: "none", border: "none", color: "white", cursor: "pointer", zIndex: 10 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>

      {/* Delete button (only for own status) */}
      {isMine && (
        <button onClick={handleDelete} title="Delete status" style={{ position: "absolute", top: "34px", right: "72px", background: "none", border: "none", color: "white", cursor: "pointer", zIndex: 10 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
        </button>
      )}

      {/* Navigation Touch Areas */}
      <div onClick={handlePrev} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "30%", zIndex: 5, cursor: "pointer" }} />
      <div onClick={handleNext} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "30%", zIndex: 5, cursor: "pointer" }} />

      {/* Media content */}
      <style>{`@keyframes progress { from { width: 0%; } to { width: 100%; } }`}</style>
      
      {currentStatus.mediaType === "image" && (
        <img src={currentStatus.mediaUrl} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", zIndex: 1 }} alt="Status" />
      )}
      {currentStatus.mediaType === "video" && (
        <video src={currentStatus.mediaUrl} autoPlay style={{ maxWidth: "100%", maxHeight: "100%", zIndex: 1 }} />
      )}
      {currentStatus.mediaType === "text" && (
        <div style={{ padding: "40px", textAlign: "center", color: "white", fontSize: "2rem", fontFamily: "var(--font-display)", zIndex: 1 }}>
          {currentStatus.content}
        </div>
      )}

      {/* Viewers for own status */}
      {isMine && (
        <div style={{ position: "absolute", bottom: "32px", left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
          <div style={{ background: "rgba(0,0,0,0.7)", padding: "12px 24px", borderRadius: "16px", color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", minWidth: "220px", backdropFilter: "blur(4px)" }}>
            <div style={{ fontSize: "0.95rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              {currentStatus.viewers?.length || 0}
            </div>
            {currentStatus.viewers?.length > 0 && (
              <div className="custom-scroll" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxHeight: "150px", overflowY: "auto", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                {currentStatus.viewers.map(v => (
                  <div key={v._id} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem" }}>
                    {v.avatar ? 
                       <img src={v.avatar} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} alt={v.username} /> :
                       <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>{v.username.charAt(0).toUpperCase()}</div>
                    }
                    <span style={{ fontWeight: "500" }}>{v.username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusViewer;
