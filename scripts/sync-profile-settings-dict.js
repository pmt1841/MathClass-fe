const fs = require('fs');
const path = require('path');
const viPath = path.join(__dirname, '../dictionaries/vi.json');
const enPath = path.join(__dirname, '../dictionaries/en.json');
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const updates = {
  // Header user menu
  "Hồ sơ cá nhân": "Profile",
  "Hồ sơ cá nhân Admin": "Admin Profile",
  "Cài đặt": "Settings",
  "Đăng xuất": "Logout",
  "Xác nhận đăng xuất": "Confirm Logout",
  "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?": "Are you sure you want to log out of this account?",
  "Người dùng": "User",

  // Profile page & form
  "Quản lý thông tin cá nhân của bạn.": "Manage your personal information.",
  "Quản lý thông tin tài khoản Quản trị viên của bạn.": "Manage your Administrator account information.",
  "Đã có lỗi xảy ra khi tải thông tin hồ sơ.": "An error occurred while loading profile information.",
  "Ảnh đại diện": "Avatar",
  "Cập nhật ảnh đại diện mới cho tài khoản của bạn.": "Update a new avatar for your account.",
  "Thông tin chi tiết": "Detailed Information",
  "Thông tin này sẽ được hiển thị trên hệ thống giáo dục.": "This information will be displayed on the educational system.",
  "Thông tin quản trị viên hệ thống.": "System administrator information.",
  "Họ và tên": "Full Name",
  "Nhập họ và tên...": "Enter full name...",
  "Không thể thay đổi họ và tên vì đăng nhập bằng tài khoản Google": "Cannot change full name because you logged in with Google account",
  "Không thể thay đổi ảnh đại diện vì đăng nhập bằng tài khoản Google": "Cannot change avatar because you logged in with Google account",
  "Bấm để thay đổi ảnh đại diện": "Click to change avatar",
  "Thay đổi ảnh": "Change Avatar",
  "Định dạng: JPEG, PNG, WEBP (Tối đa 5MB)": "Format: JPEG, PNG, WEBP (Max 5MB)",
  "Số điện thoại": "Phone Number",
  "Nhập số điện thoại...": "Enter phone number...",
  "Ngày sinh": "Date of Birth",
  "Giới tính": "Gender",
  "Chọn giới tính": "Select gender",
  "Nam": "Male",
  "Nữ": "Female",
  "Khác": "Other",
  "Lưu thay đổi": "Save Changes",

  // Date select group
  "Ngày": "Day",
  "Tháng": "Month",
  "Năm": "Year",
  "Tháng {month}": "Month {month}",

  // Avatar upload modal
  "Cập nhật ảnh đại diện": "Update Avatar",
  "Tải lên ảnh mới bằng cách chọn tệp hoặc kéo thả trực tiếp vào ô bên dưới.": "Upload a new photo by selecting a file or dragging and dropping directly below.",
  "Thu phóng, xoay và điều chỉnh vị trí để có bức ảnh hoàn hảo nhất.": "Zoom, rotate, and adjust position for the best photo.",
  "Kéo và thả ảnh vào đây, hoặc": "Drag and drop image here, or",
  "Duyệt tìm tệp": "Browse files",
  "Hỗ trợ các định dạng PNG, JPG, WEBP (Tối đa 5MB)": "Supports PNG, JPG, WEBP formats (Max 5MB)",
  "Thu phóng: {zoom}%": "Zoom: {zoom}%",
  "Xoay 90°": "Rotate 90°",
  "Chọn ảnh khác": "Choose another image",
  "Đang lưu...": "Saving...",

  // Admin settings page
  "Cài đặt Quản trị viên": "Admin Settings",
  "Quản lý tùy chọn nhận thông báo và cấu hình tài khoản Quản trị viên.": "Manage notification preferences and admin account configuration.",
  "Thông báo qua Email": "Email Notifications",
  "Cấu hình nhận thông báo qua email của tài khoản Quản trị viên.": "Configure email notifications for administrator account.",
  "Nhận thông báo email hệ thống": "Receive system email notifications",
  "Bật/tắt các thông báo email quản trị viên": "Toggle administrator email notifications",
  "Đã lưu cài đặt thông báo.": "Notification settings saved.",
  "Có lỗi xảy ra khi lưu cài đặt.": "An error occurred while saving settings.",
  "Đang tải cấu hình...": "Loading configuration...",

  // User settings page
  "Quản lý tùy chọn nhận thông báo và các thiết lập tài khoản khác.": "Manage notification preferences and other account settings.",
  "Thông báo Email": "Email Notifications",
  "Chọn các sự kiện bạn muốn nhận email thông báo để không bỏ lỡ thông tin quan trọng.": "Select the events you want to receive email notifications for so you don't miss important information.",
  "Nhận thông báo email": "Receive email notifications",
  "Bật/tắt toàn bộ thông báo gửi về email của bạn": "Enable/disable all notifications sent to your email",
  "Học sinh xin vào lớp": "Student join requests",
  "Nhận email khi có học sinh gửi yêu cầu tham gia vào lớp học của bạn.": "Receive an email when a student requests to join your classroom.",
  "Học sinh nộp bài": "Student submissions",
  "Nhận email mỗi khi có học sinh hoàn thành và nộp bài tập mới.": "Receive an email whenever a student completes and submits an assignment.",
  "Có bài tập mới": "New assignment published",
  "Nhận email ngay khi giáo viên giao một bài tập mới cho lớp của bạn.": "Receive an email as soon as the teacher assigns a new assignment to your class.",
  "Bài đã được chấm": "Assignment graded",
  "Nhận email khi giáo viên đã hoàn tất việc chấm điểm và nhận xét bài làm của bạn.": "Receive an email when the teacher has finished grading and reviewing your submission.",
  "Nhắc nhở sắp đến hạn": "Deadline reminder",
  "Hệ thống tự động gửi email nhắc nhở trước 24 giờ khi bài tập sắp hết hạn.": "System automatically sends an email reminder 24 hours before the assignment is due.",
  "Không có tùy chọn thông báo nào khả dụng cho tài khoản của bạn lúc này.": "No notification preferences available for your account at this moment.",

  // Change password card
  "Đổi mật khẩu": "Change Password",
  "Cập nhật mật khẩu đăng nhập cá nhân để tăng cường bảo mật cho tài khoản của bạn.": "Update your personal login password to enhance account security.",
  "Đổi mật khẩu thành công. Đang đăng xuất...": "Password changed successfully. Logging out...",
  "Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.": "An error occurred while changing password. Please try again.",
  "Đang kiểm tra trạng thái tài khoản...": "Checking account status...",
  "Vui lòng nhập mật khẩu hiện tại.": "Please enter your current password.",
  "Vui lòng nhập mật khẩu mới.": "Please enter a new password.",
  "Mật khẩu mới không được vượt quá 24 ký tự.": "New password must not exceed 24 characters.",
  "Mật khẩu xác nhận không trùng khớp với mật khẩu mới.": "Confirmation password does not match new password.",
  "Mật khẩu mới không được trùng với mật khẩu hiện tại. Vui lòng nhập một mật khẩu khác.": "New password cannot be the same as current password. Please enter a different password.",
  "Mật khẩu hiện tại": "Current Password",
  "Nhập mật khẩu hiện tại": "Enter current password",
  "Quên mật khẩu?": "Forgot password?",
  "Mật khẩu mới": "New Password",
  "Tối thiểu 8 ký tự (hoa, thường, số, ký tự đặc biệt)": "At least 8 characters (uppercase, lowercase, number, special char)",
  "Xác nhận mật khẩu mới": "Confirm New Password",
  "Nhập lại mật khẩu mới": "Re-enter new password",
  "Đang xử lý...": "Processing...",
  "Mật khẩu bị trùng lặp": "Duplicate Password",
  "Mật khẩu mới không được trùng với mật khẩu hiện tại hoặc 3 mật khẩu đã từng sử dụng gần đây.": "New password cannot match current password or 3 recently used passwords.",
  "Đã hiểu": "Got it",

  // Set password card
  "Thiết lập mật khẩu đăng nhập": "Set Login Password",
  "Tài khoản của bạn được liên kết qua Google. Thiết lập mật khẩu riêng để có thể đăng nhập trực tiếp bằng Email & Mật khẩu.": "Your account is linked with Google. Set an individual password to log in directly with Email & Password.",
  "Mã OTP đã được gửi": "OTP Code Sent",
  "Vui lòng kiểm tra hộp thư Gmail của bạn (kể cả thư mục Spam).": "Please check your Gmail inbox (including Spam folder).",
  "Không thể gửi mã OTP. Vui lòng thử lại sau.": "Cannot send OTP code. Please try again later.",
  "Lỗi gửi OTP": "Error Sending OTP",
  "Thiết lập thành công": "Setup Successful",
  "Đã tạo mật khẩu đăng nhập thành công. Đang đăng xuất...": "Login password created successfully. Logging out...",
  "Có lỗi xảy ra khi thiết lập mật khẩu. Vui lòng thử lại.": "An error occurred while setting password. Please try again.",
  "Vui lòng nhập mã xác thực OTP 6 chữ số.": "Please enter the 6-digit OTP verification code.",
  "Xác thực Email ({email})": "Email Verification ({email})",
  "Bấm nút để nhận mã OTP 6 số bảo mật trước khi đặt mật khẩu.": "Click button to receive secure 6-digit OTP code before setting password.",
  "Gửi lại sau ({cooldown}s)": "Resend in ({cooldown}s)",
  "Gửi mã OTP": "Send OTP Code",
  "Mã xác thực OTP (6 số)": "OTP Verification Code (6 digits)",
  "Nhập 6 số OTP gửi về Gmail": "Enter 6-digit OTP sent to Gmail",
  "Đang thiết lập...": "Setting up...",
  "Xác nhận & Lưu mật khẩu": "Confirm & Save Password",
  "Mật khẩu mới không được trùng với 3 mật khẩu đã từng sử dụng gần đây.": "New password cannot match 3 recently used passwords.",

  // Password strength meter
  "Mật khẩu phải có tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (!@#$%^&*...).": "Password must be at least 8 characters long, including at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (!@#$%^&*...).",
  "Tối thiểu 8 ký tự": "At least 8 characters",
  "Có chữ cái in hoa (A-Z)": "Contains uppercase letter (A-Z)",
  "Có chữ cái thường (a-z)": "Contains lowercase letter (a-z)",
  "Có chữ số (0-9)": "Contains number (0-9)",
  "Có ký tự đặc biệt (!@#$%^&*)": "Contains special character (!@#$%^&*)",
  "yếu": "Weak",
  "trung bình": "Fair",
  "khá": "Good",
  "mạnh": "Strong"
};

let count = 0;
for (const [k, v] of Object.entries(updates)) {
  if (!vi[k]) {
    vi[k] = k;
  }
  en[k] = v;
  count++;
}

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
console.log('Synchronized ' + count + ' profile & settings keys successfully');
