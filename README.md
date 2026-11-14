# softskill – setup (about 25 minutes)

Stack: static site in `public/`, Vercel functions in `api/`, Supabase (login, database, file storage), Groq for the AI features.

## 1. Supabase
1. Create a project at supabase.com.
2. SQL Editor → run these files in order: `supabase/schema.sql`, then `migration-live.sql`, then `migration-ai.sql`.
3. Authentication → URL Configuration: set **Site URL** to your Vercel URL and add it to **Redirect URLs**.
4. Authentication → SMTP: add your own SMTP (Resend, Brevo…). The built-in sender allows only a few emails per hour, which will not survive 500 sign-ups.
5. Project Settings → API: copy the Project URL, the **anon** key and the **service_role** key.

## 2. Vercel (Settings → Environment Variables)
| Name | Value |
|---|---|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (server only, never share it) |
| `GROQ_API_KEY` | key from console.groq.com |
| `ADMIN_CODE` | your secret admin code (12+ characters) |
| `GROQ_MODEL` | optional, default `qwen/qwen3.8-27b` (must support images; check console.groq.com/docs/models if Groq retires it) |

Import the folder from GitHub (Framework preset: Other), add the variables, deploy.

## 3. Make yourself admin
Sign up on the live site, then in SQL Editor:
`update profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');`
Open Admin and enter your ADMIN_CODE. Five wrong codes lock the panel for 15 minutes.

## 4. First use
Admin → Settings: enter your JazzCash / EasyPaisa / Raast details. Admin → Courses & content: paste your raw material into the AI box. Admin → Live classes: paste a message with the Zoom link.

## For about 500 students
- Supabase free tier handles 500 accounts, but projects pause after a week of inactivity and storage is 1 GB. Keep lectures as YouTube (unlisted) or Vimeo links, and use Supabase Pro ($25/month) once you go live.
- Receipt checks cost a small fraction of a rupee each.

## Soft-skills features (migration-skills.sql)
Run `supabase/migration-skills.sql` after the other three SQL files. It adds lesson Q&A, journal, roleplay scenarios, pitch coach history, certificates and practice rooms.
New optional Vercel variable: `GROQ_STT_MODEL` (default `whisper-large-v3-turbo`) for voice transcription in the pitch coach.

## Security hardening and email limit
Run `supabase/migration-security.sql` once. For sign-up emails, set up your own SMTP (Supabase → Authentication → Emails → SMTP Settings); the built-in sender only allows a couple of emails per hour.

## LMS additions (migration-lms.sql)
Run `supabase/migration-lms.sql` once. New public files: `public/lms.js`, `manifest.webmanifest`, `sw.js`, two icons. Admin API calls now go through one function (`api/admin.js`) so the project stays under Vercel's 12-function free limit.

New Vercel variables for emails (payment decisions and daily live-class reminders):
`SMTP_HOST` (smtp.gmail.com), `SMTP_PORT` (465), `SMTP_USER` (your Gmail), `SMTP_PASS` (the Gmail app password), `SITE_URL` (your https website address, no trailing slash), `CRON_SECRET` (any long random text; Vercel uses it to call the reminder job).

The policy pages in `public/lms.js` (terms, privacy, refund, FAQ) are templates. Read them and change the wording to match your real business before launch.

## Admin controls (migration-admin.sql)
Run `supabase/migration-admin.sql` once. It adds editable Help pages, manual access grants, certificate revoking and the Students overview.
New admin tabs: Students, Moderation, Help pages.
