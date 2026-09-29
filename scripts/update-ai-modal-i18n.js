const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '../components/ai/AiQuestionGeneratorModal.tsx')
let c = fs.readFileSync(file, 'utf8')

if (!c.includes('useI18n')) {
  c = c.replace("import { toast } from 'sonner'", "import { toast } from 'sonner'\nimport { useI18n } from '@/lib/i18n/i18n-context'")
}

if (!c.includes('const { t } = useI18n()')) {
  c = c.replace('export function AiQuestionGeneratorModal({', 'export function AiQuestionGeneratorModal({\n  isOpen,\n  onClose,\n  onInsertQuestion\n}: AiQuestionGeneratorModalProps) {\n  const { t } = useI18n()')
  // Thay thế chữ ký hàm ban đầu
  c = c.replace('export function AiQuestionGeneratorModal({\n  isOpen,\n  onClose,\n  onInsertQuestion\n}: AiQuestionGeneratorModalProps) {\n  const { t } = useI18n()\n  isOpen,\n  onClose,\n  onInsertQuestion\n}: AiQuestionGeneratorModalProps) {', 'export function AiQuestionGeneratorModal({\n  isOpen,\n  onClose,\n  onInsertQuestion\n}: AiQuestionGeneratorModalProps) {\n  const { t } = useI18n()')
}

// Toasts
c = c.replace("'AI đang tiếp tục soạn đề bài toán ở chế độ nền. Bạn có thể mở lại bất cứ lúc nào.'", "t('AI đang tiếp tục soạn đề bài toán ở chế độ nền. Bạn có thể mở lại bất cứ lúc nào.')")
c = c.replace("'Đã dừng tác vụ và hoàn lại credit.'", "t('Đã dừng tác vụ và hoàn lại credit.')")
c = c.replace("'Đã dừng tác vụ đang xử lý (không hoàn credit).'", "t('Đã dừng tác vụ đang xử lý (không hoàn credit).')")
c = c.replace("'Đã dừng tác vụ sinh đề AI'", "t('Đã dừng tác vụ sinh đề AI')")
c = c.replace("'Lỗi khi hủy tác vụ'", "t('Lỗi khi hủy tác vụ')")
c = c.replace("'Đã xóa dữ liệu và làm mới'", "t('Đã xóa dữ liệu và làm mới')")
c = c.replace("'Vui lòng nhập nội dung yêu cầu bài toán'", "t('Vui lòng nhập nội dung yêu cầu bài toán')")
c = c.replace("'Đã thay thế nội dung bài tập!'", "t('Đã thay thế nội dung bài tập!')")
c = c.replace("'Đã bổ sung bài toán vào trình soạn thảo!'", "t('Đã bổ sung bài toán vào trình soạn thảo!')")

// Header
c = c.replace('Trợ lý Sinh Đề Toán AI', '{t("Trợ lý Sinh Đề Toán AI")}')
c = c.replace('Nhập yêu cầu bằng câu lệnh tự nhiên để AI tự động soạn đề bài toán kèm công thức KaTeX', '{t("Nhập yêu cầu bằng câu lệnh tự nhiên để AI tự động soạn đề bài toán kèm công thức KaTeX")}')

// Labels & Inputs
c = c.replace('Yêu cầu / Ý tưởng đề bài toán', '{t("Yêu cầu / Ý tưởng đề bài toán")}')
c = c.replace('placeholder="Ví dụ: Cho tam giác ABC nhọn nội tiếp đường tròn (O; R). Gọi H là chân đường cao hạ từ A xuống BC. Chứng minh rằng..."', 'placeholder={t("Ví dụ: Cho tam giác ABC nhọn nội tiếp đường tròn (O; R). Gọi H là chân đường cao hạ từ A xuống BC. Chứng minh rằng...")}')
c = c.replace('>Khối lớp</label>', '>{t("Khối lớp")}</label>')
c = c.replace('>Lớp {g}</option>', '>{t("Lớp")} {g}</option>')
c = c.replace('>Mức độ tư duy</label>', '>{t("Mức độ tư duy")}</label>')
c = c.replace('>Nhận biết</option>', '>{t("Nhận biết")}</option>')
c = c.replace('>Thông hiểu</option>', '>{t("Thông hiểu")}</option>')
c = c.replace('>Vận dụng</option>', '>{t("Vận dụng")}</option>')
c = c.replace('>Vận dụng cao</option>', '>{t("Vận dụng cao")}</option>')
c = c.replace('>Chủ đề (Tùy chọn)</label>', '>{t("Chủ đề (Tùy chọn)")}</label>')
c = c.replace('placeholder="Ví dụ: Hình học 9 - Đường tròn"', 'placeholder={t("Ví dụ: Hình học 9 - Đường tròn")}')
c = c.replace('Kèm hình vẽ minh họa / đồ thị', '{t("Kèm hình vẽ minh họa / đồ thị")}')
c = c.replace('Kèm lời giải chi tiết', '{t("Kèm lời giải chi tiết")}')

// Footer & Actions
c = c.replace('>Dừng tác vụ</button>', '>{t("Dừng tác vụ")}</button>')
c = c.replace('>Chạy ngầm & Đóng</button>', '>{t("Chạy ngầm & Đóng")}</button>')
c = c.replace("generatedQuestion ? 'Đóng' : 'Hủy bỏ'", "generatedQuestion ? t('Đóng') : t('Hủy bỏ')")
c = c.replace('title="Xóa nội dung cũ trong trình soạn thảo và thay bằng bài toán mới này"', 'title={t("Xóa nội dung cũ trong trình soạn thảo và thay bằng bài toán mới này")}')
c = c.replace('Thay thế bài tập hiện tại\r\n', '{t("Thay thế bài tập hiện tại")}\r\n')
c = c.replace('Thay thế bài tập hiện tại\n', '{t("Thay thế bài tập hiện tại")}\n')
c = c.replace('title="Chèn thêm bài toán này nối tiếp dưới nội dung hiện tại"', 'title={t("Chèn thêm bài toán này nối tiếp dưới nội dung hiện tại")}')
c = c.replace('Bổ sung vào bài tập\r\n', '{t("Bổ sung vào bài tập")}\r\n')
c = c.replace('Bổ sung vào bài tập\n', '{t("Bổ sung vào bài tập")}\n')

fs.writeFileSync(file, c, 'utf8')
console.log('Updated AiQuestionGeneratorModal i18n')
