import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Official Pikud HaOref API endpoint
const OREF_API_URL = 'https://www.oref.org.il/WarningMessages/alert/alerts.json';

// Time to reach shelter by area (in seconds)
const AREA_COUNTDOWN: Record<string, number> = {
  'עוטף עזה': 15,
  'לכיש': 30,
  'מערב לכיש': 30,
  'שפלת יהודה': 45,
  'אשקלון': 30,
  'שדרות, נתיבות': 15,
  'באר שבע': 60,
  'תל אביב': 90,
  'גוש דן': 90,
  'המרכז': 90,
  'חיפה': 60,
  'הצפון': 60,
  'ירושלים': 90,
  'default': 90
};

interface OrefAlert {
  id: string;
  cat: string;
  title: string;
  data: string[];
  desc: string;
}

interface FormattedAlert {
  id: string;
  title: string;
  cities: string[];
  time: string;
  countdown: number;
  category: string;
  description: string;
}

function getCountdown(cities: string[]): number {
  // Find the minimum countdown time for all cities in the alert
  let minCountdown = AREA_COUNTDOWN['default'];
  
  for (const city of cities) {
    for (const [area, countdown] of Object.entries(AREA_COUNTDOWN)) {
      if (city.includes(area) || area.includes(city)) {
        minCountdown = Math.min(minCountdown, countdown);
      }
    }
  }
  
  return minCountdown;
}

function formatAlert(alert: OrefAlert): FormattedAlert {
  return {
    id: alert.id || crypto.randomUUID(),
    title: alert.title || 'התראה',
    cities: alert.data || [],
    time: new Date().toLocaleTimeString('he-IL'),
    countdown: getCountdown(alert.data || []),
    category: alert.cat || 'unknown',
    description: alert.desc || ''
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching alerts from Pikud HaOref API...');
    
    // Fetch from the official Pikud HaOref API
    // The API requires specific headers to work properly
    const response = await fetch(OREF_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'he-IL,he;q=0.9',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.oref.org.il/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      // Return empty alerts on error - the system is probably just quiet
      return new Response(
        JSON.stringify({ alerts: [], lastUpdate: new Date().toISOString() }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const text = await response.text();
    console.log('Raw response:', text.substring(0, 200));

    // Handle empty response (no active alerts)
    if (!text || text.trim() === '' || text.trim() === '[]') {
      console.log('No active alerts');
      return new Response(
        JSON.stringify({ alerts: [], lastUpdate: new Date().toISOString() }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Parse the JSON response
    let alertsData: OrefAlert | OrefAlert[];
    try {
      alertsData = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ alerts: [], lastUpdate: new Date().toISOString() }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Handle both single alert and array of alerts
    const alertsArray = Array.isArray(alertsData) ? alertsData : [alertsData];
    
    // Format alerts for the app
    const formattedAlerts = alertsArray.map(formatAlert);
    
    console.log('Formatted alerts count:', formattedAlerts.length);

    return new Response(
      JSON.stringify({ 
        alerts: formattedAlerts, 
        lastUpdate: new Date().toISOString() 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error fetching alerts:', error);
    
    // Return empty alerts on error - don't crash the app
    return new Response(
      JSON.stringify({ 
        alerts: [], 
        lastUpdate: new Date().toISOString(),
        error: 'Failed to fetch alerts'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  }
});
