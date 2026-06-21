import { dynamicStyle } from "../../utils/dynamicStyle";

interface StatusChipProps {
  color: string;
  name: string;
  small?: boolean;
}

export function StatusChip({ color, name, small }: StatusChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono-tech uppercase tracking-[.08em] border whitespace-nowrap"
      style={dynamicStyle({
        color,
        borderColor: color,
        fontSize: small ? 9 : 10,
        padding: small ? "2px 7px" : "3px 9px",
      })}
    >
      <span
        className="shrink-0 w-[7px] h-[7px]"
        style={dynamicStyle({
          background: color,
          boxShadow: `0 0 calc(8px * var(--glow)) ${color}`,
        })}
      />
      {name}
    </span>
  );
}
