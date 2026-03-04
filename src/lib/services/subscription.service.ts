import apiClient from '../api-client';
import type { Subscription, SubscriptionPlanInfo } from '../types';

export const subscriptionService = {
  async getMySubscription(): Promise<Subscription> {
    const res = await apiClient.get<Subscription>('/subscriptions/me');
    return res.data;
  },

  async isPremium(): Promise<boolean> {
    const res = await apiClient.get<{ isPremium: boolean }>('/subscriptions/me/premium');
    return res.data.isPremium;
  },

  async getPlans(): Promise<SubscriptionPlanInfo[]> {
    const res = await apiClient.get<SubscriptionPlanInfo[]>('/subscriptions/plans');
    return res.data;
  },

  async upgrade(plan: string): Promise<Subscription> {
    const res = await apiClient.post<Subscription>('/subscriptions/upgrade', { plan });
    return res.data;
  },

  async cancel(): Promise<Subscription> {
    const res = await apiClient.post<Subscription>('/subscriptions/cancel');
    return res.data;
  },

  async reactivate(): Promise<Subscription> {
    const res = await apiClient.post<Subscription>('/subscriptions/reactivate');
    return res.data;
  },

  async renew(): Promise<Subscription> {
    const res = await apiClient.post<Subscription>('/subscriptions/renew');
    return res.data;
  },
};
