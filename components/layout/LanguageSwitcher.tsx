'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { toast } from 'sonner'
import { profileService } from '@/services/profileService'
import { authStorage } from '@/lib/auth-storage'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/i18n-context'
import { setLocaleCookie } from '@/lib/constants/i18n'

const LANGUAGES = [
  { code: 'vi', label: 'VI', name: 'Tiếng Việt' },
  { code: 'en', label: 'EN', name: 'English' },
] as const

export function LanguageSwitcher() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { locale: currentLocale, setLocale } = useI18n()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === currentLocale || isLoading || isPending) return

    const previousLocale = currentLocale
    setLocale(newLocale)
    setIsLoading(true)

    const isAuthenticated = authStorage.isValidSession()

    try {
      if (isAuthenticated) {
        await profileService.updateLanguage(newLocale)
      }

      // Ghi cookie NEXT_LOCALE chuẩn hóa
      setLocaleCookie(newLocale)

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error('Failed to update user language preference', error)
      setLocale(previousLocale)
      toast.error(
        previousLocale === 'vi'
          ? 'Không thể cập nhật ngôn ngữ. Vui lòng thử lại.'
          : 'Failed to update language preference. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const selectedLanguage =
    LANGUAGES.find((l) => l.code === currentLocale) || LANGUAGES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading || isPending}
          className="flex items-center gap-1.5 text-xs font-semibold hover:bg-primary-foreground/10 text-primary-foreground transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg border border-primary-foreground/20"
        >
          <Globe className="h-4 w-4 text-primary-foreground/80" />
          <span className="uppercase tracking-wider font-bold">{selectedLanguage.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`cursor-pointer text-xs ${
              currentLocale === lang.code ? 'font-semibold bg-accent text-primary' : ''
            }`}
          >
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
