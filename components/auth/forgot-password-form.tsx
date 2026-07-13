"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState } from "react"
import Link from "next/link"
import { Mail, ChevronLeft } from "lucide-react"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useForgotPassword } from "@/hooks/useForgotPassword"

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const { toast } = useToast()
  const { mutateAsync: forgotPassword, isPending } = useForgotPassword()
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: ForgotPasswordValues) {
    try {
      const response = await forgotPassword(data.email)
      setIsSuccess(true)
      toast({
        title: "Đã gửi yêu cầu",
        description: response.message,
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại sau.",
      })
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="rounded-full bg-green-100/80 p-4 text-green-600 ring-8 ring-green-50">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight">Kiểm tra email</h3>
            <p className="text-base text-muted-foreground">
              Chúng tôi đã gửi một liên kết đặt lại mật khẩu đến email của bạn.
              Vui lòng kiểm tra hộp thư đến (hoặc hộp thư rác).
            </p>
          </div>
          <Link
            href="/login"
            className="flex items-center justify-center w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-100 mt-4"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Quên mật khẩu
          </h1>
          <p className="text-muted-foreground text-base">
            Nhập email của bạn để nhận liên kết đặt lại
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="you@example.com"
                        className="pl-10 py-5"
                        {...field}
                      />
                    </div>
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
                  Đang gửi yêu cầu...
                </div>
              ) : (
                'Gửi liên kết đặt lại mật khẩu'
              )}
            </button>
          </form>
        </Form>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
