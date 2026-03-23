import React from "react";

const ArrowLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);


const ProfilePanel = ({ isOpen, onClose, user, onAvatarClick, uploadingAvatar }) => {
  const getInitials = (name) => name?.charAt(0).toUpperCase() || "?";

  return (
    <div className={`profile-panel ${isOpen ? "open" : ""}`}>

      <div className="profile-header">
        <button className="back-btn" onClick={onClose}>
          <ArrowLeft />
        </button>
        <h2>Profile</h2>
      </div>

      <div className="profile-body">
        <div className="profile-avatar-section" style={{ flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div className="profile-avatar-large" onClick={onAvatarClick} title="View Photo">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} className={uploadingAvatar ? "uploading" : ""} />
            ) : (
              <div className={`avatar-initials ${uploadingAvatar ? "uploading" : ""}`}>
                {getInitials(user?.username)}
              </div>
            )}
            {uploadingAvatar && (
              <div className="upload-spinner">
                <div className="spinner" />
              </div>
            )}
          </div>
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
             <span style={{ fontSize: "1.5rem", fontWeight: 500, color: "#000000" }}>{user?.username}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePanel;
