# Specification: Student - Teacher Private Realtime Chat UI (`MathClass-fe`)

## 1. Executive Summary & Objectives

Tài liệu đặc tả yêu cầu cho phần Frontend (`MathClass-fe`) của tính năng **Chat riêng thời gian thực giữa Học sinh và Giảng viên trong Lớp học**.

### Các mục tiêu chính:
1. **Quản lý Kết nối Realtime:** Tích hợp `@stomp/stompjs` để kết nối WebSocket STOMP tới backend `/ws-chat`, nhận tin nhắn thời gian thực và tự động reconnect.
2. **Giao diện Học sinh:** Popover/Widget Chat góc màn hình trong Lớp học để trao đổi trực tiếp với Giảng viên dạy lớp đó.
3. **Giao diện Giảng viên:** Khung Chat 1-1 tích hợp danh sách Học sinh của lớp (có đếm số tin nhắn chưa đọc `unreadCount`).
4. **Render Công thức Toán:** Bong bóng tin nhắn tự động chuyển đổi công thức LaTeX dạng `$E=mc^2$` thành công thức Toán học đẹp mắt bằng `rehype-katex` và `remark-math`.

---

## 2. Acceptance Criteria Checklist (AC)

- [ ] **AC-FE-01:** Đã cài đặt và cấu hình `@stomp/stompjs` và `sockjs-client`.
- [ ] **AC-FE-02:** Hook `useClassChat` quản lý thành công việc kết nối STOMP, subscribe channel `/topic/classroom/{classId}/student/{studentId}` và tự ngắt kết nối khi unmount.
- [ ] **AC-FE-03:** Phía Học sinh: Có Widget Chat góc phải màn hình trong Lớp học (`/classes/[classCode]/student`), mở ra hiển thị thông tin Giảng viên và ô nhập tin nhắn.
- [ ] **AC-FE-04:** Phía Giảng viên: Trong trang Lớp học (`/classes/[classCode]/teacher`), hiển thị danh sách Học sinh và khung chat 1-1 tương ứng khi chọn một học sinh.
- [ ] **AC-FE-05:** Tự động cuộn xuống tin nhắn mới nhất khi mở chat hoặc khi có tin nhắn mới tới.
- [ ] **AC-FE-06:** Hiển thị mượt mà các công thức toán LaTeX nhập trong ô chat bằng `react-markdown` + `rehype-katex`.
- [ ] **AC-FE-07:** Tự động đánh dấu tin nhắn là "đã đọc" khi mở khung chat.

---

## 3. Component Architecture & Custom Hooks

### 3.1. Custom Hook `useClassChat.ts` (`@/hooks/useClassChat.ts`)
* **Chức năng:**
  * Gọi API `GET /api/v1/classes/{classCode}/chat/messages` lấy lịch sử tin nhắn ban đầu.
  * Thiết lập kết nối STOMP client WebSocket.
  * Subscribe channel `/topic/classroom/${classId}/student/${studentId}`.
  * Phương thức `sendMessage(content: string)` gửi payload qua `/app/chat.send`.
  * Phương thức `markAsRead()` gọi API `PUT /api/v1/classes/{classCode}/chat/messages/read`.

### 3.2. Components Breakdown
1. **`ClassroomStudentChatWidget.tsx`**
   * Vị trí: `app/(dashboard)/classes/[classCode]/student/_components/ClassroomStudentChatWidget.tsx`
   * Dành cho Học sinh trong lớp.
2. **`ClassroomTeacherChatPanel.tsx`**
   * Vị trí: `app/(dashboard)/classes/[classCode]/teacher/_components/ClassroomTeacherChatPanel.tsx`
   * Dành cho Giảng viên quản lý lớp.
3. **`ChatMessageItem.tsx`**
   * Dynamic rendering bong bóng tin nhắn (Sender vs Receiver), avatar, timestamp và Markdown KaTeX parsing.

---

## 4. UI/UX & KaTeX Rendering Specification

```tsx
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";

export function ChatMessageItem({ content, isMe }: { content: string; isMe: boolean }) {
  return (
    <div className={`p-3 rounded-xl max-w-[80%] ${isMe ? "bg-indigo-600 text-white ml-auto" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeSanitize]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

---

## 5. Unit Test Cases Checklist

- [ ] **UT-FE-01:** `useClassChat` tự động load lịch sử tin nhắn khi được mount.
- [ ] **UT-FE-02:** Tin nhắn mới từ STOMP WebSocket được append đúng vào mảng state `messages`.
- [ ] **UT-FE-03:** Hiển thị đúng giao diện Học sinh khi đăng nhập vai trò Student.
- [ ] **UT-FE-04:** Hiển thị đúng danh sách Học sinh kèm badge unreadCount ở giao diện Giảng viên.
- [ ] **UT-FE-05:** Render chính xác công thức KaTeX toán học `$E = mc^2$` trong tin nhắn.
