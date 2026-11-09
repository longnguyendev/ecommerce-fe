import { gql } from "./client";

export const NOTIFICATION_PAGE_SIZE = 20;

export interface AdminNotification {
  id: string;
  type: "ORDER_CREATED";
  title: string;
  body: string;
  link: string | null;
  orderId: string | null;
  createdAt: string;
  read: boolean;
}

export const NOTIFICATION_FIELDS = "id type title body link orderId createdAt read";

export async function listNotifications(
  skip: number,
): Promise<{ nodes: AdminNotification[]; hasNextPage: boolean; unread: number }> {
  const data = await gql<{
    adminNotifications: { nodes: AdminNotification[]; hasNextPage: boolean };
    adminNotificationUnreadCount: number;
  }>(
    `query Notifications($pagination: PaginationArgs) {
      adminNotifications(pagination: $pagination) { hasNextPage nodes { ${NOTIFICATION_FIELDS} } }
      adminNotificationUnreadCount
    }`,
    { pagination: { take: NOTIFICATION_PAGE_SIZE, skip } },
  );
  return { ...data.adminNotifications, unread: data.adminNotificationUnreadCount };
}

export async function fetchUnreadCount(): Promise<number> {
  const data = await gql<{ adminNotificationUnreadCount: number }>(
    `{ adminNotificationUnreadCount }`,
  );
  return data.adminNotificationUnreadCount;
}

/** Trả về số còn chưa đọc (đúng theo server). */
export async function markNotificationsRead(input: {
  ids?: string[];
  orderId?: string;
  all?: boolean;
}): Promise<number> {
  const data = await gql<{ markAdminNotificationsRead: number }>(
    `mutation MarkRead($input: MarkAdminNotificationsReadInput!) {
      markAdminNotificationsRead(input: $input)
    }`,
    { input },
  );
  return data.markAdminNotificationsRead;
}

/** "vừa xong", "5 phút trước", "3 giờ trước", "2 ngày trước", rồi ngày cụ thể. */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "vừa xong";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}
