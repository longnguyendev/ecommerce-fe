/** API giỏ hàng / đặt hàng cho storefront (gọi từ client). */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

/** sessionStorage: đơn vừa đặt, để trang cảm ơn hiện ngay không cần tra cứu. */
export const LAST_ORDER_KEY = "eql-last-order";

export type CartLineIssue = "UNAVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";

export interface CartLine {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  color: string | null;
  size: string | null;
  image: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  maxQuantity: number;
  lineTotal: number;
  issue: CartLineIssue | null;
}

export interface Cart {
  token: string;
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  couponCode: string | null;
  couponError: string | null;
  discountAmount: number;
  shippingFee: number;
  total: number;
  freeShippingThreshold: number;
  canCheckout: boolean;
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "FAILED" | "REFUNDED";

export interface PublicOrder {
  id: string;
  orderCode: string;
  contactEmail: string | null;
  contactPhone: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingWard: string;
  shippingDistrict: string | null;
  shippingProvince: string;
  note: string | null;
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  couponCode: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "COD" | "BANK_TRANSFER" | "GATEWAY";
  createdAt: string;
  items: {
    id: string;
    productName: string;
    variantName: string | null;
    sku: string;
    image: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
}

export interface CheckoutForm {
  contactPhone: string;
  contactEmail?: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingProvinceCode: string;
  shippingWardCode: string;
  note?: string;
}

/** Lỗi GraphQL đã chuẩn hoá: i18nKey + params từ BE. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly i18nKey: string,
    readonly params: Record<string, unknown> = {},
  ) {
    super(i18nKey);
  }

  /** Lỗi theo field từ ValidationPipe: [{ field, rule }]. */
  get fields(): string[] {
    const fields = this.params.fields;
    return Array.isArray(fields)
      ? fields.map((f) => (f as { field?: string }).field ?? "").filter(Boolean)
      : [];
  }
}

interface GqlError {
  message: string;
  extensions?: { code?: string; i18nKey?: string; params?: Record<string, unknown> };
}

/** GraphQL client storefront (client-side), lỗi chuẩn hoá thành ApiError. */
export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("NETWORK", "errors.network");
  }
  const json = (await res.json()) as { data?: T; errors?: GqlError[] };
  const err = json.errors?.[0];
  if (err) {
    throw new ApiError(
      err.extensions?.code ?? "UNKNOWN",
      err.extensions?.i18nKey ?? err.message,
      err.extensions?.params,
    );
  }
  if (!json.data) throw new ApiError("UNKNOWN", "errors.unknown");
  return json.data;
}

const CART_FIELDS = `
  token itemCount subtotal couponCode couponError discountAmount shippingFee total
  freeShippingThreshold canCheckout
  items {
    variantId productId productName productSlug sku color size image
    unitPrice compareAtPrice quantity maxQuantity lineTotal issue
  }
`;

const ORDER_FIELDS = `
  id orderCode contactEmail contactPhone shippingName shippingPhone shippingAddress
  shippingWard shippingDistrict shippingProvince note totalAmount discountAmount
  shippingFee finalAmount couponCode status paymentStatus paymentMethod createdAt
  items { id productName variantName sku image quantity unitPrice lineTotal }
`;

export async function fetchCart(cartToken: string): Promise<Cart | null> {
  const data = await gql<{ cart: Cart | null }>(
    `query Cart($cartToken: String!) { cart(cartToken: $cartToken) { ${CART_FIELDS} } }`,
    { cartToken },
  );
  return data.cart;
}

export async function addCartItem(
  cartToken: string | null,
  variantId: string,
  quantity = 1,
): Promise<Cart> {
  const data = await gql<{ addCartItem: Cart }>(
    `mutation Add($input: AddCartItemInput!) { addCartItem(input: $input) { ${CART_FIELDS} } }`,
    { input: { cartToken: cartToken ?? undefined, variantId, quantity } },
  );
  return data.addCartItem;
}

export async function updateCartItem(
  cartToken: string,
  variantId: string,
  quantity: number,
): Promise<Cart> {
  const data = await gql<{ updateCartItem: Cart }>(
    `mutation Update($input: UpdateCartItemInput!) { updateCartItem(input: $input) { ${CART_FIELDS} } }`,
    { input: { cartToken, variantId, quantity } },
  );
  return data.updateCartItem;
}

export async function applyCartCoupon(cartToken: string, code: string): Promise<Cart> {
  const data = await gql<{ applyCartCoupon: Cart }>(
    `mutation Apply($input: ApplyCartCouponInput!) { applyCartCoupon(input: $input) { ${CART_FIELDS} } }`,
    { input: { cartToken, code } },
  );
  return data.applyCartCoupon;
}

export async function removeCartCoupon(cartToken: string): Promise<Cart> {
  const data = await gql<{ removeCartCoupon: Cart }>(
    `mutation Remove($cartToken: String!) { removeCartCoupon(cartToken: $cartToken) { ${CART_FIELDS} } }`,
    { cartToken },
  );
  return data.removeCartCoupon;
}

export async function checkout(cartToken: string, form: CheckoutForm): Promise<PublicOrder> {
  const data = await gql<{ checkout: PublicOrder }>(
    `mutation Checkout($input: CheckoutInput!) { checkout(input: $input) { ${ORDER_FIELDS} } }`,
    { input: { cartToken, ...form } },
  );
  return data.checkout;
}

export async function lookupOrder(orderCode: string, phone: string): Promise<PublicOrder> {
  const data = await gql<{ orderLookup: PublicOrder }>(
    `query Lookup($orderCode: String!, $phone: String!) {
      orderLookup(orderCode: $orderCode, phone: $phone) { ${ORDER_FIELDS} }
    }`,
    { orderCode, phone },
  );
  return data.orderLookup;
}

const MESSAGES: Record<string, string> = {
  "errors.network": "Không kết nối được máy chủ. Vui lòng thử lại.",
  "errors.business.cart.notFound": "Giỏ hàng đã hết hạn. Vui lòng thêm lại sản phẩm.",
  "errors.business.cart.maxQuantity": "Mỗi sản phẩm chỉ được đặt tối đa {max} chiếc.",
  "errors.business.cart.variantUnavailable": "Sản phẩm này hiện không còn bán.",
  "errors.business.cart.insufficientStock": "Chỉ còn {available} sản phẩm trong kho.",
  "errors.business.order.insufficientStock":
    "Một số sản phẩm vừa hết hàng. Vui lòng kiểm tra lại giỏ hàng.",
  "errors.business.order.variantNotFound":
    "Một số sản phẩm không còn bán. Vui lòng kiểm tra lại giỏ hàng.",
  "errors.business.order.emptyItems": "Giỏ hàng đang trống.",
  "errors.business.address.invalid": "Vui lòng chọn lại tỉnh / thành và phường / xã.",
  "errors.business.order.notFound": "Không tìm thấy đơn hàng với mã và số điện thoại này.",
  "errors.business.coupon.invalid": "Mã giảm giá không hợp lệ.",
  "errors.business.coupon.expired": "Mã giảm giá đã hết hạn.",
  "errors.business.coupon.usageLimitReached": "Mã giảm giá đã hết lượt sử dụng.",
  "errors.business.coupon.minOrderValue": "Đơn tối thiểu {minOrderValue} để dùng mã này.",
  "errors.system.badRequest": "Vui lòng kiểm tra lại thông tin.",
  "errors.system.tooManyRequests": "Bạn thao tác quá nhanh, vui lòng thử lại sau.",
};

/** Đổi i18nKey từ BE thành câu tiếng Việt cho khách. */
export function errorMessage(error: unknown, format?: (n: number) => string): string {
  const key = error instanceof ApiError ? error.i18nKey : "";
  const params = error instanceof ApiError ? error.params : {};
  const template = MESSAGES[key] ?? "Đã có lỗi xảy ra. Vui lòng thử lại.";
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    if (typeof value === "number" && format && name !== "available" && name !== "max") {
      return format(value);
    }
    return String(value ?? "");
  });
}

export function messageForKey(key: string, format?: (n: number) => string): string {
  return errorMessage(new ApiError("", key), format);
}
