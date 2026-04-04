import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GiMeditation, GiLotus, GiSoundWaves } from "react-icons/gi";
import { MdSelfImprovement } from "react-icons/md";
import { IoLeafOutline, IoClose } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// --- Audio helpers using Web Audio API (no files needed) ---
const createAudioContext = () => {
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  return new AC();
};

const playBreathSound = (ctx: AudioContext, type: "inhale" | "exhale") => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === "inhale") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.5);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2);
  } else {
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.5);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2);
  }
};

const playBinauralBeat = (ctx: AudioContext, baseFreq: number, beatFreq: number) => {
  const oscL = ctx.createOscillator();
  const oscR = ctx.createOscillator();
  const gainL = ctx.createGain();
  const gainR = ctx.createGain();
  const merger = ctx.createChannelMerger(2);

  oscL.frequency.value = baseFreq;
  oscR.frequency.value = baseFreq + beatFreq;
  oscL.type = "sine";
  oscR.type = "sine";

  gainL.gain.value = 0.1;
  gainR.gain.value = 0.1;

  oscL.connect(gainL);
  oscR.connect(gainR);
  gainL.connect(merger, 0, 0);
  gainR.connect(merger, 0, 1);
  merger.connect(ctx.destination);

  oscL.start();
  oscR.start();

  return { stop: () => { oscL.stop(); oscR.stop(); } };
};

// --- Session configurations ---
type SessionConfig = {
  title: string;
  durationSec: number;
  phases: { name: "inhale" | "hold" | "exhale"; duration: number }[];
  description: string;
};

const SESSIONS: Record<string, SessionConfig> = {
  breathing: {
    title: "Breathing Exercise",
    durationSec: 0, // unlimited
    phases: [
      { name: "inhale", duration: 4000 },
      { name: "hold", duration: 4000 },
      { name: "exhale", duration: 4000 },
    ],
    description: "4-4-4 box breathing cycle",
  },
  deepRelax: {
    title: "Deep Relaxation",
    durationSec: 180,
    phases: [
      { name: "inhale", duration: 4000 },
      { name: "hold", duration: 7000 },
      { name: "exhale", duration: 8000 },
    ],
    description: "4-7-8 relaxation breathing for 3 minutes",
  },
  calmDown: {
    title: "Calm Me Down",
    durationSec: 360,
    phases: [
      { name: "inhale", duration: 5000 },
      { name: "hold", duration: 5000 },
      { name: "exhale", duration: 5000 },
    ],
    description: "5-5-5 calming breath for 6 minutes",
  },
  binaural: {
    title: "Binaural Beats",
    durationSec: 600,
    phases: [
      { name: "inhale", duration: 6000 },
      { name: "hold", duration: 2000 },
      { name: "exhale", duration: 6000 },
    ],
    description: "Alpha-wave binaural beats with gentle breathing for 10 minutes",
  },
};

const MeditationPage = () => {
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [phaseCountdown, setPhaseCountdown] = useState(4);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const binauralRef = useRef<{ stop: () => void } | null>(null);

  const session = activeSession ? SESSIONS[activeSession] : null;
  const cycleDuration = session
    ? session.phases.reduce((sum, p) => sum + p.duration, 0) / 1000
    : 12;

  // Calculate progress for timed sessions
  const progress = session && session.durationSec > 0
    ? Math.min((totalElapsed / session.durationSec) * 100, 100)
    : 0;

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const remainingTime = session && session.durationSec > 0
    ? Math.max(session.durationSec - totalElapsed, 0)
    : 0;

  const stopSession = useCallback(() => {
    setActiveSession(null);
    setTotalElapsed(0);
    setBreathPhase("inhale");
    setPhaseCountdown(4);
    binauralRef.current?.stop();
    binauralRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  // Main breathing cycle
  useEffect(() => {
    if (!activeSession || !session) return;

    // Init audio
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    const ctx = audioCtxRef.current;

    // Start binaural for that session
    if (activeSession === "binaural" && !binauralRef.current) {
      binauralRef.current = playBinauralBeat(ctx, 200, 10);
    }

    let phaseIdx = 0;
    let phaseTimer: ReturnType<typeof setTimeout>;
    let countdownInterval: ReturnType<typeof setInterval>;

    const startPhase = () => {
      const currentPhase = session.phases[phaseIdx % session.phases.length];
      setBreathPhase(currentPhase.name);
      const phaseSec = currentPhase.duration / 1000;
      setPhaseCountdown(phaseSec);

      // Play sound on inhale/exhale
      if (currentPhase.name === "inhale" || currentPhase.name === "exhale") {
        playBreathSound(ctx, currentPhase.name);
      }

      // Countdown within phase
      let remaining = phaseSec;
      countdownInterval = setInterval(() => {
        remaining--;
        if (remaining >= 0) setPhaseCountdown(remaining);
      }, 1000);

      phaseTimer = setTimeout(() => {
        clearInterval(countdownInterval);
        phaseIdx++;
        startPhase();
      }, currentPhase.duration);
    };

    startPhase();

    // Total elapsed timer
    const elapsedInterval = setInterval(() => {
      setTotalElapsed((t) => t + 1);
    }, 1000);

    return () => {
      clearTimeout(phaseTimer);
      clearInterval(countdownInterval);
      clearInterval(elapsedInterval);
    };
  }, [activeSession, session]);

  // Auto-stop timed sessions
  useEffect(() => {
    if (session && session.durationSec > 0 && totalElapsed >= session.durationSec) {
      stopSession();
    }
  }, [totalElapsed, session, stopSession]);

  const startSession = (key: string) => {
    stopSession();
    setTimeout(() => setActiveSession(key), 50);
  };

  const isActive = activeSession !== null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-12">
        <h1 className="mb-2 text-center text-3xl font-bold text-foreground sm:text-4xl">
          Meditation Hub
        </h1>
        <p className="mb-10 max-w-xl text-center text-sm leading-7 text-muted-foreground sm:mb-12 sm:text-base">
          Find calm through guided breathing and relaxation.
        </p>

        {/* Active session info */}
        <AnimatePresence>
          {session && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 text-center"
            >
              <p className="text-lg font-semibold text-foreground">{session.title}</p>
              <p className="text-xs text-muted-foreground">{session.description}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Breathing Circle */}
        <div className="relative mb-4">
          <motion.div
            className="flex h-40 w-40 items-center justify-center rounded-full bg-calm-lavender sm:h-48 sm:w-48"
            animate={isActive ? {
              scale: breathPhase === "inhale" ? 1.3 : breathPhase === "hold" ? 1.3 : 1,
            } : { scale: 1 }}
            transition={{ duration: session ? session.phases.find(p => p.name === breathPhase)!.duration / 1000 : 4, ease: "easeInOut" }}
          >
            <motion.div
              className="flex h-28 w-28 items-center justify-center rounded-full bg-soft-blue sm:h-32 sm:w-32"
              animate={isActive ? {
                scale: breathPhase === "inhale" ? 1.2 : breathPhase === "hold" ? 1.2 : 1,
              } : { scale: 1 }}
              transition={{ duration: session ? session.phases.find(p => p.name === breathPhase)!.duration / 1000 : 4, ease: "easeInOut" }}
            >
              <div className="text-center">
                {isActive ? (
                  <>
                    <p className="text-lg font-semibold text-foreground capitalize">{breathPhase}</p>
                    <p className="text-2xl font-bold text-primary">{phaseCountdown}</p>
                  </>
                ) : (
                  <IoLeafOutline className="w-8 h-8 text-foreground mx-auto" />
                )}
              </div>
            </motion.div>
          </motion.div>
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
        </div>

        {/* Timer / Progress */}
        {isActive && session && (
          <div className="mb-4 w-full max-w-xs text-center">
            {session.durationSec > 0 ? (
              <>
                <Progress value={progress} className="mb-2 h-2" />
                <p className="text-sm text-muted-foreground">
                  {formatTime(remainingTime)} remaining
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Cycle {Math.floor(totalElapsed / cycleDuration) + 1} · {formatTime(totalElapsed)} elapsed
              </p>
            )}
          </div>
        )}

        {/* Start/Stop */}
        <div className="flex gap-3 mb-12">
          {isActive ? (
            <Button onClick={stopSession} size="lg" variant="destructive" className="gap-2 rounded-full px-8">
              <IoClose className="w-5 h-5" />
              Stop Session
            </Button>
          ) : (
            <Button onClick={() => startSession("breathing")} size="lg" className="w-full max-w-sm gap-2 rounded-full px-8 sm:w-auto">
              <GiMeditation className="w-5 h-5" />
              Start Breathing Exercise
            </Button>
          )}
        </div>

        {/* Wellness Tools */}
        <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              key: "deepRelax",
              title: "Deep Relaxation",
              duration: "3 min",
              icon: <GiLotus className="w-6 h-6" />,
              bg: "bg-mint-green",
            },
            {
              key: "calmDown",
              title: "Calm Me Down",
              duration: "6 min",
              icon: <MdSelfImprovement className="w-6 h-6" />,
              bg: "bg-soft-yellow",
            },
            {
              key: "binaural",
              title: "Binaural Beats",
              duration: "10 min",
              icon: <GiSoundWaves className="w-6 h-6" />,
              bg: "bg-peach",
            },
          ].map((tool) => (
            <motion.div
              key={tool.key}
              onClick={() => startSession(tool.key)}
              className={`${tool.bg} cursor-pointer rounded-2xl p-5 transition-shadow hover:shadow-md sm:p-6 ${activeSession === tool.key ? "ring-2 ring-primary" : ""}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3 mb-2">
                {tool.icon}
                <span className="text-xs text-muted-foreground">{tool.duration}</span>
              </div>
              <p className="font-medium text-sm text-foreground">{tool.title}</p>
              {activeSession === tool.key && (
                <p className="text-xs text-primary mt-1 font-medium">● Active</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MeditationPage;
