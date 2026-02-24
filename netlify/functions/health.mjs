export default async () => {
  const envCheck = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    BREVO_API_KEY: !!process.env.BREVO_API_KEY,
    UNSUBSCRIBE_SECRET: !!process.env.UNSUBSCRIBE_SECRET,
    CRM_OWNER_ID: !!process.env.CRM_OWNER_ID,
  };

  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: envCheck,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
