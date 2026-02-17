import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const prompts = [
  "What made you smile today?",
  "Describe one thing you're grateful for.",
  "What's been on your mind lately?",
  "Write about a moment that brought you peace.",
  "What would you tell your younger self?",
  "How did you take care of yourself today?",
];

type Entry = { text: string; mood: string; date: Date; prompt?: string };

const JournalPage = () => {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("😊");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState(prompts[0]);
  const { toast } = useToast();

  const save = () => {
    if (!text.trim()) return;
    setEntries((prev) => [{ text: text.trim(), mood, date: new Date(), prompt: currentPrompt }, ...prev]);
    setText("");
    toast({ title: "Entry saved 📝", description: "Your journal entry has been saved." });
  };

  const newPrompt = () => {
    setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Journal</h1>
        <p className="text-sm text-muted-foreground mb-8">A private space to express your thoughts with panda prompts.</p>

        {/* Prompt */}
        <div className="bg-soft-yellow rounded-2xl p-5 mb-6 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-foreground mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground italic">🐼 {currentPrompt}</p>
            <button onClick={newPrompt} className="text-xs text-primary mt-2 underline">New prompt</button>
          </div>
        </div>

        {/* Mood tag */}
        <div className="flex gap-2 mb-4">
          {["😊", "😐", "😢", "😰", "🥰"].map((e) => (
            <button
              key={e}
              onClick={() => setMood(e)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                mood === e ? "bg-primary text-primary-foreground scale-110" : "bg-muted"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start writing..."
          className="w-full bg-card border border-border rounded-2xl p-6 text-sm resize-none h-48 mb-4 focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
        />

        <Button onClick={save} disabled={!text.trim()} className="rounded-full gap-2">
          <BookOpen className="w-4 h-4" /> Save Entry
        </Button>

        {/* Entries */}
        {entries.length > 0 && (
          <div className="mt-10 space-y-4">
            <h3 className="font-semibold text-foreground">Past Entries</h3>
            {entries.map((e, i) => (
              <motion.div
                key={i}
                className="bg-card rounded-2xl p-5 border border-border"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{e.mood}</span>
                  <span className="text-xs text-muted-foreground">{e.date.toLocaleDateString()} {e.date.toLocaleTimeString()}</span>
                </div>
                {e.prompt && <p className="text-xs text-primary italic mb-2">Prompt: {e.prompt}</p>}
                <p className="text-sm text-foreground whitespace-pre-wrap">{e.text}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default JournalPage;
