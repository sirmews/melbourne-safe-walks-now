
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
    const rateLimitResult = await checkRateLimit(req, 'create-report');
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. You can only create 5 reports per 5 minutes.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { title, description, category, severity, lat, lng } = await req.json();

    // Validate input
    if (!title || !category || !lat || !lng) {
      return new Response(JSON.stringify({ error: 'Missing required fields: title, category, lat, lng' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create the safety report
    const { data, error } = await supabase
      .from('safety_reports')
      .insert({
        title,
        description: description || null,
        category,
        severity: severity || 'medium',
        location: `POINT(${lng} ${lat})`,
        user_id: null // Anonymous reports
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0'
      }
    });

  } catch (error) {
    console.error('Error creating report:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
