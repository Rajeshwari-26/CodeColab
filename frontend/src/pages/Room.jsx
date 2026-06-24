import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket/socket";
import { useRoom } from "../context/RoomContext";

import Navbar from "../components/Navbar";
import FileExplorer from "../components/FileExplorer";
import Editor from "../components/Editor";
import Output from "../components/Output";
import Chat from "../components/Chat";
import UserList from "../components/UserList";

export default function Room() {
  const { roomId: roomIdParam } = useParams();
  const navigate = useNavigate();
  const { userId, setRoomId, setIsHost } = useRoom();

  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(
    socket.connected ? "connected" : "connecting"
  );

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
  };

  // Close settings when clicking anywhere outside
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handler = () => setIsSettingsOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [isSettingsOpen]);

  useEffect(() => {
    if (!roomIdParam) return;

    if (!userId) {
      navigate(`/?room=${roomIdParam}`, { replace: true });
      return;
    }

    setRoomId(roomIdParam);

    const joinRoom = () => {
      console.log(`[Room] Joining ${roomIdParam} as ${userId}`);
      socket.emit("join_room", { roomId: roomIdParam, userId });
    };

    joinRoom();

    socket.on("connect", joinRoom);
    socket.on("connect", () => setConnectionStatus("connected"));
    socket.on("disconnect", () => setConnectionStatus("disconnected"));
    socket.on("connect_error", () => setConnectionStatus("error"));

    const handleRoomState = ({ hostId }) => {
      setIsHost(hostId === userId);
    };

    const handleHostChanged = ({ hostId }) => {
      setIsHost(hostId === userId);
    };

    const handleFilesUpdate = () => {
      // Handled by Yjs now
    };

    socket.on("room_state", handleRoomState);
    socket.on("host_changed", handleHostChanged);
    socket.on("files_update", handleFilesUpdate);

    return () => {
      socket.emit("leave_room", { roomId: roomIdParam, userId });
      socket.off("connect", joinRoom);
      socket.off("connect", () => setConnectionStatus("connected"));
      socket.off("disconnect", () => setConnectionStatus("disconnected"));
      socket.off("connect_error", () => setConnectionStatus("error"));
      socket.off("room_state", handleRoomState);
      socket.off("host_changed", handleHostChanged);
      socket.off("files_update", handleFilesUpdate);
    };
  }, [roomIdParam, userId, setRoomId, setIsHost]);

  return (
    <div className="app-layout">
      <Navbar connectionStatus={connectionStatus} />

      <main className="workspace">
        {/* Left Sidebar */}
        <div className="sidebar-left" style={{ display: isExplorerOpen ? 'flex' : 'none', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)' }}>
            <FileExplorer
              isVisible={isExplorerOpen}
              toggleVisibility={() => setIsExplorerOpen(!isExplorerOpen)}
            />
          </div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <UserList />
          </div>

          {/* Settings Footer */}
          <div style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
            <button
              className="icon-btn"
              onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(prev => !prev); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', position: 'relative' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Settings</span>

              {isSettingsOpen && (
                <div
                  style={{
                    position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
                    background: 'var(--bg-panel)', border: '1px solid var(--border-color)',
                    padding: '16px', borderRadius: '6px', width: '200px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100,
                    textAlign: 'left', cursor: 'default'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>THEME</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-main)' }}>
                      <input type="radio" checked={theme === 'dark'} onChange={() => handleThemeChange('dark')} /> Dark (Industrial)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-main)' }}>
                      <input type="radio" checked={theme === 'light'} onChange={() => handleThemeChange('light')} /> Light (High Contrast)
                    </label>
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>

        {!isExplorerOpen && (
          <div className="sidebar-left" style={{ width: '48px' }}>
            <button className="icon-btn" onClick={() => setIsExplorerOpen(true)} style={{ marginTop: '12px' }} title="Expand Explorer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
            </button>
          </div>
        )}

        <div className="center-pane">
          <Editor theme={theme} />
        </div>

        {/* Right Sidebar */}
        {isRightSidebarOpen ? (
          <aside className="sidebar-right">
            {/* Collapse button at top of right sidebar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px', borderBottom: '1px solid var(--border-color)' }}>
              <button
                className="icon-btn"
                title="Collapse Right Panel"
                onClick={() => setIsRightSidebarOpen(false)}
                style={{ color: 'var(--text-muted)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.41 6L8 7.41 12.58 12 8 16.59 9.41 18l6-6z"/>
                </svg>
              </button>
            </div>

            {/* Terminal Panel — collapsible */}
            <div
              className="panel-header"
              style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setIsTerminalOpen(prev => !prev)}
            >
              <div className="panel-title">TERMINAL</div>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
                style={{ marginLeft: 'auto', color: 'var(--text-muted)', transform: isTerminalOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
              >
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
            {isTerminalOpen && (
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden', borderBottom: '1px solid var(--border-color)', minHeight: '120px' }}>
                <Output />
              </div>
            )}

            {/* Chat Panel — collapsible */}
            <div
              className="panel-header"
              style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setIsChatOpen(prev => !prev)}
            >
              <div className="panel-title">CHAT</div>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
                style={{ marginLeft: 'auto', color: 'var(--text-muted)', transform: isChatOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
              >
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
            {isChatOpen && (
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: '120px' }}>
                <Chat />
              </div>
            )}
          </aside>
        ) : (
          /* Collapsed right sidebar — thin strip with expand button */
          <div style={{
            width: '32px',
            borderLeft: '1px solid var(--border-color)',
            background: 'var(--bg-panel)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '8px',
            flexShrink: 0,
          }}>
            <button
              className="icon-btn"
              title="Expand Right Panel"
              onClick={() => setIsRightSidebarOpen(true)}
              style={{ color: 'var(--text-muted)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.59 6L16 7.41 11.41 12 16 16.59 14.59 18l-6-6z"/>
              </svg>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}