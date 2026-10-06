# 🤖 Cổng Quản Trị AI Subsystem (Admin AI Subsystem Portal)

Module quản trị cấu hình AI dành riêng cho Quản trị viên hệ thống tại đường dẫn `/admin/ai-config`. Module này cho phép quản lý toàn diện các nhà cung cấp mô hình trí tuệ nhân tạo (AI Providers), mã khóa API (API Keys), định tuyến tác vụ (Task Routing) và biên tập System Prompts.

---

## 1. Cấu Trúc Giao Diện `/admin/ai-config`

Giao diện được tổ chức theo hệ thống Tabs tối ưu trải nghiệm người dùng:

1. **Tab 1: AI Providers & Models (`ProviderTab`)**
   - Danh sách nhà cung cấp được hỗ trợ: OpenAI, Google Gemini, Anthropic Claude, DeepSeek, Groq, Ollama (Local LLM).
   - Bật/tắt trạng thái hoạt động của từng Provider.
   - Thêm/bớt danh sách model thuộc Provider (ví dụ: `gpt-4o`, `gemini-1.5-pro`, `claude-3-5-sonnet`).

2. **Tab 2: API Keys Management (`ApiKeyDialog`)**
   - Quản lý API Key cho từng nhà cung cấp.
   - Toàn bộ API Key được Backend mã hóa bảo mật chuẩn **AES-256**.
   - Hỗ trợ nút "Kiểm tra kết nối" (Ping/Validate Key) ngay trên giao diện trước khi lưu.

3. **Tab 3: Task Routing (`TaskRoutingTab`)**
   - Phân bổ linh hoạt từng tác vụ toán học tới mô hình phù hợp nhất:
     - *Sinh câu hỏi toán học:* Ưu tiên mô hình suy luận tốt (VD: Claude 3.5 Sonnet hoặc GPT-4o).
     - *Gợi ý giải bài:* Chọn mô hình phản hồi nhanh và chi phí thấp (VD: Gemini 1.5 Flash hoặc Groq).
     - *Chấm điểm tự động:* Chọn mô hình có khả năng phân tích logic chặt chẽ.
   - Tinh chỉnh tham số: `Temperature`, `Top-P`, `Max Tokens`, `Presence Penalty`.

4. **Tab 4: System Prompts & Versioning (`SystemPromptTab`)**
   - Quản lý kho Prompt hệ thống theo từng tác vụ.
   - Hỗ trợ Versioning (Lịch sử các phiên bản Prompt) và nút Rollback về phiên bản cũ.
   - **Live Sandbox / Prompt Preview:** Cho phép quản trị viên thử nghiệm câu lệnh với input mẫu và nhận kết quả trực tiếp từ LLM trước khi kích hoạt chính thức.

5. **Tab 5: Quản Lý Hạn Ngạch & Gói Credit (`CreditQuotaTab`)**
   - Thiết lập số credit tiêu tốn cho từng loại request AI.
   - Tạo và chỉnh sửa các gói nạp credit hiển thị cho người dùng.
