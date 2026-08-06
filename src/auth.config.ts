import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

/**
 * Auth.js (NextAuth v5) configuration for Google Workspace SSO into the Payload admin panel.
 *
 * Sign-in is locked to the ternary.solutions Workspace. The `hd` authorization param is only a
 * hint to Google's account chooser and is trivially bypassable, so the real gate is the `signIn`
 * callback below, which requires a verified email AND the `hd` claim (present only on Workspace
 * accounts). Returning false there blocks both login and user auto-provisioning.
 *
 * NOTE: payload-authjs disables the local email/password strategy by default, so this is the ONLY
 * way into the admin. Because any verified Workspace account would otherwise auto-provision, two
 * controls narrow that: (1) optional AUTH_ALLOWED_EMAILS allowlist below; (2) new users land as
 * role 'editor' (see the users collection) — promote to 'admin' manually.
 *
 * Auth.js v5 auto-reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET, so they are not passed explicitly.
 * Setup: docs/claude/google-admin-sso.md.
 */
const ALLOWED_HD = 'ternary.solutions'

// Optional explicit allowlist. If AUTH_ALLOWED_EMAILS is set (comma-separated), ONLY those emails
// may sign in (and auto-provision). If unset, any verified ternary.solutions Workspace account may.
const ALLOWED_EMAILS = (process.env.AUTH_ALLOWED_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)

export const authConfig: NextAuthConfig = {
  // Auth.js v5 requires a signing secret and normally auto-reads AUTH_SECRET. It is not otherwise
  // set in this project (Payload runs off PAYLOAD_SECRET), so without this every /admin request
  // throws `MissingSecret` and the admin login is dead. Prefer an explicit AUTH_SECRET when present,
  // else reuse PAYLOAD_SECRET — always defined, since Payload can't boot without it.
  secret: process.env.AUTH_SECRET || process.env.PAYLOAD_SECRET,
  providers: googleConfigured
    ? [
        Google({
          // Link the Google identity to a pre-existing Payload user with the same email instead of
          // throwing OAuthAccountNotLinked. Normally "dangerous" (an unverified-email provider could
          // be used to hijack an account), but safe here: Google verifies email ownership and the
          // signIn callback below hard-gates on email_verified + hd === ternary.solutions, so the
          // email is guaranteed to belong to the Workspace user.
          allowDangerousEmailAccountLinking: true,
          authorization: {
            params: {
              hd: ALLOWED_HD,
              prompt: 'select_account',
            },
          },
          // Maps the Google profile into the Payload `users` doc on first sign-in. Auth.js does
          // not re-run this after the first login (see the runbook for refreshing on each login).
          profile(profile) {
            return {
              id: profile.sub,
              name: profile.name,
              email: profile.email,
              image: profile.picture,
            }
          },
        }),
      ]
    : [],
  callbacks: {
    // The actual domain gate — `hd` param above is only a UI hint.
    signIn({ account, profile }) {
      if (account?.provider !== 'google') return false
      const p = profile as { email_verified?: boolean; hd?: string; email?: string }
      const email = p.email?.toLowerCase()
      const workspaceOk = p.email_verified === true && p.hd === ALLOWED_HD && Boolean(email?.endsWith(`@${ALLOWED_HD}`))
      if (!workspaceOk) return false
      // If an allowlist is configured, the email must be on it; otherwise any Workspace account is ok.
      return ALLOWED_EMAILS.length === 0 || (Boolean(email) && ALLOWED_EMAILS.includes(email!))
    },
  },
}
