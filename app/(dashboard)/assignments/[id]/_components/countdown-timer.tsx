'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { parseDateSafe } from '@/lib/utils'

interface CountdownTimerProps {
  deadline: string
  onExpire?: () => void
}

export function CountdownTimer({ deadline, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    isExpired: boolean
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  })

  useEffect(() => {
    const parsedDate = parseDateSafe(deadline)
    const targetDate = parsedDate ? parsedDate.getTime() : 0

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const difference = targetDate - now

      if (difference <= 0) {
        setTimeLeft(prev => {
          if (!prev.isExpired && onExpire) {
            // setTimeout to avoid updating state during render if parent triggers a state update
            setTimeout(onExpire, 0)
          }
          return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
        })
        return
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      })
    }

    calculateTimeLeft() // Initial calculation
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [deadline, onExpire])

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-sm font-semibold border border-rose-200">
        <Clock className="h-4 w-4" />
        <span>Đã hết hạn</span>
      </div>
    )
  }

  const totalHoursLeft = timeLeft.days * 24 + timeLeft.hours
  
  // Color logic
  let colorClass = "bg-slate-100 text-slate-700 border-slate-200"
  if (timeLeft.days === 0) {
    if (totalHoursLeft < 1) {
      if (timeLeft.minutes < 15) {
        colorClass = "bg-rose-100 text-rose-700 border-rose-200 animate-pulse" // < 15 mins
      } else {
        colorClass = "bg-orange-100 text-orange-700 border-orange-200" // < 1 hour
      }
    } else {
      colorClass = "bg-blue-100 text-blue-700 border-blue-200" // < 24 hours
    }
  }

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${colorClass} transition-colors`}>
      <Clock className="h-4 w-4" />
      <span className="tabular-nums">
        {timeLeft.days > 0 && `${timeLeft.days} ngày `}
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  )
}
