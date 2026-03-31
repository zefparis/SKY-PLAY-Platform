'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Globe } from 'lucide-react'

export default function CGUPage() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr')

  const content = {
    fr: {
      title: "Conditions Générales d'Utilisation",
      lastUpdate: "Dernière mise à jour : 30 mars 2026",
      backHome: "Retour à l'accueil",
      sections: [
        {
          title: "1. Objet et acceptation",
          content: `SKY PLAY ENTERTAINMENT est une plateforme de défis gaming exploitée conformément aux lois en vigueur au Cameroun. En vous inscrivant et en utilisant nos services, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation (CGU).

L'utilisation de la plateforme implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.`
        },
        {
          title: "2. Définitions",
          content: `• **Plateforme** : désigne SKY PLAY ENTERTAINMENT, accessible via le site web et les applications mobiles.
• **Utilisateur** : toute personne physique inscrite sur la plateforme et disposant d'un compte actif.
• **Compétition** : événement e-sport fondé sur l'habileté, organisé entre joueurs sur des jeux vidéo avec un pass de participation en Sky Credits (SKY).
• **Sky Credits (SKY)** : monnaie interne d'usage de la plateforme, non présentée comme monnaie électronique autonome. 1 Sky Credit = 1 Franc CFA lors de la conversion au retrait. Permettent de recharger, retirer et gérer vos fonds sur SKY PLAY.
• **Frais d'organisation** : pourcentage prélevé par SKY PLAY sur chaque compétition pour l'organisation et l'infrastructure de la plateforme.`
        },
        {
          title: "3. Inscription et compte",
          content: `**Conditions d'inscription :**
• Vous devez avoir au minimum 18 ans révolus.
• Vous devez fournir des informations exactes et à jour (nom, email, numéro de téléphone).
• Vous ne pouvez créer qu'un seul compte par personne.
• Toute création de comptes multiples entraînera la suspension de tous vos comptes.

**Responsabilité du compte :**
• Vous êtes seul responsable de la confidentialité de vos identifiants de connexion.
• Toute activité effectuée depuis votre compte est présumée être de votre fait.
• En cas de compromission de votre compte, contactez immédiatement support@skyplay.cm.

**Suspension et fermeture :**
SKY PLAY se réserve le droit de suspendre ou fermer tout compte en cas de violation des présentes CGU, de fraude avérée ou de comportement inapproprié.`
        },
        {
          title: "4. Nature du service",
          content: `SKY PLAY ENTERTAINMENT est une plateforme de compétitions e-sport et de divertissement numérique fondées sur l'habileté. Les paiements rémunèrent l'accès aux services numériques, l'organisation des événements et l'infrastructure compétitive.

Les compétitions proposées ne constituent pas des jeux de hasard. Le résultat dépend exclusivement de la maîtrise du jeu, de la stratégie et des capacités des participants. SKY PLAY n'intervient pas dans le déroulement des parties et ne peut influer sur leur issue.`
        },
        {
          title: "5. Système de compétitions et pass de participation",
          content: `**Fonctionnement des compétitions :**
• Les pass de participation sont achetés en Franc CFA (XAF) depuis vos Sky Credits SKY PLAY.
• Des frais d'organisation sont prélevés par SKY PLAY sur chaque compétition (entre 10% et 25% selon le format).
• Les primes de performance sont distribuées automatiquement au(x) vainqueur(s) après validation des résultats.

**Déclaration des résultats :**
• Les résultats sont déclarés sous la responsabilité exclusive des joueurs participants.
• Vous devez fournir des preuves valides (captures d'écran, vidéos) en cas de litige.
• Toute déclaration de faux résultat entraîne la suspension immédiate du compte et la confiscation des primes.

**Annulation de compétition :**
• Une compétition peut être annulée si aucun adversaire ne se présente dans le délai imparti.
• En cas d'annulation, les pass de participation sont intégralement remboursés sur vos Sky Credits.
• SKY PLAY se réserve le droit d'annuler toute compétition suspecte ou frauduleuse.`
        },
        {
          title: "6. Sky Credits et paiements",
          content: `**Rechargement :**
• Méthodes acceptées : Mobile Money (MTN Mobile Money, Orange Money) et carte bancaire.
• Montant minimum de rechargement : 500 CFA.
• Les Sky Credits sont crédités instantanément ou sous 5 minutes maximum.

**Retrait de fonds :**
• Retraits uniquement vers Mobile Money (MTN ou Orange).
• Montant minimum de retrait : 1 000 CFA.
• Délai de traitement : 24 à 48 heures ouverées.
• Des frais de traitement peuvent s'appliquer selon l'opérateur.

**Important :**
• SKY PLAY n'est pas un établissement financier et ne propose pas de services bancaires.
• Les Sky Credits ne génèrent aucun intérêt.
• SKY PLAY utilise des prestataires tiers sécurisés (Flutterwave, MTN, Orange) pour le traitement des paiements.`
        },
        {
          title: "7. Propriété intellectuelle",
          content: `Tous les éléments de la plateforme SKY PLAY (logos, marques, designs, textes, images, vidéos, code source) sont la propriété exclusive de SKY PLAY ENTERTAINMENT et sont protégés par les lois camerounaises et internationales sur la propriété intellectuelle.

Toute reproduction, représentation, modification, publication ou adaptation totale ou partielle sans autorisation écrite préalable est strictement interdite et constitue une contrefaçon sanctionnée par le Code pénal camerounais.`
        },
        {
          title: "8. Responsabilités",
          content: `**Responsabilité de SKY PLAY :**
• SKY PLAY n'est pas responsable des résultats des jeux vidéo tiers (FIFA, Call of Duty, etc.).
• SKY PLAY n'est pas l'éditeur de ces jeux et ne contrôle pas leur fonctionnement.
• La plateforme est un service d'organisation de défis uniquement.
• SKY PLAY met tout en œuvre pour assurer la disponibilité de la plateforme mais ne garantit pas un accès ininterrompu.

**Responsabilité de l'Utilisateur :**
• Vous êtes responsable de votre équipement (console, PC, connexion internet).
• Vous êtes responsable de la véracité des résultats que vous déclarez.
• Vous vous engagez à respecter les règles de fair-play et à ne pas utiliser de logiciels de triche.

**Limitation de responsabilité :**
SKY PLAY ne pourra être tenu responsable des dommages indirects, pertes de profits, pertes de données ou tout autre préjudice résultant de l'utilisation ou de l'impossibilité d'utiliser la plateforme.`
        },
        {
          title: "9. Litiges et arbitrage",
          content: `**Litiges entre joueurs :**
• En cas de désaccord sur un résultat, contactez support@skyplay.cm avec vos preuves.
• L'équipe SKY PLAY examine les preuves et rend une décision sous 48-72 heures.
• La décision de l'administrateur SKY PLAY est définitive et sans appel.

**Médiation :**
Avant toute action judiciaire, les parties s'engagent à tenter une résolution amiable du litige par médiation.

**Contact support :**
Email : support@skyplay.cm
Délai de réponse : 24-48 heures`
        },
        {
          title: "10. Droit applicable et juridiction",
          content: `Les présentes CGU sont soumises au droit camerounais.

En cas de litige non résolu à l'amiable, les tribunaux de Douala, Cameroun, seront seuls compétents, nonobstant pluralité de défendeurs ou appel en garantie.`
        },
        {
          title: "11. Modification des CGU",
          content: `SKY PLAY se réserve le droit de modifier les présentes CGU à tout moment pour s'adapter aux évolutions légales, techniques ou commerciales.

Les utilisateurs seront informés de toute modification substantielle par email au moins 7 jours avant leur entrée en vigueur.

La poursuite de l'utilisation de la plateforme après modification vaut acceptation des nouvelles CGU.

Pour toute question concernant ces CGU, contactez-nous à : support@skyplay.cm`
        }
      ]
    },
    en: {
      title: "Terms and Conditions of Use",
      lastUpdate: "Last updated: March 30, 2026",
      backHome: "Back to home",
      sections: [
        {
          title: "1. Purpose and Acceptance",
          content: `SKY PLAY ENTERTAINMENT is a gaming challenge platform operated in accordance with the laws in force in Cameroon. By registering and using our services, you unconditionally accept these Terms and Conditions of Use (T&C).

Use of the platform implies full and complete acceptance of these T&C. If you do not accept these terms, please do not use our services.`
        },
        {
          title: "2. Definitions",
          content: `• **Platform**: refers to SKY PLAY ENTERTAINMENT, accessible via the website and mobile applications.
• **User**: any natural person registered on the platform with an active account.
• **Competition**: skill-based event organized between players on video games with a participation pass in CFA Franc (XAF).
• **Sky Credits**: SKY PLAY electronic wallet allowing you to top up, withdraw and manage your funds.
• **Organization fee**: percentage charged by SKY PLAY on each competition for event organization and platform infrastructure.`
        },
        {
          title: "3. Registration and Account",
          content: `**Registration requirements:**
• You must be at least 18 years old.
• You must provide accurate and up-to-date information (name, email, phone number).
• You can only create one account per person.
• Creating multiple accounts will result in suspension of all your accounts.

**Account responsibility:**
• You are solely responsible for the confidentiality of your login credentials.
• Any activity performed from your account is presumed to be your doing.
• In case of account compromise, immediately contact support@skyplay.cm.

**Suspension and closure:**
SKY PLAY reserves the right to suspend or close any account in case of violation of these T&C, proven fraud or inappropriate behavior.`
        },
        {
          title: "4. Nature of the Service",
          content: `SKY PLAY ENTERTAINMENT is a skill-based e-sport competition and digital entertainment platform. Payments remunerate access to digital services, event organization and competitive infrastructure.

The competitions offered do not constitute games of chance. Results depend exclusively on game mastery, strategy and participant capabilities. SKY PLAY does not intervene in gameplay and cannot influence its outcome.`
        },
        {
          title: "5. Competition System and Participation Pass",
          content: `**How competitions work:**
• Participation passes are purchased in CFA Franc (XAF) from your SKY PLAY Sky Credits.
• An organization fee is charged by SKY PLAY on each competition (between 10% and 25% depending on competition format).
• Performance rewards are automatically distributed to the winner(s) after result validation.

**Result declaration:**
• Results are declared under the exclusive responsibility of participating players.
• You must provide valid proof (screenshots, videos) in case of dispute.
• Any false result declaration results in immediate account suspension and reward confiscation.

**Competition cancellation:**
• A competition can be cancelled if no opponent shows up within the allotted time.
• In case of cancellation, participation passes are fully refunded to Sky Credits.
• SKY PLAY reserves the right to cancel any suspicious or fraudulent competition.`
        },
        {
          title: "6. Sky Credits and Payments",
          content: `**Top-up:**
• Accepted methods: Mobile Money (MTN Mobile Money, Orange Money) and credit card.
• Minimum top-up amount: 500 CFA.
• Sky Credits are credited instantly or within 5 minutes maximum.

**Fund withdrawal:**
• Withdrawals only to Mobile Money (MTN or Orange).
• Minimum withdrawal amount: 1,000 CFA.
• Processing time: 24 to 48 business hours.
• Processing fees may apply depending on the operator.

**Important:**
• SKY PLAY is not a financial institution and does not offer banking services.
• Sky Credits do not generate any interest.
• SKY PLAY uses secure third-party providers (Flutterwave, MTN, Orange) for payment processing.`
        },
        {
          title: "7. Intellectual Property",
          content: `All elements of the SKY PLAY platform (logos, trademarks, designs, texts, images, videos, source code) are the exclusive property of SKY PLAY ENTERTAINMENT and are protected by Cameroonian and international intellectual property laws.

Any reproduction, representation, modification, publication or total or partial adaptation without prior written authorization is strictly prohibited and constitutes counterfeiting punishable under the Cameroonian Penal Code.`
        },
        {
          title: "8. Responsibilities",
          content: `**SKY PLAY's responsibility:**
• SKY PLAY is not responsible for third-party video game results (FIFA, Call of Duty, etc.).
• SKY PLAY is not the publisher of these games and does not control their operation.
• The platform is a challenge organization service only.
• SKY PLAY makes every effort to ensure platform availability but does not guarantee uninterrupted access.

**User's responsibility:**
• You are responsible for your equipment (console, PC, internet connection).
• You are responsible for the accuracy of the results you declare.
• You commit to respecting fair play rules and not using cheating software.

**Limitation of liability:**
SKY PLAY cannot be held responsible for indirect damages, loss of profits, data loss or any other damage resulting from the use or inability to use the platform.`
        },
        {
          title: "9. Disputes and Arbitration",
          content: `**Disputes between players:**
• In case of disagreement on a result, contact support@skyplay.cm with your evidence.
• The SKY PLAY team examines the evidence and makes a decision within 48-72 hours.
• The SKY PLAY administrator's decision is final and without appeal.

**Mediation:**
Before any legal action, the parties commit to attempting an amicable resolution of the dispute through mediation.

**Support contact:**
Email: support@skyplay.cm
Response time: 24-48 hours`
        },
        {
          title: "10. Applicable Law and Jurisdiction",
          content: `These T&C are governed by Cameroonian law.

In case of dispute not resolved amicably, the courts of Douala, Cameroon, shall have sole jurisdiction, notwithstanding plurality of defendants or third-party claims.`
        },
        {
          title: "11. Modification of T&C",
          content: `SKY PLAY reserves the right to modify these T&C at any time to adapt to legal, technical or commercial developments.

Users will be informed of any substantial modification by email at least 7 days before they come into effect.

Continued use of the platform after modification constitutes acceptance of the new T&C.

For any questions regarding these T&C, contact us at: support@skyplay.cm`
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
          {t.sections.map((section, index) => (
            <section key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-[#0097FC] mb-4">
                {section.title}
              </h2>
              <div className="text-white/80 leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/60 text-sm">
          <p>© 2026 SKY PLAY ENTERTAINMENT - Cameroun</p>
          <p className="mt-2">support@skyplay.cm</p>
        </div>
      </main>
    </div>
  )
}
