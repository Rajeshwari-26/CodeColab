import { useRoom } from "../context/RoomContext";

export default function Output() {
  const { output, isError } = useRoom();

  return (
    <div className="terminal-area">
      {output ? (
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: isError ? "var(--error)" : "inherit"
          }}
        >
          {output}
        </pre>
      ) : (
        <div style={{ color: "var(--text-muted)" }}>
          {"> Ready. Run code to see output..."}
        </div>
      )}
    </div>
  );
}