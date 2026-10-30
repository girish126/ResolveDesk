"use client";

import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ClipboardList,
  Clock3,
  LoaderCircle,
  MessageSquare,
  UserCheck,
} from "lucide-react";
import useDemoSession from "@/app/hooks/useDemoSession";
import useNotifications from "@/app/hooks/useNotifications";
import type { NotificationItem } from "@/app/services/notification.service";
import { formatDateTime } from "@/app/lib/utils";

const notificationIcons = {
  TICKET_CREATED: ClipboardList,
  TICKET_ASSIGNED: UserCheck,
  STATUS_CHANGED: MessageSquare,
  NEW_COMMENT: MessageSquare,
  TICKET_RESOLVED: ClipboardList,
  FEEDBACK_RECEIVED: MessageSquare,
  SYSTEM: Bell,
};

function notificationHref(
  notification: NotificationItem,
  role: "USER" | "ADMIN" | "ENGINEER" | "EMPLOYEE",
) {
  if (!notification.ticketId) return "/dashboard";

  const ticketId = encodeURIComponent(notification.ticketId);
  if (role === "ADMIN") return `/dashboard/admin/tickets/${ticketId}`;
  if (role === "USER") return `/dashboard/user/${ticketId}`;
  return `/dashboard/engineers/tickets/${ticketId}`;
}

export default function NotificationsPage() {
  const user = useDemoSession();
  const { notifications, loading, error, markRead, markAllRead } =
    useNotifications(user);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  async function handleMarkAllRead() {
    try {
      await markAllRead();
    } catch (reason) {
      console.error("Unable to mark notifications as read:", reason);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await markRead(id);
    } catch (reason) {
      console.error("Unable to mark notification as read:", reason);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Bell size={24} />
          </span>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Stay updated on complaints and assignments.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleMarkAllRead()}
          disabled={unreadCount === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCheck size={17} />
          Mark all as read
        </button>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Recent activity</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {unreadCount} unread
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-500">
            <LoaderCircle size={18} className="animate-spin" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell size={35} className="mx-auto text-slate-300" />
            <h3 className="mt-4 font-semibold text-slate-800">
              You&apos;re all caught up
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              New updates will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type];

              return (
                <div
                  key={notification.id}
                  className={`flex gap-4 p-5 transition ${
                    notification.isRead ? "bg-white" : "bg-blue-50/40"
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Icon size={21} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock3 size={13} />
                        {formatDateTime(notification.createdAt)}
                      </span>
                      {user && (
                        <Link
                          href={notificationHref(notification, user.role)}
                          onClick={() => {
                            if (!notification.isRead) {
                              void handleMarkRead(notification.id);
                            }
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          View details
                        </Link>
                      )}
                      {!notification.isRead && (
                        <button
                          type="button"
                          onClick={() => void handleMarkRead(notification.id)}
                          className="text-xs font-medium text-slate-500 hover:text-slate-800"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
