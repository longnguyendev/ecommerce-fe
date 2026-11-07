"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Miễn phí vận chuyển đơn hàng trên 999.000 ₫",
  "Đổi size dễ dàng trong 7 ngày",
  "Thanh toán khi nhận hàng (COD) toàn quốc",
  "Tham gia EQL Rewards — 7 hạng thành viên, đặc quyền riêng",
];

export function Announcement() {
  const [i, setI] = useState(0);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (closed) return;
    const t = setInterval(() => setI((v) => (v + 1) % MESSAGES.length), 4200);
    return () => clearInterval(t);
  }, [closed]);

  if (closed) return null;

  return (
    <div className="bg-foreground text-background">
      <div className="container-page relative flex h-9 items-center justify-center">
        <p
          key={i}
          className="animate-[fade_.4s_ease] whitespace-nowrap text-[10px] uppercase tracking-[0.16em]"
        >
          {MESSAGES[i]}
        </p>
        <button
          type="button"
          onClick={() => setClosed(true)}
          aria-label="Đóng thông báo"
          className="absolute right-4 text-background/70 transition-colors hover:text-background"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
