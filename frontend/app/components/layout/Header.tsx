
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Menu,
  Search,
  CheckCheck,
  Ticket,
  UserCheck,
  MessageSquare,
  Clock,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";
import type { AuthUser } from "@/app/types/auth";
import useNotifications from "@/app/hooks/useNotifications";

type HeaderProps = {
  user: AuthUser;
  onMenuClick?: () => void;
};

const notificationIcons = {
  TICKET_CREATED: Ticket,
  TICKET_ASSIGNED: UserCheck,
  STATUS_CHANGED: MessageSquare,
  NEW_COMMENT: MessageSquare,
  TICKET_RESOLVED: Ticket,
  FEEDBACK_RECEIVED: MessageSquare,
  SYSTEM: Bell,
};

function notificationHref(role: AuthUser["role"], ticketId: string | null) {
  if (!ticketId) {
    return role === "ADMIN"
      ? "/dashboard/admin"
      : role === "USER"
        ? "/dashboard/user"
        : "/dashboard/engineers/tickets";
  }

  const encodedTicketId = encodeURIComponent(ticketId);
  if (role === "ADMIN") return `/dashboard/admin/tickets/${encodedTicketId}`;
  if (role === "USER") return `/dashboard/user/${encodedTicketId}`;
  return `/dashboard/engineers/tickets/${encodedTicketId}`;
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const {
    notifications,
    loading: notificationsLoading,
    error: notificationError,
    markRead,
    markAllRead,
  } = useNotifications(user);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  async function markAsRead(id: string) {
    try {
      await markRead(id);
    } catch (reason) {
      console.error("Unable to mark notification as read:", reason);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllRead();
    } catch (reason) {
      console.error("Unable to mark notifications as read:", reason);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search complaints..."
            aria-label="Search complaints"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          aria-expanded={open}
          className="relative rounded-xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Notifications
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {unreadCount} unread notification
                  {unreadCount === 1 ? "" : "s"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleMarkAllAsRead()}
                disabled={unreadCount === 0}
                className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCheck size={15} />
                Mark all read
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notificationsLoading ? (
                <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-slate-500">
                  <LoaderCircle size={16} className="animate-spin" />
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Bell className="mx-auto mb-3 text-slate-300" size={30} />
                  <p className="text-sm font-medium text-slate-700">
                    You&apos;re all caught up
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    New updates will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type];

                  return (
                    <Link
                      key={notification.id}
                      href={notificationHref(user.role, notification.ticketId)}
                      onClick={() => {
                        setOpen(false);
                        if (!notification.isRead) {
                          void markAsRead(notification.id);
                        }
                      }}
                      className={`flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${
                        !notification.isRead ? "bg-blue-50/50" : "bg-white"
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                        <Icon size={18} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-800">
                            {notification.title}
                          </span>
                          {!notification.isRead && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                          )}
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-600">
                          {notification.message}
                        </span>

                        <span className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock size={12} />
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
            {notificationError && (
              <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                {notificationError}
              </p>
            )}

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              View all notifications
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
