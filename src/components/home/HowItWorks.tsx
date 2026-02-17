import { motion } from "framer-motion";
import { BarChart3, MessageCircle, Heart } from "lucide-react";

const steps = [
  {
    num: "01",
    title: "AI powered tracking",
    desc: "Understand your emotional health in real time and receive suggestions to improve.",
    icon: <BarChart3 className="w-10 h-10 text-foreground" />,
    gradient: "gradient-pink",
  },
  {
    num: "02",
    title: "Real time conversations",
    desc: "Interact with your AI chat bot of choice for real time support based on your input.",
    icon: <MessageCircle className="w-10 h-10 text-foreground" />,
    gradient: "gradient-yellow",
  },
  {
    num: "03",
    title: "Guided selfcare sessions",
    desc: "Learn to focus on recovery, find calm and become your healthiest self.",
    icon: <Heart className="w-10 h-10 text-foreground" />,
    gradient: "gradient-blue",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16 text-foreground">
          How it <span className="text-primary">works</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="space-y-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
            >
              <p className="text-sm font-medium text-muted-foreground">
                <span className="text-primary">{step.num}.</span> <span className="font-bold text-foreground">{step.title}</span>
              </p>
              <div className={`${step.gradient} rounded-3xl p-8 h-64 flex items-center justify-center`}>
                {step.icon}
              </div>
              <p className="text-sm text-muted-foreground text-center">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
