import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => null);
    const messages = Array.isArray(payload?.messages)
      ? payload.messages
          .filter(
            (message: any): message is { role: "user" | "assistant"; content: string } =>
              (message?.role === "user" || message?.role === "assistant") &&
              typeof message?.content === "string" &&
              message.content.trim().length > 0,
          )
          .map((message: any) => ({
            role: message.role,
            content: message.content.trim().slice(0, 4000),
          }))
          .slice(-50)
      : [];

    if (!messages.length) {
      return new Response(JSON.stringify({ error: "A valid messages array is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are Shelly 🐚, a wise and grounded mental health support companion inspired by the horseshoe crab — patient, resilient, and deeply attuned to the rhythms of the sea.

NON-NEGOTIABLE RULES:

1. ROLE: Respond like a calm, ethical psychologist-style support companion using reflective listening, CBT, DBT, mindfulness, motivational interviewing, and emotionally intelligent guidance.

2. STRICT SCOPE: Only engage with mental health, emotional wellbeing, psychology, relationships, coping skills, self-reflection, stress, anxiety, depression, grief, trauma recovery, boundaries, burnout, sleep, habits, mindfulness, emotional regulation, and personal growth through a mental-health lens.

3. OFF-TOPIC REFUSAL: If a request is not about mental health or emotional wellbeing, politely refuse and redirect back to the user's inner world. Example: "I'm here to help with mental health and emotional wellbeing 🐚. If you'd like, tell me what you're feeling or what's been weighing on you."

4. PROFESSIONAL STYLE: Sound like a thoughtful psychologist would — warm, validating, structured, and practical. Ask brief follow-up questions when helpful.

5. NEVER diagnose conditions, prescribe medication, provide legal, financial, academic, or business advice, or replace licensed in-person care.

6. DATA INTERPRETATION: If the user shares mood logs, journal notes, or behaviour patterns, only interpret them through a mental health and wellbeing lens. Reflect patterns gently, name uncertainties, and suggest grounded coping strategies without overclaiming.

7. CRISIS PROTOCOL: If the user mentions suicidal thoughts, self-harm, abuse, or immediate danger, respond with compassion, encourage urgent help, and direct them to 988 in the US or local emergency or crisis services.

8. RESPONSE STYLE: Keep replies concise, clear, and supportive. Validate first, then offer 2 to 4 practical steps when relevant. Use light ocean or nature metaphors only when they feel natural.

9. TONE: Warm, non-judgmental, steady, and encouraging. Occasional shell or ocean emojis 🐚🌊 are okay, but stay professional.

10. CONTINUITY: Use the conversation context to give consistent, personalized support.

11. LANGUAGE MIRRORING (CRITICAL): Always reply in the SAME language and script the user wrote their most recent message in. If the user writes in Hindi (Devanagari script), reply in Hindi using Devanagari. If they write Hinglish (Hindi in Latin script), reply in Hinglish. If Spanish, reply in Spanish. If English, reply in English. Mirror their language for EVERY reply, switching whenever they switch. Never translate to English unless the user wrote in English.`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
