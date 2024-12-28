import React, { useContext, useEffect, useRef, useState } from "react";
import "./Chat.css";
import LeftSide from "../../components/leftSidebar/LeftSide";
import ChatBox from "../../components/chatbox/ChatBox";
import RightSide from "../../components/rightSidebar/RightSide";
import { AppContext } from "../../context/AppContext";

const Chat = () => {
  const { chatData, userData, chatVisible, setChatVisible, resetState } =
    useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef(null);

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = setTimeout(() => {
      setChatVisible(false);
      resetState();
    }, 15 * 1000); 
  };

  const handleUserActivity = () => {
    resetInactivityTimer(); 
  };

  useEffect(() => {
    if (chatVisible) {
      window.addEventListener("mousemove", handleUserActivity);
      window.addEventListener("keydown", handleUserActivity);
      window.addEventListener("click", handleUserActivity);
      resetInactivityTimer();
    }

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
    };
  }, [chatVisible]);

  useEffect(() => {
    if (chatData && userData) {
      setLoading(false);
    }
  }, [chatData, userData]);

  return (
    <div className="chat">
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="chat-container">
          <LeftSide />
          <ChatBox />
          <RightSide />
        </div>
      )}
    </div>
  );
};

export default Chat;
