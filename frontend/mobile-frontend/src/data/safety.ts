import { Flame, HardHat, AlertTriangle, Settings, Shield, Heart, type LucideIcon } from 'lucide-react-native';

export const SAFETY_TOPICS: { id: string; icon: LucideIcon; title: string; color: string; bg: string; content: string[] }[] = [
  {
    id: 'fire',
    icon: Flame,
    title: 'Fire Safety (PCCC)',
    color: '#EF4444',
    bg: '#FEF2F2',
    content: [
      'Know the location of all fire extinguishers on your floor.',
      'Never block fire exits or emergency doors.',
      'Report fire hazards to your supervisor immediately.',
      'In case of fire: ALERT → EVACUATE → CALL 114.',
      'Participate in all quarterly fire drills.',
    ],
  },
  {
    id: 'ppe',
    icon: HardHat,
    title: 'Personal Protective Equipment',
    color: '#D97706',
    bg: '#FFFBEB',
    content: [
      'Wear FR (flame-resistant) uniform at all times on the floor.',
      'Safety gloves are mandatory at cutting machines.',
      'Eye protection required in all chemical handling areas.',
      'Safety footwear must be worn — no sandals on the floor.',
      'Report damaged PPE to your supervisor for replacement.',
    ],
  },
  {
    id: 'evac',
    icon: AlertTriangle,
    title: 'Emergency Evacuation',
    color: '#F59E0B',
    bg: '#FFFBEB',
    content: [
      'Assembly point: Parking Area B, Gate 2.',
      'Follow the green evacuation signs on all floors.',
      'Do NOT use elevators during any evacuation.',
      'Account for all team members at the assembly point.',
      'Do NOT re-enter until cleared by the safety officer.',
    ],
  },
  {
    id: 'machine',
    icon: Settings,
    title: 'Machine Safety Rules',
    color: '#6B7280',
    bg: '#F9FAFB',
    content: [
      'Never operate machinery without proper authorization.',
      'Always lock out / tag out before any maintenance.',
      'Keep hands away from all moving parts at all times.',
      'Report unusual sounds or machine behavior immediately.',
      'Only use tools that are in good working condition.',
    ],
  },
  {
    id: 'chemical',
    icon: Shield,
    title: 'Chemical Handling',
    color: '#7C3AED',
    bg: '#F5F3FF',
    content: [
      'Read the MSDS sheet before handling any chemical.',
      'Store chemicals in designated cabinets only.',
      'Never mix chemicals without supervisor approval.',
      'Wear gloves, goggles and apron when handling chemicals.',
      'In case of spill: isolate area and report immediately.',
    ],
  },
  {
    id: 'firstaid',
    icon: Heart,
    title: 'First Aid Procedures',
    color: '#10B981',
    bg: '#ECFDF5',
    content: [
      'First aid kits: Line A office, Line B office, Cafeteria.',
      'Minor injuries: clean wound, apply bandage, report to supervisor.',
      'Serious injuries: call internal emergency Ext. 119 immediately.',
      'Trained first aiders: Tran Van Duc (Line A), Le Thi Mai (HR).',
      'All injuries must be recorded in the incident log.',
    ],
  },
];

export const EMERGENCY_CONTACTS = [
  { label: 'Factory Emergency', number: 'Ext. 119' },
  { label: 'Security Office', number: 'Ext. 101' },
  { label: 'Medical Room', number: 'Ext. 115' },
  { label: 'Ambulance', number: '115' },
  { label: 'Fire Department', number: '114' },
  { label: 'Police', number: '113' },
];
