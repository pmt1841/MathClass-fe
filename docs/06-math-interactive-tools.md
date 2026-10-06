# 📐 Hướng Dẫn Tích Hợp Công Cụ Toán Học & Soạn Thảo (Math Interactive Tools)

MathClass là nền tảng quản lý học tập chuyên sâu môn Toán, do đó hệ thống Frontend tích hợp bộ công cụ toán học tương tác toàn diện từ công thức LaTeX chuẩn xác đến đồ thị hình học tương tác và nhận diện chữ viết tay qua Canvas.

---

## 1. Tổng Quan Kiến Trúc Soạn Thảo & Hiển Thị Toán Học

| Công nghệ | Thư viện sử dụng | Vai trò trong hệ sinh thái |
| :--- | :--- | :--- |
| **Gõ công thức LaTeX** | `mathlive` | Bàn phím ảo toán học, visual editor hỗ trợ gõ nhanh công thức toán học |
| **Render công thức tĩnh** | `katex`, `rehype-katex`, `remark-math` | Render công thức dạng inline (`$...$`) và block (`$$...$$`) chuẩn typography |
| **Đồ thị & Hình học động** | `jsxgraph` | Vẽ hình học phẳng, hàm số, đồ thị với tương tác kéo thả điểm trực tiếp |
| **Soạn thảo Rich Text** | `@tiptap/react` | Soạn thảo câu hỏi, đề bài, chèn bảng biểu, ảnh và công thức |
| **Nhận diện viết tay AI** | HTML5 Canvas + Backend OCR | Cho phép học sinh viết nháp công thức trực tiếp và convert sang LaTeX |

---

## 2. Hiển Thị Công Thức LaTeX với KaTeX

Tất cả nội dung Markdown chứa công thức Toán học đều được render thông qua component tập trung hoặc pipeline Markdown:

```tsx
// components/ui/markdown-content.tsx
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';
import { mathSanitizeSchema } from '@/lib/markdown';
import 'katex/dist/katex.min.css';

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[
        [rehypeKatex, { output: 'htmlAndMathml', throwOnError: false }],
        [rehypeSanitize, mathSanitizeSchema],
      ]}
      className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-100"
    >
      {content}
    </ReactMarkdown>
  );
}
```

> ⚠️ **Lưu ý bảo mật:** Bắt buộc áp dụng `mathSanitizeSchema` từ `@/lib/markdown` để ngăn chặn tấn công XSS trong khi vẫn giữ nguyên các class KaTeX (`math-inline`, `math-display`).

---

## 3. Vẽ Hình & Đồ Thị Tương Tác với JSXGraph

### 3.1 Vòng đời JSXGraph Board trong React (`'use client'`)
Vì JSXGraph tương tác trực tiếp lên DOM và đối tượng `window`, component chứa bảng vẽ **bắt buộc phải là Client Component**:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import JXG from 'jsxgraph';
import 'jsxgraph/distrib/jsxgraph.css';

interface JSXGraphBoardProps {
  boardId: string;
  boundingbox?: [number, number, number, number];
  showAxes?: boolean;
  showGrid?: boolean;
  onBoardReady?: (board: JXG.Board) => void;
}

export function JSXGraphBoard({
  boardId,
  boundingbox = [-5, 5, 5, -5],
  showAxes = true,
  showGrid = true,
  onBoardReady,
}: JSXGraphBoardProps) {
  const boardRef = useRef<JXG.Board | null>(null);

  useEffect(() => {
    // 1. Khởi tạo Board
    const board = JXG.JSXGraph.initBoard(boardId, {
      boundingbox,
      axis: showAxes,
      grid: showGrid,
      showNavigation: false,
      showCopyright: false,
      keepaspectratio: true,
    });

    boardRef.current = board;
    onBoardReady?.(board);

    // 2. Cleanup: Giải phóng bộ nhớ khi unmount
    return () => {
      if (boardRef.current) {
        JXG.JSXGraph.freeBoard(boardRef.current);
        boardRef.current = null;
      }
    };
  }, [boardId, showAxes, showGrid]);

  return <div id={boardId} className="w-full h-80 rounded-lg border border-slate-200 dark:border-slate-800" />;
}
```

### 3.2 Chuẩn hóa mã hình vẽ trong Markdown (`[SHAPE_x|...]`)
Khi giáo viên hoặc học sinh vẽ hình, cấu hình bảng vẽ được lưu lại dưới dạng cú pháp đặc biệt:
```text
[SHAPE_1|axes=true,grid=false,box=[-5,5,5,-5],points=[{"x":0,"y":0,"name":"O"},{"x":3,"y":4,"name":"A"}],segments=[["O","A"]]]
```
Hệ thống parser tại `@/lib/editor-utils.ts` sẽ chuyển đổi chuỗi mã này thành đối tượng vẽ trực quan và không bị phá vỡ khi chuyển đổi Markdown ↔ HTML.

---

## 4. Bàn Phím Công Thức MathLive (MathField)

Component `MathLiveInput` cho phép học sinh và giáo viên nhập công thức thông qua thanh công cụ trực quan:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import '//unpkg.com/mathlive'; // nạp MathfieldElement web-component

interface MathInputProps {
  value: string;
  onChange: (latex: string) => void;
}

export function MathInput({ value, onChange }: MathInputProps) {
  const mfRef = useRef<any>(null);

  useEffect(() => {
    const mf = mfRef.current;
    if (mf && mf.getValue() !== value) {
      mf.setValue(value);
    }
  }, [value]);

  const handleInput = (e: any) => {
    onChange(e.target.value);
  };

  return (
    <math-field
      ref={mfRef}
      onInput={handleInput}
      style={{ display: 'block', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
    />
  );
}
```

---

## 5. Nhận Diện Chữ Viết Tay Qua Canvas (AI Handwriting OCR)

Học sinh có thể sử dụng bảng Canvas để viết tay lời giải hoặc công thức:
1. **Frontend:** Thu thập nét vẽ trên thẻ `<canvas>`, xuất ra định dạng `image/png` (Base64).
2. **Gửi API:** Gọi endpoint `/api/v1/submissions/handwriting-ocr` thông qua `handwritingService.ts`.
3. **Phản hồi:** Trả về chuỗi LaTeX chuẩn (ví dụ `\int_{0}^{1} x^2 dx = \frac{1}{3}`).
4. **Tích hợp:** Tự động chèn kết quả vào trình soạn thảo bài làm của học sinh.
