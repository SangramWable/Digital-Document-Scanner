'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  FileText,
  AlertTriangle,
  Bell,
  GraduationCap,
  Building2,
  Clock,
} from 'lucide-react';

import { useAppStore, type ViewType } from '@/lib/store';
import { DOCUMENT_TYPES, GOVERNMENT_PORTALS, GOVERNMENT_SCHEMES, SCHOLARSHIPS } from '@/lib/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ──────────────────────── Animation helpers ──────────────────────── */

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* ──────────────────────── Types ──────────────────────── */

type SearchCategory = 'documents' | 'issues' | 'notifications' | 'portals' | 'schemes';

interface SearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  description: string;
  icon: React.ElementType;
  action: ViewType;
  badge?: string;
}

/* ──────────────────────── Category config ──────────────────────── */

const CATEGORY_META: Record<SearchCategory, { label: string; icon: React.ElementType; color: string }> = {
  documents: { label: 'Documents', icon: FileText, color: 'text-emerald-600' },
  issues: { label: 'Issues', icon: AlertTriangle, color: 'text-amber-600' },
  notifications: { label: 'Notifications', icon: Bell, color: 'text-blue-600' },
  portals: { label: 'Government Portals', icon: Building2, color: 'text-purple-600' },
  schemes: { label: 'Schemes & Scholarships', icon: GraduationCap, color: 'text-rose-600' },
};

/* ════════════════════════════════════════════════════════════════════════════
   SearchView — Global search across all app data
   ════════════════════════════════════════════════════════════════════════════ */

export default function SearchView() {
  const documents = useAppStore((s) => s.documents);
  const issues = useAppStore((s) => s.issues);
  const notifications = useAppStore((s) => s.notifications);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const searchQuery = useAppStore((s) => s.searchQuery);

  const [query, setQuery] = useState(searchQuery || '');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('docsync-recent-searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  /* ── Persist recent searches ── */
  useEffect(() => {
    try {
      localStorage.setItem('docsync-recent-searches', JSON.stringify(recentSearches));
    } catch {
      // ignore
    }
  }, [recentSearches]);

  /* ── Get doc type label ── */
  const getDocTypeLabel = useCallback((docType: string) => {
    const found = DOCUMENT_TYPES.find((dt) => dt.value === docType);
    return found ? found.label : docType;
  }, []);

  /* ── Build search results ── */
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();
    const found: SearchResult[] = [];

    /* Documents */
    documents.forEach((doc) => {
      const docTypeLabel = getDocTypeLabel(doc.docType).toLowerCase();
      const docName = doc.docName.toLowerCase();
      const matchesName = docName.includes(q) || docTypeLabel.includes(q);
      const matchesData = Object.values(doc.extractedData).some(
        (val) => val && val.toLowerCase().includes(q)
      );
      if (matchesName || matchesData) {
        found.push({
          id: `doc-${doc.id}`,
          category: 'documents',
          title: doc.docName,
          description: `${getDocTypeLabel(doc.docType)} • Health: ${doc.healthScore}% • Uploaded ${new Date(doc.createdAt).toLocaleDateString('en-IN')}`,
          icon: FileText,
          action: 'documents',
          badge: getDocTypeLabel(doc.docType),
        });
      }
    });

    /* Issues */
    issues.forEach((issue) => {
      const titleMatch = issue.title.toLowerCase().includes(q);
      const descMatch = issue.description.toLowerCase().includes(q);
      const catMatch = issue.category.toLowerCase().includes(q);
      if (titleMatch || descMatch || catMatch) {
        found.push({
          id: `issue-${issue.id}`,
          category: 'issues',
          title: issue.title,
          description: `${issue.severity.toUpperCase()} • ${issue.category} • ${issue.status.toUpperCase()}`,
          icon: AlertTriangle,
          action: 'issues',
          badge: issue.severity,
        });
      }
    });

    /* Notifications */
    notifications.forEach((notif) => {
      const titleMatch = notif.title.toLowerCase().includes(q);
      const msgMatch = notif.message.toLowerCase().includes(q);
      if (titleMatch || msgMatch) {
        found.push({
          id: `notif-${notif.id}`,
          category: 'notifications',
          title: notif.title,
          description: notif.message,
          icon: Bell,
          action: 'notifications',
          badge: notif.read ? 'read' : 'unread',
        });
      }
    });

    /* Government portals */
    GOVERNMENT_PORTALS.forEach((portal, idx) => {
      const nameMatch = portal.name.toLowerCase().includes(q);
      const descMatch = portal.description.toLowerCase().includes(q);
      if (nameMatch || descMatch) {
        found.push({
          id: `portal-${idx}`,
          category: 'portals',
          title: portal.name,
          description: portal.description,
          icon: Building2,
          action: 'correction',
          badge: 'Portal',
        });
      }
    });

    /* Schemes */
    GOVERNMENT_SCHEMES.forEach((scheme) => {
      const nameMatch = scheme.name.toLowerCase().includes(q);
      const descMatch = scheme.description.toLowerCase().includes(q);
      if (nameMatch || descMatch) {
        found.push({
          id: `scheme-${scheme.id}`,
          category: 'schemes',
          title: scheme.name,
          description: scheme.description,
          icon: GraduationCap,
          action: 'schemes',
        });
      }
    });

    /* Scholarships */
    SCHOLARSHIPS.forEach((sch) => {
      const nameMatch = sch.name.toLowerCase().includes(q);
      const descMatch = sch.description.toLowerCase().includes(q);
      if (nameMatch || descMatch) {
        found.push({
          id: `sch-${sch.id}`,
          category: 'schemes',
          title: sch.name,
          description: sch.description,
          icon: GraduationCap,
          action: 'scholarship',
        });
      }
    });

    return found;
  }, [query, documents, issues, notifications, getDocTypeLabel]);

  /* ── Group results by category ── */
  const groupedResults = useMemo(() => {
    const groups: Record<SearchCategory, SearchResult[]> = {
      documents: [],
      issues: [],
      notifications: [],
      portals: [],
      schemes: [],
    };
    results.forEach((r) => groups[r.category].push(r));
    return Object.entries(groups).filter(([, items]) => items.length > 0) as [SearchCategory, SearchResult[]][];
  }, [results]);

  /* ── Handle search submit ── */
  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (query.trim() && !recentSearches.includes(query.trim())) {
        setRecentSearches((prev) => [query.trim(), ...prev].slice(0, 8));
      }
    },
    [query, recentSearches]
  );

  /* ── Handle result click ── */
  const handleResultClick = useCallback(
    (action: ViewType) => {
      setCurrentView(action);
    },
    [setCurrentView]
  );

  /* ── Clear recent search ── */
  const clearRecentSearch = useCallback((term: string) => {
    setRecentSearches((prev) => prev.filter((s) => s !== term));
  }, []);

  /* ── Apply recent search ── */
  const applyRecentSearch = useCallback((term: string) => {
    setQuery(term);
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      {/* ── Header & Search Input ── */}
      <motion.div {...fadeInUp} transition={{ duration: 0.4 }}>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-foreground">Search</h2>
          <p className="text-sm text-muted-foreground">
            Search across documents, issues, notifications, and more
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents, issues, schemes..."
            className="h-12 pl-12 pr-12 text-base"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </form>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── No query: Show recent searches ── */}
        {!query.trim() && (
          <motion.div
            key="recent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {recentSearches.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="size-4 text-muted-foreground" />
                      Recent Searches
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRecentSearches([])}
                      className="text-xs text-muted-foreground"
                    >
                      Clear all
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <Badge
                        key={term}
                        variant="secondary"
                        className="cursor-pointer gap-1.5 px-3 py-1.5 transition-colors hover:bg-emerald-500/10 hover:text-emerald-600"
                        onClick={() => applyRecentSearch(term)}
                      >
                        {term}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearRecentSearch(term);
                          }}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state when no recent searches */}
            {recentSearches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="mb-4 size-12 text-muted-foreground/30" />
                <p className="text-lg font-medium text-muted-foreground">
                  Search anything
                </p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  Find documents, issues, notifications, portals, and schemes
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Search Results ── */}
        {query.trim() && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {results.length > 0 ? (
              <div className="space-y-4">
                {/* Results count */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{results.length}</span>{' '}
                    result{results.length !== 1 ? 's' : ''} found
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {groupedResults.length} categor{groupedResults.length !== 1 ? 'ies' : 'y'}
                  </Badge>
                </div>

                {/* Grouped results */}
                <ScrollArea className="max-h-[65vh]">
                  <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="space-y-4 pr-2"
                  >
                    {groupedResults.map(([category, items]) => {
                      const meta = CATEGORY_META[category];
                      const CatIcon = meta.icon;
                      return (
                        <motion.div key={category} variants={staggerItem}>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="flex items-center gap-2 text-sm">
                                <CatIcon className={`size-4 ${meta.color}`} />
                                {meta.label}
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  {items.length}
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1.5">
                              {items.map((item) => {
                                const ItemIcon = item.icon;
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => handleResultClick(item.action)}
                                    className="flex w-full items-start gap-3 rounded-lg border border-border/30 p-3 text-left transition-colors hover:bg-muted/50"
                                  >
                                    <ItemIcon className={`mt-0.5 size-4 shrink-0 ${meta.color}`} />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium text-foreground">
                                        {item.title}
                                      </p>
                                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                        {item.description}
                                      </p>
                                    </div>
                                    {item.badge && (
                                      <Badge
                                        variant="outline"
                                        className={`shrink-0 text-[10px] ${
                                          item.badge === 'critical'
                                            ? 'border-red-300 text-red-600'
                                            : item.badge === 'high'
                                              ? 'border-orange-300 text-orange-600'
                                              : item.badge === 'medium'
                                                ? 'border-amber-300 text-amber-600'
                                                : item.badge === 'low'
                                                  ? 'border-emerald-300 text-emerald-600'
                                                  : ''
                                        }`}
                                      >
                                        {item.badge}
                                      </Badge>
                                    )}
                                  </button>
                                );
                              })}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </ScrollArea>
              </div>
            ) : (
              /* No results */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="mb-4 size-12 text-muted-foreground/30" />
                <p className="text-lg font-medium text-muted-foreground">
                  No results found
                </p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  No matches for &quot;{query}&quot; — try a different search term
                </p>
                <Separator className="my-4 w-32" />
                <p className="text-xs text-muted-foreground/60">
                  Searches across documents, issues, notifications, portals, and schemes
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
