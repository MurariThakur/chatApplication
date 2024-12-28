import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { createContext, useEffect, useRef, useState } from "react";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";

const AppContext = createContext();

const AppProvider = ({ children }) => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [messagesId, setMessagesId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
 


  const loadUserData = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) {
        console.warn("User document not ready yet. Retrying...");
        setTimeout(() => loadUserData(uid), 1000); // Retry after 1 second
        return;
      }
  
      const userData = userSnap.data();
  
      setUserData(userData);
      if (userData.name) {
        navigate("/chat");
      } else {
        navigate("/profile");
      }
  
      await updateDoc(userRef, { lastSeen: Date.now() });
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };
  

  const resetState = () => {
    setChatVisible(false);
    setChatUser(null);
    setMessages([]);
    setMessagesId(null); // Clear messagesId as wellF
  };

 

  useEffect(() => {
    if (userData) {
      const chatRef = doc(db, "chats", userData.id);
      const unSub = onSnapshot(chatRef, async (res) => {
        const chatItems = res.data().chatsData;
        const tempData = [];
        for (const item of chatItems) {
          const userRef = doc(db, "users", item.rId);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();
          tempData.push({
            ...item,
            userData,
          });
        }
        setChatData(tempData.sort((a, b) => b.updatedAt - a.updatedAt));
      });
      return () => {
        unSub();
      };
    }
  }, [userData]);

  return (
    <AppContext.Provider
      value={{
        userData,
        setUserData,
        chatData,
        setChatData,
        loadUserData,
        messagesId,
        setMessagesId,
        messages,
        setMessages,
        chatUser,
        setChatUser,
        setChatVisible,
        chatVisible,
        resetState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export { AppContext, AppProvider };
