importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
   apiKey: "AIzaSyBx1rjkde0aXz-ZC3faSyaJx5c0ERyj4Lg",
  authDomain: "chat-application-5a7f0.firebaseapp.com",
  projectId: "chat-application-5a7f0",
  storageBucket: "chat-application-5a7f0.firebasestorage.app",
  messagingSenderId: "830941210022",
  appId: "1:830941210022:web:9a330be8d7fb544da81b67",
  measurementId: "G-CZYJ8ZPBSG"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});