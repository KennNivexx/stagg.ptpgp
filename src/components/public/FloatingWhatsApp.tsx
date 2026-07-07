"use client";

import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  message?: string;
}

export default function FloatingWhatsApp({
  phoneNumber = "6281234567890",
  message = "Halo, saya ingin bertanya tentang layanan PT Pratama Galuh Perkasa.",
}: FloatingWhatsAppProps) {
  const href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hubungi kami via WhatsApp"
      className="fixed bottom-6 right-6 z-40 group"
      initial={{ opacity: 0, scale: 0, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
      <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-600/30 transition-colors">
        <MessageCircle size={26} fill="currentColor" className="text-white" />
      </span>
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
        Chat via WhatsApp
      </span>
    </motion.a>
  );
}
