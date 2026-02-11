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
        <div className="-mt-[15vh]">
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(3.5rem,10vw,7.5rem)] font-normal tracking-tighter leading-none text-white animate-fade-in-up animation-delay-100">
            SASSH
          </h1>
          <p className="font-[family-name:var(--font-body)] text-[clamp(1rem,2.2vw,1.35rem)] font-normal text-[var(--text-secondary)] mt-6 max-w-[560px] leading-relaxed tracking-tight animate-fade-in-up animation-delay-250">
            South Africa Society for Surgery of the Hand
          </p>
          <p className="font-[family-name:var(--font-body)] text-[clamp(0.875rem,1.5vw,1rem)] font-light text-white/40 mt-4 animate-fade-in-up animation-delay-400">
            Curated articles and resources for hand surgery professionals.
          </p>
        </div>

        {/* Bottom image - faded edges into black background */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[clamp(500px,60vw,900px)] translate-y-[50%]"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0%, black 80%, black 100%), radial-gradient(ellipse 60% 50% at center, black 40%, transparent 75%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 80%, black 100%), -webkit-radial-gradient(ellipse 60% 50% at center, black 40%, transparent 75%)",
            maskComposite: "intersect",
            WebkitMaskComposite: "destination-in",
          }}
        >
          <img
            src="/ideas4.png"
            alt="Mountain biker performing a trick over Cape Town"
            className="w-full h-auto block"
          />
        </div>
      </main>
    </>
  );
}
