'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Globe, Shield, Lock, Eye, Database, Users, Cookie } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr')

  const content = {
    fr: {
      title: "Politique de Confidentialité",
      lastUpdate: "Dernière mise à jour : 30 mars 2026",
      backHome: "Retour à l'accueil",
      sections: [
        {
          icon: Shield,
          title: "1. Responsable du traitement",
          content: `**SKYPLAY AFRICA**
Cameroun

**Contact :**
Email : support@skyplay.cm
Pour toute question relative à vos données personnelles, contactez notre équipe à l'adresse ci-dessus.`
        },
        {
          icon: Database,
          title: "2. Données collectées",
          content: `Nous collectons les données suivantes pour assurer le bon fonctionnement de la plateforme :

**Données d'inscription :**
• Nom complet
• Adresse email
• Numéro de téléphone
• Date de naissance (vérification d'âge)
• Pays de résidence

**Données de jeu :**
• Historique des défis
• Résultats des matchs
• Statistiques de performance
• Classements et rangs

**Données financières :**
• Historique des transactions Wallet
• Montants déposés et retirés
• Méthode de paiement utilisée (Mobile Money ou carte)
• Note : Nous ne stockons JAMAIS vos données bancaires complètes

**Données techniques :**
• Adresse IP
• Type d'appareil (mobile, PC, console)
• Navigateur et système d'exploitation
• Logs de connexion
• Données de navigation sur la plateforme`
        },
        {
          icon: Eye,
          title: "3. Utilisation des données",
          content: `Vos données personnelles sont utilisées uniquement pour les finalités suivantes :

**Fonctionnement de la plateforme :**
• Création et gestion de votre compte
• Organisation des défis gaming
• Affichage des classements et statistiques
• Communication entre joueurs (chat, notifications)

**Traitement des paiements :**
• Dépôts via Mobile Money (MTN, Orange) et carte bancaire
• Retraits vers Mobile Money
• Historique des transactions
• Prévention de la fraude financière

**Communications :**
• Emails de confirmation (inscription, transactions)
• Notifications de défis et résultats
• Informations importantes sur la plateforme
• Support client

**Amélioration du service :**
• Analyse des usages pour améliorer l'expérience utilisateur
• Détection et correction de bugs
• Développement de nouvelles fonctionnalités`
        },
        {
          icon: Users,
          title: "4. Partage des données",
          content: `**Nous ne vendons JAMAIS vos données personnelles à des tiers.**

Vos données peuvent être partagées uniquement dans les cas suivants :

**Prestataires de paiement :**
• Flutterwave (traitement des paiements carte bancaire)
• MTN Mobile Money (dépôts et retraits)
• Orange Money (dépôts et retraits)
Ces prestataires sont soumis à des obligations strictes de confidentialité.

**Hébergement et infrastructure :**
• Amazon Web Services (AWS) - serveurs sécurisés
• Cloudinary - stockage des images
Ces services respectent les normes internationales de sécurité.

**Obligations légales :**
• Autorités camerounaises si requis par la loi
• Forces de l'ordre en cas d'enquête judiciaire
• Organismes de régulation compétents

**Jamais partagé :**
• Vos données ne sont jamais vendues à des annonceurs
• Vos données ne sont jamais utilisées pour du marketing tiers
• Vos coordonnées bancaires ne sont jamais stockées sur nos serveurs`
        },
        {
          icon: Lock,
          title: "5. Sécurité des données",
          content: `SKYPLAY AFRICA met en œuvre des mesures de sécurité avancées pour protéger vos données :

**Chiffrement :**
• Toutes les communications sont chiffrées en HTTPS/TLS
• Les mots de passe sont hachés avec des algorithmes sécurisés (bcrypt)
• Les données sensibles sont chiffrées en base de données

**Authentification :**
• Système d'authentification sécurisé via AWS Cognito
• Vérification en deux étapes disponible (recommandé)
• Déconnexion automatique après inactivité

**Accès restreint :**
• Seuls les administrateurs autorisés ont accès aux données
• Logs d'accès tracés et audités
• Politique de moindre privilège appliquée

**Surveillance :**
• Monitoring 24/7 des systèmes
• Détection automatique des activités suspectes
• Sauvegardes régulières et sécurisées

Malgré ces mesures, aucun système n'est infaillible à 100%. En cas de violation de données, nous vous informerons dans les 72 heures conformément aux bonnes pratiques.`
        },
        {
          icon: Shield,
          title: "6. Droits des utilisateurs",
          content: `Conformément aux principes de protection des données, vous disposez des droits suivants :

**Droit d'accès :**
Vous pouvez demander une copie de toutes les données personnelles que nous détenons sur vous.

**Droit de rectification :**
Vous pouvez corriger ou mettre à jour vos informations personnelles à tout moment depuis votre profil ou en contactant le support.

**Droit à l'effacement ("droit à l'oubli") :**
Vous pouvez demander la suppression de vos données personnelles, sous réserve de nos obligations légales de conservation (voir section 8).

**Droit à la portabilité :**
Vous pouvez demander à recevoir vos données dans un format structuré et lisible par machine.

**Droit d'opposition :**
Vous pouvez vous opposer au traitement de vos données pour des raisons légitimes.

**Droit de limitation :**
Vous pouvez demander la limitation du traitement de vos données dans certains cas.

**Pour exercer vos droits :**
Contactez-nous à support@skyplay.cm avec votre demande. Nous répondrons sous 30 jours maximum.

**Réclamation :**
Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès des autorités camerounaises compétentes.`
        },
        {
          icon: Cookie,
          title: "7. Cookies et technologies similaires",
          content: `**Cookies utilisés :**

**Cookies essentiels (obligatoires) :**
• Session utilisateur (maintien de la connexion)
• Préférences de langue
• Panier de défis en cours
Ces cookies sont nécessaires au fonctionnement de la plateforme et ne peuvent être désactivés.

**Cookies de performance :**
• Analyse des pages visitées
• Temps passé sur la plateforme
• Parcours utilisateur
Ces cookies nous aident à améliorer l'expérience utilisateur.

**Pas de cookies publicitaires :**
Nous n'utilisons AUCUN cookie publicitaire tiers (Google Ads, Facebook Pixel, etc.).

**Gestion des cookies :**
Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur. Notez que la désactivation de certains cookies peut affecter le fonctionnement de la plateforme.`
        },
        {
          icon: Database,
          title: "8. Conservation des données",
          content: `**Compte actif :**
Vos données sont conservées tant que votre compte est actif et que vous utilisez nos services.

**Après fermeture de compte :**
• Données personnelles : supprimées après 3 mois
• Données financières : conservées 3 ans (obligation légale camerounaise)
• Données de jeu anonymisées : conservées pour statistiques

**Données de transaction :**
Conformément aux obligations légales de lutte contre le blanchiment d'argent et la fraude, nous conservons les données de transaction pendant 3 ans après la dernière transaction.

**Suppression automatique :**
Les comptes inactifs depuis plus de 2 ans sont automatiquement supprimés après notification par email.

**Demande de suppression anticipée :**
Vous pouvez demander la suppression anticipée de vos données en contactant support@skyplay.cm, sous réserve des obligations légales de conservation.`
        },
        {
          icon: Shield,
          title: "9. Transferts internationaux",
          content: `Vos données sont principalement hébergées sur des serveurs situés en Europe (AWS région eu-west-1) qui respectent les normes internationales de protection des données.

Certains prestataires techniques peuvent avoir accès à vos données depuis d'autres pays, mais uniquement dans le cadre strict de la fourniture de leurs services et sous contrat de confidentialité.`
        },
        {
          icon: Users,
          title: "10. Mineurs",
          content: `La plateforme SKYPLAY AFRICA est strictement interdite aux personnes de moins de 18 ans.

Si nous découvrons qu'un mineur a créé un compte, celui-ci sera immédiatement supprimé et les parents/tuteurs légaux seront contactés.

Si vous êtes parent et découvrez que votre enfant a créé un compte, contactez-nous immédiatement à support@skyplay.cm.`
        },
        {
          icon: Shield,
          title: "11. Modifications de la politique",
          content: `SKYPLAY AFRICA se réserve le droit de modifier cette Politique de Confidentialité à tout moment pour refléter les changements dans nos pratiques ou pour des raisons légales.

**Notification :**
Toute modification substantielle vous sera notifiée par email au moins 7 jours avant son entrée en vigueur.

**Acceptation :**
La poursuite de l'utilisation de la plateforme après modification vaut acceptation de la nouvelle politique.

**Historique :**
Les versions précédentes de cette politique sont archivées et disponibles sur demande.`
        },
        {
          icon: Users,
          title: "12. Contact",
          content: `Pour toute question concernant cette Politique de Confidentialité ou vos données personnelles :

**Email :** support@skyplay.cm
**Délai de réponse :** 24-48 heures

**Adresse postale :**
SKYPLAY AFRICA
Cameroun

Nous nous engageons à traiter toutes vos demandes avec sérieux et dans les meilleurs délais.`
        }
      ]
    },
    en: {
      title: "Privacy Policy",
      lastUpdate: "Last updated: March 30, 2026",
      backHome: "Back to home",
      sections: [
        {
          icon: Shield,
          title: "1. Data Controller",
          content: `**SKYPLAY AFRICA**
Cameroon

**Contact:**
Email: support@skyplay.cm
For any questions regarding your personal data, contact our team at the address above.`
        },
        {
          icon: Database,
          title: "2. Data Collected",
          content: `We collect the following data to ensure proper platform operation:

**Registration data:**
• Full name
• Email address
• Phone number
• Date of birth (age verification)
• Country of residence

**Gaming data:**
• Challenge history
• Match results
• Performance statistics
• Rankings and ranks

**Financial data:**
• Wallet transaction history
• Deposited and withdrawn amounts
• Payment method used (Mobile Money or card)
• Note: We NEVER store your complete banking data

**Technical data:**
• IP address
• Device type (mobile, PC, console)
• Browser and operating system
• Connection logs
• Platform browsing data`
        },
        {
          icon: Eye,
          title: "3. Data Usage",
          content: `Your personal data is used only for the following purposes:

**Platform operation:**
• Account creation and management
• Gaming challenge organization
• Display of rankings and statistics
• Player communication (chat, notifications)

**Payment processing:**
• Deposits via Mobile Money (MTN, Orange) and credit card
• Withdrawals to Mobile Money
• Transaction history
• Financial fraud prevention

**Communications:**
• Confirmation emails (registration, transactions)
• Challenge and result notifications
• Important platform information
• Customer support

**Service improvement:**
• Usage analysis to improve user experience
• Bug detection and correction
• Development of new features`
        },
        {
          icon: Users,
          title: "4. Data Sharing",
          content: `**We NEVER sell your personal data to third parties.**

Your data may be shared only in the following cases:

**Payment providers:**
• Flutterwave (credit card payment processing)
• MTN Mobile Money (deposits and withdrawals)
• Orange Money (deposits and withdrawals)
These providers are subject to strict confidentiality obligations.

**Hosting and infrastructure:**
• Amazon Web Services (AWS) - secure servers
• Cloudinary - image storage
These services comply with international security standards.

**Legal obligations:**
• Cameroonian authorities if required by law
• Law enforcement in case of judicial investigation
• Competent regulatory bodies

**Never shared:**
• Your data is never sold to advertisers
• Your data is never used for third-party marketing
• Your banking details are never stored on our servers`
        },
        {
          icon: Lock,
          title: "5. Data Security",
          content: `SKYPLAY AFRICA implements advanced security measures to protect your data:

**Encryption:**
• All communications are encrypted in HTTPS/TLS
• Passwords are hashed with secure algorithms (bcrypt)
• Sensitive data is encrypted in database

**Authentication:**
• Secure authentication system via AWS Cognito
• Two-step verification available (recommended)
• Automatic logout after inactivity

**Restricted access:**
• Only authorized administrators have access to data
• Access logs tracked and audited
• Least privilege policy applied

**Monitoring:**
• 24/7 system monitoring
• Automatic detection of suspicious activities
• Regular and secure backups

Despite these measures, no system is 100% foolproof. In case of data breach, we will inform you within 72 hours in accordance with best practices.`
        },
        {
          icon: Shield,
          title: "6. User Rights",
          content: `In accordance with data protection principles, you have the following rights:

**Right of access:**
You can request a copy of all personal data we hold about you.

**Right of rectification:**
You can correct or update your personal information at any time from your profile or by contacting support.

**Right to erasure ("right to be forgotten"):**
You can request deletion of your personal data, subject to our legal retention obligations (see section 8).

**Right to portability:**
You can request to receive your data in a structured, machine-readable format.

**Right to object:**
You can object to the processing of your data for legitimate reasons.

**Right to restriction:**
You can request restriction of processing of your data in certain cases.

**To exercise your rights:**
Contact us at support@skyplay.cm with your request. We will respond within 30 days maximum.

**Complaint:**
If you believe your rights are not being respected, you can file a complaint with the competent Cameroonian authorities.`
        },
        {
          icon: Cookie,
          title: "7. Cookies and Similar Technologies",
          content: `**Cookies used:**

**Essential cookies (mandatory):**
• User session (maintaining connection)
• Language preferences
• Ongoing challenge cart
These cookies are necessary for platform operation and cannot be disabled.

**Performance cookies:**
• Analysis of visited pages
• Time spent on platform
• User journey
These cookies help us improve user experience.

**No advertising cookies:**
We use NO third-party advertising cookies (Google Ads, Facebook Pixel, etc.).

**Cookie management:**
You can manage your cookie preferences in your browser settings. Note that disabling certain cookies may affect platform functionality.`
        },
        {
          icon: Database,
          title: "8. Data Retention",
          content: `**Active account:**
Your data is retained as long as your account is active and you use our services.

**After account closure:**
• Personal data: deleted after 3 months
• Financial data: retained 3 years (Cameroonian legal obligation)
• Anonymized gaming data: retained for statistics

**Transaction data:**
In accordance with legal obligations to combat money laundering and fraud, we retain transaction data for 3 years after the last transaction.

**Automatic deletion:**
Accounts inactive for more than 2 years are automatically deleted after email notification.

**Early deletion request:**
You can request early deletion of your data by contacting support@skyplay.cm, subject to legal retention obligations.`
        },
        {
          icon: Shield,
          title: "9. International Transfers",
          content: `Your data is primarily hosted on servers located in Europe (AWS region eu-west-1) that comply with international data protection standards.

Some technical providers may access your data from other countries, but only within the strict framework of providing their services and under confidentiality agreement.`
        },
        {
          icon: Users,
          title: "10. Minors",
          content: `The SKYPLAY AFRICA platform is strictly prohibited for persons under 18 years of age.

If we discover that a minor has created an account, it will be immediately deleted and parents/legal guardians will be contacted.

If you are a parent and discover that your child has created an account, contact us immediately at support@skyplay.cm.`
        },
        {
          icon: Shield,
          title: "11. Policy Modifications",
          content: `SKYPLAY AFRICA reserves the right to modify this Privacy Policy at any time to reflect changes in our practices or for legal reasons.

**Notification:**
Any substantial modification will be notified to you by email at least 7 days before it comes into effect.

**Acceptance:**
Continued use of the platform after modification constitutes acceptance of the new policy.

**History:**
Previous versions of this policy are archived and available upon request.`
        },
        {
          icon: Users,
          title: "12. Contact",
          content: `For any questions regarding this Privacy Policy or your personal data:

**Email:** support@skyplay.cm
**Response time:** 24-48 hours

**Postal address:**
SKYPLAY AFRICA
Cameroon

We are committed to treating all your requests seriously and in a timely manner.`
        }
      ]
    }
  }

  const t = content[lang]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#00165F] to-[#000d3d] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t.backHome}</span>
          </Link>
          
          <button
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="font-semibold">{lang === 'fr' ? 'EN' : 'FR'}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-[#0097FC] to-[#00d4ff] bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-white/60 text-sm">{t.lastUpdate}</p>
        </div>

        <div className="space-y-8">
          {t.sections.map((section, index) => {
            const Icon = section.icon
            return (
              <section key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-[#0097FC]/20 text-[#0097FC]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#0097FC] flex-1 pt-2">
                    {section.title}
                  </h2>
                </div>
                <div className="text-white/80 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </section>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/60 text-sm">
          <p>© 2026 SKYPLAY AFRICA - Cameroun</p>
          <p className="mt-2">support@skyplay.cm</p>
        </div>
      </main>
    </div>
  )
}
