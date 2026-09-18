"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PasswordInput } from "@/components/ui/password-input"
import { PasswordStrengthMeter, PASSWORD_CRITERIA_MESSAGE } from "@/components/ui/password-strength-meter"
import { useToast } from "@/hooks/use-toast"
import { useResetPassword } from "@/hooks/useResetPassword"
import { AUTH_KEYS } from "@/lib/constants/auth"

const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." })
    .max(24, { message: "Mật khẩu không được vượt quá 24 ký tự." })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,24}$/,
      PASSWORD_CRITERIA_MESSAGE
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu không khớp.",
  path: ["confirmPassword"],
})

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { mutateAsync: resetPassword, isPending } = useResetPassword()

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(data: ResetPasswordValues) {
    try {
      const response = await resetPassword({
        token,
        newPassword: data.newPassword,
      })
      
      toast({
        title: "Thành công",
        description: response.message,
      })
      
      if (response.role) {
        sessionStorage.setItem(AUTH_KEYS.SELECTED_ROLE, response.role)
      }
      
      // Chuyển hướng về trang đăng nhập sau 2 giây
      setTimeout(() => {
        router.push("/login")
      }, 2000)
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.response?.data?.message || "Token không hợp lệ hoặc đã hết hạn.",
      })
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Đặt lại mật khẩu
          </h1>
          <p className="text-muted-foreground text-base">
            Vui lòng nhập mật khẩu mới của bạn
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu mới</FormLabel>
                  <FormControl>
                    <PasswordInput 
                      placeholder="••••••••" 
                      className="pl-3 py-5"
                      maxLength={256}
                      {...field} 
                    />
                  </FormControl>
                  <PasswordStrengthMeter password={field.value || ''} />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhập lại mật khẩu mới</FormLabel>
                  <FormControl>
                    <PasswordInput 
                      placeholder="••••••••" 
                      className="pl-3 py-5"
                      maxLength={256}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={isPending}
              className="
                w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg
                transition-all duration-200
                hover:shadow-lg hover:shadow-primary/25 hover:scale-105
                active:scale-100
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100
              "
            >
              {isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Đang xử lý...
                </div>
              ) : (
                'Lưu mật khẩu mới'
              )}
            </button>
          </form>
        </Form>
      </div>
    </div>
  )
}
