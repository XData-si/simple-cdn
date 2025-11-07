import { useState, useEffect } from 'react';
import { api, FileInfo } from '../api/client';
import Breadcrumb from '../components/Breadcrumb';
import FileCard from '../components/FileCard';
import UploadZone from '../components/UploadZone';
import './Dashboard.css';

interface DashboardProps {
  user: { username: string };
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.list(currentPath);
      setFiles(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSelectedFiles(new Set());
  };

  const handleFileClick = (file: FileInfo) => {
    if (file.type === 'directory') {
      handleNavigate(file.path);
    }
  };

  const handleSelect = (path: string, selected: boolean) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(path);
      } else {
        next.delete(path);
      }
      return next;
    });
  };

  const handleUpload = async (uploadedFiles: File[]) => {
    for (const file of uploadedFiles) {
      try {
        await api.upload(file, currentPath);
      } catch (err) {
        console.error('Upload failed:', err);
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    }
    await loadFiles();
  };

  const handleDelete = async (path: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.delete(path);
      await loadFiles();
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`Delete ${selectedFiles.size} selected items?`)) return;

    for (const path of selectedFiles) {
      try {
        await api.delete(path);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }

    setSelectedFiles(new Set());
    await loadFiles();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const folderPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
      await api.mkdir(folderPath);
      setNewFolderName('');
      setShowNewFolder(false);
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="dashboard-brand">
            <h1>CDN XData</h1>
            <a
              href="https://cognitiolabs.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="dashboard-brand-link"
            >
              Cognition Labs EU
            </a>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span>Welcome, {user.username}</span>
            <button className="btn btn-secondary" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ marginTop: '2rem' }}>
        <div className="toolbar">
          <Breadcrumb path={currentPath} onNavigate={handleNavigate} />

          <div className="toolbar-actions">
            {selectedFiles.size > 0 && (
              <button className="btn btn-danger" onClick={handleBulkDelete}>
                Delete {selectedFiles.size} selected
              </button>
            )}

            {showNewFolder ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  autoFocus
                />
                <button className="btn btn-primary" onClick={handleCreateFolder}>
                  Create
                </button>
                <button className="btn btn-secondary" onClick={() => setShowNewFolder(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary" onClick={() => setShowNewFolder(true)}>
                New Folder
              </button>
            )}
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <UploadZone onUpload={handleUpload} />

        {loading ? (
          <div className="loading">Loading...</div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <p>No files or folders here yet.</p>
            <p>Drag and drop files to upload.</p>
          </div>
        ) : (
          <div className="grid">
            {files.map((file) => (
              <FileCard
                key={file.path}
                file={file}
                selected={selectedFiles.has(file.path)}
                onSelect={handleSelect}
                onClick={handleFileClick}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="dashboard-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-left">
              <p>&copy; {new Date().getFullYear()} Cognition Labs EU. All rights reserved.</p>
            </div>
            <div className="footer-right">
              <a href="https://cognitiolabs.eu" target="_blank" rel="noopener noreferrer">
                cognitiolabs.eu
              </a>
              <span className="footer-separator">|</span>
              <a href="https://cdn.xdata.si" target="_blank" rel="noopener noreferrer">
                cdn.xdata.si
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
