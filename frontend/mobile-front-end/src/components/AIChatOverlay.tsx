import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Bot, X, Send } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';

type BotMsg = { id: number; self: boolean; text: string; action?: string };

const SUGGESTIONS = ['Leave balance', 'OT policy', 'My payslip', 'Work schedule'];

function getBotReply(msg: string): { text: string; action?: string } {
  const q = msg.toLowerCase();
  if (q.includes('leave') || q.includes('day')) {
    return {
      text: 'You have 8 days of annual leave remaining out of 15 days total. Would you like to submit a leave request?',
      action: 'Submit Leave Request',
    };
  }
  if (q.includes('ot') || q.includes('overtime')) {
    return {
      text: 'The OT policy allows up to 40 hours per month. Your current OT this month is 12 hours. OT registration for next week closes this Friday, July 11.',
      action: 'Register for OT',
    };
  }
  if (q.includes('pay') || q.includes('salary') || q.includes('payslip')) {
    return { text: 'Your June 2025 payslip has been generated: ₫12,800,000 net. Shall I take you to the Payslip section?', action: 'View Payslip' };
  }
  if (q.includes('shift') || q.includes('schedule')) {
    return {
      text: "Your current shift is Morning (6:00 AM – 3:00 PM). Next week's schedule is unchanged. You have one shift swap request pending.",
      action: 'View Schedule',
    };
  }
  if (q.includes('kpi') || q.includes('production') || q.includes('output')) {
    return { text: "Your line's current output rate is 94% of the daily target. Defect rate this week is 1.8%. Great work — that's below the 2% threshold!" };
  }
  return { text: 'I can help you with leave balance, OT policy, payslips, shift schedules, and production KPIs. What would you like to know?' };
}

function TypingDot({ delay }: { delay: number }) {
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -4, duration: 300, delay, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, y]);

  return <Animated.View className="h-1.5 w-1.5 rounded-full bg-gray-400" style={{ transform: [{ translateY: y }] }} />;
}

export function AIChatOverlay({ onClose }: { onClose: () => void }) {
  const [msgs, setMsgs] = useState<BotMsg[]>([
    {
      id: 0,
      self: false,
      text: "Hello! I'm your CMC Global assistant. You can ask me about leave balance, overtime policy, payslips, or work schedules.",
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const send = (text?: string) => {
    const value = text ?? input;
    if (!value.trim() || typing) return;
    setMsgs((prev) => [...prev, { id: Date.now(), self: true, text: value }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = getBotReply(value);
      setMsgs((prev) => [...prev, { id: Date.now() + 1, self: false, ...reply }]);
      setTyping(false);
    }, 950);
  };

  return (
    <View className="absolute inset-0 z-50 justify-end" style={{ backgroundColor: 'rgba(10,24,48,0.5)' }}>
      <Pressable className="absolute inset-0" onPress={onClose} />
      <View className="rounded-t-3xl bg-white shadow-2xl" style={{ height: '76%' }}>
        <View className="items-center pb-1 pt-3">
          <View className="h-1 w-10 rounded-full bg-gray-200" />
        </View>

        <View className="flex-row items-center gap-3 border-b border-gray-100 px-5 py-3">
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ height: 40, width: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
          >
            <Bot size={20} color="#fff" />
          </LinearGradient>
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-900">CMC Assistant</Text>
            <Text className="text-[10px] font-semibold text-green-500">Online · AI-powered</Text>
          </View>
          <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <X size={16} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 py-4" style={{ backgroundColor: colors.background }} contentContainerStyle={{ gap: 16 }}>
          {msgs.map((msg) => (
            <View key={msg.id} className={`flex-row gap-2 ${msg.self ? 'justify-end' : 'justify-start'}`}>
              {!msg.self && (
                <LinearGradient
                  colors={[colors.primary, colors.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ height: 28, width: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
                >
                  <Bot size={13} color="#fff" />
                </LinearGradient>
              )}
              <View style={{ maxWidth: '82%' }}>
                <View
                  className={`rounded-2xl px-4 py-3 ${msg.self ? '' : 'bg-white shadow-sm'}`}
                  style={msg.self ? { backgroundColor: colors.primary } : undefined}
                >
                  <Text className={`text-sm leading-relaxed ${msg.self ? 'text-white' : 'text-gray-800'}`}>{msg.text}</Text>
                </View>
                {msg.action && (
                  <Pressable className="mt-2 self-start rounded-xl px-4 py-2" style={{ backgroundColor: colors.primary }}>
                    <Text className="text-xs font-bold text-white">{msg.action} →</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
          {typing && (
            <View className="flex-row items-center gap-2">
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ height: 28, width: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
              >
                <Bot size={13} color="#fff" />
              </LinearGradient>
              <View className="flex-row items-center gap-1.5 rounded-2xl bg-white px-4 py-3 shadow-sm">
                <TypingDot delay={0} />
                <TypingDot delay={150} />
                <TypingDot delay={300} />
              </View>
            </View>
          )}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-t border-gray-50 bg-white px-5 py-2"
          style={{ maxHeight: 44, flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{ gap: 8, alignItems: 'center' }}
        >
          {SUGGESTIONS.map((q) => (
            <Pressable
              key={q}
              onPress={() => setInput(q)}
              className="rounded-full border px-3 py-1.5"
              style={{ borderColor: '#D1DEF0', backgroundColor: colors.surface }}
            >
              <Text className="text-[11px] font-semibold" style={{ color: colors.primary }}>
                {q}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="flex-row items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
          <View className="flex-1 rounded-full bg-gray-100 px-4 py-2.5">
            <TextInput
              className="text-sm text-gray-800"
              placeholder="Ask me anything..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send()}
            />
          </View>
          <Pressable onPress={() => send()} className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
            <Send size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
