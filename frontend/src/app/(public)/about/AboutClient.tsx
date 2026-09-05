"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, type Variants } from "motion/react";
import { Store, Bike, Users, ShoppingBag, Award, Heart } from "lucide-react";
import WritingText from "@/components/WritingText";
import CurvyUnderline from "@/components/CurvyUnderline";
import { fadeUp, stagger } from "@/lib/motion/variants";

const timelineCard: Variants = {
  hidden: (fromRight: boolean) => ({ opacity: 0, x: fromRight ? 56 : -56 }),
  show: { opacity: 1, x: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const timeline = [
  {
    year: "2005",
    title: "First Store Opens",
    desc: "Checkstar opened its doors in Durban with a single store, committed to quality groceries at fair prices.",
  },
  {
    year: "2010",
    title: "Second Location",
    desc: "Expanded to a second store in response to growing demand from the community.",
  },
  {
    year: "2016",
    title: "Third Store",
    desc: "Opened our third location, further extending our reach across Durban.",
  },
  {
    year: "2024",
    title: "Going Digital",
    desc: "Began rebuilding our website and launching a delivery platform with motorbike Riders.",
  },
  {
    year: "2025",
    title: "Delivery Launch",
    desc: "Launched grocery delivery — bringing fresh food to doorsteps across the city.",
  },
];

const stakeholders = [
  {
    icon: Store,
    title: "Store Owners",
    desc: "Local entrepreneurs who own and operate each Checkstar location.",
  },
  {
    icon: Users,
    title: "Store Managers",
    desc: "Day-to-day operations, inventory, and staff management at each store.",
  },
  {
    icon: Bike,
    title: "Riders",
    desc: "Riders who deliver orders fresh and fast to customers.",
  },
  {
    icon: ShoppingBag,
    title: "Suppliers",
    desc: "Trusted local and national suppliers who stock our shelves daily.",
  },
];

export default function AboutClient() {
  return (
    <>
      <div>
        <section className="relative bg-gradient-to-br from-primary-light via-white to-white overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.h1
                variants={fadeUp}
                className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight"
              >
                Our Story
                <CurvyUnderline
                  width={180}
                  thickness={3}
                  className="mx-auto mt-3"
                />
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed"
              >
                From a single store in Durban to a community-driven grocery
                delivery service — Checkstar has been serving South African
                families for nearly two decades.
              </motion.p>
            </motion.div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-lg sm:text-2xl font-bold mb-6"
          >
            Who We Are
          </motion.h2>
          <div className="space-y-4 text-[#6B625C] leading-relaxed text-[15px]">
            <WritingText
              text="Checkstar is a Durban-based supermarket chain dedicated to providing fresh, quality groceries at fair prices. With three physical stores across the city and a growing online delivery service, we serve thousands of customers every day."
              mode="word"
              speed={35}
              trigger
            />
            <WritingText
              text="Our mission is simple: make grocery shopping easy, affordable, and accessible. Whether you visit us in-store or order through our app, you can expect the same commitment to quality and service that has defined Checkstar since 2005."
              mode="word"
              speed={30}
              delay={300}
              trigger
            />
            <WritingText
              text="We are proudly South African — rooted in Durban, built by locals, and driven by a passion for community. Our motorbike Rider delivery service means your order arrives fast, fresh, and with a smile."
              mode="word"
              speed={28}
              delay={600}
              trigger
            />
          </div>
        </section>

        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-lg sm:text-2xl font-bold text-center mb-12"
            >
              Our Stakeholders
            </motion.h2>
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {stakeholders.map((s, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
                >
                  <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-4">
                    <s.icon className="text-primary" size={24} />
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-semibold mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-lg sm:text-2xl font-bold text-center mb-12"
          >
            Our Timeline
          </motion.h2>
          <Timeline />
        </section>

        <section className="bg-primary text-white py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto px-4"
          >
            <Heart size={40} className="mx-auto mb-4 opacity-80" />
            <h2 className="font-display text-lg sm:text-2xl font-bold mb-4">
              Proudly Serving Durban
            </h2>
            <p className="opacity-90 leading-relaxed">
              Every order supports local jobs, local suppliers, and our
              community. Thank you for choosing Checkstar.
            </p>
          </motion.div>
        </section>
      </div>
    </>
  );
}

function Timeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "end 0.6"],
  });
  const fillScale = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.001,
  });

  return (
    <div ref={ref} className="relative overflow-x-clip">
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gray-200" />
      <motion.div
        style={{ scaleY: fillScale }}
        className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 origin-top bg-gradient-to-b from-primary to-primary/40"
      />
      {timeline.map((t, i) => {
        const isLast = i === timeline.length - 1;
        const fromRight = i % 2 === 1;
        return (
          <div
            key={t.year}
            className={`relative flex items-start gap-6 md:gap-12 mb-16 md:mb-24 last:mb-0 ${i % 2 === 0 ? "" : "md:flex-row-reverse"}`}
          >
            <div className="hidden md:block flex-1" />
            <motion.span
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 18,
                delay: 0.2,
              }}
              className={`absolute left-6 md:left-1/2 -translate-x-1/2 top-6 rounded-full ring-4 ring-white bg-primary ${
                isLast ? "w-5 h-5" : "w-4 h-4"
              }`}
            />
            <motion.div
              custom={fromRight}
              variants={timelineCard}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="flex-1 ml-12 md:ml-0 bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8"
            >
              <span className="text-sm font-bold text-primary">{t.year}</span>
              <h3 className="font-display text-base sm:text-lg font-semibold mt-1">
                {t.title}
              </h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                {t.desc}
              </p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
