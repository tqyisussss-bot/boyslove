import SeriesCard from "@/components/SeriesCard";

export const SeriesRow = ({ title, items, emptyText = "Aún no hay series por aquí." }) => {
  return (
    <section className="mb-12" data-testid={`row-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <h2 className="font-heading text-lg md:text-2xl font-bold mb-4 px-6 md:px-10">{title}</h2>
      {items.length === 0 ? (
        <p className="text-neutral-500 text-sm px-6 md:px-10">{emptyText}</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide px-6 md:px-10 pb-2">
          {items.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      )}
    </section>
  );
};

export default SeriesRow;
