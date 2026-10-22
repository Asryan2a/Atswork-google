export interface Preset {
  id: string;
  label: string;
  role: string;
  company: string;
  sector: string;
  candidateName: string;
  jobDescription: string;
  currentCv: string;
}

export const SAMPLE_PRESETS: Preset[] = [
  {
    id: "tech-lead",
    label: "Tech / Lead Développeur Fullstack chez Doctolib",
    role: "Lead Développeur Fullstack (React / Node.js / Cloud)",
    company: "Doctolib",
    sector: "Santé Numérique & Tech (SaaS)",
    candidateName: "Julien Moreau",
    jobDescription: `Poste : Lead Développeur Fullstack React / Node.js / TypeScript
Entreprise : Doctolib (Paris / Hybride)

À propos de notre mission :
Doctolib révolutionne le quotidien des professionnels de santé et améliore l'accès aux soins de millions de patients en Europe. Notre plateforme traite des millions de requêtes quotidiennes avec des exigences absolues de haute disponibilité (99.99%), de sécurité des données de santé (RGPD, HDS) et de scalabilité.

Vos défis & responsabilités :
- Piloter l'architecture technique et le développement des fonctionnalités critiques de notre solution de téléconsultation et de prise de rendez-vous.
- Encadrer et mentorer une équipe agile de 6 ingénieurs (code reviews, rituels Scrum, pair programming).
- Garantir la robustesse et les performances : stack React 19, TypeScript, Node.js, PostgreSQL, Redis, architecture événementielle (Kafka) et déploiement AWS (Kubernetes, Terraform).
- Mettre en place les meilleures pratiques d'ingénierie logicielle : tests automatisés (Jest, Playwright), CI/CD GitLab, monitoring Datadog et réduction de la dette technique.
- Collaborer étroitement avec les Product Managers, Designers UI/UX et la Direction Médicale pour délivrer un produit sans friction.

Profil recherché :
- Minimum 5 ans d'expérience probante en développement Web Fullstack moderne (React, TypeScript, Node.js).
- Expérience confirmée en leadership technique ou mentorat d'équipe.
- Solide maîtrise des architectures micro-services, des bases de données relationnelles (PostgreSQL) et des problématiques de haute concurrence.
- Culture de l'excellence du code (Clean Code, TDD/BDD, Craftsmanship).
- Capacité d'impact et excellente communication dans un environnement à forte croissance.`,
    currentCv: `JULIEN MOREAU
Développeur Web Senior
julien.moreau@email.com | 06 12 34 56 78 | Paris

PROFIL :
Développeur web depuis 6 ans sur diverses applications web. Travail en équipe, j'aime le code propre et résoudre des problèmes informatiques.

EXPÉRIENCES PROFESSIONNELLES :
Développeur Fullstack - TechCare Solutions (2022 - Présent)
- Développement de pages web en React et TypeScript pour une application de santé.
- Création d'API avec Node.js et Express pour connecter la base PostgreSQL.
- Résolution de bugs et participation aux réunions agiles tous les matins.
- Aide apportée aux développeurs juniors sur leurs tickets.
- Réduction des temps de chargement sur certaines requêtes.

Développeur JavaScript - WebAgence Paris (2019 - 2022)
- Réalisation de sites web pour divers clients e-commerce en JavaScript, React et Node.
- Intégration de maquettes Figma et responsive design.
- Écriture de tests unitaires pour tester les formulaires.
- Déploiement sur serveur cloud avec Docker.

COMPÉTENCES :
- Programmation : JavaScript, TypeScript, React, HTML, CSS, Node.js
- Bases de données : PostgreSQL, MySQL, MongoDB
- Outils : Git, Docker, VS Code, Jira

FORMATIONS :
- Master Informatique & Ingénierie Logicielle - Université Paris-Saclay (2019)
- Licence Informatique - Université Paris-Cité (2017)`,
  },
  {
    id: "marketing-digital",
    label: "Marketing / Chef de Projet Digital chez L'Oréal",
    role: "Chef de Projet Digital & E-Commerce",
    company: "L'Oréal",
    sector: "Luxe & Cosmétique / Retail",
    candidateName: "Camille Laurent",
    jobDescription: `Poste : Chef de Projet Digital & E-Commerce International
Entreprise : L'Oréal Luxe (Clichy / Paris)

Contexte :
Au sein de la division L'Oréal Luxe, nous accélérons le déploiement omnicanal de nos marques emblématiques à l'échelle européenne. Nous recrutons un(e) Chef de Projet Digital & E-commerce pour piloter l'acquisition, l'optimisation du taux de conversion (CRO) et l'expérience client digitale.

Missions principales :
- Définir et exécuter la roadmap e-commerce D2C sur Salesforce Commerce Cloud (SFCC) et marketplaces premium.
- Piloter les campagnes d'acquisition digitale multicanales (SEA Google Ads, Meta Ads, TikTok Ads, SEO) avec un budget annuel de 1,5M€.
- Analyser les performances business à travers Google Analytics 4 (GA4) et Looker Studio pour maximiser le ROAS et la Customer Lifetime Value (LTV).
- Mener des tests A/B continus pour optimiser l'UX, réduire le churn au checkout et augmenter le panier moyen (+15%).
- Coordonner les agences partenaires, les équipes supply chain et le CRM (Klaviyo / Salesforce Marketing Cloud).

Exigences :
- 3 à 5 ans d'expérience en gestion de projet e-commerce ou marketing digital dans le retail ou le luxe.
- Maîtrise avancée de GA4, des leviers d'acquisition payants et des CMS e-commerce.
- Fort esprit analytique orienté data-driven et sens de l'esthétique propre au secteur du luxe.
- Bilingue français / anglais.`,
    currentCv: `CAMILLE LAURENT
Chargée de Marketing Digital
camille.laurent@email.com | 06 98 76 54 32 | Paris

RÉSUMÉ :
Passionnée de digital et de mode, 4 ans d'expérience en marketing online et e-commerce. Bonne maîtrise des réseaux sociaux et de la gestion de campagnes publicitaires.

EXPÉRIENCE :
Chargée de Marketing Digital - BeautéStore (2021 - Présent)
- Gestion du site e-commerce et mise en ligne des nouveaux produits.
- Création de campagnes publicitaires sur Facebook et Instagram avec budget mensuel.
- Suivi du trafic et des ventes sur Google Analytics.
- Envoi des newsletters hebdomadaires aux abonnés et gestion des promotions.
- Coordination avec les graphistes pour les bannières web.

Assistante E-commerce - Maison Élégance (2019 - 2021)
- Rédaction des fiches produits optimisées pour le référencement naturel.
- Analyse des ventes mensuelles sur Excel et préparation des bilans.
- Service client e-mail et gestion des retours commandes.

COMPÉTENCES :
- Marketing : SEO, SEA, Social Ads, Emailing, Google Analytics
- Logiciels : Shopify, Meta Ads Manager, Canva, Excel, Notion
- Langues : Français (natif), Anglais (courant)

FORMATION :
- Master 2 Marketing Digital - NEOMA Business School (2019)
- Licence Économie-Gestion - Université Paris-Dauphine (2017)`,
  },
  {
    id: "finance-fpa",
    label: "Finance / Contrôleur de Gestion chez BNP Paribas",
    role: "Contrôleur de Gestion / Financial Analyst",
    company: "BNP Paribas",
    sector: "Banque, Finance & Assurance",
    candidateName: "Alexandre Dupont",
    jobDescription: `Poste : Contrôleur de Gestion Senior / Business Partner FP&A
Entreprise : BNP Paribas (Paris La Défense)

Missions & Enjeux :
Au sein de la Direction Financière, vous accompagnez les directeurs de pôles dans le pilotage de la performance économique et l'allocation des capitaux.
- Élaboration du budget prévisionnel annuel, des forecasts trimestriels et du plan stratégique à 3 ans.
- Clôtures financières mensuelles, calcul des provisions et analyse fine des écarts budgétaires (Variance Analysis).
- Modélisation financière avancée sous Power BI, SAP S/4HANA et Excel (VBA/Power Query) pour automatiser le reporting de gestion.
- Présentation des tableaux de bord exécutifs aux membres du Comex avec recommandations de réduction des coûts (OPEX/CAPEX).
- Audit des processus de contrôle interne et conformité réglementaire IFRS 9 / Bâle III.

Profil :
- Diplôme Bac+5 en Finance, Contrôle de Gestion ou Audit (École de Commerce ou Université).
- 4+ années d'expérience en contrôle de gestion ou en cabinet d'audit Big 4.
- Expertise avérée sur SAP, Power BI et modélisation financière complexe.
- Rigueur mathématique, capacités de synthèse et communication assertive.`,
    currentCv: `ALEXANDRE DUPONT
Contrôleur de Gestion
alexandre.dupont@email.com | 06 55 44 33 22 | Paris

RÉSUMÉ :
Analyste financier rigoureux avec 4 ans d'expérience en finance d'entreprise. Habitué aux calculs de rentabilité et aux reportings mensuels.

EXPÉRIENCES :
Contrôleur de Gestion Junior - Groupe Logistique France (2021 - Présent)
- Préparation des reportings mensuels pour la direction financière.
- Suivi des dépenses des différents départements et alertes en cas de dépassement.
- Participation à la construction du budget annuel avec les opérationnels.
- Utilisation de SAP et d'Excel pour extraire les données comptables.

Auditeur Financier Junior - Cabinet Audit Associés (2019 - 2021)
- Missions de commissariat aux comptes pour des PME industrielles et de services.
- Vérification des cycles achats, ventes et trésorerie.
- Rédaction des mémos de synthèse pour les managers.

COMPÉTENCES :
- Finance : Contrôle budgétaire, Clôtures mensuelles, Analyse d'écarts, IFRS
- Outils : Excel avancé, SAP, Power BI, PowerPoint
- Langues : Français (natif), Anglais (professionnel - TOEIC 910)

FORMATION :
- Master Finance d'Entreprise & Contrôle de Gestion - IAE Paris (2019)
- Licence Gestion - Université Panthéon-Sorbonne (2017)`,
  },
];


