import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://streamsphere.arunai.pro/api';
const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || 'https://upload.arunai.pro/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // List of public endpoints that shouldn't auto-redirect on 401
    const isPublicEndpoint = originalRequest.method === 'get' && (
      originalRequest.url?.includes('/videos/feed') ||
      originalRequest.url?.includes('/videos/trending') ||
      originalRequest.url?.includes('/videos/shorts') ||
      originalRequest.url?.includes('/videos/search') ||
      originalRequest.url?.match(/\/videos\/[a-zA-Z0-9_-]+$/) // GET /videos/:id
    );

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isPublicEndpoint) {
        // Just clear invalid auth state and resolve the request without auth
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        delete originalRequest.headers.Authorization;
        return api(originalRequest);
      }

      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: { email: string; username: string; password: string; displayName: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) => api.post('/auth/reset-password', data),
};

// Videos
export const videoAPI = {
  getFeed: (page = 1, limit = 20) =>
    api.get(`/videos/feed?page=${page}&limit=${limit}`),
  getTrending: (page = 1, limit = 20) =>
    api.get(`/videos/trending?page=${page}&limit=${limit}`),
  getShorts: (page = 1, limit = 20) =>
    api.get(`/videos/shorts?page=${page}&limit=${limit}`),
  search: (q: string, page = 1, limit = 20, sort = 'relevance') =>
    api.get(`/videos/search?q=${q}&page=${page}&limit=${limit}&sort=${sort}`),
  getById: (id: string) => api.get(`/videos/${id}`),
  getRecommendations: (id: string) => api.get(`/videos/${id}/recommendations`),
  upload: async (formData: FormData, onProgress?: (progress: number) => void) => {
    // Try to refresh token first to ensure it's valid before long upload
    let token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      if (refreshToken) {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        token = data.accessToken;
      }
    } catch {
      // use existing token if refresh fails
    }
    return axios.post(UPLOAD_URL + '/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      withCredentials: true,
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },
  uploadThumbnail: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    return api.post(`/videos/${id}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id: string, data: any) => api.put(`/videos/${id}`, data),
  delete: (id: string) => api.delete(`/videos/${id}`),
  recordView: (id: string) => api.post(`/videos/${id}/view`),
  like: (id: string, type: 'LIKE' | 'DISLIKE') =>
    api.post(`/videos/${id}/like`, { type }),
  getLiked: (page = 1) => api.get(`/videos/liked?page=${page}`),
  getWatchLater: (page = 1) => api.get(`/videos/watch-later?page=${page}`),
  getHistory: (page = 1) => api.get(`/videos/history?page=${page}`),
  getSubscriptionFeed: (page = 1) => api.get(`/videos/subscriptions?page=${page}`),
  toggleWatchLater: (id: string) => api.post(`/videos/${id}/watch-later`),
  saveProgress: (id: string, progress: number) => api.post(`/videos/${id}/progress`, { progress }),
  getProgress: (id: string) => api.get(`/videos/${id}/progress`),
  searchSuggestions: (q: string) => api.get(`/videos/suggestions?q=${encodeURIComponent(q)}`),
  getDownloadUrl: (id: string) => api.get(`/videos/${id}/download`),
  schedule: (id: string, scheduledAt: string) => api.post(`/videos/${id}/schedule`, { scheduledAt }),
  analyticsExport: () => api.get('/videos/analytics/export', { responseType: 'blob' }),
  getCaptions: (id: string) => api.get(`/videos/${id}/captions`),
};

// Comments
export const commentAPI = {
  getByVideo: (videoId: string, page = 1) =>
    api.get(`/comments/video/${videoId}?page=${page}`),
  getChannelComments: (page = 1, limit = 20) =>
    api.get(`/comments/channel?page=${page}&limit=${limit}`),
  getReplies: (commentId: string, page = 1) =>
    api.get(`/comments/${commentId}/replies?page=${page}`),
  create: (videoId: string, text: string, parentId?: string) =>
    api.post(`/comments/video/${videoId}`, { text, parentId }),
  delete: (id: string) => api.delete(`/comments/${id}`),
  edit: (id: string, text: string) => api.patch(`/comments/${id}`, { text }),
  like: (id: string) => api.post(`/comments/${id}/like`),
};

// Channels
export const channelAPI = {
  getById: (id: string) => api.get(`/channels/${id}`),
  getByUsername: (username: string) => api.get(`/channels/by-username/${username}`),
  getVideos: (id: string, page = 1, limit = 50) => api.get(`/channels/${id}/videos?page=${page}&limit=${limit}`),
  subscribe: (id: string) => api.post(`/channels/${id}/subscribe`),
  getSubscriptions: () => api.get('/channels/user/subscriptions'),
  updateProfile: (data: { displayName?: string; bio?: string; location?: string; socialLinks?: any; avatar?: string | null; banner?: string | null; watermark?: string | null }) =>
    api.put('/channels/me/profile', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.put('/channels/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadBanner: (file: File) => {
    const formData = new FormData();
    formData.append('banner', file);
    return api.put('/channels/me/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadWatermark: (file: File) => {
    const formData = new FormData();
    formData.append('watermark', file);
    return api.put('/channels/me/watermark', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  requestVerification: () => api.post('/channels/request-verification'),
  getVerificationStatus: () => api.get('/channels/verification-status/me'),
};

// Playlists
export const playlistAPI = {
  getAll: () => api.get('/playlists'),
  getById: (id: string) => api.get(`/playlists/${id}`),
  create: (data: { title: string; description?: string }) =>
    api.post('/playlists', data),
  addVideo: (playlistId: string, videoId: string) =>
    api.post(`/playlists/${playlistId}/videos`, { videoId }),
  removeVideo: (playlistId: string, videoId: string) =>
    api.delete(`/playlists/${playlistId}/videos/${videoId}`),
  delete: (id: string) => api.delete(`/playlists/${id}`),
  addCollaborator: (playlistId: string, username: string) =>
    api.post(`/playlists/${playlistId}/collaborators`, { username }),
  removeCollaborator: (playlistId: string, userId: string) =>
    api.delete(`/playlists/${playlistId}/collaborators/${userId}`),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (prefs: any) => api.put('/notifications/preferences', prefs),
};

// Community Posts
export const communityAPI = {
  getByChannel: (channelId: string, page = 1) => api.get(`/community/channel/${channelId}?page=${page}`),
  create: (data: { text: string; imageUrl?: string; pollOptions?: string[] }) => api.post('/community', data),
  delete: (id: string) => api.delete(`/community/${id}`),
  vote: (pollId: string, optionId: string) => api.post(`/community/poll/${pollId}/vote`, { optionId }),
};

// Reports
export const reportAPI = {
  create: (data: { type: string; reason: string; description?: string; videoId?: string; commentId?: string; channelId?: string }) =>
    api.post('/reports', data),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (page = 1) => api.get(`/admin/users?page=${page}`),
  updateUserRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  toggleVerify: (id: string) => api.put(`/admin/users/${id}/verify`),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getVideos: (page = 1) => api.get(`/admin/videos?page=${page}`),
  deleteVideo: (id: string) => api.delete(`/admin/videos/${id}`),
  getVerificationRequests: () => api.get('/admin/verification-requests'),
  approveVerification: (id: string) => api.put(`/admin/verification-requests/${id}/approve`),
  rejectVerification: (id: string) => api.put(`/admin/verification-requests/${id}/reject`),
};

// Live Streaming
export const liveAPI = {
  getActive: (page = 1, limit = 20) => api.get(`/live?page=${page}&limit=${limit}`),
  getById: (id: string) => api.get(`/live/${id}`),
  create: (data: { title: string; description?: string }) => api.post('/live/create', data),
  endStream: (id: string) => api.post(`/live/${id}/end`),
  getMyStreams: () => api.get('/live/my-streams'),
  getMyActive: () => api.get('/live/my-active'),
  regenerateKey: (id: string) => api.post(`/live/${id}/regenerate-key`),
};

export default api;
