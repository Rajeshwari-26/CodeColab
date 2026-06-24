import { useState, useEffect } from 'react';
import { socket } from '../socket/socket';
import { useRoom } from '../context/RoomContext';

export default function UserList() {
  const { userId } = useRoom();
  const [users, setUsers] = useState([]);
  const [hostId, setHostId] = useState(null);

  useEffect(() => {
    const handleRoomState = ({ users: userList, hostId: hId }) => {
      setUsers(userList || []);
      setHostId(hId);
    };

    const handleUserListUpdate = (userList) => {
      setUsers(userList || []);
    };

    const handleHostChanged = ({ hostId: hId }) => {
      setHostId(hId);
      setUsers(prev => prev.map(u => ({ ...u, isHost: u.userId === hId })));
    };

    socket.on('room_state', handleRoomState);
    socket.on('user_list_update', handleUserListUpdate);
    socket.on('host_changed', handleHostChanged);

    return () => {
      socket.off('room_state', handleRoomState);
      socket.off('user_list_update', handleUserListUpdate);
      socket.off('host_changed', handleHostChanged);
    };
  }, []);

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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="panel-header">
        <div className="panel-title">USERS IN ROOM ({users.length})</div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {users.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>No users</div>
        ) : (
          users.map(u => (
            <div 
              key={u.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 8px',
                borderRadius: '6px',
                background: u.userId === userId ? 'var(--bg-hover)' : 'transparent',
                border: u.userId === userId ? '1px solid var(--border-color)' : '1px solid transparent',
              }}
            >
              <div 
                style={{
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  background: getAvatarColor(u.userId),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: 'white',
                  flexShrink: 0
                }}
              >
                {u.userId.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {u.userId}{u.userId === userId ? ' (You)' : ''}
                </span>
                {u.isHost && (
                  <span style={{ fontSize: '10px', color: 'var(--brand-color)', fontWeight: 600 }}>HOST</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
