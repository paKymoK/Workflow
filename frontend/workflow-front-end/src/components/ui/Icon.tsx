const PATHS: Record<string, string> = {
  home:    "M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10",
  grid:    "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  flow:    "M5 5h5v5H5zM14 14h5v5h-5zM10 7h7M16 10v4",
  gear:    "M12 9a3 3 0 100 6 3 3 0 000-6zM4 12h2M18 12h2M12 4v2M12 18v2M6 6l1.5 1.5M16.5 16.5 18 18M18 6l-1.5 1.5M7.5 16.5 6 18",
  search:  "M11 4a7 7 0 105 12l4 4",
  plus:    "M12 5v14M5 12h14",
  pause:   "M8 5v14M16 5v14",
  play:    "M7 5l12 7-12 7z",
  close:   "M6 6l12 12M18 6 6 18",
  chevR:   "M9 6l6 6-6 6",
  chevD:   "M6 9l6 6 6-6",
  user:    "M12 12a4 4 0 100-8 4 4 0 000 8zM5 20c1.5-4 12.5-4 14 0",
  filter:  "M4 5h16l-6 8v5l-4 2v-7z",
  clock:   "M12 7v5l3 2M12 4a8 8 0 100 16 8 8 0 000-16z",
  bolt:    "M13 3 4 14h6l-1 7 9-11h-6z",
  alert:   "M12 4 2 20h20zM12 10v5M12 17v.5",
  check:   "M5 12l5 5 9-11",
  pin:     "M12 3a6 6 0 016 6c0 5-6 12-6 12S6 14 6 9a6 6 0 016-6z",
  sort:    "M7 4v16M7 20l-3-3M7 4l3 3M17 4v16M17 4l-3 3M17 20l3-3",
  refresh: "M4 12a8 8 0 0114-5l2 2M20 12a8 8 0 01-14 5l-2-2M18 4v5h-5M6 20v-5h5",
};

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
}

export function Icon({ name, size = 16, stroke = 1.6, className }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
