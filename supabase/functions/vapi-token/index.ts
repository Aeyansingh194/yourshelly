import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const VAPI_API_KEY = Deno.env.get("VAPI_API_KEY");
    if (!VAPI_API_KEY) throw new Error("VAPI_API_KEY is not configured");

    const VAPI_ASSISTANT_ID = Deno.env.get("VAPI_ASSISTANT_ID");
    if (!VAPI_ASSISTANT_ID) throw new Error("VAPI_ASSISTANT_ID is not configured");

    // Create a Vapi web call using the pre-created assistant
    const response = await fetch("https://api.vapi.ai/call/web", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId: VAPI_ASSISTANT_ID,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vapi error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to create Vapi call", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify({ webCallUrl: data.webCallUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("vapi error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
