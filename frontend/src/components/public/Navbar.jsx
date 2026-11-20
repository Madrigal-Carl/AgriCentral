import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Menu, Settings, User } from "lucide-react";

import { useCrumbs } from "@/utils/useCrumbs";
import useAuth from "@/hooks/useAuth";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { notificationLink } from "@/utils/notificationLink";
import { fmtRelativeTime } from "@/utils/format";
import { Button } from "@/components/ui";

const BELL_LIST_LIMIT = 20;
const formatBadge = (count) => (count > 99 ? "99+" : String(count));

// Unread badge plus a dropdown of the latest notifications. Clicking one
// marks it read and opens its record (?view=<entityId>) when the role has
// a page for it.
function NotificationBell({ user }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  // Login responds with id, /auth/me with _id.
  const userId = user?._id ?? user?.id;

  const { data: countData } = useUnreadNotificationCount(userId);
  const unread = countData?.count ?? 0;
  const { data: listData, isLoading } = useNotifications(
    userId,
    { page: 1, limit: BELL_LIST_LIMIT },
    { enabled: !!userId && open },
  );
  const notifications = listData?.notifications ?? [];
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  function handleItemClick(notification) {
    if (!notification.readAt) markRead.mutate(notification._id);
    const link = notificationLink(notification, user?.role);
    setOpen(false);
    if (link) navigate(link);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center text-secondary hover:bg-muted hover:text-foreground"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-red-600 px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
            {formatBadge(unread)}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="text-sm font-semibold text-foreground">
              Notifications
            </div>
            <button
              onClick={() => markAllRead.mutate()}
              disabled={!unread || markAllRead.isPending}
              className="text-xs font-semibold text-accent hover:underline disabled:cursor-not-allowed disabled:text-secondary disabled:no-underline"
            >
              Mark all as read
            </button>
          </div>
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-secondary">
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <Bell className="h-6 w-6 text-secondary" />
              <div className="text-sm text-secondary">
                You have no notifications.
              </div>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {notifications.map((n) => (
                <li key={n._id}>
                  <button
                    onClick={() => handleItemClick(n)}
                    className={`flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-muted ${n.readAt ? "" : "bg-accent-soft/40"}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-accent"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block break-words text-sm ${n.readAt ? "text-secondary" : "text-foreground"}`}
                      >
                        {n.message}
                      </span>
                      <span className="mt-0.5 block text-xs text-secondary">
                        {fmtRelativeTime(n.createdAt)}
                        {!n.readAt && <span className="sr-only"> (unread)</span>}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function LogoutConfirmModal({ onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-surface border border-border shadow-xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center bg-warning/10 text-warning">
          <LogOut className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg tracking-tight text-foreground mb-1">
          Log Out?
        </h3>
        <p className="text-sm text-secondary mb-6">
          Are you sure you want to log out of{" "}
          <strong className="text-foreground">AgriCentral</strong>? You'll need
          to sign in again to access your account.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Navbar({ onMenu }) {
  const crumb = useCrumbs();
  const { user, initial, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  function handleLogoutClick() {
    setOpen(false);
    setShowLogoutConfirm(true);
  }

  async function handleLogoutConfirm() {
    setShowLogoutConfirm(false);
    await logout();
    navigate("/auth");
  }

  return (
    <header className="sticky top-0 z-20 md:z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="text-secondary hover:text-foreground lg:hidden"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <nav className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="hidden font-semibold text-foreground sm:inline">
            AgriCentral
          </span>
          <span className="hidden text-secondary sm:inline">/</span>
          {crumb.group && (
            <>
              <span className="text-secondary">{crumb.group}</span>
              <span className="text-secondary">/</span>
            </>
          )}
          <span className="truncate font-semibold text-foreground">
            {crumb.label}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell user={user} />
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 py-1.5 pl-1 pr-2 hover:bg-muted"
          >
            <div className="grid h-8 w-8 place-items-center bg-accent-soft rounded-full font-display text-xs text-accent">
              {initial}
            </div>
            <ChevronDown className="h-4 w-4 text-secondary" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 border border-border bg-surface shadow-lg">
              <div className="border-b border-border px-4 py-3">
                <div className="text-sm font-semibold text-foreground">
                  {user?.fullname}
                </div>
                <div className="text-xs text-secondary">{user?.email}</div>
              </div>
              <ul className="py-1">
                {[
                  { icon: User, label: "Profile" },
                  { icon: Settings, label: "Account Settings" },
                ].map((i) => (
                  <li key={i.label}>
                    <button className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted">
                      <i.icon className="h-4 w-4 text-secondary" />
                      {i.label}
                    </button>
                  </li>
                ))}
                <li className="border-t border-border">
                  <button
                    onClick={handleLogoutClick}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4 text-secondary" />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogoutConfirm}
        />
      )}
    </header>
  );
}
