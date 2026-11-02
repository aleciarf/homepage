# Homepage: Google sign-in on Cloudflare Pages

Upload these files into the root of your existing GitHub homepage repository, keeping its existing asset/ and assets/ folders:
- index.html (replaces the current HTML)
- functions/_middleware.js
- _routes.json
- build.mjs
- vendor/three.module.js (bundled Three.js renderer; preserve its MIT license header)

Cloudflare Pages Git deployment settings:
- Framework: None
- Build command: node build.mjs
- Build output directory: dist
- Root directory: repository root

Do not use a static-only GitHub Pages deployment for the sign-in version. Pages Functions must run. With this build, only the page and existing asset folders are copied into dist, not source code or setup files.

## Google configuration
Create or reuse a Google Cloud project. In Google Auth Platform, configure Branding and Audience, then create a Web application OAuth client under Clients. This uses only openid, email and profile; no Drive permission is requested.

Add this Authorized redirect URI, replacing the example with your production site:
https://YOUR-PROJECT.pages.dev/auth/callback

For a custom domain, use the custom domain instead and configure SITE_URL to match. Do not put the client secret in GitHub or the HTML. If your Google app is in testing mode, add the intended accounts as test users.

## Cloudflare environment settings
Add these in your Pages project's Variables and Secrets settings, then redeploy:

GOOGLE_CLIENT_ID: the Web application's OAuth client ID
GOOGLE_CLIENT_SECRET: its client secret (store as a secret)
SESSION_SECRET: a random secret at least 32 characters long (store as a secret). Generate locally with: openssl rand -hex 32
SITE_URL: the production HTTPS origin, e.g. https://YOUR-PROJECT.pages.dev
ALLOWED_EMAILS: optional comma-separated Google account emails. Set your own email here for a private personal homepage. If empty, any Google account with a verified email may sign in.

Use a new SESSION_SECRET only when you intend to invalidate every existing session. Authenticated sessions last seven days. Sign out clears this browser's cookie; it does not sign you out of Google.

## What this changes
- Removes the old password and its client-side gate completely.
- Google sign-in is checked by Cloudflare before the HTML and assets are served.
- Signed, HttpOnly, Secure cookies hold the session. Google tokens are used only on the server during login and are not stored in the HTML or browser storage.
- OAuth uses state and PKCE to bind the return to the login attempt.
- Account menu shows your name/email and Sign out.
- Existing bookmarks, notes, calendar, inventory and to-do features remain in the HTML. Google sign-in does not add Drive sync or replace the existing GitHub token/profile saving system. Data remains in the existing browser cache and GitHub profiles, not a separate database per Google account.
- Sign-in is unavailable until environment variables and the Google redirect URI are configured. The page fails closed with a setup message.
- Preview deployment origins redirect to SITE_URL to avoid incorrect OAuth callback domains.

## Privacy and repository visibility
Cloudflare authentication protects this Cloudflare deployment. A public GitHub repository, raw.githubusercontent.com URLs and an existing public GitHub Pages site remain public. Disable the old public GitHub Pages deployment and keep sensitive data out of a public repository if you need private resources. Do not commit credentials.

## Verification after deployment
1. Open the production URL in an incognito window: you should see Google sign-in.
2. Sign in with an allowed email: the homepage should load.
3. Check Account, then Sign out: you should return to sign-in.
4. Test a disallowed account if ALLOWED_EMAILS is configured.
5. Check your existing profiles and GitHub saves; export a backup before overwriting existing repository HTML.

This package was checked with mocked Google responses. Live OAuth requires your own client configuration and production domain.

## Island interface
This first island version uses original simple low-poly buildings and two cats. It is an isometric 3D scene, not the finished art from the reference site.
- Tap the ground to walk. Movement follows a grid route around buildings.
- Library opens Bookmarks; Files opens Inventory; Cottage opens Notes; Noticeboard opens To-do and Calendar.
- A second cat wanders automatically. Reduced-motion preference disables automatic wandering and walking bob.
- Classic view restores the previous layout with all its existing shortcut/profile/editing features.
- Google sign-in middleware and configuration are unchanged.
- WebGL is required for the island; tool buttons and Classic view remain available if it fails.
- Automated checks cover panel relocation/restoration and OAuth. A rendered browser/WebGL visual review was not available in this environment.

Island updates: panels overlay the stationary map with a reduced-motion-aware pop animation. Expanded woodland includes mushrooms. Sun, moon, ambient light and sky run on a synchronized 30-minute day, including elapsed time while the tab is inactive.

Latest package: full-viewport circular mushroom islands; original panels and dialogs overlay the stationary scene. Includes five animals, persistent graphics settings, live content summaries, and local/GitHub sync status. Keep your existing asset/assets folders when updating the repository. The 3D engine is embedded in index.html.
