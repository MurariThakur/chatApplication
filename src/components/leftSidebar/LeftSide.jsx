import React, { useContext, useEffect, useState } from "react";
import assets from "../../assets/assets";
import "./LeftSide.css";
import { useNavigate } from "react-router-dom";
import { logout } from "../../config/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";

const LeftSide = () => {
  const navigate = useNavigate();
  const {
    userData,
    chatData,
    chatUser,
    setChatUser,
    setMessagesId,
    messagesId,
    chatVisible,
    resetState,
    setChatVisible,
  } = useContext(AppContext);

  const [user, setUser] = useState(null);
  const [search, setSearch] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const inputhandler = async (e) => {
    try {
      const input = e.target.value;
      setSearchInput(input);
      if (input) {
        setSearch(true);
        const userRef = collection(db, "users");
        const q = query(userRef, where("username", "==", input.toLowerCase()));
        const querySnap = await getDocs(q);
        if (!querySnap.empty && querySnap.docs[0].data().id !== userData.id) {
          let userExist = false;
          chatData.map((user) => {
            if (user.rId === querySnap.docs[0].data().id) {
              userExist = true;
            }
          });
          if (!userExist) {
            setUser(querySnap.docs[0].data());
          }
        } else {
          setUser(null);
        }
      } else {
        setSearch(false);
      }
    } catch (error) {}
  };

  const addChat = async () => {
    const messageRef = collection(db, "messages");
    const chatRef = collection(db, "chats");
    try {
      const newMessageRef = doc(messageRef);
      const newMessageId = newMessageRef.id;

      await setDoc(newMessageRef, {
        createAt: serverTimestamp(),
        messages: [],
      });

      const chatData = {
        messageId: newMessageId,
        lastMessage: "",
        rId: userData.id,
        updatedAt: Date.now(),
        messageSeen: true,
      };

      await updateDoc(doc(chatRef, user.id), {
        chatsData: arrayUnion(chatData),
      });

      await updateDoc(doc(chatRef, userData.id), {
        chatsData: arrayUnion({ ...chatData, rId: user.id }),
      });

      // Update local chat state
      setChat({
        messagesId: newMessageId,
        ...chatData,
        userData: user,
      });

      setSearch(false);
      setChatVisible(true);

      return newMessageId; // Return the ID of the created message
    } catch (error) {
      toast.error(error.message);
      console.error(error);
      return null;
    }
  };

  const setChat = async (item) => {
    try {
      setMessagesId(item.messageId);
      setChatUser(item);

      const userChatsRef = doc(db, "chats", userData.id);
      const userChatsSnapshot = await getDoc(userChatsRef);
      const userChatsData = userChatsSnapshot.data();

      const chatIndex = userChatsData.chatsData.findIndex(
        (c) => c.messageId === item.messageId
      );

      if (chatIndex === -1) {
        console.warn("Chat not found in chatsData. Waiting for update...");
        return; // Prevent further execution until the chat data is updated
      }

      userChatsData.chatsData[chatIndex].messageSeen = true;

      await updateDoc(userChatsRef, {
        chatsData: userChatsData.chatsData,
      });

      setChatVisible(true);
      setSearch(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAddAndSetChat = async () => {
    const newMessageId = await addChat();
    if (newMessageId) {
      const newChat = {
        messageId: newMessageId,
        lastMessage: "",
        rId: user.id,
        updatedAt: Date.now(),
        messageSeen: true,
        userData: user,
      };
      setChat(newChat);
      setSearchInput(""); // Clear the input field
      setSearch(false);
    }
  };

  const filterChatData = (input) => {
    if (!input) {
      return chatData; // Return all data if input is empty
    }

    const lowerCaseInput = input.toLowerCase();

    return chatData.filter((chat) =>
      chat.userData.name.toLowerCase().includes(lowerCaseInput)
    );
  };

  useEffect(() => {
    const updateChatUserData = async () => {
      {
        if (chatUser) {
          const userRef = doc(db, "users", chatUser.userData.id);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();
          setChatUser((prev) => ({
            ...prev,
            userData: userData,
          }));
        }
      }
    };
    updateChatUserData();
  }, [chatData]);

  const handleLogout = () => {
    resetState();
    logout();
  };

  return (
    <div className={`ls ${chatVisible ? "hidden" : ""}`}>
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} alt="" className="logo" />
          <div className="menu">
            <img src={assets.menu_icon} alt="" />
            <div className="sub-menu">
              <p onClick={() => navigate("/profile")}>Edit Profile</p>
              <hr></hr>
              <p onClick={() => handleLogout()}>Logout</p>
            </div>
          </div>
        </div>

        <div className="ls-search">
          <img src={assets.search_icon} alt="" />
          <input
            type="text"
            placeholder="search username"
            value={searchInput}
            onChange={inputhandler}
          />
        </div>
      </div>
      <div className="ls-list">
        {search && user ? (
          <div onClick={handleAddAndSetChat} className="friends add-user">
            <img src={user.avatar ? user.avatar : assets.profile_img} alt="" />
            <div>
              <p>{user.name}</p>
              <span>{user.bio}</span>
            </div>
          </div>
        ) : (
          (searchInput
            ? filterChatData(searchInput) // Call `filterChatData` if searchInput exists
            : chatData
          ) // Show all chatData otherwise
            .map((item, index) => (
              <div
                onClick={() => setChat(item)}
                key={index}
                className={`friends ${
                  item.messageSeen || item.messageId === messagesId
                    ? ""
                    : "border"
                }`}
              >
                <img src={assets.profile_img} alt="" />
                <div>
                  <p>{item.userData.name}</p>
                  <span>{item.lastMessage}</span>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default LeftSide;
