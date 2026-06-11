import { Quote } from "lucide-react";

export default function TestimonialSection() {
  const testimonials = [
    {
      text: "Pengiriman selalu tepat waktu dan tim sangat responsif dalam menangani setiap kendala di lapangan.",
      author: "Budi Haryanto",
      company: "PT Global Manufacturing"
    },
    {
      text: "Partner logistik terpercaya untuk kebutuhan ekspor-impor perusahaan kami. Sangat profesional.",
      author: "Sarah Wijaya",
      company: "Retail Nusantara"
    }
  ];

  return (
    <section className="py-24 bg-white text-pgp-navy">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
            Testimoni Klien
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-pgp-navy">
            Apa Kata Mereka?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((t, index) => (
            <div key={index} className="bg-zinc-50/70 border border-zinc-100 p-10 rounded-3xl relative shadow-sm hover:shadow-md transition-shadow">
              <Quote size={40} className="text-pgp-red/15 absolute top-8 right-8" />
              <p className="text-lg md:text-xl text-zinc-600 font-light leading-relaxed mb-8 italic relative z-10">
                "{t.text}"
              </p>
              <div>
                <div className="font-bold text-pgp-navy">{t.author}</div>
                <div className="text-xs text-zinc-400 font-semibold uppercase tracking-widest mt-1">{t.company}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
