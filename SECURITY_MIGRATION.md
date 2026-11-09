# GudangKita Security Migration

This branch replaces source-code passwords with Firebase Authentication and changes Firestore rules from public access to authenticated access.

## Before deploying

1. In the production Firebase project, enable Authentication > Sign-in method > Email/Password.
2. Create `office@gudangkita.internal` and `gudang@gudangkita.internal` as Firebase Authentication users.
3. Give each account a new strong password. Never commit passwords to GitHub.
4. Configure the Vercel environment variables shown in `.env.example`.
5. Deploy and test both accounts.
6. Only after authentication works, deploy the hardened `firestore.rules`.

Do not deploy the hardened Firestore rules before working Firebase Authentication accounts exist. Anonymous clients will be denied.

Phase 2 will add a server-side read-only API for ChatGPT with separate server authorization.
