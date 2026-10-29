
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ClipboardList,
  MessageSquare,
  UserCheck,
  Clock3,
} from "lucide-react";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  time: string;
  type: "ticket" | "assignment" | "feedback";
  read: boolean;
  href: string;
};

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "Complaint received",
    message: "Your complaint CMP-1048 has been submitted successfully.",
    time: "10 minutes ago",
    type: "ticket",
    read: false,
    href: "/dashboard/user/CMP-1048",
  },
  {
    id: 2,
    title: "New ticket assignment",
    message: "A complaint has been assigned to your engineering team.",
    time: "1 hour ago",
    type: "assignment",
    read: false,
    href: "/dashboard/engineers/tickets",
  },
  {
    id: 3,
    title: "Feedback requested",
    message: "Please share feedback about your resolved complaint.",
    time: "Yesterday",
    type: "feedback",
    read: true,
    href: "/dashboard/feedback",
  },
];

const notificationIcons = {
  ticket: ClipboardList,
  assignment: UserCheck,
  feedback: MessageSquare,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState(initialNotifications);

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  }

  function markAsRead(id: number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification,
      ),
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
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
        </div>

        <button
          type="button"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCheck size={17} />
          Mark all as read
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Recent activity</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {unreadCount} unread
          </span>
        </div>

        {notifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell size={35} className="mx-auto text-slate-300" />
            <h3 className="mt-4 font-semibold text-slate-800">
              You&apos;re all caught up
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              New notifications will appear here.
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
                    notification.read ? "bg-white" : "bg-blue-50/40"
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
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock3 size={13} />
                        {notification.time}
                      </span>

                      <Link
                        href={notification.href}
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        View details
                      </Link>

                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notification.id)}
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

      <p className="text-xs text-slate-400">
        Demo notifications only. They reset on refresh and are not yet connected
        to email, WhatsApp, or a real-time notification service.
      </p>
    </main>
  );
}
