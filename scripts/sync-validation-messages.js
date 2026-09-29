const fs = require('fs');
const path = require('path');

const viPath = path.join(__dirname, '..', 'dictionaries', 'vi.json');
const enPath = path.join(__dirname, '..', 'dictionaries', 'en.json');

const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const validationMessages = {
  // Common & Auth validations
  "Email là bắt buộc": "Email is required",
  "Email không hợp lệ": "Invalid email address",
  "Mật khẩu là bắt buộc": "Password is required",
  "Vui lòng xác nhận mật khẩu": "Please confirm your password",
  "Mật khẩu xác nhận không khớp": "Passwords do not match",
  "Mật khẩu không khớp.": "Passwords do not match.",
  "Mật khẩu không khớp": "Passwords do not match",
  "Họ và tên phải có ít nhất 2 ký tự": "Full name must be at least 2 characters",
  "Họ và tên chỉ được chứa chữ cái và khoảng trắng": "Full name can only contain letters and spaces",
  "Số điện thoại phải có đúng 10 chữ số": "Phone number must have exactly 10 digits",
  "Mật khẩu phải có ít nhất 8 ký tự": "Password must be at least 8 characters",
  "Mật khẩu phải có ít nhất 8 ký tự.": "Password must be at least 8 characters.",
  "Mật khẩu không được vượt quá 24 ký tự.": "Password must not exceed 24 characters.",
  "Mật khẩu phải chứa ít nhất một chữ hoa": "Password must contain at least one uppercase letter",
  "Mật khẩu phải chứa ít nhất một chữ thường": "Password must contain at least one lowercase letter",
  "Mật khẩu phải chứa ít nhất một chữ số": "Password must contain at least one number",
  "Mật khẩu phải chứa ít nhất một ký tự đặc biệt": "Password must contain at least one special character",

  // Profile Form
  "Họ tên không được để trống": "Full name cannot be empty",
  "Họ tên quá dài": "Full name is too long",
  "Số điện thoại không được để trống": "Phone number cannot be empty",
  "Số điện thoại không hợp lệ": "Invalid phone number",

  // Bug Report Form
  "Vui lòng chọn loại lỗi bạn gặp phải": "Please select the error type you encountered",
  "Vui lòng nhập mã OTP xác thực 6 số đã gửi về email": "Please enter the 6-digit OTP verification code sent to your email",
  "Bạn chỉ được phép đính kèm tối đa 3 ảnh": "You are only allowed to attach a maximum of 3 images",

  // Create Class Modal
  "Vui lòng điền tên lớp học": "Please enter class name",
  "Số học sinh phải là số nguyên": "Number of students must be an integer",
  "Số học sinh tối đa phải lớn hơn 0": "Maximum number of students must be greater than 0",

  // Assignment Form
  "Tiêu đề bài tập không được để trống": "Assignment title cannot be empty",
  "Nội dung bài tập không được để trống": "Assignment content cannot be empty",
  "Chưa nhập tiêu đề": "No title entered",

  // AI & Admin System Prompt Form
  "Vui lòng nhập tên hiển thị cho System Prompt": "Please enter a display name for the System Prompt",
  "Vui lòng nhập nội dung System Prompt": "Please enter the System Prompt content",

  // Roles
  "Giáo viên": "Teacher",
  "Học sinh": "Student",
  "Quản trị viên": "Administrator"
};

let count = 0;
for (const [key, value] of Object.entries(validationMessages)) {
  if (!vi[key]) {
    vi[key] = key;
  }
  if (!en[key] || en[key] === key) {
    en[key] = value;
    count++;
  }
}

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');

console.log(`Synced ${count} validation messages into vi.json and en.json.`);
