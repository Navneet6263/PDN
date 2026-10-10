import Link from "next/link";
export default function SignInPrompt({
  text = "Sign in to continue",
}: {
  text?: string;
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[#eaeaec] bg-white p-8 text-center">
      <h1 className="text-2xl font-bold">{text}</h1>
      <p className="my-4 text-sm text-gray-500">
        Your bag is kept when you sign in.
      </p>
      <Link href="/account" className="btn-primary">
        Sign in / create account
      </Link>
    </div>
  );
}
