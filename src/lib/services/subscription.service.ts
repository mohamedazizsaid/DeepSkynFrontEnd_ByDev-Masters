import apiClient from '../api-client';
import type {
  Subscription,
  SubscriptionPlanInfo,
  SubscriptionUsageSummary,
} from '../types';

function unwrapSubscription(data: unknown): Subscription {
  if (data && typeof data === 'object' && 'subscription' in data) {
    return (data as any).subscription as Subscription;
  }
  return data as Subscription;
}

export const subscriptionService = {
  async getMySubscription(): Promise<Subscription> {
    const res = await apiClient.get<any>('/subscriptions/me');
    return unwrapSubscription(res.data);
  },

  async isPremium(): Promise<boolean> {
    const res = await apiClient.get<{ isPremium: boolean }>('/subscriptions/me/premium');
    return res.data.isPremium;
  },

  async getUsageSummary(): Promise<SubscriptionUsageSummary> {
    const res = await apiClient.get<SubscriptionUsageSummary>('/subscriptions/me/usage');
    return res.data;
  },

  async getPlans(): Promise<SubscriptionPlanInfo[]> {
    const res = await apiClient.get<Record<string, any>>('/subscriptions/plans');
    
    // Transformar o object do backend em array
    return Object.entries(res.data).map(([key, plan]) => ({
      plan: key as any,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      features: Array.isArray(plan.features) ? plan.features : [],
      duration: plan.duration,
    }));
  },

  async upgrade(plan: string): Promise<Subscription> {
    const res = await apiClient.post<any>('/subscriptions/upgrade', {
      plan,
      planCode: plan,
    });
    return unwrapSubscription(res.data);
  },

  async cancel(): Promise<Subscription> {
    const res = await apiClient.post<any>('/subscriptions/cancel');
    return unwrapSubscription(res.data);
  },

  async reactivate(): Promise<Subscription> {
    const res = await apiClient.post<any>('/subscriptions/reactivate');
    return unwrapSubscription(res.data);
  },

  async renew(): Promise<Subscription> {
    const res = await apiClient.post<any>('/subscriptions/renew');
    return unwrapSubscription(res.data);
  },

  async createStripeCheckout(plan: string): Promise<{ id: string; url: string | null }> {
    const res = await apiClient.post<{ url: string | null; id: string }>(
      '/subscriptions/stripe/checkout',
      {
        plan,
        planCode: plan,
      },
    );
    return res.data;
  },
};
