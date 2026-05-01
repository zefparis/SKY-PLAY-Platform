import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — SKY PLAY',
  description:
    'Politique de confidentialité de SKY PLAY Entertainment. Découvrez comment nous collectons, utilisons et protégeons vos données personnelles.',
}

const CONTACT_EMAIL = 'contact@ia-solution.fr'

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: '1. Données collectées',
    paragraphs: [
      "Lors de la création de votre compte et de l'utilisation de la plateforme, nous collectons les catégories de données suivantes :",
      "Données de compte — adresse e-mail, nom d'utilisateur, mot de passe (haché), pays, ville, numéro de téléphone, photo de profil.",
      "Données de jeu — comptes de jeu liés (Steam, Epic Games), statistiques de matchs, résultats de compétitions, classements, captures d'écran de preuves.",
      "Données de paiement — historique de transactions (dépôts, retraits, Sky Credits), informations nécessaires au traitement des paiements via notre prestataire Flutterwave. Nous ne stockons jamais vos numéros de carte bancaire.",
      "Données de streaming — identifiant de chaîne YouTube lié, tokens d'accès OAuth (chiffrés AES-256-GCM), métadonnées de diffusions en direct.",
      "Données techniques — adresse IP, type de navigateur, système d'exploitation, pages visitées, horodatages d'accès.",
    ],
  },
  {
    title: '2. Utilisation des données',
    paragraphs: [
      'Vos données sont utilisées exclusivement aux fins suivantes :',
      "Fonctionnement du service — authentification, gestion de votre compte, participation aux compétitions et tournois, traitement des paiements et des gains, diffusion en direct de vos matchs.",
      "Personnalisation — adaptation de l'expérience utilisateur, recommandations de compétitions, affichage de statistiques personnalisées.",
      "Sécurité et intégrité — détection de fraude et de triche, vérification d'identité, prévention des abus, modération des contenus.",
      "Analytics — mesure d'audience anonymisée, amélioration continue de la plateforme, diagnostic de problèmes techniques.",
      "Communication — notifications relatives à vos matchs et tournois, alertes de sécurité, mises à jour importantes du service. Nous n'envoyons jamais de publicité à des tiers.",
    ],
  },
  {
    title: '3. Partage des données',
    paragraphs: [
      "SKY PLAY ne vend, ne loue et ne cède jamais vos données personnelles à des tiers à des fins commerciales ou publicitaires.",
      "Vos données peuvent être partagées uniquement avec des prestataires techniques strictement nécessaires au fonctionnement du service, sous accord de confidentialité : hébergement (Railway, Vercel), paiements (Flutterwave), authentification (AWS Cognito), stockage de médias (Cloudinary, AWS S3).",
      "En cas d'obligation légale, vos données pourront être communiquées aux autorités compétentes conformément au droit applicable.",
    ],
  },
  {
    title: '4. Intégrations tierces',
    paragraphs: [
      "SKY PLAY s'intègre avec des services tiers pour enrichir votre expérience :",
      "YouTube (Google) — Lorsque vous liez votre compte YouTube, nous accédons à votre chaîne via l'API YouTube Data v3 pour créer et gérer des diffusions en direct de vos matchs. Les scopes demandés sont youtube et youtube.upload. Vous pouvez révoquer cet accès à tout moment depuis votre profil SKY PLAY ou depuis les paramètres de sécurité de votre compte Google (https://myaccount.google.com/permissions). L'utilisation des données YouTube est conforme aux Conditions d'utilisation des services API YouTube (https://developers.google.com/youtube/terms/api-services-terms-of-service) et à la Politique de confidentialité de Google (https://policies.google.com/privacy).",
      "Steam — Authentification OpenID pour lier votre compte Steam. Nous récupérons votre SteamID, nom de profil et avatar. Aucun token d'accès n'est stocké.",
      "Epic Games — Liaison OAuth pour accéder à votre identifiant Epic et votre nom d'utilisateur. Les tokens sont stockés chiffrés.",
      "Flutterwave — Traitement des paiements (dépôts et retraits). Seules les informations nécessaires à la transaction sont transmises. SKY PLAY ne stocke aucune donnée bancaire.",
    ],
  },
  {
    title: '5. Stockage et sécurité',
    paragraphs: [
      "Vos données sont hébergées sur des serveurs sécurisés (Railway, AWS) avec chiffrement en transit (TLS 1.3) et au repos. Les tokens OAuth sont chiffrés avec AES-256-GCM avant stockage en base de données.",
      "Nous appliquons des mesures techniques et organisationnelles conformes aux standards de l'industrie : hachage des mots de passe, contrôle d'accès par rôle, journalisation des accès, mises à jour de sécurité régulières.",
      "En cas de violation de données, nous nous engageons à notifier les utilisateurs concernés et la CNIL dans un délai de 72 heures conformément au RGPD.",
    ],
  },
  {
    title: '6. Droits des utilisateurs',
    paragraphs: [
      "Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez des droits suivants :",
      "Droit d'accès — Obtenir une copie de l'ensemble des données personnelles que nous détenons vous concernant.",
      "Droit de rectification — Corriger toute donnée inexacte ou incomplète.",
      "Droit de suppression — Demander l'effacement de vos données personnelles. La suppression de votre compte entraîne la suppression définitive de vos données sous 30 jours, à l'exception des données requises par des obligations légales (transactions financières).",
      "Droit à la portabilité — Recevoir vos données dans un format structuré, couramment utilisé et lisible par machine.",
      "Droit d'opposition — Vous opposer au traitement de vos données à des fins spécifiques.",
      "Pour exercer l'un de ces droits, contactez-nous à l'adresse indiquée ci-dessous. Nous traiterons votre demande dans un délai de 30 jours.",
    ],
  },
  {
    title: '7. Cookies et tracking',
    paragraphs: [
      "SKY PLAY utilise uniquement des cookies techniques indispensables au fonctionnement de la plateforme :",
      "Cookies de session — Maintien de votre authentification et de votre session active.",
      "Cookies de préférences — Mémorisation de vos paramètres d'affichage (thème, langue).",
      "Aucun cookie publicitaire, de profilage ou de traçage tiers n'est utilisé. Nous n'utilisons pas Google Analytics, Facebook Pixel ou tout autre outil de tracking publicitaire.",
    ],
  },
  {
    title: '8. Conservation des données',
    paragraphs: [
      "Vos données de compte sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données sont effacées sous 30 jours.",
      "Les données de transactions financières sont conservées pendant 5 ans conformément aux obligations légales comptables françaises.",
      "Les logs techniques sont conservés pendant 12 mois à des fins de sécurité et de diagnostic.",
    ],
  },
  {
    title: '9. Mineurs',
    paragraphs: [
      "SKY PLAY est destiné aux utilisateurs âgés de 18 ans ou plus. Les mineurs de 16 à 18 ans peuvent utiliser la plateforme avec l'autorisation vérifiable de leur représentant légal. Nous ne collectons pas sciemment les données de mineurs de moins de 16 ans.",
    ],
  },
  {
    title: '10. Modifications',
    paragraphs: [
      "Nous nous réservons le droit de modifier la présente politique de confidentialité à tout moment. Toute modification substantielle sera notifiée par e-mail ou par notification dans l'application au moins 15 jours avant son entrée en vigueur.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0d1020]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#0097FC]/30 bg-[#0097FC]/10 text-[#0097FC] text-sm font-bold mb-6">
            Légal
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Politique de Confidentialité
          </h1>
          <p className="text-white/40 text-sm">
            SKY PLAY Entertainment — Dernière mise à jour : mai 2026
          </p>
        </div>

        {/* Intro */}
        <div className="bg-[#111630] rounded-2xl border border-white/10 p-6 mb-6">
          <p className="text-white/70 text-sm leading-relaxed">
            SKY PLAY Entertainment (&quot;SKY PLAY&quot;, &quot;nous&quot;, &quot;notre&quot;) s&apos;engage à
            protéger vos données personnelles. La présente politique décrit
            quelles informations nous collectons, comment nous les utilisons,
            avec qui nous les partageons et quels sont vos droits. En utilisant
            notre plateforme accessible à{' '}
            <a href="https://skyplay.cloud" className="text-[#0097FC] hover:underline font-semibold">
              skyplay.cloud
            </a>
            , vous acceptez les pratiques décrites ci-dessous.
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
              11. Contact
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Pour toute question relative à vos données personnelles, pour
              exercer vos droits ou pour signaler un problème de confidentialité,
              contactez notre Délégué à la Protection des Données :
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
                Vous pouvez également adresser une réclamation à la CNIL (Commission Nationale de l&apos;Informatique et des Libertés) si vous estimez que vos droits ne sont pas respectés.
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
            href="/terms"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#0097FC]/30 bg-[#0097FC]/10 text-[#0097FC] hover:bg-[#0097FC]/20 transition-colors"
          >
            Conditions d&apos;utilisation →
          </Link>
        </div>
      </div>
    </div>
  )
}
