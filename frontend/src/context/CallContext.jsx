import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { logCall } from "../utils/api";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerName, setCallerName] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef(null);

  // Setup refs properly upon remount
  useEffect(() => {
    if (myVideo.current && stream) {
      myVideo.current.srcObject = stream;
    }
  }, [stream, myVideo]);

  useEffect(() => {
    if (userVideo.current && remoteStream) {
      userVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream, userVideo]);

  const createPeerConnection = (userId) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice_candidate", { to: userId, candidate: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    return peer;
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("call_incoming", ({ signal, from, name, isVideoCall }) => {
      setReceivingCall(true);
      setCallerName(name);
      setCall({ isReceivingCall: true, from, name, signal });
      setCallerSignal(signal);
      setIsVideoCall(isVideoCall);
    });

    socket.on("ice_candidate_receive", (candidate) => {
      if (connectionRef.current) {
        connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
      }
    });

    socket.on("call_ended", () => {
      endCall(false); // don't emit backward
    });

    socket.on("call_accepted", async (signal) => {
      setCallAccepted(true);
      setIsCalling(false);
      setCallStartTime(Date.now());
      if (connectionRef.current) {
        try {
          await connectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        } catch (err) {
          console.error("WebRTC Error setting Remote Description:", err);
        }
      }
    });

    return () => {
      socket.off("call_incoming");
      socket.off("ice_candidate_receive");
      socket.off("call_ended");
      socket.off("call_accepted");
    };
  }, [socket]);

  const answerCall = async () => {
    setCallAccepted(true);
    setReceivingCall(false);
    setCallStartTime(Date.now());

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: isVideoCall, audio: true });
      setStream(mediaStream);
      
      const peer = createPeerConnection(call.from);
      connectionRef.current = peer;

      mediaStream.getTracks().forEach((track) => peer.addTrack(track, mediaStream));

      await peer.setRemoteDescription(new RTCSessionDescription(callerSignal));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("answer_call", { signal: answer, to: call.from });

    } catch (err) {
      console.error("Error answering call", err);
      // Fallback close
      endCall(true);
    }
  };

  const callUser = async (userToCallId, video = true) => {
    setIsVideoCall(video);
    setIsCalling(true);
    setCall({ from: userToCallId }); // store target ID in `from` temporarily to simplify ending
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      setStream(mediaStream);

      const peer = createPeerConnection(userToCallId);
      connectionRef.current = peer;
      
      mediaStream.getTracks().forEach((track) => peer.addTrack(track, mediaStream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("call_user", {
        userToCall: userToCallId,
        signalData: offer,
        from: user._id,
        name: user.username,
        isVideoCall: video,
      });

    } catch (err) {
      console.error("Error making call", err);
      endCall(true);
    }
  };

  const endCall = (emit = true) => {
    let duration = 0;
    let status = "missed";
    
    if (callAccepted) {
       status = "completed";
       duration = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;
    } else if (receivingCall) {
       status = "rejected";
    }

    if (isCalling) {
      logCall({
        receiverId: call.from,
        callType: isVideoCall ? "video" : "audio",
        status,
        duration,
      }).then(() => {
        if (socket) socket.emit("new_call_logged", { receiverId: call.from });
      }).catch(console.error);
    }

    setCallEnded(true);
    setReceivingCall(false);
    setIsCalling(false);
    
    if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (emit && call.from && socket) {
      socket.emit("end_call", { to: call.from });
    }

    setCall({});
    setRemoteStream(null);
    setCallerSignal(null);
    setTimeout(() => {
        setCallEnded(false);
        setCallAccepted(false);
    }, 1000);
  };

  const rejectCall = () => {
    if (socket && call.from) {
       socket.emit("end_call", { to: call.from });
       
       // Optional: Log rejection on the receiver's end too, but we let caller handle misses usually 
       // to avoid duplicates, although logging reject here is also viable. We'll rely on caller's log.
    }
    setReceivingCall(false);
    setCall({});
    setCallerSignal(null);
  };

  return (
    <CallContext.Provider
      value={{
        call,
        callAccepted,
        myVideo,
        userVideo,
        stream,
        remoteStream,
        callEnded,
        callerName,
        receivingCall,
        isCalling,
        callUser,
        answerCall,
        endCall,
        rejectCall,
        isVideoCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) return null; // allow graceful destructuring attempt if context not wrapped. better to throw though.
  return ctx;
};
