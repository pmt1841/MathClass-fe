/**
 * Thư mục này được quy hoạch để chứa các Server Actions của Next.js trong tương lai.
 * 
 * BẤT CỨ file nào trong thư mục này đều phải có dòng `'use server'` ở trên cùng.
 * Mục đích:
 * - Đảm bảo các đoạn code tương tác trực tiếp với Database, hoặc gọi API bên thứ 3 có chứa Secret Key (API_KEY, JWT_SECRET,...) 
 *   không bao giờ bị rò rỉ (leak) xuống Client (trình duyệt).
 * - Sử dụng chung với form `<form action={myServerAction}>` hoặc gọi trực tiếp từ Client Components một cách an toàn.
 * 
 * Ví dụ:
 * 
 * 'use server'
 * 
 * export async function submitGrade(data: FormData) {
 *   const dbSecret = process.env.DATABASE_SECRET_KEY; // An toàn, không bị leak
 *   // ... xử lý logic
 * }
 */
