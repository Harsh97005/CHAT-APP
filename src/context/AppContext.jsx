import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { createContext, useEffect, useState } from "react";
import { auth, db } from "../config/Firebase";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = (props) => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState(null);
    const [chatUser, setChatUser] = useState(null);
    const [messagesId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([]);

    const loadUserData = async (uid) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            const data = userSnap.data();
            setUserData(data);
            
            if (data.avatar && data.name) {
                navigate('/chat');
            } else {
                navigate('/profile');
            }

            // Update user's own lastSeen immediately on login/load
            await updateDoc(userRef, {
                lastSeen: Date.now()
            });

            // Set up interval to update own online status every 60 seconds
            const intervalId = setInterval(async () => {
                if (auth.currentUser) {
                    await updateDoc(userRef, {
                        lastSeen: Date.now()
                    });
                }
            }, 60000);

            return () => clearInterval(intervalId);
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    };

    // Real-time listener for active chats list
    useEffect(() => {
        if (userData) {
            const chatRef = doc(db, 'chats', userData.id);
            const unSub = onSnapshot(chatRef, async (res) => {
                if (res.exists()) {
                    const chatItems = res.data()?.chatData || [];
                    const tempChatData = [];
                    
                    for (const item of chatItems) {
                        const userRef = doc(db, 'users', item.rId);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) {
                            const friendData = userSnap.data();
                            tempChatData.push({ ...item, userData: friendData });
                        }
                    }
                    
                    // Sort descending by updatedAt
                    setChatData(tempChatData.sort((a, b) => b.updatedAt - a.updatedAt));
                }
            });
            return () => unSub();
        }
    }, [userData]);

    // Real-time listener for currently active chat partner details
    useEffect(() => {
        if (chatUser && chatUser.id) {
            const userRef = doc(db, 'users', chatUser.id);
            const unSub = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    setChatUser(docSnap.data());
                }
            });
            return () => unSub();
        }
    }, [chatUser?.id]);

    // Helper to format lastSeen timestamp into human readable text
    const formatLastSeen = (timestamp) => {
        if (!timestamp) return "Offline";
        const now = Date.now();
        const diff = now - timestamp;
        
        // Under 2 minutes is considered Online
        if (diff < 120000) {
            return "Online";
        }
        
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) {
            return `Last seen ${minutes}m ago`;
        }
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `Last seen ${hours}h ago`;
        }
        
        const days = Math.floor(hours / 24);
        if (days === 1) {
            return "Last seen yesterday";
        }
        
        const date = new Date(timestamp);
        return `Last seen on ${date.toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
    };

    const value = {
        userData,
        setUserData,
        chatData,
        setChatData,
        chatUser,
        setChatUser,
        messagesId,
        setMessagesId,
        messages,
        setMessages,
        loadUserData,
        formatLastSeen
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;