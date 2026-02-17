import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Wind, Music, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const MeditationPage = () => {
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isBreathing) return;
    let phase = 0;
    const phases = [
      { name: "inhale" as const, duration: 4000 },
      { name: "hold" as const, duration: 4000 },
      { name: "exhale" as const, duration: 4000 },
    ];

    const cycle = () => {
      setBreathPhase(phases[phase % 3].name);
      phase++;
    };

    cycle();
    const id = setInterval(cycle, 4000);
    const timerId = setInterval(() => setTimer((t) => t + 1), 1000);

    return () => {
      clearInterval(id);
      clearInterval(timerId);
    };
  }, [isBreathing]);

  const toggleBreathing = () => {
    if (isBreathing) {
      setIsBreathing(false);
      setTimer(0);
      setBreathPhase("inhale");
    } else {
      setIsBreathing(true);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <h1 className="text-2xl font-bold text-foreground mb-2">Meditation Hub</h1>
        <p className="text-sm text-muted-foreground mb-12">Find calm through guided breathing and relaxation.</p>

        {/* Breathing Circle */}
        <div className="relative mb-8">
          <motion.div
            className="w-48 h-48 rounded-full bg-calm-lavender flex items-center justify-center"
            animate={isBreathing ? {
              scale: breathPhase === "inhale" ? 1.3 : breathPhase === "hold" ? 1.3 : 1,
            } : { scale: 1 }}
            transition={{ duration: 4, ease: "easeInOut" }}
          >
            <motion.div
              className="w-32 h-32 rounded-full bg-soft-blue flex items-center justify-center"
              animate={isBreathing ? {
                scale: breathPhase === "inhale" ? 1.2 : breathPhase === "hold" ? 1.2 : 1,
              } : { scale: 1 }}
              transition={{ duration: 4, ease: "easeInOut" }}
            >
              <div className="text-center">
                {isBreathing ? (
                  <>
                    <p className="text-lg font-semibold text-foreground capitalize">{breathPhase}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(timer)}</p>
                  </>
                ) : (
                  <Wind className="w-8 h-8 text-foreground mx-auto" />
                )}
              </div>
            </motion.div>
          </motion.div>
          {isBreathing && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
        </div>

        <Button onClick={toggleBreathing} size="lg" className="rounded-full px-8 gap-2 mb-12">
          {isBreathing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isBreathing ? "Stop" : "Start Breathing Exercise"}
        </Button>

        {/* Wellness Tools */}
        <div className="grid md:grid-cols-3 gap-4 max-w-2xl w-full">
          {[
            { title: "Deep Relaxation", duration: "3 min", icon: <Wind className="w-6 h-6" />, bg: "bg-mint-green" },
            { title: "Calm Me Down", duration: "6 min", icon: <Volume2 className="w-6 h-6" />, bg: "bg-soft-yellow" },
            { title: "Binaural Beats", duration: "10 min", icon: <Music className="w-6 h-6" />, bg: "bg-peach" },
          ].map((tool) => (
            <motion.div
              key={tool.title}
              className={`${tool.bg} rounded-2xl p-6 cursor-pointer hover:shadow-md transition-shadow`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3 mb-2">
                {tool.icon}
                <span className="text-xs text-muted-foreground">{tool.duration}</span>
              </div>
              <p className="font-medium text-sm text-foreground">{tool.title}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MeditationPage;
