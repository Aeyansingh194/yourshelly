import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const VAPI_PUBLIC_KEY = Deno.env.get("VAPI_PUBLIC_KEY");
    if (!VAPI_PUBLIC_KEY) throw new Error("VAPI_PUBLIC_KEY is not configured");

    const VAPI_ASSISTANT_ID = Deno.env.get("VAPI_ASSISTANT_ID");
    if (!VAPI_ASSISTANT_ID) throw new Error("VAPI_ASSISTANT_ID is not configured");

    return new Response(JSON.stringify({ publicKey: VAPI_PUBLIC_KEY, assistantId: VAPI_ASSISTANT_ID }), {
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
