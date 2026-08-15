import Svg, { Polygon, Line, Text as SvgText } from 'react-native-svg';

import { colors } from '@/src/theme/colors';

type RadarPoint = { subject: string; value: number; full: number };

const RINGS = [0.25, 0.5, 0.75, 1];

function pointAt(cx: number, cy: number, radius: number, angleDeg: number) {
  const angle = (Math.PI / 180) * angleDeg;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

export function RadarChart({ data, size = 220 }: { data: RadarPoint[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 28;
  const n = data.length;
  const angleStep = 360 / n;
  const angleFor = (i: number) => -90 + i * angleStep;

  const dataPoints = data
    .map((d, i) => pointAt(cx, cy, radius * (d.value / d.full), angleFor(i)))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    <Svg width={size} height={size}>
      {RINGS.map((ring) => (
        <Polygon
          key={ring}
          points={data.map((_, i) => pointAt(cx, cy, radius * ring, angleFor(i))).map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={colors.border}
          strokeWidth={1}
        />
      ))}
      {data.map((_, i) => {
        const outer = pointAt(cx, cy, radius, angleFor(i));
        return <Line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke={colors.border} strokeWidth={1} />;
      })}
      <Polygon points={dataPoints} fill={colors.primary} fillOpacity={0.15} stroke={colors.primary} strokeWidth={2} />
      {data.map((d, i) => {
        const label = pointAt(cx, cy, radius + 16, angleFor(i));
        const dx = label.x - cx;
        const anchor = dx < -5 ? 'start' : dx > 5 ? 'end' : 'middle';
        return (
          <SvgText
            key={d.subject}
            x={label.x}
            y={label.y}
            fontSize={10}
            fontWeight="600"
            fill={colors.textMuted}
            textAnchor={anchor}
          >
            {d.subject}
          </SvgText>
        );
      })}
    </Svg>
  );
}
