import { gql } from "@/lib/admin/client";

export const INVENTORY_PAGE_SIZE = 20;

export type MovementType = "RECEIPT" | "ADJUSTMENT" | "ORDER" | "ORDER_CANCEL";
export type ReceiptStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export interface InventoryVariant {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string | null;
  sku: string;
  stockQuantity: number;
  costPrice: number;
  price: number;
  isActive: boolean;
}

export interface StockMovementRow {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  variantName: string | null;
  type: MovementType;
  quantity: number;
  balanceAfter: number;
  unitCost: number | null;
  reason: string | null;
  receiptId: string | null;
  orderId: string | null;
  createdAt: string;
}

export interface ReceiptItem {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitCost: number;
}

export interface Receipt {
  id: string;
  code: string;
  note: string | null;
  status: ReceiptStatus;
  confirmedAt: string | null;
  createdAt: string;
  items: ReceiptItem[];
  totalQuantity: number;
  totalCost: number;
  /** Do BE quyết định (tồn hiện tại >= số lượng phiếu). FE chỉ hiển thị. */
  canRevert: boolean;
  revertShortages: RevertShortage[];
}

export interface RevertShortage {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string | null;
  required: number;
  available: number;
}

export interface Page<T> {
  nodes: T[];
  totalCount: number;
}

export interface ReceiptItemInput {
  variantId: string;
  quantity: number;
  unitCost: number;
}

const VARIANT_FIELDS = `variantId productId productName variantName sku stockQuantity costPrice price isActive`;
const RECEIPT_FIELDS = `id code note status confirmedAt createdAt totalQuantity totalCost canRevert
  revertShortages { variantId sku productName variantName required available }
  items { id variantId sku productName variantName quantity unitCost }`;

const skip = (page: number) => page * INVENTORY_PAGE_SIZE;

export async function listInventory(opts: {
  search?: string;
  lowStockThreshold?: number;
  page: number;
  take?: number;
}): Promise<Page<InventoryVariant>> {
  const { inventoryVariants } = await gql<{ inventoryVariants: Page<InventoryVariant> }>(
    `query Inv($pagination: PaginationArgs, $filter: InventoryFilterInput) {
      inventoryVariants(pagination: $pagination, filter: $filter) { totalCount nodes { ${VARIANT_FIELDS} } }
    }`,
    {
      pagination: { take: opts.take ?? INVENTORY_PAGE_SIZE, skip: skip(opts.page) },
      filter: { search: opts.search || undefined, lowStockThreshold: opts.lowStockThreshold },
    },
  );
  return inventoryVariants;
}

export async function adjustStock(input: {
  variantId: string;
  newQuantity: number;
  reason: string;
}): Promise<InventoryVariant> {
  const { adjustStock } = await gql<{ adjustStock: InventoryVariant }>(
    `mutation Adjust($input: AdjustStockInput!) { adjustStock(input: $input) { ${VARIANT_FIELDS} } }`,
    { input },
  );
  return adjustStock;
}

export async function listMovements(opts: {
  type?: MovementType;
  page: number;
}): Promise<Page<StockMovementRow>> {
  const { stockMovements } = await gql<{ stockMovements: Page<StockMovementRow> }>(
    `query Mov($pagination: PaginationArgs, $filter: StockMovementFilterInput) {
      stockMovements(pagination: $pagination, filter: $filter) {
        totalCount
        nodes { id variantId sku productName variantName type quantity balanceAfter unitCost reason receiptId orderId createdAt }
      }
    }`,
    {
      pagination: { take: INVENTORY_PAGE_SIZE, skip: skip(opts.page) },
      filter: { type: opts.type },
    },
  );
  return stockMovements;
}

export async function listReceipts(opts: {
  status?: ReceiptStatus;
  page: number;
}): Promise<Page<Receipt>> {
  const { purchaseReceipts } = await gql<{ purchaseReceipts: Page<Receipt> }>(
    `query Receipts($pagination: PaginationArgs, $filter: PurchaseReceiptFilterInput) {
      purchaseReceipts(pagination: $pagination, filter: $filter) { totalCount nodes { ${RECEIPT_FIELDS} } }
    }`,
    {
      pagination: { take: INVENTORY_PAGE_SIZE, skip: skip(opts.page) },
      filter: { status: opts.status },
    },
  );
  return purchaseReceipts;
}

export async function createReceipt(input: {
  note?: string;
  items: ReceiptItemInput[];
}): Promise<Receipt> {
  const { createPurchaseReceipt } = await gql<{ createPurchaseReceipt: Receipt }>(
    `mutation Create($input: CreatePurchaseReceiptInput!) { createPurchaseReceipt(input: $input) { ${RECEIPT_FIELDS} } }`,
    { input },
  );
  return createPurchaseReceipt;
}

export async function updateReceipt(input: {
  id: string;
  note?: string;
  items: ReceiptItemInput[];
}): Promise<Receipt> {
  const { updatePurchaseReceipt } = await gql<{ updatePurchaseReceipt: Receipt }>(
    `mutation Update($input: UpdatePurchaseReceiptInput!) { updatePurchaseReceipt(input: $input) { ${RECEIPT_FIELDS} } }`,
    { input },
  );
  return updatePurchaseReceipt;
}

export async function confirmReceipt(id: string): Promise<Receipt> {
  const { confirmPurchaseReceipt } = await gql<{ confirmPurchaseReceipt: Receipt }>(
    `mutation Confirm($id: ID!) { confirmPurchaseReceipt(id: $id) { ${RECEIPT_FIELDS} } }`,
    { id },
  );
  return confirmPurchaseReceipt;
}

export async function revertReceipt(id: string): Promise<Receipt> {
  const { revertPurchaseReceipt } = await gql<{ revertPurchaseReceipt: Receipt }>(
    `mutation Revert($id: ID!) { revertPurchaseReceipt(id: $id) { ${RECEIPT_FIELDS} } }`,
    { id },
  );
  return revertPurchaseReceipt;
}

/** BE trả mã lỗi i18n; FE chỉ dịch ra câu hiển thị, không tự kiểm tra nghiệp vụ. */
const ERROR_TEXT: Record<string, string> = {
  "errors.business.inventory.revertInsufficientStock":
    "Không thể hoàn về nháp: tồn kho hiện tại nhỏ hơn số lượng của phiếu.",
  "errors.business.inventory.receiptNotConfirmed": "Phiếu chưa được nhập kho.",
  "errors.business.inventory.receiptNotDraft": "Phiếu không còn ở trạng thái nháp.",
  "errors.business.inventory.receiptNotFound": "Không tìm thấy phiếu nhập.",
  "errors.business.inventory.receiptEmpty": "Phiếu nhập chưa có dòng nào.",
  "errors.business.inventory.variantNotFound": "Có biến thể không còn tồn tại.",
  "errors.business.order.insufficientStock": "Tồn kho không đủ.",
};

export function inventoryErrorMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : "";
  return ERROR_TEXT[raw] ?? (raw || fallback);
}

export async function cancelReceipt(id: string): Promise<Receipt> {
  const { cancelPurchaseReceipt } = await gql<{ cancelPurchaseReceipt: Receipt }>(
    `mutation Cancel($id: ID!) { cancelPurchaseReceipt(id: $id) { ${RECEIPT_FIELDS} } }`,
    { id },
  );
  return cancelPurchaseReceipt;
}

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  RECEIPT: "Nhập hàng",
  ADJUSTMENT: "Điều chỉnh",
  ORDER: "Bán hàng",
  ORDER_CANCEL: "Huỷ đơn",
};

export const RECEIPT_STATUS_LABEL: Record<ReceiptStatus, string> = {
  DRAFT: "Nháp",
  CONFIRMED: "Đã nhập kho",
  CANCELLED: "Đã huỷ",
};

export function variantLabel(v: { productName: string; variantName: string | null }): string {
  return v.variantName ? `${v.productName} — ${v.variantName}` : v.productName;
}

export const formatMoney = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
