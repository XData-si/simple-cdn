// API client for communicating with backend

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  mimeType?: string;
  url?: string;
  thumbnailUrl?: string;
  lastModified?: string;
}

export interface ListResponse {
  path: string;
  items: FileInfo[];
  totalSize: number;
  totalCount: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode?: number;
}

class ApiClient {
  private baseUrl = '';

  async login(username: string, password: string): Promise<{ success: boolean; username: string }> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }
  }

  async checkAuth(): Promise<{ username: string } | null> {
    const response = await fetch(`${this.baseUrl}/api/auth/me`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  async list(path: string = ''): Promise<ListResponse> {
    const url = path
      ? `${this.baseUrl}/api/list?path=${encodeURIComponent(path)}`
      : `${this.baseUrl}/api/list`;

    const response = await fetch(url);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to list files');
    }

    return response.json();
  }

  async upload(file: File, path: string = '', overwrite: boolean = false): Promise<{ success: boolean; path: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseUrl}/api/upload?path=${encodeURIComponent(path)}&overwrite=${overwrite}`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  async mkdir(path: string): Promise<{ success: boolean; path: string }> {
    const response = await fetch(`${this.baseUrl}/api/mkdir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to create directory');
    }

    return response.json();
  }

  async move(src: string, dst: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ src, dst }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to move file');
    }

    return response.json();
  }

  async rename(path: string, newName: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, newName }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to rename file');
    }

    return response.json();
  }

  async delete(path: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/delete?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to delete file');
    }

    return response.json();
  }
}

export const api = new ApiClient();
