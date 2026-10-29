"use client";

import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  getAccessToken,
  refreshAccessToken,
} from "@/app/lib/api";
import type { AuthUser } from "@/app/types/auth";
import {
  notificationService,
  type NotificationItem,
} from "@/app/services/notification.service";

type NotificationState = {
  userId: string | null;
  notifications: NotificationItem[];
  loading: boolean;
  error: string;
};

function getSocketOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (configuredOrigin) return configuredOrigin.replace(/\/+$/, "");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl?.startsWith("http")) {
    return new URL(apiUrl).origin;
  }

  return `${window.location.protocol}//${window.location.hostname}:5001`;
}

function orderNotifications(items: NotificationItem[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() -
      new Date(left.createdAt).getTime(),
  );
}

export default function useNotifications(user: AuthUser | null) {
  const [state, setState] = useState<NotificationState>({
    userId: null,
    notifications: [],
    loading: true,
    error: "",
  });

  useEffect(() => {
    if (!user) return;

    let active = true;
    let socket: Socket | null = null;
    let refreshedAfterConnectionError = false;

    notificationService
      .getAll()
      .then((items) => {
        if (!active) return;

        setState((current) => {
          const liveNotifications =
            current.userId === user.id ? current.notifications : [];
          const uniqueNotifications = new Map(
            [...items, ...liveNotifications].map((item) => [item.id, item]),
          );
          return {
            userId: user.id,
            notifications: orderNotifications([...uniqueNotifications.values()]),
            loading: false,
            error: "",
          };
        });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setState((current) => ({
          userId: user.id,
          notifications:
            current.userId === user.id ? current.notifications : [],
          loading: false,
          error:
            reason instanceof Error
              ? reason.message
              : "Unable to load notifications.",
        }));
      });

    const authenticateSocket = (callback: (auth: { token: string }) => void) => {
      void getAccessToken().then((token) => {
        callback({ token: token ?? "" });
      }).catch(() => callback({ token: "" }));
    };

    socket = io(getSocketOrigin(), {
      autoConnect: false,
      withCredentials: true,
      auth: authenticateSocket,
    });

    socket.on("notification:new", (notification: NotificationItem) => {
      if (!active || notification.recipientId !== user.id) return;

      setState((current) => {
        const notifications =
          current.userId === user.id ? current.notifications : [];
        return {
          userId: user.id,
          notifications: orderNotifications([
            notification,
            ...notifications.filter((item) => item.id !== notification.id),
          ]),
          loading: current.userId === user.id ? current.loading : true,
          error: current.userId === user.id ? current.error : "",
        };
      });
    });
    socket.on("connect_error", (reason: Error) => {
      if (active) {
        setState((current) => ({
          userId: user.id,
          notifications:
            current.userId === user.id ? current.notifications : [],
          loading: current.userId === user.id ? current.loading : true,
          error: `Live notifications unavailable: ${reason.message}`,
        }));
      }
      if (
        active &&
        !refreshedAfterConnectionError &&
        /token|auth|session/i.test(reason.message)
      ) {
        refreshedAfterConnectionError = true;
        void refreshAccessToken().then((token) => {
          if (!active || !token || !socket) return;
          socket.auth = { token };
          socket.connect();
        });
      }
    });
    socket.on("connect", () => {
      refreshedAfterConnectionError = false;
      if (active) {
        setState((current) => ({
          ...current,
          userId: user.id,
          error: "",
        }));
      }
    });
    socket.connect();

    return () => {
      active = false;
      socket?.disconnect();
    };
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    await notificationService.markRead(id);
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead();
  }, []);

  const ownsState = Boolean(user && state.userId === user.id);
  const notifications = ownsState ? state.notifications : [];
  const loading = Boolean(user) && (!ownsState || state.loading);
  const error = ownsState ? state.error : "";

  const markReadAndUpdate = useCallback(
    async (id: string) => {
      try {
        await markRead(id);
        setState((current) => ({
          ...current,
          notifications: current.notifications.map((notification) =>
            notification.id === id
              ? { ...notification, isRead: true }
              : notification,
          ),
        }));
      } catch (reason) {
        setState((current) => ({
          ...current,
          error:
            reason instanceof Error
              ? reason.message
              : "Unable to update notification status.",
        }));
        throw reason;
      }
    },
    [markRead],
  );

  const markAllReadAndUpdate = useCallback(async () => {
    try {
      await markAllRead();
      setState((current) => ({
        ...current,
        notifications: current.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      }));
    } catch (reason) {
      setState((current) => ({
        ...current,
        error:
          reason instanceof Error
            ? reason.message
            : "Unable to update notification status.",
      }));
      throw reason;
    }
  }, [markAllRead]);

  return {
    notifications,
    loading,
    error,
    markRead: markReadAndUpdate,
    markAllRead: markAllReadAndUpdate,
  };
}
