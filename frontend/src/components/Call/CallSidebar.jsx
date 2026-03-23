import React, { useState, useEffect } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { getCallHistory } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useCall } from "../../context/CallContext";
import { useSocket } from "../../context/SocketContext";

const formatCallTime = (dateStr) => {
  const date = typeof dateStr === "string" ? parseISO(dateStr) : new Date(dateStr);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd/MM/yyyy");
};

const formatDuration = (seconds) => {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const CallSidebar = ({ onUserSelect }) => {
  const { user } = useAuth();
  const { callUser } = useCall();
  const { socket } = useSocket();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();

    if (socket) {
      socket.on("call_history_updated", fetchHistory);
    }

    return () => {
      if (socket) socket.off("call_history_updated", fetchHistory);
    };
  }, [socket]);

  const fetchHistory = async () => {
    try {
      const res = await getCallHistory();
      setCalls(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const PhoneIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
  );

  const VideoIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
  );

  const ArrowInIcon = ({ color }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3"><line x1="19" y1="5" x2="5" y2="19"/><polyline points="19 19 5 19 5 5"/></svg>
  );
  
  const ArrowOutIcon = ({ color }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="5 5 19 5 19 19"/></svg>
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ paddingBottom: '16px' }}>
        <h2>Calls</h2>
      </div>
      <div className="chat-list">
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>
        ) : calls.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            No recent calls.
          </div>
        ) : (
          calls.map((call) => {
            const isOutgoing = call.caller._id === user._id;
            const otherUser = isOutgoing ? call.receiver : call.caller;
            if (!otherUser) return null; // safety check
            const isMissed = call.status === "missed";
            const isRejected = call.status === "rejected";

            let iconColor = "var(--text-secondary)";
            if (isMissed || isRejected) iconColor = "var(--danger)";
            else if (!isOutgoing) iconColor = "var(--accent)";

            return (
              <div key={call._id} className="chat-item" style={{ cursor: "default" }}>
                <div className="chat-item-avatar" onClick={() => onUserSelect(otherUser)} style={{ cursor: "pointer" }}>
                  <div className="avatar">
                    {otherUser.avatar ? (
                      <img src={otherUser.avatar} alt="Avatar" />
                    ) : (
                      otherUser.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <div className="chat-item-info">
                  <div className="chat-item-header">
                    <h3 onClick={() => onUserSelect(otherUser)} style={{ cursor: "pointer", color: isMissed ? "var(--danger)" : "inherit" }}>
                      {otherUser.username}
                    </h3>
                    <span className="chat-item-time">{formatCallTime(call.createdAt)}</span>
                  </div>
                  <div className="chat-item-last-message" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isOutgoing ? <ArrowOutIcon color={iconColor} /> : <ArrowInIcon color={iconColor} />}
                    <span style={{ color: iconColor }}>
                      {isMissed ? "Missed" : isRejected ? "Rejected" : "Completed"}
                    </span>
                    {call.duration > 0 && <span style={{ marginLeft: "4px" }}>({formatDuration(call.duration)})</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", marginLeft: "10px", color: "var(--accent)", cursor: "pointer" }}>
                  <div onClick={() => callUser(otherUser._id, false)}>
                    <PhoneIcon />
                  </div>
                  <div onClick={() => callUser(otherUser._id, true)}>
                    <VideoIcon />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CallSidebar;
