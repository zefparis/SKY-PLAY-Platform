import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Conditions d'Utilisation — SKY PLAY",
  description:
    "Conditions générales d'utilisation de SKY PLAY Entertainment. Règles de la plateforme, compétitions, paiements et responsabilités.",
}

const CONTACT_EMAIL = 'contact@ia-solution.fr'

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: '1. Description du service',
    paragraphs: [
      "SKY PLAY Entertainment (\"SKY PLAY\", \"nous\", \"la plateforme\") est une plateforme de compétitions gaming en ligne accessible à l'adresse skyplay.cloud et via ses applications mobiles.",
      "Le service permet aux utilisateurs de : participer à des défis (challenges) 1v1 ou multijoueurs avec mise en jeu de Sky Credits, s'inscrire à des tournois organisés par SKY PLAY ou par d'autres utilisateurs, diffuser en direct leurs matchs via l'intégration YouTube, rejoindre des ligues compétitives avec classements et saisons, gérer un portefeuille numérique (Sky Credits) avec dépôts et retraits.",
      "SKY PLAY est un service de divertissement compétitif basé sur l'habileté des joueurs. Il ne s'agit en aucun cas d'un service de jeux de hasard ou de paris en ligne.",
    ],
  },
  {
    title: '2. Éligibilité',
    paragraphs: [
      "Pour utiliser SKY PLAY, vous devez : être âgé de 18 ans ou plus, ou être âgé de 16 à 18 ans avec l'autorisation écrite et vérifiable de votre représentant légal.",
      "Disposer de la capacité juridique pour conclure un contrat dans votre pays de résidence.",
      "Ne pas être résident d'un pays où les compétitions en ligne avec mise en jeu sont interdites par la loi.",
      "SKY PLAY se réserve le droit de demander une vérification d'identité à tout moment et de suspendre tout compte ne répondant pas aux critères d'éligibilité.",
    ],
  },
  {
    title: '3. Compte utilisateur',
    paragraphs: [
      "Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toute activité effectuée via votre compte.",
      "Chaque personne ne peut détenir qu'un seul compte SKY PLAY. La création de comptes multiples (multi-accounting) est strictement interdite et entraîne la suspension immédiate de tous les comptes concernés.",
      "Vous vous engagez à fournir des informations exactes et à jour lors de votre inscription et à les maintenir à jour.",
      "En cas de suspicion d'accès non autorisé à votre compte, vous devez nous contacter immédiatement.",
    ],
  },
  {
    title: '4. Règles des compétitions et défis',
    paragraphs: [
      "Les compétitions sur SKY PLAY sont régies par des règles spécifiques à chaque jeu et format. En participant, vous acceptez de respecter ces règles.",
      "Résultats — Les participants doivent soumettre leurs résultats de manière honnête, accompagnés de preuves (captures d'écran, vidéos) lorsque demandé. Tout résultat frauduleux sera annulé.",
      "Litiges — En cas de désaccord sur un résultat, un système de contestation (dispute) est disponible. Les litiges sont examinés par l'équipe d'administration de SKY PLAY, dont la décision est définitive.",
      "Fair-play — Tout comportement antisportif, insulte, harcèlement ou tentative d'intimidation envers un adversaire est interdit et sanctionné.",
      "Forfait — L'absence à un match planifié sans notification préalable sera considérée comme un forfait. Les Sky Credits engagés seront attribués à l'adversaire.",
    ],
  },
  {
    title: '5. Paiements et Sky Credits',
    paragraphs: [
      "Les Sky Credits sont la monnaie virtuelle de la plateforme. Ils peuvent être obtenus par dépôt d'argent réel via Flutterwave ou en remportant des compétitions.",
      "Dépôts — Les dépôts sont traités via notre prestataire de paiement Flutterwave. Les montants minimums et maximums de dépôt sont indiqués sur la plateforme.",
      "Retraits — Les gains peuvent être retirés vers votre compte bancaire ou portefeuille mobile, sous réserve de vérification d'identité et du respect des montants minimums de retrait.",
      "Frais — SKY PLAY prélève une commission sur les mises des compétitions. Le taux de commission est clairement affiché avant chaque engagement.",
      "Remboursements — Les dépôts ne sont pas remboursables sauf en cas d'erreur technique avérée de notre part. Les Sky Credits engagés dans une compétition ne sont pas récupérables une fois le match démarré.",
      "SKY PLAY se réserve le droit de geler ou saisir les Sky Credits d'un compte en cas de fraude avérée, conformément à la section 6.",
    ],
  },
  {
    title: '6. Comportement interdit',
    paragraphs: [
      "Les comportements suivants sont strictement interdits sur SKY PLAY et peuvent entraîner des sanctions allant de l'avertissement à la suppression définitive du compte avec confiscation des Sky Credits :",
      "Triche — Utilisation de logiciels tiers (cheats, hacks, bots, macros), exploitation de bugs de jeu, manipulation de résultats.",
      "Fraude — Utilisation de moyens de paiement volés, blanchiment d'argent via la plateforme, falsification de preuves de résultats.",
      "Multi-accounting — Création ou utilisation de plusieurs comptes pour contourner les règles ou manipuler les classements.",
      "Abus — Harcèlement, discours haineux, menaces, usurpation d'identité, spam.",
      "Collusion — Accord secret entre participants pour fausser le résultat d'une compétition.",
      "Les décisions de modération sont prises par l'équipe SKY PLAY après examen des preuves. L'utilisateur sanctionné peut contester la décision en contactant l'adresse indiquée en section 11.",
    ],
  },
  {
    title: '7. Streaming et contenu',
    paragraphs: [
      "SKY PLAY permet aux utilisateurs de diffuser leurs matchs en direct via l'intégration YouTube. En utilisant cette fonctionnalité, vous vous engagez à respecter les conditions d'utilisation de YouTube et les règles de la communauté Google.",
      "Vous êtes seul responsable du contenu diffusé via votre chaîne YouTube. SKY PLAY ne peut être tenu responsable des contenus créés ou diffusés par les utilisateurs.",
      "SKY PLAY se réserve le droit de désactiver la fonctionnalité de streaming pour tout utilisateur ne respectant pas les présentes conditions.",
    ],
  },
  {
    title: '8. Propriété intellectuelle',
    paragraphs: [
      "L'ensemble des éléments constituant la plateforme SKY PLAY (design, code source, logo, marques, textes, images) sont la propriété exclusive de SKY PLAY Entertainment ou de ses concédants de licence.",
      "Toute reproduction, modification, distribution ou utilisation non autorisée de ces éléments est interdite.",
      "Les marques et logos des jeux tiers (Steam, Epic Games, YouTube, etc.) sont la propriété de leurs détenteurs respectifs et sont utilisés dans le cadre d'accords de licence ou d'utilisation autorisée.",
    ],
  },
  {
    title: '9. Limitation de responsabilité',
    paragraphs: [
      "SKY PLAY est fourni \"en l'état\". Nous nous efforçons d'assurer la disponibilité et le bon fonctionnement de la plateforme, mais ne garantissons pas un service exempt d'interruptions ou d'erreurs.",
      "SKY PLAY ne peut être tenu responsable de : pertes financières résultant de la participation aux compétitions, problèmes techniques liés à votre connexion internet ou à votre équipement, contenus publiés par les utilisateurs, dysfonctionnements de services tiers (YouTube, Steam, Flutterwave, etc.).",
      "La responsabilité totale de SKY PLAY envers un utilisateur est limitée au montant des Sky Credits détenus sur son compte au moment du litige.",
    ],
  },
  {
    title: '10. Suspension et résiliation',
    paragraphs: [
      "SKY PLAY se réserve le droit de suspendre ou résilier votre compte à tout moment en cas de violation des présentes conditions, sans préavis pour les cas de fraude ou de triche.",
      "Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre profil. La suppression entraîne la perte définitive des Sky Credits restants si aucun retrait n'est effectué préalablement.",
      "En cas de suspension ou résiliation pour faute, les Sky Credits restants pourront être confisqués.",
    ],
  },
  {
    title: '11. Droit applicable et juridiction',
    paragraphs: [
      "Les présentes conditions sont régies par le droit français.",
      "En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action en justice. À défaut d'accord, les tribunaux compétents de Paris (France) seront seuls compétents.",
    ],
  },
  {
    title: '12. Modifications',
    paragraphs: [
      "SKY PLAY se réserve le droit de modifier les présentes conditions à tout moment. Toute modification substantielle sera notifiée par e-mail ou par notification dans l'application au moins 15 jours avant son entrée en vigueur.",
      "La poursuite de l'utilisation de la plateforme après l'entrée en vigueur des modifications vaut acceptation des nouvelles conditions.",
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0d1020]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#0097FC]/30 bg-[#0097FC]/10 text-[#0097FC] text-sm font-bold mb-6">
            Légal
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Conditions d&apos;Utilisation
          </h1>
          <p className="text-white/40 text-sm">
            SKY PLAY Entertainment — Dernière mise à jour : mai 2026
          </p>
        </div>

        {/* Intro */}
        <div className="bg-[#111630] rounded-2xl border border-white/10 p-6 mb-6">
          <p className="text-white/70 text-sm leading-relaxed">
            Bienvenue sur SKY PLAY. En créant un compte ou en utilisant nos
            services, vous acceptez les présentes Conditions Générales
            d&apos;Utilisation. Si vous n&apos;acceptez pas ces conditions, vous ne
            devez pas utiliser la plateforme. Nous vous invitons à lire
            attentivement ce document ainsi que notre{' '}
            <Link href="/privacy" className="text-[#0097FC] hover:underline font-semibold">
              Politique de Confidentialité
            </Link>
            .
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {SECTIONS.map((section, i) => (
            <div
              key={i}
              className="bg-[#111630] rounded-2xl border border-white/10 p-6"
            >
              <h2 className="text-base font-black text-white mb-4">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="text-white/60 text-sm leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {/* Contact */}
          <div className="bg-[#111630] rounded-2xl border border-white/10 p-6">
            <h2 className="text-base font-black text-white mb-4">
              13. Contact
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Pour toute question relative aux présentes conditions, pour
              signaler un abus ou pour contester une décision de modération,
              contactez-nous :
            </p>
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/80 text-sm font-semibold">SKY PLAY Entertainment</p>
              <p className="text-white/60 text-sm mt-1">
                E-mail :{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#0097FC] font-semibold hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p className="text-white/60 text-sm mt-1">
                Temps de réponse moyen : 48 heures ouvrées.
              </p>
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/15 bg-white/5 text-white/70 hover:border-[#0097FC]/50 hover:text-white transition-colors"
          >
            ← Accueil
          </Link>
          <Link
            href="/privacy"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#0097FC]/30 bg-[#0097FC]/10 text-[#0097FC] hover:bg-[#0097FC]/20 transition-colors"
          >
            Politique de confidentialité →
          </Link>
        </div>
      </div>
    </div>
  )
}
