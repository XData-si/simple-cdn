import { useState, DragEvent, ChangeEvent, useRef } from 'react';
import './UploadZone.css';

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.svg'];

export default function UploadZone({ onUpload }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: FileList | null): File[] => {
    if (!files) return [];

    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();

      if (ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext)) {
        validFiles.push(file);
      } else {
        alert(`File "${file.name}" is not a supported image type (JPG, PNG, SVG)`);
      }
    }

    return validFiles;
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = validateFiles(e.dataTransfer.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      await onUpload(files);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = validateFiles(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      await onUpload(files);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`upload-zone ${isDragging ? 'upload-zone-dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label="Upload files"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_EXTENSIONS.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {uploading ? (
        <div>
          <p>⏳ Uploading...</p>
        </div>
      ) : (
        <div>
          <p>📤 Drop files here or click to upload</p>
          <p className="upload-zone-hint">Supported: JPG, PNG, SVG</p>
        </div>
      )}
    </div>
  );
}
