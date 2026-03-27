# Auth Cognito - Checklist de mise en œuvre

- [ ] Analyser les besoins et la structure du projet
- [ ] Installer amazon-cognito-identity-js dans apps/web
- [ ] Créer le store Zustand typé (AuthState, AuthStep, méthodes)
- [ ] Intégrer Cognito dans le store (signup, confirm, login, logout, forgot, reset)
- [ ] Gérer le stockage et la suppression des tokens dans Zustand
- [ ] Créer les composants UI modaux pour chaque flow (signup, confirm, login, forgot, reset)
- [ ] Gérer la navigation et les transitions entre les étapes (UX fluide, pas de reload)
- [ ] Gérer la compatibilité mobile et desktop (responsive, accessibilité)
- [ ] Gérer la gestion complète des erreurs (Cognito, réseau, validation)
- [ ] Tester tous les flows (signup, confirm, login, logout, forgot, reset)
- [ ] Vérifier la conformité avec les contraintes (pas de mot de passe backend, Cognito source de vérité, etc.)