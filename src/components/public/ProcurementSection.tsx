"use client";

import { motion } from "framer-motion";
import { Tender } from "@/types";
import { FileText, Download } from "lucide-react";

export default function ProcurementSection({ tenders }: { tenders: Tender[] }) {
  if (!tenders || tenders.length === 0) return null;

  return (
    <section id="e-procurement" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-sm font-semibold text-pgp-red tracking-wide uppercase">E-Procurement</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-pgp-navy sm:text-4xl">
            Active Tenders & Guidelines
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Partner with us to build robust supply chains. Review our active tenders and procurement opportunities below.
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100 max-w-5xl mx-auto">
          <div className="divide-y divide-gray-100">
            {tenders.map((tender) => (
              <motion.div 
                key={tender.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="p-6 md:p-8 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1 bg-red-50 p-3 rounded-lg text-pgp-red">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-pgp-navy mb-2">{tender.title}</h3>
                    <p className="text-gray-600 mb-3">{tender.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                      <span className={`px-3 py-1 rounded-full ${tender.status.toLowerCase() === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                        {tender.status}
                      </span>
                      {tender.deadline && (
                        <span className="text-gray-500">Deadline: {new Date(tender.deadline).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {tender.document_url && (
                  <a 
                    href={tender.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-md font-medium text-pgp-navy hover:bg-gray-50 hover:text-pgp-red transition-colors"
                  >
                    <Download size={18} /> Document
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
