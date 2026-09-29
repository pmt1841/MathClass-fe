const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'dictionaries', 'en.json');
const viPath = path.join(__dirname, '..', 'dictionaries', 'vi.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));

const promptTranslations = {
  // 1. Prompt titles
  "Prompt Gợi ý Tư duy Làm bài": "Thinking Hints Prompt",
  "Prompt Nhận diện Chữ viết tay sang LaTeX": "Handwriting to LaTeX Recognition Prompt",
  "Prompt Nắn chỉnh Nét vẽ Phác thảo sang JSXGraph Canvas": "Sketch to JSXGraph Canvas Correction Prompt",
  "Prompt Chấm bài tự luận tự động": "Automated Essay Grading Prompt",
  "Prompt Sinh Bài tập Toán": "Math Problem Generation Prompt",
  "Prompt Tạo Hàng Loạt Bài Tập từ Tài Liệu": "Batch Problem Generation from Document Prompt",
  "Prompt AI Đánh giá & Nhận xét Học sinh": "AI Student Assessment & Remarks Prompt",

  // 2. Prompt descriptions
  "Đưa ra gợi ý định hướng từng bước theo phương pháp Socratic, tuyệt đối không cho đáp án trực tiếp.": "Provide step-by-step guidance using the Socratic method, never give direct answers.",
  "Phân tích ảnh chữ viết tay/công thức toán và trích xuất mã LaTeX/KaTeX hợp lệ.": "Analyze handwriting/math formulas from images and extract valid LaTeX/KaTeX code.",
  "Phân tích ảnh nét vẽ phác thảo hình học/đồ thị hàm số và chuyển đổi thành cấu trúc JSON JSXGraph chuẩn.": "Analyze sketch drawings of geometry/function graphs and convert into standard JSXGraph JSON structure.",
  "Chấm điểm và nhận xét chi tiết bài làm tự luận.": "Grade and provide detailed feedback on student essay submissions.",
  "Tự động tạo bài tập tự luận môn Toán.": "Automatically generate math essay problems.",
  "Tự động phân tích và bóc tách tài liệu/file đề thi thành danh sách các bài tập toán.": "Automatically analyze and extract exam document/file into a list of math exercises.",
  "Phân tích dữ liệu học tập và sinh nhận xét đánh giá định tính cho học sinh theo mốc thời gian.": "Analyze learning data and generate qualitative assessment feedback for students over time.",

  // 3. Dialogs titles & labels
  "Lịch sử phiên bản: {name}": "Version History: {name}",
  "Thử nghiệm Prompt: {name}": "Test Prompt: {name}",
  "Chỉnh sửa System Prompt": "Edit System Prompt",
  "Chỉnh sửa câu lệnh điều khiển AI. Mọi thay đổi sẽ được lưu vào lịch sử phiên bản.": "Edit AI control prompt. All changes will be saved to version history.",
  "Cập nhật thành công!": "Updated successfully!",
  "Cấu hình System Prompt đã được lưu.": "System Prompt configuration has been saved.",
  "Lỗi lưu Prompt": "Error saving Prompt",
  "Không thể lưu System Prompt": "Unable to save System Prompt",
  "Rollback thành công!": "Rollback successful!",
  "Đã khôi phục prompt về phiên bản v{version}.": "Restored prompt to version v{version}.",
  "Rollback thất bại": "Rollback failed",
  "Không thể rollback phiên bản": "Unable to rollback version"
};

for (const [k, v] of Object.entries(promptTranslations)) {
  en[k] = v;
  if (vi[k] === undefined) {
    vi[k] = k;
  }
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2) + '\n', 'utf8');

console.log('Successfully updated en.json and vi.json with ' + Object.keys(promptTranslations).length + ' prompt translation keys.');
