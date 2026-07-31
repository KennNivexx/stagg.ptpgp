"use client";

import { useState, useEffect, useCallback } from "react";

interface SessionUser {
  id: string;
  role: string;
  name: string;
  email: string;
  photo_url?: string | null;
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    return fetch("/api/session")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { user, loading, refetch };
}
