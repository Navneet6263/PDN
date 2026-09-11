import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
export default function Collections() {
  return (
    <section className="shell pb-20">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-3 text-olive">More than an outfit</p>
          <h2 className="serif text-4xl">For every version of you.</h2>
        </div>
        <span className="hidden text-xs text-muted sm:block">Discover the Terra world</span>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {[
          {
            image: "core-collection",
            title: "The everyday edit",
            subtitle: "Easy layers. Endless possibilities.",
            category: "men",
          },
          {
            image: "sets-and-pairs",
            title: "Better together",
            subtitle: "Considered sets for your special moments.",
            category: "women",
          },
        ].map((c) => (
          <Link
            key={c.image}
            href={`/?category=${c.category}#catalog`}
            className="group relative flex aspect-[5/4] items-end overflow-hidden bg-cream p-7 text-white"
          >
            <Image
              src={`/images/collections/${c.image}.jpg`}
              alt={c.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
            <div className="relative flex w-full items-end justify-between">
              <div>
                <h3 className="serif text-3xl">{c.title}</h3>
                <p className="mt-2 text-xs text-white/80">{c.subtitle}</p>
              </div>
              <ArrowUpRight size={24} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
