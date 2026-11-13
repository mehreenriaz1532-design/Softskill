// Serves the public Supabase settings from Vercel environment variables.
// The anon key is designed to be public; Row Level Security in schema.sql protects the data.
// Never put the service_role key in this project.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json({
    url: process.env.SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY
  });
};
