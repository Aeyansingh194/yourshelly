import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import pandaMascot from "@/assets/panda-mascot.png";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Vapi from "@vapi-ai/web";

const VoicePage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [pandaState, setPandaState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [transcript, setTranscript] = useState<string[]>([]);
  const vapiRef = useRef<Vapi | null>(null);
  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      vapiRef.current?.stop();
    };
  }, []);

  const startCall = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("vapi-token");
      if (error || !data?.publicKey || !data?.assistantId) {
        throw new Error("Could not get voice credentials");
      }

      const vapi = new Vapi(data.publicKey);
      vapiRef.current = vapi;

      // Set up event listeners
      vapi.on("call-start", () => {
        setIsConnected(true);
        setIsConnecting(false);
        setPandaState("listening");
        setTranscript([]);
      });

      vapi.on("call-end", () => {
        setIsConnected(false);
        setPandaState("idle");
        vapiRef.current = null;
      });

      vapi.on("speech-start", () => {
        setPandaState("speaking");
      });

      vapi.on("speech-end", () => {
        setPandaState("listening");
      });

      vapi.on("message", (msg: any) => {
        if (msg.type === "transcript" && msg.transcript) {
          const prefix = msg.role === "user" ? "You" : "Panda";
          if (msg.transcriptType === "final") {
            setTranscript((prev) => [...prev.slice(-19), `${prefix}: ${msg.transcript}`]);
          }
        }
      });

      vapi.on("error", (err: any) => {
        console.error("Vapi error:", err);
        toast({ variant: "destructive", title: "Voice Error", description: "Something went wrong with the voice call." });
      });

      await vapi.start(data.assistantId);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Could not start voice session. Please try again." });
      setIsConnecting(false);
    }
  }, [toast]);

  const endCall = useCallback(() => {
    vapiRef.current?.stop();
    setIsConnected(false);
    setPandaState("idle");
    setIsMuted(false);
    toast({ title: "Call ended", description: "Voice session has ended." });
  }, [toast]);

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

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
          Talk to Panda using your voice. Panda will listen, understand, and respond naturally.
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
            <>
              <Button
                onClick={toggleMute}
                variant="outline"
                size="lg"
                className="rounded-full px-6 gap-2"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isMuted ? "Unmute" : "Mute"}
              </Button>
              <Button
                onClick={endCall}
                variant="destructive"
                size="lg"
                className="rounded-full px-8 gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                End Call
              </Button>
            </>
          )}
        </div>

        {/* Live Transcript */}
        {isConnected && transcript.length > 0 && (
          <div className="w-full bg-card border border-border rounded-2xl p-4 max-h-60 overflow-y-auto">
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Live Transcript</h3>
            <div className="space-y-1">
              {transcript.map((line, i) => (
                <p key={i} className={`text-sm ${line.startsWith("You:") ? "text-foreground" : "text-primary"}`}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {!isConnected && (
          <div className="text-center text-muted-foreground text-sm mt-4">
            <p>Press "Start Voice Call" to begin talking with Panda.</p>
            <p className="mt-1">The conversation happens right here — no redirects.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default VoicePage;
