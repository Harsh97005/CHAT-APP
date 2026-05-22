import React, { useContext, useEffect, useState } from 'react'
import './ProfileUpdate.css'
import assets from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../../config/Firebase'
import { onAuthStateChanged } from 'firebase/auth'
import uploadToCloudinary from '../../lib/upload'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const { userData, setUserData } = useContext(AppContext);
  
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uid, setUid] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [image, setImage] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setName(data.name || "");
          setBio(data.bio || "");
          setAvatarUrl(data.avatar || "");
        }
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (userData) {
      setName(userData.name || "");
      setBio(userData.bio || "");
      setAvatarUrl(userData.avatar || "");
      setUid(userData.id || "");
    }
  }, [userData]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!name) {
        toast.error("Please enter your name");
        setLoading(false);
        return;
      }

      let imageUrl = avatarUrl;

      if (image) {
        toast.info("Uploading image to Cloudinary...");
        imageUrl = await uploadToCloudinary(image);
        if (!imageUrl) {
          toast.error("Image upload failed");
          setLoading(false);
          return;
        }
      }

      const userRef = doc(db, 'users', uid);
      const updateData = {
        name: name,
        bio: bio,
        avatar: imageUrl
      };

      await updateDoc(userRef, updateData);

      // Update local state in AppContext
      const updatedUserData = { ...userData, ...updateData };
      setUserData(updatedUserData);

      toast.success("Profile updated successfully!");
      navigate('/chat');
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='profile'>
      <div className="profile-container">
        <form onSubmit={onSubmitHandler}>
          <h3>Profile Details</h3>
          <label htmlFor='avatar'>
            <input 
              onChange={(e) => setImage(e.target.files[0])} 
              type="file" 
              id='avatar' 
              accept='.png, .jpg, .jpeg' 
              hidden
            />
            <img 
              src={image ? URL.createObjectURL(image) : (avatarUrl ? avatarUrl : assets.avatar_icon)} 
              alt="Avatar" 
            />
            upload profile image 
          </label>
          <input 
            onChange={(e) => setName(e.target.value)} 
            value={name} 
            type="text" 
            placeholder='Your name' 
            required 
          />
          <textarea 
            onChange={(e) => setBio(e.target.value)} 
            value={bio} 
            placeholder='write profile bio' 
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </form>
        <img 
          className='profile-pic' 
          src={image ? URL.createObjectURL(image) : (avatarUrl ? avatarUrl : assets.logo_icon)} 
          alt="Profile Preview" 
        />
      </div>
    </div>
  )
}

export default ProfileUpdate