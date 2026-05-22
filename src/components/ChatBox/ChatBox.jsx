import React, { useContext, useEffect, useState } from 'react'
import './ChatBox.css'
import assets from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc } from 'firebase/firestore'
import { db } from '../../config/Firebase'
import uploadToCloudinary from '../../lib/upload'
import { toast } from 'react-toastify'

const ChatBox = () => {
  const { 
    userData, 
    chatUser, 
    messagesId, 
    messages, 
    setMessages, 
    formatLastSeen 
  } = useContext(AppContext);

  const [inputText, setInputText] = useState("");

  // Listen to messages in real-time
  useEffect(() => {
    if (messagesId) {
      const messagesRef = doc(db, 'messages', messagesId);
      const unSub = onSnapshot(messagesRef, (docSnap) => {
        if (docSnap.exists()) {
          setMessages(docSnap.data().messages);
        }
      });
      return () => unSub();
    }
  }, [messagesId, setMessages]);

  const convertTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const hour = date.getHours();
    const minute = date.getMinutes();
    const period = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 || 12;
    const displayMinute = minute < 10 ? `0${minute}` : minute;
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const updateChatLists = async (lastText) => {
    const userIDs = [userData.id, chatUser.id];
    
    for (const uid of userIDs) {
      const chatRef = doc(db, 'chats', uid);
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        const cData = chatSnap.data();
        const chatItems = cData.chatData || [];
        
        const updatedChatItems = chatItems.map((item) => {
          if (item.messageId === messagesId) {
            return {
              ...item,
              lastMessage: lastText,
              updatedAt: Date.now(),
              messageSeen: uid === userData.id
            };
          }
          return item;
        });
        
        await updateDoc(chatRef, {
          chatData: updatedChatItems
        });
      }
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    try {
      const messagesRef = doc(db, 'messages', messagesId);
      await updateDoc(messagesRef, {
        messages: arrayUnion({
          senderId: userData.id,
          text: inputText.trim(),
          createdAt: Date.now()
        })
      });
      
      const lastText = inputText.trim();
      setInputText("");
      await updateChatLists(lastText);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const sendImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      toast.info("Sending image...");
      const imageUrl = await uploadToCloudinary(file);
      if (imageUrl) {
        const messagesRef = doc(db, 'messages', messagesId);
        await updateDoc(messagesRef, {
          messages: arrayUnion({
            senderId: userData.id,
            image: imageUrl,
            createdAt: Date.now()
          })
        });
        
        await updateChatLists("Sent an image");
        toast.success("Image sent!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send image");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  if (!chatUser) {
    return (
      <div className="chat-welcome">
        <img src={assets.logo_big} alt="Chat Friend" />
        <p>Chat Anytime, Anywhere</p>
      </div>
    );
  }

  return (
    <div className='chat-box'>
      <div className="chat-user">
        <img src={chatUser.avatar || assets.avatar_icon} alt="Avatar" />
        <p>
          {chatUser.name} 
          {formatLastSeen(chatUser.lastSeen) === "Online" && (
            <img className='dot' src={assets.green_dot} alt='Online' />
          )}
        </p>
        <span style={{ fontSize: '11px', color: 'gray' }}>
          {formatLastSeen(chatUser.lastSeen)}
        </span>
        <img src={assets.help_icon} className='help' alt='Help' />
      </div>

      <div className="chat-msg">
        {[...messages].reverse().map((msg, index) => (
          <div key={index} className={msg.senderId === userData.id ? "s-msg" : "r-msg"}>
            {msg.image ? (
              <img className='msg-img' src={msg.image} alt='Sent visual' />
            ) : (
              <p className="msg">{msg.text}</p>
            )}
            <div>
              <img 
                src={msg.senderId === userData.id ? (userData.avatar || assets.avatar_icon) : (chatUser.avatar || assets.avatar_icon)} 
                alt='Avatar' 
              />
              <p>{convertTime(msg.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input 
          onChange={(e) => setInputText(e.target.value)} 
          value={inputText} 
          onKeyDown={handleKeyPress}
          type='text' 
          placeholder='Send a message...' 
        />
        <input 
          onChange={sendImage}
          type='file' 
          id='image' 
          accept='image/png, image/jpeg' 
          hidden
        />
        <label htmlFor='image'>
          <img src={assets.gallery_icon} alt="Attach" />
        </label>
        <img onClick={sendMessage} src={assets.send_button} alt='Send' />
      </div>
    </div>
  )
}

export default ChatBox