import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useContactStore } from '@/store/use-contact-store';
import { isValidEmail } from '@/lib/validation';
import type { Contact, ContactGroup, Relationship } from '@/types';

type FilterTab = 'すべて' | ContactGroup;

const FILTER_TABS: FilterTab[] = ['すべて', '仕事', '学校', 'プライベート'];

const RELATIONSHIP_OPTIONS: Relationship[] = [
  '上司',
  '同僚',
  '部下',
  '取引先',
  '顧客',
  '教授',
  '先輩',
  '友人',
  '家族',
  '初対面',
];

const GROUP_OPTIONS: ContactGroup[] = ['仕事', '学校', 'プライベート'];

const GROUP_COLORS: Record<ContactGroup, string> = {
  仕事: '#007AFF',
  学校: '#FF9500',
  プライベート: '#AF52DE',
};

const RELATIONSHIP_COLOR = '#10B981';

function getInitial(name: string): string {
  return name.charAt(0);
}

function ContactItem({
  contact,
  colors,
  onLongPress,
}: {
  contact: Contact;
  colors: (typeof Colors)['light'];
  onLongPress: () => void;
}) {
  const groupColor = GROUP_COLORS[contact.group];

  return (
    <TouchableOpacity
      style={[styles.contactItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.6}
      onLongPress={onLongPress}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: groupColor + '20' }]}>
        <ThemedText style={[styles.avatarText, { color: groupColor }]}>
          {getInitial(contact.name)}
        </ThemedText>
      </View>

      <View style={styles.contactInfo}>
        <ThemedText type="defaultSemiBold" style={styles.contactName}>
          {contact.name}
        </ThemedText>
        <ThemedText style={[styles.contactEmail, { color: colors.textSecondary }]} numberOfLines={1}>
          {contact.email}
        </ThemedText>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badge,
              { backgroundColor: RELATIONSHIP_COLOR + '15' },
            ]}
          >
            <ThemedText
              style={[styles.badgeText, { color: RELATIONSHIP_COLOR }]}
            >
              {contact.relationship}
            </ThemedText>
          </View>
          <View
            style={[styles.badge, { backgroundColor: groupColor + '15' }]}
          >
            <ThemedText style={[styles.badgeText, { color: groupColor }]}>
              {contact.group}
            </ThemedText>
          </View>
        </View>
      </View>
      <IconSymbol
        name="chevron.right"
        size={14}
        color={colors.icon}
      />
    </TouchableOpacity>
  );
}

function EmptyContactState({ colors }: { colors: (typeof Colors)['light'] }) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <IconSymbol name="person.2.fill" size={40} color={colors.icon} />
      </View>
      <ThemedText style={styles.emptyText}>連絡先がありません</ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        右上の「+」ボタンから連絡先を追加しましょう
      </ThemedText>
    </View>
  );
}

export default function ContactsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const contacts = useContactStore((s) => s.contacts);
  const addContact = useContactStore((s) => s.addContact);
  const removeContact = useContactStore((s) => s.removeContact);

  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('すべて');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRelationship, setNewRelationship] =
    useState<Relationship>('同僚');
  const [newGroup, setNewGroup] = useState<ContactGroup>('仕事');

  const inputBackground = colors.surfaceSecondary;
  const modalBackground = colors.background;

  const filteredContacts =
    selectedFilter === 'すべて'
      ? contacts
      : contacts.filter((c) => c.group === selectedFilter);

  const handleDeleteContact = (contact: Contact) => {
    Alert.alert(
      '連絡先の削除',
      `${contact.name} を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => removeContact(contact.id),
        },
      ],
    );
  };

  const handleAddContact = () => {
    if (!newName.trim() || !newEmail.trim()) {
      Alert.alert('入力エラー', '名前とメールアドレスを入力してください');
      return;
    }
    if (!isValidEmail(newEmail.trim())) {
      Alert.alert('入力エラー', '正しいメールアドレスを入力してください');
      return;
    }

    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      relationship: newRelationship,
      group: newGroup,
      scope: newGroup === '仕事' ? '社内' : newGroup === '学校' ? '社外' : '個人間',
      positionLevel: 'その他',
    };

    addContact(newContact);
    setNewName('');
    setNewEmail('');
    setNewRelationship('同僚');
    setNewGroup('仕事');
    setIsModalVisible(false);
  };

  return (
    <ThemedView style={styles.container}>
        {/* Header action */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.tint }]}
            onPress={() => setIsModalVisible(true)}
          >
            <ThemedText style={styles.addButtonText}>+</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {FILTER_TABS.map((tab) => {
            const isSelected = selectedFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterTab,
                  isSelected && {
                    backgroundColor: colors.tint,
                  },
                  !isSelected && {
                    backgroundColor: inputBackground,
                  },
                ]}
                onPress={() => setSelectedFilter(tab)}
              >
                <ThemedText
                  style={[
                    styles.filterTabText,
                    isSelected && { color: '#FFFFFF' },
                    !isSelected && { color: colors.text },
                  ]}
                >
                  {tab}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Contact List */}
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ContactItem
              contact={item}
              colors={colors}
              onLongPress={() => handleDeleteContact(item)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            filteredContacts.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={<EmptyContactState colors={colors} />}
          showsVerticalScrollIndicator={false}
        />

        {/* Add Contact Modal */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: modalBackground },
            ]}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <ThemedText style={[styles.modalCancel, { color: colors.tint }]}>
                    キャンセル
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
                  連絡先を追加
                </ThemedText>
                <TouchableOpacity onPress={handleAddContact}>
                  <ThemedText
                    style={[styles.modalSave, { color: colors.tint }]}
                  >
                    保存
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>名前</ThemedText>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: inputBackground,
                        color: colors.text,
                      },
                    ]}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="例: 田中太郎"
                    placeholderTextColor={colors.icon}
                    maxLength={50}
                  />
                </View>

                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>
                    メールアドレス
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: inputBackground,
                        color: colors.text,
                      },
                    ]}
                    value={newEmail}
                    onChangeText={setNewEmail}
                    placeholder="例: tanaka@example.com"
                    placeholderTextColor={colors.icon}
                    keyboardType="default"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={254}
                  />
                </View>

                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>関係性</ThemedText>
                  <View style={styles.optionGrid}>
                    {RELATIONSHIP_OPTIONS.map((rel) => (
                      <TouchableOpacity
                        key={rel}
                        style={[
                          styles.optionChip,
                          {
                            backgroundColor:
                              newRelationship === rel
                                ? colors.tint
                                : inputBackground,
                          },
                        ]}
                        onPress={() => setNewRelationship(rel)}
                      >
                        <ThemedText
                          style={[
                            styles.optionChipText,
                            {
                              color:
                                newRelationship === rel
                                  ? '#FFFFFF'
                                  : colors.text,
                            },
                          ]}
                        >
                          {rel}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>グループ</ThemedText>
                  <View style={styles.optionGrid}>
                    {GROUP_OPTIONS.map((group) => (
                      <TouchableOpacity
                        key={group}
                        style={[
                          styles.optionChip,
                          {
                            backgroundColor:
                              newGroup === group
                                ? GROUP_COLORS[group]
                                : inputBackground,
                          },
                        ]}
                        onPress={() => setNewGroup(group)}
                      >
                        <ThemedText
                          style={[
                            styles.optionChipText,
                            {
                              color:
                                newGroup === group
                                  ? '#FFFFFF'
                                  : colors.text,
                            },
                          ]}
                        >
                          {group}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 14,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 10,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
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
    opacity: 0.6,
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
  emptyState: {
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
    opacity: 0.6,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 17,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    padding: 20,
    gap: 24,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  textInput: {
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
