const fs = require('fs')
const path = require('path')

const viPath = path.join(__dirname, '../dictionaries/vi.json')
const enPath = path.join(__dirname, '../dictionaries/en.json')

const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'))
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))

const extraTranslations = {
  // EditSheetModal
  "Tiêu đề phiếu bài tập không được để trống": "Worksheet title cannot be empty",
  "Cập nhật phiếu bài tập thành công": "Updated worksheet successfully",
  "Cập nhật phiếu bài tập thất bại": "Failed to update worksheet",
  "Chỉnh sửa phiếu bài tập": "Edit Worksheet",
  "Cập nhật tiêu đề đề mục, mô tả và điểm tối đa của phiếu bài tập": "Update title, description, and maximum score of worksheet",
  "Nhập tiêu đề phiếu bài tập...": "Enter worksheet title...",
  "Mô tả phiếu bài tập": "Worksheet Description",
  "Nhập mô tả ngắn cho phiếu bài tập...": "Enter a short description for the worksheet...",

  // AiGradingConfirmDialog
  "Tiến trình AI đang chạy": "AI Process is Running",
  "Bài làm của": "Submission of",
  "học sinh": "student",
  "Hệ thống đang đối chiếu hình vẽ Canvas và chấm sơ bộ bài tự luận. Bạn muốn ẩn cửa sổ để tiếp tục thao tác hay hủy tiến trình này?": "The system is comparing Canvas drawings and preliminarily grading the essay. Do you want to minimize the window to continue or cancel this process?",
  "Tiếp tục xem": "Continue Viewing",
  "Hủy chấm bài": "Cancel Grading",
  "Ẩn & Chạy ngầm": "Minimize & Run in Background",

  // HandwritingSketchModal
  "Chưa có nội dung": "No content yet",
  "Vui lòng vẽ chữ viết tay hoặc tải ảnh chữ viết tay lên trước khi bấm nhận diện.": "Please draw handwriting or upload a handwriting image before recognizing.",
  "Không tìm thấy chữ viết": "No handwriting found",
  "Không nhận diện thấy chữ viết tay hoặc công thức toán trong ảnh. Vui lòng kiểm tra lại nét vẽ hoặc ảnh tải lên.": "No handwriting or math formula recognized in the image. Please verify your sketch or uploaded image.",
  "Nhận diện thành công": "Recognition successful",
  "Đã chuyển chữ viết tay sang mã LaTeX.": "Handwriting converted to LaTeX code.",
  "Lỗi nhận diện": "Recognition error",
  "Không thể nhận diện chữ viết tay. Vui lòng thử lại.": "Unable to recognize handwriting. Please try again.",
  "Vui lòng phác thảo hình vẽ hoặc tải ảnh phác thảo lên trước khi bấm nắn chỉnh.": "Please sketch a drawing or upload an image before normalizing.",
  "Không tìm thấy hình phác thảo": "No sketch found",
  "Không nhận diện thấy nét vẽ hình học trong ảnh. Vui lòng phác thảo lại hình vẽ rõ ràng hơn.": "No geometric strokes recognized in the image. Please sketch more clearly.",
  "Ảnh không chứa đối tượng hình học hợp lệ. Vui lòng thử vẽ lại.": "The image does not contain valid geometric objects. Please try sketching again.",
  "Nắn chỉnh thành công": "Normalized successfully",
  "Đã nắn chỉnh hình phác thảo": "Normalized sketch",
  "Lỗi nắn chỉnh": "Normalization error",
  "Không thể nắn chỉnh hình phác thảo. Vui lòng thử lại.": "Unable to normalize sketch. Please try again.",
  "Trợ lý AI: Số hóa chữ viết & Phác thảo hình học": "AI Assistant: Handwriting Digitization & Geometry Sketch",
  "Vẽ tự do hoặc tải ảnh lên để AI tự động trích xuất công thức toán hoặc nắn chỉnh hình phác thảo.": "Draw freely or upload an image for AI to extract math formulas or normalize geometric sketches.",
  "Chữ viết tay ➔ LaTeX": "Handwriting ➔ LaTeX",
  "Phác thảo nét ➔ Canvas chuẩn": "Sketch ➔ Standard Canvas",
  "Vẽ công thức lên khung bên dưới hoặc tải ảnh lên:": "Draw formulas on canvas below or upload an image:",
  "Xóa khung": "Clear Canvas",
  "Đang trích xuất văn bản...": "Extracting text...",
  "Trích xuất văn bản (AI)": "Extract Text (AI)",
  "Xem trước kết quả nhận diện:": "Recognition Result Preview:",
  "Chèn văn bản vào bài": "Insert Text into Assignment",
  "Vẽ phác thảo hình học tay (tam giác, đường tròn, tứ giác...):": "Hand-draw geometric sketches (triangle, circle, quadrilateral...):",
  "Đang chuẩn hóa phác thảo...": "Normalizing sketch...",
  "Chuẩn hóa hình phác thảo (AI)": "Normalize Sketch (AI)",
  "Kết quả nhận diện:": "Recognition result:",
  "Chèn hình chuẩn vào bài làm": "Insert Standard Shape into Submission"
}

for (const [key, value] of Object.entries(extraTranslations)) {
  if (!vi[key]) {
    vi[key] = key
  }
  en[key] = value
}

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2), 'utf8')
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8')
console.log(`Synced ${Object.keys(extraTranslations).length} extra translations!`)
