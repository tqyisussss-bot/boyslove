import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api, { fileUrl } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Play, Sparkles, Heart, Tv } from "lucide-react";

const HERO_IMG = "https://images.unsplash.com/photo-1541800298525-46ec4a4e5c5c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHwyfHxjaW5lbWF0aWMlMjByb21hbnRpYyUyMGFzaWFuJTIwY291cGxlfGVufDB8fHx8MTc4MjQ0NzAzMnww&ixlib=rb-4.1.0&q=85";

const SHOWCASE_IMG = "https://images.unsplash.com/photo-1724582586508-8f06117dc979?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODR8MHwxfHNlYXJjaHwzfHxkYXJrJTIwbW9kZXJuJTIwbGl2aW5nJTIwcm9vbSUyMHR2fGVufDB8fHx8MTc4MjQ0NzAzMnww&ixlib=rb-4.1.0&q=85";

const Landing = () => {
  const [series, setSeries] = useState([]);

  useEffect(() => {
    api.get("/series").then((r) => setSeries(r.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[88vh] min-h-[600px] w-full">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bl-hero-gradient" />
        <div className="absolute inset-0 bl-hero-bottom" />

        <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-10 pt-32 md:pt-40 h-full flex flex-col justify-center">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.35em] uppercase text-[#E07A8F] font-semibold mb-5">
              Plataforma BL · Series asiáticas
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.02]">
              Historias que se atreven a <span className="text-[#E07A8F]">amar</span>.
            </h1>
            <p className="mt-6 text-base md:text-lg text-neutral-300 max-w-xl leading-relaxed">
              Mira los mejores BL dramas de Tailandia, Corea, Japón, China y Filipinas. Capítulo a capítulo, en un solo lugar.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                data-testid="hero-start-btn"
                className="group inline-flex items-center gap-3 rounded-full bg-white text-black px-7 py-3.5 font-semibold hover:bg-neutral-200 transition-colors"
              >
                <Play className="w-5 h-5 fill-current" />
                Empezar a ver
              </Link>
              <Link
                to="/login"
                data-testid="hero-signin-btn"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium border border-white/20 hover:bg-white/5 transition-colors backdrop-blur-md"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-[1600px] mx-auto px-6 md:px-10 py-20 md:py-28 grid md:grid-cols-3 gap-6">
        {[
          { icon: Sparkles, title: "Cuidadosamente curado", desc: "Una colección dedicada a series BL asiáticas, sin perderte entre catálogos enormes." },
          { icon: Tv, title: "Capítulo a capítulo", desc: "Nuevos episodios subidos por nuestro equipo. Continúa donde lo dejaste, sin esfuerzo." },
          { icon: Heart, title: "Tu Mi Lista", desc: "Marca tus favoritas, califícalas y deja reseñas para la comunidad BL." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-neutral-950/60 p-7 hover:border-white/20 transition-colors" data-testid={`feature-${title}`}>
            <Icon className="w-7 h-7 text-[#E07A8F]" />
            <h3 className="font-heading text-xl font-bold mt-5">{title}</h3>
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* Showcase */}
      <section className="relative max-w-[1600px] mx-auto px-6 md:px-10 pb-20 md:pb-28 grid md:grid-cols-2 gap-10 items-center">
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
          <img src={SHOWCASE_IMG} alt="" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#E07A8F] font-semibold mb-3">Donde sea</p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold leading-tight">
            Disfruta en tu TV, laptop o teléfono.
          </h2>
          <p className="mt-5 text-neutral-400 leading-relaxed">
            Una experiencia tipo Netflix dedicada a Boys Love. Reproducción fluida con tus series favoritas siempre a un click.
          </p>
          <Link to="/login" data-testid="showcase-cta" className="inline-flex mt-7 items-center gap-2 rounded-full bg-[#E07A8F] text-black px-6 py-3 text-sm font-semibold hover:bg-[#F090A4] transition-colors">
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* Catalog peek */}
      {series.length > 0 && (
        <section className="pb-24">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-6 px-6 md:px-10">Un vistazo al catálogo</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide px-6 md:px-10">
            {series.slice(0, 12).map((s) => {
              const poster = s.poster_path?.startsWith("http") ? s.poster_path : (s.poster_path ? fileUrl(s.poster_path) : "");
              return (
                <div key={s.id} data-testid={`landing-series-${s.id}`} className="w-40 md:w-48 shrink-0 rounded-xl overflow-hidden bg-neutral-900 bl-card">
                  <div className="aspect-[2/3] bg-neutral-800">
                    {poster && <img src={poster} alt={s.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-semibold truncate">{s.title}</p>
                    <p className="text-xs text-neutral-500">{s.year} · {s.country}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <footer className="border-t border-white/10 py-10 px-6 md:px-10 text-xs text-neutral-500 text-center">
        © {new Date().getFullYear()} Boys Love · Series BL asiáticas
      </footer>
    </div>
  );
};

export default Landing;
