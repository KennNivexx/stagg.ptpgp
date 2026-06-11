interface ImageItem {
  url: string;
  caption?: string;
}

interface GalleryProps {
  show?: boolean;
  title?: string;
  images?: ImageItem[];
}

const defaultImages: ImageItem[] = [
  { url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800", caption: "Gudang PGP" },
  { url: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800", caption: "Armada Truk" },
  { url: "https://images.unsplash.com/photo-1494412519320-aa3da3715a41?auto=format&fit=crop&q=80&w=800", caption: "Loading Barang" },
  { url: "https://images.unsplash.com/photo-1551281136-231362e59cd7?auto=format&fit=crop&q=80&w=800", caption: "Kontainer" },
  { url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800", caption: "Pelabuhan" },
  { url: "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&q=80&w=800", caption: "Tim Operasional" }
];

export default function GallerySection({
  show = true,
  title = "Dokumentasi Aktivitas",
  images = defaultImages,
}: GalleryProps) {
  if (!show) return null;

  const photos = images?.length ? images : defaultImages;

  return (
    <section className="py-24 bg-[#FCF9F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
            Galeri Operasional
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-pgp-navy tracking-tight">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            photo.url ? (
              <div key={index} className="aspect-square rounded-2xl overflow-hidden shadow-sm group relative">
                <img 
                  src={photo.url} 
                  alt={photo.caption || `Gallery ${index + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white font-bold text-sm tracking-widest uppercase">{photo.caption}</span>
                </div>
              </div>
            ) : null
          ))}
        </div>
      </div>
    </section>
  );
}
