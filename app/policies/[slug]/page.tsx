import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getStorefront } from "@/lib/api";
import { policyPages, policyText, type PolicySlug } from "@/lib/policies";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
const title = (slug: string) => policyPages.find(([s]) => s === slug)?.[1];

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { settings } = await getStorefront();
  return title(slug)
    ? {
        title: `${title(slug)} | ${settings.storeName}`,
        alternates: { canonical: `/policies/${slug}` },
      }
    : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const heading = title(slug);
  if (!heading) notFound();
  const { settings } = await getStorefront();
  const blocks = policyText(slug as PolicySlug, settings).split(
    /\n(?=## )|\n\n/,
  );
  return (
    <div className="storefront min-h-screen">
      <Header />
      <main className="shell py-8 md:py-14">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[220px_1fr]">
          <nav aria-label="Policies" className="text-sm">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">
              Help & policies
            </p>
            <ul className="flex flex-wrap gap-2 md:block md:space-y-1">
              {policyPages.map(([s, label]) => (
                <li key={s}>
                  <Link
                    href={`/policies/${s}`}
                    aria-current={s === slug ? "page" : undefined}
                    className={`block rounded-lg px-3 py-2 ${s === slug ? "bg-[#fff0f3] font-bold text-[#ff3f6c]" : "text-[#535766] hover:bg-[#f5f5f6]"}`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <article className="min-w-0">
            <h1 className="text-3xl font-bold">{heading}</h1>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[#3e4152]">
              {blocks.map((block, i) => {
                const [first, ...rest] = block.trim().split("\n");
                if (!first) return null;
                if (first.startsWith("## "))
                  return (
                    <section key={i} className="pt-2">
                      <h2 className="mb-2 text-base font-bold text-[#282c3f]">
                        {first.slice(3)}
                      </h2>
                      <Lines lines={rest} />
                    </section>
                  );
                return <Lines key={i} lines={[first, ...rest]} />;
              })}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Lines({ lines }: { lines: string[] }) {
  const items = lines.filter((l) => l.trim());
  if (items.length && items.every((l) => l.startsWith("- ")))
    return (
      <ul className="list-disc space-y-1 pl-5">
        {items.map((l, i) => (
          <li key={i}>{l.slice(2)}</li>
        ))}
      </ul>
    );
  return <p className="whitespace-pre-line">{items.join("\n")}</p>;
}
