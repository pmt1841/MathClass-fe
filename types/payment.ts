export interface PaymentConfigResponse {
  id: number
  bankCode: string
  accountNumber: string
  accountHolderName: string
  sepayApiKey?: string
  hasSepayApiKey?: boolean
  transferSyntaxPrefix: string
  qrTemplate: string
  isActive: boolean
}

export interface PublicPaymentConfigResponse {
  bankCode: string
  accountNumber: string
  accountHolderName: string
  transferSyntaxPrefix: string
  qrTemplate: string
  isActive: boolean
}

export interface PaymentConfigUpdateRequest {
  bankCode: string
  accountNumber: string
  accountHolderName: string
  sepayApiKey?: string
  transferSyntaxPrefix: string
  qrTemplate: string
  isActive?: boolean
}

export type CreditOrderStatusType =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED_PAID'
  | 'DUPLICATE_PAYMENT'
  | 'REFUNDED'

export interface CreditOrderStatusResponse {
  orderId: number
  status: CreditOrderStatusType
  credits: number
  price: number
  creditsAdded?: number
  newBalance?: number
  transactionRef?: string
  paidAt?: string
  createdAt: string
}

export interface CreditOrderAdminResponse {
  orderId: number
  orderCode?: string
  userId: number
  userFullName?: string
  userEmail?: string
  packageId: number
  credits: number
  price: number
  gatewayCode: string
  status: CreditOrderStatusType
  transactionRef?: string
  paidAt?: string
  createdAt: string
  refundReason?: string
  refundedAt?: string
  refundRecipientInfo?: string
  refundBankCode?: string
  refundAccountNumber?: string
  refundAccountName?: string
  bugReportId?: number
}

export interface RefundCreditOrderRequest {
  refundReason?: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}
