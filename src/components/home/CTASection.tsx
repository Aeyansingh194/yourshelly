import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <motion.div
          className="bg-soft-yellow rounded-3xl p-12 text-center space-y-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-foreground">Try Digital Psychologist today!</h2>
          <p className="text-muted-foreground">Track and improve your mental health in real time</p>
          <Link to="/chat">
            <Button size="lg" className="rounded-full px-8">
              Start Now
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
