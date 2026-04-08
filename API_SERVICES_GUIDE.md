# 🔌 DeepSkyn Frontend - API Services & Architecture Guide

## 📑 Table of Contents
1. [API Services Overview](#api-services-overview)
2. [Authentication Service](#authentication-service)
3. [Skin Analysis Service](#skin-analysis-service)
4. [Routine Service](#routine-service)
5. [Chat Service](#chat-service)
6. [Subscription Service](#subscription-service)
7. [Admin Service](#admin-service)
8. [Integration Examples](#integration-examples)

---

## 🎯 API Services Overview

### Services Architecture

```
lib/services/
├── index.ts                           # Barrel export
├── auth.service.ts                    # Authentication & user mgmt
├── analysis.service.ts                # Skin analysis operations
├── routine.service.ts                 # Routine management
├── chat.service.ts                    # AI chat integration
├── subscription.service.ts            # Payment & plans
├── admin.service.ts                   # Admin operations
├── users.service.ts                   # User profile operations
├── posts.service.ts                   # Community posts
├── skin-profile.service.ts            # Skin profile data
├── digital-twin.service.ts            # 3D model generation
├── sign-language.service.ts           # Sign translation
├── sign-translation.service.ts        # Text-to-sign conversion
├── contextual-analysis.service.ts     # AI context analysis
├── predictive-routine.service.ts      # AI routine generation
├── face-verification.service.ts       # Face ID verification
├── notification.service.ts            # Push notifications
├── weather.service.ts                 # Weather data
├── location.service.ts                # Geolocation services
├── reclamation.service.ts             # Support/complaints
├── speech-to-text.service.ts          # Audio transcription
└── address.service.ts                 # Address management
```

---

## 🔐 Authentication Service

**File**: `auth.service.ts`

### Key Methods

```typescript
export const authService = {
  
  // Register new user with email/password
  async signup(payload: SignUpPayload): Promise<SignUpResponse>
  // Returns: { user, accessToken, refreshToken }
  
  // Login with credentials
  async login(email: string, password: string): Promise<LoginResponse>
  // Returns: { user, accessToken, refreshToken }
  
  // Login with Google
  async loginWithGoogle(googleToken: string): Promise<LoginResponse>
  // Returns: { user, accessToken, refreshToken }
  
  // Handle Google OAuth callback
  async handleGoogleCallback(code: string): Promise<CallbackResponse>
  
  // Setup 2FA
  async setupTwoFactor(): Promise<{ qrCode: string; secret: string }>
  
  // Verify 2FA code
  async verifyTwoFactorCode(code: string): Promise<boolean>
  
  // Request password reset
  async requestPasswordReset(email: string): Promise<{ message: string }>
  
  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }>
  
  // Change password (authenticated)
  async changePassword(currentPassword: string, newPassword: string): Promise<void>
  
  // Refresh access token
  async refreshToken(): Promise<{ accessToken: string }>
  
  // Logout
  async logout(): Promise<void>
  
  // Get current user profile
  async getCurrentUser(): Promise<UserProfile>
  
  // Verify email
  async verifyEmail(token: string): Promise<{ message: string }>
  
  // Resend verification email
  async resendVerificationEmail(email: string): Promise<{ message: string }>
};
```

### Usage Example

```typescript
import { authService } from '@/lib/services';

// Signup
const signupData = await authService.signup({
  email: 'user@example.com',
  password: 'SecurePassword123',
  firstName: 'John',
  lastName: 'Doe'
});

// Store token
localStorage.setItem('access_token', signupData.accessToken);
localStorage.setItem('refresh_token', signupData.refreshToken);

// Login
const loginData = await authService.login('user@example.com', 'SecurePassword123');

// Google Login
const googleData = await authService.loginWithGoogle(googleToken);
```

### Response Types

```typescript
interface SignUpPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

interface SignUpResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📸 Skin Analysis Service

**File**: `analysis.service.ts`

### Key Methods

```typescript
export const analysisService = {
  
  // Upload image for analysis
  async uploadImage(file: File): Promise<Analysis>
  // POST /analyses/upload
  // Accepts: JPEG, PNG, WebP (max 10MB)
  
  // Get specific analysis
  async getAnalysisById(id: string): Promise<Analysis>
  // GET /analyses/{id}
  
  // Get user's analysis history
  async getAnalysisHistory(params?: HistoryQuery): Promise<PaginatedResponse<Analysis>>
  // GET /analyses/history
  // Query: { page: number; limit: number; sort: string }
  
  // Retry failed analysis
  async retryAnalysis(id: string): Promise<Analysis>
  // POST /analyses/{id}/retry
  
  // Get analysis statistics
  async getAnalysisStats(): Promise<AnalysisStats>
  // GET /analyses/statistics
  
  // Delete analysis
  async deleteAnalysis(id: string): Promise<{ message: string }>
  // DELETE /analyses/{id}
  
  // Compare two analyses
  async compareAnalyses(id1: string, id2: string): Promise<Comparison>
  // GET /analyses/{id1}/compare/{id2}
  
  // Export analysis report
  async exportAnalysisReport(id: string, format: 'pdf' | 'json'): Promise<Blob>
  // GET /analyses/{id}/export
};
```

### Analysis Response Model

```typescript
interface Analysis {
  id: string;
  userId: string;
  imageUrl: string;
  thumbnail: string;
  
  // Analysis Results
  healthScore: number;              // 0-100
  skinType: 'oily' | 'dry' | 'combination' | 'normal' | 'sensitive';
  skinAge: number;
  
  // Detected Issues
  concerns: AnalysisConcern[];
  sensitivities: AnalysisSensitivity[];
  conditions: SkinCondition[];
  
  // Recommendations
  recommendations: Recommendation[];
  products: RecommendedProduct[];
  routine: RecommendedRoutine;
  
  // Metadata
  processingTimeMs: number;
  confidence: number;               // 0-1
  status: 'pending' | 'completed' | 'failed';
  processedAt: Date;
  expiresAt?: Date;
}

interface AnalysisConcern {
  name: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  recommendations: string[];
}
```

### Usage Example

```typescript
// Upload and analyze
const analysis = await analysisService.uploadImage(imageFile);
console.log(`Health Score: ${analysis.healthScore}`);
console.log(`Skin Type: ${analysis.skinType}`);
console.log(`Concerns: ${analysis.concerns.map(c => c.name).join(', ')}`);

// Get history with pagination
const history = await analysisService.getAnalysisHistory({
  page: 1,
  limit: 10,
  sort: '-createdAt'
});

// Compare results over time
const comparison = await analysisService.compareAnalyses(oldId, newId);
console.log(`Improvement: ${comparison.improvementPercentage}%`);

// Export as PDF
const pdf = await analysisService.exportAnalysisReport(id, 'pdf');
// Download or display PDF
```

---

## 🎯 Routine Service

**File**: `routine.service.ts`

### Key Methods

```typescript
export const routineService = {
  
  // Generate AI-powered routine
  async generateRoutine(payload: GenerateRoutinePayload): Promise<Routine>
  // POST /routines/generate
  
  // Get all user's routines
  async getRoutines(params?: RoutineQuery): Promise<PaginatedResponse<Routine>>
  // GET /routines
  
  // Get specific routine
  async getRoutineById(id: string): Promise<Routine>
  // GET /routines/{id}
  
  // Update routine
  async updateRoutine(id: string, updates: Partial<Routine>): Promise<Routine>
  // PUT /routines/{id}
  
  // Delete routine
  async deleteRoutine(id: string): Promise<{ message: string }>
  // DELETE /routines/{id}
  
  // Track routine completion
  async trackRoutineCompletion(id: string, data: CompletionData): Promise<RoutineProgress>
  // POST /routines/{id}/track
  
  // Get routine progress
  async getRoutineProgress(id: string, period?: 'week' | 'month' | 'year'): Promise<RoutineProgress>
  // GET /routines/{id}/progress
  
  // Get routine recommendations
  async getRoutineRecommendations(skinProfile: SkinProfile): Promise<RoutineRecommendation[]>
  // POST /routines/recommendations
  
  // Clone routine
  async cloneRoutine(id: string, newName: string): Promise<Routine>
  // POST /routines/{id}/clone
  
  // Share routine
  async shareRoutine(id: string, userId: string): Promise<{ message: string; shareToken: string }>
  // POST /routines/{id}/share
  
  // Get shared routines
  async getSharedRoutines(shareToken: string): Promise<Routine>
  // GET /routines/shared/{token}
};
```

### Routine Data Models

```typescript
interface Routine {
  id: string;
  userId: string;
  name: string;
  description?: string;
  
  // Steps
  steps: RoutineStep[];
  
  // Metadata
  frequency: 'daily' | 'twice-daily' | 'weekly' | 'as-needed';
  duration: number;                 // in minutes
  difficulty: 'easy' | 'medium' | 'complex';
  
  // Effectiveness
  effectiveness: number;             // 0-100
  completionRate: number;            // 0-100
  
  // Products
  products: Product[];
  estimatedCost?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastCompletedAt?: Date;
}

interface RoutineStep {
  id: string;
  order: number;
  name: string;
  description: string;
  duration: number;                 // in minutes
  product?: Product;
  technique?: string;
  tips?: string[];
}

interface RoutineProgress {
  routineId: string;
  completions: number;
  streak: number;                   // current completion streak
  longestStreak: number;
  averageCompletionTime: number;    // in minutes
  effectiveness: number;
  improvements: Improvement[];
}
```

### Usage Example

```typescript
// Generate AI routine based on skin profile
const routine = await routineService.generateRoutine({
  skinType: 'oily',
  concerns: ['acne', 'pores'],
  sensitivities: ['fragrance'],
  budget: 'medium',
  timeAvailable: 15  // minutes
});

// Get all routines
const routines = await routineService.getRoutines({ page: 1, limit: 5 });

// Track completion
const progress = await routineService.trackRoutineCompletion(routine.id, {
  completedAt: new Date(),
  stepsCompleted: routine.steps.map(s => s.id),
  effectiveness: 8,  // 1-10 rating
  notes: 'Skin feels great!'
});

// Check progress
const stats = await routineService.getRoutineProgress(routine.id, 'month');
console.log(`Completion rate: ${stats.completionRate}%`);
console.log(`Current streak: ${stats.streak} days`);
```

---

## 💬 Chat Service

**File**: `chat.service.ts`

### Key Methods

```typescript
export const chatService = {
  
  // Send message to AI
  async sendMessage(message: string, conversationId?: string): Promise<ChatMessage>
  // POST /chat/messages
  // Emits via Socket.io
  
  // Get conversation history
  async getConversation(id: string): Promise<Conversation>
  // GET /chat/conversations/{id}
  
  // Get all conversations
  async getConversations(params?: ConversationQuery): Promise<PaginatedResponse<Conversation>>
  // GET /chat/conversations
  
  // Create new conversation
  async createConversation(title?: string): Promise<Conversation>
  // POST /chat/conversations
  
  // Delete conversation
  async deleteConversation(id: string): Promise<{ message: string }>
  // DELETE /chat/conversations/{id}
  
  // Clear conversation history
  async clearConversationHistory(id: string): Promise<void>
  // DELETE /chat/conversations/{id}/messages
  
  // Get chat statistics
  async getChatStatistics(): Promise<ChatStatistics>
  // GET /chat/admin/statistics
  
  // Upload image for chat analysis
  async analyzeImageInChat(conversationId: string, image: File): Promise<ChatMessage>
  // POST /chat/conversations/{id}/analyze-image
};
```

### Chat Data Models

```typescript
interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  
  // For analysis responses
  analysis?: AnalysisMetadata;
  recommendations?: Recommendation[];
  
  // Metadata
  timestamp: Date;
  tokensUsed?: number;
  liked?: boolean;
}

interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  
  // Context
  skinProfile?: SkinProfile;
  analysisContext?: Analysis;
  
  // Stats
  messageCount: number;
  totalTokensUsed: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
}

interface ChatStatistics {
  totalConversations: number;
  totalMessages: number;
  activeUsers: number;
  avgMessagesPerChat: number;
  topTopics: string[];
  dailyStats: DailyStat[];
}
```

### Socket.io Events

```typescript
// Client emits
socket.emit('chat:message', { conversationId, message });
socket.emit('chat:typing', { conversationId });

// Server emits
socket.on('chat:response', (message) => {});
socket.on('chat:user-typing', (data) => {});
socket.on('chat:error', (error) => {});
```

### Usage Example

```typescript
// Send message
const response = await chatService.sendMessage(
  'What routine should I use for acne?',
  conversationId
);

// Listen for real-time responses
socket.on('chat:response', (message) => {
  console.log('AI Response:', message.content);
});

// Get conversation history
const conversation = await chatService.getConversation(conversationId);
console.log(`Messages: ${conversation.messages.length}`);
console.log(`Tokens used: ${conversation.totalTokensUsed}`);

// Analyze image in conversation
const analysis = await chatService.analyzeImageInChat(conversationId, imageFile);
```

---

## 💳 Subscription Service

**File**: `subscription.service.ts`

### Key Methods

```typescript
export const subscriptionService = {
  
  // Get available plans
  async getPlans(): Promise<Plan[]>
  // GET /subscriptions/plans
  
  // Get plan details
  async getPlanDetails(planCode: string): Promise<Plan>
  // GET /subscriptions/plans/{id}
  
  // Create checkout session
  async createCheckoutSession(planCode: string, couponCode?: string): Promise<CheckoutSession>
  // POST /subscriptions/checkout
  // Returns: { sessionId, clientSecret, url }
  
  // Get current subscription
  async getCurrentSubscription(): Promise<Subscription | null>
  // GET /subscriptions/current
  
  // Get subscription history
  async getSubscriptionHistory(): Promise<Subscription[]>
  // GET /subscriptions/history
  
  // Cancel subscription
  async cancelSubscription(reason?: string): Promise<{ message: string }>
  // POST /subscriptions/cancel
  
  // Update subscription plan
  async updatePlan(newPlanCode: string): Promise<Subscription>
  // POST /subscriptions/upgrade
  
  // Get payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]>
  // GET /subscriptions/payment-methods
  
  // Add payment method
  async addPaymentMethod(token: string): Promise<PaymentMethod>
  // POST /subscriptions/payment-methods
  
  // Delete payment method
  async deletePaymentMethod(id: string): Promise<void>
  // DELETE /subscriptions/payment-methods/{id}
  
  // Apply coupon
  async applyCoupon(code: string): Promise<Coupon>
  // POST /subscriptions/coupons/apply
  
  // Validate coupon
  async validateCoupon(code: string): Promise<Coupon>
  // GET /subscriptions/coupons/validate
};
```

### Subscription Models

```typescript
interface Plan {
  id: string;
  code: string;                       // e.g., 'pro', 'premium'
  name: string;
  price: number;
  currency: string;                   // 'EUR', 'USD'
  billingCycle: 'monthly' | 'yearly';
  
  features: Feature[];
  limits: Limits;
  
  stripeProductId: string;
  stripePriceId: string;
  
  isActive: boolean;
  createdAt: Date;
}

interface Subscription {
  id: string;
  userId: string;
  planCode: string;
  
  status: 'active' | 'past_due' | 'canceled' | 'expired';
  
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  renewalDate: Date;
  
  stripeSubscriptionId: string;
  
  metadata: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  
  isActive: boolean;
  startsAt?: Date;
  expiresAt?: Date;
  
  maxRedemptions?: number;
  maxPerUser?: number;
  
  allowedPlans: string[];
}
```

### Usage Example

```typescript
// Get available plans
const plans = await subscriptionService.getPlans();

// Create checkout
const checkout = await subscriptionService.createCheckoutSession(
  'pro',
  'WELCOME10'  // coupon
);

// Redirect to Stripe
window.location.href = checkout.url;

// Get current subscription
const subscription = await subscriptionService.getCurrentSubscription();
if (subscription?.status === 'active') {
  console.log('Plan:', subscription.planCode);
  console.log('Renews on:', subscription.renewalDate);
}

// Cancel subscription
await subscriptionService.cancelSubscription('Too expensive');

// Upgrade plan
const upgraded = await subscriptionService.updatePlan('premium');
```

---

## 🛡️ Admin Service

**File**: `admin.service.ts`

### Key Methods

```typescript
export const adminService = {
  
  // Get overview statistics
  async getOverviewStats(): Promise<AdminStats>
  // GET /admin/overview
  
  // Get users (paginated)
  async getUsers(query?: AdminUsersQuery): Promise<PaginatedResponse<User>>
  // GET /users/admin/all
  
  // Get user details
  async getUserById(id: string): Promise<User>
  // GET /users/admin/{id}
  
  // Update user status
  async updateUserStatus(id: string, isActive: boolean): Promise<User>
  // PATCH /users/admin/{id}/status
  
  // Get analyses (admin)
  async getAdminAnalyses(query?: AdminAnalysesQuery): Promise<PaginatedResponse<Analysis>>
  // GET /analyses/admin/all
  
  // Retry analysis as admin
  async retryAnalysisAsAdmin(id: string): Promise<Analysis>
  // POST /analyses/admin/{id}/retry
  
  // Get subscription statistics
  async getSubscriptionsStats(): Promise<SubscriptionStats>
  // GET /subscriptions/admin/statistics
  
  // Get all subscriptions
  async getAllSubscriptions(params?: SubscriptionParams): Promise<PaginatedResponse<Subscription>>
  // GET /subscriptions/admin/all
  
  // Create manual subscription
  async createManualSubscription(userId: string, data: ManualSubscriptionData): Promise<Subscription>
  // POST /subscriptions/admin/create/{userId}
  
  // Get admin posts
  async getAdminPosts(query?: AdminPostsQuery): Promise<PaginatedResponse<Post>>
  // GET /posts/admin/all
  
  // Flag/unflag post
  async flagPost(id: string, payload: FlagPayload): Promise<Post>
  // PATCH /posts/admin/{id}/flag
  
  // Delete post
  async deletePost(id: string): Promise<void>
  // DELETE /posts/{id}
  
  // Get churn statistics
  async getChurnStats(): Promise<ChurnStats>
  // GET /churn/stats
  
  // Run churn analysis
  async runChurnAnalysis(): Promise<ChurnAnalysisResult>
  // POST /churn/analyze
  
  // Get at-risk users
  async getAtRiskUsers(limit?: number): Promise<AtRiskUser[]>
  // GET /churn/at-risk
  
  // Get BI dashboard
  async getBiDashboard(): Promise<BIDashboard>
  // GET /admin-bi/dashboard
  
  // Coupon management
  async getCoupons(): Promise<Coupon[]>
  async createCoupon(payload: CouponPayload): Promise<Coupon>
  async updateCoupon(id: string, payload: Partial<CouponPayload>): Promise<Coupon>
  async deleteCoupon(id: string): Promise<void>
  
  // Subscription plans management
  async getSubscriptionPlans(): Promise<Plan[]>
  async createSubscriptionPlan(payload: CreatePlanPayload): Promise<Plan>
  async deleteSubscriptionPlan(id: string): Promise<void>
};
```

### Admin Statistics Models

```typescript
interface AdminStats {
  skin: {
    totalProfiles: number;
    skinTypeDistribution: Record<string, number>;
    averageHealthScore: number;
    topConcerns: string[];
  };
  analyses: {
    totalAnalyses: number;
    completedAnalyses: number;
    failedAnalyses: number;
    averageProcessingTime: number;
  };
  subscriptions: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    monthlyRecurringRevenue: number;
  };
  churn: {
    churnRate: number;
    atRiskCount: number;
    avgRiskScore: number;
  };
}

interface ChurnStats {
  totalUsers: number;
  analyzedUsers: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  criticalRisk: number;
  churnRate: number;
  avgProbability: number;
}
```

---

## 🔗 Integration Examples

### Complete User Flow

```typescript
// 1. Authentication
const signup = await authService.signup({
  email: 'user@example.com',
  password: 'Secure123!',
  firstName: 'John',
  lastName: 'Doe',
  acceptTerms: true
});

// 2. Update profile
await usersService.updateProfile({
  skinType: 'oily',
  concerns: ['acne'],
  sensitivities: ['fragrance']
});

// 3. Upload for analysis
const analysis = await analysisService.uploadImage(imageFile);

// 4. Generate routine
const routine = await routineService.generateRoutine({
  skinType: analysis.skinType,
  concerns: analysis.concerns,
  sensitivities: analysis.sensitivities,
  budget: 'medium',
  timeAvailable: 15
});

// 5. Subscribe to plan
const checkout = await subscriptionService.createCheckoutSession('pro');
window.location.href = checkout.url;

// 6. Start chatting
const message = await chatService.sendMessage(
  'How should I use these products?'
);
```

### Real-time Chat with Analysis

```typescript
// Start real-time listener
socket.on('chat:response', async (response) => {
  if (response.analysis) {
    // Got analysis in chat response
    const analysis = response.analysis;
    
    // Generate routine based on chat analysis
    const routine = await routineService.generateRoutine({
      skinProfile: response.skinProfile,
      // ...
    });
  }
});

// Send message with potential image
const message = await chatService.sendMessage(
  'Does my skin look healthy?',
  conversationId
);
```

### Admin Dashboard Integration

```typescript
// Get comprehensive stats
const stats = await adminService.getOverviewStats();

// Monitor churn
const churnStats = await adminService.getChurnStats();
const atRisk = await adminService.getAtRiskUsers(20);

// View BI dashboard
const biData = await adminService.getBiDashboard();

// Manage coupons
const coupons = await adminService.getCoupons();
const newCoupon = await adminService.createCoupon({
  code: 'SUMMER2024',
  discountType: 'percentage',
  discountValue: 20,
  expiresAt: '2024-08-31'
});
```

---

## 🚀 Best Practices

### Error Handling

```typescript
try {
  const data = await serviceService.method();
} catch (error) {
  if (error.response?.status === 401) {
    // Unauthorized - refresh token
    await authService.refreshToken();
  } else if (error.response?.status === 403) {
    // Forbidden
    console.error('Access denied');
  } else if (error.response?.data?.message) {
    // API error message
    showError(error.response.data.message);
  } else {
    // Network or unknown error
    showError('Something went wrong');
  }
}
```

### Loading States

```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await service.method();
  } finally {
    setLoading(false);
  }
};
```

### Caching with React Query

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['analysis', analysisId],
  queryFn: () => analysisService.getAnalysisById(analysisId),
  staleTime: 5 * 60 * 1000,  // 5 minutes
});
```

---

**Last Updated**: April 8, 2026
