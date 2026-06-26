"use client";

import { motion } from "framer-motion";
import { Job } from "@/types";
import { MapPin, Briefcase, ArrowRight } from "lucide-react";

export default function CareerSection({ jobs }: { jobs: Job[] }) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <section id="career" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-sm font-semibold text-pgp-red tracking-wide uppercase">Careers</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-pgp-navy sm:text-4xl">
            Join Our Growing Team
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Discover opportunities to build a rewarding career in the logistics and supply chain industry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-50 rounded-xl p-8 border border-gray-100 hover:border-pgp-red/30 hover:shadow-md transition-all group flex flex-col"
            >
              <h3 className="text-xl font-bold text-pgp-navy mb-4 group-hover:text-pgp-red transition-colors">{job.title}</h3>
              
              <div className="space-y-2 mb-6">
                {job.department && (
                  <div className="flex items-center text-gray-600 font-medium">
                    <Briefcase size={18} className="mr-3 text-gray-400" />
                    {job.department}
                  </div>
                )}
                {job.location && (
                  <div className="flex items-center text-gray-600 font-medium">
                    <MapPin size={18} className="mr-3 text-gray-400" />
                    {job.location}
                  </div>
                )}
              </div>

              <p className="text-gray-600 line-clamp-3 mb-8 flex-1">
                {job.description}
              </p>

              <a href="/career" className="text-pgp-red font-semibold hover:text-pgp-red-hover flex items-center gap-2 transition-colors mt-auto">
                View Details <ArrowRight size={16} />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
