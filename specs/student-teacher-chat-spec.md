# Specification: Student - Teacher Private Realtime Chat UI (`MathClass-fe`)

## 1. Executive Summary & Objectives

Tài liệu đặc tả yêu cầu cho phần Frontend (`MathClass-fe`) của tính năng **Chat riêng thời gian thực giữa Học sinh và Giảng viên trong Lớp học**.

### Các mục tiêu chính:
1. **Quản lý Kết nối Realtime:** Tích hợp `@stomp/stompjs` để kết nối WebSocket STOMP tới backend `/ws-chat`, nhận tin nhắn thời gian thực và tự động reconnect.
2. **Giao diện Học sinh:** Popover/Widget Chat góc màn hình trong Lớp học (`enabled: true`) tự động kết nối Socket, báo Online và có huy hiệu đỏ nổi bật khi có tin nhắn mới.
3. **Giao diện Giảng viên:** Khung Chat 1-1 tích hợp danh sách Học sinh của lớp (có đếm số tin nhắn chưa đọc `unreadCount`, hiển thị chấm Online/Offline và lọc học sinh có tin nhắn mới lên đầu).
4. **Điều hướng Tự động từ Thông báo Header:** Nhấp vào thông báo tin nhắn mới ở thanh Header sẽ tự động mở đúng cửa sổ chat / tab chat của học sinh đó mà không cần bấm F5.
5. **Render Công thức Toán (KaTeX) & Múi giờ GMT+7:** Bong bóng tin nhắn tự động chuyển đổi công thức LaTeX dạng `$E=mc^2$` thành công thức Toán học đẹp mắt bằng `rehype-katex` + `remark-math` và hiển thị thời gian chính xác theo múi giờ Việt Nam.

---

## 2. Acceptance Criteria Checklist (AC)

- [x] **AC-FE-01:** Đã cài đặt và cấu hình `@stomp/stompjs` và `sockjs-client`.
- [x] **AC-FE-02:** Hook `useClassChat` quản lý thành công việc kết nối STOMP, subscribe channel `/topic/classroom/{classId}/student/{studentId}` và tự ngắt kết nối khi unmount.
- [x] **AC-FE-03:** Phía Học sinh: Có Widget Chat góc phải màn hình trong Lớp học (`/classes/[classCode]/student`), tự động mở khung chat khi truy cập từ thông báo (`chat=open`).
- [x] **AC-FE-04:** Phía Giảng viên: Trong trang Lớp học (`/classes/[classCode]`), tự động chuyển tab `chat` và chọn học sinh tương ứng khi truy cập từ thông báo (`tab=chat&studentId=...`).
- [x] **AC-FE-05:** Tự động cuộn xuống tin nhắn mới nhất khi mở chat hoặc khi có tin nhắn mới tới.
- [x] **AC-FE-06:** Hiển thị mượt mà các công thức toán LaTeX nhập trong ô chat bằng `react-markdown` + `rehype-katex`.
- [x] **AC-FE-07:** Tự động đánh dấu tin nhắn là "đã đọc" khi mở khung chat.
- [x] **AC-FE-08:** Hiển thị mốc thời gian tin nhắn chuẩn xác theo múi giờ địa phương GMT+7 thông qua `parseDateSafe` từ `@/lib/utils`.

---

## 3. Component Architecture & Custom Hooks

### 3.1. Custom Hook `useClassChat.ts` (`@/hooks/useClassChat.ts`)
* **Chức năng:**
  * Gọi API `GET /api/v1/classes/{classCode}/chat/messages` lấy lịch sử tin nhắn ban đầu.
  * Tự động reset `messages` và nạp lại lịch sử chat khi `studentId` hoặc `classId` thay đổi.
  * Thiết lập kết nối STOMP client WebSocket.
  * Subscribe channel `/topic/classroom/${classId}/student/${studentId}` và `/topic/classroom/${classId}/teacher`.
  * Phương thức `sendMessage(content: string)` gửi payload qua `/app/chat.send`.
  * Phương thức `markAsRead()` gọi API `PUT /api/v1/classes/{classCode}/chat/messages/read`.

### 3.2. Components Breakdown
1. **`ClassroomStudentChatWidget.tsx`**
   * Vị trí: `components/chat/ClassroomStudentChatWidget.tsx`
   * Dành cho Học sinh trong lớp, chứa nút bấm góc phải kèm huy hiệu số tin nhắn chưa đọc và hiển thị chấm Online/Offline của Giảng viên.
2. **`ClassroomTeacherChatPanel.tsx`**
   * Vị trí: `components/chat/ClassroomTeacherChatPanel.tsx`
   * Dành cho Giảng viên quản lý lớp, hiển thị danh sách Học sinh cuộn mượt (tối đa 6 học sinh vừa tầm nhìn), ưu tiên đẩy học sinh Online và có tin nhắn chưa đọc lên đầu.
3. **`ChatMessageItem.tsx`**
   * Dynamic rendering bong bóng tin nhắn (Sender vs Receiver), avatar, timestamp múi giờ GMT+7 và Markdown KaTeX parsing.

---

## 4. UI/UX & KaTeX Rendering Specification

```tsx
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { parseDateSafe } from "@/lib/utils";

export function ChatMessageItem({ content, isMe, createdAt }: { content: string; isMe: boolean; createdAt: any }) {
  const d = parseDateSafe(createdAt);
  const formattedTime = d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className={`p-3 rounded-xl max-w-[80%] ${isMe ? "bg-indigo-600 text-white ml-auto" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
      <span className="text-[10px] opacity-75 mt-1 block">{formattedTime}</span>
    </div>
  );
}
```

---

## 5. Unit Test Cases Checklist

- [x] **UT-FE-01:** `useClassChat` tự động load lịch sử tin nhắn khi được mount hoặc khi `studentId` thay đổi.
- [x] **UT-FE-02:** Tin nhắn mới từ STOMP WebSocket được append đúng vào mảng state `messages`.
- [x] **UT-FE-03:** Hiển thị đúng giao diện Học sinh khi đăng nhập vai trò Student kèm huy hiệu tin nhắn mới.
- [x] **UT-FE-04:** Hiển thị đúng danh sách Học sinh kèm badge unreadCount và sắp xếp Online lên trên ở giao diện Giảng viên.
- [x] **UT-FE-05:** Render chính xác công thức KaTeX toán học `$E = mc^2$` trong tin nhắn.
- [x] **UT-FE-06:** Tự động mở khung chat / tab chat tương ứng khi truy cập qua URL parameter từ thông báo Header.
