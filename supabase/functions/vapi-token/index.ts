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

    // Create a Vapi web call
    const response = await fetch("https://api.vapi.ai/call/web", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistant: {
          firstMessage: "Hi! I'm Panda, your mental wellness companion. How are you feeling today?",
          model: {
            provider: "google",
            model: "gemini-2.0-flash",
            messages: [
              {
                role: "system",
                content: "You are Panda, a warm and empathetic AI mental wellness companion. You speak with kindness and emotional intelligence. You are NOT a licensed therapist. Never diagnose or prescribe. For severe distress, gently suggest professional help. Keep responses concise, supportive, and actionable. Use calming language."
              }
            ],
          },
          voice: {
            provider: "11labs",
            voiceId: "pFZP5JQG7iQjIQuC4Bku",
          },
          transcriber: {
            provider: "deepgram",
            model: "nova-3",
            language: "en",
          },
        },
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
