const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'dictionaries', 'en.json');
const viPath = path.join(__dirname, '..', 'dictionaries', 'vi.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));

// 1. Dashboard Admin & Common
const updates = {
  "Báo Cáo Sự Cố": "Bug Reports",
  "Chưa có báo cáo sự cố nào": "No bug reports found",
  "Chưa có báo cáo sự cố nào.": "No bug reports found.",
  "Giao diện quản lý danh sách báo cáo sự cố từ người dùng hệ thống": "Manage incident reports submitted by system users",

  // 2. Relative time & Last login
  "Chưa đăng nhập": "Never logged in",
  "Vừa xong": "Just now",
  "{minutes} phút trước": "{minutes} minute(s) ago",
  "{hours} giờ trước": "{hours} hour(s) ago",
  "{hours} giờ {minutes} phút trước": "{hours}h {minutes}m ago",
  "{days} ngày trước": "{days} day(s) ago",
  "{months} tháng trước": "{months} month(s) ago",
  "{years} năm trước": "{years} year(s) ago",

  // 3. Permissions in /admin/roles
  "Tạo lớp học": "Create Class",
  "Sửa lớp học": "Edit Class",
  "Xóa lớp học": "Delete Classroom",
  "Quản lý yêu cầu tham gia": "Manage Join Requests",
  "Xóa học sinh": "Remove Student",
  "Tham gia lớp": "Join Class",
  "Xem trạng thái tham gia": "View Join Status",

  "Tạo bài tập": "Create Assignment",
  "Sửa bài tập": "Edit Assignment",
  "Xóa bài tập": "Delete Assignment",
  "Xuất bản bài tập": "Publish Assignment",
  "Xem bài tập": "View Assignment",

  "Nộp bài": "Submit Assignment",
  "Xem bài nộp của mình": "View Own Submissions",
  "Chấm điểm": "Grade Submissions",
  "Xem tất cả bài nộp": "View All Submissions",
  "Bình luận bài nộp": "Comment on Submission",

  "Xem thống kê giáo viên": "View Teacher Dashboard",
  "Xem thống kê học sinh": "View Student Dashboard",
  "Xem thống kê quản trị viên": "View Admin Dashboard",

  "Xem thư viện bài tập dùng chung": "View Shared Library",
  "Clone bài tập từ thư viện": "Clone Assignment from Library",

  "Quản lý người dùng": "User Management",
  "Lớp học": "Classroom",
  "Bài tập": "Assignment",
  "Bài nộp": "Submission",
  "Bảng điều khiển & Thống kê": "Dashboard & Statistics",
  "Thư viện bài tập": "Assignment Library",
  "Bật tất cả nhóm này": "Enable all in this group",
  "Tắt tất cả nhóm này": "Disable all in this group",
  "{active}/{total} quyền đã bật": "{active}/{total} permissions enabled",
  "Quyền của {name}": "Permissions for {name}",
  "Bật/tắt các quyền bên dưới để cấu hình giới hạn tính năng cho nhóm người dùng này.": "Toggle permissions below to configure feature access for this user group.",
  "Cập nhật quyền cho nhóm {name} thành công!": "Successfully updated permissions for {name} group!",
  "Có lỗi xảy ra khi lưu quyền, vui lòng thử lại sau.": "An error occurred while saving permissions, please try again later.",
  "Có lỗi xảy ra khi khôi phục quyền mặc định. Vui lòng thử lại sau.": "An error occurred while restoring default permissions. Please try again later.",

  // 4. AI Config - Providers & API Keys
  "Danh sách Nhà cung cấp AI (Providers)": "AI Providers List",
  "Quản lý tập trung các AI Provider, định nghĩa chiến lược failover và danh sách API Keys.": "Centrally manage AI Providers, define failover strategies, and maintain API Keys.",
  "Thêm Provider mới": "Add New Provider",
  'Chưa có Nhà cung cấp AI nào được cấu hình. Hãy bấm nút "Thêm Provider mới" ở trên.': 'No AI providers configured yet. Click "Add New Provider" above.',
  "Tải Models": "Fetch Models",
  "Tải danh sách Model trực tiếp từ Provider API": "Fetch model list directly from Provider API",
  "Nhà cung cấp (Provider)": "AI Provider",
  "Vui lòng chọn Provider...": "Please select a Provider...",
  "-- Chưa chọn Provider --": "-- No Provider Selected --",
  "Tên Model AI": "AI Model Name",
  "Vui lòng chọn hoặc gõ tên Model...": "Select or type model name...",
  "Temperature (Độ sáng tạo)": "Temperature (Creativity)",
  "Max Tokens (Giới hạn phản hồi)": "Max Tokens (Response limit)",
  "Lưu cấu hình Task": "Save Task Config",
  "Đã cấu hình": "Configured",
  "Chưa cấu hình": "Unconfigured",
  "Chưa thể bật tính năng": "Cannot enable feature",
  "Vui lòng chọn Provider và Model AI trước khi bật tính năng này.": "Please select AI Provider and Model before enabling this feature.",
  "✅ Đã bật tính năng": "✅ Feature enabled",
  "⏻ Đã tắt tính năng": "⏻ Feature disabled",
  "Task {taskCode} đã được bật. Giao diện Giáo viên/Học sinh sẽ hiển thị nút tương ứng ngay lập tức.": "Task {taskCode} has been enabled. Teacher/Student UI will display corresponding buttons immediately.",
  "Task {taskCode} đã bị tắt. Giao diện Giáo viên/Học sinh sẽ ẩn nút tương ứng ngay lập tức.": "Task {taskCode} has been disabled. Teacher/Student UI will hide corresponding buttons immediately.",
  "Cập nhật trạng thái thất bại": "Failed to update status",
  "Lưu cấu hình thất bại": "Failed to save configuration",
  "Đã cập nhật định tuyến cho tác vụ thành công.": "Successfully updated task routing.",

  // 5. AI Config - Task Routing Tasks
  "Định tuyến Tác vụ Hệ thống (Task Routing)": "System Task Routing",
  "Phân công nhà cung cấp, phiên bản Model AI và các tham số tối ưu cho từng loại tác vụ chuyên biệt.": "Assign AI providers, model versions, and parameters for each specialized system task.",
  "Sinh Đề thi & Khởi tạo Bài tập": "Generate Exams & Assignments",
  "Tự động tạo câu hỏi trắc nghiệm, tự luận toán theo ma trận kiến thức.": "Automatically generate multiple-choice and essay math questions based on knowledge matrix.",
  "Tạo Hàng Loạt Bài Tập từ File / Ảnh AI": "Batch Generate Assignments from File / AI Image",
  "Tự động phân tích tài liệu Word/PDF/Ảnh, bóc tách cấu trúc thành danh sách bài tập.": "Automatically analyze Word/PDF/Image files and extract structure into assignment list.",
  "Chấm bài Tự luận AI": "AI Essay Grading",
  "Phân tích lời giải bài tập học sinh, chấm điểm và gợi ý lời nhận xét.": "Analyze student solutions, grade and provide constructive feedback.",
  "Nhận diện Canvas & Công thức LaTeX": "Canvas & LaTeX Formula Recognition",
  "Chuyển đổi hình vẽ, công thức toán viết tay thành định dạng LaTeX / JSXGraph.": "Convert hand-drawn sketches and handwriting into LaTeX / JSXGraph format.",
  "Gợi ý Tư duy Làm bài": "Thinking Hints",
  "Đưa ra gợi ý định hướng từng bước theo phương pháp Socratic, không cho đáp án trực tiếp.": "Provide step-by-step guidance using Socratic method without giving direct answers.",
  "AI Đánh giá & Nhận xét Học sinh": "AI Student Assessment",
  "Quét dữ liệu bài tập và bài nộp theo mốc thời gian để sinh nhận xét điểm mạnh, điểm yếu và phương pháp cải thiện.": "Scan assignment and submission data over time to generate strengths, weaknesses, and improvement plans.",

  // 6. AI Config - Provider Tab Details & Badges
  "Xóa Provider thành công": "Deleted Provider successfully",
  "Xóa Provider thất bại": "Failed to delete Provider",
  "Cập nhật API Key thành công": "API Key updated successfully",
  "Đã cập nhật thông tin Key #{id}": "Updated Key #{id} info",
  "Cập nhật Key thất bại": "Failed to update Key",
  "Thêm API Key thành công": "API Key added successfully",
  "Đã thêm Key mới cho Provider {name}": "Added new Key for Provider {name}",
  "Thêm Key thất bại": "Failed to add Key",
  "Đã chuyển trạng thái Key sang {status}": "Changed Key status to {status}",
  "Cập nhật trạng thái Key thất bại": "Failed to update Key status",
  "Bạn có chắc chắn muốn xóa API Key này không?": "Are you sure you want to delete this API Key?",
  "Xóa Key thành công": "Deleted Key successfully",
  "Xóa Key thất bại": "Failed to delete Key",
  "⚡ Kiểm tra Key hợp lệ!": "⚡ Valid Key verification!",
  "Key hoạt động bình thường. Độ trễ: {ms} ms.": "Key is operating normally. Latency: {ms} ms.",
  "❌ Key không hợp lệ hoặc hết Quota": "❌ Invalid Key or Quota exceeded",
  "Trạng thái Key đã được chuyển thành INACTIVE.": "Key status has been changed to INACTIVE.",
  "Lỗi kiểm tra Key": "Key verification error",
  "Chưa sử dụng": "Never used",
  "Tạm nghỉ": "Cooldown",
  "API Key đang trong thời gian tạm nghỉ do lỗi 429 Vượt hạn mức (Quota Exceeded). Tự động phục hồi sau {time}": "API Key is on cooldown due to 429 Quota Exceeded error. Automatically recovers in {time}",
  "Bấm để chỉnh sửa độ ưu tiên và thông tin API Key": "Click to edit priority and API Key details",

  // 7. System Prompts Tab
  "Quản lý câu lệnh mẫu (System Prompts)": "System Prompts Management",
  "Tùy chỉnh các câu lệnh điều khiển AI cho từng tác vụ hệ thống, khôi phục mặc định và theo dõi lịch sử phiên bản.": "Customize AI system prompts for each task, restore factory defaults, and track version history.",
  "Tìm kiếm theo mã code, tên prompt...": "Search by code, prompt name...",
  "Chưa có System Prompt nào": "No System Prompts found",
  "Thử thay đổi bộ lọc tìm kiếm.": "Try changing the search filter.",
  "Thử nghiệm AI": "Test AI",
  "Chỉnh sửa": "Edit",
  "Lịch sử": "History",
  "Lỗi tải dữ liệu": "Data loading error",
  "Không thể tải danh sách System Prompts": "Unable to load System Prompts list",

  // 8. Test Connection Tab
  "Chưa chọn Provider": "No Provider selected",
  "Vui lòng chọn Provider hoặc tạo Provider mới ở Tab 1": "Please select a Provider or create a new one in Tab 1",
  "Vui lòng nhập chuỗi API Key để thử nghiệm kết nối": "Please enter an API Key to test connection",
  "Công cụ Kiểm tra Kết nối Trực tiếp": "Live Connection Test Tool",

  // 9. Credit Quota Tab
  "Chi phí Credit theo Tác vụ AI": "Credit Cost per AI Task",
  "Credit trừ theo tổng token (bao gồm prompt người dùng nhập + token đầu ra do AI sinh): 1 credit = N token (cột Token/credit), tối thiểu bằng phí cột đầu.": "Credits deducted by total tokens (prompt + output tokens): 1 credit = N tokens, min cost is the first column.",
  "Tác vụ AI": "AI Task",
  "Phí tối thiểu": "Min Cost",
  "Token/credit": "Token/credit",
  "Áp dụng": "Enabled",
  "Thao tác": "Actions",
  "Lưu": "Save",
  "Đã lưu chi phí cho \"{task}\"": "Saved cost for \"{task}\"",
  "Không thể lưu cấu hình chi phí.": "Failed to save cost configuration.",
  "Credit mặc định khi tạo tài khoản": "Default Credits on Account Creation",
  "Số credit tự động cấp cho người dùng mới theo vai trò (tài khoản cũ được backfill khi khởi động).": "Credits automatically granted to new users by role (existing accounts are backfilled at startup).",
  "Đã lưu credit mặc định cho {role}": "Saved default credits for {role}",
  "Không thể lưu credit mặc định.": "Failed to save default credits.",
  "Gói nạp Credit": "Credit Top-up Packages",
  "Người dùng chọn gói để nạp credit khi hết hạn mức.": "Users select packages to top up credits when quota is exhausted.",
  "Thêm gói": "Add Package",
  "Tên gói": "Package Name",
  "Số credit": "Credits Amount",
  "Giá": "Price",
  "Giá (VND)": "Price (VND)",
  "Trạng thái": "Status",
  "Đang bán": "On Sale",
  "Đã tắt": "Disabled",
  "Sửa gói credit": "Edit Credit Package",
  "Thêm gói credit": "Add Credit Package",
  "Thiết lập tên, số credit, giá bán và trạng thái của gói.": "Set name, credit amount, price, and package status.",
  "Ví dụ: Gói Cơ bản": "e.g. Basic Package",
  "Hủy": "Cancel",
  "Đã cập nhật gói credit": "Credit package updated",
  "Đã tạo gói credit mới": "New credit package created",
  "Không thể lưu gói credit.": "Failed to save credit package.",
  "Xóa gói \"{name}\"?": "Delete package \"{name}\"?",
  "Đã xóa gói credit": "Credit package deleted",
  "Không thể xóa gói credit.": "Failed to delete credit package.",
  "Điều chỉnh Credit & Sổ cái giao dịch": "Adjust Credits & Transaction Ledger",
  "Admin cộng/trừ credit thủ công cho một hoặc nhiều người dùng cùng lúc (ví dụ hoàn tiền lỗi hệ thống) và tra cứu sổ cái.": "Admin manually adds/subtracts credits for multiple users at once and reviews ledger.",
  "Người dùng (chọn nhiều)": "Users (multi-select)",
  "Chọn người dùng (email)...": "Select users (email)...",
  "Đã chọn {count} người dùng ({email}, ...)": "Selected {count} user(s) ({email}, ...)",
  "Bỏ chọn tất cả": "Clear all selections",
  "Bỏ chọn {email}": "Deselect {email}",
  "Tìm theo email hoặc họ tên": "Search by email or name",
  "Chưa cập nhật tên": "No name provided",
  "Số credit (+/-)": "Credit Amount (+/-)",
  "100 hoặc -50": "100 or -50",
  "Lý do điều chỉnh": "Adjustment Reason",
  "Chọn lý do": "Select reason",
  "Hoàn tiền do lỗi hệ thống": "System error refund",
  "Lý do khác": "Other reason",
  "Vui lòng nhập lý do cụ thể.": "Please enter a specific reason.",
  "Vui lòng chọn ít nhất một người dùng.": "Please select at least one user.",
  "Số credit điều chỉnh phải khác 0.": "Adjustment credit amount must not be 0.",
  "Điều chỉnh": "Adjust",
  "Đã điều chỉnh {amount} credit cho {count} người dùng.": "Adjusted {amount} credits for {count} user(s).",
  "Thành công {success} người dùng, thất bại {fail} người dùng.": "{success} succeeded, {fail} failed.",
  "Không thể điều chỉnh credit.": "Failed to adjust credits.",
  "STT": "No.",
  "Email": "Email",
  "Vai trò": "Role",
  "Thời gian": "Time",
  "Loại": "Type",
  "Nội dung": "Description",
  "Cấp mặc định": "Default Grant",
  "Nạp credit": "Top-up",
  "Tiêu thụ": "Consumption",
  "Hoàn lại": "Refund",
  "Hiển thị Trang": "Page",
  "Tổng số": "Total",
  "giao dịch": "transactions",
  "Số dòng/trang:": "Rows per page:",
  "Trước": "Previous",
  "Sau": "Next",
  "Tác vụ \"{task}\"": "Task \"{task}\""
};

// Merge into en.json
for (const [k, v] of Object.entries(updates)) {
  en[k] = v;
}

// Ensure vi.json has all keys defined as themselves if missing
for (const k of Object.keys(updates)) {
  if (vi[k] === undefined) {
    vi[k] = k;
  }
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2) + '\n', 'utf8');

console.log('Successfully updated en.json and vi.json with ' + Object.keys(updates).length + ' keys.');
