
import { useRef, useState, useEffect } from "react";
import './App.css'
import { v4 as uuidv4 } from "uuid";

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
  const activeConnections = useRef(1);
  const isCreating = useRef(false)  
  const markedPresence = useRef(false)
  const uuid = useRef('');
  const [colors, setColors] = useState(["red","blue","green","navy","purple"])
  // const [colors, setColors] = useState([])
  const [colorMap, setColorMap] = useState({})

  const [copyText, setCopyText] = useState("Double click text to copy")

  const messagesEndRef = useRef(null)

  useEffect(()=>{

    const params = new URLSearchParams(window.location.search)
    const roomid = params.get('roomid')
    console.log(roomid)

    if(roomCode==0 && (isCreating.current)) return;

    if(roomCode!=0){
      isCreating.current = false;
    }

    if(roomCode==0){

      uuid.current = uuidv4()

      isCreating.current = true;

      if(roomid) {
        console.log("switching rooms")
        switchRoom(roomid);
        return;
      }

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
      // console.log(data)
      let tempMsg = []

      for(let obj in data){
        // console.log(data[obj].message)

        let tempcolor = "";
        let colorarray = colors;
        let tempcolormap = colorMap;

        if(!colorMap[data[obj].uuid]){ 

          if(colorarray.length == 0){
            const rand1 = Math.floor(Math.random()*(255-200) + 100 - 1)
            const rand2 = Math.floor(Math.random()*(255-100) + 100 - 1)
            const rand3 = Math.floor(Math.random()*(255-100) + 100 - 1)

            colorarray.push(`rgb(${rand1},${rand2},${rand3})`)

            console.log(colorarray)
          }

          tempcolor = colorarray.pop(); 

          tempcolormap[data[obj].uuid] = tempcolor;

          setColorMap(tempcolormap)
          setColors(colorarray);
        }
        else{
          tempcolor = colorMap[data[obj].uuid]
        }

        tempMsg.push({msg:data[obj].message, uuid:data[obj].uuid, color:tempcolor})
      }

      // console.log(tempMsg)

      setMessages(tempMsg)
    })

    const activeUsers = onValue(messageRef,(snapshot)=>{
      let data = snapshot.val();
      if(!data) return;
      activeConnections.current = data.activeConnections;
      if(data.activeConnections <= 1){
        onDisconnect(messageRef).remove()
      }
      else{
        onDisconnect(messageRef).cancel()
        onDisconnect(messageRef).update({activeConnections:increment(-1)})
      }
    })

    return(
      ()=>{checkformsg();activeUsers()}
    )

  },[roomCode])

  useEffect(()=>{
      messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
      // messagesEndRef.current?.scroll(0,1000px)
  },[messages])

  function writeUserData() {
    // console.log("Sending user data") 

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
      uuid: uuid.current
    });

    sendRef.current.value = "";
  }

  async function switchRoom(code){

    const messageHeaderRef = ref(db, `chats/${code}`)
    const snapshot = await get(messageHeaderRef)
    const empt = snapshot.val()

    const tempRef = ref(db, `chats/${roomCode}`)

    if(!empt){
      window.location.replace('https://copy.tanmayb.in');
      return;
    }

    if(activeConnections.current<=1){
      set(tempRef, {})
    }

    setRoomCode(code)

  }

  async function copyToClipboard(text){
    try{
      const response = await navigator.clipboard.writeText(text);

      console.log(response)

      setCopyText("Text copied!")

      const timeout = setTimeout(()=>{
        setCopyText("Double click text to copy")
      },1000)
    }
    catch{
      console.log("couldnt copy")
    }
  }

  return (
    <div className="maindiv">
      <div className="inputdiv">
        <input type="text" className="inputnum" ref={pairRef} maxLength={6} placeholder={roomCode} inputMode="numeric"  onKeyUp={(event)=>{if(event.key=="Enter"){switchRoom(pairRef.current.value)}}} />
        <div className="inputbutton" onClick={()=>{switchRoom(pairRef.current.value)}}>CONNECT</div>
        <div className="sendmessagebutton" onClick={async()=>{navigator.clipboard.writeText(`https://copy.tanmayb.in?roomid=${roomCode}`)}}>LINK</div>
      </div>
      <div className="chatdiv">
          <div className="messagelist">
            {
              messages.map((e,i,a)=>{
                return(
                  <div key={`message_${i}`} className={`individualmsg  ${(e.uuid==uuid.current)?'mine':'yours'}`} onDoubleClick={()=>copyToClipboard(e.msg)}>
                    <div className={`individualmsgcontent  ${(e.uuid==uuid.current)?'minetext':'yourstext'}`} style={{backgroundColor:e.color}}>{e.msg}</div>
                  </div>
                )
              })
            }
            <div ref={messagesEndRef}/>
          </div>
          <div className="sendmessageinput">
            <input type="text" maxLength={300} ref={sendRef} className="sendmessage" onKeyUp={(event)=>{if(event.key=="Enter"){writeUserData()}}}/>
            <div className="sendmessagebutton" onClick={()=>{writeUserData()}}>SEND</div>
          </div>
      </div>
      <div className="disproomcodediv">
            <div className="disproomcode">{roomCode}</div>
            <div style={{"fontSize":"2rem"}}>{copyText}</div>
      </div>
    </div>
  )

}

export default App;