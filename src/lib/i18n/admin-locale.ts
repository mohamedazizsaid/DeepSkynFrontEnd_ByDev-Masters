import type { Language } from './translations';

type AdminLocale = {
  sidebar: {
    overview: string;
    bi: string;
    users: string;
    skinAnalysis: string;
    subscriptions: string;
    moderation: string;
    churn: string;
    aiChat: string;
    catalog: string;
    notifications: string;
    reclamations: string;
    logout: string;
  };
  common: {
    refresh: string;
    apply: string;
    loading: string;
    active: string;
    suspended: string;
    noData: string;
    unknown: string;
    notAvailable: string;
    freePlan: string;
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
  bi: {
    title: string;
    subtitle: string;
    totalUsers: string;
    newUsers30: string;
    activeUsers30: string;
    conversionRate: string;
    mrr: string;
    arpu: string;
    delta: string;
    activityTrend: string;
    funnel: string;
    registered: string;
    onboarded: string;
    analyzed: string;
    subscribed: string;
    retained30: string;
    riskDistribution: string;
    avgRiskScore: string;
    topConcerns: string;
    analysesLast30: string;
    avgProcessing: string;
    alertsLast30: string;
    unreadAlerts: string;
    noActivity14: string;
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
    profileSummary: string;
    profileRole: string;
    profileAnalyses: string;
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
    quickActionHint: string;
    planFree: string;
    planBasic: string;
    planPremium: string;
    planEnterprise: string;
    tableCaption: string;
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
    confirmDelete: string;
    unknownAuthor: string;
    attachmentAlt: string;
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
    productImageAlt: string;
    unnamedProduct: string;
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
    runAnalysisHint: string;
    sendEmails: string;
    sending: string;
    sendEmailsHint: string;
    emailsSent: string;
    atRiskTable: string;
    name: string;
    email: string;
    probability: string;
    lastLogin: string;
    subscription: string;
    noAtRiskUsers: string;
    chartAria: string;
    tableCaption: string;
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
    chartAria: string;
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
    confirmCleanup: string;
    typeInfo: string;
    typeWarning: string;
    typeSuccess: string;
    typeError: string;
  };
  reclamations: {
    title: string;
    subtitle: string;
    total: string;
    inProgress: string;
    unsatisfied: string;
    search: string;
    searchPlaceholder: string;
    allStatuses: string;
    id: string;
    date: string;
    client: string;
    email: string;
    type: string;
    sentiment: string;
    delay: string;
    status: string;
    description: string;
    actions: string;
    markDone: string;
    doneStatus: string;
    autoRefreshHint: string;
    lastUpdated: string;
    openSource: string;
    noData: string;
    loading: string;
    loadError: string;
  };
};

const en: AdminLocale = {
  sidebar: {
    overview: 'Overview', bi: 'BI Dashboard', users: 'Users', skinAnalysis: 'Skin Analysis', subscriptions: 'Subscriptions', moderation: 'Feed Moderation', churn: 'Churn & Retention', aiChat: 'AI & Chat', catalog: 'Product Catalog', notifications: 'Notifications', reclamations: 'Reclamations', logout: 'Logout',
  },
  common: { refresh: 'Refresh', apply: 'Apply', loading: 'Loading...', active: 'Active', suspended: 'Suspended', noData: 'No data', unknown: 'Unknown', notAvailable: 'N/A', freePlan: 'Free' },
  overview: { title: 'Admin Overview', subtitle: 'Global KPIs and platform trends', totalUsers: 'Total Users', activeSubscriptions: 'Active Subscriptions', scansToday: 'Scans Today', churnRate: 'Churn Rate', signupsOverTime: 'User Signups Over Time', tierDistribution: 'Subscription Tier Distribution', topConditions: 'Top Detected Skin Conditions' },
  bi: { title: 'Advanced BI Dashboard', subtitle: 'Business intelligence and growth analytics', totalUsers: 'Total Users', newUsers30: 'New Users (30d)', activeUsers30: 'Active Users (30d)', conversionRate: 'Conversion Rate', mrr: 'MRR', arpu: 'ARPU', delta: 'Delta', activityTrend: '14-Day Activity Trend', funnel: 'Acquisition Funnel', registered: 'Registered', onboarded: 'Onboarded', analyzed: 'Analyzed', subscribed: 'Subscribed', retained30: 'Retained 30d', riskDistribution: 'Churn Risk Distribution', avgRiskScore: 'Average Risk Score', topConcerns: 'Top Skin Concerns (90d)', analysesLast30: 'Analyses (30d)', avgProcessing: 'Avg Analysis Processing', alertsLast30: 'Skin Alerts (30d)', unreadAlerts: 'Unread Alerts', noActivity14: 'No activity data available for the last 14 days' },
  users: { title: 'User Management', subtitle: 'Search, filter and manage platform users', searchUsers: 'Search users', searchPlaceholder: 'Search by name or email', status: 'Status', allStatuses: 'All statuses', usersFound: 'users found', name: 'Name', email: 'Email', subscription: 'Subscription', joinDate: 'Join Date', actions: 'Actions', view: 'View', suspend: 'Suspend', activate: 'Activate', noUsers: 'No users found', loadingUsers: 'Loading users...', profileSummary: 'User profile', profileRole: 'Role', profileAnalyses: 'Analyses' },
  analysis: { title: 'Skin Analysis Monitor', subtitle: 'Monitor scans, scores, conditions and retry failed analyses', fromDate: 'From date', toDate: 'To date', skinType: 'Skin type', minScore: 'Min score', maxScore: 'Max score', user: 'User', date: 'Date', skinScore: 'Skin Score', conditions: 'Conditions', aiResponseTime: 'AI Response Time', status: 'Status', action: 'Action', retry: 'Retry', noAnalyses: 'No analyses found for current filters', loadingAnalyses: 'Loading analyses...' },
  subscriptions: { title: 'Subscription Management', subtitle: 'Revenue, plan distribution and subscriber status', mrr: 'MRR', active: 'Active', total: 'Total', expired: 'Expired', planDistribution: 'Plan Distribution', quickActions: 'Quick Actions', expireOverdue: 'Check & Expire Overdue Subscriptions', plan: 'Plan', status: 'Status', allPlans: 'All plans', allStatuses: 'All statuses', cancelled: 'Cancelled', amount: 'Amount', start: 'Start', end: 'End', user: 'User', noSubscriptions: 'No subscriptions found', quickActionHint: 'Scans all subscriptions past their end date and marks them expired.', planFree: 'Free', planBasic: 'Basic', planPremium: 'Premium', planEnterprise: 'Enterprise', tableCaption: 'Subscriptions table showing user, plan, status and billing dates' },
  moderation: { title: 'Social Feed Moderation', subtitle: 'Review, flag and delete community posts', postFilter: 'Post filter', allPosts: 'All posts', reportedOnly: 'Reported only', flagged: 'Flagged', likes: 'likes', comments: 'comments', viewSource: 'View source', unflag: 'Unflag', flag: 'Flag', delete: 'Delete', noPosts: 'No posts found', loadingPosts: 'Loading posts...', confirmDelete: 'Are you sure you want to delete this post?', unknownAuthor: 'Unknown', attachmentAlt: 'Post attachment by {author}' },
  products: { title: 'Product Catalog', subtitle: 'Scraped dermatological products from Dermaceutic', triggerScrape: 'Trigger Scrape', scraping: 'Scraping...', dataFile: 'Data file', filesAvailable: 'files available', viewSource: 'View source', noProductsInFile: 'No products in this file', selectDataFile: 'Select a data file to view products', productImageAlt: 'Product image', unnamedProduct: 'Unnamed' },
  churn: { title: 'Churn & Retention', subtitle: 'ML-powered churn prediction and re-engagement', churnRate: 'Churn Rate', atRiskUsers: 'At-Risk Users', totalAnalyzed: 'Total Analyzed', avgProbability: 'Avg Probability', riskDistribution: 'Risk Distribution', actions: 'Actions', runAnalysis: 'Run Churn Analysis', runningAnalysis: 'Running ML Analysis...', runAnalysisHint: 'Runs the ML model on all users and updates churn probabilities.', sendEmails: 'Send Retention Emails', sending: 'Sending...', sendEmailsHint: 'Sends a personalized re-engagement email to all at-risk users.', emailsSent: 'Retention emails sent', atRiskTable: 'At-Risk Users', name: 'Name', email: 'Email', probability: 'Churn Probability', lastLogin: 'Last Login', subscription: 'Subscription', noAtRiskUsers: 'No at-risk users', chartAria: 'Bar chart of churn risk distribution', tableCaption: 'At-risk users table with churn probability and subscription information' },
  ai: { title: 'AI & Chat Monitor', subtitle: 'AI Coach usage, conversation metrics and trends', totalConversations: 'Total Conversations', totalMessages: 'Total Messages', activeUsers: 'Active Users (Chat)', avgMessagesPerChat: 'Avg Messages/Chat', dailyVolume: 'Daily Message Volume', topTopics: 'Top Topics', noTopicData: 'No topic data available yet', modelPerformance: 'Model Performance', avgResponseTime: 'Avg Response Time', errorRate: 'Error Rate', tokenUsage: 'Token Usage (total)', loadingStats: 'Loading chat statistics...', mentions: 'mentions', chartAria: 'Bar chart of daily AI chat message volume' },
  notifications: { title: 'Notifications Center', subtitle: 'Broadcast messages and manage notification history', broadcastTitle: 'Broadcast Notification', broadcastSubtitle: '', notificationTitle: 'Title', type: 'Type', message: 'Message', actionUrlOptional: 'Action URL (optional)', sendToAll: 'Broadcast to All Users', sending: 'Sending...', cleanup: 'Cleanup', deleteOlderThan: 'Delete > {days} days', recentNotifications: 'Recent Notifications', noNotifications: 'No notifications', confirmCleanup: 'Delete all notifications older than {days} days?', typeInfo: 'Info', typeWarning: 'Warning', typeSuccess: 'Success', typeError: 'Error' },
  reclamations: { title: 'Reclamations Center', subtitle: 'Track complaints imported from the n8n spreadsheet', total: 'Total Reclamations', inProgress: 'In Progress', unsatisfied: 'Unsatisfied Sentiment', search: 'Search reclamations', searchPlaceholder: 'Search by id, client, email, type or status', allStatuses: 'All statuses', id: 'ID', date: 'Date', client: 'Client', email: 'Email', type: 'Type / AI Category', sentiment: 'Sentiment', delay: 'Handling Delay', status: 'Status', description: 'Description', actions: 'Actions', markDone: 'Mark done', doneStatus: 'Done', autoRefreshHint: 'Auto-refresh every 45 seconds', lastUpdated: 'Last update', openSource: 'Open Source Sheet', noData: 'No reclamations found', loading: 'Loading reclamations...', loadError: 'Unable to load reclamations from Google Sheets.' },
};

const fr: AdminLocale = {
  ...en,
  sidebar: { overview: 'Vue d\'ensemble', bi: 'Dashboard BI', users: 'Utilisateurs', skinAnalysis: 'Analyse cutanee', subscriptions: 'Abonnements', moderation: 'Moderation du feed', churn: 'Retention', aiChat: 'IA et Chat', catalog: 'Catalogue produits', notifications: 'Notifications', reclamations: 'Reclamations', logout: 'Deconnexion' },
  common: { refresh: 'Actualiser', apply: 'Appliquer', loading: 'Chargement...', active: 'Actif', suspended: 'Suspendu', noData: 'Aucune donnee', unknown: 'Inconnu', notAvailable: 'N/A', freePlan: 'Gratuit' },
  overview: { ...en.overview, title: 'Vue d\'ensemble Admin', subtitle: 'KPI globaux et tendances de la plateforme', totalUsers: 'Utilisateurs totaux', activeSubscriptions: 'Abonnements actifs', scansToday: 'Scans aujourd\'hui', churnRate: 'Taux de churn', signupsOverTime: 'Inscriptions utilisateurs', tierDistribution: 'Repartition des abonnements', topConditions: 'Conditions de peau les plus detectees' },
  bi: { ...en.bi, title: 'Dashboard BI Avance', subtitle: 'Business intelligence et analytics de croissance', totalUsers: 'Utilisateurs totaux', newUsers30: 'Nouveaux utilisateurs (30j)', activeUsers30: 'Utilisateurs actifs (30j)', conversionRate: 'Taux de conversion', mrr: 'MRR', arpu: 'ARPU', delta: 'Variation', activityTrend: 'Tendance d activite sur 14 jours', funnel: 'Tunnel d acquisition', registered: 'Inscrits', onboarded: 'Onboardes', analyzed: 'Analyses', subscribed: 'Abonnes payants', retained30: 'Retenus 30j', riskDistribution: 'Repartition du risque de churn', avgRiskScore: 'Score de risque moyen', topConcerns: 'Top problemes de peau (90j)', analysesLast30: 'Analyses (30j)', avgProcessing: 'Temps moyen de traitement', alertsLast30: 'Alertes peau (30j)', unreadAlerts: 'Alertes non lues', noActivity14: 'Aucune activite disponible sur les 14 derniers jours' },
  users: { ...en.users, title: 'Gestion des utilisateurs', subtitle: 'Rechercher, filtrer et gerer les utilisateurs', searchUsers: 'Rechercher des utilisateurs', searchPlaceholder: 'Rechercher par nom ou email', status: 'Statut', allStatuses: 'Tous les statuts', usersFound: 'utilisateurs trouves', name: 'Nom', email: 'Email', subscription: 'Abonnement', joinDate: 'Date d\'inscription', actions: 'Actions', view: 'Voir', suspend: 'Suspendre', activate: 'Activer', noUsers: 'Aucun utilisateur trouve', loadingUsers: 'Chargement des utilisateurs...', profileSummary: 'Profil utilisateur', profileRole: 'Role', profileAnalyses: 'Analyses' },
  analysis: { ...en.analysis, title: 'Suivi des analyses cutanees', subtitle: 'Suivre les scans, scores et reexecuter les analyses en echec', fromDate: 'Date debut', toDate: 'Date fin', skinType: 'Type de peau', minScore: 'Score min', maxScore: 'Score max', user: 'Utilisateur', date: 'Date', skinScore: 'Score peau', conditions: 'Conditions', aiResponseTime: 'Temps IA', status: 'Statut', action: 'Action', retry: 'Relancer', noAnalyses: 'Aucune analyse pour ces filtres', loadingAnalyses: 'Chargement des analyses...' },
  subscriptions: { ...en.subscriptions, title: 'Gestion des abonnements', subtitle: 'Revenus, repartition des plans et statut des abonnes', active: 'Actifs', total: 'Total', expired: 'Expires', planDistribution: 'Repartition des plans', quickActions: 'Actions rapides', expireOverdue: 'Verifier et expirer les abonnements en retard', plan: 'Plan', status: 'Statut', allPlans: 'Tous les plans', allStatuses: 'Tous les statuts', cancelled: 'Annule', amount: 'Montant', start: 'Debut', end: 'Fin', user: 'Utilisateur', noSubscriptions: 'Aucun abonnement trouve', quickActionHint: 'Parcourt les abonnements depasses et les marque comme expires.', planFree: 'Gratuit', planBasic: 'Basique', planPremium: 'Premium', planEnterprise: 'Entreprise', tableCaption: 'Tableau des abonnements avec utilisateur, plan, statut et dates de facturation' },
  moderation: { ...en.moderation, title: 'Moderation du feed social', subtitle: 'Verifier, signaler et supprimer les publications', postFilter: 'Filtre des posts', allPosts: 'Tous les posts', reportedOnly: 'Signales uniquement', flagged: 'Signale', likes: 'likes', comments: 'commentaires', unflag: 'Retirer le signalement', flag: 'Signaler', delete: 'Supprimer', noPosts: 'Aucun post trouve', loadingPosts: 'Chargement des posts...', confirmDelete: 'Voulez-vous vraiment supprimer cette publication ?', unknownAuthor: 'Inconnu', attachmentAlt: 'Piece jointe de {author}' },
  products: { ...en.products, title: 'Catalogue produits', subtitle: 'Produits dermatologiques collectes depuis Dermaceutic', triggerScrape: 'Lancer le scraping', scraping: 'Scraping...', dataFile: 'Fichier de donnees', filesAvailable: 'fichier(s) disponible(s)', viewSource: 'Voir la source', noProductsInFile: 'Aucun produit dans ce fichier', selectDataFile: 'Selectionnez un fichier pour voir les produits', productImageAlt: 'Image du produit', unnamedProduct: 'Sans nom' },
  churn: { ...en.churn, title: 'Churn et retention', subtitle: 'Prediction du churn et re-engagement par ML', churnRate: 'Taux de churn', atRiskUsers: 'Utilisateurs a risque', totalAnalyzed: 'Total analyses', avgProbability: 'Probabilite moyenne', riskDistribution: 'Repartition du risque', actions: 'Actions', runAnalysis: 'Lancer l\'analyse churn', runningAnalysis: 'Analyse ML en cours...', runAnalysisHint: 'Lance le modele ML sur tous les utilisateurs et met a jour les probabilites de churn.', sendEmails: 'Envoyer les emails de retention', sending: 'Envoi en cours...', sendEmailsHint: 'Envoie un email personnalise de re-engagement a tous les utilisateurs a risque.', emailsSent: 'Emails de retention envoyes', atRiskTable: 'Utilisateurs a risque', name: 'Nom', email: 'Email', probability: 'Probabilite de churn', lastLogin: 'Derniere connexion', subscription: 'Abonnement', noAtRiskUsers: 'Aucun utilisateur a risque', chartAria: 'Graphique en barres de la repartition du risque de churn', tableCaption: 'Tableau des utilisateurs a risque avec probabilite de churn et abonnement' },
  ai: { ...en.ai, title: 'Suivi IA et Chat', subtitle: 'Usage du coach IA, metriques des conversations et tendances', totalConversations: 'Conversations totales', totalMessages: 'Messages totaux', activeUsers: 'Utilisateurs actifs (chat)', avgMessagesPerChat: 'Moy. messages/chat', dailyVolume: 'Volume quotidien des messages', topTopics: 'Sujets principaux', noTopicData: 'Aucune donnee de sujet disponible', modelPerformance: 'Performance du modele', avgResponseTime: 'Temps de reponse moyen', errorRate: 'Taux d\'erreur', tokenUsage: 'Utilisation tokens (total)', loadingStats: 'Chargement des statistiques chat...', mentions: 'mentions', chartAria: 'Graphique en barres du volume quotidien des messages IA' },
  notifications: { ...en.notifications, title: 'Centre de notifications', subtitle: 'Diffuser des messages et gerer l\'historique', broadcastTitle: 'Diffuser une notification', notificationTitle: 'Titre', type: 'Type', message: 'Message', actionUrlOptional: 'URL d\'action (optionnel)', sendToAll: 'Diffuser a tous les utilisateurs', sending: 'Envoi en cours...', cleanup: 'Nettoyage', deleteOlderThan: 'Supprimer > {days} jours', recentNotifications: 'Notifications recentes', noNotifications: 'Aucune notification', confirmCleanup: 'Supprimer toutes les notifications de plus de {days} jours ?', typeInfo: 'Info', typeWarning: 'Alerte', typeSuccess: 'Succes', typeError: 'Erreur' },
  reclamations: { ...en.reclamations, title: 'Centre des reclamations', subtitle: 'Suivi des reclamations importees depuis le fichier n8n', total: 'Reclamations totales', inProgress: 'En cours', unsatisfied: 'Sentiment insatisfait', search: 'Rechercher des reclamations', searchPlaceholder: 'Rechercher par id, client, email, type ou statut', type: 'Type / Categorie IA', delay: 'Delai traitement', actions: 'Actions', markDone: 'Marquer termine', doneStatus: 'Termine', autoRefreshHint: 'Actualisation automatique toutes les 45 secondes', lastUpdated: 'Derniere mise a jour', openSource: 'Ouvrir la feuille source', noData: 'Aucune reclamation trouvee', loading: 'Chargement des reclamations...', loadError: 'Impossible de charger les reclamations depuis Google Sheets.' },
};

const ar: AdminLocale = {
  ...en,
  sidebar: { overview: 'نظرة عامة', bi: 'لوحة BI', users: 'المستخدمون', skinAnalysis: 'تحليل البشرة', subscriptions: 'الاشتراكات', moderation: 'إدارة المحتوى', churn: 'الاحتفاظ', aiChat: 'الذكاء الاصطناعي', catalog: 'كتالوج المنتجات', notifications: 'الإشعارات', reclamations: 'الشكاوى', logout: 'تسجيل الخروج' },
  common: { refresh: 'تحديث', apply: 'تطبيق', loading: 'جار التحميل...', active: 'نشط', suspended: 'موقوف', noData: 'لا توجد بيانات' },
  overview: { ...en.overview, title: 'لوحة إدارة عامة', subtitle: 'مؤشرات الأداء والاتجاهات العامة' },
  bi: { ...en.bi, title: 'لوحة ذكاء الأعمال', subtitle: 'تحليلات متقدمة للنمو والأداء' },
  users: { ...en.users, title: 'إدارة المستخدمين', subtitle: 'بحث وتصفية وإدارة المستخدمين', searchUsers: 'بحث المستخدمين', searchPlaceholder: 'ابحث بالاسم أو البريد', status: 'الحالة', allStatuses: 'كل الحالات', usersFound: 'مستخدمون', name: 'الاسم', email: 'البريد', subscription: 'الاشتراك', joinDate: 'تاريخ الانضمام', actions: 'الإجراءات', view: 'عرض', suspend: 'إيقاف', activate: 'تفعيل', noUsers: 'لا يوجد مستخدمون', loadingUsers: 'جار تحميل المستخدمين...' },
  analysis: { ...en.analysis, title: 'مراقبة تحليلات البشرة', subtitle: 'متابعة عمليات التحليل والنتائج وإعادة المحاولة' },
  subscriptions: { ...en.subscriptions, title: 'إدارة الاشتراكات', subtitle: 'الإيرادات وتوزيع الخطط وحالة المشتركين' },
  moderation: { ...en.moderation, title: 'إدارة المنشورات', subtitle: 'مراجعة المنشورات والإبلاغ والحذف' },
  products: { ...en.products, title: 'كتالوج المنتجات', subtitle: 'منتجات جلدية مجمعة من Dermaceutic', triggerScrape: 'تشغيل الجمع', scraping: 'جار الجمع...' },
  churn: { ...en.churn, title: 'التسرب والاحتفاظ', subtitle: 'التنبؤ بالتسرب وإعادة التفاعل', runAnalysisHint: 'تشغيل نموذج التعلم الآلي على كل المستخدمين وتحديث احتمالات التسرب.', sendEmailsHint: 'إرسال بريد مخصص لإعادة التفاعل لكل المستخدمين المعرضين للتسرب.', emailsSent: 'تم إرسال رسائل الاحتفاظ' },
  ai: { ...en.ai, title: 'مراقبة الذكاء الاصطناعي', subtitle: 'استخدام الدردشة والذكاء الاصطناعي' },
  notifications: { ...en.notifications, title: 'مركز الإشعارات', subtitle: 'بث الرسائل وإدارة سجل الإشعارات', sendToAll: 'إرسال لجميع المستخدمين' },
  reclamations: { ...en.reclamations, title: 'مركز الشكاوى', subtitle: 'متابعة الشكاوى القادمة من ملف n8n', inProgress: 'قيد المعالجة', unsatisfied: 'مشاعر غير راضية', search: 'بحث في الشكاوى', allStatuses: 'كل الحالات', type: 'النوع / تصنيف الذكاء', delay: 'مهلة المعالجة', actions: 'إجراءات', markDone: 'وضع كمكتملة', doneStatus: 'مكتملة', autoRefreshHint: 'تحديث تلقائي كل 45 ثانية', lastUpdated: 'آخر تحديث', openSource: 'فتح المصدر', noData: 'لا توجد شكاوى', loading: 'جار تحميل الشكاوى...', loadError: 'تعذر تحميل الشكاوى من Google Sheets.' },
};

const es: AdminLocale = {
  ...en,
  sidebar: { overview: 'Resumen', bi: 'Panel BI', users: 'Usuarios', skinAnalysis: 'Analisis de piel', subscriptions: 'Suscripciones', moderation: 'Moderacion', churn: 'Retencion', aiChat: 'IA y Chat', catalog: 'Catalogo de productos', notifications: 'Notificaciones', reclamations: 'Reclamaciones', logout: 'Cerrar sesion' },
  common: { refresh: 'Actualizar', apply: 'Aplicar', loading: 'Cargando...', active: 'Activo', suspended: 'Suspendido', noData: 'Sin datos' },
  overview: { ...en.overview, title: 'Resumen de administrador', subtitle: 'KPIs globales y tendencias de la plataforma' },
  bi: { ...en.bi, title: 'Panel BI Avanzado', subtitle: 'Inteligencia de negocio y analitica de crecimiento' },
  users: { ...en.users, title: 'Gestion de usuarios', subtitle: 'Buscar, filtrar y gestionar usuarios', searchUsers: 'Buscar usuarios', searchPlaceholder: 'Buscar por nombre o email', status: 'Estado', allStatuses: 'Todos los estados', usersFound: 'usuarios encontrados', joinDate: 'Fecha de alta', actions: 'Acciones', noUsers: 'No se encontraron usuarios', loadingUsers: 'Cargando usuarios...' },
  analysis: { ...en.analysis, title: 'Monitor de analisis de piel', subtitle: 'Monitorea escaneos, puntajes y reintentos' },
  subscriptions: { ...en.subscriptions, title: 'Gestion de suscripciones', subtitle: 'Ingresos, distribucion de planes y estado de suscriptores' },
  moderation: { ...en.moderation, title: 'Moderacion del feed social', subtitle: 'Revisar, marcar y eliminar publicaciones' },
  products: { ...en.products, title: 'Catalogo de productos', subtitle: 'Productos dermatologicos extraidos de Dermaceutic', triggerScrape: 'Iniciar scraping', scraping: 'Extrayendo...' },
  churn: { ...en.churn, title: 'Churn y retencion', subtitle: 'Prediccion de abandono y reenganche', runAnalysisHint: 'Ejecuta el modelo ML para todos los usuarios y actualiza las probabilidades de abandono.', sendEmailsHint: 'Envia un correo personalizado de reenganche a todos los usuarios en riesgo.', emailsSent: 'Correos de retencion enviados' },
  ai: { ...en.ai, title: 'Monitor de IA y chat', subtitle: 'Uso del asistente IA, metricas y tendencias' },
  notifications: { ...en.notifications, title: 'Centro de notificaciones', subtitle: 'Difundir mensajes y gestionar el historial', sendToAll: 'Difundir a todos los usuarios' },
  reclamations: { ...en.reclamations, title: 'Centro de reclamaciones', subtitle: 'Seguimiento de reclamaciones importadas desde n8n', total: 'Reclamaciones totales', inProgress: 'En proceso', unsatisfied: 'Sentimiento insatisfecho', search: 'Buscar reclamaciones', searchPlaceholder: 'Buscar por id, cliente, email, tipo o estado', type: 'Tipo / Categoria IA', delay: 'Tiempo de gestion', actions: 'Acciones', markDone: 'Marcar como resuelta', doneStatus: 'Resuelta', autoRefreshHint: 'Actualizacion automatica cada 45 segundos', lastUpdated: 'Ultima actualizacion', openSource: 'Abrir hoja fuente', noData: 'No se encontraron reclamaciones', loading: 'Cargando reclamaciones...', loadError: 'No se pudieron cargar las reclamaciones desde Google Sheets.' },
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
