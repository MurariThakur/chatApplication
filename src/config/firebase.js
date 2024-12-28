// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, getDocs, getFirestore, query, setDoc, where,runTransaction } from "firebase/firestore";
import { toast } from "react-toastify";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBx1rjkde0aXz-ZC3faSyaJx5c0ERyj4Lg",
  authDomain: "chat-application-5a7f0.firebaseapp.com",
  projectId: "chat-application-5a7f0",
  storageBucket: "chat-application-5a7f0.firebasestorage.app",
  messagingSenderId: "830941210022",
  appId: "1:830941210022:web:9a330be8d7fb544da81b67",
  measurementId: "G-CZYJ8ZPBSG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const messaging = getMessaging(app);
const auth = getAuth(app);
const db = getFirestore(app);

const signup = async (username, email, password, onSignupComplete) => {
  try {
    // Trim spaces from the username
    const trimmedUsername = username.trim().replace(/\s+/g, "");

    // If the username has spaces, show an error and return
    if (trimmedUsername !== username) {
      toast.error("Username should not contain spaces.");
      return;
    }

    const userRef = collection(db, "users");

    // Check for existing email
    const emailQuery = query(userRef, where("email", "==", email));
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) {
      toast.error("Email already exists");
      return;
    }

    // Check for existing username
    const usernameQuery = query(userRef, where("username", "==", trimmedUsername.toLowerCase()));
    const usernameSnap = await getDocs(usernameQuery);
    if (!usernameSnap.empty) {
      toast.error("Username already exists");
      return;
    }

    // Create user in Firebase Auth
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;

    // Write to Firestore
    await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, "users", user.uid);
      const chatDocRef = doc(db, "chats", user.uid);

      transaction.set(userDocRef, {
        id: user.uid,
        username: trimmedUsername.toLowerCase(),
        email,
        name: "",
        avatar: "",
        bio: "Hi, I am ",
        lastSeen: Date.now(),
      });

      transaction.set(chatDocRef, { chatsData: [] });
    });

    toast.success("User created successfully");

    // Trigger callback if provided
    if (onSignupComplete) {
      onSignupComplete(user.uid);
    }
  } catch (error) {
    console.error("Signup Error:", error);

    // Rollback Firebase Auth user if Firestore transaction fails
    if (auth.currentUser) {
      await auth.currentUser.delete();
    }

    toast.error(error.message || "Failed to create user");
  }
};

  

const login = async (email,password) => {
    try {
        await signInWithEmailAndPassword(auth,email,password);
    } catch (error) {
        console.error(error);
        toast.error(error.code.split('/')[1].split('-').join(" "));
    }
}

const logout = async () => {
   try {
    await signOut(auth);
   } catch (error) {
    console.error(error);
    toast.error(error.code.split('/')[1].split('-').join(" "));
   }
}

const resetPass = async(email) => {
    if(!email){
        toast.error("enter your email");
        return null;
    }

    try {
        const userRef = collection(db,'users');
        const q = query(userRef,where('email','==',email));
        const querySnap = await getDocs(q);
        if(!querySnap.empty){
            await sendPasswordResetEmail(auth,email);
            toast.success("Reset Email Sent");
        }else{
            toast.error("Email does not exists");
        }
    } catch (error) {
        console.log(error);
    toast.error(error.message);
        
    }
}

export {signup,login,logout,auth,db,resetPass} 