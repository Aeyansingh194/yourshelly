import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GiMeditation, GiLotus, GiSoundWaves } from "react-icons/gi";
import { MdSelfImprovement } from "react-icons/md";
import { IoLeafOutline, IoClose } from "react-icons/io5";
import { Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

// --- Breathing session configurations ---
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
};

const BINAURAL_VIDEO_ID = "1_G60OdEzXs";
const STORAGE_KEY = "meditation-progress-v1";

type SavedProgress = {
  activeSession: string | null;
  totalElapsed: number;
  binauralPlaying: boolean;
};

const loadProgress = (): SavedProgress => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { activeSession: null, totalElapsed: 0, binauralPlaying: false };
    const parsed = JSON.parse(raw) as SavedProgress;
    return {
      activeSession: parsed.activeSession ?? null,
      totalElapsed: parsed.totalElapsed ?? 0,
      binauralPlaying: parsed.binauralPlaying ?? false,
    };
  } catch {
    return { activeSession: null, totalElapsed: 0, binauralPlaying: false };
  }
};

const MeditationPage = () => {
  const initial = typeof window !== "undefined" ? loadProgress() : { activeSession: null, totalElapsed: 0, binauralPlaying: false };
  const [activeSession, setActiveSession] = useState<string | null>(initial.activeSession);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [phaseCountdown, setPhaseCountdown] = useState(4);
  const [totalElapsed, setTotalElapsed] = useState(initial.totalElapsed);
  const [binauralPlaying, setBinauralPlaying] = useState(initial.binauralPlaying);
  const [showHeadphoneAlert, setShowHeadphoneAlert] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Persist progress on every relevant change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ activeSession, totalElapsed, binauralPlaying }),
      );
    } catch {
      /* ignore */
    }
  }, [activeSession, totalElapsed, binauralPlaying]);

  const session = activeSession ? SESSIONS[activeSession] : null;
  const cycleDuration = session
    ? session.phases.reduce((sum, p) => sum + p.duration, 0) / 1000
    : 12;

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
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  // Main breathing cycle
  useEffect(() => {
    if (!activeSession || !session) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    const ctx = audioCtxRef.current;

    let phaseIdx = 0;
    let phaseTimer: ReturnType<typeof setTimeout>;
    let countdownInterval: ReturnType<typeof setInterval>;

    const startPhase = () => {
      const currentPhase = session.phases[phaseIdx % session.phases.length];
      setBreathPhase(currentPhase.name);
      const phaseSec = currentPhase.duration / 1000;
      setPhaseCountdown(phaseSec);

      if (currentPhase.name === "inhale" || currentPhase.name === "exhale") {
        playBreathSound(ctx, currentPhase.name);
      }

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

    const elapsedInterval = setInterval(() => {
      setTotalElapsed((t) => t + 1);
    }, 1000);

    return () => {
      clearTimeout(phaseTimer);
      clearInterval(countdownInterval);
      clearInterval(elapsedInterval);
    };
  }, [activeSession, session]);

  useEffect(() => {
    if (session && session.durationSec > 0 && totalElapsed >= session.durationSec) {
      stopSession();
    }
  }, [totalElapsed, session, stopSession]);

  const startSession = (key: string) => {
    setBinauralPlaying(false);
    stopSession();
    setTimeout(() => setActiveSession(key), 50);
  };

  const stopBinaural = () => {
    setBinauralPlaying(false);
  };

  const handleBinauralClick = () => {
    if (binauralPlaying) {
      setBinauralPlaying(false);
      return;
    }
    setShowHeadphoneAlert(true);
  };

  const confirmBinaural = () => {
    setShowHeadphoneAlert(false);
    stopSession();
    setBinauralPlaying(true);
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

          {/* Binaural Beats card — plays YouTube music */}
          <motion.div
            onClick={handleBinauralClick}
            className={`bg-peach cursor-pointer rounded-2xl p-5 transition-shadow hover:shadow-md sm:p-6 ${binauralPlaying ? "ring-2 ring-primary" : ""}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <GiSoundWaves className="w-6 h-6" />
              <span className="text-xs text-muted-foreground">Music</span>
            </div>
            <p className="font-medium text-sm text-foreground">Binaural Beats</p>
            <p className="text-xs text-muted-foreground mt-1">
              {binauralPlaying ? "● Now playing — tap to stop" : "Headphones recommended 🎧"}
            </p>
          </motion.div>
        </div>

        {/* Embedded YouTube player for binaural beats */}
        {binauralPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 w-full max-w-2xl"
          >
            <div className="overflow-hidden rounded-2xl shadow-lg">
              <iframe
                width="100%"
                height="280"
                src={`https://www.youtube.com/embed/${BINAURAL_VIDEO_ID}?autoplay=1&rel=0`}
                title="Binaural Beats"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full"
              />
            </div>
            <div className="mt-4 flex flex-col items-center gap-3">
              <Button
                onClick={stopBinaural}
                size="lg"
                variant="destructive"
                className="gap-2 rounded-full px-8"
              >
                <IoClose className="w-5 h-5" />
                Stop Binaural Beats
              </Button>
              <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Headphones className="w-4 h-4" />
                For best experience, use headphones or earphones.
              </p>
            </div>
          </motion.div>
        )}
      </div>
      <Footer />

      {/* Headphone alert before binaural */}
      <AlertDialog open={showHeadphoneAlert} onOpenChange={setShowHeadphoneAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-primary" />
              Use headphones for the best experience
            </AlertDialogTitle>
            <AlertDialogDescription>
              Binaural beats work by playing slightly different frequencies in each ear.
              Please put on your headphones or earphones before starting for the full effect 🎧
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBinaural}>I'm ready, play</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MeditationPage;
