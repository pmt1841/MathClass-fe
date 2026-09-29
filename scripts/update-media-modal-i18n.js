const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '../components/ui/media-upload-modal.tsx')
let c = fs.readFileSync(file, 'utf8')

// Thêm useI18n
if (!c.includes('useI18n')) {
  c = c.replace("import { toast } from 'sonner'", "import { toast } from 'sonner'\nimport { useI18n } from '@/lib/i18n/i18n-context'")
}

if (!c.includes('const { t } = useI18n()')) {
  c = c.replace('const [activeMode, setActiveMode] = useState<UploadModalMode>(initialMode)', 'const { t } = useI18n()\n  const [activeMode, setActiveMode] = useState<UploadModalMode>(initialMode)')
}

// Thay các chuỗi toast và văn bản
c = c.replace('`Vượt quá 5MB (${invalidSizeFiles.length}): ${invalidSizeFiles.join(\', \')}`', '`${t("Vượt quá 5MB")} (${invalidSizeFiles.length}): ${invalidSizeFiles.join(\', \')}`')
c = c.replace('`Không đúng định dạng .jpg/.png/.webp (${invalidTypeFiles.length}): ${invalidTypeFiles.join(\', \')}`', '`${t("Không đúng định dạng .jpg/.png/.webp")} (${invalidTypeFiles.length}): ${invalidTypeFiles.join(\', \')}`')
c = c.replace('`Có ${invalidSizeFiles.length + invalidTypeFiles.length} file không thể chọn:\\n• ${errorDetails.join(\'\\n• \')}`', '`${t("Có")} ${invalidSizeFiles.length + invalidTypeFiles.length} ${t("file không thể chọn:")}\\n• ${errorDetails.join(\'\\n• \')}`')
c = c.replace("'Chỉ được chọn tối đa 10 ảnh trong 1 lượt upload.'", "t('Chỉ được chọn tối đa 10 ảnh trong 1 lượt upload.')")
c = c.replace('`Tập tin "${file.name}" vượt quá dung lượng tối đa 10MB.`', '`${t("Tập tin")} "${file.name}" ${t("vượt quá dung lượng tối đa 10MB.")}`')
c = c.replace('`Tập tin "${file.name}" không hợp lệ. Vui lòng chọn .docx, .txt hoặc .pdf`', '`${t("Tập tin")} "${file.name}" ${t("không hợp lệ. Vui lòng chọn .docx, .txt hoặc .pdf")}`')
c = c.replace('`Đã tải lên thành công ${uploadItems.length} ảnh!`', '`${t("Đã tải lên thành công")} ${uploadItems.length} ${t("ảnh!")}`')
c = c.replace("'Có lỗi xảy ra trong quá trình tải ảnh.'", "t('Có lỗi xảy ra trong quá trình tải ảnh.')")
c = c.replace("'Tải lên thất bại'", "t('Tải lên thất bại')")
c = c.replace("'Lỗi tải lên'", "t('Lỗi tải lên')")
c = c.replace('`Đã tải lên thành công ${totalItems} ảnh!`', '`${t("Đã tải lên thành công")} ${totalItems} ${t("ảnh!")}`')
c = c.replace("'Có ảnh tải lên bị lỗi, vui lòng kiểm tra lại.'", "t('Có ảnh tải lên bị lỗi, vui lòng kiểm tra lại.')")
c = c.replace("'Đã tải lên tập tin!'", "t('Đã tải lên tập tin!')")
c = c.replace('`Đã tải lên ${item.file.name}`', '`${t("Đã tải lên")} ${item.file.name}`')
c = c.replace("'Vui lòng nhập địa chỉ liên kết (URL)'", "t('Vui lòng nhập địa chỉ liên kết (URL)')")

// Giao diện
c = c.replace('>Tải ảnh<', '>{t("Tải ảnh")}<')
c = c.replace('>Tải file<', '>{t("Tải file")}<')
c = c.replace('>Chèn Link<', '>{t("Chèn Link")}<')
c = c.replace('title="Đóng"', 'title={t("Đóng")}')
c = c.replace('title="Xóa"', 'title={t("Xóa")}')
c = c.replace('Địa chỉ liên kết (URL)', '{t("Địa chỉ liên kết (URL)")}')
c = c.replace('Văn bản hiển thị (Tùy chọn)', '{t("Văn bản hiển thị (Tùy chọn)")}')
c = c.replace('placeholder="Ví dụ: Tham khảo bài viết"', 'placeholder={t("Ví dụ: Tham khảo bài viết")}')
c = c.replace('>Hủy<', '>{t("Hủy")}<')
c = c.replace('>Xác nhận<', '>{t("Xác nhận")}<')
c = c.replace('Kéo & thả {activeMode === \'image\' ? \'các hình ảnh\' : \'tập tin\'} vào đây', '{t("Kéo & thả")} {activeMode === \'image\' ? t(\'các hình ảnh\') : t(\'tập tin\')} {t("vào đây")}')
c = c.replace('hoặc <span className="text-primary font-bold hover:underline">chọn từ thiết bị của bạn</span>', '{t("hoặc")} <span className="text-primary font-bold hover:underline">{t("chọn từ thiết bị của bạn")}</span>')
c = c.replace('<>Hỗ trợ chọn <strong className="text-slate-600 dark:text-slate-300">nhiều ảnh</strong> (.jpg, .png, .webp - Tối đa 5MB/ảnh)</>', '<>{t("Hỗ trợ chọn")} <strong className="text-slate-600 dark:text-slate-300">{t("nhiều ảnh")}</strong> {t("(.jpg, .png, .webp - Tối đa 5MB/ảnh)")}</>')
c = c.replace('<>Định dạng hỗ trợ: <strong className="text-slate-600 dark:text-slate-300">.docx, .txt, .pdf</strong> (Tối đa 10MB)</>', '<>{t("Định dạng hỗ trợ:")} <strong className="text-slate-600 dark:text-slate-300">.docx, .txt, .pdf</strong> {t("(Tối đa 10MB)")}</>')
c = c.replace('Đã chọn {uploadItems.length} {activeMode === \'image\' ? \'ảnh\' : \'tập tin\'}', '{t("Đã chọn")} {uploadItems.length} {activeMode === \'image\' ? t(\'ảnh\') : t(\'tập tin\')}')
c = c.replace('+ Thêm ảnh khác', '+ {t("Thêm ảnh khác")}')
c = c.replace('>Xong</span>', '>{t("Xong")}</span>')
c = c.replace('>Thất bại</span>', '>{t("Thất bại")}</span>')
c = c.replace('Thử lại\r\n', '{t("Thử lại")}\r\n')
c = c.replace('Thử lại\n', '{t("Thử lại")}\n')
c = c.replace('Đang tải lên...\r\n', '{t("Đang tải lên...")}\r\n')
c = c.replace('Đang tải lên...\n', '{t("Đang tải lên...")}\n')
c = c.replace('Tải lên {uploadItems.length} {activeMode === \'image\' ? \'ảnh\' : \'file\'}', '{t("Tải lên")} {uploadItems.length} {activeMode === \'image\' ? t(\'ảnh\') : t(\'file\')}')

fs.writeFileSync(file, c, 'utf8')
console.log('Updated MediaUploadModal i18n')
