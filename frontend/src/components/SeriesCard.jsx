import { Link } from "react-router-dom";
import { Star, PlayCircle } from "lucide-react";
import { fileUrl } from "@/lib/api";

export const SeriesCard = ({ series, size = "md" }) => {
  const poster = series.poster_path?.startsWith("http")
    ? series.poster_path
    : (series.poster_path ? fileUrl(series.poster_path) : "");
  const widthCls = size === "lg" ? "w-52 md:w-60" : "w-40 md:w-48";

  return (
    <Link
      to={`/series/${series.id}`}
      data-testid={`series-card-${series.id}`}
      className={`bl-card relative ${widthCls} shrink-0 rounded-xl overflow-hidden bg-neutral-900 group`}
    >
      <div className="aspect-[2/3] w-full bg-neutral-800 relative">
        {poster ? (
          <img src={poster} alt={series.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
            Sin póster
          </div>
        )}
        <div className="absolute inset-0 bl-meta-glass opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <h3 className="font-heading text-base font-bold leading-tight line-clamp-2">{series.title}</h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-300">
            <span>{series.year}</span>
            <span className="text-neutral-600">·</span>
            <span>{series.country}</span>
            {series.avg_rating > 0 && (
              <>
                <span className="text-neutral-600">·</span>
                <span className="flex items-center gap-1 text-[#E07A8F]">
                  <Star className="w-3 h-3 fill-current" /> {series.avg_rating.toFixed(1)}
                </span>
              </>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[#E07A8F] text-xs uppercase tracking-[0.2em] font-semibold">
            <PlayCircle className="w-4 h-4" /> Ver ahora
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SeriesCard;
