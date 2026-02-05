import React, { useRef, useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import AdminCCACard from "./AdminCCACard";

export default function CCAGrid({
  ccas,
  onEdit,
  onDelete,
  onViewDetails,
  onClearSearch,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // --- SCROLL CHECKER ---
  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5); // 5px tolerance
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  // Re-check scroll buttons whenever the CCA list changes (e.g. seat update)
  useEffect(() => {
    if (scrollRef.current) {
      // We don't reset scroll position to 0 to keep user context
      setTimeout(checkScrollButtons, 100);
    }
  }, [ccas.length, ccas]); // Trigger on ccas change

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = current.clientWidth;
      const directionMultiplier = direction === "left" ? -1 : 1;

      current.scrollBy({
        left: scrollAmount * directionMultiplier,
        behavior: "smooth",
      });
      setTimeout(checkScrollButtons, 500);
    }
  };

  if (ccas.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
        <div className="inline-block p-4 bg-slate-50 rounded-full mb-4">
          <FiSearch className="text-3xl text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-700">No CCAs Found</h3>
        <p className="text-slate-500 text-sm mb-6">
          Try adjusting your search or add a new activity.
        </p>
        <button
          onClick={onClearSearch}
          className="text-brand-primary font-bold text-sm hover:underline"
        >
          Clear Search
        </button>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* SCROLL BUTTONS */}
      <div className="absolute -top-14 right-0 flex gap-2">
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={`p-2 rounded-lg border transition-all shadow-sm ${
            !canScrollLeft
              ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-black cursor-pointer"
          }`}
          title="Scroll Left"
        >
          <FiChevronLeft size={20} />
        </button>

        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={`p-2 rounded-lg border transition-all shadow-sm ${
            !canScrollRight
              ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-black cursor-pointer"
          }`}
          title="Scroll Right"
        >
          <FiChevronRight size={20} />
        </button>
      </div>

      {/* HORIZONTAL SCROLL CONTAINER */}
      <div
        ref={scrollRef}
        onScroll={checkScrollButtons}
        className="grid grid-rows-2 grid-flow-col gap-6 auto-cols-[calc((100%-3rem)/3)] overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {ccas.map((cca) => (
          <div key={cca.id} className="snap-start h-full">
            <AdminCCACard
              cca={cca}
              onEdit={() => onEdit(cca)}
              onDelete={() => onDelete(cca.id)}
              onViewDetails={() => onViewDetails(cca)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
