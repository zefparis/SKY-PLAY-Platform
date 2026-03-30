'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Globe, AlertTriangle, Heart, Shield, Phone, Users, Lock } from 'lucide-react'

export default function ResponsibleGamingPage() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr')

  const content = {
    fr: {
      title: "Jeu Responsable",
      lastUpdate: "Dernière mise à jour : 30 mars 2026",
      backHome: "Retour à l'accueil",
      sections: [
        {
          icon: Heart,
          title: "1. Notre engagement",
          content: `SKY PLAY ENTERTAINMENT s'engage à promouvoir une pratique saine et responsable des défis gaming.

Nous croyons que le gaming doit rester un divertissement et une passion, jamais une source de stress ou de problèmes financiers.

Notre plateforme met en place des outils et des ressources pour vous aider à garder le contrôle de votre activité de jeu.`
        },
        {
          icon: AlertTriangle,
          title: "2. Rappels importants",
          content: `⚠️ **Les défis SKY PLAY impliquent de l'argent réel**
Ne misez jamais plus que ce que vous pouvez vous permettre de perdre sans affecter votre vie quotidienne.

⚠️ **Le gaming doit rester un divertissement**
Ce n'est pas une source de revenus principale ni une solution à des problèmes financiers.

⚠️ **Interdit aux mineurs**
La plateforme est strictement interdite aux personnes de moins de 18 ans.

⚠️ **Pas de garantie de gain**
Les résultats dépendent de vos compétences et de celles de vos adversaires. Il n'y a aucune garantie de gain.

⚠️ **Jouez sobre**
Ne jouez jamais sous l'influence de l'alcool, de drogues ou lorsque vous êtes émotionnellement perturbé.`
        },
        {
          icon: AlertTriangle,
          title: "3. Signes d'une pratique problématique",
          content: `Soyez attentif aux signes suivants qui peuvent indiquer un problème :

**Signes financiers :**
• Jouer avec de l'argent destiné à des besoins essentiels (loyer, nourriture, factures)
• Emprunter de l'argent pour jouer
• Essayer de "récupérer" des pertes en rejouant immédiatement
• Augmenter progressivement les mises pour ressentir la même excitation
• Mentir sur les montants dépensés

**Signes comportementaux :**
• Passer de plus en plus de temps sur la plateforme
• Négliger le travail, les études ou les responsabilités familiales
• S'isoler socialement pour jouer
• Devenir irritable ou anxieux quand on ne peut pas jouer
• Jouer pour échapper à des problèmes ou à des émotions négatives

**Signes émotionnels :**
• Se sentir coupable ou honteux après avoir joué
• Stress ou anxiété liés aux résultats des défis
• Obsession constante par le jeu (y penser tout le temps)
• Difficulté à arrêter même quand on le souhaite
• Minimiser ou cacher son activité de jeu aux proches

**Si vous reconnaissez plusieurs de ces signes, il est temps de demander de l'aide.**`
        },
        {
          icon: Shield,
          title: "4. Outils de contrôle disponibles",
          content: `SKY PLAY met à votre disposition plusieurs outils pour vous aider à garder le contrôle :

**Limites de dépôt :**
• Définissez une limite quotidienne de dépôt
• Définissez une limite hebdomadaire de dépôt
• Définissez une limite mensuelle de dépôt
Une fois atteinte, vous ne pourrez plus déposer de fonds jusqu'à la période suivante.

**Auto-exclusion temporaire :**
Vous pouvez vous auto-exclure de la plateforme pour une durée déterminée :
• 1 semaine
• 1 mois
• 3 mois
• 6 mois
Pendant cette période, votre compte sera bloqué et vous ne pourrez pas y accéder.

**Fermeture définitive du compte :**
Vous pouvez demander la fermeture définitive de votre compte à tout moment. Cette action est irréversible.

**Historique détaillé :**
Consultez à tout moment l'historique complet de vos :
• Dépôts et retraits
• Défis joués
• Gains et pertes
• Temps passé sur la plateforme

**Pour activer ces outils :**
Contactez notre équipe support à support@skyplay.cm en précisant l'outil souhaité. Nous traiterons votre demande sous 24 heures.`
        },
        {
          icon: Phone,
          title: "5. Ressources d'aide au Cameroun",
          content: `Si vous pensez avoir un problème avec le jeu, plusieurs ressources sont disponibles :

**Parlez-en :**
• Confiez-vous à un proche de confiance (famille, ami)
• Ne restez pas seul face au problème
• L'entourage peut souvent aider à prendre du recul

**Aide professionnelle :**
• Consultez un psychologue ou un psychiatre
• Centres de santé mentale disponibles dans les grandes villes (Douala, Yaoundé)
• Associations camerounaises de santé mentale

**Support SKY PLAY :**
Notre équipe est à votre écoute pour :
• Activer des limites de jeu
• Mettre en place une auto-exclusion
• Fermer votre compte
• Vous orienter vers des ressources d'aide

**Contact :**
Email : support@skyplay.cm
Nous traitons toutes les demandes avec confidentialité et bienveillance.`
        },
        {
          icon: Users,
          title: "6. Conseils pour un jeu sain",
          content: `**Fixez-vous des limites AVANT de jouer :**
• Décidez à l'avance combien vous êtes prêt à dépenser
• Décidez combien de temps vous allez jouer
• Respectez ces limites, même si vous gagnez

**Ne jouez jamais pour :**
• Résoudre des problèmes financiers
• Échapper à des émotions négatives
• Récupérer des pertes précédentes
• Impressionner les autres

**Gardez un équilibre :**
• Le gaming ne doit pas empiéter sur votre vie professionnelle
• Maintenez vos relations sociales et familiales
• Pratiquez d'autres activités et hobbies
• Dormez suffisamment

**Jouez pour le plaisir :**
• Considérez l'argent misé comme un coût de divertissement
• Ne comptez jamais sur les gains pour vos dépenses
• Arrêtez si vous ne prenez plus de plaisir
• Faites des pauses régulières

**Restez lucide :**
• Ne jouez pas sous l'influence de substances
• Ne jouez pas quand vous êtes fatigué ou stressé
• Prenez du recul sur vos résultats
• Acceptez les pertes comme faisant partie du jeu`
        },
        {
          icon: Lock,
          title: "7. Protection des mineurs",
          content: `**Tolérance zéro :**
SKY PLAY applique une politique de tolérance zéro concernant les mineurs.

**Vérification d'âge :**
• Vérification obligatoire à l'inscription
• Contrôles aléatoires sur les comptes existants
• Documents d'identité requis en cas de doute

**Signalement :**
Si vous découvrez qu'un mineur utilise la plateforme :
• Signalez-le immédiatement à support@skyplay.cm
• Le compte sera fermé dans les 24 heures
• Les parents/tuteurs seront contactés

**Responsabilité parentale :**
Parents, surveillez l'activité en ligne de vos enfants :
• Vérifiez les applications installées
• Contrôlez les transactions bancaires
• Dialoguez sur les risques du jeu d'argent
• Donnez l'exemple d'une pratique responsable`
        },
        {
          icon: Phone,
          title: "8. Contact et assistance",
          content: `**Pour toute demande liée au jeu responsable :**

**Email :** support@skyplay.cm
**Objet :** Jeu Responsable

**Nous pouvons vous aider à :**
• Mettre en place des limites de dépôt
• Activer une auto-exclusion temporaire
• Fermer définitivement votre compte
• Accéder à votre historique complet
• Vous orienter vers des ressources d'aide

**Délai de réponse :** 24 heures maximum

**Confidentialité :**
Toutes vos demandes sont traitées en toute confidentialité. Nous ne jugeons pas, nous aidons.

**Rappel important :**
Demander de l'aide est un signe de force, pas de faiblesse. N'hésitez pas à nous contacter si vous avez le moindre doute sur votre pratique de jeu.`
        },
        {
          icon: Heart,
          title: "9. Notre promesse",
          content: `SKY PLAY ENTERTAINMENT s'engage à :

✓ Promouvoir une pratique responsable du gaming
✓ Fournir des outils de contrôle efficaces
✓ Répondre rapidement aux demandes d'aide
✓ Protéger les mineurs avec vigilance
✓ Former notre équipe à la détection des comportements à risque
✓ Améliorer continuellement nos mesures de protection
✓ Collaborer avec les autorités et associations compétentes

**Le jeu doit rester un plaisir.**
Si ce n'est plus le cas, nous sommes là pour vous aider à reprendre le contrôle.

**Jouez pour le fun, pas pour l'argent.**
**Jouez avec votre tête, pas avec vos émotions.**
**Jouez dans vos moyens, pas au-delà.**`
        }
      ]
    },
    en: {
      title: "Responsible Gaming",
      lastUpdate: "Last updated: March 30, 2026",
      backHome: "Back to home",
      sections: [
        {
          icon: Heart,
          title: "1. Our Commitment",
          content: `SKY PLAY ENTERTAINMENT is committed to promoting healthy and responsible gaming challenge practices.

We believe that gaming should remain entertainment and passion, never a source of stress or financial problems.

Our platform implements tools and resources to help you maintain control of your gaming activity.`
        },
        {
          icon: AlertTriangle,
          title: "2. Important Reminders",
          content: `⚠️ **SKY PLAY challenges involve real money**
Never bet more than you can afford to lose without affecting your daily life.

⚠️ **Gaming should remain entertainment**
It is not a primary source of income or a solution to financial problems.

⚠️ **Prohibited for minors**
The platform is strictly prohibited for persons under 18 years of age.

⚠️ **No guarantee of winnings**
Results depend on your skills and those of your opponents. There is no guarantee of winnings.

⚠️ **Play sober**
Never play under the influence of alcohol, drugs or when emotionally disturbed.`
        },
        {
          icon: AlertTriangle,
          title: "3. Signs of Problematic Practice",
          content: `Be attentive to the following signs that may indicate a problem:

**Financial signs:**
• Playing with money intended for essential needs (rent, food, bills)
• Borrowing money to play
• Trying to "recover" losses by playing again immediately
• Gradually increasing stakes to feel the same excitement
• Lying about amounts spent

**Behavioral signs:**
• Spending more and more time on the platform
• Neglecting work, studies or family responsibilities
• Social isolation to play
• Becoming irritable or anxious when unable to play
• Playing to escape problems or negative emotions

**Emotional signs:**
• Feeling guilty or ashamed after playing
• Stress or anxiety related to challenge results
• Constant obsession with gaming (thinking about it all the time)
• Difficulty stopping even when desired
• Minimizing or hiding gaming activity from loved ones

**If you recognize several of these signs, it's time to seek help.**`
        },
        {
          icon: Shield,
          title: "4. Available Control Tools",
          content: `SKY PLAY provides several tools to help you maintain control:

**Deposit limits:**
• Set a daily deposit limit
• Set a weekly deposit limit
• Set a monthly deposit limit
Once reached, you will not be able to deposit funds until the next period.

**Temporary self-exclusion:**
You can self-exclude from the platform for a set period:
• 1 week
• 1 month
• 3 months
• 6 months
During this period, your account will be blocked and you will not be able to access it.

**Permanent account closure:**
You can request permanent closure of your account at any time. This action is irreversible.

**Detailed history:**
Consult at any time the complete history of your:
• Deposits and withdrawals
• Challenges played
• Wins and losses
• Time spent on the platform

**To activate these tools:**
Contact our support team at support@skyplay.cm specifying the desired tool. We will process your request within 24 hours.`
        },
        {
          icon: Phone,
          title: "5. Help Resources in Cameroon",
          content: `If you think you have a gaming problem, several resources are available:

**Talk about it:**
• Confide in a trusted person (family, friend)
• Don't face the problem alone
• Those around you can often help gain perspective

**Professional help:**
• Consult a psychologist or psychiatrist
• Mental health centers available in major cities (Douala, Yaoundé)
• Cameroonian mental health associations

**SKY PLAY support:**
Our team is here to listen to:
• Activate gaming limits
• Set up self-exclusion
• Close your account
• Guide you to help resources

**Contact:**
Email: support@skyplay.cm
We handle all requests with confidentiality and kindness.`
        },
        {
          icon: Users,
          title: "6. Tips for Healthy Gaming",
          content: `**Set limits BEFORE playing:**
• Decide in advance how much you're willing to spend
• Decide how long you'll play
• Respect these limits, even if you win

**Never play to:**
• Solve financial problems
• Escape negative emotions
• Recover previous losses
• Impress others

**Maintain balance:**
• Gaming should not encroach on your professional life
• Maintain your social and family relationships
• Practice other activities and hobbies
• Get enough sleep

**Play for fun:**
• Consider money bet as entertainment cost
• Never count on winnings for your expenses
• Stop if you're no longer having fun
• Take regular breaks

**Stay lucid:**
• Don't play under the influence of substances
• Don't play when tired or stressed
• Take perspective on your results
• Accept losses as part of the game`
        },
        {
          icon: Lock,
          title: "7. Protection of Minors",
          content: `**Zero tolerance:**
SKY PLAY applies a zero tolerance policy regarding minors.

**Age verification:**
• Mandatory verification at registration
• Random checks on existing accounts
• Identity documents required in case of doubt

**Reporting:**
If you discover a minor using the platform:
• Report it immediately to support@skyplay.cm
• The account will be closed within 24 hours
• Parents/guardians will be contacted

**Parental responsibility:**
Parents, monitor your children's online activity:
• Check installed applications
• Control bank transactions
• Discuss the risks of gambling
• Set an example of responsible practice`
        },
        {
          icon: Phone,
          title: "8. Contact and Assistance",
          content: `**For any request related to responsible gaming:**

**Email:** support@skyplay.cm
**Subject:** Responsible Gaming

**We can help you:**
• Set up deposit limits
• Activate temporary self-exclusion
• Permanently close your account
• Access your complete history
• Guide you to help resources

**Response time:** 24 hours maximum

**Confidentiality:**
All your requests are handled in complete confidentiality. We don't judge, we help.

**Important reminder:**
Asking for help is a sign of strength, not weakness. Don't hesitate to contact us if you have any doubt about your gaming practice.`
        },
        {
          icon: Heart,
          title: "9. Our Promise",
          content: `SKY PLAY ENTERTAINMENT commits to:

✓ Promote responsible gaming practice
✓ Provide effective control tools
✓ Respond quickly to help requests
✓ Vigilantly protect minors
✓ Train our team in detecting at-risk behaviors
✓ Continuously improve our protection measures
✓ Collaborate with competent authorities and associations

**Gaming should remain a pleasure.**
If it's no longer the case, we're here to help you regain control.

**Play for fun, not for money.**
**Play with your head, not with your emotions.**
**Play within your means, not beyond.**`
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
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
              <Heart className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#0097FC] to-[#00d4ff] bg-clip-text text-transparent">
                {t.title}
              </h1>
              <p className="text-white/60 text-sm mt-1">{t.lastUpdate}</p>
            </div>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mt-6">
            <p className="text-yellow-200 text-sm leading-relaxed">
              {lang === 'fr' 
                ? "⚠️ Si vous pensez avoir un problème avec le jeu, contactez-nous immédiatement à support@skyplay.cm. Nous sommes là pour vous aider."
                : "⚠️ If you think you have a gaming problem, contact us immediately at support@skyplay.cm. We are here to help you."
              }
            </p>
          </div>
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

        {/* Emergency Contact Box */}
        <div className="mt-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/30 rounded-2xl p-8 text-center">
          <Phone className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">
            {lang === 'fr' ? 'Besoin d\'aide ?' : 'Need help?'}
          </h3>
          <p className="text-white/80 mb-4">
            {lang === 'fr' 
              ? 'Notre équipe est disponible pour vous accompagner'
              : 'Our team is available to support you'
            }
          </p>
          <a 
            href="mailto:support@skyplay.cm"
            className="inline-block px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
          >
            support@skyplay.cm
          </a>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/60 text-sm">
          <p>© 2026 SKY PLAY ENTERTAINMENT - Cameroun</p>
          <p className="mt-2">{lang === 'fr' ? 'Jouez responsable' : 'Play responsibly'}</p>
        </div>
      </main>
    </div>
  )
}
