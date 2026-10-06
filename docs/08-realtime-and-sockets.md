# ⚡ Tích Hợp Real-time & WebSocket (Realtime & Sockets Guide)

Tài liệu này hướng dẫn cách kết nối và sử dụng hệ thống WebSocket thời gian thực (STOMP qua SockJS) trong Frontend **MathClass**.

---

## 1. Kiến Trúc Kết Nối WebSocket

Frontend kết nối tới Endpoint STOMP của Backend thông qua thư viện `@stomp/stompjs` và `sockjs-client`:

- **Endpoint gốc:** `${NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws'}`
- **Giao thức:** STOMP qua SockJS fallback (đảm bảo hoạt động tốt khi qua proxy hoặc tường lửa).

---

## 2. Các Kênh Đăng Ký (Topics & Queues)

| Kênh (Destination) | Loại kênh | Mô tả dữ liệu nhận được |
| :--- | :--- | :--- |
| `/topic/classrooms/{classId}/presence` | Public Broadcast | Danh sách học sinh đang online trong lớp học (Heartbeat 5 phút) |
| `/topic/classrooms/{classId}/chat` | Room Broadcast | Tin nhắn thảo luận thời gian thực trong phòng chat của lớp |
| `/user/queue/notifications` | Private Queue | Thông báo cá nhân: Duyệt yêu cầu vào lớp, bài tập mới, kết quả chấm điểm |
| `/user/queue/payments` | Private Queue | Sự kiện thông báo nạp credit thành công sau khi quét mã QR SePay |

---

## 3. Quản Lý Kết Nối & Tự Động Reconnect

Để đảm bảo hiệu năng, kết nối WebSocket được quản lý tập trung qua React Context hoặc custom hook, tránh tạo nhiều client song song:

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useWebSocket() {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws';
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('[STOMP] Connected to WebSocket broker');
      },
      onStompError: (frame) => {
        console.error('[STOMP] Error:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  return clientRef;
}
```

---

## 4. Xử Lý Trạng Thái Bạn Cùng Lớp Online (`isOnline`)

Danh sách học sinh trong lớp (`ClassmateList`) định kỳ nhận gói tin heartbeat từ `/topic/classrooms/{classId}/presence`:
- Học sinh gửi ping định kỳ mỗi 60 giây khi đang ở trang lớp học.
- UI hiển thị chấm tròn xanh trạng thái cho học sinh có hoạt động trong vòng 5 phút gần nhất.
- Khi người dùng rời khỏi trang hoặc mất mạng, trạng thái tự động chuyển sang offline.
