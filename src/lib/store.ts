import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewType =
  | 'landing'
  | 'dashboard'
  | 'documents'
  | 'compare'
  | 'issues'
  | 'correction'
  | 'scholarship'
  | 'schemes'
  | 'chat'
  | 'notifications'
  | 'expiry'
  | 'reports'
  | 'search'
  | 'settings'
  | 'profile';

export interface ExtractedField {
  label: string;
  key: string;
  value: string;
  status?: 'correct' | 'mismatch' | 'missing';
}

export interface DocIssue {
  id: string;
  documentId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  impact: string[];
  status: 'open' | 'resolved' | 'dismissed';
  fixGuidance?: FixGuidance;
  createdAt: string;
}

export interface FixGuidance {
  requiredDocs: string[];
  method: 'online' | 'offline' | 'both';
  fees: string;
  processingTime: string;
  department: string;
  steps: string[];
  portalUrl?: string;
  portalName?: string;
}

export interface DocNotification {
  id: string;
  type: 'expiry' | 'deadline' | 'scheme' | 'system';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface UserDocument {
  id: string;
  docType: string;
  docName: string;
  fileName: string;
  fileData: string;
  mimeType: string;
  extractedData: Record<string, string>;
  healthScore: number;
  issueDate?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
  issues?: DocIssue[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  age?: number;
  gender?: string;
  category?: string;
  income?: string;
  occupation?: string;
  state?: string;
}

export interface Activity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
}

interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: UserProfile | null;
  showAuthDialog: boolean;
  authMode: 'login' | 'signup';

  // Navigation
  currentView: ViewType;
  sidebarOpen: boolean;

  // Documents
  documents: UserDocument[];
  selectedDocument: UserDocument | null;

  // Issues
  issues: DocIssue[];

  // Notifications
  notifications: DocNotification[];

  // Activities
  activities: Activity[];

  // Chat
  chatMessages: ChatMessage[];
  chatLoading: boolean;

  // Theme
  theme: 'light' | 'dark' | 'high-contrast';

  // Search
  searchQuery: string;

  // Actions
  login: (user: UserProfile) => void;
  logout: () => void;
  setShowAuthDialog: (show: boolean, mode?: 'login' | 'signup') => void;
  setAuthMode: (mode: 'login' | 'signup') => void;
  setCurrentView: (view: ViewType) => void;
  setSidebarOpen: (open: boolean) => void;
  addDocument: (doc: UserDocument) => void;
  updateDocument: (id: string, updates: Partial<UserDocument>) => void;
  removeDocument: (id: string) => void;
  setSelectedDocument: (doc: UserDocument | null) => void;
  addIssue: (issue: DocIssue) => void;
  updateIssue: (id: string, updates: Partial<DocIssue>) => void;
  removeIssue: (id: string) => void;
  addNotification: (notification: DocNotification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addActivity: (action: string, description: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatLoading: (loading: boolean) => void;
  clearChat: () => void;
  setTheme: (theme: 'light' | 'dark' | 'high-contrast') => void;
  setSearchQuery: (query: string) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  deleteAllData: () => void;
  getHealthScore: () => number;
  getUnreadNotificationCount: () => number;
  getOpenIssueCount: () => number;
  getResolvedIssueCount: () => number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      isAuthenticated: false,
      user: null,
      showAuthDialog: false,
      authMode: 'login',

      // Navigation
      currentView: 'landing',
      sidebarOpen: true,

      // Documents
      documents: [],
      selectedDocument: null,

      // Issues
      issues: [],

      // Notifications
      notifications: [],

      // Activities
      activities: [],

      // Chat
      chatMessages: [],
      chatLoading: false,

      // Theme
      theme: 'light',

      // Search
      searchQuery: '',

      // Actions
      login: (user) => {
        set({ isAuthenticated: true, user, currentView: 'dashboard', showAuthDialog: false });
        get().addActivity('Login', `Welcome back, ${user.name}!`);
      },

      logout: () => {
        set({ isAuthenticated: false, user: null, currentView: 'landing' });
      },

      setShowAuthDialog: (show, mode) => {
        set({ showAuthDialog: show, authMode: mode || get().authMode });
      },

      setAuthMode: (mode) => set({ authMode: mode }),

      setCurrentView: (view) => set({ currentView: view }),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      addDocument: (doc) => {
        set((state) => ({ documents: [...state.documents, doc] }));
        get().addActivity('Document Upload', `Uploaded ${doc.docName}`);
      },

      updateDocument: (id, updates) => {
        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        }));
      },

      removeDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
          issues: state.issues.filter((i) => i.documentId !== id),
        }));
        get().addActivity('Document Removed', 'A document was removed');
      },

      setSelectedDocument: (doc) => set({ selectedDocument: doc }),

      addIssue: (issue) => {
        set((state) => ({ issues: [...state.issues, issue] }));
      },

      updateIssue: (id, updates) => {
        set((state) => ({
          issues: state.issues.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        }));
        if (updates.status === 'resolved') {
          get().addActivity('Issue Resolved', issue.title);
        }
      },

      removeIssue: (id) => {
        set((state) => ({ issues: state.issues.filter((i) => i.id !== id) }));
      },

      addNotification: (notification) => {
        set((state) => ({ notifications: [notification, ...state.notifications] }));
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },

      clearNotifications: () => set({ notifications: [] }),

      addActivity: (action, description) => {
        const activity: Activity = {
          id: crypto.randomUUID(),
          action,
          description,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ activities: [activity, ...state.activities].slice(0, 50) }));
      },

      addChatMessage: (message) => {
        set((state) => ({ chatMessages: [...state.chatMessages, message] }));
      },

      setChatLoading: (loading) => set({ chatLoading: loading }),

      clearChat: () => set({ chatMessages: [] }),

      setTheme: (theme) => set({ theme }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
          get().addActivity('Profile Updated', 'Your profile information was updated');
        }
      },

      deleteAllData: () => {
        set({
          documents: [],
          issues: [],
          notifications: [],
          activities: [],
          chatMessages: [],
          selectedDocument: null,
        });
        get().addActivity('Data Deleted', 'All locally stored data has been permanently removed');
      },

      getHealthScore: () => {
        const docs = get().documents;
        const issues = get().issues;
        if (docs.length === 0) return 0;

        const openIssues = issues.filter((i) => i.status === 'open');
        const criticalCount = openIssues.filter((i) => i.severity === 'critical').length;
        const highCount = openIssues.filter((i) => i.severity === 'high').length;
        const mediumCount = openIssues.filter((i) => i.severity === 'medium').length;
        const lowCount = openIssues.filter((i) => i.severity === 'low').length;

        let score = 100;
        score -= criticalCount * 20;
        score -= highCount * 10;
        score -= mediumCount * 5;
        score -= lowCount * 2;

        return Math.max(0, Math.min(100, score));
      },

      getUnreadNotificationCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },

      getOpenIssueCount: () => {
        return get().issues.filter((i) => i.status === 'open').length;
      },

      getResolvedIssueCount: () => {
        return get().issues.filter((i) => i.status === 'resolved').length;
      },
    }),
    {
      name: 'docsync-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        documents: state.documents,
        issues: state.issues,
        notifications: state.notifications,
        activities: state.activities,
        chatMessages: state.chatMessages,
        theme: state.theme,
      }),
    }
  )
);
