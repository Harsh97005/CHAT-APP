import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const firebaseConfig = {
  apiKey: "AIzaSyBXhurdrHcd_ehL-hJOjhYjj6FJM3v-KBM",
  authDomain: "chat-app-a1000.firebaseapp.com",
  projectId: "chat-app-a1000",
  storageBucket: "chat-app-a1000.firebasestorage.app",
  messagingSenderId: "605701729947",
  appId: "1:605701729947:web:0192535a0f15db6dada03e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);  
const auth = getAuth(app);
const db = getFirestore(app);

const signup = async(username,email,password) =>{
    try {
        const res = await createUserWithEmailAndPassword(auth,email,password);
        const user = res.user;
        await setDoc(doc(db,'users',user.uid),{
           id:user.uid,
           username:username.toLowerCase(),
           email,
           name:"",
           avatar:"",
           bio:"Hey, There i am using chat app",
           lastSeen:Date.now()
        })
        await setDoc(doc(db,"chats",user.uid),{
         chatData:[]   
        })

    } catch (error) {
       console.error(error) 
       toast.error(error.code.split("/")[1].split("-").join(" "));

        
    }

}

const login = async (email,password) => {
    try {
        await signInWithEmailAndPassword(auth,email,password);

   } 
   catch (error) {
    console.error(error);
    toast.error(error.code.split("/")[1].split("-").join(" "));



        
    }

}

const logout = async () => {
    try {
        await signOut(auth)

        
    } catch (error) {
        console.error(error);
        toast.error(error.code.split("/")[1].split("-").join(" "));
        
    }

}
export{signup,login,logout,auth,db}


