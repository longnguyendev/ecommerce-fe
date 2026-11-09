"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Thẻ hiện lên từ dưới (y 24 → 0, opacity 0 → 1) ngay khi vừa lọt vào khung nhìn (kể cả lúc vào trang, không cần cuộn).
 * `index` quyết định độ trễ: lần lượt từ trái sang phải theo cột (`cols` cột
 * mỗi hàng), nên mỗi hàng mới lại bắt đầu từ thẻ bên trái.
 */
export function Reveal({
  index = 0,
  cols = 4,
  step = 0.08,
  className,
  children,
}: {
  index?: number;
  cols?: number;
  step?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      data-reveal
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.01 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: (index % cols) * step }}
    >
      {children}
    </motion.div>
  );
}
