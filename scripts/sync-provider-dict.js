const fs = require('fs');
const path = require('path');
const viPath = path.join(__dirname, '../dictionaries/vi.json');
const enPath = path.join(__dirname, '../dictionaries/en.json');
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const updates = {
  'Thêm Nhà cung cấp AI (Provider)': 'Add AI Provider',
  'Thêm nhà cung cấp dịch vụ AI mới vào hệ thống (Mã provider viết hoa, duy nhất).': 'Add a new AI service provider to the system (Uppercase provider code, unique).',
  'Chỉnh sửa Provider: {name}': 'Edit Provider: {name}',
  'Cập nhật thông tin cấu hình nhà cung cấp dịch vụ AI.': 'Update AI service provider configuration details.',
  'Mã Provider (Code)': 'Provider Code',
  'VD: GEMINI, OPENAI, DEEPSEEK, MISTRAL, OLLAMA': 'e.g. GEMINI, OPENAI, DEEPSEEK, MISTRAL, OLLAMA',
  'Chỉ chứa chữ cái viết hoa, số và dấu gạch dưới. Không thể sửa sau khi tạo.': 'Only uppercase letters, numbers, and underscores allowed. Cannot be changed after creation.',
  'Tên hiển thị': 'Display Name',
  'VD: Google Gemini, DeepSeek AI, OpenAI...': 'e.g. Google Gemini, DeepSeek AI, OpenAI...',
  'Base URL Endpoint (HTTPS)': 'Base URL Endpoint (HTTPS)',
  'Giao thức API (Protocol)': 'API Protocol',
  '-- Chọn giao thức API --': '-- Select API Protocol --',
  'OPENAI_COMPATIBLE (Chuẩn OpenAI / DeepSeek / Groq / Ollama / Mistral...)': 'OPENAI_COMPATIBLE (OpenAI / DeepSeek / Groq / Ollama / Mistral standard...)',
  'GOOGLE_GEMINI_COMPATIBLE (Chuẩn Google Gemini REST API)': 'GOOGLE_GEMINI_COMPATIBLE (Google Gemini REST API standard)',
  'ANTHROPIC_COMPATIBLE (Chuẩn Anthropic Claude API)': 'ANTHROPIC_COMPATIBLE (Anthropic Claude API standard)',
  'CUSTOM_REST (Tùy chỉnh linh hoạt 100% cho AI mới)': 'CUSTOM_REST (100% customizable for new AI models)',
  '⚙️ Thông số Tùy chỉnh Giao thức Custom REST:': '⚙️ Custom REST Protocol Parameters:',
  'Tên Header Xác thực': 'Auth Header Name',
  'Tiền tố Header': 'Header Prefix',
  'Query Param Xác thực': 'Auth Query Param',
  'key hoặc api_key': 'key or api_key',
  'Đường dẫn Test Endpoint': 'Test Endpoint Path',
  'API Key ban đầu (Plaintext - Tùy chọn)': 'Initial API Key (Plaintext - Optional)',
  'Nhập API Key ban đầu nếu muốn tạo ngay...': 'Enter initial API Key if creating immediately...',
  'Chiến lược chọn Key (Key Strategy)': 'Key Strategy',
  'Chọn chiến lược': 'Select strategy',
  'PRIORITY (Ưu tiên theo độ ưu tiên cao nhất)': 'PRIORITY (Prioritize highest priority first)',
  'ROUND_ROBIN (Luân phiên chia đều tải)': 'ROUND_ROBIN (Round-robin load balancing)',
  'Trạng thái hoạt động': 'Active Status',
  'Chọn trạng thái': 'Select status',
  'ACTIVE (Hoạt động)': 'ACTIVE (Active)',
  'INACTIVE (Vô hiệu hóa)': 'INACTIVE (Disabled)',
  'Thêm Provider': 'Add Provider',
  'Chưa chọn giao thức': 'Protocol not selected',
  'Vui lòng chọn giao thức API (Protocol) cho Provider.': 'Please select an API Protocol for the Provider.',
  'Tạo Provider thành công': 'Created Provider successfully',
  'Đã tạo Provider {name} ({code})': 'Created Provider {name} ({code})',
  'Tạo Provider thất bại': 'Failed to create Provider',
  'Cập nhật Provider thành công': 'Updated Provider successfully',
  'Cập nhật Provider thất bại': 'Failed to update Provider',
  'Bạn có chắc chắn muốn xóa Provider "{name}" không?': 'Are you sure you want to delete Provider "{name}"?',
  'Xóa Provider thành công': 'Deleted Provider successfully',
  'Xóa Provider thất bại': 'Failed to delete Provider',
  'Thêm mới API Key AI': 'Add New AI API Key',
  'Thêm API Key cho {provider}': 'Add API Key for {provider}',
  'Chỉnh sửa API Key: {name}': 'Edit API Key: {name}',
  'nhà cung cấp': 'provider',
  'Nhập chuỗi API Key. Hệ thống sẽ tự động mã hóa AES-256-GCM trước khi lưu xuống CSDL.': 'Enter API Key string. System will automatically encrypt with AES-256-GCM before saving to database.',
  'Cập nhật tên gợi nhớ, độ ưu tiên hoặc nhập chuỗi API Key mới để thay thế.': 'Update friendly name, priority, or enter new API Key string to replace.',
  'Tên gợi nhớ (Tùy chọn)': 'Friendly Name (Optional)',
  'VD: Gemini Chấm bài 01': 'e.g. Gemini Auto-grade 01',
  'Chuỗi API Key': 'API Key String',
  'Chuỗi API Key mới (Để trống nếu giữ nguyên)': 'New API Key String (Leave blank to keep unchanged)',
  'Nhập chuỗi API Key tại đây...': 'Enter API Key string here...',
  'Nhập nếu muốn đổi Key mới...': 'Enter if you want to replace Key...',
  'Key hiện tại: {key}': 'Current Key: {key}',
  'Đã mã hóa': 'Encrypted',
  'Mã API Key sẽ được che mờ an toàn trên giao diện sau khi tạo.': 'API Key will be safely masked on the interface after creation.',
  'Mức độ ưu tiên': 'Priority Level',
  'Số càng lớn độ ưu tiên càng cao (áp dụng khi Provider dùng chiến lược PRIORITY).': 'Higher number means higher priority (applies when Provider uses PRIORITY strategy).',
  'Lưu Key': 'Save Key',
  'Lưu thay đổi': 'Save Changes',
  'Thêm API Key thành công': 'Added API Key successfully',
  'Đã thêm Key mới cho Provider {name}': 'Added new Key for Provider {name}',
  'Thêm Key thất bại': 'Failed to add Key',
  'Cập nhật API Key thành công': 'Updated API Key successfully',
  'Đã cập nhật thông tin Key #{id}': 'Updated Key #{id} details',
  'Cập nhật Key thất bại': 'Failed to update Key',
  'Đã chuyển trạng thái Key sang {status}': 'Switched Key status to {status}',
  'Cập nhật trạng thái Key thất bại': 'Failed to update Key status',
  'Bạn có chắc chắn muốn xóa API Key này không?': 'Are you sure you want to delete this API Key?',
  'Xóa Key thành công': 'Deleted Key successfully',
  'Xóa Key thất bại': 'Failed to delete Key',
  '⚡ Kiểm tra Key hợp lệ!': '⚡ Key verification successful!',
  'Key hoạt động bình thường. Độ trễ: {ms} ms.': 'Key is operational. Latency: {ms} ms.',
  '❌ Key không hợp lệ hoặc hết Quota': '❌ Invalid Key or Quota Exceeded',
  'Kiểm tra thất bại': 'Verification failed',
  'Trạng thái Key đã được chuyển thành INACTIVE.': 'Key status has been set to INACTIVE.'
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
console.log('Synchronized ' + count + ' keys successfully');
