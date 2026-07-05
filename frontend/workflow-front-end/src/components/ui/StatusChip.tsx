import { dynamicStyle } from "../../utils/dynamicStyle";

interface StatusChipProps {
  color: string;
  name: string;
  small?: boolean;
}

export function StatusChip({ color, name, small }: StatusChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap w-fit"
      style={dynamicStyle({
        color,
        background: `color-mix(in oklab, ${color} 16%, transparent)`,
        fontSize: small ? 10 : 10.5,
        padding: small ? "3px 8px" : "3px 9px",
      })}
    >
      {name}
    </span>
  );
}
