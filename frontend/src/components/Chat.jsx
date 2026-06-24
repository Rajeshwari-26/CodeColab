import { useState, useEffect, useRef } from "react";
import { socket } from "../socket/socket";
import { useRoom } from "../context/RoomContext";

export default function Chat() {
  const { userId } = useRoom();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const handleIncoming = ({ userId: senderId, message: text }) => {
      setMessages(prev => [...prev, { 
        userId: senderId, 
        message: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    };

    socket.on("chat_update", handleIncoming);
    return () => socket.off("chat_update", handleIncoming);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    if (e && e.key && e.key !== 'Enter') return;
    if (!message.trim()) return;

    socket.emit("chat_message", {
      userId,
      message,
    });

    setMessage("");
  };

  const getAvatarColor = (name) => {
    const safeName = name || "User";
    let hash = 0;
    for (let i = 0; i < safeName.length; i++) {
      hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <div className="chat-area">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className="chat-msg">
            <div className="chat-msg-dot" style={{ background: getAvatarColor(m.userId) }}></div>
            <div className="chat-msg-content">
              <span className="chat-msg-name">{m.userId}{m.userId === userId ? ' (You)' : ''}</span>
              {m.message}
            </div>
            {m.time && <div className="chat-msg-time">{m.time}</div>}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      
      <div className="chat-input-wrapper">
        <input 
          type="text" 
          className="chat-input-box" 
          placeholder="Type a message..." 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={sendMessage}
        />
        <button className="chat-send-btn" onClick={() => sendMessage()}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}