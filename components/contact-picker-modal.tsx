import { useMemo } from 'react';
import {
  Modal,
  SafeAreaView,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useContactStore } from '@/store/use-contact-store';
import type { Contact, ContactGroup } from '@/types';

const GROUP_COLORS: Record<ContactGroup, string> = {
  仕事: '#007AFF',
  学校: '#FF9500',
  プライベート: '#AF52DE',
};

const GROUP_ORDER: ContactGroup[] = ['仕事', '学校', 'プライベート'];

const RELATIONSHIP_COLOR = '#10B981';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (contact: Contact) => void;
};

function getInitial(name: string): string {
  return name.charAt(0);
}

export function ContactPickerModal({ visible, onClose, onSelect }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const contacts = useContactStore((s) => s.contacts);

  const sections = useMemo(() => {
    return GROUP_ORDER
      .map((group) => ({
        title: group,
        data: contacts.filter((c) => c.group === group),
      }))
      .filter((section) => section.data.length > 0);
  }, [contacts]);

  const handleSelect = (contact: Contact) => {
    onSelect(contact);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose}>
              <ThemedText style={[styles.cancelText, { color: colors.tint }]}>
                キャンセル
              </ThemedText>
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold" style={styles.title}>
              連絡先から選択
            </ThemedText>
            <View style={styles.headerRight} />
          </View>

          {/* Content */}
          {contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <IconSymbol name="person.2.fill" size={40} color={colors.icon} />
              </View>
              <ThemedText style={styles.emptyText}>連絡先がありません</ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                連絡先タブから連絡先を追加してください
              </ThemedText>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              renderSectionHeader={({ section }) => (
                <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
                  <View style={[styles.sectionDot, { backgroundColor: GROUP_COLORS[section.title as ContactGroup] }]} />
                  <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: colors.text }]}>
                    {section.title}
                  </ThemedText>
                  <ThemedText style={[styles.sectionCount, { color: colors.textSecondary }]}>
                    {section.data.length}件
                  </ThemedText>
                </View>
              )}
              renderItem={({ item }) => {
                const groupColor = GROUP_COLORS[item.group];
                return (
                  <TouchableOpacity
                    style={[styles.contactItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    activeOpacity={0.6}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={[styles.avatar, { backgroundColor: groupColor + '20' }]}>
                      <ThemedText style={[styles.avatarText, { color: groupColor }]}>
                        {getInitial(item.name)}
                      </ThemedText>
                    </View>
                    <View style={styles.contactInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.contactName}>
                        {item.name}
                      </ThemedText>
                      <ThemedText style={[styles.contactEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.email}
                      </ThemedText>
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: RELATIONSHIP_COLOR + '15' }]}>
                          <ThemedText style={[styles.badgeText, { color: RELATIONSHIP_COLOR }]}>
                            {item.relationship}
                          </ThemedText>
                        </View>
                        <View style={[styles.badge, { backgroundColor: groupColor + '15' }]}>
                          <ThemedText style={[styles.badgeText, { color: groupColor }]}>
                            {item.group}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                    <IconSymbol name="chevron.right" size={14} color={colors.icon} />
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelText: {
    fontSize: 16,
  },
  title: {
    fontSize: 17,
  },
  headerRight: {
    width: 70,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingTop: 20,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    marginRight: 6,
  },
  sectionCount: {
    fontSize: 13,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 13,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
