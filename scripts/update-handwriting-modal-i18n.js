const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '../components/assignments/HandwritingSketchModal.tsx')
let c = fs.readFileSync(file, 'utf8')

if (!c.includes('useI18n')) {
  c = c.replace("import { useToast } from '@/components/ui/use-toast'", "import { useToast } from '@/components/ui/use-toast'\nimport { useI18n } from '@/lib/i18n/i18n-context'")
}

if (!c.includes('const { t } = useI18n()')) {
  c = c.replace('const { toast } = useToast()', 'const { toast } = useToast()\n  const { t } = useI18n()')
}

// Toasts
c = c.replace("title: 'Chưa có nội dung'", "title: t('Chưa có nội dung')")
c = c.replace("description: 'Vui lòng vẽ chữ viết tay hoặc tải ảnh chữ viết tay lên trước khi bấm nhận diện.'", "description: t('Vui lòng vẽ chữ viết tay hoặc tải ảnh chữ viết tay lên trước khi bấm nhận diện.')")
c = c.replace("title: 'Không tìm thấy chữ viết'", "title: t('Không tìm thấy chữ viết')")
c = c.replace("description: 'Không nhận diện thấy chữ viết tay hoặc công thức toán trong ảnh. Vui lòng kiểm tra lại nét vẽ hoặc ảnh tải lên.'", "description: t('Không nhận diện thấy chữ viết tay hoặc công thức toán trong ảnh. Vui lòng kiểm tra lại nét vẽ hoặc ảnh tải lên.')")
c = c.replace("title: 'Nhận diện thành công'", "title: t('Nhận diện thành công')")
c = c.replace("description: 'Đã chuyển chữ viết tay sang mã LaTeX.'", "description: t('Đã chuyển chữ viết tay sang mã LaTeX.')")
c = c.replace("title: 'Lỗi nhận diện'", "title: t('Lỗi nhận diện')")
c = c.replace("description: err.response?.data?.message || 'Không thể nhận diện chữ viết tay. Vui lòng thử lại.'", "description: err.response?.data?.message || t('Không thể nhận diện chữ viết tay. Vui lòng thử lại.')")
c = c.replace("description: 'Vui lòng phác thảo hình vẽ hoặc tải ảnh phác thảo lên trước khi bấm nắn chỉnh.'", "description: t('Vui lòng phác thảo hình vẽ hoặc tải ảnh phác thảo lên trước khi bấm nắn chỉnh.')")
c = c.replace("title: 'Không tìm thấy hình phác thảo'", "title: t('Không tìm thấy hình phác thảo')")
c = c.replace("description: 'Không nhận diện thấy nét vẽ hình học trong ảnh. Vui lòng phác thảo lại hình vẽ rõ ràng hơn.'", "description: t('Không nhận diện thấy nét vẽ hình học trong ảnh. Vui lòng phác thảo lại hình vẽ rõ ràng hơn.')")
c = c.replace("description: 'Ảnh không chứa đối tượng hình học hợp lệ. Vui lòng thử vẽ lại.'", "description: t('Ảnh không chứa đối tượng hình học hợp lệ. Vui lòng thử vẽ lại.')")
c = c.replace("title: 'Nắn chỉnh thành công'", "title: t('Nắn chỉnh thành công')")
c = c.replace("description: `Đã nắn chỉnh hình phác thảo (${res.shapeType}).`", "description: `${t('Đã nắn chỉnh hình phác thảo')} (${res.shapeType}).`")
c = c.replace("title: 'Lỗi nắn chỉnh'", "title: t('Lỗi nắn chỉnh')")
c = c.replace("description: err.response?.data?.message || 'Không thể nắn chỉnh hình phác thảo. Vui lòng thử lại.'", "description: err.response?.data?.message || t('Không thể nắn chỉnh hình phác thảo. Vui lòng thử lại.')")

// Dialog Header
c = c.replace('Trợ lý AI: Số hóa chữ viết & Phác thảo hình học', '{t("Trợ lý AI: Số hóa chữ viết & Phác thảo hình học")}')
c = c.replace('Vẽ tự do hoặc tải ảnh lên để AI tự động trích xuất công thức toán hoặc nắn chỉnh hình phác thảo.', '{t("Vẽ tự do hoặc tải ảnh lên để AI tự động trích xuất công thức toán hoặc nắn chỉnh hình phác thảo.")}')

// Tab Labels
c = c.replace('✍️ Chữ viết tay ➔ LaTeX', '✍️ {t("Chữ viết tay ➔ LaTeX")}')
c = c.replace('📐 Phác thảo nét ➔ Canvas chuẩn', '📐 {t("Phác thảo nét ➔ Canvas chuẩn")}')

// Content
c = c.replace('Vẽ công thức lên khung bên dưới hoặc tải ảnh lên:', '{t("Vẽ công thức lên khung bên dưới hoặc tải ảnh lên:")}')
c = c.replace('<Upload className="w-3.5 h-3.5 mr-1" /> Tải ảnh', '<Upload className="w-3.5 h-3.5 mr-1" /> {t("Tải ảnh")}')
c = c.replace('<Eraser className="w-3.5 h-3.5 mr-1" /> Xóa khung', '<Eraser className="w-3.5 h-3.5 mr-1" /> {t("Xóa khung")}')
c = c.replace("{isProcessing ? 'Đang trích xuất văn bản...' : 'Trích xuất văn bản (AI)'}", "{isProcessing ? t('Đang trích xuất văn bản...') : t('Trích xuất văn bản (AI)')}")
c = c.replace('Xem trước kết quả nhận diện:', '{t("Xem trước kết quả nhận diện:")}')
c = c.replace('>Hủy</Button>', '>{t("Hủy")}</Button>')
c = c.replace('<Check className="w-4 h-4 mr-1" /> Chèn văn bản vào bài', '<Check className="w-4 h-4 mr-1" /> {t("Chèn văn bản vào bài")}')

c = c.replace('Vẽ phác thảo hình học tay (tam giác, đường tròn, tứ giác...):', '{t("Vẽ phác thảo hình học tay (tam giác, đường tròn, tứ giác...):")}')
c = c.replace("{isProcessing ? 'Đang chuẩn hóa phác thảo...' : 'Chuẩn hóa hình phác thảo (AI)'}", "{isProcessing ? t('Đang chuẩn hóa phác thảo...') : t('Chuẩn hóa hình phác thảo (AI)')}")
c = c.replace('Kết quả nhận diện: {geometryResult.shapeType}', '{t("Kết quả nhận diện:")} {geometryResult.shapeType}')
c = c.replace('<Check className="w-4 h-4 mr-1" /> Chèn hình chuẩn vào bài làm', '<Check className="w-4 h-4 mr-1" /> {t("Chèn hình chuẩn vào bài làm")}')

fs.writeFileSync(file, c, 'utf8')
console.log('Updated HandwritingSketchModal i18n')
