import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import pandaMascot from "@/assets/panda-mascot.png";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type TranscriptEntry = { role: "user" | "assistant"; text: string };

const VoicePage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [pandaState, setPandaState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const { toast } = useToast();

  const startCall = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("vapi-token");
      if (error || !data?.webCallUrl) {
        throw new Error("Could not get Vapi session");
      }

      // Open Vapi web call in a new window
      window.open(data.webCallUrl, "_blank", "width=400,height=600");
      
      setPandaState("listening");
      setIsConnected(true);
      toast({ title: "Voice session started", description: "A voice call window has opened. Speak with Panda!" });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Could not start voice session. Check your Vapi API key." });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const endCall = useCallback(() => {
    setIsConnected(false);
    setPandaState("idle");
    toast({ title: "Call ended", description: "Voice session has ended." });
  }, [toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-2xl mx-auto w-full">
        {/* Panda Avatar */}
        <motion.div
          className="relative mb-8"
          animate={pandaState === "listening" ? { scale: [1, 1.05, 1] } : pandaState === "speaking" ? { rotate: [0, 2, -2, 0] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className={`w-48 h-48 rounded-full flex items-center justify-center ${
            pandaState === "listening" ? "bg-mint-green" : pandaState === "speaking" ? "bg-soft-yellow" : "bg-muted"
          } transition-colors duration-500`}>
            <img src={pandaMascot} alt="Panda" className="w-32 h-32" />
          </div>
          {isConnected && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-card border border-border shadow-sm text-foreground capitalize">
                {pandaState}
              </span>
            </div>
          )}
        </motion.div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Voice with Panda</h1>
        <p className="text-sm text-muted-foreground mb-8 text-center">
          Talk to Panda using your voice. Panda will listen, understand, and respond with both text and voice.
        </p>

        {/* Controls */}
        <div className="flex gap-4 mb-8">
          {!isConnected ? (
            <Button
              onClick={startCall}
              disabled={isConnecting}
              size="lg"
              className="rounded-full px-8 gap-2"
            >
              <Phone className="w-5 h-5" />
              {isConnecting ? "Connecting..." : "Start Voice Call"}
            </Button>
          ) : (
            <Button
              onClick={endCall}
              variant="destructive"
              size="lg"
              className="rounded-full px-8 gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              End Call
            </Button>
          )}
        </div>

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="w-full bg-card rounded-2xl border border-border p-4 space-y-3 max-h-64 overflow-y-auto">
            <h3 className="text-sm font-semibold text-foreground mb-2">Live Transcript</h3>
            {transcript.map((t, i) => (
              <div key={i} className={`text-sm ${t.role === "user" ? "text-foreground" : "text-primary"}`}>
                <span className="font-medium">{t.role === "user" ? "You" : "Panda"}:</span> {t.text}
              </div>
            ))}
          </div>
        )}

        {!isConnected && transcript.length === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-4">
            <p>Press "Start Voice Call" to begin talking with Panda.</p>
            <p className="mt-1">A separate voice call window will open powered by Vapi AI.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default VoicePage;
