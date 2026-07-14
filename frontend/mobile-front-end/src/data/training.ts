// Placeholder data — swap for real API calls (content-service) once that endpoint exists.
import { Play, Layers, FileText } from 'lucide-react-native';

export const TRAINING_CATS = ['All', 'Onboarding', 'Skills Training', 'Safety Training', 'Company SOPs'];

export type TrainingDoc = {
  id: number;
  title: string;
  cat: string;
  fileType: 'pdf' | 'video' | 'slides';
  meta: string;
  date: string;
  recent?: boolean;
};

export const TRAINING_DOCS: TrainingDoc[] = [
  { id: 1, title: 'New Employee Onboarding Guide', cat: 'Onboarding', fileType: 'pdf', meta: '3.2 MB', date: 'Jan 15, 2025', recent: true },
  { id: 2, title: 'Fire Safety & Evacuation Procedures', cat: 'Safety Training', fileType: 'video', meta: '8 min', date: 'Mar 5, 2025', recent: true },
  { id: 3, title: 'Sewing Machine Operation — Advanced', cat: 'Skills Training', fileType: 'video', meta: '22 min', date: 'Apr 10, 2025', recent: true },
  { id: 4, title: 'HR Policies Overview', cat: 'Onboarding', fileType: 'slides', meta: '18 slides', date: 'Jan 20, 2025', recent: false },
  { id: 5, title: 'Quality Control Checklist SOP', cat: 'Company SOPs', fileType: 'pdf', meta: '0.9 MB', date: 'May 1, 2025', recent: false },
  { id: 6, title: 'PPE Usage & Care Guidelines', cat: 'Safety Training', fileType: 'pdf', meta: '1.2 MB', date: 'Jun 12, 2025', recent: false },
  { id: 7, title: 'Line B Production SOP', cat: 'Company SOPs', fileType: 'pdf', meta: '2.1 MB', date: 'Jun 28, 2025', recent: false },
  { id: 8, title: 'Factory Floor Safety Rules', cat: 'Safety Training', fileType: 'pdf', meta: '1.8 MB', date: 'Feb 20, 2025', recent: false },
];

export function getFileIcon(type: TrainingDoc['fileType']) {
  if (type === 'video') return { icon: Play, color: '#EF4444', bg: '#FEF2F2', label: 'VIDEO' };
  if (type === 'slides') return { icon: Layers, color: '#8B5CF6', bg: '#F5F3FF', label: 'SLIDES' };
  return { icon: FileText, color: '#1558A8', bg: '#EEF3FA', label: 'PDF' };
}
