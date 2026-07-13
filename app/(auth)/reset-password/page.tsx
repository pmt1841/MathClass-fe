import { Metadata } from "next"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu - MathClass",
  description: "Thiết lập mật khẩu mới cho tài khoản MathClass",
}

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ token?: string }>
}) {
  const searchParams = await props.searchParams
  const token = searchParams.token

  return (
    <div className="relative w-full max-w-md z-10">
      {!token ? (
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="rounded-full bg-red-100/80 p-4 text-red-600 ring-8 ring-red-50">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight">Link không hợp lệ</h3>
            <p className="text-base text-muted-foreground">
              Link đặt lại mật khẩu không hợp lệ hoặc hết hạn. Vui lòng kiểm tra lại email của bạn hoặc thử lại.
            </p>
          </div>
          <Link
            href="/login"
            className="flex items-center justify-center w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-100 mt-4"
          >
            Về trang chủ
          </Link>
        </div>
      ) : (
        <ResetPasswordForm token={token} />
      )}
    </div>
  )
}
