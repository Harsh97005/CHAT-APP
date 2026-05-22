import React, { useContext, useState } from 'react'
import './LeftSidebar.css'
import assets from '../../assets/assets'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../config/Firebase'
import { AppContext } from '../../context/AppContext'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  arrayUnion,
  getDoc 
} from 'firebase/firestore'
import { db } from '../../config/Firebase'
import { toast } from 'react-toastify'

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { 
    userData, 
    chatData, 
    chatUser, 
    setChatUser, 
    messagesId, 
    setMessagesId,
    formatLastSeen 
  } = useContext(AppContext);

  const [search, setSearch] = useState("");
  const [searchedUser, setSearchedUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const searchHandler = async (e) => {
    const val = e.target.value;
    setSearch(val);
    if (!val.trim()) {
      setSearchedUser(null);
      setShowSearch(false);
      return;
    }
    
    try {
      setShowSearch(true);
      const userRef = collection(db, 'users');
      const q = query(userRef, where('username', '==', val.toLowerCase().trim()));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty && querySnap.docs[0].data().id !== userData.id) {
        setSearchedUser(querySnap.docs[0].data());
      } else {
        setSearchedUser(null);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const addChatHandler = async () => {
    if (!searchedUser) return;
    
    try {
      // Check if chat room already exists in current chat list
      const alreadyExists = chatData?.find(chat => chat.rId === searchedUser.id);
      
      if (alreadyExists) {
        setMessagesId(alreadyExists.messageId);
        setChatUser(alreadyExists.userData);
        setSearchedUser(null);
        setSearch("");
        setShowSearch(false);
        return;
      }
      
      // Create new chat room document
      const messagesRef = collection(db, 'messages');
      const newChatDocRef = doc(messagesRef);
      
      await setDoc(newChatDocRef, {
        createdAt: Date.now(),
        messages: []
      });
      
      const newChatRoomId = newChatDocRef.id;
      
      // Update logged-in user's chats
      await updateDoc(doc(db, 'chats', userData.id), {
        chatData: arrayUnion({
          messageId: newChatRoomId,
          rId: searchedUser.id,
          lastMessage: "",
          updatedAt: Date.now(),
          messageSeen: true
        })
      });
      
      // Update searched user's chats
      await updateDoc(doc(db, 'chats', searchedUser.id), {
        chatData: arrayUnion({
          messageId: newChatRoomId,
          rId: userData.id,
          lastMessage: "",
          updatedAt: Date.now(),
          messageSeen: true
        })
      });

      // Fetch fresh document for partner to populate context
      const freshUserSnap = await getDoc(doc(db, 'users', searchedUser.id));
      
      setMessagesId(newChatRoomId);
      setChatUser(freshUserSnap.data());
      setSearchedUser(null);
      setSearch("");
      setShowSearch(false);
      toast.success("Chat added successfully!");
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const handleSelectChat = (item) => {
    setMessagesId(item.messageId);
    setChatUser(item.userData);
  };

  return (
    <div className='ls'>
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} className='logo' alt="Chat Friend" />
          <div className="menu">
            <img src={assets.menu_icon} alt="Menu" />
            <div className="sub-menu">
              <p onClick={() => navigate('/profile')}>Edit Profile</p>
              <hr />
              <p onClick={() => logout()}>Logout</p>
            </div>
          </div>
        </div>
        <div className="ls-search">
          <img src={assets.search_icon} alt="Search" />
          <input 
            onChange={searchHandler} 
            value={search} 
            type="text" 
            placeholder='Search users...' 
          />
        </div>
      </div>
      <div className="ls-list">
        {showSearch && searchedUser ? (
          <div onClick={addChatHandler} className='friends user-search-result'>
            <img src={searchedUser.avatar || assets.avatar_icon} alt="Avatar" />
            <div>
              <p>{searchedUser.name}</p>
              <span style={{ color: '#077eff', fontWeight: 'bold' }}>Click to add chat</span>
            </div>
          </div>
        ) : (
          chatData && chatData.map((item, index) => (
            <div 
              key={index} 
              onClick={() => handleSelectChat(item)} 
              className={`friends ${messagesId === item.messageId ? "active-chat" : ""}`}
            >
              <img src={item.userData.avatar || assets.avatar_icon} alt="Avatar" />
              <div>
                <p>{item.userData.name}</p>
                <span className="last-msg-preview">
                  {item.lastMessage || "No messages yet"}
                </span>
                <span className="status-preview">
                  {formatLastSeen(item.userData.lastSeen)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default LeftSidebar