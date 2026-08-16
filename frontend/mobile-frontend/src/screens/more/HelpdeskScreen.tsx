import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, CheckCircle, Camera, Send, Headphones } from 'lucide-react-native';

import { colors, statusColors } from '@/src/theme/colors';
import { TICKET_CATS, INIT_TICKETS, type TicketData, type TicketPriority, type TicketThread } from '@/src/data/helpdesk';

const PRIORITY_STYLE: Record<TicketPriority, { sel: string; bg: string }> = {
  Low: { sel: '#6B7280', bg: '#F3F4F6' },
  Medium: { sel: '#B45309', bg: '#FEF3C7' },
  High: { sel: '#B91C1C', bg: '#FEE2E2' },
};

function TicketDetail({ ticket, onBack }: { ticket: TicketData; onBack: () => void }) {
  const [thread, setThread] = useState<TicketThread[]>(ticket.thread);
  const [reply, setReply] = useState('');
  const sc = statusColors[ticket.status];
  const pc = statusColors[ticket.priority];

  const send = () => {
    if (!reply.trim()) return;
    const d = new Date();
    setThread((prev) => [
      ...prev,
      {
        sender: 'Nguyen Thi Lan',
        self: true,
        text: reply,
        time: `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      },
    ]);
    setReply('');
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 pb-3 pt-4">
        <Pressable onPress={onBack} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-sm font-bold text-gray-900">{ticket.id}</Text>
          <Text className="text-[10px] text-gray-400">
            {ticket.category} · {ticket.date}
          </Text>
        </View>
        <Text className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: sc.bg, color: sc.text }}>
          {ticket.status}
        </Text>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="mx-4 mb-3 mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <Text className="mb-2 text-sm font-semibold text-gray-900">{ticket.desc}</Text>
          <View className="flex-row gap-2">
            <Text className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: pc.bg, color: pc.text }}>
              {ticket.priority} Priority
            </Text>
            <Text className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: sc.bg, color: sc.text }}>
              {ticket.status}
            </Text>
          </View>
        </View>

        <View className="gap-3 px-4 pb-24">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Conversation</Text>
          {thread.map((msg, i) => (
            <View key={i} className={`flex-row gap-2 ${msg.self ? 'justify-end' : 'justify-start'}`}>
              {!msg.self && (
                <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
                  <Text className="text-[10px] font-bold text-white">IT</Text>
                </View>
              )}
              <View style={styles.messageBubbleWrap}>
                {!msg.self && <Text className="ml-1 mb-1 text-[10px] text-gray-500">IT Support</Text>}
                <View
                  className={`rounded-2xl px-4 py-3 ${msg.self ? 'rounded-tr-sm' : 'rounded-tl-sm bg-white shadow-sm'}`}
                  style={msg.self ? { backgroundColor: colors.primary } : undefined}
                >
                  <Text className={`text-sm leading-relaxed ${msg.self ? 'text-white' : 'text-gray-800'}`}>{msg.text}</Text>
                </View>
                <Text className={`mt-1 text-[9px] text-gray-400 ${msg.self ? 'mr-1 text-right' : 'ml-1'}`}>{msg.time}</Text>
              </View>
            </View>
          ))}
          {ticket.status === 'Resolved' && (
            <View className="flex-row items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3">
              <CheckCircle size={14} color="#16A34A" />
              <Text className="text-xs font-semibold text-green-700">This ticket has been resolved.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {ticket.status !== 'Resolved' && (
        <View className="flex-row items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
          <View className="flex-1 rounded-full bg-gray-100 px-4 py-2.5">
            <TextInput
              className="text-sm text-gray-800"
              placeholder="Reply to IT support..."
              placeholderTextColor="#9CA3AF"
              value={reply}
              onChangeText={setReply}
              onSubmitEditing={send}
            />
          </View>
          <Pressable onPress={send} className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
            <Send size={15} color="#fff" />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function HelpdeskScreen() {
  const navigation = useNavigation();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>(INIT_TICKETS);
  const [category, setCategory] = useState('Hardware');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [desc, setDesc] = useState('');
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (selectedTicket) return <TicketDetail ticket={selectedTicket} onBack={() => setSelectedTicket(null)} />;

  const counts = {
    Open: tickets.filter((t) => t.status === 'Open').length,
    'In Progress': tickets.filter((t) => t.status === 'In Progress').length,
    Resolved: tickets.filter((t) => t.status === 'Resolved').length,
  };

  const submitTicket = () => {
    if (!desc.trim()) return;
    const catData = TICKET_CATS.find((c) => c.label === category) ?? TICKET_CATS[0];
    setTickets((prev) => [
      {
        id: `TK-2025-0${Math.floor(Math.random() * 50) + 860}`,
        category,
        catIcon: catData.icon,
        desc,
        priority,
        status: 'Open',
        date: 'Jul 7, 2025',
        thread: [{ sender: 'Nguyen Thi Lan', self: true, text: desc, time: 'Jul 7, now' }],
      },
      ...prev,
    ]);
    setDesc('');
    setToast(true);
    setView('list');
  };

  if (view === 'create') {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-white">
        <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 pb-3 pt-4">
          <Pressable onPress={() => setView('list')} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
            <ArrowLeft size={18} color={colors.primary} />
          </Pressable>
          <Text className="text-base font-bold text-gray-900">New Support Ticket</Text>
        </View>

        <ScrollView className="flex-1 px-4 pt-4" style={{ backgroundColor: colors.background }} contentContainerStyle={styles.createScrollContent}>
          <View className="rounded-2xl bg-white p-4 shadow-sm">
            <Text className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Category</Text>
            <View className="flex-row flex-wrap justify-between gap-y-2">
              {TICKET_CATS.map((c) => (
                <Pressable
                  key={c.label}
                  onPress={() => setCategory(c.label)}
                  className="items-center gap-1.5 rounded-xl border-2 px-2 py-3"
                  style={category === c.label ? styles.categoryCardActive : styles.categoryCardInactive}
                >
                  <c.icon size={18} color={category === c.label ? colors.primary : colors.textMuted} />
                  <Text
                    className="text-center text-[10px] font-semibold leading-tight"
                    style={{ color: category === c.label ? colors.primary : colors.textMuted }}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="rounded-2xl bg-white p-4 shadow-sm">
            <Text className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Priority</Text>
            <View className="flex-row gap-2">
              {(['Low', 'Medium', 'High'] as const).map((p) => {
                const pc = PRIORITY_STYLE[p];
                const active = priority === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPriority(p)}
                    className="flex-1 items-center rounded-xl border-2 py-2.5"
                    style={active ? { borderColor: pc.sel, backgroundColor: pc.bg } : styles.priorityPillInactive}
                  >
                    <Text className="text-xs font-bold" style={{ color: active ? pc.sel : colors.textMuted }}>
                      {p}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="rounded-2xl bg-white p-4 shadow-sm">
            <Text className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={desc}
              onChangeText={setDesc}
              placeholder="Describe your issue in detail..."
              placeholderTextColor="#9CA3AF"
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm leading-relaxed text-gray-800"
              style={styles.descriptionInput}
            />
          </View>

          <View className="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: colors.surface }}>
              <Camera size={17} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-800">Attach Screenshot</Text>
              <Text className="text-xs text-gray-400">Optional · JPG, PNG up to 5MB</Text>
            </View>
            <Pressable className="rounded-lg px-3 py-1.5" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                Browse
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={submitTicket} className="items-center rounded-2xl py-4" style={{ backgroundColor: colors.primary }}>
            <Text className="text-sm font-bold text-white">Submit Ticket</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 pb-3 pt-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surface }}
        >
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900">IT Helpdesk</Text>
          <Text className="text-xs text-gray-400">Support tickets</Text>
        </View>
        <Pressable
          onPress={() => setView('create')}
          className="flex-row items-center gap-1.5 rounded-xl px-3 py-2"
          style={{ backgroundColor: colors.primary }}
        >
          <Plus size={13} color="#fff" />
          <Text className="text-xs font-bold text-white">New Ticket</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scrollContent}>
        <View className="mb-3 flex-row gap-2 px-4 pt-4">
          {[
            { label: 'Open', count: counts.Open, color: '#1D4ED8' },
            { label: 'In Progress', count: counts['In Progress'], color: '#B45309' },
            { label: 'Resolved', count: counts.Resolved, color: '#15803D' },
          ].map((s) => (
            <View key={s.label} className="flex-1 items-center rounded-2xl bg-white p-3 shadow-sm">
              <Text className="text-2xl font-bold" style={{ color: s.color }}>
                {s.count}
              </Text>
              <Text className="mt-0.5 text-[9px] font-semibold text-gray-400">{s.label}</Text>
            </View>
          ))}
        </View>

        {toast && (
          <View className="mx-4 mb-3 flex-row items-center gap-2 rounded-xl border border-green-200 bg-green-100 px-4 py-3">
            <CheckCircle size={14} color="#16A34A" />
            <Text className="text-xs font-semibold text-green-700">Ticket submitted! IT will respond within 1 business day.</Text>
          </View>
        )}

        <View className="px-4">
          <Text className="mb-3 text-sm font-bold text-gray-900">My Tickets</Text>
          {tickets.length === 0 ? (
            <View className="items-center rounded-2xl bg-white p-8 shadow-sm">
              <Headphones size={32} color="#E5E7EB" />
              <Text className="mt-2 text-sm font-semibold text-gray-400">No tickets yet</Text>
              <Text className="mt-1 text-xs text-gray-300">Create a ticket to get IT support</Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {tickets.map((ticket) => {
                const sc = statusColors[ticket.status];
                const CatIcon = ticket.catIcon;
                return (
                  <Pressable
                    key={ticket.id}
                    onPress={() => setSelectedTicket(ticket)}
                    className="flex-row items-start gap-3 rounded-2xl bg-white p-4 shadow-sm"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: colors.surface }}>
                      <CatIcon size={18} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <View className="mb-1 flex-row items-center justify-between gap-2">
                        <Text className="text-[10px] font-semibold text-gray-400">{ticket.id}</Text>
                        <Text className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: sc.bg, color: sc.text }}>
                          {ticket.status}
                        </Text>
                      </View>
                      <Text className="text-sm font-semibold leading-snug text-gray-900" numberOfLines={2}>
                        {ticket.desc}
                      </Text>
                      <Text className="mt-1 text-[10px] text-gray-400">
                        {ticket.category} · {ticket.date}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  messageBubbleWrap: {
    maxWidth: '78%',
  },
  createScrollContent: {
    paddingBottom: 24,
    gap: 16,
  },
  categoryCardActive: {
    width: '31%',
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  categoryCardInactive: {
    width: '31%',
    borderColor: colors.border,
    backgroundColor: '#F8FAFC',
  },
  priorityPillInactive: {
    borderColor: colors.border,
    backgroundColor: '#F8FAFC',
  },
  descriptionInput: {
    textAlignVertical: 'top',
    minHeight: 96,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
