'use client'

import React from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-context'

export interface PasswordRequirement {
  id: string
  label: string
  valid: boolean
}

export interface PasswordStrengthResult {
  score: number // 0 to 4
  level: 'yếu' | 'trung bình' | 'khá' | 'mạnh'
  color: string
  bgScoreColor: string
  requirements: PasswordRequirement[]
  isValid: boolean
}

export const PASSWORD_CRITERIA_MESSAGE =
  'Mật khẩu phải có tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (!@#$%^&*...).'

export function evaluatePassword(password: string): PasswordStrengthResult {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  const requirements: PasswordRequirement[] = [
    { id: 'length', label: 'Tối thiểu 8 ký tự', valid: hasMinLength },
    { id: 'uppercase', label: 'Có chữ cái in hoa (A-Z)', valid: hasUppercase },
    { id: 'lowercase', label: 'Có chữ cái thường (a-z)', valid: hasLowercase },
    { id: 'digit', label: 'Có chữ số (0-9)', valid: hasDigit },
    { id: 'special', label: 'Có ký tự đặc biệt (!@#$%^&*)', valid: hasSpecial },
  ]

  let score = 0
  if (hasMinLength) score += 1
  if (hasUppercase && hasLowercase) score += 1
  if (hasDigit) score += 1
  if (hasSpecial) score += 1

  let level: 'yếu' | 'trung bình' | 'khá' | 'mạnh' = 'yếu'
  let color = 'text-red-500'
  let bgScoreColor = 'bg-red-500'

  if (!password) {
    score = 0
    level = 'yếu'
    color = 'text-slate-400'
    bgScoreColor = 'bg-slate-200'
  } else if (score <= 1) {
    level = 'yếu'
    color = 'text-red-500'
    bgScoreColor = 'bg-red-500'
  } else if (score === 2) {
    level = 'trung bình'
    color = 'text-amber-500'
    bgScoreColor = 'bg-amber-500'
  } else if (score === 3) {
    level = 'khá'
    color = 'text-blue-500'
    bgScoreColor = 'bg-blue-500'
  } else {
    level = 'mạnh'
    color = 'text-emerald-600'
    bgScoreColor = 'bg-emerald-500'
  }

  const isValid =
    hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial

  return {
    score,
    level,
    color,
    bgScoreColor,
    requirements,
    isValid,
  }
}

interface PasswordStrengthMeterProps {
  password: string
  showCriteriaList?: boolean
  className?: string
}

export function PasswordStrengthMeter({
  password,
  showCriteriaList = true,
  className,
}: PasswordStrengthMeterProps) {
  const { t } = useI18n()
  if (!password) return null

  const { score, level, color, bgScoreColor, requirements } = evaluatePassword(password)

  return (
    <div className={cn('space-y-2 mt-2', className)}>
      {/* Thanh tiến trình phân bậc */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              step <= score ? bgScoreColor : 'bg-slate-200'
            )}
          />
        ))}
        <span className={cn('text-xs font-semibold capitalize ml-1 min-w-[70px] text-right', color)}>
          {t(level)}
        </span>
      </div>

      {/* Danh sách tiêu chí trực quan */}
      {showCriteriaList && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
          {requirements.map((req) => (
            <div
              key={req.id}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors',
                req.valid ? 'text-emerald-600 font-medium' : 'text-slate-400'
              )}
            >
              {req.valid ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span>{t(req.label)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
