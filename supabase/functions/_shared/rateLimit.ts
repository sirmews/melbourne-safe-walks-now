
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = {
  'get-reports': 30,
  'create-report': 5,
  'get-report-details': 20
};

export async function checkRateLimit(
  request: Request, 
  endpoint: string
): Promise<{ allowed: boolean; remaining?: number }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1';

  const windowStart = new Date();
  windowStart.setMinutes(Math.floor(windowStart.getMinutes() / RATE_LIMIT_WINDOW_MINUTES) * RATE_LIMIT_WINDOW_MINUTES);
  windowStart.setSeconds(0);
  windowStart.setMilliseconds(0);

  // Check current usage
  const { data: currentLimits, error } = await supabase
    .from('api_rate_limits')
    .select('request_count')
    .eq('ip_address', clientIP)
    .eq('endpoint', endpoint)
    .eq('window_start', windowStart.toISOString())
    .single();

  const maxRequests = MAX_REQUESTS_PER_WINDOW[endpoint] || 10;
  const currentCount = currentLimits?.request_count || 0;

  if (currentCount >= maxRequests) {
    return { allowed: false };
  }

  // Update or create rate limit record
  const { error: upsertError } = await supabase
    .from('api_rate_limits')
    .upsert({
      ip_address: clientIP,
      endpoint,
      window_start: windowStart.toISOString(),
      request_count: currentCount + 1
    }, {
      onConflict: 'ip_address,endpoint,window_start'
    });

  if (upsertError) {
    console.error('Rate limit update error:', upsertError);
  }

  return { 
    allowed: true, 
    remaining: maxRequests - (currentCount + 1) 
  };
}
