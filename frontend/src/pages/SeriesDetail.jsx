import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api, { fileUrl } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Play, Plus, Check, Star, Calendar, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const SeriesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [series, setSeries] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const load = async () => {
      const [s, e, r, f] = await Promise.all([
        api.get(`/series/${id}`),
        api.get(`/series/${id}/episodes`),
        api.get(`/reviews?series_id=${id}`),
        api.get("/favorites").catch(() => ({ data: [] })),
      ]);
      setSeries(s.data);
      setEpisodes(e.data);
      setReviews(r.data);
      setFavorites(f.data);
    };
    load();
  }, [id]);

  const isFav = favorites.some((s) => s.id === id);

  const toggleFav = async () => {
    if (isFav) {
      await api.delete(`/favorites/${id}`);
      setFavorites(favorites.filter((s) => s.id !== id));
      toast.success("Eliminado de Mi Lista");
    } else {
      await api.post("/favorites", { series_id: id });
      setFavorites([...favorites, series]);
      toast.success("Añadido a Mi Lista");
    }
  };

  const submitReview = async () => {
    try {
      await api.post("/reviews", { series_id: id, rating, comment });
      const r = await api.get(`/reviews?series_id=${id}`);
      setReviews(r.data);
      setComment("");
      toast.success("Reseña publicada");
    } catch (e) {
      toast.error("No se pudo publicar la reseña");
    }
  };

  if (!series) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <Navbar />
        <div className="pt-32 text-center text-neutral-500">Cargando…</div>
      </div>
    );
  }

  const backdrop = series.backdrop_path?.startsWith("http")
    ? series.backdrop_path
    : (series.backdrop_path ? fileUrl(series.backdrop_path) : (series.poster_path?.startsWith("http") ? series.poster_path : (series.poster_path ? fileUrl(series.poster_path) : "")));
  const poster = series.poster_path?.startsWith("http") ? series.poster_path : (series.poster_path ? fileUrl(series.poster_path) : "");

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <section className="relative h-[70vh] min-h-[480px]">
        {backdrop && <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bl-hero-gradient" />
        <div className="absolute inset-0 bl-hero-bottom" />
      </section>

      <div className="relative -mt-48 z-10 max-w-[1400px] mx-auto px-6 md:px-10 pb-20">
        <div className="grid md:grid-cols-[280px_1fr] gap-10">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 aspect-[2/3]">
            {poster && <img src={poster} alt={series.title} className="w-full h-full object-cover" />}
          </div>
          <div>
            <h1 data-testid="series-title" className="font-heading text-4xl md:text-6xl font-black leading-[1.02]">{series.title}</h1>
            {series.original_title && (
              <p className="mt-2 text-neutral-400 italic">{series.original_title}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-300">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {series.year}</span>
              <span className="flex items-center gap-1.5"><Globe2 className="w-4 h-4" /> {series.country}</span>
              {series.avg_rating > 0 && (
                <span className="flex items-center gap-1.5 text-[#E07A8F]">
                  <Star className="w-4 h-4 fill-current" /> {series.avg_rating.toFixed(1)}/5
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-xs border border-white/10 bg-white/5">
                {series.status === "completed" ? "Finalizada" : "En emisión"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(series.genres || []).map((g) => (
                <span key={g} className="text-xs uppercase tracking-wider text-neutral-400 border border-white/10 rounded-full px-3 py-1">{g}</span>
              ))}
            </div>

            <p className="mt-6 text-neutral-300 leading-relaxed max-w-3xl">{series.synopsis}</p>

            {series.cast?.length > 0 && (
              <div className="mt-5 text-sm">
                <span className="text-neutral-500 mr-2 uppercase tracking-wider text-xs">Elenco:</span>
                <span className="text-neutral-300">{series.cast.join(" · ")}</span>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {episodes.length > 0 && (
                <Button
                  data-testid="play-first-ep"
                  onClick={() => navigate(`/watch/${episodes[0].id}`)}
                  className="rounded-full bg-white text-black hover:bg-neutral-200 px-7 h-12"
                >
                  <Play className="w-5 h-5 mr-2 fill-current" /> Reproducir Ep. 1
                </Button>
              )}
              <Button
                data-testid="toggle-favorite"
                onClick={toggleFav}
                variant="outline"
                className="rounded-full border-white/20 bg-black/30 hover:bg-white/10 px-6 h-12 text-white"
              >
                {isFav ? <Check className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                {isFav ? "En Mi Lista" : "Añadir a Mi Lista"}
              </Button>
            </div>
          </div>
        </div>

        {/* Episodes */}
        <section className="mt-16" data-testid="episodes-section">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-6">Episodios ({episodes.length})</h2>
          {episodes.length === 0 ? (
            <p className="text-neutral-500">Aún no hay episodios disponibles.</p>
          ) : (
            <div className="grid gap-3">
              {episodes.map((ep) => {
                const thumb = ep.thumbnail_path?.startsWith("http") ? ep.thumbnail_path : (ep.thumbnail_path ? fileUrl(ep.thumbnail_path) : poster);
                return (
                  <Link
                    key={ep.id}
                    to={`/watch/${ep.id}`}
                    data-testid={`episode-${ep.episode_number}`}
                    className="group grid grid-cols-[160px_1fr_auto] gap-5 items-center bg-neutral-950/60 border border-white/10 rounded-xl p-3 hover:border-white/20 transition-colors"
                  >
                    <div className="aspect-video rounded-md overflow-hidden bg-neutral-800">
                      {thumb && <img src={thumb} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#E07A8F] font-semibold">Episodio {ep.episode_number}</p>
                      <h3 className="font-heading text-lg font-bold mt-1">{ep.title}</h3>
                      {ep.description && <p className="text-sm text-neutral-400 mt-1.5 line-clamp-2 max-w-2xl">{ep.description}</p>}
                    </div>
                    <Play className="w-9 h-9 text-white/40 group-hover:text-[#E07A8F] transition-colors mr-3" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section className="mt-16" data-testid="reviews-section">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-6">Reseñas</h2>

          {user && (
            <div className="mb-8 rounded-xl border border-white/10 bg-neutral-950/60 p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-neutral-400 mr-2">Tu calificación:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    data-testid={`star-${n}`}
                    onClick={() => setRating(n)}
                    className="text-2xl transition-colors"
                  >
                    <Star className={`w-6 h-6 ${n <= rating ? "fill-[#E07A8F] text-[#E07A8F]" : "text-neutral-700"}`} />
                  </button>
                ))}
              </div>
              <Textarea
                data-testid="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="¿Qué te pareció esta serie?"
                className="bg-black/40 border-white/10 text-white resize-none min-h-[90px]"
              />
              <div className="mt-3 flex justify-end">
                <Button data-testid="submit-review" onClick={submitReview} className="rounded-full bg-[#E07A8F] text-black hover:bg-[#F090A4]">
                  Publicar reseña
                </Button>
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-neutral-500">Aún no hay reseñas. Sé el primero.</p>
          ) : (
            <div className="grid gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-white/10 bg-neutral-950/60 p-5" data-testid={`review-${r.id}`}>
                  <div className="flex items-center gap-3">
                    {r.user_picture ? (
                      <img src={r.user_picture} alt="" className="w-9 h-9 rounded-full" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#E07A8F] flex items-center justify-center text-black font-bold text-sm">
                        {r.user_name?.[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold">{r.user_name}</p>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((n) => (
                          <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? "fill-[#E07A8F] text-[#E07A8F]" : "text-neutral-700"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {r.comment && <p className="mt-3 text-neutral-300 leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SeriesDetail;
