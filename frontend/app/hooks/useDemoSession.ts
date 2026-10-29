"use client";

import { useEffect, useState } from "react";
import {
  getDemoSession,
  setDemoSession,
  SESSION_EVENT,
} from "@/app/lib/demo-store";
import { userService } from "@/app/services/user.service";
import type { AuthUser } from "@/app/types/auth";

export default function useDemoSession() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = () => setUser(getDemoSession());
    refresh();
    void userService.getMyProfile()
      .then((currentUser) => {
        if (!active) return;
        setDemoSession(currentUser);
        setUser(currentUser);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
      });
    window.addEventListener(SESSION_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      active = false;
      window.removeEventListener(SESSION_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return user;
}
