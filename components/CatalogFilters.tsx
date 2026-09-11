"use client";
import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, ArrowDownUp, X } from "lucide-react";
import { emptyFilters, filterCount, matchesFilters } from "@/lib/catalog-filters";
import { orderProducts } from "@/lib/catalog-order";
import CatalogQuickFilters from "./CatalogQuickFilters";
import CatalogFilterFields, { type FilterProps } from "./CatalogFilterFields";
export default function CatalogFilters(
  props: FilterProps & {
    reset: () => void;
    sort: string;
    onSort: (sort: string) => void;
    query: string;
  },
) {
  const [open, setOpen] = useState(false),
    [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(props.value),
    [sort, setSort] = useState(props.sort);
  const dialog = useRef<HTMLDialogElement>(null),
    select = useRef<HTMLSelectElement>(null);
  const sortFocus = useRef(false);
  const sectionFocus = useRef("");
  useEffect(() => {
    const section = document.getElementById("catalog");
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (section) observer.observe(section);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement,
      overflow = document.body.style.overflow;
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
    if (sortFocus.current) select.current?.focus();
    const frame = requestAnimationFrame(() => {
      if (sectionFocus.current)
        dialog.current
          ?.querySelector<HTMLElement>(`[data-filter-section="${sectionFocus.current}"]`)
          ?.scrollIntoView({ block: "start" });
    });
    return () => {
      dialog.current?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
      cancelAnimationFrame(frame);
    };
  }, [open]);
  const show = (sorting = false, section = "") => {
    sectionFocus.current = section;
    setDraft(props.value);
    setSort(props.sort);
    sortFocus.current = sorting;
    setOpen(true);
  };
  const count = orderProducts(
    props.products.filter((p) => matchesFilters(p, draft)),
    props.query,
    sort,
  ).length;
  return (
    <>
      <CatalogQuickFilters {...props} onOpen={(section) => show(false, section)} />
      {visible && (
        <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t bg-white px-3 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-3px_12px_#0000000a] lg:hidden">
          <button
            onClick={() => show(true)}
            className="flex min-h-11 items-center justify-center gap-2 border-r text-xs font-medium text-[#666b79]"
          >
            <ArrowDownUp size={17} />
            Sort
          </button>
          <button
            onClick={() => show()}
            aria-label="Open mobile filters"
            className="flex min-h-11 items-center justify-center gap-2 text-xs font-medium text-[#666b79]"
          >
            <SlidersHorizontal size={17} />
            Filters {filterCount(props.value) ? `(${filterCount(props.value)})` : ""}
          </button>
        </div>
      )}
      {open && (
        <dialog
          ref={dialog}
          aria-labelledby="mobile-filter-title"
          onCancel={() => setOpen(false)}
          className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90dvh] w-full max-w-none rounded-t-2xl bg-white p-0 text-[#282c3f] backdrop:bg-black/35 sm:inset-0 sm:m-auto sm:max-w-xl sm:rounded-2xl"
        >
          <div className="flex items-center justify-between border-b p-5">
            <h2 id="mobile-filter-title" className="font-bold">
              Filter & sort styles
            </h2>
            <button onClick={() => setOpen(false)} aria-label="Close filters">
              <X size={22} />
            </button>
          </div>
          <div className="max-h-[calc(90dvh-155px)] overflow-y-auto p-5">
            <label className="mb-6 block text-xs font-bold uppercase">
              Sort by
              <select
                ref={select}
                aria-label="Mobile sort products"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="field font-normal normal-case"
              >
                <option value="featured">Recommended</option>
                <option value="new">Newest first</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </label>
            <CatalogFilterFields {...props} value={draft} onChange={setDraft} />
          </div>
          <div className="flex items-center gap-4 border-t px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <button
              onClick={() => {
                setDraft(emptyFilters);
                setSort("featured");
              }}
              className="px-3 text-sm font-bold"
            >
              Clear filters
            </button>
            <button
              onClick={() => {
                props.onChange(draft);
                props.onSort(sort);
                setOpen(false);
              }}
              className="flex-1 rounded-lg bg-[#ff3f6c] px-4 py-3 text-sm font-bold text-white"
            >
              Apply filters · {count} {count === 1 ? "style" : "styles"}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
