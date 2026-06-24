import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { socket } from '../socket/socket';

export default function Navbar({ connectionStatus }) {
  const {
    isTeachingMode, setIsTeachingMode,
    isHost, runCode, isRunning,
    roomId, userId,
  } = useRoom();

  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleRoomState = ({ users: userList }) => setUsers(userList);
    const handleUserListUpdate = (userList) => setUsers(userList);
    
    socket.on('room_state', handleRoomState);
    socket.on('user_list_update', handleUserListUpdate);

    return () => {
      socket.off('room_state', handleRoomState);
      socket.off('user_list_update', handleUserListUpdate);
    };
  }, []);

  const handleCopyRoomId = () => {
    if (!roomId) return;
    const fullLink = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(fullLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getAvatarColor = (name) => {
    const safeName = name || "User";
    let hash = 0;
    for (let i = 0; i < safeName.length; i++) {
      hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 40%)`;
  };

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">{'</>'}</div>
        <div className="brand-name">CodeColab</div>
        <div className="connection-dot" title={`Socket: ${connectionStatus}`} />
      </div>

      <div className="header-center">
        {roomId && (
          <div className="room-info">
            <span>Room: {roomId}</span>
          </div>
        )}
        
      </div>

      <div className="header-actions">
        {isHost && (
          <button
            className="btn-outline"
            style={{ borderColor: isTeachingMode ? 'var(--warning)' : 'var(--border-color)', color: isTeachingMode ? 'var(--warning)' : 'var(--text-muted)' }}
            onClick={() => setIsTeachingMode(!isTeachingMode)}
          >
            {isTeachingMode ? '🛑 End Teaching' : '🎓 Teach'}
          </button>
        )}

        <button className="btn-outline" onClick={handleCopyRoomId} style={{ width: '85px', justifyContent: 'center' }}>
          {copied ? (
            <span style={{ color: 'var(--success)' }}>Copied!</span>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
              Share
            </>
          )}
        </button>

        <button className="btn-primary" onClick={runCode} disabled={isRunning}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          {isRunning ? "Running..." : "Run Code"}
        </button>

        <button className="btn-danger-outline" onClick={() => navigate('/')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
          </svg>
          Leave Room
        </button>
      </div>
    </header>
  );
}
