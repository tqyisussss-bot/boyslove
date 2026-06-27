import { useEffect, useState } from "react";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import SeriesCard from "@/components/SeriesCard";
import { Heart } from "lucide-react";

const MyList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/favorites").then((r) => {
      setItems(r.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      <div className="pt-28 px-6 md:px-10 max-w-[1600px] mx-auto pb-20">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6 text-[#E07A8F]" />
          <h1 className="font-heading text-3xl md:text-5xl font-black">Mi Lista</h1>
        </div>

        {loading ? (
          <p className="text-neutral-500">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-neutral-950/60 p-10 text-center" data-testid="mylist-empty">
            <p className="text-neutral-400">Aún no has añadido series a tu lista.</p>
            <p className="text-sm text-neutral-600 mt-2">Explora el catálogo y toca el botón "+" para guardar tus favoritas.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-5" data-testid="mylist-grid">
            {items.map((s) => (
              <SeriesCard key={s.id} series={s} size="lg" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyList;
