import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import pandaMascot from "@/assets/panda-mascot.png";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto flex flex-col md:flex-row items-center gap-12">
        <motion.div
          className="flex-1 space-y-6"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-foreground">
            Your Personal AI<br />Chat Bot for Self<br />Care
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Measure & improve your mental health in real time with your personal AI chat bot. No sign up. Available 24/7. Daily insights just for you!
          </p>
          <Link to="/chat">
            <Button size="lg" className="rounded-full px-8 py-6 text-lg mt-4">
              Chat With Panda
            </Button>
          </Link>
        </motion.div>
        <motion.div
          className="flex-1 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <img src={pandaMascot} alt="Panda Mascot" className="w-72 md:w-96 drop-shadow-xl" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
