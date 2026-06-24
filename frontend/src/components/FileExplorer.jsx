import { useRoom } from '../context/RoomContext';

export default function FileExplorer({ isVisible, toggleVisibility }) {
  const { files, activeFileId, setActiveFileId, ydoc } = useRoom();

  const addNewFile = () => {
    const name = prompt("Enter new file name (e.g., script.py):");
    if (name && ydoc) {
      const newFile = { id: Date.now().toString(), name };
      ydoc.transact(() => {
        ydoc.getArray('files').push([newFile]);
        ydoc.getText(newFile.id).insert(0, "");
      });
      setActiveFileId(newFile.id);
    }
  };

  const deleteFile = (e, id) => {
    e.stopPropagation(); // Prevent setting as active file
    if (confirm("Are you sure you want to delete this file?") && ydoc) {
      const fileArray = ydoc.getArray('files');
      const idx = fileArray.toArray().findIndex(f => f.id === id);
      if (idx !== -1) {
        fileArray.delete(idx, 1);
      }
      const newFiles = fileArray.toArray();
      if (activeFileId === id) {
        setActiveFileId(newFiles.length > 0 ? newFiles[0].id : null);
      }
    }
  };

  const handleFileUpload = async (e) => {
    if (!ydoc) return;
    const uploadedFiles = Array.from(e.target.files);

    const readFile = (file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve({
        name: file.webkitRelativePath || file.name,
        content: event.target.result
      });
      reader.readAsText(file);
    });

    const parsedFiles = await Promise.all(uploadedFiles.map(readFile));

    ydoc.transact(() => {
      const fileArray = ydoc.getArray('files');
      const currentFiles = fileArray.toArray();

      parsedFiles.forEach(pf => {
        if (!currentFiles.find(f => f.name === pf.name)) {
          const newId = (Date.now() + Math.random()).toString();
          fileArray.push([{ id: newId, name: pf.name }]);
          ydoc.getText(newId).insert(0, pf.content);
        }
      });
    });

    e.target.value = null;
  };

  if (!isVisible) return null; // handled in Room.jsx sidebar-left wrapper

  return (
    <>
      <div className="panel-header" style={{ height: '36px', padding: '0 16px', color: 'var(--text-muted)' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px' }}>EXPLORER</span>
      </div>

      <div className="panel-header" style={{ justifyContent: 'space-between', padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button className="icon-btn" onClick={toggleVisibility} title="Collapse Explorer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
          </button>
          <div className="panel-title">PROJECT</div>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <label className="icon-btn" title="Upload Folder" style={{ cursor: 'pointer' }}>
            <input type="file" webkitdirectory="" directory="" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" /></svg>
          </label>
          <label className="icon-btn" title="Upload Files" style={{ cursor: 'pointer' }}>
            <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" /></svg>
          </label>
          <button className="icon-btn" onClick={addNewFile} title="Add New File">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
          </button>
        </div>
      </div>

      <div className="file-tree">
        {/* Mock root folder to match design */}
        <div className="file-item" style={{ paddingLeft: '16px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.8, color: 'var(--brand-color)' }}>
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>src</span>
        </div>

        {files.map(f => (
          <div
            key={f.id}
            className={`file-item ${f.id === activeFileId ? 'active' : ''}`}
            onClick={() => setActiveFileId(f.id)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: f.id === activeFileId ? 1 : 0.7, color: f.id === activeFileId ? 'var(--brand-color)' : 'currentColor' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V4.5L18.5 9H13z" />
            </svg>
            <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {f.name}
            </span>

            <div className="file-item-actions">
              <button
                className="icon-btn"
                onClick={(e) => deleteFile(e, f.id)}
                title="Delete File"
                style={{ width: '20px', height: '20px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {files.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
            No files in src folder.
          </div>
        )}
      </div>


    </>
  );
}
