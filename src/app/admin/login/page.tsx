"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gql, setTokens, type AdminUser } from "@/lib/admin/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await gql<{
        signIn: {
          accessToken: string;
          refreshToken: string;
          user: AdminUser;
        };
      }>(
        `mutation SignIn($input: SignInInput!) {
          signIn(input: $input) {
            accessToken
            refreshToken
            user { id email displayName role }
          }
        }`,
        { input: { email, password } },
      );
      setTokens(data.signIn.accessToken, data.signIn.refreshToken);
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f4f4] px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-2xl font-medium tracking-[0.14em]">OXI</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Quản trị viên
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-none"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              Mật khẩu
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-none"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="text-[12px] text-destructive">{error}</p>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-none text-xs uppercase tracking-[0.15em]"
          >
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Mặc định: admin@example.com / ChangeMe123!
        </p>
      </div>
    </div>
  );
}
