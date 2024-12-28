import React, { useContext, useEffect, useRef, useState } from "react";
import "./Profile.css";
import assets from "../../assets/assets";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Upload from "../../lib/Upload";
import { AppContext } from "../../context/AppContext";

const ProfileUpdate = () => {
  const [image, setImage] = useState(false);
  const [uid, setUid] = useState("");
  const [preImg, setPreImg] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
  });

  const { setUserData } = useContext(AppContext);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // if(!preImg && !image){
      //   toast.error('upload profile image')
      // }
      const docRef = doc(db, "users", uid);
      if (image) {
        const imageUrl = await Upload(image);
        setPreImg(imageUrl);
        await updateDoc(docRef, {
          avatar: imageUrl,
          name: formData.name,
          bio: formData.bio,
        });
      } else {
        await updateDoc(docRef, {
          name: formData.name,
          bio: formData.bio,
        });
        toast("profile is updated");
      }
      const snap = await getDoc(docRef);
      setUserData(snap.data());
      navigate("/chat");
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.data().name || docSnap.data().bio) {
          setFormData((prevData) => ({
            ...prevData,
            name: docSnap.data().name,
            bio: docSnap.data().bio,
          }));
        }
        if (docSnap.data().avatar) {
          setPreImg(docSnap.data().avatar);
        }
      } else {
        navigate("/");
      }
    });
  }, []);

  return (
    <div className="profile">
      <div className="profile-container">
        <form onSubmit={handleSubmit}>
          <h3>Profile </h3>
          {/* <label htmlFor="avatar">
            <input
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
              id="avatar"
              accept=".png,.jepg,.jpg"
              hidden
            ></input>
            <img
              src={image ? URL.createObjectURL(image) : assets.avatar_icon}
              alt=""
            />
            upload image
          </label> */}
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            onChange={handleInputChange}
            value={formData.name}
            required
          />
          <textarea
            name="bio"
            placeholder="Write Profile Bio"
            onChange={handleInputChange}
            value={formData.bio}
            required
          />
          <button type="submit">Save</button>
        </form>
        <img
          src={
            image
              ? URL.createObjectURL(image)
              : preImg
              ? preImg
              : assets.logo_icon
          }
          alt=""
          className="profile-pic"
        />
      </div>
    </div>
  );
};

export default ProfileUpdate;
