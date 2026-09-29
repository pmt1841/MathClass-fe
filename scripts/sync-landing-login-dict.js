const fs = require('fs');
const path = require('path');

const viPath = path.join(__dirname, '..', 'dictionaries', 'vi.json');
const enPath = path.join(__dirname, '..', 'dictionaries', 'en.json');

const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newTranslations = {
  // Login form & Header additions
  "Giáo viên": "Teacher",
  "Học sinh": "Student",
  "Quản trị viên": "Administrator",
  "Đăng ký {role}": "Sign up as {role}",
  "Đăng nhập {role}": "Log in as {role}",
  "Dùng thử miễn phí": "Try for free",
  "Nhập thông tin để truy cập tài khoản của bạn": "Enter your credentials to access your account",
  "Cổng Quản trị hệ thống": "System Administration Portal",
  "Cổng Giáo viên & Học sinh": "Teacher & Student Portal",
  "Nhập email": "Enter email",
  "Mật khẩu": "Password",
  "Nhập mật khẩu": "Enter password",
  "Giữ đăng nhập": "Remember me",
  "Quên mật khẩu?": "Forgot password?",
  "Đang đăng nhập...": "Logging in...",
  "Đăng nhập": "Log in",
  "Chưa có tài khoản?": "Don't have an account?",
  "Đăng ký ngay": "Sign up now",
  "hoặc tiếp tục với": "or continue with",
  "Đăng nhập bằng Google": "Sign in with Google",
  "Gặp sự cố? Báo cáo lỗi hệ thống": "Experiencing issues? Report system error",

  // Landing Page: Hero
  "Nền tảng Toán học Trực quan & Tương tác": "Interactive & Visual Mathematics Platform",
  "Hiểu Toán sâu hơn —": "Understand Math deeper —",
  "bằng cách nhìn thấy nó.": "by seeing it.",
  "Dạy và học toán theo cách thông minh hơn": "Teach and learn math the smarter way",
  "Tôi là Giáo viên": "I am a Teacher",
  "Tôi là Học sinh": "I am a Student",
  "Học tương tác trực tiếp trên trình duyệt": "Learn interactively directly in the browser",
  "Miễn phí trải nghiệm": "Free to explore",
  "Không cần cài đặt": "No installation required",

  // Landing Page: Features
  "Hình Học Tương Tác": "Interactive Geometry",
  "Vẽ và khám phá hình học trực tiếp — kéo điểm, quan sát góc thay đổi, kiểm chứng định lý ngay tức thì. Học bằng tay thay vì chỉ nhìn vào sách.": "Draw and explore geometry hands-on — drag points, observe angles change, and verify theorems instantly. Learn by doing instead of just reading textbooks.",
  "Đồ Thị & Hàm Số": "Graphs & Functions",
  "Nhập hàm số, quan sát đồ thị biến đổi theo thời gian thực. Khảo sát cực trị, tìm giao điểm, hiểu ý nghĩa hình học của đạo hàm một cách trực quan.": "Input functions and observe graph transforms in real time. Examine extrema, find intersections, and visually grasp the geometric meaning of derivatives.",
  "Soạn Thảo Công Thức": "Formula Editor",
  "Gõ và trình bày công thức Toán đẹp, chuẩn xác — từ phân số, căn thức đến ma trận và tích phân. Không cần LaTeX, không cần Word.": "Type and present beautiful, accurate math formulas — from fractions and roots to matrices and integrals. No LaTeX, no Word required.",
  "Bài Học & Bài Tập": "Lessons & Assignments",
  "Giáo viên thiết kế bài học tích hợp công cụ trực quan, giao bài tập cho từng lớp. Học viên làm bài ngay trong môi trường tương tác, giáo viên nhận xét trực tiếp.": "Teachers design lessons with integrated visual tools and assign homework per class. Students solve problems in an interactive workspace, with direct teacher feedback.",
  "Học Toán Theo Cách Bạn Chưa Thử": "Learn Math in a Way You've Never Tried",
  "Bộ công cụ tương tác được thiết kế riêng cho Toán — giúp học viên thực sự hiểu, không chỉ làm theo công thức.": "Interactive toolkit tailor-made for math — helping learners truly understand concepts rather than just following formulas.",

  // Landing Page: Experience
  "Thiết kế cho cả Giáo viên lẫn Học viên": "Designed for both Teachers and Students",
  "Một nền tảng — hai luồng trải nghiệm tối ưu cho từng vai trò.": "One platform — two optimized experiences tailored for each role.",
  "Học viên": "Student",
  "Soạn bài, giao bài —": "Craft lessons, assign homework —",
  "mọi thứ trong một không gian": "everything in a single workspace",
  "Giáo viên không chỉ giao đề, mà còn có thể nhúng hình học tương tác, đồ thị và công cụ vẽ trực tiếp vào bài học.": "Teachers don't just assign questions; they can embed interactive geometry, graphs, and drawing tools directly into lessons.",
  "Tạo bài học tích hợp công cụ trực quan (hình, đồ thị, công thức)": "Create lessons integrated with visual tools (geometry, graphs, formulas)",
  "Giao bài tập cho từng lớp học, đặt deadline": "Assign homework to specific classes and set deadlines",
  "Xem & nhận xét bài làm của học viên trực tiếp": "Review & grade student submissions with inline feedback",
  "Theo dõi tiến độ học viên qua từng bài": "Track student progress across every assignment",
  "Giao diện giáo viên tạo bài tập": "Teacher interface for creating assignments",
  "Giao diện giáo viên nhận xét bài học viên": "Teacher interface for grading student submissions",
  "Học Toán bằng cách": "Learn math by",
  "khám phá, không chỉ ghi nhớ": "exploring, not just memorizing",
  "Kéo điểm để thấy góc thay đổi. Điều chỉnh hệ số để đồ thị biến hình. Toán học trở nên sống động khi bạn tương tác với nó.": "Drag points to see angles shift. Tweak coefficients to morph curves. Mathematics comes alive when you interact with it.",
  "Học qua công cụ hình học & đồ thị tương tác như GeoGebra": "Learn with interactive geometry & graphing tools inspired by GeoGebra",
  "Làm bài tập ngay trong môi trường trực quan": "Complete assignments inside an intuitive visual environment",
  "Trình bày lời giải từng bước với công cụ soạn thảo": "Present step-by-step solutions with rich math editing tools",
  "Lưu nháp, xem lại bài làm bất cứ lúc nào": "Auto-save drafts and review your submissions anytime",
  "Giao diện học viên làm bài với công cụ soạn công thức": "Student interface with formula-assisted problem solving",
  "Giao diện học viên khám phá đồ thị tương tác": "Student interface exploring interactive graphing",

  // Landing Page: CTA
  "Bắt đầu khám phá Toán học theo cách mới": "Start Exploring Mathematics in a Whole New Way",
  "Dù bạn là giáo viên muốn xây dựng bài học sống động hay học viên muốn hiểu Toán thực sự — Math Class có đầy đủ công cụ bạn cần.": "Whether you are a teacher building dynamic lessons or a student eager to truly master math — Math Class has all the tools you need.",
  "Đã có tài khoản? Đăng nhập": "Already have an account? Log in",

  // Landing Page: Footer
  "Trao quyền cho học sinh thông qua học toán thông minh": "Empowering students through intelligent mathematics learning",
  "Sản phẩm": "Product",
  "Tính năng": "Features",
  "Giá cả": "Pricing",
  "Bảo mật": "Security",
  "Lộ trình phát triển": "Roadmap",
  "Công ty": "Company",
  "Giới thiệu": "About",
  "Blog": "Blog",
  "Tuyển dụng": "Careers",
  "Liên hệ": "Contact",
  "Pháp lý": "Legal",
  "Chính sách bảo mật": "Privacy Policy",
  "Điều khoản sử dụng": "Terms of Service",
  "Cookie": "Cookies",
  "Tuân thủ": "Compliance",
  "© 2026 Math Class. Tất cả quyền được bảo lưu.": "© 2026 Math Class. All rights reserved.",
  "Trạng thái": "Status",
  "Cập nhật": "Changelog",
  "Hỗ trợ": "Support"
};

let addedCount = 0;
for (const [key, value] of Object.entries(newTranslations)) {
  if (!vi[key]) {
    vi[key] = key;
  }
  if (!en[key] || en[key] === key) {
    en[key] = value;
    addedCount++;
  }
}

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');

console.log(`Synced ${addedCount} new landing & login translations.`);
