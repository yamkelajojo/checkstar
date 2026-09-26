"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { spring, ease } from "@/lib/motion/tokens";
import { Logo } from "@/components/Logo";

export default function Footer() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.footer
      initial={
        shouldReduce
          ? { opacity: 0 }
          : { opacity: 0, y: 16, filter: "blur(6px)" }
      }
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: ease.apple }}
      className="bg-[#0F0D0B] text-gray-300 border-t border-white/[0.06]"
    >
      <div className="max-w-7xl mx-auto px-4 py-14 sm:py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.06, delayChildren: 0.1 },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-10 sm:gap-8"
        >
          <motion.div
            variants={{
              hidden: shouldReduce
                ? { opacity: 0 }
                : { opacity: 0, y: 12, filter: "blur(4px)" },
              visible: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { ease: ease.apple },
              },
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Logo variant="lockup" size={18} tone="light" />
            </div>
            <p className="text-[13px] leading-relaxed text-gray-400 max-w-[32ch]">
              Durban-based supermarket chain serving fresh groceries with free
              delivery across the city. Authentic SA flavours, daily fresh.
            </p>
          </motion.div>

          {[
            {
              title: "Quick Links",
              links: [
                { href: "/about", label: "About" },
                { href: "/products", label: "Products" },
                { href: "/recipes", label: "Recipes" },
                { href: "/specials", label: "Specials" },
                { href: "/stores", label: "Our Stores" },
              ],
            },
            {
              title: "Customer Service",
              links: [
                { href: "/contact", label: "Contact Us" },
                { href: "/services", label: "Services" },
                { href: "/careers", label: "Careers" },
                { href: "/about#community", label: "Our Community" },
              ],
            },
            {
              title: "Contact",
              static: [
                "Durban, South Africa",
                "Tel: (031) 000-0000",
                "info@checkstar.co.za",
              ],
            },
          ].map((col, colIdx) => (
            <motion.div
              key={col.title}
              variants={{
                hidden: shouldReduce
                  ? { opacity: 0 }
                  : { opacity: 0, y: 12, filter: "blur(4px)" },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { ease: ease.apple, delay: colIdx * 0.04 },
                },
              }}
            >
              <h4 className="font-semibold text-white text-[13px] tracking-wide mb-4">
                {col.title}
              </h4>
              {col.links ? (
                <div className="flex flex-col gap-2.5 text-[13px]">
                  {col.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors w-fit hover:translate-x-0.5 duration-200"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2 text-[13px] text-gray-400">
                  {col.static!.map((s) => (
                    <span key={s} className="leading-relaxed">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="border-t border-white/[0.06] mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            {[
              {
                href: "https://facebook.com/search/222005974816586/local_search",
                icon: Facebook,
                label: "Facebook",
              },
              {
                href: "https://instagram.com/checkstar_supermarket/",
                icon: Instagram,
                label: "Instagram",
              },
              {
                href: "https://linkedin.com/company/checkstar-sa",
                icon: Linkedin,
                label: "LinkedIn",
              },
            ].map((social, i) => (
              <motion.a
                key={social.label}
                initial={shouldReduce ? undefined : { opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.35 + i * 0.04,
                  type: "spring",
                  ...spring.snap,
                }}
                whileHover={{ scale: 1.1, y: -1 }}
                whileTap={{ scale: 0.9 }}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Checkstar on ${social.label}`}
                className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all"
              >
                <social.icon size={16} strokeWidth={2} />
              </motion.a>
            ))}
          </div>
          <div className="text-[11px] text-gray-500 font-medium tracking-wide">
            © {new Date().getFullYear()} Checkstar. All rights reserved. Crafted
            with care in Durban.
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
