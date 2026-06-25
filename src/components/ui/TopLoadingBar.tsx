"use client";

export function TopLoadingBar() {
  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#822216] via-[#c2452b] to-[#f37c35] z-[9999] overflow-hidden">
      <style>{`
        @keyframes top-loading-bar-slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(-30%); }
          100% { transform: translateX(100%); }
        }
        .animate-top-loading-bar-slide {
          animation: top-loading-bar-slide 1.5s infinite linear;
        }
      `}</style>
      <div className="h-full w-full bg-white/40 animate-top-loading-bar-slide origin-left" />
    </div>
  );
}
