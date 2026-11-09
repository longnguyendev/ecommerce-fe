"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { formatPrice } from "@/lib/catalog";
import {
  addCartItem,
  ApiError,
  applyCartCoupon,
  errorMessage,
  fetchCart,
  removeCartCoupon,
  updateCartItem,
  type Cart,
} from "@/lib/storefront/cart";
import { toast } from "@/lib/toast";

const TOKEN_KEY = "eql-cart-token";

function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Trình duyệt chặn storage: giỏ vẫn chạy trong phiên hiện tại.
  }
}

interface CartContextValue {
  cart: Cart | null;
  /** Đã tải xong giỏ lần đầu (tránh nháy "giỏ trống"). */
  ready: boolean;
  /** variantId đang được cập nhật. */
  pending: ReadonlySet<string>;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  /** Trả về true nếu thêm thành công; lỗi được toast sẵn. */
  addItem: (variantId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  /** Trả về thông báo lỗi nếu mã không dùng được. */
  applyCoupon: (code: string) => Promise<string | null>;
  removeCoupon: () => Promise<void>;
  refresh: () => Promise<Cart | null>;
  /** Gọi sau khi checkout thành công: bỏ token để bắt đầu giỏ mới. */
  reset: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const tokenRef = useRef<string | null>(null);

  const accept = useCallback((next: Cart | null) => {
    tokenRef.current = next?.token ?? null;
    writeToken(tokenRef.current);
    setCart(next);
  }, []);

  /** Giỏ hết hạn / đã checkout ở tab khác -> bỏ token. */
  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.i18nKey === "errors.business.cart.notFound") {
        accept(null);
      }
      toast.error(errorMessage(error, formatPrice));
    },
    [accept],
  );

  const refresh = useCallback(async () => {
    const token = tokenRef.current ?? readToken();
    if (!token) {
      accept(null);
      return null;
    }
    try {
      const next = await fetchCart(token);
      accept(next);
      return next;
    } catch {
      // Lỗi mạng: giữ token, thử lại lần sau.
      tokenRef.current = token;
      return null;
    }
  }, [accept]);

  useEffect(() => {
    void refresh().finally(() => setReady(true));
    // Đồng bộ khi quay lại tab (tồn kho / giỏ có thể đã đổi).
    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [refresh]);

  const withPending = useCallback(async (variantId: string, run: () => Promise<void>) => {
    setPending((prev) => new Set(prev).add(variantId));
    try {
      await run();
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(variantId);
        return next;
      });
    }
  }, []);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      let ok = false;
      await withPending(variantId, async () => {
        try {
          accept(await addCartItem(tokenRef.current, variantId, quantity));
          ok = true;
        } catch (error) {
          handleError(error);
        }
      });
      return ok;
    },
    [accept, handleError, withPending],
  );

  const updateQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      const token = tokenRef.current;
      if (!token) return;
      const previous = cart;
      // Optimistic: đổi số lượng ngay, tổng tiền chờ server.
      setCart((c) =>
        c
          ? {
              ...c,
              items: c.items
                .map((l) =>
                  l.variantId === variantId
                    ? { ...l, quantity, lineTotal: l.unitPrice * quantity }
                    : l,
                )
                .filter((l) => l.quantity > 0),
            }
          : c,
      );
      await withPending(variantId, async () => {
        try {
          accept(await updateCartItem(token, variantId, quantity));
        } catch (error) {
          setCart(previous);
          handleError(error);
        }
      });
    },
    [accept, cart, handleError, withPending],
  );

  const removeItem = useCallback(
    (variantId: string) => updateQuantity(variantId, 0),
    [updateQuantity],
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      const token = tokenRef.current;
      if (!token) return "Giỏ hàng đang trống.";
      try {
        accept(await applyCartCoupon(token, code));
        return null;
      } catch (error) {
        if (error instanceof ApiError && error.i18nKey === "errors.business.cart.notFound") {
          accept(null);
        }
        return errorMessage(error, formatPrice);
      }
    },
    [accept],
  );

  const removeCoupon = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    try {
      accept(await removeCartCoupon(token));
    } catch (error) {
      handleError(error);
    }
  }, [accept, handleError]);

  const reset = useCallback(() => accept(null), [accept]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      ready,
      pending,
      drawerOpen,
      setDrawerOpen,
      addItem,
      updateQuantity,
      removeItem,
      applyCoupon,
      removeCoupon,
      refresh,
      reset,
    }),
    [
      cart,
      ready,
      pending,
      drawerOpen,
      addItem,
      updateQuantity,
      removeItem,
      applyCoupon,
      removeCoupon,
      refresh,
      reset,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
