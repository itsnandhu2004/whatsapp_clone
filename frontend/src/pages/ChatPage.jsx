import React, { useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import VerticalNav from "../components/Sidebar/VerticalNav";
import ChatWindow from "../components/ChatWindow/ChatWindow";
import StatusSidebar from "../components/Status/StatusSidebar";
import StatusViewer from "../components/Status/StatusViewer";
import CallSidebar from "../components/Call/CallSidebar";

const ChatPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeNav, setActiveNav] = useState("messages"); // 'messages' or 'status'
  const [selectedStatusGroup, setSelectedStatusGroup] = useState(null);
  const [refreshSidebarTrigger, setRefreshSidebarTrigger] = useState(0);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    if (window.innerWidth <= 768) {
      document.querySelector('.app-layout')?.classList.add('chat-open');
    }
  };

  const handleBack = () => setSelectedUser(null);
  
  return (
    <div className={`app-layout ${selectedUser || selectedStatusGroup ? "chat-open" : ""}`}>
      <VerticalNav activeNav={activeNav} onNavChange={setActiveNav} onProfileClick={() => {}} />
      
      {activeNav === "messages" ? (
        <>
          <Sidebar selectedUser={selectedUser} onSelectUser={handleSelectUser} refreshTrigger={refreshSidebarTrigger} />
          <ChatWindow selectedUser={selectedUser} onBack={handleBack} onChatUpdate={() => setRefreshSidebarTrigger(p => p+1)} />
        </>
      ) : activeNav === "status" ? (
        <>
          <StatusSidebar onSelectStatusGroup={setSelectedStatusGroup} />
          <StatusViewer statusGroup={selectedStatusGroup} onClose={() => setSelectedStatusGroup(null)} />
        </>
      ) : activeNav === "calls" ? (
        <>
          <CallSidebar onUserSelect={handleSelectUser} />
          {selectedUser ? (
             <ChatWindow selectedUser={selectedUser} onBack={handleBack} onChatUpdate={() => setRefreshSidebarTrigger(p => p+1)} />
          ) : (
             <div className="chat-window chat-window-empty">
               <div className="chat-window-empty-icon">
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                   <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                 </svg>
               </div>
               <h2>WhatsApp Clone</h2>
               <p>Select a call from history to view chat or start a new call</p>
             </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default ChatPage;
