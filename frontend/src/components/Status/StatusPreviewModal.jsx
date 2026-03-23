import React from "react";

const StatusPreviewModal = ({ file, onConfirm, onCancel, loading }) => {
  const isVideo = file.type.startsWith("video");
  const url = URL.createObjectURL(file);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "var(--bg-primary)", zIndex: 1000, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px", display: "flex", alignItems: "center", background: "var(--bg-secondary)", gap: "16px" }}>
        <button onClick={onCancel} disabled={loading} style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>Preview Status</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", overflow: "hidden", background: "#000" }}>
        {isVideo ? (
          <video src={url} controls style={{ maxWidth: "100%", maxHeight: "100%" }} />
        ) : (
          <img src={url} alt="Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        )}
      </div>

      {/* Footer Send */}
      <div style={{ padding: "20px", display: "flex", justifyContent: "flex-end", background: "var(--bg-secondary)" }}>
        <button 
          onClick={onConfirm} 
          disabled={loading}
          style={{ background: "var(--accent)", color: "white", padding: "12px 24px", borderRadius: "24px", border: "none", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          {loading ? "Sending..." : "Send"}
          {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>}
        </button>
      </div>
    </div>
  );
};

export default StatusPreviewModal;
