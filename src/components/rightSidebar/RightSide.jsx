import React, { useContext, useEffect, useState } from "react";
import "./RightSide.css";
import assets from "../../assets/assets";
import { logout } from "../../config/firebase";
import { AppContext } from "../../context/AppContext";
import { use } from "react";

const RightSide = () => {
  const {
    chatUser,
    messages,
    userData,
    setChatVisible,
    chatVisible,
    resetState,
  } = useContext(AppContext);
  const [msgImages, setMsgImages] = useState([]);

  const handleLogout = () => {
    resetState();
    logout();
  };

  useEffect(() => {
    const tempVar = [];
    messages.map((msg) => {
      if (msg.image) {
        tempVar.push(msg.image);
      }
    });
    setMsgImages(tempVar);
  }, [messages]);

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

  return (
    <div className="rs">
      {chatUser ? (
        <div className="rs-profile">
          <img src={assets.profile_img} alt="" />
          <div className="profile-info">
            <h3>
              {chatUser ? (
                <>
                  {chatUser.userData.name}
                  {Date.now() - chatUser.userData.lastSeen <= 70000 ? (
                    <img src={assets.green_dot} alt="" className="dot" />
                  ) : null}
                </>
              ) : (
                <>
                  {userData.name}
                  {Date.now() - userData.lastSeen <= 70000 ? (
                    <img src={assets.green_dot} alt="" className="dot" />
                  ) : null}
                </>
              )}
            </h3>
            {Date.now() -
              (chatUser ? chatUser.userData.lastSeen : userData.lastSeen) >
              70000 && (
              <p className="last-active-time">
                {getLastActiveTime(
                  chatUser ? chatUser.userData.lastSeen : userData.lastSeen
                )}
              </p>
            )}
            <p>{chatUser ? chatUser.userData.bio : userData.bio}</p>
          </div>
        </div>
      ) : (
        <div className="rs-profile">
          <img src={assets.profile_img} alt="" />
          <h3>
            {userData.name}
            {Date.now() - userData.lastSeen <= 70000 ? (
              <img src={assets.green_dot} alt="" className="dot" />
            ) : null}
          </h3>
          <p> {userData.bio}</p>
        </div>
      )}

      <hr></hr>
      <div className="rs-media">
        <p>Media</p>
        <div>
          {msgImages.map((url, index) => (
            <img
              onClick={() => window.open(url)}
              key={index}
              src={url}
              alt=""
            />
          ))}
        </div>
      </div>
      <button type="submit" onClick={() => handleLogout()}>
        Logout
      </button>
    </div>
  );
};

export default RightSide;
