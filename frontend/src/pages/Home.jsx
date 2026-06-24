import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import "./Home.css";

export default function Home() {
  const [activeTab, setActiveTab] = useState("initialize");
  const [developerId, setDeveloperId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const navigate = useNavigate();
  const location = useLocation();
  const { setUserId } = useRoom();

  useEffect(() => {
    // Ensure homepage is always in dark theme, even if user left a light-theme room
    document.body.classList.remove('theme-light');

    // If redirected here via direct link without a Developer ID, prefill the room code
    const queryParams = new URLSearchParams(location.search);
    const roomParam = queryParams.get("room");
    if (roomParam) {
      setRoomCode(roomParam);
      setActiveTab("attach");
    }
  }, [location]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!developerId.trim()) return;

    // Save the developer's chosen name so Room can use it as the socket identity
    const newUserId = developerId.trim();
    sessionStorage.setItem("cc_user_id", newUserId);
    setUserId(newUserId);

    if (activeTab === "initialize") {
      const roomId = Math.random().toString(36).substring(2, 8);
      navigate(`/room/${roomId}`);
    } else {
      if (!roomCode.trim()) return;
      navigate(`/room/${roomCode.trim()}`);
    }
  };

  const joinSample = () => {
    const guestId = "guest_" + Math.random().toString(36).substring(2, 5);
    sessionStorage.setItem("cc_user_id", guestId);
    setUserId(guestId);
    navigate(`/room/sample123`);
  };

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="home-container" onMouseMove={handleMouseMove}>
      <div 
        className="home-spotlight" 
        style={{ 
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.08), transparent 40%)` 
        }} 
      />
      <div className="home-content">
        <div className="home-header">
          <div className="home-brand">
            <span className="brand-square">{'</>'}</span>
            CODECOLAB // TERMINAL
          </div>

          <h1 className="home-title">
            Sync.<br />
            Compile.<br />
            Execute.
          </h1>

          <p className="home-subtitle">
            A zero-friction, real-time collaboration<br />
            environment built for engineers.
          </p>
        </div>

        <div className="auth-panel">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === "initialize" ? "active" : ""}`}
              onClick={() => setActiveTab("initialize")}
            >
              CREATE ROOM
            </button>

            <button
              className={`auth-tab ${activeTab === "attach" ? "active" : ""}`}
              onClick={() => setActiveTab("attach")}
            >
              JOIN ROOM
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>DEVELOPER HANDLE</label>
              <input
                type="text"
                placeholder="e.g. dev_ninja"
                value={developerId}
                onChange={(e) => setDeveloperId(e.target.value)}
                autoFocus
              />
            </div>

            {activeTab === "attach" && (
              <div className="input-group">
                <label>ROOM ID</label>
                <input
                  type="text"
                  placeholder="e.g. asqqdm"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                />
              </div>
            )}

            <button type="submit" className="btn-primary auth-submit">
              {activeTab === "initialize" ? "Initialize Session" : "Attach to Session"}
            </button>
          </form>

          <div className="auth-footer">
            <button className="btn-outline" onClick={joinSample} style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
              Test Drive (Sample Session)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}