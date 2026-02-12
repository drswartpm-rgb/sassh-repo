import Nav from "@/components/Nav";

export default function Home() {
  return (
    <>
      <Nav />

      {/* Background orb */}
      <div
        className="fixed -bottom-[30%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Hero */}
      <main className="flex flex-col items-center justify-center h-screen px-6 text-center relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 w-full h-full z-0"
          style={{
            backgroundImage: "url('/ideas6.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.03,
          }}
        />

        <div className="-mt-[15vh] relative z-10">
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(3.5rem,10vw,7.5rem)] font-normal tracking-tighter leading-none text-[var(--text)] animate-fade-in-up animation-delay-100">
            SASSH
          </h1>
          <p className="font-[family-name:var(--font-body)] text-[clamp(1rem,2.2vw,1.35rem)] font-normal text-[var(--text-secondary)] mt-6 max-w-[560px] leading-relaxed tracking-tight animate-fade-in-up animation-delay-250">
            South Africa Society for Surgery of the Hand
          </p>
          <p className="font-[family-name:var(--font-body)] text-[clamp(0.875rem,1.5vw,1rem)] font-light text-[var(--text-muted)] mt-4 animate-fade-in-up animation-delay-400">
            Curated articles and resources for hand surgery professionals.
          </p>
        </div>
      </main>
    </>
  );
}
