'use client'

import { Calculator } from 'lucide-react'

export function Footer() {
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
              Trao quyền cho học sinh thông qua học toán thông minh
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Twitter</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Facebook</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">LinkedIn</a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Sản phẩm</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Tính năng</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Giá cả</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Bảo mật</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Lộ trình phát triển</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Công ty</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Giới thiệu</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Tuyển dụng</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Liên hệ</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Pháp lý</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Điều khoản sử dụng</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookie</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Tuân thủ</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <p className="text-muted-foreground text-sm">
            © 2026 Math Class. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Trạng thái</a>
            <a href="#" className="hover:text-primary transition-colors">Cập nhật</a>
            <a href="#" className="hover:text-primary transition-colors">Hỗ trợ</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

