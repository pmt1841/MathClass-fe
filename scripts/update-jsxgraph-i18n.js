const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '../components/ui/jsxgraph-editor-modal.tsx')
let c = fs.readFileSync(file, 'utf8')

if (!c.includes('useI18n')) {
  c = c.replace("import './jsxgraph.css'", "import './jsxgraph.css'\nimport { useI18n } from '@/lib/i18n/i18n-context'")
}

if (!c.includes('const { t } = useI18n()')) {
  c = c.replace('export function JsxGraphEditorModal({ open, onClose, onConfirm, initialData, initialWidth, initialHeight }: JsxGraphEditorModalProps) {', 'export function JsxGraphEditorModal({ open, onClose, onConfirm, initialData, initialWidth, initialHeight }: JsxGraphEditorModalProps) {\n  const { t } = useI18n()')
}

// Header
c = c.replace('Vẽ hình với JSXGraph\r\n', '{t("Vẽ hình với JSXGraph")}\r\n')
c = c.replace('Vẽ hình với JSXGraph\n', '{t("Vẽ hình với JSXGraph")}\n')
c = c.replace('title="Hoàn tác (Ctrl+Z)"', 'title={t("Hoàn tác (Ctrl+Z)")}')
c = c.replace('<Undo className="w-4 h-4" /> Hoàn tác', '<Undo className="w-4 h-4" /> {t("Hoàn tác")}')
c = c.replace('title="Tiến lại"', 'title={t("Tiến lại")}')
c = c.replace('<Redo className="w-4 h-4" /> Tiến lại', '<Redo className="w-4 h-4" /> {t("Tiến lại")}')

// Toolbar groups
c = c.replace('>Cơ bản</div>', '>{t("Cơ bản")}</div>')
c = c.replace('<MousePointer2 className="w-3.5 h-3.5" /> Chọn & Kéo', '<MousePointer2 className="w-3.5 h-3.5" /> {t("Chọn & Kéo")}')
c = c.replace('<CircleDot className="w-3.5 h-3.5" /> Thêm điểm', '<CircleDot className="w-3.5 h-3.5" /> {t("Thêm điểm")}')
c = c.replace('title="Thêm ô nhập chữ vào giữa hình vẽ"', 'title={t("Thêm ô nhập chữ vào giữa hình vẽ")}')
c = c.replace('<Type className="w-3.5 h-3.5 text-primary" /> Thêm ô text', '<Type className="w-3.5 h-3.5 text-primary" /> {t("Thêm ô text")}')

c = c.replace('>Đường & Đoạn</div>', '>{t("Đường & Đoạn")}</div>')
c = c.replace('<Minus className="w-3.5 h-3.5" /> Đoạn thẳng', '<Minus className="w-3.5 h-3.5" /> {t("Đoạn thẳng")}')
c = c.replace('<Slash className="w-3.5 h-3.5" /> Đường thẳng', '<Slash className="w-3.5 h-3.5" /> {t("Đường thẳng")}')

c = c.replace('>Hình học</div>', '>{t("Hình học")}</div>')
c = c.replace('<Triangle className="w-3.5 h-3.5" /> Tam giác', '<Triangle className="w-3.5 h-3.5" /> {t("Tam giác")}')
c = c.replace('<Square className="w-3.5 h-3.5" /> Hình vuông', '<Square className="w-3.5 h-3.5" /> {t("Hình vuông")}')
c = c.replace('<RectangleHorizontal className="w-3.5 h-3.5" /> Hình chữ nhật', '<RectangleHorizontal className="w-3.5 h-3.5" /> {t("Hình chữ nhật")}')
c = c.replace('<Diamond className="w-3.5 h-3.5" /> Hình thoi', '<Diamond className="w-3.5 h-3.5" /> {t("Hình thoi")}')
c = c.replace('<Parallelogram className="w-3.5 h-3.5" /> Hình bình hành', '<Parallelogram className="w-3.5 h-3.5" /> {t("Hình bình hành")}')
c = c.replace('<Circle className="w-3.5 h-3.5" /> Hình tròn', '<Circle className="w-3.5 h-3.5" /> {t("Hình tròn")}')

c = c.replace('>Hàm số</div>', '>{t("Hàm số")}</div>')
c = c.replace('<FunctionSquare className="w-3.5 h-3.5" /> Đồ thị hàm', '<FunctionSquare className="w-3.5 h-3.5" /> {t("Đồ thị hàm")}')

c = c.replace('>Hiển thị</div>', '>{t("Hiển thị")}</div>')
c = c.replace('title={showGrid ? "Ẩn lưới ô vuông (sẽ tự động ẩn trục tọa độ)" : "Hiện lưới ô vuông"}', 'title={showGrid ? t("Ẩn lưới ô vuông (sẽ tự động ẩn trục tọa độ)") : t("Hiện lưới ô vuông")}')
c = c.replace('<Grid className="w-3.5 h-3.5 text-slate-500" /> Lưới ô vuông', '<Grid className="w-3.5 h-3.5 text-slate-500" /> {t("Lưới ô vuông")}')
c = c.replace('<Compass className={`w-3.5 h-3.5 ${!showGrid ? \'text-slate-300\' : \'text-slate-500\'}`} /> Trục tọa độ', '<Compass className={`w-3.5 h-3.5 ${!showGrid ? \'text-slate-300\' : \'text-slate-500\'}`} /> {t("Trục tọa độ")}')

// Tooltips guide
c = c.replace('{activeTool === \'point\' && "Click vào bảng để tạo điểm mới."}', '{activeTool === \'point\' && t("Click vào bảng để tạo điểm mới.")}')
c = c.replace('{activeTool === \'segment\' && "Click 2 điểm liên tiếp để vẽ đoạn thẳng."}', '{activeTool === \'segment\' && t("Click 2 điểm liên tiếp để vẽ đoạn thẳng.")}')
c = c.replace('{activeTool === \'line\' && "Click 2 điểm liên tiếp để vẽ đường thẳng vô hạn."}', '{activeTool === \'line\' && t("Click 2 điểm liên tiếp để vẽ đường thẳng vô hạn.")}')
c = c.replace('{activeTool === \'triangle\' && "Click 3 điểm liên tiếp để vẽ tam giác."}', '{activeTool === \'triangle\' && t("Click 3 điểm liên tiếp để vẽ tam giác.")}')
c = c.replace('{activeTool === \'square\' && "Click 2 điểm cạnh đáy để vẽ hình vuông chuẩn (không méo góc)."}', '{activeTool === \'square\' && t("Click 2 điểm cạnh đáy để vẽ hình vuông chuẩn (không méo góc).")}')
c = c.replace('{activeTool === \'rectangle\' && "Click 2 điểm cạnh đáy & 1 điểm đỉnh để vẽ hình chữ nhật."}', '{activeTool === \'rectangle\' && t("Click 2 điểm cạnh đáy & 1 điểm đỉnh để vẽ hình chữ nhật.")}')
c = c.replace('{activeTool === \'rhombus\' && "Click 2 điểm cạnh đáy & 1 điểm đỉnh để vẽ hình thoi chuẩn."}', '{activeTool === \'rhombus\' && t("Click 2 điểm cạnh đáy & 1 điểm đỉnh để vẽ hình thoi chuẩn.")}')
c = c.replace('{activeTool === \'parallelogram\' && "Click 3 điểm để vẽ hình bình hành chuẩn 2 cặp cạnh song song."}', '{activeTool === \'parallelogram\' && t("Click 3 điểm để vẽ hình bình hành chuẩn 2 cặp cạnh song song.")}')
c = c.replace('{activeTool === \'circle\' && "Click tâm đường tròn, sau đó click một điểm trên viền."}', '{activeTool === \'circle\' && t("Click tâm đường tròn, sau đó click một điểm trên viền.")}')
c = c.replace('{activeTool === \'function\' && "Nhập công thức hàm số rồi nhấn Vẽ để thêm đồ thị."}', '{activeTool === \'function\' && t("Nhập công thức hàm số rồi nhấn Vẽ để thêm đồ thị.")}')
c = c.replace('{activeTool === \'select\' && "Kéo thả để di chuyển các đỉnh. Click chuột phải vào điểm để sửa tọa độ & tên."}', '{activeTool === \'select\' && t("Kéo thả để di chuyển các đỉnh. Click chuột phải vào điểm để sửa tọa độ & tên.")}')

// Function panel
c = c.replace('>Nhập hàm số</div>', '>{t("Nhập hàm số")}</div>')
c = c.replace("{editingFunctionId ? 'Cập nhật' : 'Vẽ đồ thị'}", "{editingFunctionId ? t('Cập nhật') : t('Vẽ đồ thị')}")
c = c.replace('>Hủy</button>', '>{t("Hủy")}</button>')
c = c.replace('>Các hàm số đã vẽ</div>', '>{t("Các hàm số đã vẽ")}</div>')

// Point Edit Context
c = c.replace('>Tên điểm</label>', '>{t("Tên điểm")}</label>')
c = c.replace('>Tọa độ X</label>', '>{t("Tọa độ X")}</label>')
c = c.replace('>Tọa độ Y</label>', '>{t("Tọa độ Y")}</label>')
c = c.replace('>Lưu thay đổi</button>', '>{t("Lưu thay đổi")}</button>')
c = c.replace('title="Xóa điểm"', 'title={t("Xóa điểm")}')

// Error modal
c = c.replace('>Lỗi cú pháp</h4>', '>{t("Lỗi cú pháp")}</h4>')
c = c.replace('>Đóng</button>', '>{t("Đóng")}</button>')

// Footer
c = c.replace('>Rộng:</label>', '>{t("Rộng:")}</label>')
c = c.replace('>Cao:</label>', '>{t("Cao:")}</label>')
c = c.replace('>Hủy bỏ</button>', '>{t("Hủy bỏ")}</button>')
c = c.replace('<Check className="w-4 h-4" /> Lưu hình vẽ', '<Check className="w-4 h-4" /> {t("Lưu hình vẽ")}')

fs.writeFileSync(file, c, 'utf8')
console.log('Updated JsxGraphEditorModal i18n')
