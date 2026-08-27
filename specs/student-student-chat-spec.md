# Specification: Student Group Chat & Student-to-Student Private Chat UI (`MathClass-fe`)

## 1. Executive Summary & Objectives

Tài liệu đặc tả yêu cầu cho phần Frontend (`MathClass-fe`) của tính năng **Chat nhóm Lớp học và Chat riêng (1-1) giữa Học sinh với nhau trong Lớp học**.

### Các mục tiêu chính:
1. **Facebook-style Floating Chat Dock:** Hệ thống cửa sổ chat nổi đa nhiệm góc dưới bên phải màn hình, hỗ trợ mở đồng thời nhiều khung chat (Chat Lớp, Chat Giáo viên, Chat riêng từng bạn học).
2. **Chat Nhóm Lớp (Class Group Chat):** Khung chat nhóm mặc định cho tất cả thành viên trong lớp học.
3. **Chat Riêng 1-1 (Student-to-Student Chat):** Click chọn một học sinh trong danh sách thành viên lớp học sẽ tự động mở/focus cửa sổ chat riêng với bạn đó.
4. **Trạng thái Trực tuyến Real-time (Presence):** Lắng nghe kênh Presence STOMP để hiển thị chấm xanh lá trên avatar người dùng đang Online.
5. **Render Công thức Toán (KaTeX) & Múi giờ GMT+7:** Render tin nhắn KaTeX dạng `$E=mc^2$` bằng `rehype-katex` và hiển thị thời gian chính xác theo múi giờ Việt Nam.

---

## 2. Acceptance Criteria Checklist (AC)

- [x] **AC-FE-01:** Hook/Provider `useChatDock` quản lý danh sách các cửa sổ chat đang mở (`activeWindows`) và các thao tác (Mở, Thu nhỏ, Đóng, Chuyển tab).
- [x] **AC-FE-02:** Component `FloatingChatDock` đặt tại Layout lớp học, hiển thị các cửa sổ `FloatingChatWindow` xếp hàng góc dưới bên phải.
- [x] **AC-FE-03:** Click chọn học sinh ở danh sách thành viên lớp (`ClassroomStudentList`) tự động trigger `openChatWindow(student, 'DIRECT_STUDENT')`.
- [x] **AC-FE-04:** Kênh Chat Nhóm Lớp subscribe channel STOMP `/topic/classroom/{classId}/group`.
- [x] **AC-FE-05:** Kênh Chat Riêng Học sinh subscribe channel STOMP `/topic/classroom/{classId}/direct/{studentId}`.
- [x] **AC-FE-06:** Tự động đếm và hiển thị chính xác số tin nhắn chưa đọc (`unreadCount` và `groupUnreadCount`) trên các nút Chat Lớp (`${groupUnreadCount} mới`) và khung chat nổi mà không bị nảy/nhảy số dồn tích (+2).
- [x] **AC-FE-07:** Hiển thị mượt mà công thức Toán KaTeX trong từng khung chat nổi.
- [x] **AC-FE-08:** Quản lý tập trung Unread State tại `ChatDockContext` (Single Source of Truth), tự động reset về 0 khi đọc xong hoặc khi mở khung chat.

---

## 3. Component Architecture & State Management

### 3.1. Context & Hook `useChatDock` (`@/components/chat/ChatDockProvider.tsx`)
* **Chức năng:**
  * Quản lý danh sách các cửa sổ chat đang mở: `activeWindows: ChatWindow[]`.
  * Quản lý danh sách người dùng đang Online (`onlineUserIds: Set<Long>`).
  * Hàm `openChatWindow(targetUser, chatType)`: Kiểm tra nếu đã mở thì focus/un-minimize, nếu chưa thì đẩy thêm vào `activeWindows`.
  * Hàm `closeChatWindow(windowId)` và `minimizeChatWindow(windowId)`.

### 3.2. Components Breakdown
1. **`FloatingChatDock.tsx`**
   * Vị trí: `components/chat/FloatingChatDock.tsx`
   * Quản lý vị trí hiển thị ngang góc phải màn hình, co dãn responsive nếu màn hình nhỏ.
2. **`FloatingChatWindow.tsx`**
   * Vị trí: `components/chat/FloatingChatWindow.tsx`
   * Hiển thị Header cửa sổ (Tên, Avatar, Chấm xanh Online, Nút `-` thu nhỏ, Nút `x` đóng), Danh sách tin nhắn, và Khung nhập liệu.
3. **`ClassroomStudentList.tsx`**
   * Hiển thị danh sách thành viên lớp kèm chấm xanh Online/Offline. Nhấp chọn để kích hoạt khung chat riêng.

---

## 4. REST APIs & STOMP Channels Integration

### 4.1. REST APIs (`@/lib/axios`)
* `GET /api/v1/classes/{classCode}/chat/group/messages?page=0&size=20`
* `GET /api/v1/classes/{classCode}/chat/direct/{recipientId}/messages?page=0&size=20`
* `PUT /api/v1/classes/{classCode}/chat/read`

### 4.2. STOMP Topics
* Kênh Chat Nhóm: `/topic/classroom/{classId}/group`
* Kênh Chat Riêng: `/topic/classroom/{classId}/direct/{userId}`
* Kênh Presence: `/topic/presence`
