import MonacoEditor from "@monaco-editor/react";
import { useRoom } from "../context/RoomContext";
import { useEffect, useState, useRef } from "react";
import { MonacoBinding } from 'y-monaco';

export default function Editor({ theme = 'dark' }) {
  const {
    files,
    activeFileId,
    setActiveFileId,
    isTeachingMode,
    isHost,
    userId,
    getLanguage,
    ydoc,
    wsProvider
  } = useRoom();

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [editorInstance, setEditorInstance] = useState(null);
  const bindingRef = useRef(null);

  const activeFile = files.find(f => f.id === activeFileId);
  const lang = activeFile ? getLanguage(activeFile.name) : "plaintext";

  const closeFile = () => {
    if (!activeFile) return;
    if (confirm(`Are you sure you want to delete ${activeFile.name}?`)) {
      const fileArray = ydoc.getArray('files');
      const idx = fileArray.toArray().findIndex(f => f.id === activeFileId);
      if (idx !== -1) {
        fileArray.delete(idx, 1);
      }
      const newFiles = fileArray.toArray();
      setActiveFileId(newFiles.length > 0 ? newFiles[0].id : null);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    setEditorInstance(editor);
    
    if (wsProvider && wsProvider.awareness) {
      // Pick a deterministic color based on userId
      const colors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#2dd4bf', '#38bdf8', '#818cf8', '#a78bfa', '#e879f9', '#f43f5e'];
      const colorIndex = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
      
      wsProvider.awareness.setLocalStateField('user', {
        name: userId,
        color: colors[colorIndex]
      });
    }

    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });
  };

  useEffect(() => {
    if (!editorInstance || !activeFileId || !ydoc || !wsProvider) return;

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const ytext = ydoc.getText(activeFileId);
    
    bindingRef.current = new MonacoBinding(
      ytext, 
      editorInstance.getModel(), 
      new Set([editorInstance]), 
      wsProvider.awareness
    );

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [editorInstance, activeFileId, ydoc, wsProvider]);

  return (
    <>
      <div className="editor-tabs">
        {activeFile && (
          <div className="editor-tab">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--brand-color)' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V4.5L18.5 9H13z" />
            </svg>
            {activeFile.name}
            <span onClick={closeFile} style={{ marginLeft: '4px', opacity: 0.5, cursor: 'pointer' }}>×</span>
          </div>
        )}
      </div>

      <div className="editor-wrapper">
        <MonacoEditor
          height="100%"
          language={lang}
          // Note: value is omitted because y-monaco handles the model value
          onMount={handleEditorDidMount}
          theme={theme === 'light' ? 'vs' : 'vs-dark'}
          options={{
            readOnly: isTeachingMode && !isHost,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 24,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            renderLineHighlight: "all",
          }}
        />
        {/* y-monaco provides native awareness cursors automatically via CSS */}
      </div>

      <div className="status-bar">
        <div className="status-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="connection-dot" style={{ marginLeft: 0 }} />
            Connected
          </div>
          <div>{lang === 'python' ? 'Python 3.11.0' : lang === 'javascript' ? 'Node.js' : 'Ready'}</div>
        </div>
        <div className="status-center">
          <div>{activeFile ? `Ln ${cursorPos.line}, Col ${cursorPos.col}` : 'Ready'}</div>
          <div>Spaces: 4</div>
          <div>UTF-8</div>
          <div>LF</div>
          <div style={{ textTransform: 'capitalize' }}>{lang}</div>
        </div>
        <div className="status-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            All changes saved
          </div>
        </div>
      </div>
    </>
  );
}