import React, { useContext, useEffect, useState } from "react";
import assets from "../../assets/assets";
import "./ChatBox.css";
import { AppContext } from "../../context/AppContext";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { toast } from "react-toastify";
import upload from "../../lib/Upload";

const ChatBox = () => {
  const {
    userData,
    messagesId,
    chatUser,
    messages,
    setChatUser,
    setMessages,
    chatVisible,
    setChatVisible,
  } = useContext(AppContext);

  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const addEmoji = (emojiObject) => {
    if (emojiObject && emojiObject.emoji) {
      setInput((prevInput) => prevInput + emojiObject.emoji);
    } else {
      console.error("Invalid emoji object:", emojiObject);
    }
    setShowEmojiPicker(false);
  };
  // const CLIENTt_ID =
  // const CLIENTt_SECRET = 
  // const SCOPEe = 

  let accessToken = null;
  let expirationTime = null;
  // const getNewAccessToken = async () => {
  //   const refreshToken =
  //     "1//04uO8mR2mZMcRCgYIARAAGAQSNwF-L9IrdRCaxdJF_phKyz18HZd-np9nL1HwZAIunC5UuP8s765lZ4vMyg-nPkyRSlh7usvMqL0"; // Store the refresh token securely

  //   try {
  //     const response = await axios.post("https://oauth2.googleapis.com/token", {
  //       client_id: CLIENT_ID,
  //       client_secret: CLIENT_SECRET,
  //       refresh_token: refreshToken,
  //       grant_type: "refresh_token",
  //       scope: SCOPE,
  //     });

  //     // Update the access token and expiration time
  //     accessToken = response.data.access_token;
  //     console.log("access", accessToken);
  //     expirationTime = Date.now() + response.data.expires_in * 1000; // expires_in is the expiration time in seconds
  //   } catch (error) {
  //     console.error("Error refreshing access token:", error);
  //     throw new Error("Failed to refresh access token");
  //   }
  // };

  // // Function to check if the token is expired and refresh it
  // const refreshTokenIfNeeded = async () => {
  //   if (!accessToken || Date.now() > expirationTime) {
  //     // Token has expired or is not available, so refresh it
  //     await getNewAccessToken();
  //   }
  // };

  const sendMessage = async () => {
    try {
      if (input && messagesId) {
        // Step 1: Send the message
        await updateDoc(doc(db, "messages", messagesId), {
          messages: arrayUnion({
            sId: userData.id,
            text: input,
            reactions: {
              emoji: [],
              users: userData.id,
            },
            createdAt: new Date(),
            seen: false,
          }),
        });

        // Update last message and timestamp for both users
        const userIds = [chatUser.rId, userData.id];
        userIds.forEach(async (id) => {
          const userChatsRef = doc(db, "chats", id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (userChatsSnapshot.exists()) {
            const userChatData = userChatsSnapshot.data();
            const chatIndex = userChatData.chatsData.findIndex(
              (c) => c.messageId === messagesId
            );
            userChatData.chatsData[chatIndex].lastMessage = input.slice(0, 30);
            userChatData.chatsData[chatIndex].updatedAt = Date.now();

            // Ensure messageSeen is false only for the recipient
            if (userChatData.chatsData[chatIndex].rId === userData.id) {
              userChatData.chatsData[chatIndex].messageSeen = false;
            }
            await updateDoc(userChatsRef, {
              chatsData: userChatData.chatsData,
            });
          }
        });

        // Step 2: Fetch recipient's FCM token and send notification (only if the sender is not the recipient)
        if (chatUser.rId !== userData.id) {
          const recipientDoc = await getDoc(doc(db, "users", chatUser.rId));

          if (recipientDoc.exists()) {
            const { fcmToken } = recipientDoc.data();

            if (fcmToken) {
              // Step 3: Send notification (via HTTP v1 API)
              await fetch(
                `https://fcm.googleapis.com/v1/projects/chat-application-5a7f0/messages:send`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer `,
                  },
                  body: JSON.stringify({
                    message: {
                      token: fcmToken, // Target the recipient's FCM token
                      notification: {
                        title: userData.name,
                        body: input,
                      },
                      data: {
                        click_action: "FLUTTER_NOTIFICATION_CLICK",
                      },
                    },
                  }),
                }
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message or notification:", error);
      toast.error(error.message);
    }
    setInput(""); // Clear the input field after sending
  };

  const sendImage = async (event) => {
    try {
      const fileUrl = await upload(event.target.files[0]);

      if (fileUrl && messagesId) {
        await updateDoc(doc(db, "messages", messagesId), {
          messages: arrayUnion({
            sId: userData.id,
            image: fileUrl,
            createdAt: new Date(),
            seen: false,
          }),
        });
        const userIds = [chatUser.rId, userData.id];

        userIds.forEach(async (id) => {
          const userChatsRef = doc(db, "chats", id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (userChatsSnapshot.exists()) {
            const userChatData = userChatsSnapshot.data();
            const chatIndex = userChatData.chatsData.findIndex(
              (c) => c.messageId === messagesId
            );
            userChatData.chatsData[chatIndex].lastMessage = "image";
            userChatData.chatsData[chatIndex].updatedAt = Date.now();
            if (userChatData.chatsData[chatIndex].rId === userData.id) {
              userChatData.chatsData[chatIndex].messageSeen = false;
            }
            await updateDoc(userChatsRef, {
              chatsData: userChatData.chatsData,
            });
          }
        });
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      if (messagesId) {
        const docRef = doc(db, "messages", messagesId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const allMessages = snapshot.data().messages;

          // Find the deleted message index
          const deletedMessageIndex = allMessages.findIndex(
            (message) => message.createdAt.toMillis() === messageId
          );

          // Remove the deleted message from the messages array
          const updatedMessages = allMessages.filter(
            (message) => message.createdAt.toMillis() !== messageId
          );

          // Update the message document with the remaining messages
          await updateDoc(docRef, { messages: updatedMessages });

          // Determine the new last message
          let newLastMessage;
          if (updatedMessages.length > 0) {
            // If there are new messages, get the last message from the updated messages array
            newLastMessage = updatedMessages[updatedMessages.length - 1];
          } else if (deletedMessageIndex > 0) {
            // If there are no new messages, get the previous message (before the deleted one)
            newLastMessage = allMessages[deletedMessageIndex - 1];
          } else {
            // If no messages are left, set the lastMessage to an empty string
            newLastMessage = { text: "" };
          }

          if (newLastMessage) {
            const userIds = [chatUser.rId, userData.id];

            userIds.forEach(async (id) => {
              const userChatsRef = doc(db, "chats", id);
              const userChatsSnapshot = await getDoc(userChatsRef);

              if (userChatsSnapshot.exists()) {
                const userChatData = userChatsSnapshot.data();
                const chatIndex = userChatData.chatsData.findIndex(
                  (c) => c.messageId === messagesId
                );

                if (chatIndex !== -1) {
                  userChatData.chatsData[chatIndex].lastMessage =
                    newLastMessage.text;
                  await updateDoc(userChatsRef, {
                    chatsData: userChatData.chatsData,
                  });
                }
              }
            });
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete the message.");
    }
  };

  const formatDate = (date) => {
    const msgDate = date instanceof Date ? date : date.toDate();
    const now = new Date();
    const isToday = now.toDateString() === msgDate.toDateString();
    const isYesterday =
      new Date(now.setDate(now.getDate() - 1)).toDateString() ===
      msgDate.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return msgDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const groupMessagesByDate = (messages) => {
    const grouped = {};
    messages.forEach((msg) => {
      const msgDate = formatDate(msg.createdAt);
      if (!grouped[msgDate]) {
        grouped[msgDate] = [];
      }
      grouped[msgDate].push(msg);
    });
    return grouped;
  };
  const getLastActiveTime = (lastSeenTimestamp) => {
    const lastSeenDate = new Date(lastSeenTimestamp);
    const now = new Date();
    const diffInMilliseconds = now - lastSeenDate;
    const diffInMinutes = Math.floor(diffInMilliseconds / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInHours > 0) {
      return `${diffInHours} hours ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minutes ago`;
    } else {
      return "Just now";
    }
  };
  const convertTime = (timestamp) => {
    let date = timestamp.toDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours > 12) {
      return hours - 12 + ":" + minutes + " PM";
    } else {
      return hours + ":" + minutes + " AM";
    }
  };
  const markMessagesAsSeen = async () => {
    if (messagesId && chatUser.rId === chatUser.userData.id) {
      try {
        const messagesRef = doc(db, "messages", messagesId);
        const messagesSnapshot = await getDoc(messagesRef);

        if (messagesSnapshot.exists()) {
          const allMessages = messagesSnapshot.data().messages;

          const updatedMessages = allMessages.map((message) => {
            if (!message.seen && message.sId !== userData.id) {
              return { ...message, seen: true };
            }
            return message;
          });

          await updateDoc(messagesRef, { messages: updatedMessages });
        }
      } catch (error) {
        console.error("Error marking messages as seen:", error);
      }
    }
  };

  useEffect(() => {
    if (messagesId) {
      const unSub = onSnapshot(doc(db, "messages", messagesId), (res) => {
        setMessages(res.data().messages.reverse());

        markMessagesAsSeen();
        // getNewAccessToken();
      });
      return () => {
        unSub();
      };
    }
  }, [messagesId]);

  const groupedMessages = groupMessagesByDate(messages);

  return chatVisible ? (
    chatUser ? (
      <div className="chat-box">
        <div className="chat-user">
          <img
            src={chatUser.userData.avatar || assets.profile_img}
            alt="User Avatar"
            className="logo"
          />
          <div className="user-info">
            <p className="user-name">
              {chatUser.userData.name}
              {Date.now() - chatUser.userData.lastSeen <= 70000 ? (
                <img src={assets.green_dot} alt="Online" className="dot" />
              ) : null}
            </p>
            {Date.now() - chatUser.userData.lastSeen > 70000 && (
              <p style={{ fontSize: "12px" }}>
                {getLastActiveTime(chatUser.userData.lastSeen)}
              </p>
            )}
          </div>
          <div className="icons">
            <img
              onClick={() => setChatVisible(false)}
              src={assets.arrow_icon}
              alt="Close Chat"
              className="arrow"
            />
          </div>
        </div>

        <div className="chat-msg">
          {Object.keys(groupedMessages).map((date, index) => (
            <div key={index}>
              <div className="date-header">{date}</div>
              {groupedMessages[date]
                .slice()
                .reverse()
                .map((msg, msgIndex) => (
                  <div
                    key={msg.createdAt.toMillis()} // Ensure a unique key
                    className={msg.sId === userData.id ? "s-msg" : "r-msg"}
                  >
                    <div className="msg-container">
                      {msg.sId === userData.id ? (
                        // For sent message, delete button comes before the text
                        <>
                          <button
                            className="delete-btn"
                            onClick={() =>
                              deleteMessage(msg.createdAt.toMillis())
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              width="20px"
                              height="20px"
                              fill="#f44336"
                            >
                              <path d="M9 3v1H4v2h16V4h-5V3H9zm-4 6h14v12H5V9zm4 2v8h2v-8H9zm4 0v8h2v-8h-2z" />
                            </svg>
                          </button>
                          <p className="msg">{msg.text}</p>
                        </>
                      ) : (
                        // For received message, message comes before the delete button
                        <>
                          <p className="msg">{msg.text}</p>
                          <button
                            className="delete-btn"
                            onClick={() =>
                              deleteMessage(msg.createdAt.toMillis())
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              width="20px"
                              height="20px"
                              fill="#f44336"
                            >
                              <path d="M9 3v1H4v2h16V4h-5V3H9zm-4 6h14v12H5V9zm4 2v8h2v-8H9zm4 0v8h2v-8h-2z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>

                    {msg.image ? (
                      <img className="msg-img" src={msg.image} alt="Message" />
                    ) : null}
                    <div>
                      <img
                        src={
                          msg.sId === userData.id
                            ? userData.avatar || assets.profile_img
                            : chatUser.userData.avatar || assets.profile_img
                        }
                        alt=""
                        className="msg-logo"
                      />
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <p>{convertTime(msg.createdAt)}</p>
                        {msg.sId === userData.id && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="16px"
                            height="16px"
                            style={{
                              marginLeft: "8px",
                              fill: msg.seen ? "#2196F3" : "#9E9E9E",
                            }}
                          >
                            <path d="M21 7L9 19l-5.5-5.5L5 12l4 4L20 6z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>

        <div className="chat-input">
          {showEmojiPicker && (
            <EmojiPicker
              onEmojiClick={addEmoji}
              style={{ position: "absolute", bottom: "60px", right: "20px" }}
            />
          )}
          <input
            type="text"
            onChange={(e) => setInput(e.target.value)}
            value={input}
            placeholder="send a message"
          />
          <img
            src={assets.emoji}
            alt="emoji"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{ cursor: "pointer", width: "20px" }}
          />
          {/* <input
            type="file"
            onChange={sendImage}
            id="image"
            accept="image/png , image/jpeg"
            hidden
          /> */}
          {/* <label htmlFor="image">
            <img src={assets.gallery_icon} alt="" />
          </label> */}
          <img onClick={sendMessage} src={assets.send_button} alt="" />
        </div>
      </div>
    ) : (
      <div className="chat-welcome">
        <img src={assets.logo_icon} alt=""></img>
        <p>Chat anytime, anywhere</p>
      </div>
    )
  ) : (
    <div className="chat-welcome">
      <img src={assets.logo_icon} alt=""></img>
      <p>Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatBox;
