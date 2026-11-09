"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { toast } from "@/lib/toast";

/**
 * Wishlist lưu trên trình duyệt (chưa có tài khoản khách): danh sách slug, mới nhất trước.
 * Khi có chức năng user có thể đồng bộ danh sách này lên server.
 */
const STORAGE_KEY = "eql-wishlist";
const MAX_ITEMS = 100;

function readSlugs(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function writeSlugs(slugs: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Trình duyệt chặn storage: wishlist chỉ sống trong phiên hiện tại.
  }
}

interface WishlistContextValue {
  slugs: string[];
  /** Đã đọc xong localStorage (tránh nháy trạng thái tim / số đếm). */
  ready: boolean;
  has: (slug: string) => boolean;
  toggle: (slug: string, name?: string) => void;
  remove: (slugs: string[]) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSlugs(readSlugs());
    setReady(true);
    // Đồng bộ khi tab khác thay đổi wishlist.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSlugs(readSlugs());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: string[]) => {
    writeSlugs(next);
    setSlugs(next);
  }, []);

  const set = useMemo(() => new Set(slugs), [slugs]);
  const has = useCallback((slug: string) => set.has(slug), [set]);

  const toggle = useCallback(
    (slug: string, name?: string) => {
      const current = readSlugs();
      if (current.includes(slug)) {
        commit(current.filter((s) => s !== slug));
        toast.success(name ? `Đã bỏ "${name}" khỏi yêu thích` : "Đã bỏ khỏi yêu thích");
      } else {
        commit([slug, ...current].slice(0, MAX_ITEMS));
        toast.info(
          `${name ? `Đã thêm "${name}"` : "Đã thêm"} vào yêu thích — xem danh sách`,
          "/wishlist",
        );
      }
    },
    [commit],
  );

  const remove = useCallback(
    (toRemove: string[]) => {
      const drop = new Set(toRemove);
      commit(readSlugs().filter((s) => !drop.has(s)));
    },
    [commit],
  );

  const value = useMemo(
    () => ({ slugs, ready, has, toggle, remove }),
    [slugs, ready, has, toggle, remove],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
