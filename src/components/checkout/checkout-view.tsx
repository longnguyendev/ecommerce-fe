"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CartTotals, CouponBox } from "@/components/cart/cart-parts";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/catalog";
import { isLocalImage, resolveImageUrl } from "@/lib/image-url";
import { fetchProvinces, fetchWards, type AdminUnit } from "@/lib/storefront/address";
import {
  ApiError,
  checkout,
  errorMessage,
  LAST_ORDER_KEY,
  type CheckoutForm,
} from "@/lib/storefront/cart";

import { AdminUnitCombobox } from "./admin-unit-combobox";

const FORM_KEY = "eql-checkout-form";
const CHECKOUT_FORM_ID = "checkout-form";

const VN_PHONE = /^(?:\+?84|0)(?:[\s.-]?\d){9,10}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type TextFieldName = "shippingName" | "phone" | "contactEmail" | "shippingAddress" | "note";
/** Tên field cũng là id của ô nhập (dùng để focus ô lỗi đầu tiên). */
type Field = TextFieldName | "province" | "ward";

interface FormState extends Record<TextFieldName, string> {
  province: AdminUnit | null;
  ward: AdminUnit | null;
}

const EMPTY: FormState = {
  shippingName: "",
  phone: "",
  contactEmail: "",
  shippingAddress: "",
  note: "",
  province: null,
  ward: null,
};

const TEXT_FIELDS: TextFieldName[] = [
  "shippingName",
  "phone",
  "contactEmail",
  "shippingAddress",
  "note",
];

/** Khôi phục form đã lưu; chỉ nhận đúng kiểu (bản lưu cũ có thể là địa chỉ gõ tay). */
function restoreForm(raw: string): FormState {
  const saved = JSON.parse(raw) as Record<string, unknown>;
  const form: FormState = { ...EMPTY };
  for (const key of TEXT_FIELDS) {
    if (key !== "note" && typeof saved[key] === "string") form[key] = saved[key];
  }
  const unit = (v: unknown): AdminUnit | null =>
    v && typeof v === "object" && typeof (v as AdminUnit).code === "string"
      ? (v as AdminUnit)
      : null;
  form.province = unit(saved.province);
  form.ward = form.province ? unit(saved.ward) : null;
  return form;
}

/** Field BE -> field của form. */
const SERVER_FIELD: Record<string, Field> = {
  contactPhone: "phone",
  shippingPhone: "phone",
  contactEmail: "contactEmail",
  shippingName: "shippingName",
  shippingAddress: "shippingAddress",
  shippingProvinceCode: "province",
  shippingWardCode: "ward",
  note: "note",
};

const FIELD_ERROR: Partial<Record<Field, string>> = {
  shippingName: "Vui lòng nhập họ tên (tối thiểu 2 ký tự).",
  phone: "Số điện thoại không hợp lệ (vd: 0901 234 567).",
  contactEmail: "Email không hợp lệ.",
  shippingAddress: "Vui lòng nhập số nhà, tên đường.",
  province: "Vui lòng chọn tỉnh / thành phố.",
  ward: "Vui lòng chọn phường / xã.",
};

function validate(form: FormState): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (form.shippingName.trim().length < 2) errors.shippingName = FIELD_ERROR.shippingName;
  if (!VN_PHONE.test(form.phone.trim())) errors.phone = FIELD_ERROR.phone;
  if (form.contactEmail.trim() && !EMAIL.test(form.contactEmail.trim()))
    errors.contactEmail = FIELD_ERROR.contactEmail;
  if (!form.province) errors.province = FIELD_ERROR.province;
  if (!form.ward) errors.ward = FIELD_ERROR.ward;
  if (form.shippingAddress.trim().length < 3) errors.shippingAddress = FIELD_ERROR.shippingAddress;
  return errors;
}

function toPayload(form: FormState & { province: AdminUnit; ward: AdminUnit }): CheckoutForm {
  const phone = form.phone.trim();
  return {
    contactPhone: phone,
    shippingPhone: phone,
    contactEmail: form.contactEmail.trim() || undefined,
    shippingName: form.shippingName.trim(),
    shippingAddress: form.shippingAddress.trim(),
    shippingProvinceCode: form.province.code,
    shippingWardCode: form.ward.code,
    note: form.note.trim() || undefined,
  };
}

function TextField({
  id,
  label,
  value,
  error,
  onChange,
  optional,
  ...rest
}: {
  id: TextFieldName;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  optional?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id">) {
  return (
    <div>
      <label htmlFor={id} className="text-[11.5px] text-muted-foreground">
        {label}
        {optional ? " (không bắt buộc)" : ""}
      </label>
      <input
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-1 h-11 w-full border border-border bg-transparent px-3 text-[13px] outline-none focus:border-foreground aria-invalid:border-destructive"
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[11.5px] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CheckoutView() {
  const router = useRouter();
  const { cart, ready, refresh, reset } = useCart();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [provinces, setProvinces] = useState<AdminUnit[]>([]);
  const [wards, setWards] = useState<AdminUnit[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [unitsError, setUnitsError] = useState<string | null>(null);

  // Nhớ thông tin giao hàng lần trước trên trình duyệt này.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FORM_KEY);
      if (saved) setForm(restoreForm(saved));
    } catch {
      // bỏ qua
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchProvinces()
      .then((list) => {
        if (cancelled) return;
        setProvinces(list);
        // Tỉnh đã lưu phải còn trong danh mục hiện tại.
        setForm((f) =>
          f.province && !list.some((p) => p.code === f.province!.code)
            ? { ...f, province: null, ward: null }
            : f,
        );
      })
      .catch(() => {
        if (!cancelled)
          setUnitsError("Không tải được danh sách tỉnh / thành. Vui lòng tải lại trang.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const provinceCode = form.province?.code;
  useEffect(() => {
    if (!provinceCode) {
      setWards([]);
      return;
    }
    let cancelled = false;
    setLoadingWards(true);
    fetchWards(provinceCode)
      .then((list) => {
        if (cancelled) return;
        setWards(list);
        setForm((f) =>
          f.ward && !list.some((w) => w.code === f.ward!.code) ? { ...f, ward: null } : f,
        );
      })
      .catch(() => {
        if (!cancelled) setUnitsError("Không tải được danh sách phường / xã. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!cancelled) setLoadingWards(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provinceCode]);

  const clearError = (field: Field) => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const set = (field: TextFieldName) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    clearError(field);
  };

  if (!ready || done) {
    return <div className="container-page min-h-[60vh] py-16" aria-busy="true" />;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-[22px] font-medium">Giỏ hàng trống</h1>
        <Link
          href="/products"
          className="mt-6 flex h-11 items-center bg-foreground px-8 text-[11.5px] uppercase tracking-[0.15em] text-background"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0 || !form.province || !form.ward) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    if (!cart.canCheckout) {
      setSubmitError("Giỏ hàng có sản phẩm cần xử lý. Vui lòng quay lại giỏ hàng.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await checkout(
        cart.token,
        toPayload({ ...form, province: form.province, ward: form.ward }),
      );
      try {
        window.localStorage.setItem(FORM_KEY, JSON.stringify({ ...form, note: "" }));
        window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
      } catch {
        // bỏ qua
      }
      setDone(true);
      reset();
      router.replace(`/order/${order.orderCode}`);
    } catch (error) {
      setSubmitting(false);
      if (error instanceof ApiError && error.code === "BAD_USER_INPUT" && error.fields.length) {
        const mapped: Partial<Record<Field, string>> = {};
        for (const f of error.fields) {
          const field = SERVER_FIELD[f];
          if (field) mapped[field] = FIELD_ERROR[field] ?? "Giá trị không hợp lệ.";
        }
        setErrors(mapped);
        return;
      }
      // Hết hàng / giá / coupon đổi: tải lại giỏ để hiện trạng thái mới.
      await refresh();
      setSubmitError(errorMessage(error, formatPrice));
    }
  };

  return (
    <div className="container-page py-10 lg:py-14">
      <h1 className="text-[clamp(22px,2.4vw,30px)] font-medium tracking-[-0.02em]">Thanh toán</h1>

      {/* Form chỉ bọc cột trái: CouponBox ở cột phải có <form> riêng, form lồng form
          là HTML không hợp lệ (gây hydration error + Enter ở ô mã submit nhầm đơn). */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
        <form
          id={CHECKOUT_FORM_ID}
          noValidate
          onSubmit={(e) => void submit(e)}
          className="space-y-10"
        >
          <fieldset className="space-y-4">
            <legend className="mb-4 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Thông tin liên hệ
            </legend>
            <TextField
              id="shippingName"
              label="Họ và tên"
              autoComplete="name"
              value={form.shippingName}
              error={errors.shippingName}
              onChange={set("shippingName")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="phone"
                label="Số điện thoại"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                error={errors.phone}
                onChange={set("phone")}
              />
              <TextField
                id="contactEmail"
                label="Email"
                type="email"
                autoComplete="email"
                optional
                value={form.contactEmail}
                error={errors.contactEmail}
                onChange={set("contactEmail")}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-4 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Địa chỉ giao hàng
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminUnitCombobox
                id="province"
                label="Tỉnh / Thành phố"
                placeholder="Chọn tỉnh / thành phố"
                items={provinces}
                value={form.province}
                loading={provinces.length === 0 && !unitsError}
                error={errors.province}
                onChange={(province) => {
                  setForm((f) =>
                    f.province?.code === province?.code ? f : { ...f, province, ward: null },
                  );
                  clearError("province");
                }}
              />
              <AdminUnitCombobox
                id="ward"
                label="Phường / Xã"
                placeholder={form.province ? "Chọn phường / xã" : "Chọn tỉnh / thành trước"}
                items={wards}
                value={form.ward}
                disabled={!form.province}
                loading={loadingWards}
                error={errors.ward}
                onChange={(ward) => {
                  setForm((f) => ({ ...f, ward }));
                  clearError("ward");
                }}
              />
            </div>
            {unitsError ? (
              <p role="alert" className="text-[11.5px] text-destructive">
                {unitsError}
              </p>
            ) : null}
            <TextField
              id="shippingAddress"
              label="Số nhà, tên đường"
              autoComplete="street-address"
              value={form.shippingAddress}
              error={errors.shippingAddress}
              onChange={set("shippingAddress")}
            />
            <div>
              <label htmlFor="note" className="text-[11.5px] text-muted-foreground">
                Ghi chú (không bắt buộc)
              </label>
              <textarea
                id="note"
                value={form.note}
                onChange={(e) => set("note")(e.target.value)}
                rows={3}
                maxLength={1000}
                className="mt-1 w-full border border-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-foreground"
              />
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-4 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Phương thức thanh toán
            </legend>
            <label className="flex items-start gap-3 border border-foreground px-4 py-3.5">
              <input
                type="radio"
                name="payment"
                defaultChecked
                className="mt-0.5 accent-foreground"
              />
              <span>
                <span className="block text-[13px]">Thanh toán khi nhận hàng (COD)</span>
                <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                  Shop sẽ gọi xác nhận đơn trước khi giao.
                </span>
              </span>
            </label>
          </fieldset>
        </form>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Đơn hàng ({cart.itemCount})
          </p>
          <ul className="max-h-80 space-y-3 overflow-y-auto">
            {cart.items.map((line) => {
              const src = resolveImageUrl(line.image);
              return (
                <li key={line.variantId} className="flex gap-3">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-muted">
                    {src ? (
                      <Image
                        src={src}
                        alt={line.productName}
                        fill
                        sizes="64px"
                        unoptimized={isLocalImage(src)}
                        className="object-cover"
                      />
                    ) : null}
                    <span className="absolute right-0 top-0 bg-foreground px-1.5 text-[10px] text-background tabular-nums">
                      {line.quantity}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between gap-2">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[12.5px]">{line.productName}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {[line.color, line.size].filter(Boolean).join(" / ")}
                      </p>
                      {line.issue ? (
                        <p className="mt-0.5 text-[11px] text-destructive">Cần xử lý trong giỏ</p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-[12.5px] tabular-nums">
                      {formatPrice(line.lineTotal)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <CouponBox cart={cart} />
          <CartTotals cart={cart} />
          {submitError ? (
            <p role="alert" className="text-[12px] text-destructive">
              {submitError}{" "}
              {!cart.canCheckout ? (
                <Link href="/cart" className="underline underline-offset-4">
                  Về giỏ hàng
                </Link>
              ) : null}
            </p>
          ) : null}
          <button
            type="submit"
            form={CHECKOUT_FORM_ID}
            disabled={submitting}
            aria-busy={submitting}
            className="h-12 w-full bg-foreground text-[11.5px] uppercase tracking-[0.15em] text-background hover:opacity-85 disabled:opacity-50"
          >
            {submitting ? "Đang đặt hàng…" : `Đặt hàng · ${formatPrice(cart.total)}`}
          </button>
          <Link
            href="/cart"
            className="block text-center text-[12px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Quay lại giỏ hàng
          </Link>
        </aside>
      </div>
    </div>
  );
}
