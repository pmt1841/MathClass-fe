const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'dictionaries', 'en.json');
const viPath = path.join(__dirname, '..', 'dictionaries', 'vi.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));

const newUpdates = {
  // 1. Credit Top-up Package names
  "Gói Cơ bản": "Basic Package",
  "Gói Pro": "Pro Package",
  "Gói VIP": "VIP Package",
  "Gói Nâng cao": "Advanced Package",
  "Gói Tiêu chuẩn": "Standard Package",
  "Gói Học sinh": "Student Package",
  "Gói Giáo viên": "Teacher Package",
  "Gói Doanh nghiệp": "Enterprise Package",

  // 2. System Logs page & Table headers & Filters
  "Nhật ký hệ thống": "System Logs",
  "Nhật ký Hệ thống": "System Logs",
  "Nhật Ký Hệ Thống": "System Logs",
  "Theo dõi vết thao tác quản trị dữ liệu và nhật ký sự cố hệ thống.": "Audit data administration activities and system incident logs.",
  "Cập nhật danh sách nhật ký mới nhất": "Update latest system logs",
  "Người thực hiện (Email)": "Actor (Email)",
  "Mô tả hành động": "Action Description",
  "Địa chỉ IP": "IP Address",
  "Địa chỉ IP:": "IP Address:",
  "Không tìm thấy dữ liệu nhật ký nào.": "No system logs found.",
  "Tất cả danh mục": "All categories",
  "Cấu hình AI": "AI Configuration",
  "Lưu trữ Đám mây": "Cloud Storage",
  "Giao dịch Credit": "Credit Transactions",
  "Kho tài nguyên": "Resource Library",
  "Từ": "From",
  "Đến": "To",
  "trang": "page",
  "Trang trước": "Previous page",
  "Trang sau": "Next page",
  "Hiển thị {count} / {total} bản ghi log": "Showing {count} / {total} log records",
  "Chi tiết Nhật ký Hệ thống #{id}": "System Log Details #{id}",
  "Thông tin chi tiết về ngữ cảnh thực thi thao tác và môi trường hệ thống.": "Detailed information about action execution context and system environment.",
  "Thời gian thực thi:": "Execution Time:",
  "Trạng thái:": "Status:",
  "Cấp độ:": "Level:",
  "Danh mục phân hệ:": "Module Category:",
  "Người thực hiện:": "Actor:",
  "Mô tả hành động:": "Action Description:",
  "Thông tin kỹ thuật (Dành cho Kỹ thuật viên & Kiểm toán)": "Technical Details (For Technicians & Auditors)",
  "Mã tài nguyên (Resource ID):": "Resource ID:",
  "Thiết bị & Trình duyệt (User-Agent):": "Device & Browser (User-Agent):",
  "Thêm mới Nhà cung cấp AI": "Create new AI Provider",
  "Cập nhật thông tin Nhà cung cấp AI": "Update AI Provider details",
  "Xóa Nhà cung cấp AI": "Delete AI Provider",
  "Thêm mới API Key AI": "Add new AI API Key",
  "Xóa API Key AI": "Delete AI API Key",
  "Thay đổi trạng thái API Key AI": "Change AI API Key status",
  "Cập nhật thông tin API Key AI": "Update AI API Key details",
  "Cập nhật cấu hình tác vụ AI": "Update AI task configuration",
  "Cập nhật System Prompt": "Update System Prompt",
  "Khôi phục System Prompt về mặc định": "Reset System Prompt to default",
  "Hoàn tác System Prompt về phiên bản trước": "Rollback System Prompt to previous version"
};

for (const [k, v] of Object.entries(newUpdates)) {
  en[k] = v;
  if (vi[k] === undefined) {
    vi[k] = k;
  }
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2) + '\n', 'utf8');

console.log('Successfully updated en.json and vi.json with ' + Object.keys(newUpdates).length + ' additional keys.');
