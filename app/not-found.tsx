import Link from "next/link";
export default function NotFound() {
  return (
    <main className="shell py-32 text-center">
      <p className="eyebrow">404 / Not found</p>
      <h1 className="serif my-6 text-4xl">This piece is no longer here.</h1>
      <Link className="btn" href="/">
        Explore the collection
      </Link>
    </main>
  );
}
