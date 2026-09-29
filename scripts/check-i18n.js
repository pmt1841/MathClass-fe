const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'dictionaries', 'en.json');
const viPath = path.join(__dirname, '..', 'dictionaries', 'vi.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));

const keysToCheck = [
  "Báo Cáo Sự Cố",
  "Chưa đăng nhập",
  "Vừa xong",
  "{minutes} phút trước",
  "{hours} giờ trước",
  "{hours} giờ {minutes} phút trước",
  "{days} ngày trước",
  "{months} tháng trước",
  "{years} năm trước",
  "Tạo lớp học",
  "Sửa lớp học",
  "Xóa lớp học",
  "Quản lý yêu cầu tham gia",
  "Xóa học sinh",
  "Tham gia lớp",
  "Xem trạng thái tham gia",
  "Tạo bài tập",
  "Sửa bài tập",
  "Xóa bài tập",
  "Xuất bản bài tập",
  "Xem bài tập",
  "Nộp bài",
  "Xem bài nộp của mình",
  "Chấm điểm",
  "Xem tất cả bài nộp",
  "Bình luận bài nộp",
  "Xem thống kê giáo viên",
  "Xem thống kê học sinh",
  "Xem thống kê quản trị viên",
  "Xem thư viện bài tập dùng chung",
  "Clone bài tập từ thư viện",
  "Quản lý người dùng",
  "Lớp học",
  "Bài tập",
  "Bài nộp",
  "Bảng điều khiển & Thống kê",
  "Thư viện bài tập",
  "Danh sách Nhà cung cấp AI (Providers)",
  "Quản lý tập trung các AI Provider, định nghĩa chiến lược failover và danh sách API Keys.",
  "Thêm Provider mới",
  'Chưa có Nhà cung cấp AI nào được cấu hình. Hãy bấm nút "Thêm Provider mới" ở trên.',
  "Tải Models",
  "Tải danh sách Model trực tiếp từ Provider API",
  "Định tuyến Tác vụ Hệ thống (Task Routing)",
  "Phân công nhà cung cấp, phiên bản Model AI và các tham số tối ưu cho từng loại tác vụ chuyên biệt.",
  "Sinh Đề thi & Khởi tạo Bài tập",
  "Tự động tạo câu hỏi trắc nghiệm, tự luận toán theo ma trận kiến thức.",
  "Tạo Hàng Loạt Bài Tập từ File / Ảnh AI",
  "Tự động phân tích tài liệu Word/PDF/Ảnh, bóc tách cấu trúc thành danh sách bài tập.",
  "Chấm bài Tự luận AI",
  "Phân tích lời giải bài tập học sinh, chấm điểm và gợi ý lời nhận xét.",
  "Nhận diện Canvas & Công thức LaTeX",
  "Chuyển đổi hình vẽ, công thức toán viết tay thành định dạng LaTeX / JSXGraph.",
  "Gợi ý Tư duy Làm bài",
  "Đưa ra gợi ý định hướng từng bước theo phương pháp Socratic, không cho đáp án trực tiếp.",
  "AI Đánh giá & Nhận xét Học sinh",
  "Quét dữ liệu bài tập và bài nộp theo mốc thời gian để sinh nhận xét điểm mạnh, điểm yếu và phương pháp cải thiện.",
  "Nhà cung cấp (Provider)",
  "Vui lòng chọn Provider...",
  "-- Chưa chọn Provider --",
  "Tên Model AI",
  "Vui lòng chọn hoặc gõ tên Model...",
  "Temperature (Độ sáng tạo)",
  "Max Tokens (Giới hạn phản hồi)",
  "Lưu cấu hình Task",
  "Bật tất cả nhóm này",
  "Tắt tất cả nhóm này",
  "{active}/{total} quyền đã bật",
  "Quyền của {name}",
  "Bật/tắt các quyền bên dưới để cấu hình giới hạn tính năng cho nhóm người dùng này."
];

// Check keys defined in vi.json that are missing in en.json
const missingInEn = Object.keys(vi).filter((k) => en[k] === undefined);
if (missingInEn.length > 0) {
  console.warn('⚠️  Keys có trong vi.json nhưng thiếu trong en.json:');
  missingInEn.forEach((k) => console.warn(`  - "${k}"`));
}

const res = {};
for (const k of keysToCheck) {
  res[k] = en[k] !== undefined ? en[k] : 'MISSING';
}
console.log(JSON.stringify(res, null, 2));
