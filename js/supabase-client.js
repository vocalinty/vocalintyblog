

(function () {
  if (!window.supabase) {
    console.error('Supabase SDK not loaded. Add the CDN script tag before supabase-client.js')
    return
  }
  if (!window.VOCALINTY_CONFIG) {
    console.error('VOCALINTY_CONFIG not found. Load config.js before supabase-client.js')
    return
  }

  const { supabaseUrl, supabaseKey } = window.VOCALINTY_CONFIG
  window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
})()
