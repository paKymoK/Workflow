import { dynamicStyle } from "../../utils/dynamicStyle";

interface SquareAvatarProps {
  name: string;
  size?: number;
}

export function SquareAvatar({ name, size = 26 }: SquareAvatarProps) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return (
    <span
      className="inline-flex items-center justify-center shrink-0 font-mono-tech text-[var(--acc-1)] border border-[var(--line-strong)] bg-[var(--bg-3)]"
      style={dynamicStyle({ width: size, height: size, fontSize: size * 0.38 })}
    >
      {initials}
    </span>
  );
}
