// Warm customer-service persona for the public chat widget, replacing the
// generic lucide Bot icon per the UI audit — visitors should feel like
// they're greeted by a person, not a robot icon.
export default function ChatPersonaAvatar({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="persona-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#CC0000" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill="url(#persona-bg)" />
      {/* head */}
      <circle cx="20" cy="16.5" r="6.2" fill="#FFF4EC" />
      {/* shoulders / body */}
      <path d="M8 34c0-6.6 5.4-11 12-11s12 4.4 12 11" fill="#FFF4EC" />
      {/* headset band */}
      <path d="M12.5 15.5a7.5 7.5 0 0 1 15 0" stroke="#1A2530" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <rect x="11.3" y="14.5" width="2.4" height="4.6" rx="1.2" fill="#1A2530" />
      <rect x="26.3" y="14.5" width="2.4" height="4.6" rx="1.2" fill="#1A2530" />
      {/* mic boom */}
      <path d="M27.4 18v2.6a3.2 3.2 0 0 1-3.2 3.2h-2.6" stroke="#1A2530" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="21.6" cy="23.8" r="1" fill="#1A2530" />
    </svg>
  );
}
