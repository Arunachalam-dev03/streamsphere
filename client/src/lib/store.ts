import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
  banner?: string | null;
  watermark?: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  hydrate: () => void;
}

// Read auth state from localStorage synchronously during store creation
function getInitialAuthState(): { user: User | null; isAuthenticated: boolean } {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }
  try {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (userStr && token) {
      return { user: JSON.parse(userStr), isAuthenticated: true };
    }
  } catch {
    // ignore parse errors
  }
  return { user: null, isAuthenticated: false };
}

const initialAuth = getInitialAuthState();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialAuth.user,
  isAuthenticated: initialAuth.isAuthenticated,
  isHydrated: false,

  hydrate: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      if (userStr && token) {
        try {
          const user = JSON.parse(userStr);
          set({ user, isAuthenticated: true, isHydrated: true });
        } catch {
          set({ user: null, isAuthenticated: false, isHydrated: true });
        }
      } else {
        set({ user: null, isAuthenticated: false, isHydrated: true });
      }
    }
  },

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isHydrated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, isHydrated: true });
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));

// UI Store
interface MiniPlayerState {
  videoId: string;
  src: string;
  title: string;
}

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  miniPlayer: MiniPlayerState | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  openMiniPlayer: (data: MiniPlayerState) => void;
  closeMiniPlayer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  miniPlayer: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  openMiniPlayer: (data) => set({ miniPlayer: data }),
  closeMiniPlayer: () => set({ miniPlayer: null }),
}));
