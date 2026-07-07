"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Capability } from "@/types";

export default function CapabilitiesSection({ capabilities }: { capabilities: Capability[] }) {
  if (!capabilities || capabilities.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold text-pgp-red tracking-wide uppercase">Our Capabilities</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-pgp-navy sm:text-4xl">
              Precision Logistics, <br />Global Reach
            </p>
          </div>
          <p className="text-lg text-gray-500 max-w-lg">
            We leverage advanced infrastructure and industry expertise to deliver unparalleled logistics capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {capabilities.map((cap, index) => (
            <motion.div
              key={cap.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl h-80 cursor-pointer"
            >
              <div className="absolute inset-0 bg-pgp-navy/60 group-hover:bg-pgp-navy/40 transition-colors z-10" />
              <Image
                src={cap.image_url || "https://images.unsplash.com/photo-1494412519320-aa613dfb7738?q=80&w=2070&auto=format&fit=crop"}
                alt={cap.title}
                fill
                unoptimized={!!cap.image_url}
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                <h3 className="text-2xl font-bold text-white mb-2">{cap.title}</h3>
                <p className="text-gray-200 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  {cap.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
