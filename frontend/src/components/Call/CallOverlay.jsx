import React from 'react';
import { useCall } from '../../context/CallContext';

const CallOverlay = () => {
  const { call, callAccepted, callEnded, receivingCall, answerCall, rejectCall, endCall, myVideo, userVideo, isVideoCall, isCalling } = useCall();

  if (!receivingCall && !isCalling && (!callAccepted || callEnded)) {
    return null;
  }

  return (
    <div className="call-overlay">
      {/* Incoming Call Dialog */}
      {receivingCall && !callAccepted && (
        <div className="incoming-call-box">
          <div className="caller-info">
            <div className="call-icon pulse">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <h2>{call.name || "Incoming Call"}</h2>
            <p>{call.isVideoCall ? "Incoming Video Call..." : "Incoming Audio Call..."}</p>
          </div>
          <div className="call-actions">
            <button className="btn-success call-btn" onClick={answerCall}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </button>
            <button className="btn-danger call-btn" onClick={rejectCall}>
               <svg style={{ transform: 'rotate(135deg)' }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Active Call View */}
      {(isCalling || callAccepted) && !callEnded && (
        <div className="active-call-box">
          <div className="call-header">
             <h2>{isCalling && !callAccepted ? `Calling...` : (isVideoCall ? 'Video Call' : 'Audio Call')}</h2>
             {!callAccepted && <p className="calling-status">Ringing...</p>}
          </div>

          <div className="video-container">
             <div className="video-wrapper local-video">
                <video playsInline muted ref={myVideo} autoPlay />
             </div>
             
             {callAccepted && (
               <div className="video-wrapper remote-video">
                 <video playsInline ref={userVideo} autoPlay />
                 {/* Fallback avatar overlay if audio only could go here */}
               </div>
             )}
          </div>

          <div className="call-controls-bar">
            {/* End Call Button */}
            <button className="btn-danger end-call-btn" onClick={() => endCall(true)}>
               <svg style={{ transform: 'rotate(135deg)' }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallOverlay;
