
import { useRef, useState, useEffect } from "react";
import './App.css'

// FIREBASE CODE START

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push ,onValue, onDisconnect, increment, update, get } from "firebase/database";

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
  const [activeConnections, setActiveConnections] = useState(1);
  const isCreating = useRef(false)
  const markedPresence = useRef(false)


  useEffect(()=>{

    if(roomCode==0 && (isCreating.current)) return;

    if(roomCode!=0){
      isCreating.current = false;
    }

    if(roomCode==0){

      isCreating.current = true;

      const id = Math.floor(Math.random()*(999999 - 100000) + 100000);
      setRoomCode(id)

      const tempRef = ref(db,`chats/${id}`)

      set(tempRef, {
        activeConnections:0
      })

      onDisconnect(tempRef).remove()

      return;
    } 

    const messageRef = ref(db, `chats/${roomCode}`);  
    const messageHeaderRef = ref(db, `chats/${roomCode}/messages`)

    update(messageRef,{
        activeConnections:increment(1)
    })

    onDisconnect(messageRef).update({
      activeConnections:increment(-1)
    })


    const checkformsg = onValue(messageHeaderRef, (snapshot)=>{
      let data = snapshot.val();
      console.log(data)
      let tempMsg = []

      for(let obj in data){
        // console.log(data[obj].message)
        tempMsg.push(data[obj].message)
      }

      setMessages(tempMsg)
    })

    const activeUsers = onValue(messageRef,(snapshot)=>{
      let data = snapshot.val();
      if(!data) return;
      if(data.activeConnections <= 1){
        console.log("delete ts")
        onDisconnect(messageRef).remove()
      }
      else{
        console.log("dont delete ts")
        onDisconnect(messageRef).cancel()
        onDisconnect(messageRef).update({activeConnections:increment(-1)})
      }
    })

    return(
      ()=>{checkformsg();activeUsers()}
    )

  },[roomCode])

  function writeUserData() {
    console.log("Sending user data")

    let val = "";
    if(sendRef.current.value == ""){
      return;
    }
    else{
      val = sendRef.current.value;
    }

    const messageHeaderRef = ref(db, `chats/${roomCode}/messages`)
    const newMessageRef = push(messageHeaderRef)

    set(newMessageRef, {
      message: val,
    });

    sendRef.current.value = "";
  }

  async function switchRoom(code){

    const messageHeaderRef = ref(db, `chats/${code}`)
    const snapshot = await get(messageHeaderRef)
    const empt = snapshot.val()

    if(!empt){
      return;
    }

    setRoomCode(code)

  }

  return (
    <div className="maindiv">
      <div className="inputdiv">
        <input type="text" className="inputnum" ref={pairRef} maxLength={6} placeholder={roomCode}/>
        <div className="inputbutton" onClick={()=>{switchRoom(pairRef.current.value)}}>CONNECT</div>
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
            <input type="text" maxLength={300} ref={sendRef} className="sendmessage" onKeyUp={(event)=>{if(event.key=="Enter"){writeUserData()}}}/>
            <div className="sendmessagebutton" onClick={()=>{writeUserData()}}>SEND</div>
          </div>
      </div>
    </div>
  )

}

export default App;