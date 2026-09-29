const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '../components/assignments/edit-sheet-modal.tsx')
let c = fs.readFileSync(file, 'utf8')

if (!c.includes('useI18n')) {
  c = c.replace("import { handleApiError } from '@/lib/utils/error-handler'", "import { handleApiError } from '@/lib/utils/error-handler'\nimport { useI18n } from '@/lib/i18n/i18n-context'")
}

if (!c.includes('const { t } = useI18n()')) {
  c = c.replace('export function EditSheetModal({', 'export function EditSheetModal({\n  open,\n  sheetId,\n  initialTitle = \'\',\n  initialDescription = \'\',\n  items = [],\n  onClose,\n  onSuccess,\n}: EditSheetModalProps) {\n  const { t } = useI18n()')
  // Chuẩn hóa
  c = c.replace(/export function EditSheetModal\(\{[\s\S]*?EditSheetModalProps\) \{/, 'export function EditSheetModal({\n  open,\n  sheetId,\n  initialTitle = \'\',\n  initialDescription = \'\',\n  items = [],\n  onClose,\n  onSuccess,\n}: EditSheetModalProps) {\n  const { t } = useI18n()')
}

// Toasts
c = c.replace("'Tiêu đề phiếu bài tập không được để trống'", "t('Tiêu đề phiếu bài tập không được để trống')")
c = c.replace("'Điểm tối đa từng câu không được là số âm'", "t('Điểm tối đa từng câu không được là số âm')")
c = c.replace('`Tổng điểm các câu (${currentTotalScore.toFixed(1)} điểm) không được vượt quá 10 điểm`', '`${t("Tổng điểm các câu")} (${currentTotalScore.toFixed(1)} ${t("điểm")}) ${t("không được vượt quá 10 điểm")}`')
c = c.replace("'Cập nhật phiếu bài tập thành công'", "t('Cập nhật phiếu bài tập thành công')")
c = c.replace("'Cập nhật phiếu bài tập thất bại'", "t('Cập nhật phiếu bài tập thất bại')")

// Modal Header
c = c.replace('>Chỉnh sửa phiếu bài tập</DialogTitle>', '>{t("Chỉnh sửa phiếu bài tập")}</DialogTitle>')
c = c.replace('Cập nhật tiêu đề đề mục, mô tả và điểm tối đa của phiếu bài tập', '{t("Cập nhật tiêu đề đề mục, mô tả và điểm tối đa của phiếu bài tập")}')

// Inputs & Labels
c = c.replace('Tiêu đề phiếu bài tập <span className="text-red-500">*</span>', '{t("Tiêu đề phiếu bài tập")} <span className="text-red-500">*</span>')
c = c.replace('placeholder="Nhập tiêu đề phiếu bài tập..."', 'placeholder={t("Nhập tiêu đề phiếu bài tập...")}')
c = c.replace('Mô tả phiếu bài tập\r\n', '{t("Mô tả phiếu bài tập")}\r\n')
c = c.replace('Mô tả phiếu bài tập\n', '{t("Mô tả phiếu bài tập")}\n')
c = c.replace('placeholder="Nhập mô tả ngắn cho phiếu bài tập..."', 'placeholder={t("Nhập mô tả ngắn cho phiếu bài tập...")}')

// Scores section
c = c.replace('Điểm tối đa từng câu\r\n', '{t("Điểm tối đa từng câu")}\r\n')
c = c.replace('Điểm tối đa từng câu\n', '{t("Điểm tối đa từng câu")}\n')
c = c.replace('Tổng điểm: {currentTotalScore.toFixed(1)} / 10', '{t("Tổng điểm:")} {currentTotalScore.toFixed(1)} / 10')
c = c.replace('>Chia đều</button>', '>{t("Chia đều")}</button>')
c = c.replace('>điểm</span>', '>{t("điểm")}</span>')

// Footer
c = c.replace('>Hủy</button>', '>{t("Hủy")}</button>')
c = c.replace('Đang lưu...\r\n', '{t("Đang lưu...")}\r\n')
c = c.replace('Đang lưu...\n', '{t("Đang lưu...")}\n')
c = c.replace("'Lưu thay đổi'", "t('Lưu thay đổi')")

fs.writeFileSync(file, c, 'utf8')
console.log('Updated EditSheetModal i18n')
