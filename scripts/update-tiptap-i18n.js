const fs = require('fs')
const path = require('path')

// 1. Dịch nốt nút Hủy trong components/assignments/publish-sheet-modal.tsx
const sheetModalPath = path.join(__dirname, '../components/assignments/publish-sheet-modal.tsx')
let sheetModal = fs.readFileSync(sheetModalPath, 'utf8')
sheetModal = sheetModal.replace(/>\s*Hủy\s*<\/button>/g, '>{t("Hủy")}</button>')
fs.writeFileSync(sheetModalPath, sheetModal, 'utf8')
console.log('Fixed Hủy in PublishSheetModal')

// 2. Dịch components/ui/tiptap.tsx
const tiptapPath = path.join(__dirname, '../components/ui/tiptap.tsx')
let tiptap = fs.readFileSync(tiptapPath, 'utf8')

// Thêm import useI18n nếu chưa có
if (!tiptap.includes('useI18n')) {
  tiptap = tiptap.replace("import { MathfieldElement } from 'mathlive'", "import { MathfieldElement } from 'mathlive'\nimport { useI18n } from '@/lib/i18n/i18n-context'")
}

// Thêm const { t } = useI18n() trong TiptapEditor
if (!tiptap.includes('const { t } = useI18n()')) {
  tiptap = tiptap.replace('const isEditable = editable !== undefined ? editable : !readOnly', 'const { t } = useI18n()\n  const isEditable = editable !== undefined ? editable : !readOnly')
}

// Dịch các button và tooltips
tiptap = tiptap.replace("showMathToolbar ? 'Ẩn bảng công thức' : 'Hiện bảng công thức'", "showMathToolbar ? t('Ẩn bảng công thức') : t('Hiện bảng công thức')")
tiptap = tiptap.replace('title="Tiêu đề lớn"', 'title={t("Tiêu đề lớn")}')
tiptap = tiptap.replace('title="Tiêu đề vừa"', 'title={t("Tiêu đề vừa")}')
tiptap = tiptap.replace('title="In đậm"', 'title={t("In đậm")}')
tiptap = tiptap.replace('title="In nghiêng"', 'title={t("In nghiêng")}')
tiptap = tiptap.replace('title="Chèn liên kết"', 'title={t("Chèn liên kết")}')
tiptap = tiptap.replace('title="Tải lên ảnh từ máy tính"', 'title={t("Tải lên ảnh từ máy tính")}')
tiptap = tiptap.replace('title="Tải lên file"', 'title={t("Tải lên file")}')
tiptap = tiptap.replace('title="Danh sách dấu đầu dòng"', 'title={t("Danh sách dấu đầu dòng")}')
tiptap = tiptap.replace('title="Danh sách số"', 'title={t("Danh sách số")}')
tiptap = tiptap.replace('title="Trích dẫn"', 'title={t("Trích dẫn")}')
tiptap = tiptap.replace('title="Chèn bảng"', 'title={t("Chèn bảng")}')
tiptap = tiptap.replace('title="Thêm cột bên phải"', 'title={t("Thêm cột bên phải")}')
tiptap = tiptap.replace('>+ Cột<', '>{t("+ Cột")}<')
tiptap = tiptap.replace('title="Thêm dòng bên dưới"', 'title={t("Thêm dòng bên dưới")}')
tiptap = tiptap.replace('>+ Dòng<', '>{t("+ Dòng")}<')
tiptap = tiptap.replace('title="Xóa cột hiện tại"', 'title={t("Xóa cột hiện tại")}')
tiptap = tiptap.replace('>Xóa Cột<', '>{t("Xóa Cột")}<')
tiptap = tiptap.replace('title="Xóa dòng hiện tại"', 'title={t("Xóa dòng hiện tại")}')
tiptap = tiptap.replace('>Xóa Dòng<', '>{t("Xóa Dòng")}<')
tiptap = tiptap.replace('title="Xóa toàn bộ bảng"', 'title={t("Xóa toàn bộ bảng")}')
tiptap = tiptap.replace('title="Hoàn tác"', 'title={t("Hoàn tác")}')
tiptap = tiptap.replace('title="Làm lại"', 'title={t("Làm lại")}')

fs.writeFileSync(tiptapPath, tiptap, 'utf8')
console.log('Updated Tiptap i18n')
