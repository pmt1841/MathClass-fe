'use client'

import { Calculator } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Calculator className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Math Class</span>
            </div>
            <p className="text-muted-foreground">
              {t('Trao quyền cho học sinh thông qua học toán thông minh')}
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Twitter</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Facebook</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">LinkedIn</a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('Sản phẩm')}</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">{t('Tính năng')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('Giá cả')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('Bảo mật')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('Lộ trình phát triển')}</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('Công ty')}</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">{t('Giới thiệu')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('Blog')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('Tuyển dụng')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('Liên hệ')}</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('Pháp lý')}</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">{t('Chính sách bảo mật')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('Điều khoản sử dụng')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('Cookie')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('Tuân thủ')}</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <p className="text-muted-foreground text-sm">
            {t('© 2026 Math Class. Tất cả quyền được bảo lưu.')}
          </p>
          <div className="flex gap-6 mt-4 md:mt-0 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">{t('Trạng thái')}</a>
            <a href="#" className="hover:text-primary transition-colors">{t('Cập nhật')}</a>
            <a href="#" className="hover:text-primary transition-colors">{t('Hỗ trợ')}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

