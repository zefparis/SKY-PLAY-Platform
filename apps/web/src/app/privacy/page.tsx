import Link from 'next/link'

const SECTIONS = [
  {
    title: 'Données collectées',
    content:
      'Nous collectons les informations suivantes lors de votre inscription et de votre utilisation de la plateforme : adresse e-mail, nom d'utilisateur (username), pays, ville, numéro de téléphone.',
  },
  {
    title: 'Usage des données',
    content:
      'Ces données sont utilisées exclusivement aux fins suivantes : authentification et sécurisation de votre compte, participation aux compétitions et tournois, communication liée à votre activité sur la plateforme.',
  },
  {
    title: 'Stockage et sécurité',
    content:
      'Vos données sont hébergées sur des serveurs sécurisés Railway (Union Européenne). Nous appliquons des mesures techniques et organisationnelles pour protéger vos informations contre tout accès non autorisé.',
  },
  {
    title: 'Partage avec des tiers',
    content:
      'Aucune donnée personnelle n'est vendue, louée ou cédée à des tiers à des fins commerciales. Les données ne peuvent être transmises qu'à des prestataires techniques strictement nécessaires au fonctionnement du service, sous accord de confidentialité.',
  },
  {
    title: 'Cookies',
    content:
      'Nous utilisons uniquement des cookies techniques indispensables à l'authentification et au maintien de votre session. Aucun cookie publicitaire ou de traçage tiers n'est utilisé.',
  },
  {
    title: 'Droit de suppression et accès',
    content:
      'Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous à l'adresse ci-dessous. Nous traiterons votre demande dans un délai de 30 jours.',
  },
  {
    title: 'Contact',
    content: null,
    isContact: true,
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen dark:bg-[#080c18] bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border dark:border-[#0097FC]/30 border-[#0097FC]/20 dark:bg-[#0097FC]/10 bg-[#0097FC]/5 text-[#0097FC] text-sm font-bold mb-6">
            Légal
          </span>
          <h1 className="text-3xl sm:text-4xl font-black dark:text-white text-[#00165F] mb-3">
            Politique de Confidentialité
          </h1>
          <p className="dark:text-white/40 text-[#00165F]/40 text-sm">
            SKY PLAY — Dernière mise à jour : avril 2025
          </p>
        </div>

        {/* Intro */}
        <div className="dark:bg-[#0d1124] bg-white rounded-2xl border dark:border-white/10 border-[#00165F]/10 p-6 mb-6">
          <p className="dark:text-white/70 text-[#00165F]/70 text-sm leading-relaxed">
            SKY PLAY s'engage à protéger vos données personnelles. La présente politique décrit quelles informations nous collectons, comment nous les utilisons et vos droits à leur égard. En utilisant notre plateforme, vous acceptez les pratiques décrites ci-dessous.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {SECTIONS.map((section, i) => (
            <div
              key={i}
              className="dark:bg-[#0d1124] bg-white rounded-2xl border dark:border-white/10 border-[#00165F]/10 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-6 h-6 rounded-lg dark:bg-[#0097FC]/15 bg-[#0097FC]/10 flex items-center justify-center text-[#0097FC] text-xs font-black shrink-0">
                  {i + 1}
                </span>
                <h2 className="text-base font-black dark:text-white text-[#00165F]">
                  {section.title}
                </h2>
              </div>

              {section.isContact ? (
                <p className="dark:text-white/60 text-[#00165F]/60 text-sm leading-relaxed">
                  Pour toute question relative à vos données personnelles ou pour exercer vos droits, contactez notre équipe à{' '}
                  <a
                    href="mailto:support@skyplays.tech"
                    className="text-[#0097FC] font-semibold hover:underline"
                  >
                    support@skyplays.tech
                  </a>
                  . Nous nous engageons à vous répondre dans les meilleurs délais.
                </p>
              ) : (
                <p className="dark:text-white/60 text-[#00165F]/60 text-sm leading-relaxed">
                  {section.content}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold dark:border-white/15 border-[#00165F]/15 border dark:bg-white/5 bg-white dark:text-white/70 text-[#00165F]/70 hover:border-[#0097FC]/50 transition-colors"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
