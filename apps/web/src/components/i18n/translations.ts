export type SupportedLang = 'en' | 'fr'

export type Translations = Record<string, string>

/**
 * Simple flat-key dictionnaires (sans dépendance externe).
 * Convention: clés en dot-notation (ex: "nav.dashboard").
 */
export const translations: Record<SupportedLang, Translations> = {
  en: {
    // Navbar
    'nav.dashboard': 'Dashboard',
    'nav.challenges': 'Challenges',
    'nav.leaderboard': 'Leaderboard',
    'nav.chat': 'Chat',
    'nav.wallet': 'Wallet',
    'nav.profile': 'Profile',
    'nav.lang.en': 'EN',
    'nav.lang.fr': 'FR',

    // Home / Hero
    'hero.tagline': 'The Ultimate Competitive Gaming Platform',
    'hero.subtitle': 'Join challenges, compete with the best players, and win real prizes',
    'hero.cta.joinChallenge': 'Join a Challenge',
    'hero.cta.viewDashboard': 'View Dashboard',
    'hero.feature.compete.title': 'Compete',
    'hero.feature.compete.desc': 'Join competitive challenges',
    'hero.feature.play.title': 'Play',
    'hero.feature.play.desc': 'Multiple games supported',
    'hero.feature.win.title': 'Win',
    'hero.feature.win.desc': 'Earn real prizes',

    // Home cards
    'home.card.challenges.title': 'Challenges',
    'home.card.challenges.desc': 'Create and join competitive challenges.',
    'home.card.wallet.title': 'Wallet',
    'home.card.wallet.desc': 'Manage deposits, winnings and withdrawals.',
    'home.card.dashboard.title': 'Dashboard',
    'home.card.dashboard.desc': 'Track your matches, stats and performance.',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.stats.totalWins': 'Total Wins',
    'dashboard.stats.activeChallenges': 'Active Challenges',
    'dashboard.stats.winRate': 'Win Rate',
    'dashboard.section.activeChallenges': 'Active Challenges',
    'dashboard.section.recentMatches': 'Recent Matches',
    'dashboard.match.ago': '2 hours ago',
    'dashboard.match.won': 'Won',

    // Leaderboard
    'leaderboard.title': 'Leaderboard',
    'leaderboard.subtitle': 'Top players on SKY PLAY',
    'leaderboard.topPlayer': 'Top Player',
    'leaderboard.highestEarnings': 'Highest Earnings',
    'leaderboard.thisMonth': 'This Month',
    'leaderboard.activePlayers': 'Active Players',
    'leaderboard.competingNow': 'Competing Now',
    'leaderboard.wins': 'Wins',

    // Wallet
    'wallet.title': 'Wallet',
  },
  fr: {
    // Navbar
    'nav.dashboard': 'Tableau de bord',
    'nav.challenges': 'Défis',
    'nav.leaderboard': 'Classement',
    'nav.chat': 'Chat',
    'nav.wallet': 'Portefeuille',
    'nav.profile': 'Profil',
    'nav.lang.en': 'EN',
    'nav.lang.fr': 'FR',

    // Home / Hero
    'hero.tagline': 'La plateforme ultime de gaming compétitif',
    'hero.subtitle': "Participe à des défis, affronte les meilleurs joueurs et gagne de vrais lots",
    'hero.cta.joinChallenge': 'Rejoindre un défi',
    'hero.cta.viewDashboard': 'Voir le tableau de bord',
    'hero.feature.compete.title': 'Compétition',
    'hero.feature.compete.desc': 'Participe à des défis compétitifs',
    'hero.feature.play.title': 'Jouer',
    'hero.feature.play.desc': 'Plusieurs jeux supportés',
    'hero.feature.win.title': 'Gagner',
    'hero.feature.win.desc': 'Gagne de vrais lots',

    // Home cards
    'home.card.challenges.title': 'Défis',
    'home.card.challenges.desc': 'Crée et rejoins des défis compétitifs.',
    'home.card.wallet.title': 'Portefeuille',
    'home.card.wallet.desc': 'Gère tes dépôts, gains et retraits.',
    'home.card.dashboard.title': 'Tableau de bord',
    'home.card.dashboard.desc': 'Suis tes matchs, stats et performances.',

    // Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.stats.totalWins': 'Victoires',
    'dashboard.stats.activeChallenges': 'Défis actifs',
    'dashboard.stats.winRate': 'Taux de victoire',
    'dashboard.section.activeChallenges': 'Défis actifs',
    'dashboard.section.recentMatches': 'Matchs récents',
    'dashboard.match.ago': 'il y a 2 heures',
    'dashboard.match.won': 'Gagné',

    // Leaderboard
    'leaderboard.title': 'Classement',
    'leaderboard.subtitle': 'Meilleurs joueurs sur SKY PLAY',
    'leaderboard.topPlayer': 'Meilleur joueur',
    'leaderboard.highestEarnings': 'Gains max',
    'leaderboard.thisMonth': 'Ce mois-ci',
    'leaderboard.activePlayers': 'Joueurs actifs',
    'leaderboard.competingNow': 'En compétition',
    'leaderboard.wins': 'Victoires',

    // Wallet
    'wallet.title': 'Portefeuille',
  },
}
