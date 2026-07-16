import { format, parse, isValid, getDaysInMonth, isLeapYear } from 'date-fns'

/**
 * Lấy số ngày tối đa của tháng trong năm (đã tự động xử lý năm nhuận cho tháng 2)
 * @param date Đối tượng Date hoặc chuỗi ngày tháng
 */
export function getMaxDaysInMonth(date: Date): number {
    return getDaysInMonth(date) // Trả về 28, 29, 30 hoặc 31 ngày cực kỳ chính xác
}

/**
 * Kiểm tra xem năm của ngày truyền vào có phải năm nhuận không
 */
export function checkIsLeapYear(date: Date): boolean {
    return isLeapYear(date)
}

/**
 * Chuyển đổi an toàn từ Date object sang chuỗi định dạng mong muốn
 */
export function formatCalendarDate(date: Date | string | null | undefined, formatStr: string = 'dd-MM-yyyy'): string {
    if (!date) return ''
    const parsedDate = typeof date === 'string' ? new Date(date) : date
    return isValid(parsedDate) ? format(parsedDate, formatStr) : ''
}

/**
 * Parse chuỗi ngày dạng dd-MM-yyyy về Object Date của JS một cách an toàn
 */
export function parseClientDate(dateStr: string | null | undefined): Date | undefined {
    if (!dateStr) return undefined
    const parsed = parse(dateStr, 'dd-MM-yyyy', new Date())
    return isValid(parsed) ? parsed : undefined
}

/**
 * Lấy số ngày tối đa trong tháng và năm chỉ định (xử lý chính xác tháng 2 và năm nhuận)
 * @param month Tháng (1 - 12)
 * @param year Năm
 */
export function getDaysInMonthAndYear(month: number, year: number): number {
    // Sử dụng tháng 0-indexed trong JS Date: month - 1
    // Ngày 0 của tháng tiếp theo sẽ là ngày cuối cùng của tháng hiện tại
    return new Date(year, month, 0).getDate()
}
