
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rateLimit.ts'

Deno.serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check rate limit
    const rateLimitResult = await checkRateLimit(req, 'get-reports');
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { sw_lat, sw_lng, ne_lat, ne_lng } = await req.json();

    // Validate input
    if (!sw_lat || !sw_lng || !ne_lat || !ne_lng) {
      return new Response(JSON.stringify({ error: 'Missing required coordinates' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call the database function
    const { data, error } = await supabase.rpc('get_reports_in_bounds', {
      sw_lat: parseFloat(sw_lat),
      sw_lng: parseFloat(sw_lng),
      ne_lat: parseFloat(ne_lat),
      ne_lng: parseFloat(ne_lng)
    });

    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
