
import { useRef, useState, useEffect } from "react";
import './App.css'

// FIREBASE CODE START

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push ,onValue } from "firebase/database";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  // ...
  // The value of `databaseURL` depends on the location of the database
  databaseURL: "https://webrtc-fa2f2-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Realtime Database and get a reference to the service
const db = getDatabase(app);



function App(){

  const pairRef = useRef(null);
  const sendRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [roomCode, setRoomCode] = useState(0);

  const messageRef = ref(db, `chats/${roomCode}`);  
  const newMessageRef = push(messageRef)

  function writeUserData(userId) {
    console.log("Sending user data")

    let val = "";
    if(sendRef.current.value == ""){
      return;
    }
    else{
      val = sendRef.current.value;
    }

    set(newMessageRef, {
      message: val,
    });
  }

  useEffect(()=>{
    onValue(messageRef, (snapshot)=>{
      let data = snapshot.val();
      console.log(data);

      let tempMsg = []

      for(let obj in data){
        console.log(data[obj].message)
        tempMsg.push(data[obj].message)
      }

      console.log(tempMsg)

      setMessages(tempMsg)
    })
  },[roomCode])

  return (
    <div className="maindiv">
      <div className="inputdiv">
        <input type="text" className="inputnum" ref={pairRef} maxLength={6}/>
        <div className="inputbutton" onClick={()=>{setRoomCode(pairRef.current.value)}}>CONNECT</div>
      </div>
      <div className="chatdiv">
          <div className="messagelist">
            {
              messages.map((e,i,a)=>{
                return(
                  <div key={`message_${i}`} className="individualmsg">
                    {e}
                  </div>
                )
              })
            }
          </div>
          <div className="sendmessageinput">
            <input type="text" maxLength={300} ref={sendRef} className="sendmessage"/>
            <div className="sendmessagebutton" onClick={()=>{writeUserData(10)}}>SEND</div>
          </div>
      </div>
    </div>
  )

}

export default App;