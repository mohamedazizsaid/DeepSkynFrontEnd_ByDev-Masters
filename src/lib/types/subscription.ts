// ─── Subscription Types ───
export type SubscriptionPlan = 'free' | 'premium' | 'premium_yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  autoRenew: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanInfo {
  plan: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  features: string[];
  duration?: number;
}

export interface SubscriptionQuotaItem {
  used: number;
  limit: number | null;
  remaining: number | null;
  resetsAt: string | null;
}

export interface SubscriptionUsageSummary {
  isPremium: boolean;
  subscription: Subscription;
  quotas: {
    analyses: SubscriptionQuotaItem;
    aiRoutines: SubscriptionQuotaItem;
    chatMessages: SubscriptionQuotaItem;
  };
}

export interface CouponEstimatedDiscount {
  before: number;
  discount: number;
  after: number;
  currency: string;
}

export interface CouponValidationResult {
  valid: boolean;
  couponId: string;
  couponCode: string;
  stripePromotionCodeId: string | null;
  estimated: CouponEstimatedDiscount | null;
}

export interface SubscriptionPaymentHistoryItem {
  invoiceId: string;
  invoiceNumber: string | null;
  createdAt: string;
  status: string | null;
  amountPaid: number;
  amountDue: number;
  currency: string;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
}

export interface SubscriptionPaymentHistoryResponse {
  payments: SubscriptionPaymentHistoryItem[];
}

export interface SubscriptionInvoiceResponse {
  invoiceId: string;
  invoiceNumber: string | null;
  status: string | null;
  amountPaid: number;
  currency: string;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
}
