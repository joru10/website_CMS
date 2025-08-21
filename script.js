// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

    });
});

// Mobile menu toggle
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('hidden');
}

// Scroll to contact
function scrollToContact() {
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
}

// Show demo modal
function showDemo() {
    document.getElementById('demoModal').classList.remove('hidden');
}

// Close demo modal
function closeDemo() {
    document.getElementById('demoModal').classList.add('hidden');
}

// Language switcher functions
function toggleLanguageMenu() {
    const menu = document.getElementById('languageMenu');
    menu.classList.toggle('hidden');
}

// Close language menu when clicking outside
document.addEventListener('click', function(event) {
    const languageSwitcher = document.getElementById('languageSwitcher');
    const languageMenu = document.getElementById('languageMenu');
    
    if (languageSwitcher && !languageSwitcher.contains(event.target)) {
        languageMenu.classList.add('hidden');
    }
});
async function setLanguage(lang) { // <-- 1. Added 'async' here
    // Hide the language menu
    document.getElementById('languageMenu').classList.add('hidden');
    
    // Update current language display
    const currentLangDisplay = document.getElementById('currentLang');
    const langNames = {
        'en': 'EN',
        'fr': 'FR', 
        'es': 'ES'
    };
    
    currentLangDisplay.textContent = langNames[lang];
    
    // Store language preference
    localStorage.setItem('rapidai-language', lang);
    
    // Load dynamic content from CMS before applying static translations
    await Promise.all([
        loadServicesContent(lang),
        loadEducationContent(lang),
        loadNewsContent(lang),
        loadSuccessStoriesContent(lang),
        loadTestimonialsContent(lang),
        loadResourcesOverview(lang)
    ]);
    
    // Apply translations
    applyTranslations(lang);
    
    // Load Intro/Hero content from CMS (overrides static translations)
    await loadIntroContent(lang);
    // Load About content from CMS (overrides static translations)
    await loadAboutContent(lang);
    // Load Resources Intro content from CMS (overrides static translations)
    await loadResourcesIntro(lang);
    // Load Values content from CMS (overrides static translations)
    await loadValuesContent(lang);
    
    // Override hero claims with CMS/JSON content
    await loadClaimsAndStats();
    
    // Show language change confirmation
    showLanguageChangeNotification(lang);
}

function applyTranslations(lang) {
    // Translation object with all content
    const translations = {
        'en': {
            // Navigation
            'nav-services': 'Services',
            'nav-about': 'About',
            'nav-process': 'Process',
            'nav-resources': 'Resources',
            'nav-testimonials': 'Success Stories',
            'nav-get-started': 'Get Started',
            'feature-rapid': 'Rapid AI Implementation',
            'feature-personalized': 'Personalized Solutions',
            'stat-speed': '90% Faster',
            'stat-speed-label': 'AI Implementation',
            'values-cta-title': 'Ready to Experience These Values in Action?',
            'values-cta-subtitle': "Let's discuss how our approach can transform your business operations with AI.",
            'stat-projects': 'AI Projects Delivered',
            'stat-satisfaction': 'Client Satisfaction Rate',
            'stat-efficiency': 'Average Efficiency Gain',
            'newsletter-placeholder': 'Enter your business email',
            'newsletter-join': 'Join Free',
            'newsletter-note': 'Free forever. No spam. Unsubscribe anytime. 2,000+ SME leaders trust us.',
            'contact-email-me': 'Email Me',
            'contact-call-me': 'Call Me',
            'contact-schedule-call': 'Schedule a Call',
            'contact-availability': 'Available Mon-Fri 9AM-6PM EST',
            
            // Hero Section
            'hero-title': 'AI Implementation <span class="gradient-text">Doesn\'t Have to Be Overwhelming</span>',
            'hero-subtitle': 'When competitive pressure rises and efficiency demands grow, AI adoption can feel impossible. Yet with the right approach, AI implementation can be simple, fast, and highly effective.',
            'hero-quote': '"<em>Are we falling behind? Will we stay competitive? Are we using our time wisely?</em>"',
            'hero-signature': '<strong>We get it. And we\'re here to help.</strong> — Jose Ruiz, RapidAI',
            'hero-cta': 'Start Your AI Journey',
            
            // Services Section
            'services-title': 'RapidAI Services',
            'services-subtitle': 'Fast, effective AI solutions tailored to your business needs',
            'service1-title': 'AI Strategy & Consulting',
            'service1-description': 'Comprehensive AI strategy development to identify opportunities and create actionable implementation roadmaps for your business.',
            'service1-feature1': 'AI opportunity assessment',
            'service1-feature2': 'Custom implementation roadmap',
            'service1-feature3': 'ROI analysis & projections',
            'service2-title': 'Process Automation',
            'service2-description': 'Streamline your operations with intelligent automation solutions that reduce costs and increase efficiency.',
            'service2-feature1': 'Workflow optimization',
            'service2-feature2': 'Task automation',
            'service2-feature3': 'Integration with existing systems',
            'service3-title': 'Custom AI Solutions',
            'service3-description': 'Bespoke AI applications designed specifically for your industry and business requirements.',
            'service3-feature1': 'Machine learning models',
            'service3-feature2': 'Natural language processing',
            'service3-feature3': 'Predictive analytics',
            
            // About Section
            'about-title': 'Meet Jose Ruiz',
            'about-description': 'With years of experience in artificial intelligence and business transformation, I specialize in helping companies rapidly implement AI solutions that deliver measurable results.',
            'about-expertise': 'Expert in Machine Learning & AI Implementation',
            'about-experience': 'Proven track record with businesses of all sizes',
            'about-focus': 'Focus on rapid implementation and quick wins',
            
            // Resources Section
            'resources-title': 'AI Resources',
            'resources-subtitle': 'Practical AI implementation guides, tools, and case studies for SME leaders',
            
            // Process Section
            'process-title': 'Implement AI with Speed, Precision, and Confidence',
            'process-subtitle': 'A clear 4-step process that takes you from uncertainty to results',
            'process-step1-title': 'Schedule AI Readiness Consultation',
            'process-step1-desc': 'We analyze your business needs and identify the highest-impact AI opportunities. Clear assessment, no overwhelm.',
            'process-step2-title': 'Assess Your AI Opportunities',
            'process-step2-desc': 'We understand your business needs and see exactly how AI can help. Tailored roadmap, clear next steps.',
            'process-step3-title': 'Review Implementation Plan',
            'process-step3-desc': 'We review our detailed roadmap and agree on next steps. Clear timeline, transparent process, no surprises.',
            'process-step4-title': 'Implement with Speed, Precision, and Confidence',
            'process-step4-desc': 'Transform your business operations with AI solutions that deliver measurable results from day one.',
            
            // Testimonials Section
            'testimonials-title': 'Client Success Stories',
            'testimonials-subtitle': 'See how businesses are thriving with RapidAI solutions',
            'testimonial1-quote': '"Jose delivered our AI chatbot in just 2 weeks. Our customer response time improved by 80% and customer satisfaction scores are at an all-time high."',
            'testimonial1-metric1': 'Faster Response',
            'testimonial1-metric2': 'Satisfaction',
            'testimonial2-quote': '"The inventory prediction system Jose built has reduced our waste by 45% and increased profits by 30%. The ROI was immediate and significant."',
            'testimonial2-metric1': 'Waste Reduction',
            'testimonial2-metric2': 'Profit Increase',
            'testimonial3-quote': '"Jose\'s expertise in AI and rapid implementation approach saved us months of development time. Our predictive analytics platform is now our competitive advantage."',
            'testimonial3-metric1': 'Time Saved',
            'testimonial3-metric2': 'ROI Achieved',
            
            // Contact Section
            'contact-title': 'Let\'s Talk AI',
            'contact-subtitle': 'Ready to transform your business with rapid AI implementation?',
            'contact-first-name': 'First Name',
            'contact-last-name': 'Last Name',
            'contact-company': 'Company Name',
            'contact-industry': 'Industry',
            'contact-select-industry': 'Select Industry',
            'contact-industry-retail': 'Retail',
            'contact-industry-manufacturing': 'Manufacturing',
            'contact-industry-healthcare': 'Healthcare',
            'contact-industry-finance': 'Finance',
            'contact-industry-technology': 'Technology',
            'contact-industry-services': 'Services',
            'contact-industry-other': 'Other',
            'contact-email': 'Email Address',
            'contact-phone': 'Phone Number',
            'contact-project': 'Project Description',
            'contact-placeholder': 'Tell me about your business challenges and AI goals...',
            'contact-submit': 'Request Free Consultation',
            
            // Footer Section
            'footer-tagline': 'Rapid AI implementation for business transformation.',
            'footer-author': 'By Jose Ruiz',
            'footer-services': 'Services',
            'footer-ai-strategy': 'AI Strategy',
            'footer-automation': 'Process Automation',
            'footer-custom-ai': 'Custom AI Solutions',
            'footer-implementation': 'Implementation',
            'footer-resources': 'Resources',
            'footer-blog': 'Education',
            'footer-case-studies': 'Case Studies',
            'footer-insights': 'AI Insights',
            'footer-consultation': 'Consultation',
            'footer-connect': 'Connect',
            'footer-copyright': '© 2024 RapidAI by Jose Ruiz. All rights reserved.',
            
            // Modal Section
            'modal-title': 'RapidAI Case Studies',
            'modal-content': 'Case study content would be displayed here',
            
            // SME Trust/Clients Section
            'clients-title': 'Trusted by Forward-Thinking SMEs',
            'clients-subtitle': 'Join innovative technology companies that have transformed their operations with AI',
            
            // Newsletter Section
            'newsletter-name': 'RapidAI Weekly',
            'newsletter-tagline': '#1 AI Newsletter for SMEs',
            'newsletter-title': 'Get Weekly AI Insights That Actually Work',
            'newsletter-description': 'Join <strong>500+ tech SME leaders</strong> who get practical AI implementation strategies, tools, and case studies delivered every Tuesday. No fluff, just actionable insights.',
            'newsletter-feature1': 'Weekly AI tool reviews and comparisons',
            'newsletter-feature2': 'Real SME implementation case studies',
            'newsletter-feature3': 'ROI calculators and assessment frameworks',
            'newsletter-feature4': 'Exclusive early access to resources',
            
            // Newsletter Issue Card
            'newsletter-issue-number': 'RapidAI Weekly #12',
            'newsletter-latest-issue': 'Latest Issue',
            'newsletter-issue-title': '"5 AI Tools That Save SMEs 20+ Hours Weekly"',
            'newsletter-content1': '📊 Tool Comparison: Claude vs ChatGPT for Business',
            'newsletter-content2': '🏭 Case Study: Manufacturing AI ROI in 30 Days',
            'newsletter-content3': '🛠️ Free Template: AI Implementation Checklist',
            'newsletter-content4': '💡 Quick Win: Automate Customer Support',
            'newsletter-read-time': '5 min read',
            'newsletter-open-rate': '98% open rate',
            
            // CTA Section
            'cta-title': 'Ready to Accelerate with AI?',
            'cta-subtitle': "Let's discuss how RapidAI can transform your business in weeks, not months",
            'cta-consultation': 'Schedule a Free Consultation',
            'cta-case-studies': 'View Case Studies',
            'cta-journey': 'Start Your AI Journey',
            
            // Values Section
            'values-title': 'Our AI Implementation Values',
            'values-subtitle': 'The principles that guide every RapidAI project',
            'value1-title': 'SME Focus',
            'value1-description': 'We prioritize the unique needs of small and medium enterprises. We understand your challenges, resource constraints, and growth ambitions. Every solution is designed specifically for SME success.',
            'value2-title': 'Technical Excellence',
            'value2-description': 'We uphold the highest standards of technical implementation and AI best practices. We stay current with industry trends and deliver solutions that are robust, scalable, and future-ready.',
            'value3-title': 'Clear Communication',
            'value3-description': 'We believe in transparent, jargon-free communication. We explain complex AI concepts in business terms you understand, keeping you informed every step of the way.',
            'value4-title': 'Long-Term Partnership',
            'value4-description': 'We aim to be your trusted AI advisor for the long term. We provide guidance and support throughout your AI journey, fostering lasting relationships based on mutual success.',
            'value5-title': 'Rapid Results',
            'value5-description': 'We are committed to delivering value quickly. We focus on implementations that show measurable ROI in weeks, not months, ensuring your AI investment pays off fast.',
            'value6-title': 'Measurable Impact',
            'value6-description': 'We take responsibility for delivering quantifiable results. We track metrics, measure ROI, and ensure your AI solutions create real business value you can see and measure.',
            
            // Resources Section
            'resources-newsletter-title': 'Weekly Newsletter',
            'resources-newsletter-desc': 'Get practical AI insights delivered to your inbox every Tuesday. No fluff, just actionable strategies.',
            'resources-issue12-title': 'Issue #12',
            'resources-issue12-desc': '5 AI Tools That Save SMEs 20+ Hours Weekly',
            'resources-issue11-title': 'Issue #11',
            'resources-issue11-desc': 'ChatGPT vs Claude: Which Is Better for Business?',
            'resources-issue10-title': 'Issue #10',
            'resources-issue10-desc': 'AI ROI Calculator: Measure Your Success',
            'resources-view-all': 'View All Issues →',
            'resources-guides-title': 'Insights & Perspectives',
            'resources-guides-desc': 'Articles and perspectives on AI implementation for SMEs.',
            'resources-guide1': 'AI Readiness Assessment',
            'resources-guide2': 'Customer Service Automation',
            'resources-guide3': 'Process Optimization Framework',
            'resources-guide4': 'ROI Measurement Templates',
            'resources-access-guides': 'View Articles →',
            'resources-stories-title': 'Success Stories',
            'resources-stories-desc': 'Real SME case studies with detailed ROI metrics and implementation timelines.',
            'resources-case1-title': 'Manufacturing AI',
            'resources-case1-desc': '45% waste reduction in 30 days',
            'resources-case2-title': 'Customer Support',
            'resources-case2-desc': '80% faster response times',
            'resources-case3-title': 'Data Analytics',
            'resources-case3-desc': '$200K+ annual savings',
            'resources-view-cases': 'View Case Studies →',
            
            // Assessment Section
            'assessment-title': '🚀 Free AI Readiness Assessment',
            'assessment-desc': 'Discover your AI implementation potential in 5 minutes. Get a personalized roadmap with specific recommendations and ROI projections.',
            'assessment-feature1': '✓ Industry-specific insights',
            'assessment-feature2': '✓ Cost-benefit analysis',
            'assessment-feature3': '✓ Implementation timeline',
            'assessment-button': 'Start Assessment',
            'cta-journey': 'Start Your AI Journey',
            'assessment-preview-title': 'Assessment Preview',
            'assessment-preview-quote': '"Takes 5 minutes, saves months of planning"',
            'assessment-completed': '500+ completed',
            // Services dynamic states
            'loading-services': 'Loading services...',
            'no-services': 'No services available.',
            // Education Section
            'education-title': 'Insights & Perspectives',
            'education-subtitle': 'Learn AI implementation step by step',
            'loading-education': 'Loading education...',
            'no-education-items': 'No education items available.',
            // News Section
            'loading-news': 'Loading news...',
            'no-news-items': 'No news items available.',
            // Case Studies Section
            'loading-cases': 'Loading case studies...',
            'no-cases': 'No case studies available.',
            // Testimonials Section (dynamic)
            'loading-testimonials': 'Loading testimonials...',
            'no-testimonials': 'No testimonials available.',
            'case-section-title': 'Case Studies',
            'case-section-subtitle': 'Real-world results from RapidAI implementations',
            'case-label-challenge': 'Challenge:',
            'case-label-solution': 'Solution:',
            'case-label-outcome': 'Outcome:'
        },
        'fr': {
            // Navigation
            'nav-services': 'Services',
            'nav-about': 'À propos',
            'nav-process': 'Processus',
            'nav-resources': 'Ressources',
            'nav-testimonials': 'Cas de Succès',
            'nav-get-started': 'Commencer',
            'feature-rapid': 'Implémentation IA Rapide',
            'feature-personalized': 'Solutions Personnalisées',
            'stat-speed': '90% Plus Rapide',
            'stat-speed-label': 'Implémentation IA',
            'values-cta-title': 'Prêt à Mettre Ces Valeurs en Action ?',
            'values-cta-subtitle': 'Discutons de la façon dont notre approche peut transformer vos opérations avec l’IA.',
            'stat-projects': 'Projets IA Livrés',
            'stat-satisfaction': 'Taux de Satisfaction Client',
            'stat-efficiency': 'Gain d’Efficacité Moyen',
            'newsletter-placeholder': 'Entrez votre email professionnel',
            'newsletter-join': 'Rejoindre Gratuitement',
            'newsletter-note': 'Gratuit pour toujours. Pas de spam. Désinscription à tout moment. 2 000+ dirigeants PME nous font confiance.',
            'contact-email-me': 'Envoyez-moi un Email',
            'contact-call-me': 'Appelez-moi',
            'contact-schedule-call': 'Planifier un Appel',
            'contact-availability': 'Disponible Lun-Ven 9h-18h EST',
            
            // Hero Section
            'hero-title': 'L\'implémentation de l\'IA <span class="gradient-text">ne doit pas être écrasante</span>',
            'hero-subtitle': 'Quand la pression concurrentielle monte et que les exigences d\'efficacité augmentent, l\'adoption de l\'IA peut sembler impossible. Cependant, avec la bonne approche, l\'implémentation de l\'IA peut être simple, rapide et très efficace.',
            'hero-quote': '"Sommes-nous en retard ? Resterons-nous compétitifs ? Utilisons-nous notre temps à bon escient ?"',
            'hero-signature': 'Nous comprenons. Et nous sommes là pour vous aider. — Jose Ruiz, RapidAI',
            'hero-cta': 'Commencez votre parcours IA',
            
            // Services Section
            'services-title': 'Services RapidAI',
            'services-subtitle': 'Solutions IA rapides et efficaces adaptées aux besoins de votre entreprise',
            'service1-title': 'Stratégie et Conseil IA',
            'service1-description': 'Développement complet de stratégie IA pour identifier les opportunités et créer des feuilles de route d\'implémentation pour votre entreprise.',
            'service1-feature1': 'Évaluation des opportunités IA',
            'service1-feature2': 'Feuille de route personnalisée',
            'service1-feature3': 'Analyse et projections ROI',
            'service2-title': 'Automatisation des Processus',
            'service2-description': 'Rationalisez vos opérations avec des solutions d\'automatisation intelligente qui réduisent les coûts et augmentent l\'efficacité.',
            'service2-feature1': 'Optimisation des flux de travail',
            'service2-feature2': 'Automatisation des tâches',
            'service2-feature3': 'Intégration avec les systèmes existants',
            'service3-title': 'Solutions IA Personnalisées',
            'service3-description': 'Applications IA sur mesure conçues spécifiquement pour votre secteur et vos exigences commerciales.',
            'service3-feature1': 'Modèles d\'apprentissage automatique',
            'service3-feature2': 'Traitement du langage naturel',
            'service3-feature3': 'Analytique prédictive',
            
            // About Section
            'about-title': 'Rencontrez Jose Ruiz',
            'about-description': 'Avec des années d\'expérience en intelligence artificielle et transformation commerciale, je me spécialise dans l\'aide aux entreprises pour mettre en œuvre rapidement des solutions IA qui offrent des résultats mesurables.',
            'about-expertise': 'Expert en apprentissage automatique et implémentation IA',
            'about-experience': 'Historique prouvé avec des entreprises de toutes tailles',
            'about-focus': 'Focus sur l\'implémentation rapide et les victoires rapides',
            
            // Resources Section
            'resources-title': 'Ressources IA',
            'resources-subtitle': 'Guides d\'implémentation IA pratiques, outils et études de cas pour les dirigeants de PME',
            
            // Process Section
            'process-title': 'Implémentez l\'IA avec Vitesse, Précision et Confiance',
            'process-subtitle': 'Un processus clair en 4 étapes qui vous mène de l\'incertitude aux résultats',
            'process-step1-title': 'Planifiez une Consultation de Préparation IA',
            'process-step1-desc': 'Nous analysons vos besoins commerciaux et identifions les opportunités IA à fort impact. Évaluation claire, sans accablement.',
            'process-step2-title': 'Évaluez vos Opportunités IA',
            'process-step2-desc': 'Nous comprenons vos besoins commerciaux et voyons exactement comment l\'IA peut aider. Feuille de route sur mesure, prochaines étapes claires.',
            'process-step3-title': 'Examinez le Plan d\'Implémentation',
            'process-step3-desc': 'Nous examinons notre feuille de route détaillée et nous accordons sur les prochaines étapes. Calendrier clair, processus transparent, aucune surprise.',
            'process-step4-title': 'Implémentez avec Vitesse, Précision et Confiance',
            'process-step4-desc': 'Transformez vos opérations commerciales avec des solutions IA qui offrent des résultats mesurables dès le premier jour.',
            
            // Testimonials Section
            'testimonials-title': 'Témoignages de Succès Client',
            'testimonials-subtitle': 'Découvrez comment les entreprises prospèrent avec les solutions RapidAI',
            'testimonial1-quote': '"Jose a livré notre chatbot IA en seulement 2 semaines. Notre temps de réponse client s\'est amélioré de 80% et les scores de satisfaction sont à leur plus haut niveau."',
            'testimonial1-metric1': 'Réponse Plus Rapide',
            'testimonial1-metric2': 'Satisfaction',
            'testimonial2-quote': '"Le système de prédiction d\'inventaire que Jose a construit a réduit nos déchets de 45% et augmenté nos profits de 30%. Le ROI a été immédiat et significatif."',
            'testimonial2-metric1': 'Réduction des Déchets',
            'testimonial2-metric2': 'Augmentation des Profits',
            'testimonial3-quote': '"L\'expertise de Jose en IA et son approche d\'implémentation rapide nous ont fait économiser des mois de développement. Notre plateforme d\'analytique prédictive est maintenant notre avantage concurrentiel."',
            'testimonial3-metric1': 'Temps Économisé',
            'testimonial3-metric2': 'ROI Atteint',
            
            // Contact Section
            'contact-title': 'Parlons IA',
            'contact-subtitle': 'Prêt à transformer votre entreprise avec une implémentation IA rapide ?',
            'contact-first-name': 'Prénom',
            'contact-last-name': 'Nom de famille',
            'contact-company': 'Nom de l\'entreprise',
            'contact-industry': 'Secteur d\'activité',
            'contact-select-industry': 'Sélectionnez le secteur',
            'contact-industry-retail': 'Commerce de détail',
            'contact-industry-manufacturing': 'Fabrication',
            'contact-industry-healthcare': 'Santé',
            'contact-industry-finance': 'Finance',
            'contact-industry-technology': 'Technologie',
            'contact-industry-services': 'Services',
            'contact-industry-other': 'Autre',
            'contact-email': 'Adresse e-mail',
            'contact-phone': 'Numéro de téléphone',
            'contact-project': 'Description du projet',
            'contact-placeholder': 'Parlez-moi de vos défis commerciaux et de vos objectifs IA...',
            'contact-submit': 'Demander une consultation gratuite',
            
            // Footer Section
            'footer-tagline': 'Implémentation IA rapide pour la transformation des entreprises.',
            'footer-author': 'Par Jose Ruiz',
            'footer-services': 'Services',
            'footer-ai-strategy': 'Stratégie IA',
            'footer-automation': 'Automatisation des processus',
            'footer-custom-ai': 'Solutions IA personnalisées',
            'footer-implementation': 'Implémentation',
            'footer-resources': 'Ressources',
            'footer-blog': 'Éducation',
            'footer-case-studies': 'Études de cas',
            'footer-insights': 'Insights IA',
            'footer-consultation': 'Consultation',
            'footer-connect': 'Connecter',
            'footer-copyright': '© 2024 RapidAI par Jose Ruiz. Tous droits réservés.',
            
            // Modal Section
            'modal-title': 'Études de cas RapidAI',
            'modal-content': 'Le contenu de l\'étude de cas serait affiché ici',
            
            // SME Trust/Clients Section
            'clients-title': 'Approuvé par les PME Avant-Gardistes',
            'clients-subtitle': 'Rejoignez les entreprises technologiques innovantes qui ont transformé leurs opérations avec l\'IA',
            
            // Newsletter Section
            'newsletter-name': 'RapidAI Hebdo',
            'newsletter-tagline': 'Newsletter IA N°1 pour les PME',
            'newsletter-title': 'Recevez des Insights IA Hebdomadaires qui Fonctionnent Vraiment',
            'newsletter-description': 'Rejoignez <strong>500+ dirigeants de PME tech</strong> qui reçoivent des stratégies d\'implémentation IA pratiques, des outils et des études de cas chaque mardi. Pas de superflu, juste des insights actionnables.',
            'newsletter-feature1': 'Revues et comparaisons d\'outils IA hebdomadaires',
            'newsletter-feature2': 'Études de cas d\'implémentation PME réelles',
            'newsletter-feature3': 'Calculateurs de ROI et frameworks d\'évaluation',
            'newsletter-feature4': 'Accès anticipé exclusif aux ressources',
            
            // Newsletter Issue Card
            'newsletter-issue-number': 'RapidAI Hebdo #12',
            'newsletter-latest-issue': 'Dernier Numéro',
            'newsletter-issue-title': '"5 Outils IA qui Font Gagner 20+ Heures par Semaine aux PME"',
            'newsletter-content1': '📊 Comparaison d\'Outils: Claude vs ChatGPT pour les Entreprises',
            'newsletter-content2': '🏭 Étude de Cas: ROI IA Manufacturier en 30 Jours',
            'newsletter-content3': '🛠️ Template Gratuit: Liste de Contrôle Implémentation IA',
            'newsletter-content4': '💡 Victoire Rapide: Automatiser le Support Client',
            'newsletter-read-time': '5 min de lecture',
            'newsletter-open-rate': '98% de taux d\'ouverture',
            
            // CTA Section
            'cta-title': 'Prêt à Accélérer avec l\'IA?',
            'cta-subtitle': 'Discutons de la façon dont RapidAI peut transformer votre entreprise en semaines, pas en mois',
            'cta-consultation': 'Programmer une Consultation Gratuite',
            'cta-case-studies': 'Voir les Études de Cas',
            'cta-journey': 'Commencer Votre Parcours IA',
            
            // Values Section
            'values-title': 'Nos Valeurs d\'Implémentation IA',
            'values-subtitle': 'Les principes qui guident chaque projet RapidAI',
            'value1-title': 'Focus PME',
            'value1-description': 'Nous priorisons les besoins uniques des petites et moyennes entreprises. Nous comprenons vos défis, contraintes de ressources et ambitions de croissance. Chaque solution est conçue spécifiquement pour le succès des PME.',
            'value2-title': 'Excellence Technique',
            'value2-description': 'Nous respectons les plus hauts standards d\'implémentation technique et les meilleures pratiques IA. Nous restons à jour avec les tendances de l\'industrie et livrons des solutions robustes, évolutives et prêtes pour l\'avenir.',
            'value3-title': 'Communication Claire',
            'value3-description': 'Nous croyons en une communication transparente, sans jargon. Nous expliquons les concepts IA complexes en termes commerciaux que vous comprenez, vous tenant informé à chaque étape.',
            'value4-title': 'Partenariat à Long Terme',
            'value4-description': 'Nous visons à être votre conseiller IA de confiance à long terme. Nous fournissons guidance et support tout au long de votre parcours IA, favorisant des relations durables basées sur le succès mutuel.',
            'value5-title': 'Résultats Rapides',
            'value5-description': 'Nous nous engageons à livrer de la valeur rapidement. Nous nous concentrons sur des implémentations qui montrent un ROI mesurable en semaines, pas en mois, assurant que votre investissement IA soit rentable rapidement.',
            'value6-title': 'Impact Mesurable',
            'value6-description': 'Nous prenons la responsabilité de livrer des résultats quantifiables. Nous suivons les métriques, mesurons le ROI, et assurons que vos solutions IA créent une vraie valeur commerciale que vous pouvez voir et mesurer.',
            
            // Resources Section
            'resources-newsletter-title': 'Newsletter Hebdomadaire',
            'resources-newsletter-desc': 'Recevez des insights IA pratiques dans votre boîte mail chaque mardi. Pas de remplissage, juste des stratégies actionnables.',
            'resources-issue12-title': 'Numéro #12',
            'resources-issue12-desc': '5 Outils IA qui Font Économiser 20h+ par Semaine aux PME',
            'resources-issue11-title': 'Numéro #11',
            'resources-issue11-desc': 'ChatGPT vs Claude: Lequel est Meilleur pour les Entreprises?',
            'resources-issue10-title': 'Numéro #10',
            'resources-issue10-desc': 'Calculateur ROI IA: Mesurez Votre Succès',
            'resources-view-all': 'Voir Tous les Numéros →',
            'resources-guides-title': 'Analyses & Perspectives',
            'resources-guides-desc': 'Articles et perspectives sur l\'implémentation de l\'IA pour les PME.',
            'resources-guide1': 'Évaluation de Préparation IA',
            'resources-guide2': 'Automatisation Service Client',
            'resources-guide3': 'Cadre d\'Optimisation des Processus',
            'resources-guide4': 'Modèles de Mesure ROI',
            'resources-access-guides': 'Voir les articles →',
            'resources-stories-title': 'Histoires de Succès',
            'resources-stories-desc': 'Études de cas réelles de PME avec métriques ROI détaillées et calendriers d\'implémentation.',
            'resources-case1-title': 'IA Manufacturière',
            'resources-case1-desc': '45% de réduction de gaspillage en 30 jours',
            'resources-case2-title': 'Support Client',
            'resources-case2-desc': '80% de temps de réponse plus rapides',
            'resources-case3-title': 'Analyse de Données',
            'resources-case3-desc': '200k$+ d\'économies annuelles',
            'resources-view-cases': 'Voir les Études de Cas →',
            
            // Assessment Section
            'assessment-title': '🚀 Évaluation Gratuite de Préparation IA',
            'assessment-desc': 'Découvrez votre potentiel d\'implémentation IA en 5 minutes. Obtenez une feuille de route personnalisée avec recommandations spécifiques et projections ROI.',
            'assessment-feature1': '✓ Insights spécifiques à l\'industrie',
            'assessment-feature2': '✓ Analyse coût-bénéfice',
            'assessment-feature3': '✓ Calendrier d\'implémentation',
            'assessment-button': 'Commencer l\'Évaluation',
            'cta-journey': 'Commencer Votre Parcours IA',
            'assessment-preview-title': 'Aperçu de l\'Évaluation',
            'assessment-preview-quote': '"Prend 5 minutes, économise des mois de planification"',
            'assessment-completed': '500+ complétées',
            // Services dynamic states
            'loading-services': 'Chargement des services...',
            'no-services': 'Aucun service disponible.',
            // Education Section
            'education-title': 'Analyses & Perspectives',
            'education-subtitle': "Apprenez l'implémentation IA étape par étape",
            'loading-education': 'Chargement des ressources...',
            'no-education-items': 'Aucune ressource disponible.',
            // News Section
            'loading-news': 'Chargement des actualités...',
            'no-news-items': 'Aucune actualité disponible.',
            // Case Studies Section
            'loading-cases': 'Chargement des études de cas...',
            'no-cases': 'Aucune étude de cas disponible.',
            // Testimonials Section (dynamic)
            'loading-testimonials': 'Chargement des témoignages...',
            'no-testimonials': 'Aucun témoignage disponible.',
            'case-section-title': 'Études de cas',
            'case-section-subtitle': 'Résultats concrets des implémentations RapidAI',
            'case-label-challenge': 'Défi :',
            'case-label-solution': 'Solution :',
            'case-label-outcome': 'Résultat :'
        },
        'es': {
            // Navigation
            'nav-services': 'Servicios',
            'nav-about': 'Acerca de',
            'nav-process': 'Proceso',
            'nav-resources': 'Recursos',
            'nav-testimonials': 'Casos de Éxito',
            'nav-get-started': 'Empezar',
            'feature-rapid': 'Implementación IA Rápida',
            'feature-personalized': 'Soluciones Personalizadas',
            'stat-speed': '90 % Más Rápido',
            'stat-speed-label': 'Implementación IA',
            'values-cta-title': '¿Listo para Poner Estos Valores en Acción?',
            'values-cta-subtitle': 'Hablemos de cómo nuestro enfoque puede transformar tus operaciones con IA.',
            'stat-projects': 'Proyectos IA Entregados',
            'stat-satisfaction': 'Tasa de Satisfacción de Clientes',
            'stat-efficiency': 'Promedio de Ganancia de Eficiencia',
            'newsletter-placeholder': 'Introduce tu correo empresarial',
            'newsletter-join': 'Únete Gratis',
            'newsletter-note': 'Gratis para siempre. Sin spam. Cancela en cualquier momento. Más de 2 000 líderes de PYMES confían en nosotros.',
            'contact-email-me': 'Envíame un Email',
            'contact-call-me': 'Llámame',
            'contact-schedule-call': 'Programar una Llamada',
            'contact-availability': 'Disponible Lun-Vie 9AM-6PM EST',
            
            // Hero Section
            'hero-title': 'La implementación de IA <span class="gradient-text">no tiene que ser abrumadora</span>',
            'hero-subtitle': 'Cuando aumenta la presión competitiva y crecen las demandas de eficiencia, la adopción de IA puede parecer imposible. Sin embargo, con el enfoque correcto, la implementación de IA puede ser simple, rápida y muy efectiva.',
            'hero-quote': '"¿Nos estamos quedando atrás? ¿Seguiremos siendo competitivos? ¿Estamos usando nuestro tiempo sabiamente?"',
            'hero-signature': 'Lo entendemos. Y estamos aquí para ayudar. — Jose Ruiz, RapidAI',
            'hero-cta': 'Inicia tu viaje con IA',
            
            // Services Section
            'services-title': 'Servicios RapidAI',
            'services-subtitle': 'Soluciones IA rápidas y efectivas adaptadas a las necesidades de su negocio',
            'service1-title': 'Estrategia y Consultoría IA',
            'service1-description': 'Desarrollo integral de estrategia IA para identificar oportunidades y crear hojas de ruta de implementación para su negocio.',
            'service1-feature1': 'Evaluación de oportunidades IA',
            'service1-feature2': 'Hoja de ruta personalizada',
            'service1-feature3': 'Análisis y proyecciones ROI',
            'service2-title': 'Automatización de Procesos',
            'service2-description': 'Optimice sus operaciones con soluciones de automatización inteligente que reducen costos y aumentan la eficiencia.',
            'service2-feature1': 'Optimización de flujos de trabajo',
            'service2-feature2': 'Automatización de tareas',
            'service2-feature3': 'Integración con sistemas existentes',
            'service3-title': 'Soluciones IA Personalizadas',
            'service3-description': 'Aplicaciones IA personalizadas diseñadas específicamente para su industria y requisitos comerciales.',
            'service3-feature1': 'Modelos de aprendizaje automático',
            'service3-feature2': 'Procesamiento de lenguaje natural',
            'service3-feature3': 'Análisis predictivo',
            
            // About Section
            'about-title': 'Conozca a Jose Ruiz',
            'about-description': 'Con años de experiencia en inteligencia artificial y transformación empresarial, me especializo en ayudar a las empresas a implementar rápidamente soluciones de IA que ofrecen resultados medibles.',
            'about-expertise': 'Experto en aprendizaje automático e implementación de IA',
            'about-experience': 'Historial comprobado con empresas de todos los tamaños',
            'about-focus': 'Enfoque en implementación rápida y victorias rápidas',
            
            // Resources Section
            'resources-title': 'Recursos de IA',
            'resources-subtitle': 'Guías prácticas de implementación de IA, herramientas y casos de estudio para líderes de PYMES',
            
            // Process Section
            'process-title': 'Implemente IA con Velocidad, Precisión y Confianza',
            'process-subtitle': 'Un proceso claro de 4 pasos que lo lleva de la incertidumbre a los resultados',
            'process-step1-title': 'Programe una Consulta de Preparación para IA',
            'process-step1-desc': 'Analizamos las necesidades de su negocio e identificamos las oportunidades de IA de mayor impacto. Evaluación clara, sin abrumar.',
            'process-step2-title': 'Evalúe sus Oportunidades de IA',
            'process-step2-desc': 'Entendemos las necesidades de su negocio y vemos exactamente cómo la IA puede ayudar. Hoja de ruta personalizada, pasos claros a seguir.',
            'process-step3-title': 'Revise el Plan de Implementación',
            'process-step3-desc': 'Revisamos nuestra hoja de ruta detallada y acordamos los próximos pasos. Cronograma claro, proceso transparente, sin sorpresas.',
            'process-step4-title': 'Implemente con Velocidad, Precisión y Confianza',
            'process-step4-desc': 'Transforme las operaciones de su negocio con soluciones de IA que entregan resultados medibles desde el primer día.',
            
            // Testimonials Section
            'testimonials-title': 'Casos de Éxito de Clientes',
            'testimonials-subtitle': 'Vea cómo las empresas están prosperando con las soluciones RapidAI',
            'testimonial1-quote': '"Jose entregó nuestro chatbot de IA en solo 2 semanas. Nuestro tiempo de respuesta al cliente mejoró un 80% y los puntajes de satisfacción están en su punto más alto."',
            'testimonial1-metric1': 'Respuesta Más Rápida',
            'testimonial1-metric2': 'Satisfacción',
            'testimonial2-quote': '"El sistema de predicción de inventario que Jose construyó ha reducido nuestros desperdicios en un 45% y aumentado las ganancias en un 30%. El ROI fue inmediato y significativo."',
            'testimonial2-metric1': 'Reducción de Desperdicios',
            'testimonial2-metric2': 'Aumento de Ganancias',
            'testimonial3-quote': '"La experiencia de Jose en IA y su enfoque de implementación rápida nos ahorró meses de tiempo de desarrollo. Nuestra plataforma de análisis predictivo es ahora nuestra ventaja competitiva."',
            'testimonial3-metric1': 'Tiempo Ahorrado',
            'testimonial3-metric2': 'ROI Logrado',
            
            // Contact Section
            'contact-title': 'Hablemos de IA',
            'contact-subtitle': '¿Listo para transformar su negocio con implementación rápida de IA?',
            'contact-first-name': 'Nombre',
            'contact-last-name': 'Apellido',
            'contact-company': 'Nombre de la empresa',
            'contact-industry': 'Industria',
            'contact-select-industry': 'Seleccionar industria',
            'contact-industry-retail': 'Comercio minorista',
            'contact-industry-manufacturing': 'Manufactura',
            'contact-industry-healthcare': 'Salud',
            'contact-industry-finance': 'Finanzas',
            'contact-industry-technology': 'Tecnología',
            'contact-industry-services': 'Servicios',
            'contact-industry-other': 'Otro',
            'contact-email': 'Dirección de correo electrónico',
            'contact-phone': 'Número de teléfono',
            'contact-project': 'Descripción del proyecto',
            'contact-placeholder': 'Cuénteme sobre los desafíos de su negocio y objetivos de IA...',
            'contact-submit': 'Solicitar consulta gratuita',
            
            // Footer Section
            'footer-tagline': 'Implementación rápida de IA para la transformación empresarial.',
            'footer-author': 'Por Jose Ruiz',
            'footer-services': 'Servicios',
            'footer-ai-strategy': 'Estrategia de IA',
            'footer-automation': 'Automatización de procesos',
            'footer-custom-ai': 'Soluciones de IA personalizadas',
            'footer-implementation': 'Implementación',
            'footer-resources': 'Recursos',
            'footer-blog': 'Educación',
            'footer-case-studies': 'Casos de estudio',
            'footer-insights': 'Insights de IA',
            'footer-consultation': 'Consulta',
            'footer-connect': 'Conectar',
            'footer-copyright': '© 2024 RapidAI por Jose Ruiz. Todos los derechos reservados.',
            
            // Modal Section
            'modal-title': 'Casos de estudio RapidAI',
            'modal-content': 'El contenido del caso de estudio se mostraría aquí',
            
            // SME Trust/Clients Section
            'clients-title': 'Confiado por PyMEs Visionarias',
            'clients-subtitle': 'Únete a empresas tecnológicas innovadoras que han transformado sus operaciones con IA',
            
            // Newsletter Section
            'newsletter-name': 'RapidAI Semanal',
            'newsletter-tagline': 'Newsletter IA #1 para PyMEs',
            'newsletter-title': 'Recibe Insights de IA Semanales que Realmente Funcionan',
            'newsletter-description': 'Únete a <strong>500+ líderes de PyMEs tech</strong> que reciben estrategias prácticas de implementación de IA, herramientas y casos de estudio cada martes. Sin relleno, solo insights accionables.',
            'newsletter-feature1': 'Reseñas y comparaciones de herramientas IA semanales',
            'newsletter-feature2': 'Casos de estudio reales de implementación en PyMEs',
            'newsletter-feature3': 'Calculadoras de ROI y marcos de evaluación',
            'newsletter-feature4': 'Acceso temprano exclusivo a recursos',
            
            // Newsletter Issue Card
            'newsletter-issue-number': 'RapidAI Semanal #12',
            'newsletter-latest-issue': 'Último Número',
            'newsletter-issue-title': '"5 Herramientas IA que Ahorran 20+ Horas Semanales a PyMEs"',
            'newsletter-content1': '📊 Comparación de Herramientas: Claude vs ChatGPT para Empresas',
            'newsletter-content2': '🏭 Caso de Estudio: ROI IA Manufacturero en 30 Días',
            'newsletter-content3': '🛠️ Plantilla Gratuita: Lista de Verificación Implementación IA',
            'newsletter-content4': '💡 Victoria Rápida: Automatizar Soporte al Cliente',
            'newsletter-read-time': '5 min de lectura',
            'newsletter-open-rate': '98% tasa de apertura',
            
            // CTA Section
            'cta-title': '¿Listo para Acelerar con IA?',
            'cta-subtitle': 'Discutamos cómo RapidAI puede transformar tu negocio en semanas, no meses',
            'cta-consultation': 'Programar una Consulta Gratuita',
            'cta-case-studies': 'Ver Casos de Estudio',
            'cta-journey': 'Comenzar Tu Viaje IA',
            
            // Values Section
            'values-title': 'Nuestros Valores de Implementación IA',
            'values-subtitle': 'Los principios que guían cada proyecto de RapidAI',
            'value1-title': 'Enfoque PyME',
            'value1-description': 'Priorizamos las necesidades únicas de pequeñas y medianas empresas. Entendemos tus desafíos, limitaciones de recursos y ambiciones de crecimiento. Cada solución está diseñada específicamente para el éxito de PyMEs.',
            'value2-title': 'Excelencia Técnica',
            'value2-description': 'Mantenemos los más altos estándares de implementación técnica y mejores prácticas de IA. Nos mantenemos al día con las tendencias de la industria y entregamos soluciones robustas, escalables y preparadas para el futuro.',
            'value3-title': 'Comunicación Clara',
            'value3-description': 'Creemos en la comunicación transparente, sin jerga. Explicamos conceptos complejos de IA en términos comerciales que entiendes, manteniéndote informado en cada paso del camino.',
            'value4-title': 'Sociedad a Largo Plazo',
            'value4-description': 'Aspiramos a ser tu asesor de IA de confianza a largo plazo. Proporcionamos guía y soporte durante todo tu viaje de IA, fomentando relaciones duraderas basadas en el éxito mutuo.',
            'value5-title': 'Resultados Rápidos',
            'value5-description': 'Nos comprometemos a entregar valor rápidamente. Nos enfocamos en implementaciones que muestran ROI medible en semanas, no meses, asegurando que tu inversión en IA sea rentable rápidamente.',
            'value6-title': 'Impacto Medible',
            'value6-description': 'Asumimos la responsabilidad de entregar resultados cuantificables. Seguimos métricas, medimos ROI, y aseguramos que tus soluciones IA creen valor comercial real que puedes ver y medir.',
            
            // Resources Section
            'resources-newsletter-title': 'Newsletter Semanal',
            'resources-newsletter-desc': 'Recibe insights de IA prácticos en tu bandeja de entrada cada martes. Sin relleno, solo estrategias accionables.',
            'resources-issue12-title': 'Número #12',
            'resources-issue12-desc': '5 Herramientas IA que Ahorran 20+ Horas Semanales a PyMEs',
            'resources-issue11-title': 'Número #11',
            'resources-issue11-desc': 'ChatGPT vs Claude: ¿Cuál es Mejor para Empresas?',
            'resources-issue10-title': 'Número #10',
            'resources-issue10-desc': 'Calculadora ROI IA: Mide tu Éxito',
            'resources-view-all': 'Ver Todos los Números →',
            'resources-guides-title': 'Perspectivas y Análisis',
            'resources-guides-desc': 'Artículos y perspectivas sobre la implementación de IA para PyMEs.',
            'resources-guide1': 'Evaluación de Preparación IA',
            'resources-guide2': 'Automatización Servicio al Cliente',
            'resources-guide3': 'Marco de Optimización de Procesos',
            'resources-guide4': 'Plantillas de Medición ROI',
            'resources-access-guides': 'Ver artículos →',
            'resources-stories-title': 'Historias de Éxito',
            'resources-stories-desc': 'Casos de estudio reales de PyMEs con métricas ROI detalladas y cronogramas de implementación.',
            'resources-case1-title': 'IA Manufacturera',
            'resources-case1-desc': '45% reducción de residuos en 30 días',
            'resources-case2-title': 'Soporte al Cliente',
            'resources-case2-desc': '80% tiempos de respuesta más rápidos',
            'resources-case3-title': 'Análisis de Datos',
            'resources-case3-desc': '$200K+ ahorros anuales',
            'resources-view-cases': 'Ver Casos de Estudio →',
            
            // Assessment Section
            'assessment-title': '🚀 Evaluación Gratuita de Preparación IA',
            'assessment-desc': 'Descubre tu potencial de implementación IA en 5 minutos. Obtén una hoja de ruta personalizada con recomendaciones específicas y proyecciones ROI.',
            'assessment-feature1': '✓ Insights específicos de la industria',
            'assessment-feature2': '✓ Análisis costo-beneficio',
            'assessment-feature3': '✓ Cronograma de implementación',
            'assessment-button': 'Comenzar Evaluación',
            'cta-journey': 'Comenzar Tu Viaje IA',
            'assessment-preview-title': 'Vista previa de Evaluación',
            'assessment-preview-quote': '"Toma 5 minutos, ahorra meses de planificación"',
            'assessment-completed': '500+ completadas',
            // Services dynamic states
            'loading-services': 'Cargando servicios...',
            'no-services': 'No hay servicios disponibles.',
            // Education Section
            'education-title': 'Perspectivas y Análisis',
            'education-subtitle': 'Aprende implementación de IA paso a paso',
            'loading-education': 'Cargando recursos...',
            'no-education-items': 'No hay recursos disponibles.',
            // News Section
            'loading-news': 'Cargando noticias...',
            'no-news-items': 'No hay noticias disponibles.',
            // Case Studies Section
            'loading-cases': 'Cargando estudios de caso...',
            'no-cases': 'No hay estudios de caso disponibles.',
            // Testimonials Section (dynamic)
            'loading-testimonials': 'Cargando testimonios...',
            'no-testimonials': 'No hay testimonios disponibles.',
            'case-section-title': 'Casos de Estudio',
            'case-section-subtitle': 'Resultados reales de implementaciones de RapidAI',
            'case-label-challenge': 'Desafío:',
            'case-label-solution': 'Solución:',
            'case-label-outcome': 'Resultado:'
        }
    };
    
    const currentTranslations = translations[lang];
    
    // Translate placeholders
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.getAttribute('data-translate-placeholder');
        if (currentTranslations[key]) {
            el.setAttribute('placeholder', currentTranslations[key]);
        }
    }); 

    // Apply translations to elements with data-translate attributes
    document.querySelectorAll('[data-translate]').forEach(el => {
        const tKey = el.getAttribute('data-translate');
        if (currentTranslations[tKey]) {
            el.innerHTML = currentTranslations[tKey];
        }
    });

    // Apply placeholder translations (e.g., inputs)
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const pKey = el.getAttribute('data-translate-placeholder');
        if (currentTranslations[pKey]) {
            el.setAttribute('placeholder', currentTranslations[pKey]);
        }
    });
}

function showLanguageChangeNotification(lang) {
    const langNames = {
        'en': 'English',
        'fr': 'Français',
        'es': 'Español'
    };
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-6 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-globe"></i>
            <span>Language changed to ${langNames[lang]}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Initialize language on page load
function initializeLanguage() {
    const savedLang = localStorage.getItem('rapidai-language') || 'en';
    const browserLang = navigator.language.split('-')[0];
    const supportedLangs = ['en', 'fr', 'es'];
    
    // Use saved language, or browser language if supported, otherwise default to English
    const defaultLang = savedLang !== 'en' ? savedLang : 
                       (supportedLangs.includes(browserLang) ? browserLang : 'en');

    // Initialize all dynamic content and translations for default language
    setLanguage(defaultLang);
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simple form validation would go here
            // For now, just show success message
            
            const button = this.querySelector('button[type="submit"]');
            const originalText = button.textContent;
            
            button.textContent = 'Sending...';
            button.disabled = true;
            
            // Simulate form submission
            setTimeout(() => {
                button.textContent = 'Message Sent! ';
                button.style.backgroundColor = '#10B981';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                    button.style.backgroundColor = '';
                    this.reset();
                }, 3000);
            }, 1000);
        });
    }
    
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const button = this.querySelector('button[type="submit"]');
            const originalText = button.textContent;
            
            // Basic email validation
            const email = emailInput.value.trim();
            if (!email || !email.includes('@')) {
                emailInput.style.borderColor = '#EF4444';
                emailInput.focus();
                return;
            }
            
            button.textContent = 'Joining...';
            button.disabled = true;
            emailInput.disabled = true;
            
            // Simulate newsletter signup
            setTimeout(() => {
                button.textContent = 'Welcome Aboard! ';
                button.style.backgroundColor = '#10B981';
                
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm';
                successMessage.innerHTML = `
                    <div class="flex items-center">
                        <i class="fas fa-check-circle mr-2"></i>
                        <span><strong>Success!</strong> You're now subscribed to RapidAI Weekly. Check your email for issue #13.</span>
                    </div>
                `;
                
                this.appendChild(successMessage);
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                    emailInput.disabled = false;
                    button.style.backgroundColor = '';
                    emailInput.style.borderColor = '';
                    this.reset();
                    if (successMessage.parentNode) {
                        successMessage.remove();
                    }
                }, 4000);
            }, 1500);
        });
    }
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('shadow-md');
    } else {
        navbar.classList.remove('shadow-md');
    }
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all fade-in elements when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
    
    // Initialize language support
    initializeLanguage();
});
/**
 * ----------------------------------------------------------------
 * DYNAMIC CONTENT LOADER (CMS)
 * ----------------------------------------------------------------
 * This section loads content from Markdown files managed by the CMS.
 */

// Parse YAML-like frontmatter including simple list fields (e.g., features: - item)
function parseFrontmatter(text) {
    const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
    const match = frontmatterRegex.exec(text);
    if (!match) return { frontmatter: {}, content: text };

    const block = match[1];
    const content = text.slice(match[0].length);
    const lines = block.split('\n');
    const data = {};
    let currentKey = null;

    for (let rawLine of lines) {
        const line = (rawLine || '').replace(/\r$/, '');
        if (!line.trim()) continue;

        // List item (supports indented "- value" or "- value")
        if ((/^\s*-\s+/).test(line)) {
            if (currentKey) {
                if (!Array.isArray(data[currentKey])) data[currentKey] = [];
                const val = line.replace(/^\s*-\s+/, '').trim().replace(/^["']|["']$/g, '');
                data[currentKey].push(val);
            }
            continue;
        }

        // New key: value
        const idx = line.indexOf(':');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        let value = line.slice(idx + 1).trim();
        currentKey = key;

        if (value === '') {
            // Expecting a list or empty scalar in following lines
            if (data[currentKey] === undefined) data[currentKey] = '';
        } else {
            data[currentKey] = value.replace(/^["']|["']$/g, '');
        }
    }

    return { frontmatter: data, content };
}

/**
 * Renders services section with hardcoded data
 * @param {string} lang - The language code (e.g., 'en', 'es', 'fr')
 */
console.log('Script loaded, initializing services...');

async function loadServicesContent(lang = 'en') {
    console.log('loadServicesContent called with lang:', lang);
    const servicesContainer = document.getElementById('services-container');
    if (!servicesContainer) {
        console.error('Services container not found');
        return;
    }

    // Show loading state
    servicesContainer.innerHTML = `
        <div class="col-span-3 text-center py-8">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600" data-translate="loading-services">Loading services...</p>
        </div>`;

    // Load list of service slugs from manifest with safe fallback
    let slugs = ['service1', 'service2', 'service3'];
    try {
        const res = await fetch('/content/services/manifest.json', { cache: 'no-cache' });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.slugs) && data.slugs.length) {
                slugs = data.slugs;
            }
        }
    } catch (e) {
        // ignore and use fallback
    }

    async function fetchService(slug) {
        const urls = [
            `/content/services/${slug}/index.${lang}.md`,
            `/content/services/${slug}/index.en.md`
        ];
        for (const url of urls) {
            try {
                const res = await fetch(url, { cache: 'no-cache' });
                if (!res.ok) continue;
                const text = await res.text();
                const { frontmatter } = parseFrontmatter(text);
                if (!frontmatter || !frontmatter.title) continue;
                const features = Array.isArray(frontmatter.features) ? frontmatter.features : [];
                const order = parseInt(frontmatter.order, 10);
                return {
                    name: slug,
                    title: frontmatter.title,
                    description: frontmatter.description || '',
                    icon: frontmatter.icon || 'fas fa-cube',
                    order: Number.isFinite(order) ? order : 999,
                    featured: String(frontmatter.featured).toLowerCase() === 'true',
                    features
                };
            } catch (e) {
                // ignore and try fallback
            }
        }
        return null;
    }

    const results = await Promise.all(slugs.map(fetchService));
    const servicesData = results.filter(Boolean).sort((a, b) => (a.order || 999) - (b.order || 999));

    // Clear loading state and render services
    servicesContainer.innerHTML = '';

    if (!servicesData.length) {
        servicesContainer.innerHTML = `
            <div class="col-span-3 text-center py-8">
                <p class="text-gray-600" data-translate="no-services">No services available.</p>
            </div>`;
        return;
    }

    servicesData.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'bg-white p-8 rounded-2xl shadow-lg card-hover fade-in';
        const featuresHtml = (service.features && service.features.length)
            ? `<ul class="space-y-3 text-gray-600">${service.features.map(f => `<li><i class=\"fas fa-check text-green-500 mr-2\"></i>${f}</li>`).join('')}</ul>`
            : '';
        serviceCard.innerHTML = `
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <i class="${service.icon} text-blue-600 text-2xl"></i>
            </div>
            <h3 class="text-2xl font-semibold text-gray-800 mb-4">${service.title}</h3>
            <div class="text-gray-600 mb-6 prose max-w-none">
                ${service.description || ''}
            </div>
            ${featuresHtml}
        `;
        servicesContainer.appendChild(serviceCard);

        if (typeof observer !== 'undefined' && observer instanceof IntersectionObserver) {
            observer.observe(serviceCard);
        }
    });
}

/* Blog loader removed — blog posts are merged into Education via loadEducationContent() */

async function loadEducationContent(lang = 'en') {
    const eduContainer = document.getElementById('education-container');
    if (!eduContainer) return;
    eduContainer.innerHTML = `
        <div class="col-span-3 text-center py-8">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600" data-translate="loading-education">Loading education...</p>
        </div>`;

    // Load Education items
    let slugs = [];
    try {
        const res = await fetch('/content/education/manifest.json', { cache: 'no-cache' });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.slugs)) slugs = data.slugs;
        }
    } catch (e) {
        // no manifest; show empty state later
    }

    async function fetchItem(slug) {
        const urls = [
            `/content/education/${slug}/index.${lang}.md`,
            `/content/education/${slug}/index.en.md`
        ];
        for (const url of urls) {
            try {
                const res = await fetch(url, { cache: 'no-cache' });
                if (!res.ok) continue;
                const text = await res.text();
                const { frontmatter, content } = parseFrontmatter(text);
                if (!frontmatter || !frontmatter.title) continue;
                const order = parseInt(frontmatter.order, 10);
                return {
                    slug,
                    title: frontmatter.title,
                    description: frontmatter.description || frontmatter.excerpt || content.slice(0, 160) + '...',
                    icon: frontmatter.icon || 'fas fa-graduation-cap',
                    order: Number.isFinite(order) ? order : 999
                };
            } catch (e) { /* continue */ }
        }
        return null;
    }
    // Load Blog posts to merge into Education
    let blogSlugs = [];
    try {
        const res = await fetch('/content/blog/manifest.json', { cache: 'no-cache' });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.slugs)) blogSlugs = data.slugs;
        }
    } catch (e) { /* ignore */ }

    async function fetchBlogPost(slug) {
        const urls = [
            `/content/blog/${slug}/index.${lang}.md`,
            `/content/blog/${slug}/index.en.md`
        ];
        for (const url of urls) {
            try {
                const res = await fetch(url, { cache: 'no-cache' });
                if (!res.ok) continue;
                const text = await res.text();
                const { frontmatter, content } = parseFrontmatter(text);
                if (!frontmatter || !frontmatter.title) continue;
                const order = parseInt(frontmatter.order, 10);
                return {
                    slug,
                    title: frontmatter.title,
                    description: frontmatter.description || frontmatter.excerpt || (content ? (content.slice(0, 160) + '...') : ''),
                    icon: 'fas fa-pen',
                    order: Number.isFinite(order) ? order : 999
                };
            } catch (e) { /* continue */ }
        }
        return null;
    }

    // Fetch education and blog items
    const eduItems = (await Promise.all(slugs.map(fetchItem))).filter(Boolean);
    const blogItems = (await Promise.all(blogSlugs.map(fetchBlogPost))).filter(Boolean);
    const combined = [...eduItems, ...blogItems].sort((a, b) => (a.order || 999) - (b.order || 999));

    eduContainer.innerHTML = '';
    if (!combined.length) {
        eduContainer.innerHTML = `
            <div class="col-span-3 text-center py-8">
                <p class="text-gray-600" data-translate="no-education-items">No education items available.</p>
            </div>`;
        return;
    }

    combined.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-white p-8 rounded-2xl shadow-lg card-hover fade-in';
        card.innerHTML = `
            <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                <i class="${item.icon} text-indigo-600 text-2xl"></i>
            </div>
            <h3 class="text-2xl font-semibold text-gray-800 mb-3">${item.title}</h3>
            <p class="text-gray-600">${item.description || ''}</p>
        `;
        eduContainer.appendChild(card);
        if (typeof observer !== 'undefined' && observer instanceof IntersectionObserver) {
            observer.observe(card);
            card.classList.add('visible');
        }
    });
}

// Load News (Newsletter) items from /content/news using manifest.json and i18n fallback
async function loadNewsContent(lang = 'en') {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;
    newsContainer.innerHTML = `
        <div class="col-span-3 text-center py-8">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600" data-translate="loading-news">Loading news...</p>
        </div>`;

    let slugs = [];
    try {
        const res = await fetch('/content/news/manifest.json', { cache: 'no-cache' });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.slugs)) slugs = data.slugs;
        }
    } catch (e) { /* ignore */ }

    async function fetchNews(slug) {
        const urls = [
            `/content/news/${slug}/index.${lang}.md`,
            `/content/news/${slug}/index.en.md`
        ];
        for (const url of urls) {
            try {
                const res = await fetch(url, { cache: 'no-cache' });
                if (!res.ok) continue;
                const text = await res.text();
                const { frontmatter, content } = parseFrontmatter(text);
                if (!frontmatter || !frontmatter.title) continue;
                const d = frontmatter.date ? new Date(frontmatter.date) : null;
                return {
                    slug,
                    title: frontmatter.title,
                    summary: frontmatter.summary || frontmatter.description || (content ? (content.slice(0, 160) + '...') : ''),
                    date: d && !isNaN(d) ? d.getTime() : 0
                };
            } catch (e) { /* continue */ }
        }
        return null;
    }

    if (!slugs.length) {
        newsContainer.innerHTML = `
            <div class="col-span-3 text-center py-8">
                <p class="text-gray-600" data-translate="no-news-items">No news items available.</p>
            </div>`;
        return;
    }

    const items = (await Promise.all(slugs.map(fetchNews))).filter(Boolean)
        .sort((a, b) => (b.date || 0) - (a.date || 0));

    newsContainer.innerHTML = '';
    if (!items.length) {
        newsContainer.innerHTML = `
            <div class="col-span-3 text-center py-8">
                <p class="text-gray-600" data-translate="no-news-items">No news items available.</p>
            </div>`;
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-white p-8 rounded-2xl shadow-lg card-hover fade-in';
        const dateStr = item.date ? new Date(item.date).toLocaleDateString() : '';
        card.innerHTML = `
            <div class="text-sm text-gray-500 mb-2">${dateStr}</div>
            <h3 class="text-2xl font-semibold text-gray-800 mb-3">${item.title}</h3>
            <p class="text-gray-600 mb-4">${item.summary || ''}</p>
        `;
        newsContainer.appendChild(card);
        if (typeof observer !== 'undefined' && observer instanceof IntersectionObserver) {
            observer.observe(card);
            card.classList.add('visible');
        }
    });
}

// Load Case Studies (Success Stories) from /content/cases using manifest.json and i18n fallback
async function loadSuccessStoriesContent(lang = 'en') {
    const casesContainer = document.getElementById('success-stories-container');
    if (!casesContainer) return;
    casesContainer.innerHTML = `
        <div class="col-span-3 text-center py-8">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600" data-translate="loading-cases">Loading case studies...</p>
        </div>`;

    let slugs = [];
    try {
        const res = await fetch('/content/cases/manifest.json', { cache: 'no-cache' });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.slugs)) slugs = data.slugs;
        }
    } catch (e) { /* ignore */ }

    async function fetchCase(slug) {
        const urls = [
            `/content/cases/${slug}/index.${lang}.json`,
            `/content/cases/${slug}/index.en.json`
        ];
        for (const url of urls) {
            try {
                const res = await fetch(url, { cache: 'no-cache' });
                if (!res.ok) continue;
                const json = await res.json();
                if (!json || !json.title) continue;
                const excerpt = (s) => (typeof s === 'string' && s.length > 0) ? (s.replace(/[#*>_`\-]/g, '').slice(0, 160) + '...') : '';
                return {
                    slug,
                    title: json.title,
                    industry: json.industry || '',
                    challenge: excerpt(json.challenge || ''),
                    solution: excerpt(json.solution || ''),
                    outcome: excerpt(json.outcome || '')
                };
            } catch (e) { /* continue */ }
        }
        return null;
    }

    if (!slugs.length) {
        casesContainer.innerHTML = `
            <div class="col-span-3 text-center py-8">
                <p class="text-gray-600" data-translate="no-cases">No case studies available.</p>
            </div>`;
        return;
    }

    const items = (await Promise.all(slugs.map(fetchCase))).filter(Boolean);

    casesContainer.innerHTML = '';
    if (!items.length) {
        casesContainer.innerHTML = `
            <div class="col-span-3 text-center py-8">
                <p class="text-gray-600" data-translate="no-cases">No case studies available.</p>
            </div>`;
        return;
    }

    items.forEach(cs => {
        const card = document.createElement('div');
        card.className = 'bg-white p-8 rounded-2xl shadow-lg card-hover fade-in';
        card.innerHTML = `
            <div class="text-sm text-gray-500 mb-2">${cs.industry || ''}</div>
            <h3 class="text-2xl font-semibold text-gray-800 mb-3">${cs.title}</h3>
            <div class="space-y-2 text-gray-600">
                ${cs.challenge ? `<p><strong data-translate="case-label-challenge">Challenge:</strong> ${cs.challenge}</p>` : ''}
                ${cs.solution ? `<p><strong data-translate="case-label-solution">Solution:</strong> ${cs.solution}</p>` : ''}
                ${cs.outcome ? `<p><strong data-translate="case-label-outcome">Outcome:</strong> ${cs.outcome}</p>` : ''}
            </div>
        `;
        casesContainer.appendChild(card);
        if (typeof observer !== 'undefined' && observer instanceof IntersectionObserver) {
            observer.observe(card);
            card.classList.add('visible');
        }
    });
}

// Load Testimonials from /content/testimonials using manifest.json and i18n fallback
async function loadTestimonialsContent(lang = 'en') {
    const container = document.getElementById('testimonials-container');
    if (!container) return;
    container.innerHTML = `
        <div class="col-span-3 text-center py-8">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600" data-translate="loading-testimonials">Loading testimonials...</p>
        </div>`;

    let slugs = [];
    try {
        const res = await fetch('/content/testimonials/manifest.json', { cache: 'no-cache' });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.slugs)) slugs = data.slugs;
        }
    } catch (e) { /* ignore */ }

    async function fetchTestimonial(slug) {
        const urls = [
            `/content/testimonials/${slug}/index.${lang}.json`,
            `/content/testimonials/${slug}/index.en.json`
        ];
        for (const url of urls) {
            try {
                const res = await fetch(url, { cache: 'no-cache' });
                if (!res.ok) continue;
                const json = await res.json();
                if (!json || !json.name || !json.quote) continue;
                return {
                    slug,
                    name: json.name || '',
                    role: json.role || '',
                    company: json.company || '',
                    avatar: json.avatar || '',
                    badge: json.badge || '',
                    delivery: json.delivery || '',
                    stars: Math.min(5, Math.max(1, Number(json.stars || 5))) || 5,
                    quote: json.quote || '',
                    metric1_label: json.metric1_label || '',
                    metric1_value: json.metric1_value || '',
                    metric2_label: json.metric2_label || '',
                    metric2_value: json.metric2_value || '',
                    social_note: json.social_note || '',
                    linkedin_url: json.linkedin_url || ''
                };
            } catch (e) { /* continue */ }
        }
        return null;
    }

    if (!slugs.length) {
        container.innerHTML = `
            <div class="col-span-3 text-center py-8">
                <p class="text-gray-600" data-translate="no-testimonials">No testimonials available.</p>
            </div>`;
        return;
    }

    const items = (await Promise.all(slugs.map(fetchTestimonial))).filter(Boolean);

    container.innerHTML = '';
    if (!items.length) {
        container.innerHTML = `
            <div class="col-span-3 text-center py-8">
                <p class="text-gray-600" data-translate="no-testimonials">No testimonials available.</p>
            </div>`;
        return;
    }

    items.forEach(t => {
        const card = document.createElement('div');
        card.className = 'bg-white p-8 rounded-2xl shadow-lg card-hover fade-in';

        // Build stars
        const starsHtml = Array.from({ length: t.stars }).map(() => '<i class="fas fa-star text-yellow-400"></i>').join('');

        // Build header badge/delivery if present
        const badgeHtml = t.badge ? `<div class="bg-blue-100 px-3 py-1 rounded-full"><span class="text-blue-800 text-xs font-semibold">${t.badge}</span></div>` : '';
        const deliveryHtml = t.delivery ? `<div class="text-green-600 text-sm font-semibold">${t.delivery}</div>` : '';

        // Build LinkedIn/social note
        const linkedinHtml = t.linkedin_url ? `<a href="${t.linkedin_url}" target="_blank" rel="noopener" class="fab fa-linkedin text-blue-600 text-xs mr-1"></a>` : '<i class="fab fa-linkedin text-blue-600 text-xs mr-1"></i>';
        const socialNoteHtml = t.social_note ? `<span class="text-xs text-gray-500">${t.social_note}</span>` : '';

        // Metrics blocks
        const metric1 = (t.metric1_value || t.metric1_label) ? `
            <div>
                <div class="text-2xl font-bold text-green-600">${t.metric1_value || ''}</div>
                <div class="text-xs text-gray-500">${t.metric1_label || ''}</div>
            </div>` : '';
        const metric2 = (t.metric2_value || t.metric2_label) ? `
            <div>
                <div class="text-2xl font-bold text-blue-600">${t.metric2_value || ''}</div>
                <div class="text-xs text-gray-500">${t.metric2_label || ''}</div>
            </div>` : '';

        card.innerHTML = `
            ${(badgeHtml || deliveryHtml) ? `<div class="flex items-center justify-between mb-4">${badgeHtml}${deliveryHtml}</div>` : ''}
            <div class="flex items-center mb-4">
                ${t.avatar ? `<img src="${t.avatar}" alt="${t.name}" class="w-12 h-12 rounded-full mr-4">` : `<div class="w-12 h-12 rounded-full mr-4 bg-gray-200"></div>`}
                <div>
                    <h4 class="font-semibold text-gray-800">${t.name}</h4>
                    <p class="text-sm text-gray-600">${[t.role, t.company].filter(Boolean).join(', ')}</p>
                    ${(t.linkedin_url || t.social_note) ? `<div class="flex items-center mt-1">${linkedinHtml}${socialNoteHtml}</div>` : ''}
                </div>
            </div>
            <div class="flex mb-4">${starsHtml}</div>
            <p class="text-gray-600 mb-4">${t.quote}</p>
            ${(metric1 || metric2) ? `<div class="border-t pt-4 grid grid-cols-2 gap-4 text-center">${metric1}${metric2}</div>` : ''}
        `;

        container.appendChild(card);
        if (typeof observer !== 'undefined' && observer instanceof IntersectionObserver) {
            observer.observe(card);
            card.classList.add('visible');
        }
    });
}

// Populate the Resources overview section with live CMS previews
async function loadResourcesOverview(lang = 'en') {
    const newsEl = document.getElementById('resources-news-previews');
    const guidesEl = document.getElementById('resources-guides-topics');
    const casesEl = document.getElementById('resources-cases-examples');

    // Helper to set an empty state with a translated message
    const setEmpty = (el, key, defaultText) => {
        if (!el) return;
        el.innerHTML = `
            <div class="${el.id === 'resources-news-previews' ? 'border-l-4 border-gray-300 pl-4 py-2' : 'border border-gray-200 rounded-lg p-3'}">
                <p class="text-gray-600 text-sm" data-translate="${key}">${defaultText}</p>
            </div>
        `;
    };

    // NEWS PREVIEWS (latest 3)
    if (newsEl) {
        try {
            let slugs = [];
            try {
                const res = await fetch('/content/news/manifest.json', { cache: 'no-cache' });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data.slugs)) slugs = data.slugs;
                }
            } catch (e) { /* ignore */ }

            const fetchNewsPreview = async (slug) => {
                const urls = [
                    `/content/news/${slug}/index.${lang}.md`,
                    `/content/news/${slug}/index.en.md`
                ];
                for (const url of urls) {
                    try {
                        const r = await fetch(url, { cache: 'no-cache' });
                        if (!r.ok) continue;
                        const text = await r.text();
                        const { frontmatter, content } = parseFrontmatter(text);
                        if (!frontmatter || !frontmatter.title) continue;
                        const d = frontmatter.date ? new Date(frontmatter.date) : null;
                        return {
                            title: frontmatter.title,
                            summary: frontmatter.summary || frontmatter.description || (content ? (content.slice(0, 120) + '...') : ''),
                            date: d && !isNaN(d) ? d.getTime() : 0
                        };
                    } catch (e) { /* continue */ }
                }
                return null;
            };

            if (!slugs.length) {
                setEmpty(newsEl, 'no-news-items', 'No news items available.');
            } else {
                const items = (await Promise.all(slugs.map(fetchNewsPreview))).filter(Boolean)
                    .sort((a, b) => (b.date || 0) - (a.date || 0))
                    .slice(0, 3);

                newsEl.innerHTML = '';
                if (!items.length) {
                    setEmpty(newsEl, 'no-news-items', 'No news items available.');
                } else {
                    items.forEach((it, idx) => {
                        const block = document.createElement('div');
                        block.className = idx === 0
                            ? 'border-l-4 border-blue-600 pl-4 py-2 bg-blue-50 rounded-r'
                            : 'border-l-4 border-gray-300 pl-4 py-2';
                        block.innerHTML = `
                            <h4 class="font-semibold text-gray-800 text-sm">${it.title}</h4>
                            <p class="text-gray-600 text-sm">${it.summary || ''}</p>
                        `;
                        newsEl.appendChild(block);
                    });
                }
            }
        } catch (e) {
            setEmpty(newsEl, 'no-news-items', 'No news items available.');
        }
    }

    // GUIDES TOPICS (Education + Blog) - first 4 titles
    if (guidesEl) {
        try {
            let eduSlugs = [];
            let blogSlugs = [];
            try {
                const resEdu = await fetch('/content/education/manifest.json', { cache: 'no-cache' });
                if (resEdu.ok) {
                    const data = await resEdu.json();
                    if (Array.isArray(data.slugs)) eduSlugs = data.slugs;
                }
            } catch (e) { /* ignore */ }
            try {
                const resBlog = await fetch('/content/blog/manifest.json', { cache: 'no-cache' });
                if (resBlog.ok) {
                    const data = await resBlog.json();
                    if (Array.isArray(data.slugs)) blogSlugs = data.slugs;
                }
            } catch (e) { /* ignore */ }

            const fetchEdu = async (slug) => {
                const urls = [
                    `/content/education/${slug}/index.${lang}.md`,
                    `/content/education/${slug}/index.en.md`
                ];
                for (const url of urls) {
                    try {
                        const r = await fetch(url, { cache: 'no-cache' });
                        if (!r.ok) continue;
                        const text = await r.text();
                        const { frontmatter } = parseFrontmatter(text);
                        if (!frontmatter || !frontmatter.title) continue;
                        const order = parseInt(frontmatter.order, 10);
                        return { title: frontmatter.title, order: Number.isFinite(order) ? order : 999 };
                    } catch (e) { /* continue */ }
                }
                return null;
            };

            const fetchBlog = async (slug) => {
                const urls = [
                    `/content/blog/${slug}/index.${lang}.md`,
                    `/content/blog/${slug}/index.en.md`
                ];
                for (const url of urls) {
                    try {
                        const r = await fetch(url, { cache: 'no-cache' });
                        if (!r.ok) continue;
                        const text = await r.text();
                        const { frontmatter } = parseFrontmatter(text);
                        if (!frontmatter || !frontmatter.title) continue;
                        const order = parseInt(frontmatter.order, 10);
                        return { title: frontmatter.title, order: Number.isFinite(order) ? order : 999 };
                    } catch (e) { /* continue */ }
                }
                return null;
            };

            const eduItems = await Promise.all(eduSlugs.map(fetchEdu));
            const blogItems = await Promise.all(blogSlugs.map(fetchBlog));
            const merged = [...eduItems, ...blogItems].filter(Boolean)
                .sort((a, b) => (a.order || 999) - (b.order || 999))
                .slice(0, 4);

            guidesEl.innerHTML = '';
            if (!merged.length) {
                setEmpty(guidesEl, 'no-education-items', 'No education items available.');
            } else {
                merged.forEach(it => {
                    const row = document.createElement('div');
                    row.className = 'flex items-center';
                    row.innerHTML = `
                        <i class="fas fa-check-circle text-green-500 mr-3"></i>
                        <span class="text-gray-700">${it.title}</span>
                    `;
                    guidesEl.appendChild(row);
                });
            }
        } catch (e) {
            setEmpty(guidesEl, 'no-education-items', 'No education items available.');
        }
    }

    // CASES EXAMPLES - show 3 with title + brief outcome/summary
    if (casesEl) {
        try {
            let slugs = [];
            try {
                const res = await fetch('/content/cases/manifest.json', { cache: 'no-cache' });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data.slugs)) slugs = data.slugs;
                }
            } catch (e) { /* ignore */ }

            const fetchCase = async (slug) => {
                const urls = [
                    `/content/cases/${slug}/index.${lang}.json`,
                    `/content/cases/${slug}/index.en.json`
                ];
                for (const url of urls) {
                    try {
                        const r = await fetch(url, { cache: 'no-cache' });
                        if (!r.ok) continue;
                        const json = await r.json();
                        if (!json || !json.title) continue;
                        const excerpt = (s) => (typeof s === 'string' && s.length > 0) ? (s.replace(/[#$*>_`\-]/g, '').slice(0, 120) + '...') : '';
                        const short = excerpt(json.outcome || json.solution || json.challenge || '');
                        return { title: json.title, short };
                    } catch (e) { /* continue */ }
                }
                return null;
            };

            if (!slugs.length) {
                setEmpty(casesEl, 'no-cases', 'No case studies available.');
            } else {
                const items = (await Promise.all(slugs.map(fetchCase))).filter(Boolean).slice(0, 3);
                casesEl.innerHTML = '';
                if (!items.length) {
                    setEmpty(casesEl, 'no-cases', 'No case studies available.');
                } else {
                    items.forEach(it => {
                        const box = document.createElement('div');
                        box.className = 'border border-gray-200 rounded-lg p-3';
                        box.innerHTML = `
                            <h4 class="font-semibold text-gray-800 text-sm">${it.title}</h4>
                            ${it.short ? `<p class=\"text-gray-600 text-sm\">${it.short}</p>` : ''}
                        `;
                        casesEl.appendChild(box);
                    });
                }
            }
        } catch (e) {
            setEmpty(casesEl, 'no-cases', 'No case studies available.');
        }
    }
}

async function loadClaimsAndStats() {
    try {
        const res = await fetch('/content.json', { cache: 'no-cache' });
        if (!res.ok) return;
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const map = new Map(items.map(i => [i.key, i.value]));
        const statEl = document.querySelector('[data-translate="stat-speed"]');
        const labelEl = document.querySelector('[data-translate="stat-speed-label"]');
        if (statEl && map.get('stat-speed')) statEl.textContent = map.get('stat-speed');
        if (labelEl && map.get('stat-speed-label')) labelEl.textContent = map.get('stat-speed-label');
    } catch (e) {
        // ignore
    }
}

// Load Intro/Hero content from /content/intro with i18n fallback
async function loadIntroContent(lang = 'en') {
    try {
        const urls = [
            `/content/intro/index.${lang}.json`,
            `/content/intro/index.en.json`
        ];
        let data = null;
        for (const url of urls) {
            try {
                const res = await fetch(url, { cache: 'no-cache' });
                if (!res.ok) continue;
                data = await res.json();
                break;
            } catch (e) { /* continue */ }
        }
        if (!data) return;

        const titleEl = document.getElementById('hero-title');
        const subtitleEl = document.getElementById('hero-subtitle');
        const quoteEl = document.getElementById('hero-quote');
        const signatureEl = document.getElementById('hero-signature');
        const ctaEl = document.getElementById('hero-cta');
        const imageEl = document.getElementById('hero-image');

        if (titleEl && typeof data.title === 'string') titleEl.innerHTML = data.title;
        if (subtitleEl && typeof data.subtitle === 'string') subtitleEl.innerHTML = data.subtitle;
        if (quoteEl && typeof data.quote === 'string') quoteEl.innerHTML = data.quote;
        if (signatureEl && typeof data.signature === 'string') signatureEl.innerHTML = data.signature;
        if (ctaEl && typeof data.cta === 'string') ctaEl.textContent = data.cta;
        if (imageEl && typeof data.image === 'string' && data.image.trim()) imageEl.src = data.image;
        if (imageEl && typeof data.image_alt === 'string') imageEl.alt = data.image_alt;
    } catch (e) {
        // leave static translations
    }
}

// Load About/Meet Jose content from /content/about with i18n fallback
async function loadAboutContent(lang = 'en') {
    try {
        const urls = [
            `/content/about/index.${lang}.json`,
            `/content/about/index.en.json`
        ];
        let data = null;
        for (const url of urls) {
            try {
                const res = await fetch(url, { cache: 'no-cache' });
                if (!res.ok) continue;
                data = await res.json();
                break;
            } catch (e) { /* continue */ }
        }
        if (!data) return;

        const titleEl = document.getElementById('about-title');
        const descEl = document.getElementById('about-description');
        const imageEl = document.getElementById('about-image');
        const bulletsEl = document.getElementById('about-bullets');

        if (titleEl && typeof data.title === 'string') titleEl.innerHTML = data.title;
        if (descEl && typeof data.description === 'string') descEl.innerHTML = data.description;
        if (imageEl && typeof data.image === 'string' && data.image.trim()) imageEl.src = data.image;
        if (imageEl && typeof data.image_alt === 'string') imageEl.alt = data.image_alt;

        if (bulletsEl && Array.isArray(data.bullets)) {
            bulletsEl.innerHTML = '';
            data.bullets.forEach(item => {
                if (!item || typeof item.text !== 'string') return;
                const row = document.createElement('div');
                row.className = 'flex items-center space-x-3';
                const iconClass = typeof item.icon === 'string' && item.icon.trim() ? item.icon : 'fas fa-check-circle text-green-500';
                row.innerHTML = `
                    <i class="${iconClass}"></i>
                    <span class="text-gray-700">${item.text}</span>
                `;
                bulletsEl.appendChild(row);
            });
        }
    } catch (e) {
        // leave static translations
    }
}

// Load Resources Intro content from /content/resources_intro with i18n fallback
async function loadResourcesIntro(lang = 'en') {
    try {
        const urls = [
            `/content/resources_intro/index.${lang}.json`,
            `/content/resources_intro/index.en.json`
        ];
        let data = null;
        for (const url of urls) {
            try {
                const res = await fetch(url, { cache: 'no-cache' });
                if (!res.ok) continue;
                data = await res.json();
                break;
            } catch (e) { /* continue */ }
        }
        if (!data) return;

        const titleEl = document.getElementById('resources-intro-title');
        const subtitleEl = document.getElementById('resources-intro-subtitle');

        if (titleEl && typeof data.title === 'string') titleEl.innerHTML = data.title;
        if (subtitleEl && typeof data.subtitle === 'string') subtitleEl.innerHTML = data.subtitle;
    } catch (e) {
        // leave static translations
    }
}

// Load Values content from /content/values with i18n fallback
async function loadValuesContent(lang = 'en') {
    try {
        const urls = [
            `/content/values/index.${lang}.json`,
            `/content/values/index.en.json`
        ];
        let data = null;
        for (const url of urls) {
            try {
                const res = await fetch(url, { cache: 'no-cache' });
                if (!res.ok) continue;
                data = await res.json();
                break;
            } catch (_e) { /* continue */ }
        }
        if (!data) return;

        const titleEl = document.getElementById('values-title');
        const subtitleEl = document.getElementById('values-subtitle');
        if (titleEl && typeof data.title === 'string') titleEl.innerHTML = data.title;
        if (subtitleEl && typeof data.subtitle === 'string') subtitleEl.innerHTML = data.subtitle;

        const gridEl = document.getElementById('values-grid');
        if (gridEl && Array.isArray(data.items)) {
            gridEl.innerHTML = '';
            const defaultBg = ['bg-blue-100','bg-green-100','bg-purple-100','bg-indigo-100','bg-red-100','bg-orange-100'];
            const defaultIcon = [
                'fa-solid fa-bullseye text-blue-600 text-2xl',
                'fa-solid fa-shield-halved text-green-600 text-2xl',
                'fa-solid fa-comments text-purple-600 text-2xl',
                'fa-solid fa-handshake text-indigo-600 text-2xl',
                'fa-solid fa-rocket text-red-600 text-2xl',
                'fa-solid fa-chart-line text-orange-600 text-2xl'
            ];
            data.items.forEach((item, idx) => {
                if (!item) return;
                const iconBg = (typeof item.iconBgClass === 'string' && item.iconBgClass.trim()) ? item.iconBgClass : defaultBg[idx % defaultBg.length];
                let iconClass = (typeof item.iconClass === 'string' && item.iconClass.trim()) ? item.iconClass : defaultIcon[idx % defaultIcon.length];
                // Normalize FA5 -> FA6 where needed
                iconClass = iconClass
                    .replace(/\bfas\b/g, 'fa-solid')
                    .replace('fa-shield-alt', 'fa-shield-halved');
                const title = typeof item.title === 'string' ? item.title : '';
                const description = typeof item.description === 'string' ? item.description : '';

                const card = document.createElement('div');
                card.className = 'bg-white p-8 rounded-2xl shadow-lg card-hover fade-in';
                card.innerHTML = `
                    <div class="w-16 h-16 ${iconBg} rounded-full flex items-center justify-center mb-6">
                        <i class="${iconClass}"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">${title}</h3>
                    <p class="text-gray-600">${description}</p>
                `;
                gridEl.appendChild(card);
            });
        }

        const ctaTitleEl = document.getElementById('values-cta-title');
        const ctaSubtitleEl = document.getElementById('values-cta-subtitle');
        if (ctaTitleEl && data.cta && typeof data.cta.title === 'string') ctaTitleEl.innerHTML = data.cta.title;
        if (ctaSubtitleEl && data.cta && typeof data.cta.subtitle === 'string') ctaSubtitleEl.innerHTML = data.cta.subtitle;
    } catch (_e) {
        // leave static translations
    }
}

// Claims and stats are loaded within the main language initialization flow