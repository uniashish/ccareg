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
  // Checks if we can scroll left or right to enable/disable arrows
  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5); // 5px tolerance
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  // Initial check on mount and when data changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "auto" });
      setCanScrollLeft(false);
      setTimeout(checkScrollButtons, 100);
    }
  }, [ccas.length]);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = current.clientWidth; // Scroll one full screen
      const directionMultiplier = direction === "left" ? -1 : 1;

      current.scrollBy({
        left: scrollAmount * directionMultiplier,
        behavior: "smooth",
      });
    }
  };

  // --- EMPTY STATE ---
  if (ccas.length === 0) {
    return (
      <div className="col-span-full w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center min-h-[300px]">
        <FiSearch size={48} className="text-slate-200 mb-4" />
        <p className="text-slate-400 font-bold">
          No CCAs found matching your criteria
        </p>
        <button
          onClick={onClearSearch}
          className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
        >
          Clear Search
        </button>
      </div>
    );
  }

  // --- MAIN GRID ---
  return (
    <div className="space-y-4">
      {/* NAVIGATION ARROWS (Top Right) */}
      <div className="flex justify-end gap-2">
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
          // snap-start ensures the card aligns perfectly to the left
          <div key={cca.id} className="snap-start h-full">
            <AdminCCACard
              cca={cca}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
