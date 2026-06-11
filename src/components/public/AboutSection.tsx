//tes
export default function AboutSection() {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 relative">
            <div className="aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative z-10">
              <img
                src="https://images.unsplash.com/photo-1566847413444-469612348b6c?auto=format&fit=crop&q=80&w=1000"
                alt="Tentang PT Pratama Galuh Perkasa"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-pgp-red/10 rounded-3xl -z-10"></div>
            <div className="absolute top-12 -left-8 bg-white p-6 rounded-2xl shadow-xl z-20 hidden md:block">
              <div className="text-4xl font-black text-pgp-navy">28+</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                Tahun Pengalaman
              </div>
            </div>
          </div>

          <div className="lg:w-1/2">
            <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
              Tentang Perusahaan
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-pgp-navy mb-6 tracking-tight leading-tight">
              Mitra Logistik Terpercaya Sejak 1996
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed font-light">
              <p>
                Berawal dari CV Putra Galuh yang didirikan oleh Bapak Maman
                Rohman pada tahun 1996, PT Pratama Galuh Perkasa (PGP) telah
                berkembang menjadi salah satu perusahaan jasa transportasi dan
                logistik terkemuka yang berpusat di Cilegon, Banten.
              </p>
              <p>
                Selama lebih dari dua dekade, kami telah melayani kebutuhan
                pengiriman barang industri dan komersial dengan cakupan layanan
                seluruh Indonesia hingga jangkauan internasional.
              </p>
              <p>
                Sebagai perusahaan yang memiliki legalitas penuh dan mematuhi
                standar keselamatan industri, visi kami adalah menjadi
                perusahaan logistik terintegrasi dengan kapabilitas layanan
                global yang andal, aman, dan efisien.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-6">
              <div className="border-l-2 border-pgp-red pl-4">
                <div className="font-bold text-pgp-navy mb-1">Visi Kami</div>
                <div className="text-sm text-gray-500">
                  Menjadi penyedia layanan logistik global terpadu yang
                  profesional.
                </div>
              </div>
              <div className="border-l-2 border-pgp-red pl-4">
                <div className="font-bold text-pgp-navy mb-1">Misi Kami</div>
                <div className="text-sm text-gray-500">
                  Memberikan solusi pengiriman tepat waktu, aman, dan
                  transparan.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
