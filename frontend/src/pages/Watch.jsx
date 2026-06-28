import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { ArrowLeft, ChevronRight } from "lucide-react";

const getYouTubeId = (url) => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
};
const getVimeoId = (url) => {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
};

// BitChute: https://www.bitchute.com/video/<id>/ or already /embed/<id>/
const getBitChuteEmbed = (url) => {
  if (!/bitchute\.com/i.test(url)) return null;
  if (/bitchute\.com\/embed\//i.test(url)) return url;
  const m = url.match(/bitchute\.com\/video\/([\w-]+)/i);
  return m ? `https://www.bitchute.com/embed/${m[1]}/` : null;
};

// Rumble: https://rumble.com/v<id>-<slug>.html or already /embed/<id>/
const getRumbleEmbed = (url) => {
  if (!/rumble\.com/i.test(url)) return null;
  if (/rumble\.com\/embed\//i.test(url)) return url;
  // Page URL → extract the leading v<id> token from the slug
  const m = url.match(/rumble\.com\/(v[\w]+)/i);
  return m ? `https://rumble.com/embed/${m[1]}/?pub=anonymous` : null;
};

const isDirectVideoFile = (url) => /\.(mp4|webm|m3u8|mov|mkv)(\?|#|$)/i.test(url);

const Watch = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const [episode, setEpisode] = useState(null);
  const [series, setSeries] = useState(null);
  const [allEpisodes, setAllEpisodes] = useState([]);
  const videoRef = useRef(null);
  const lastSavedRef = useRef(0);

  useEffect(() => {
    (async () => {
      const ep = await api.get(`/episodes/${episodeId}`);
      setEpisode(ep.data);
      const [s, list] = await Promise.all([
        api.get(`/series/${ep.data.series_id}`),
        api.get(`/series/${ep.data.series_id}/episodes`),
      ]);
      setSeries(s.data);
      setAllEpisodes(list.data);
    })();
  }, [episodeId]);

  const saveProgress = (position, duration) => {
    if (!episode) return;
    const now = Date.now();
    if (now - lastSavedRef.current < 5000) return;
    lastSavedRef.current = now;
    api.post("/progress", {
      series_id: episode.series_id,
      episode_id: episode.id,
      position: Math.floor(position),
      duration: Math.floor(duration || 0),
    }).catch(() => {});
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    saveProgress(v.currentTime, v.duration);
  };

  if (!episode) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Cargando…</div>;
  }

  const ytId = getYouTubeId(episode.video_url);
  const vmId = !ytId && getVimeoId(episode.video_url);
  const bcEmbed = !ytId && !vmId && getBitChuteEmbed(episode.video_url);
  const rmEmbed = !ytId && !vmId && !bcEmbed && getRumbleEmbed(episode.video_url);
  const useHtml5 = !ytId && !vmId && !bcEmbed && !rmEmbed && isDirectVideoFile(episode.video_url);

  const currentIdx = allEpisodes.findIndex((e) => e.id === episode.id);
  const nextEp = currentIdx >= 0 ? allEpisodes[currentIdx + 1] : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <Link
          to={`/series/${episode.series_id}`}
          data-testid="watch-back"
          className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        {series && (
          <div className="text-sm text-neutral-300">
            <span className="font-semibold">{series.title}</span>
            <span className="text-neutral-500"> · Ep. {episode.episode_number}</span>
          </div>
        )}
        {nextEp && (
          <button
            data-testid="watch-next"
            onClick={() => navigate(`/watch/${nextEp.id}`)}
            className="inline-flex items-center gap-2 text-sm rounded-full border border-white/20 bg-black/50 backdrop-blur-md px-4 py-2 hover:bg-white/10"
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="w-full h-screen flex items-center justify-center">
        {ytId ? (
          <iframe
            data-testid="yt-player"
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
            title={episode.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : vmId ? (
          <iframe
            data-testid="vimeo-player"
            className="w-full h-full"
            src={`https://player.vimeo.com/video/${vmId}?autoplay=1`}
            title={episode.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : bcEmbed ? (
          <iframe
            data-testid="bitchute-player"
            className="w-full h-full"
            src={bcEmbed}
            title={episode.title}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        ) : rmEmbed ? (
          <iframe
            data-testid="rumble-player"
            className="w-full h-full"
            src={rmEmbed}
            title={episode.title}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        ) : useHtml5 ? (
          <video
            data-testid="video-player"
            ref={videoRef}
            src={episode.video_url}
            controls
            autoPlay
            className="w-full h-full"
            onTimeUpdate={onTimeUpdate}
            onEnded={() => saveProgress(videoRef.current?.duration || 0, videoRef.current?.duration || 0)}
          />
        ) : (
          <iframe
            data-testid="generic-player"
            className="w-full h-full"
            src={episode.video_url}
            title={episode.title}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      <div className="px-8 py-6 max-w-4xl mx-auto">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">{episode.title}</h1>
        {episode.description && <p className="mt-2 text-neutral-400 leading-relaxed">{episode.description}</p>}
      </div>
    </div>
  );
};

export default Watch;
