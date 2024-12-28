import React, { useContext, useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Login from './pages/login/Login';
import Chat from './pages/chat/Chat';
import ProfileUpdate from './pages/profileupdate/ProfileUpdate';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './config/firebase';
import { AppContext } from './context/AppContext';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";

const messaging = getMessaging();

const App = () => {
  const { userData, loadUserData } = useContext(AppContext); 
  const navigate = useNavigate();

  // Authentication state listener
  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        navigate('/chat');
        await loadUserData(user.uid); // Load user data into context
      } else {
        navigate('/');
      }
    });
  }, []);

  // Request FCM permission and save token
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          // Get the FCM token
          const token = await getToken(messaging, {
            vapidKey: "BFNOG-piovPvSy1gaNfUrjatPovcTLO61f8UbRW87sRXkBMGRF1H2EKmQGD5NbEzWtSDOEmZtPFhajCOgwvhvQA" // Replace with your VAPID key
          });
          if (token) {

            // Save the FCM token to Firestore (user document)
            if (userData?.id) {
              await setDoc(doc(db, "users", userData.id), { fcmToken: token }, { merge: true });
            } else {
              console.warn("User ID is not available yet.");
            }
          }
        } else {
          console.log("Notification permission denied");
        }
      } catch (error) {
        console.error("Error getting FCM token:", error);
      }
    };

    if (userData?.id) {
      // Run only if userData.id exists
      requestPermission();
    }
  }, [userData?.id]); // Dependency array to wait for userData.id

  // Register the service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      const { notification } = payload;
      if (notification) {
        new Notification(notification.title, {
          body: notification.body,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<ProfileUpdate />} />
      </Routes>
    </>
  );
};

export default App;
