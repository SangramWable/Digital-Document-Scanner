'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  GitCompare,
  AlertTriangle,
  Wrench,
  GraduationCap,
  Building2,
  MessageCircle,
  Bell,
  Clock,
  FileBarChart,
  Search,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  X,
  Moon,
  Sun,
} from 'lucide-react';

import { useAppStore, type ViewType } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import Dashboard from './Dashboard';
import DocumentUpload from './DocumentUpload';
import DocumentComparison from './DocumentComparison';
import IssueDetection from './IssueDetection';
import CorrectionAssistant from './CorrectionAssistant';
import ScholarshipAssistant from './ScholarshipAssistant';
import SchemeRecommendation from './SchemeRecommendation';
import AIChatAssistant from './AIChatAssistant';
import NotificationsView from './NotificationsView';
import ExpiryTracker from './ExpiryTracker';
import ReportsView from './ReportsView';
import SearchView from './SearchView';
import SettingsView from './SettingsView';
import ProfileView from './ProfileView';

/* ──────────────────────────── Types ──────────────────────────── */

interface NavItem {
  label: string;
  view: ViewType;
  icon: React.ElementType;
  badge?: () => number;
}

/* ──────────────────────────── Navigation config ──────────────────────────── */

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
  { label: 'Documents', view: 'documents', icon: FileText },
  { label: 'Compare', view: 'compare', icon: GitCompare },
  {
    label: 'Issues',
    view: 'issues',
    icon: AlertTriangle,
    badge: () => {
      // Will be read dynamically inside component
      return 0;
    },
  },
  { label: 'Correction', view: 'correction', icon: Wrench },
  { label: 'Scholarship', view: 'scholarship', icon: GraduationCap },
  { label: 'Schemes', view: 'schemes', icon: Building2 },
  { label: 'AI Chat', view: 'chat', icon: MessageCircle },
  {
    label: 'Notifications',
    view: 'notifications',
    icon: Bell,
    badge: () => 0,
  },
  { label: 'Expiry Tracker', view: 'expiry', icon: Clock },
  { label: 'Reports', view: 'reports', icon: FileBarChart },
  { label: 'Search', view: 'search', icon: Search },
];

const bottomNavItems: NavItem[] = [
  { label: 'Settings', view: 'settings', icon: Settings },
  { label: 'Profile', view: 'profile', icon: User },
];

/* ──────────────────────────── View title map ──────────────────────────── */

const viewTitles: Record<ViewType, string> = {
  landing: 'Welcome',
  dashboard: 'Dashboard',
  documents: 'Documents',
  compare: 'Document Comparison',
  issues: 'Issue Detection',
  correction: 'Correction Assistant',
  scholarship: 'Scholarship Assistant',
  schemes: 'Scheme Recommendations',
  chat: 'AI Chat Assistant',
  notifications: 'Notifications',
  expiry: 'Expiry Tracker',
  reports: 'Reports',
  search: 'Search',
  settings: 'Settings',
  profile: 'Profile',
};

/* ──────────────────────────── View renderer ──────────────────────────── */

function renderView(view: ViewType) {
  switch (view) {
    case 'dashboard':
      return <Dashboard />;
    case 'documents':
      return <DocumentUpload />;
    case 'compare':
      return <DocumentComparison />;
    case 'issues':
      return <IssueDetection />;
    case 'correction':
      return <CorrectionAssistant />;
    case 'scholarship':
      return <ScholarshipAssistant />;
    case 'schemes':
      return <SchemeRecommendation />;
    case 'chat':
      return <AIChatAssistant />;
    case 'notifications':
      return <NotificationsView />;
    case 'expiry':
      return <ExpiryTracker />;
    case 'reports':
      return <ReportsView />;
    case 'search':
      return <SearchView />;
    case 'settings':
      return <SettingsView />;
    case 'profile':
      return <ProfileView />;
    default:
      return <Dashboard />;
  }
}

/* ──────────────────────────── Page transition animation ──────────────────────────── */

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3,
};

/* ──────────────────────────── SidebarNavItem ──────────────────────────── */

function SidebarNavItem({
  item,
  isActive,
  collapsed,
  onClick,
  badgeCount,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
  badgeCount?: number;
}) {
  const Icon = item.icon;

  const button = (
    <button
      onClick={onClick}
      className={`
        group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5
        text-sm font-medium transition-all duration-200
        ${
          isActive
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
            : 'text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400'
        }
        ${collapsed ? 'justify-center px-2' : ''}
      `}
    >
      <Icon
        className={`size-5 shrink-0 transition-transform duration-200 ${
          isActive ? 'text-white' : 'text-muted-foreground group-hover:text-emerald-500'
        }`}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && badgeCount !== undefined && badgeCount > 0 && (
        <Badge
          className={`ml-auto h-5 min-w-[20px] px-1.5 text-[10px] font-bold ${
            isActive
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-emerald-500 text-white border-emerald-600'
          }`}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </Badge>
      )}
      {collapsed && badgeCount !== undefined && badgeCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white ring-2 ring-background">
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
          {badgeCount !== undefined && badgeCount > 0 && ` (${badgeCount})`}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

/* ──────────────────────────── Sidebar Content ──────────────────────────── */

function SidebarContent({
  collapsed,
  onNavigate,
  onLogout,
}: {
  collapsed: boolean;
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
}) {
  const currentView = useAppStore((s) => s.currentView);
  const user = useAppStore((s) => s.user);
  const getUnreadNotificationCount = useAppStore((s) => s.getUnreadNotificationCount);
  const getOpenIssueCount = useAppStore((s) => s.getOpenIssueCount);

  const unreadCount = getUnreadNotificationCount();
  const openIssueCount = getOpenIssueCount();

  // Build nav items with live badge counts
  const navItemsWithBadges = useMemo(
    () =>
      mainNavItems.map((item) => {
        let count: number | undefined;
        if (item.view === 'issues') count = openIssueCount;
        if (item.view === 'notifications') count = unreadCount;
        return { ...item, badgeCount: count };
      }),
    [openIssueCount, unreadCount]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={`flex items-center gap-3 border-b border-border/50 px-4 py-4 ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 shadow-md shadow-emerald-500/30">
          <Shield className="size-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground">
              DocSync India
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Document Suite
            </span>
          </div>
        )}
      </div>

      {/* Main navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="flex flex-col gap-1">
          {navItemsWithBadges.map((item) => (
            <SidebarNavItem
              key={item.view}
              item={item}
              isActive={currentView === item.view}
              collapsed={collapsed}
              onClick={() => onNavigate(item.view)}
              badgeCount={item.badgeCount}
            />
          ))}
        </nav>
      </ScrollArea>

      <Separator className="mx-3" />

      {/* Bottom nav items */}
      <div className="px-3 py-2">
        {bottomNavItems.map((item) => (
          <SidebarNavItem
            key={item.view}
            item={item}
            isActive={currentView === item.view}
            collapsed={collapsed}
            onClick={() => onNavigate(item.view)}
          />
        ))}
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="mx-3 mb-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8 border border-emerald-500/30">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold dark:bg-emerald-900/50 dark:text-emerald-300">
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-foreground">
                {user.name}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Logout button */}
      <div className={`px-3 pb-2 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={onLogout}
          className={`
            flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
            text-muted-foreground transition-all duration-200
            hover:bg-red-500/10 hover:text-red-500
            ${collapsed ? 'justify-center px-2' : ''}
          `}
        >
          <LogOut className="size-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Privacy text */}
      {!collapsed && (
        <div className="border-t border-border/50 px-4 py-3">
          <p className="text-center text-[10px] leading-tight text-muted-foreground/70">
            Your Documents. Your Device. Your Privacy.
          </p>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   AppShell — Main application shell
   ════════════════════════════════════════════════════════════════════════════ */

export default function AppShell() {
  const currentView = useAppStore((s) => s.currentView);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setCurrentViewStore = useAppStore((s) => s.setCurrentView);
  const getUnreadNotificationCount = useAppStore((s) => s.getUnreadNotificationCount);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const unreadCount = getUnreadNotificationCount();

  /* ── Theme management ── */
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  /* ── Navigation handler ── */
  const handleNavigate = useCallback(
    (view: ViewType) => {
      setCurrentView(view);
      setMobileOpen(false);
    },
    [setCurrentView]
  );

  /* ── Search handler ── */
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchInput.trim()) {
        setSearchQuery(searchInput.trim());
        setCurrentViewStore('search');
        setSearchInput('');
      }
    },
    [searchInput, setSearchQuery, setCurrentViewStore]
  );

  /* ── User initials ── */
  const userName = user?.name;
  const userInitials = useMemo(() => {
    if (!userName) return 'U';
    return userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [userName]);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* ─────── Desktop Sidebar ─────── */}
        <aside
          className={`
            relative hidden md:flex flex-col
            border-r border-border/50
            bg-gradient-to-b from-card via-card to-emerald-500/[0.03]
            dark:from-card dark:via-card dark:to-emerald-500/[0.05]
            transition-all duration-300 ease-in-out
            ${collapsed ? 'w-[68px]' : 'w-[260px]'}
          `}
        >
          <SidebarContent
            collapsed={collapsed}
            onNavigate={handleNavigate}
            onLogout={logout}
          />

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 z-10 flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-accent"
          >
            {collapsed ? (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronLeft className="size-3.5 text-muted-foreground" />
            )}
          </button>
        </aside>

        {/* ─────── Mobile Sidebar (Sheet) ─────── */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent
              collapsed={false}
              onNavigate={handleNavigate}
              onLogout={logout}
            />
          </SheetContent>
        </Sheet>

        {/* ─────── Main content area ─────── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* ─────── Top header bar ─────── */}
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/50 bg-card/80 px-4 backdrop-blur-sm">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
              <span className="sr-only">Open menu</span>
            </Button>

            {/* Current page title */}
            <h1 className="text-lg font-semibold text-foreground">
              {viewTitles[currentView] || 'Dashboard'}
            </h1>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search input */}
            <form onSubmit={handleSearch} className="hidden sm:block">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search documents..."
                  className="h-8 w-48 pl-8 text-sm lg:w-64"
                />
              </div>
            </form>

            {/* Mobile search button */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => handleNavigate('search')}
            >
              <Search className="size-4" />
            </Button>

            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Notification bell */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => handleNavigate('notifications')}
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white ring-2 ring-card">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>

            {/* User avatar dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="size-7 border border-emerald-500/30">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-[10px] font-bold dark:bg-emerald-900/50 dark:text-emerald-300">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigate('profile')}>
                  <User className="mr-2 size-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate('settings')}>
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-500 focus:text-red-500"
                >
                  <LogOut className="mr-2 size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* ─────── Content area ─────── */}
          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="h-full"
              >
                {renderView(currentView)}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
