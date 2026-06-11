"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HeartPulse, Coins, GraduationCap } from "lucide-react";
import InteractiveCareer from "./InteractiveCareer";
import { Job } from "@/types";

export default function AnimatedCareerWrapper({ jobs }: { jobs: Job[] }) {
  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 100, damping: 15 }
    }
  };

  const cardHoverEffect = {
    hover: {
      y: -8,
      scale: 1.02,
      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      borderColor: "rgba(221, 44, 0, 0.2)"
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-[#FDFDFD]"
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50/60 via-[#FCFBF9] to-orange-100/30 text-pgp-navy relative overflow-hidden py-28 lg:py-36 border-b border-orange-500/10">
        {/* Animated background particles */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, -30, 0] 
            }}
            transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-orange-200/40 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              x: [0, -40, 0],
              y: [0, 40, 0] 
            }}
            transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pgp-red/5 rounded-full blur-3xl"
          />
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-90 pointer-events-none hidden md:block z-0">
          <img 
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=1000" 
            className="w-full h-full object-cover" 
            style={{ 
              maskImage: 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))', 
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))' 
            }} 
            alt="Team working" 
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <motion.span 
              variants={itemVariants}
              className="inline-block py-1.5 px-4 bg-pgp-red/10 text-pgp-red font-bold text-[11px] tracking-wider uppercase rounded-full mb-6 border border-pgp-red/20 backdrop-blur-sm"
            >
              Karir di PGP
            </motion.span>
            
            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight text-zinc-950"
            >
              Sumber Daya Manusia <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pgp-red to-orange-500">
                Sebagai Kunci Kesuksesan
              </span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-zinc-900 text-base mb-10 leading-relaxed max-w-lg font-normal"
            >
              Bergabunglah dengan tim profesional yang berdedikasi untuk mendefinisikan ulang logistik global. Di PT Pratama Galuh Perkasa, kami percaya bahwa aset terbesar kami adalah keahlian dan semangat karyawan kami.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap gap-4"
            >
              <Link href="#jobs" className="bg-pgp-red text-white px-8 py-3.5 rounded-full font-bold hover:bg-pgp-red-hover transition-all duration-300 shadow-lg shadow-pgp-red/25 hover:shadow-pgp-red/40 hover:-translate-y-0.5 text-sm">
                Lihat Lowongan
              </Link>
              <Link href="#life" className="bg-white hover:bg-zinc-50 text-pgp-navy border border-zinc-200/80 px-8 py-3.5 rounded-full font-bold transition-all duration-300 shadow-sm text-sm">
                Jelajahi Kehidupan di PGP
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Floating Stat Card inside Hero */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, type: "spring" }}
          whileHover={{ scale: 1.05 }}
          className="absolute bottom-12 right-12 lg:right-32 bg-white/95 text-pgp-navy p-6 rounded-2xl shadow-2xl hidden lg:block border border-orange-100 backdrop-blur-md max-w-[260px]"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-pgp-red/10 text-pgp-red rounded-xl flex items-center justify-center border border-pgp-red/25">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="font-bold text-lg text-pgp-red">500+ Ahli</span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed font-light">Mendorong keandalan industri di seluruh nusantara secara profesional.</p>
        </motion.div>
      </section>

      {/* Stats Banner */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-100">
            {[
              { val: "98%", label: "Kepuasan Karyawan" },
              { val: "18+", label: "Hub Nasional" },
              { val: "100%", label: "Komitmen Keselamatan" },
              { val: "24/7", label: "Keunggulan Operasional" }
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="px-4"
              >
                <div className="text-3xl lg:text-4xl font-extrabold text-pgp-red mb-1">{stat.val}</div>
                <div className="text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Life at PGP */}
      <section id="life" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-3 block">Budaya Kerja</span>
          <h2 className="text-3xl md:text-4xl font-bold text-pgp-navy tracking-tight mb-4">Kehidupan di PGP</h2>
          <p className="text-base text-gray-500 max-w-2xl mx-auto font-light">
            Temukan ruang kerja di mana presisi industri bertemu dengan pertumbuhan profesional dan komunitas yang saling mendukung.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[500px]">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 1 }}
            className="relative rounded-3xl overflow-hidden group shadow-lg h-[300px] md:h-full"
          >
            <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Team Collaboration" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-900/20 to-transparent flex items-end p-8">
              <div>
                <span className="px-2.5 py-1 bg-pgp-red/80 text-white text-[10px] font-bold rounded-full uppercase tracking-wider mb-3 inline-block">Teamwork</span>
                <h3 className="text-white text-xl font-bold mb-2">Kolaborasi Tim</h3>
                <p className="text-zinc-300 text-sm font-light">Bekerja sama untuk memecahkan tantangan logistik yang kompleks.</p>
              </div>
            </div>
          </motion.div>
          
          <div className="grid grid-rows-2 gap-6 h-full">
            <div className="grid grid-cols-2 gap-6 h-full">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative rounded-3xl overflow-hidden shadow-md"
              >
                <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Focus" />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="relative rounded-3xl overflow-hidden shadow-md"
              >
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Discussion" />
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", duration: 1 }}
              className="relative rounded-3xl overflow-hidden group shadow-lg"
            >
              <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Training" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-900/20 to-transparent flex items-end p-8">
                <div>
                  <span className="px-2.5 py-1 bg-pgp-red/80 text-white text-[10px] font-bold rounded-full uppercase tracking-wider mb-3 inline-block">Career Growth</span>
                  <h3 className="text-white text-xl font-bold mb-2">Pertumbuhan & Pengembangan</h3>
                  <p className="text-zinc-300 text-sm font-light">Pelatihan berkelanjutan dan jalur karir untuk setiap peran.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Empowering Our People (Benefits) */}
      <section className="py-24 bg-orange-50/25 border-y border-orange-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-gray-200/60">
            <div className="max-w-2xl">
              <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-3 block">Manfaat Utama</span>
              <h2 className="text-3xl md:text-4xl font-bold text-pgp-navy tracking-tight mb-4">Memberdayakan Karyawan Kami</h2>
              <p className="text-base text-gray-500 font-light">
                Kami menyediakan paket manfaat komprehensif yang dirancang untuk mendukung kesehatan, kesejahteraan finansial, dan pengembangan pribadi Anda.
              </p>
            </div>
            <div className="hidden md:flex gap-2.5 mb-2">
              <motion.div animate={{ width: [16, 40, 16] }} transition={{ repeat: Infinity, duration: 2 }} className="h-1.5 bg-pgp-red rounded-full" />
              <div className="w-6 h-1.5 bg-orange-200 rounded-full" />
              <div className="w-6 h-1.5 bg-orange-100 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <HeartPulse size={24} />,
                title: "Kesehatan & Kesejahteraan",
                desc: "Asuransi medis, gigi, dan penglihatan yang komprehensif untuk Anda dan keluarga, ditambah inisiatif kesejahteraan."
              },
              {
                icon: <Coins size={24} />,
                title: "Gaji Kompetitif",
                desc: "Paket kompensasi terkemuka di industri termasuk bonus berbasis kinerja dan gaji ke-13."
              },
              {
                icon: <GraduationCap size={24} />,
                title: "Dana Pendidikan",
                desc: "Dukungan untuk pendidikan lanjutan dan sertifikasi profesional untuk membantu Anda berprestasi dalam karir Anda."
              }
            ].map((benefit, idx) => (
              <motion.div 
                key={benefit.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.15 }}
                whileHover="hover"
                variants={cardHoverEffect}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-all duration-300 cursor-pointer"
              >
                <div className="w-12 h-12 bg-orange-50/80 text-pgp-red flex items-center justify-center rounded-2xl mb-8 border border-orange-100">
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-lg text-pgp-navy mb-3">{benefit.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-light">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Positions */}
      <section id="jobs" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center md:text-left md:flex justify-between items-end border-b border-gray-100 pb-8">
          <div>
            <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-3 block">Lowongan Kerja</span>
            <h2 className="text-3xl md:text-4xl font-bold text-pgp-navy tracking-tight mb-2">Posisi Tersedia</h2>
            <p className="text-sm text-gray-500 font-light">Temukan peluang karir yang menantang dan bangun masa depan Anda bersama kami.</p>
          </div>
        </div>

        <InteractiveCareer initialJobs={jobs || []} />
      </section>
    </motion.div>
  );
}
