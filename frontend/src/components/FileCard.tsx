import { useState } from 'react';
import type { FileInfo } from '../api/client';
import './FileCard.css';

interface FileCardProps {
  file: FileInfo;
  selected: boolean;
  onSelect: (path: string, selected: boolean) => void;
  onClick: (file: FileInfo) => void;
  onDelete: (path: string) => void;
}

export default function FileCard({ file, selected, onSelect, onClick, onDelete }: FileCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!file.url) return;

    try {
      await navigator.clipboard.writeText(file.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyImgTag = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!file.url) return;

    const imgTag = `<img src="${file.url}" alt="${file.name}" />`;
    try {
      await navigator.clipboard.writeText(imgTag);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(file.path);
  };

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={`file-card card ${selected ? 'file-card-selected' : ''}`}
      onClick={() => onClick(file)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick(file);
        if (e.key === 'Delete') onDelete(file.path);
        if (e.key === ' ') {
          e.preventDefault();
          onSelect(file.path, !selected);
        }
      }}
      aria-label={`${file.type === 'directory' ? 'Folder' : 'File'}: ${file.name}`}
    >
      <div className="file-card-header">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(file.path, e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${file.name}`}
        />
        <button
          className="file-card-delete"
          onClick={handleDelete}
          aria-label={`Delete ${file.name}`}
          title="Delete"
        >
          ×
        </button>
      </div>

      <div className="file-card-preview">
        {file.type === 'directory' ? (
          <div className="file-card-icon">📁</div>
        ) : file.thumbnailUrl ? (
          <img src={file.thumbnailUrl} alt={file.name} loading="lazy" />
        ) : (
          <div className="file-card-icon">
            {file.mimeType?.startsWith('image/') ? '🖼️' : '📄'}
          </div>
        )}
      </div>

      <div className="file-card-info">
        <div className="file-card-name" title={file.name}>
          {file.name}
        </div>
        {file.size !== undefined && (
          <div className="file-card-size">{formatSize(file.size)}</div>
        )}
      </div>

      {file.url && (
        <div className="file-card-actions">
          <button
            className="btn btn-secondary file-card-btn"
            onClick={handleCopyUrl}
            title="Copy URL"
          >
            {copied ? '✓ Copied!' : 'Copy URL'}
          </button>
          <button
            className="btn btn-secondary file-card-btn"
            onClick={handleCopyImgTag}
            title="Copy <img> tag"
          >
            Copy Tag
          </button>
        </div>
      )}
    </div>
  );
}
