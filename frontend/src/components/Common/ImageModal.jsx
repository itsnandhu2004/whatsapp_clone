import React from "react";

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const ImageModal = ({ isOpen, onClose, imageUrl, fallbackName, isOwnProfile, onChangeClick, uploadingAvatar }) => {
  if (!isOpen) return null;

  return (
    <div className="image-modal-overlay" onClick={onClose} style={styles.overlay}>
      <button className="image-modal-close" style={styles.closeBtn} onClick={onClose}>
        <CloseIcon />
      </button>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()} style={styles.content}>
        {imageUrl ? (
          <img src={imageUrl} alt="Profile" style={styles.image} />
        ) : (
          <div style={styles.fallback}>
            {fallbackName?.charAt(0).toUpperCase() || "?"}
          </div>
        )}
        
        {isOwnProfile && (
          <div style={styles.actions}>
             <button 
              style={styles.changeBtn} 
              onClick={onChangeClick} 
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? "Uploading..." : "Change Profile Photo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(11, 20, 26, 0.85)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  closeBtn: {
    position: "absolute",
    top: "1.5rem",
    right: "1.5rem",
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    zIndex: 1001
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    maxWidth: "80vw",
    maxHeight: "80vh"
  },
  image: {
    maxWidth: "100%",
    maxHeight: "70vh",
    objectFit: "contain"
  },
  fallback: {
    width: "300px",
    height: "300px",
    backgroundColor: "#dfe5e7",
    color: "#fff",
    fontSize: "6rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%"
  },
  actions: {
    marginTop: "1rem"
  },
  changeBtn: {
    padding: "0.8rem 1.5rem",
    backgroundColor: "#008069",
    color: "#fff",
    border: "none",
    borderRadius: "24px",
    fontSize: "1rem",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    opacity: 1,
    transition: "opacity 0.2s"
  }
};

export default ImageModal;
