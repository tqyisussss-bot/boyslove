import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { fileUrl } from "@/lib/api";
import Navbar from "@/components/Navbar";
import SeriesRow from "@/components/SeriesRow";
import { Play, Info, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const ALL_GENRES = ["Romance", "Drama", "Comedia", "Universitario", "Fantasía", "Histórico", "Musical"];

const Browse = () => {
  const [series, setSeries] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [continueList, setContinueList] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get("/series").then((r) => {
      setSeries(r.data);
      const f = r.data.find((s) => s.featured) || r.data[0];
      setFeatured(f);
    });
    api.get("/progress/continue").then((r) => setContinueList(r.data)).catch(() => {});
  }, []);

  const heroPoster = featured?.backdrop_path?.startsWith("http")
    ? featured.backdrop_path
    : (featured?.backdrop_path ? fileUrl(featured.backdrop_path) : (featured?.poster_path?.startsWith("http") ? featured.poster_path : (featured?.poster_path ? fileUrl(featured.poster_path) : "")));

  const filtered = query
    ? series.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))
    : series;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      {/* Hero featured */}
      {featured && (
        <section className="relative h-[85vh] min-h-[560px] w-full" data-testid="browse-hero">
          {heroPoster && (
            <img src={heroPoster} alt={featured.title} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bl-hero-gradient" />
          <div className="absolute inset-0 bl-hero-bottom" />
          <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-10 pt-32 md:pt-40 h-full flex flex-col justify-center">
            <p className="text-xs tracking-[0.35em] uppercase text-[#E07A8F] font-semibold mb-4">Destacado</p>
            <h1 className="font-heading text-4xl md:text-6xl font-black max-w-2xl leading-[1.05]">{featured.title}</h1>
            <p className="mt-5 text-neutral-300 max-w-xl line-clamp-3 leading-relaxed">{featured.synopsis}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={`/series/${featured.id}`} data-testid="hero-watch" className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 font-semibold hover:bg-neutral-200 transition-colors">
                <Play className="w-5 h-5 fill-current" /> Reproducir
              </Link>
              <Link to={`/series/${featured.id}`} data-testid="hero-info" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 backdrop-blur-md px-6 py-3 text-sm hover:bg-white/10 transition-colors">
                <Info className="w-5 h-5" /> Más información
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Search */}
      <section className="relative z-20 -mt-16 px-6 md:px-10 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/60 backdrop-blur-xl px-5 py-3 max-w-xl">
          <Search className="w-4 h-4 text-neutral-400" />
          <Input
            data-testid="browse-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar series…"
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-7 placeholder:text-neutral-500"
          />
        </div>
      </section>

      <div className="pt-16">
        {/* Continue watching */}
        {continueList.length > 0 && !query && (
          <section className="mb-12" data-testid="row-continue">
            <h2 className="font-heading text-lg md:text-2xl font-bold mb-4 px-6 md:px-10">Continuar viendo</h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide px-6 md:px-10 pb-2">
              {continueList.map((item) => {
                const s = item.series;
                const ep = item.episode;
                const poster = s.poster_path?.startsWith("http") ? s.poster_path : (s.poster_path ? fileUrl(s.poster_path) : "");
                const pct = item.progress.duration > 0 ? Math.min(100, (item.progress.position / item.progress.duration) * 100) : 0;
                return (
                  <Link
                    key={item.progress.episode_id}
                    to={ep ? `/watch/${ep.id}` : `/series/${s.id}`}
                    data-testid={`continue-${s.id}`}
                    className="bl-card w-64 shrink-0 rounded-xl overflow-hidden bg-neutral-900 group"
                  >
                    <div className="aspect-video bg-neutral-800 relative">
                      {poster && <img src={poster} alt={s.title} className="w-full h-full object-cover" />}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
                        <div className="h-full bg-[#E07A8F]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold truncate">{s.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {ep ? `Ep. ${ep.episode_number} · ${ep.title}` : "Continuar"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* All series */}
        <SeriesRow title={query ? "Resultados" : "Todas las series"} items={filtered} emptyText="Aún no hay series. Pide al admin que suba alguna." />

        {/* By genre */}
        {!query && ALL_GENRES.map((g) => {
          const items = series.filter((s) => (s.genres || []).includes(g));
          if (items.length === 0) return null;
          return <SeriesRow key={g} title={g} items={items} />;
        })}
      </div>

      <div className="h-20" />
    </div>
  );
};

export default Browse;
