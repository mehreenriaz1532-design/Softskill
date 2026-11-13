# Rahnuma – setup (about 25 minutes)

Stack: static site in `public/`, Vercel functions in `api/`, Supabase (login, database, file storage), Claude for the AI features.

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
| `ANTHROPIC_API_KEY` | key from console.anthropic.com |
| `ADMIN_CODE` | your secret admin code (12+ characters) |
| `AI_MODEL` | optional, default `claude-sonnet-5-5` |

Import the folder from GitHub (Framework preset: Other), add the variables, deploy.

## 3. Make yourself admin
Sign up on the live site, then in SQL Editor:
`update profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');`
Open Admin and enter your ADMIN_CODE. Five wrong codes lock the panel for 15 minutes.

## 4. First use
Admin → Settings: enter your JazzCash / EasyPaisa / Raast details. Admin → Courses & content: paste your raw material into the AI box. Admin → Live classes: paste a message with the Zoom link.

## For about 500 students
- Supabase free tier handles 500 accounts, but projects pause after a week of inactivity and storage is 1 GB. Keep lectures as YouTube (unlisted) or Vimeo links, and use Supabase Pro ($25/month) once you go live.
- Receipt checks cost a small fraction of a rupee each on Claude.
