import { motion } from "framer-motion";
import { Brain, Zap, Shield } from "lucide-react";

const factors = [
  {
    icon: <Brain className="w-8 h-8" />,
    title: "AI powered",
    bg: "bg-soft-yellow",
    items: ["Auto-detect your mental state", "Get immediate guidance", "Talk to Panda"],
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Effortless",
    bg: "bg-mint-green",
    items: ["3-second check-in", "No typing needed", "Intuitive UX"],
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Radically private",
    bg: "bg-calm-lavender",
    items: ["No registration", "No personal data", "No ads, only AI support"],
  },
];

const KeyFactors = () => {
  return (
    <section className="py-20 px-6 bg-muted">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {factors.map((f, i) => (
            <motion.div
              key={f.title}
              className="flex flex-col items-center text-center space-y-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
            >
              <div className={`w-20 h-20 rounded-full ${f.bg} flex items-center justify-center`}>
                <span className="text-3xl">🐼</span>
              </div>
              <h3 className="text-xl font-bold text-foreground">{f.title}</h3>
              <div className="space-y-1">
                {f.items.map((item) => (
                  <p key={item} className="text-sm text-muted-foreground">{item}</p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyFactors;
