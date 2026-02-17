import { motion } from "framer-motion";
import { Activity, Mic, Trophy, Video, Wind, Users, Heart, Quote, Watch } from "lucide-react";

const features = [
  { icon: <Activity className="w-6 h-6" />, text: "Track your mood in just seconds", bg: "bg-muted" },
  { icon: <Mic className="w-6 h-6" />, text: "Add voice memos on the go", bg: "bg-peach" },
  { icon: <Trophy className="w-6 h-6" />, text: "Set achievable routines easily", bg: "bg-soft-yellow" },
  { icon: <Video className="w-6 h-6" />, text: "Add video memos on the go", bg: "bg-mint-green" },
  { icon: <Wind className="w-6 h-6" />, text: "Learn breathing techniques to combat stress", bg: "bg-mint-green" },
  { icon: <Users className="w-6 h-6" />, text: "Get support based on your data", bg: "bg-soft-blue" },
  { icon: <Heart className="w-6 h-6" />, text: "Measure heart rate during sessions", bg: "bg-peach" },
  { icon: <Quote className="w-6 h-6" />, text: "Get daily quotes based on your situation", bg: "bg-calm-lavender" },
  { icon: <Watch className="w-6 h-6" />, text: "Connect to your wearable devices", bg: "bg-soft-yellow" },
];

const FeaturesGrid = () => {
  return (
    <section className="py-20 px-6 bg-muted">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16 text-foreground">
          Main <span className="text-primary italic">features</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.text}
              className="flex items-center gap-4 bg-card rounded-2xl p-4 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
            >
              <div className={`w-12 h-12 rounded-full ${f.bg} flex items-center justify-center shrink-0`}>
                {f.icon}
              </div>
              <p className="text-sm font-medium text-foreground">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
