'use client';

import { motion } from 'framer-motion';
import { Bell, Check, Trash2 } from 'lucide-react';

import { useAppStore } from '@/lib/store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function NotificationsView() {
  const notifications = useAppStore((s) => s.notifications);
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const clearNotifications = useAppStore((s) => s.clearNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeColors: Record<string, string> = {
    expiry: 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400',
    deadline: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
    scheme: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400',
    system: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <motion.div {...fadeInUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Bell className="size-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearNotifications}
              className="gap-1.5 text-red-600 hover:text-red-700"
            >
              <Trash2 className="size-3.5" />
              Clear All
            </Button>
          )}
        </div>
      </motion.div>

      {notifications.length > 0 ? (
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-3 pr-2">
            {notifications.map((notif, idx) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`transition-colors ${!notif.read ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/10' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{notif.title}</p>
                          {!notif.read && (
                            <Badge className="bg-emerald-500 text-[10px] text-white">New</Badge>
                          )}
                          <Badge variant="outline" className={`text-[10px] ${typeColors[notif.type] || ''}`}>
                            {notif.type}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{notif.message}</p>
                        <p className="mt-1.5 text-[10px] text-muted-foreground/60">
                          {new Date(notif.createdAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                      {!notif.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0"
                          onClick={() => markNotificationRead(notif.id)}
                        >
                          <Check className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Bell className="mb-4 size-12 text-muted-foreground/30" />
          <p className="text-lg font-medium text-muted-foreground">No notifications</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            You&apos;re all caught up! Notifications about document expiry and deadlines will appear here.
          </p>
        </motion.div>
      )}
    </div>
  );
}
