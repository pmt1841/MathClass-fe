import { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Quên mật khẩu - MathClass",
  description: "Khôi phục mật khẩu tài khoản MathClass",
}

export default function ForgotPasswordPage() {
  return (
    <div className="relative w-full max-w-md z-10">
      <ForgotPasswordForm />
    </div>
  )
}
