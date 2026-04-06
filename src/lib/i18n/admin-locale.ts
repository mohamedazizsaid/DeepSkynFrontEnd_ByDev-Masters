import type { Language } from './translations';

type AdminLocale = {
  sidebar: {
    overview: string;
    users: string;
    skinAnalysis: string;
    subscriptions: string;
    moderation: string;
    churn: string;
    aiChat: string;
    catalog: string;
    notifications: string;
    logout: string;
  };
  common: {
    refresh: string;
    apply: string;
    loading: string;
    active: string;
    suspended: string;
    noData: string;
  };
  overview: {
    title: string;
    subtitle: string;
    totalUsers: string;
    activeSubscriptions: string;
    scansToday: string;
    churnRate: string;
    signupsOverTime: string;
    tierDistribution: string;
    topConditions: string;
  };
  users: {
    title: string;
    subtitle: string;
    searchUsers: string;
    searchPlaceholder: string;
    status: string;
    allStatuses: string;
    usersFound: string;
    name: string;
    email: string;
    subscription: string;
    joinDate: string;
    actions: string;
    view: string;
    suspend: string;
    activate: string;
    noUsers: string;
    loadingUsers: string;
  };
  analysis: {
    title: string;
    subtitle: string;
    fromDate: string;
    toDate: string;
    skinType: string;
    minScore: string;
    maxScore: string;
    user: string;
    date: string;
    skinScore: string;
    conditions: string;
    aiResponseTime: string;
    status: string;
    action: string;
    retry: string;
    noAnalyses: string;
    loadingAnalyses: string;
  };
  subscriptions: {
    title: string;
    subtitle: string;
    mrr: string;
    active: string;
    total: string;
    expired: string;
    planDistribution: string;
    quickActions: string;
    expireOverdue: string;
    plan: string;
    status: string;
    allPlans: string;
    allStatuses: string;
    cancelled: string;
    amount: string;
    start: string;
    end: string;
    user: string;
    noSubscriptions: string;
  };
  moderation: {
    title: string;
    subtitle: string;
    postFilter: string;
    allPosts: string;
    reportedOnly: string;
    flagged: string;
    likes: string;
    comments: string;
    viewSource: string;
    unflag: string;
    flag: string;
    delete: string;
    noPosts: string;
    loadingPosts: string;
  };
  products: {
    title: string;
    subtitle: string;
    triggerScrape: string;
    scraping: string;
    dataFile: string;
    filesAvailable: string;
    viewSource: string;
    noProductsInFile: string;
    selectDataFile: string;
  };
  churn: {
    title: string;
    subtitle: string;
    churnRate: string;
    atRiskUsers: string;
    totalAnalyzed: string;
    avgProbability: string;
    riskDistribution: string;
    actions: string;
    runAnalysis: string;
    runningAnalysis: string;
    sendEmails: string;
    sending: string;
    atRiskTable: string;
    name: string;
    email: string;
    probability: string;
    lastLogin: string;
    subscription: string;
    noAtRiskUsers: string;
  };
  ai: {
    title: string;
    subtitle: string;
    totalConversations: string;
    totalMessages: string;
    activeUsers: string;
    avgMessagesPerChat: string;
    dailyVolume: string;
    topTopics: string;
    noTopicData: string;
    modelPerformance: string;
    avgResponseTime: string;
    errorRate: string;
    tokenUsage: string;
    loadingStats: string;
    mentions: string;
  };
  notifications: {
    title: string;
    subtitle: string;
    broadcastTitle: string;
    broadcastSubtitle: string;
    notificationTitle: string;
    type: string;
    message: string;
    actionUrlOptional: string;
    sendToAll: string;
    sending: string;
    cleanup: string;
    deleteOlderThan: string;
    recentNotifications: string;
    noNotifications: string;
  };
};

const en: AdminLocale = {
  sidebar: {
    overview: 'Overview', users: 'Users', skinAnalysis: 'Skin Analysis', subscriptions: 'Subscriptions', moderation: 'Feed Moderation', churn: 'Churn & Retention', aiChat: 'AI & Chat', catalog: 'Product Catalog', notifications: 'Notifications', logout: 'Logout',
  },
  common: { refresh: 'Refresh', apply: 'Apply', loading: 'Loading...', active: 'Active', suspended: 'Suspended', noData: 'No data' },
  overview: { title: 'Admin Overview', subtitle: 'Global KPIs and platform trends', totalUsers: 'Total Users', activeSubscriptions: 'Active Subscriptions', scansToday: 'Scans Today', churnRate: 'Churn Rate', signupsOverTime: 'User Signups Over Time', tierDistribution: 'Subscription Tier Distribution', topConditions: 'Top Detected Skin Conditions' },
  users: { title: 'User Management', subtitle: 'Search, filter and manage platform users', searchUsers: 'Search users', searchPlaceholder: 'Search by name or email', status: 'Status', allStatuses: 'All statuses', usersFound: 'users found', name: 'Name', email: 'Email', subscription: 'Subscription', joinDate: 'Join Date', actions: 'Actions', view: 'View', suspend: 'Suspend', activate: 'Activate', noUsers: 'No users found', loadingUsers: 'Loading users...' },
  analysis: { title: 'Skin Analysis Monitor', subtitle: 'Monitor scans, scores, conditions and retry failed analyses', fromDate: 'From date', toDate: 'To date', skinType: 'Skin type', minScore: 'Min score', maxScore: 'Max score', user: 'User', date: 'Date', skinScore: 'Skin Score', conditions: 'Conditions', aiResponseTime: 'AI Response Time', status: 'Status', action: 'Action', retry: 'Retry', noAnalyses: 'No analyses found for current filters', loadingAnalyses: 'Loading analyses...' },
  subscriptions: { title: 'Subscription Management', subtitle: 'Revenue, plan distribution and subscriber status', mrr: 'MRR', active: 'Active', total: 'Total', expired: 'Expired', planDistribution: 'Plan Distribution', quickActions: 'Quick Actions', expireOverdue: 'Check & Expire Overdue Subscriptions', plan: 'Plan', status: 'Status', allPlans: 'All plans', allStatuses: 'All statuses', cancelled: 'Cancelled', amount: 'Amount', start: 'Start', end: 'End', user: 'User', noSubscriptions: 'No subscriptions found' },
  moderation: { title: 'Social Feed Moderation', subtitle: 'Review, flag and delete community posts', postFilter: 'Post filter', allPosts: 'All posts', reportedOnly: 'Reported only', flagged: 'Flagged', likes: 'likes', comments: 'comments', viewSource: 'View source', unflag: 'Unflag', flag: 'Flag', delete: 'Delete', noPosts: 'No posts found', loadingPosts: 'Loading posts...' },
  products: { title: 'Product Catalog', subtitle: 'Scraped dermatological products from Dermaceutic', triggerScrape: 'Trigger Scrape', scraping: 'Scraping...', dataFile: 'Data file', filesAvailable: 'files available', viewSource: 'View source', noProductsInFile: 'No products in this file', selectDataFile: 'Select a data file to view products' },
  churn: { title: 'Churn & Retention', subtitle: 'ML-powered churn prediction and re-engagement', churnRate: 'Churn Rate', atRiskUsers: 'At-Risk Users', totalAnalyzed: 'Total Analyzed', avgProbability: 'Avg Probability', riskDistribution: 'Risk Distribution', actions: 'Actions', runAnalysis: 'Run Churn Analysis', runningAnalysis: 'Running ML Analysis...', sendEmails: 'Send Retention Emails', sending: 'Sending...', atRiskTable: 'At-Risk Users', name: 'Name', email: 'Email', probability: 'Churn Probability', lastLogin: 'Last Login', subscription: 'Subscription', noAtRiskUsers: 'No at-risk users' },
  ai: { title: 'AI & Chat Monitor', subtitle: 'AI Coach usage, conversation metrics and trends', totalConversations: 'Total Conversations', totalMessages: 'Total Messages', activeUsers: 'Active Users (Chat)', avgMessagesPerChat: 'Avg Messages/Chat', dailyVolume: 'Daily Message Volume', topTopics: 'Top Topics', noTopicData: 'No topic data available yet', modelPerformance: 'Model Performance', avgResponseTime: 'Avg Response Time', errorRate: 'Error Rate', tokenUsage: 'Token Usage (total)', loadingStats: 'Loading chat statistics...', mentions: 'mentions' },
  notifications: { title: 'Notifications Center', subtitle: 'Broadcast messages and manage notification history', broadcastTitle: 'Broadcast Notification', broadcastSubtitle: '', notificationTitle: 'Title', type: 'Type', message: 'Message', actionUrlOptional: 'Action URL (optional)', sendToAll: 'Broadcast to All Users', sending: 'Sending...', cleanup: 'Cleanup', deleteOlderThan: 'Delete > {days} days', recentNotifications: 'Recent Notifications', noNotifications: 'No notifications' },
};

const fr: AdminLocale = {
  ...en,
  sidebar: { overview: 'Vue d\'ensemble', users: 'Utilisateurs', skinAnalysis: 'Analyse cutanee', subscriptions: 'Abonnements', moderation: 'Moderation du feed', churn: 'Retention', aiChat: 'IA et Chat', catalog: 'Catalogue produits', notifications: 'Notifications', logout: 'Deconnexion' },
  common: { refresh: 'Actualiser', apply: 'Appliquer', loading: 'Chargement...', active: 'Actif', suspended: 'Suspendu', noData: 'Aucune donnee' },
  overview: { ...en.overview, title: 'Vue d\'ensemble Admin', subtitle: 'KPI globaux et tendances de la plateforme', totalUsers: 'Utilisateurs totaux', activeSubscriptions: 'Abonnements actifs', scansToday: 'Scans aujourd\'hui', churnRate: 'Taux de churn', signupsOverTime: 'Inscriptions utilisateurs', tierDistribution: 'Repartition des abonnements', topConditions: 'Conditions de peau les plus detectees' },
  users: { ...en.users, title: 'Gestion des utilisateurs', subtitle: 'Rechercher, filtrer et gerer les utilisateurs', searchUsers: 'Rechercher des utilisateurs', searchPlaceholder: 'Rechercher par nom ou email', status: 'Statut', allStatuses: 'Tous les statuts', usersFound: 'utilisateurs trouves', name: 'Nom', email: 'Email', subscription: 'Abonnement', joinDate: 'Date d\'inscription', actions: 'Actions', view: 'Voir', suspend: 'Suspendre', activate: 'Activer', noUsers: 'Aucun utilisateur trouve', loadingUsers: 'Chargement des utilisateurs...' },
  analysis: { ...en.analysis, title: 'Suivi des analyses cutanees', subtitle: 'Suivre les scans, scores et reexecuter les analyses en echec', fromDate: 'Date debut', toDate: 'Date fin', skinType: 'Type de peau', minScore: 'Score min', maxScore: 'Score max', user: 'Utilisateur', date: 'Date', skinScore: 'Score peau', conditions: 'Conditions', aiResponseTime: 'Temps IA', status: 'Statut', action: 'Action', retry: 'Relancer', noAnalyses: 'Aucune analyse pour ces filtres', loadingAnalyses: 'Chargement des analyses...' },
  subscriptions: { ...en.subscriptions, title: 'Gestion des abonnements', subtitle: 'Revenus, repartition des plans et statut des abonnes', active: 'Actifs', total: 'Total', expired: 'Expires', planDistribution: 'Repartition des plans', quickActions: 'Actions rapides', expireOverdue: 'Verifier et expirer les abonnements en retard', plan: 'Plan', status: 'Statut', allPlans: 'Tous les plans', allStatuses: 'Tous les statuts', cancelled: 'Annule', amount: 'Montant', start: 'Debut', end: 'Fin', user: 'Utilisateur', noSubscriptions: 'Aucun abonnement trouve' },
  moderation: { ...en.moderation, title: 'Moderation du feed social', subtitle: 'Verifier, signaler et supprimer les publications', postFilter: 'Filtre des posts', allPosts: 'Tous les posts', reportedOnly: 'Signales uniquement', flagged: 'Signale', likes: 'likes', comments: 'commentaires', unflag: 'Retirer le signalement', flag: 'Signaler', delete: 'Supprimer', noPosts: 'Aucun post trouve', loadingPosts: 'Chargement des posts...' },
  products: { ...en.products, title: 'Catalogue produits', subtitle: 'Produits dermatologiques collectes depuis Dermaceutic', triggerScrape: 'Lancer le scraping', scraping: 'Scraping...', dataFile: 'Fichier de donnees', filesAvailable: 'fichier(s) disponible(s)', viewSource: 'Voir la source', noProductsInFile: 'Aucun produit dans ce fichier', selectDataFile: 'Selectionnez un fichier pour voir les produits' },
  churn: { ...en.churn, title: 'Churn et retention', subtitle: 'Prediction du churn et re-engagement par ML', churnRate: 'Taux de churn', atRiskUsers: 'Utilisateurs a risque', totalAnalyzed: 'Total analyses', avgProbability: 'Probabilite moyenne', riskDistribution: 'Repartition du risque', actions: 'Actions', runAnalysis: 'Lancer l\'analyse churn', runningAnalysis: 'Analyse ML en cours...', sendEmails: 'Envoyer les emails de retention', sending: 'Envoi en cours...', atRiskTable: 'Utilisateurs a risque', name: 'Nom', email: 'Email', probability: 'Probabilite de churn', lastLogin: 'Derniere connexion', subscription: 'Abonnement', noAtRiskUsers: 'Aucun utilisateur a risque' },
  ai: { ...en.ai, title: 'Suivi IA et Chat', subtitle: 'Usage du coach IA, metriques des conversations et tendances', totalConversations: 'Conversations totales', totalMessages: 'Messages totaux', activeUsers: 'Utilisateurs actifs (chat)', avgMessagesPerChat: 'Moy. messages/chat', dailyVolume: 'Volume quotidien des messages', topTopics: 'Sujets principaux', noTopicData: 'Aucune donnee de sujet disponible', modelPerformance: 'Performance du modele', avgResponseTime: 'Temps de reponse moyen', errorRate: 'Taux d\'erreur', tokenUsage: 'Utilisation tokens (total)', loadingStats: 'Chargement des statistiques chat...', mentions: 'mentions' },
  notifications: { ...en.notifications, title: 'Centre de notifications', subtitle: 'Diffuser des messages et gerer l\'historique', broadcastTitle: 'Diffuser une notification', notificationTitle: 'Titre', type: 'Type', message: 'Message', actionUrlOptional: 'URL d\'action (optionnel)', sendToAll: 'Diffuser a tous les utilisateurs', sending: 'Envoi en cours...', cleanup: 'Nettoyage', deleteOlderThan: 'Supprimer > {days} jours', recentNotifications: 'Notifications recentes', noNotifications: 'Aucune notification' },
};

const ar: AdminLocale = {
  ...en,
  sidebar: { overview: 'نظرة عامة', users: 'المستخدمون', skinAnalysis: 'تحليل البشرة', subscriptions: 'الاشتراكات', moderation: 'إدارة المحتوى', churn: 'الاحتفاظ', aiChat: 'الذكاء الاصطناعي', catalog: 'كتالوج المنتجات', notifications: 'الإشعارات', logout: 'تسجيل الخروج' },
  common: { refresh: 'تحديث', apply: 'تطبيق', loading: 'جار التحميل...', active: 'نشط', suspended: 'موقوف', noData: 'لا توجد بيانات' },
  overview: { ...en.overview, title: 'لوحة إدارة عامة', subtitle: 'مؤشرات الأداء والاتجاهات العامة' },
  users: { ...en.users, title: 'إدارة المستخدمين', subtitle: 'بحث وتصفية وإدارة المستخدمين', searchUsers: 'بحث المستخدمين', searchPlaceholder: 'ابحث بالاسم أو البريد', status: 'الحالة', allStatuses: 'كل الحالات', usersFound: 'مستخدمون', name: 'الاسم', email: 'البريد', subscription: 'الاشتراك', joinDate: 'تاريخ الانضمام', actions: 'الإجراءات', view: 'عرض', suspend: 'إيقاف', activate: 'تفعيل', noUsers: 'لا يوجد مستخدمون', loadingUsers: 'جار تحميل المستخدمين...' },
  analysis: { ...en.analysis, title: 'مراقبة تحليلات البشرة', subtitle: 'متابعة عمليات التحليل والنتائج وإعادة المحاولة' },
  subscriptions: { ...en.subscriptions, title: 'إدارة الاشتراكات', subtitle: 'الإيرادات وتوزيع الخطط وحالة المشتركين' },
  moderation: { ...en.moderation, title: 'إدارة المنشورات', subtitle: 'مراجعة المنشورات والإبلاغ والحذف' },
  products: { ...en.products, title: 'كتالوج المنتجات', subtitle: 'منتجات جلدية مجمعة من Dermaceutic', triggerScrape: 'تشغيل الجمع', scraping: 'جار الجمع...' },
  churn: { ...en.churn, title: 'التسرب والاحتفاظ', subtitle: 'التنبؤ بالتسرب وإعادة التفاعل' },
  ai: { ...en.ai, title: 'مراقبة الذكاء الاصطناعي', subtitle: 'استخدام الدردشة والذكاء الاصطناعي' },
  notifications: { ...en.notifications, title: 'مركز الإشعارات', subtitle: 'بث الرسائل وإدارة سجل الإشعارات', sendToAll: 'إرسال لجميع المستخدمين' },
};

const es: AdminLocale = {
  ...en,
  sidebar: { overview: 'Resumen', users: 'Usuarios', skinAnalysis: 'Analisis de piel', subscriptions: 'Suscripciones', moderation: 'Moderacion', churn: 'Retencion', aiChat: 'IA y Chat', catalog: 'Catalogo de productos', notifications: 'Notificaciones', logout: 'Cerrar sesion' },
  common: { refresh: 'Actualizar', apply: 'Aplicar', loading: 'Cargando...', active: 'Activo', suspended: 'Suspendido', noData: 'Sin datos' },
  overview: { ...en.overview, title: 'Resumen de administrador', subtitle: 'KPIs globales y tendencias de la plataforma' },
  users: { ...en.users, title: 'Gestion de usuarios', subtitle: 'Buscar, filtrar y gestionar usuarios', searchUsers: 'Buscar usuarios', searchPlaceholder: 'Buscar por nombre o email', status: 'Estado', allStatuses: 'Todos los estados', usersFound: 'usuarios encontrados', joinDate: 'Fecha de alta', actions: 'Acciones', noUsers: 'No se encontraron usuarios', loadingUsers: 'Cargando usuarios...' },
  analysis: { ...en.analysis, title: 'Monitor de analisis de piel', subtitle: 'Monitorea escaneos, puntajes y reintentos' },
  subscriptions: { ...en.subscriptions, title: 'Gestion de suscripciones', subtitle: 'Ingresos, distribucion de planes y estado de suscriptores' },
  moderation: { ...en.moderation, title: 'Moderacion del feed social', subtitle: 'Revisar, marcar y eliminar publicaciones' },
  products: { ...en.products, title: 'Catalogo de productos', subtitle: 'Productos dermatologicos extraidos de Dermaceutic', triggerScrape: 'Iniciar scraping', scraping: 'Extrayendo...' },
  churn: { ...en.churn, title: 'Churn y retencion', subtitle: 'Prediccion de abandono y reenganche' },
  ai: { ...en.ai, title: 'Monitor de IA y chat', subtitle: 'Uso del asistente IA, metricas y tendencias' },
  notifications: { ...en.notifications, title: 'Centro de notificaciones', subtitle: 'Difundir mensajes y gestionar el historial', sendToAll: 'Difundir a todos los usuarios' },
};

export function getAdminLocale(language: Language): AdminLocale {
  switch (language) {
    case 'en':
      return en;
    case 'ar':
      return ar;
    case 'es':
      return es;
    default:
      return fr;
  }
}
