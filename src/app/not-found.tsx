import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4efe8] px-6 py-12">
      <div className="max-w-xl rounded-[32px] bg-white p-8 text-center shadow-glow">
        <h1 className="text-3xl">Invitation not found</h1>
        <Link className="mt-4 inline-flex rounded-full bg-slate-950 px-5 py-3 text-white" href="/">
          Back to studio
        </Link>
      </div>
    </main>
  );
}
