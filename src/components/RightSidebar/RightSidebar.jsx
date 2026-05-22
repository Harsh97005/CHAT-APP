import React, { useContext, useEffect, useState } from 'react'
import './RightSidebar.css'
import assets from '../../assets/assets'
import { logout } from '../../config/Firebase'
import { AppContext } from '../../context/AppContext'

const RightSidebar = () => {
  const { chatUser, messages, formatLastSeen } = useContext(AppContext);
  const [mediaImages, setMediaImages] = useState([]);

  // Compile list of sent/received images in this chat dynamically
  useEffect(() => {
    let tempImages = [];
    messages.forEach((msg) => {
      if (msg.image) {
        tempImages.push(msg.image);
      }
    });
    setMediaImages(tempImages);
  }, [messages]);

  if (!chatUser) {
    return (
      <div className='rs rs-empty'>
        <p>No conversation selected</p>
      </div>
    );
  }

  return (
    <div className='rs'>
      <div className="rs-profile">
        <img src={chatUser.avatar || assets.avatar_icon} alt='Avatar' />
        <h3>
          {chatUser.name} 
          {formatLastSeen(chatUser.lastSeen) === "Online" && (
            <img src={assets.green_dot} className='dot' alt="Online" />
          )}
        </h3>
        <p>{chatUser.bio || "No bio set yet."}</p>
      </div>
      <hr />
      <div className="rs-media">
        <p>Media</p>
        <div>
          {mediaImages.length > 0 ? (
            mediaImages.map((url, index) => (
              <img 
                key={index} 
                onClick={() => window.open(url, '_blank')} 
                src={url} 
                alt="Shared visual" 
              />
            ))
          ) : (
            <span style={{ fontSize: '11px', color: 'gray', padding: '10px' }}>
              No media shared yet
            </span>
          )}
        </div>
      </div>
      <button onClick={() => logout()}>Logout</button>
    </div>
  )
}

export default RightSidebar