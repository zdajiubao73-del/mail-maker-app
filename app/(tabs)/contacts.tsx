import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
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
import {
  useAuthRequest as useGoogleAuthRequest,
  getContactsAuthRequestConfig as getGoogleContactsConfig,
  discovery as googleDiscovery,
  exchangeContactsCodeForTokens as exchangeGoogleContactsCode,
  getContactsAccessToken as getGoogleContactsToken,
} from '@/lib/google-auth';
import {
  useAuthRequest as useMicrosoftAuthRequest,
  getContactsAuthRequestConfig as getMicrosoftContactsConfig,
  discovery as microsoftDiscovery,
  exchangeContactsCodeForTokens as exchangeMicrosoftContactsCode,
  getContactsAccessToken as getMicrosoftContactsToken,
} from '@/lib/microsoft-auth';
import {
  fetchGoogleContacts,
  fetchMicrosoftContacts,
  getMockContacts,
} from '@/lib/contacts-import';
import type { ImportedContact } from '@/lib/contacts-import';
import type { Contact, ContactGroup, Relationship } from '@/types';

type FilterTab = 'すべて' | ContactGroup;
type ImportSource = 'gmail' | 'outlook';
type ImportStep = 'select' | 'settings';

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
        右上の＋ボタンから連絡先を追加できます
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

  // Import state
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>('select');
  const [importSource, setImportSource] = useState<ImportSource>('gmail');
  const [importedContacts, setImportedContacts] = useState<ImportedContact[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [importSearchQuery, setImportSearchQuery] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importGroup, setImportGroup] = useState<ContactGroup>('仕事');
  const [importRelationship, setImportRelationship] = useState<Relationship>('同僚');

  // Google contacts OAuth
  const [googleRequest, googleResponse, googlePromptAsync] = useGoogleAuthRequest(
    getGoogleContactsConfig(),
    googleDiscovery,
  );

  // Microsoft contacts OAuth
  const [microsoftRequest, microsoftResponse, microsoftPromptAsync] = useMicrosoftAuthRequest(
    getMicrosoftContactsConfig(),
    microsoftDiscovery,
  );

  const inputBackground = colors.surfaceSecondary;
  const modalBackground = colors.background;

  const filteredContacts =
    selectedFilter === 'すべて'
      ? contacts
      : contacts.filter((c) => c.group === selectedFilter);

  // Existing emails for duplicate check
  const existingEmails = useMemo(
    () => new Set(contacts.map((c) => c.email.toLowerCase())),
    [contacts],
  );

  // Filter imported contacts by search query and exclude already-imported
  const filteredImportedContacts = useMemo(() => {
    let filtered = importedContacts.filter(
      (c) => !existingEmails.has(c.email.toLowerCase()),
    );
    if (importSearchQuery.trim()) {
      const q = importSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [importedContacts, importSearchQuery, existingEmails]);

  // Handle Google OAuth response
  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.params.code) {
      handleGoogleAuthSuccess(googleResponse.params.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  // Handle Microsoft OAuth response
  useEffect(() => {
    if (microsoftResponse?.type === 'success' && microsoftResponse.params.code) {
      handleMicrosoftAuthSuccess(microsoftResponse.params.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microsoftResponse]);

  const handleGoogleAuthSuccess = useCallback(async (code: string) => {
    setIsLoadingContacts(true);
    setImportError(null);
    try {
      const { accessToken } = await exchangeGoogleContactsCode(
        code,
        googleRequest?.codeVerifier,
      );
      const fetched = await fetchGoogleContacts(accessToken);
      setImportedContacts(fetched);
      setImportSource('gmail');
      setIsImportModalVisible(true);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : '連絡先の取得に失敗しました');
      setIsImportModalVisible(true);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [googleRequest?.codeVerifier]);

  const handleMicrosoftAuthSuccess = useCallback(async (code: string) => {
    setIsLoadingContacts(true);
    setImportError(null);
    try {
      const { accessToken } = await exchangeMicrosoftContactsCode(
        code,
        microsoftRequest?.codeVerifier,
      );
      const fetched = await fetchMicrosoftContacts(accessToken);
      setImportedContacts(fetched);
      setImportSource('outlook');
      setIsImportModalVisible(true);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : '連絡先の取得に失敗しました');
      setIsImportModalVisible(true);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [microsoftRequest?.codeVerifier]);

  const handleImportPress = () => {
    const useMock = !process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['キャンセル', 'Gmailからインポート', 'Outlookからインポート'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) startImport('gmail', useMock);
          if (buttonIndex === 2) startImport('outlook', useMock);
        },
      );
    } else {
      Alert.alert(
        'インポート元を選択',
        undefined,
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'Gmailからインポート', onPress: () => startImport('gmail', useMock) },
          { text: 'Outlookからインポート', onPress: () => startImport('outlook', useMock) },
        ],
      );
    }
  };

  const startImport = async (source: ImportSource, useMock: boolean) => {
    setImportStep('select');
    setSelectedEmails(new Set());
    setImportSearchQuery('');
    setImportError(null);
    setImportSource(source);
    setImportGroup('仕事');
    setImportRelationship('同僚');

    if (useMock) {
      const mockData = getMockContacts(source);
      setImportedContacts(mockData);
      setIsImportModalVisible(true);
      return;
    }

    // Try using existing token first
    setIsLoadingContacts(true);
    try {
      if (source === 'gmail') {
        const token = await getGoogleContactsToken();
        if (token) {
          const fetched = await fetchGoogleContacts(token);
          setImportedContacts(fetched);
          setIsImportModalVisible(true);
          setIsLoadingContacts(false);
          return;
        }
        setIsLoadingContacts(false);
        await googlePromptAsync();
      } else {
        const token = await getMicrosoftContactsToken();
        if (token) {
          const fetched = await fetchMicrosoftContacts(token);
          setImportedContacts(fetched);
          setIsImportModalVisible(true);
          setIsLoadingContacts(false);
          return;
        }
        setIsLoadingContacts(false);
        await microsoftPromptAsync();
      }
    } catch (err) {
      setIsLoadingContacts(false);
      setImportError(err instanceof Error ? err.message : '認証エラーが発生しました');
      setIsImportModalVisible(true);
    }
  };

  const toggleContactSelection = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEmails.size === filteredImportedContacts.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredImportedContacts.map((c) => c.email)));
    }
  };

  const handleConfirmImport = () => {
    const toImport = importedContacts.filter((c) =>
      selectedEmails.has(c.email) && !existingEmails.has(c.email.toLowerCase()),
    );

    for (const imported of toImport) {
      const newContact: Contact = {
        id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: imported.name,
        email: imported.email,
        relationship: importRelationship,
        group: importGroup,
        scope: importGroup === '仕事' ? '社内' : importGroup === '学校' ? '社外' : '個人間',
        positionLevel: 'その他',
      };
      addContact(newContact);
    }

    setIsImportModalVisible(false);
    setImportedContacts([]);
    setSelectedEmails(new Set());

    if (toImport.length > 0) {
      Alert.alert('インポート完了', `${toImport.length}件の連絡先をインポートしました`);
    }
  };

  const handleDeleteContact = (contact: Contact) => {
    Alert.alert(
      '連絡先を削除',
      `${contact.name}を削除しますか？`,
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
      Alert.alert('入力エラー', '名前とメールアドレスは必須です');
      return;
    }
    if (!isValidEmail(newEmail.trim())) {
      Alert.alert('入力エラー', 'メールアドレスの形式が正しくありません');
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

  const closeImportModal = () => {
    setIsImportModalVisible(false);
    setImportedContacts([]);
    setSelectedEmails(new Set());
    setImportSearchQuery('');
    setImportError(null);
    setImportStep('select');
  };

  const skippedCount = useMemo(
    () => importedContacts.filter((c) => existingEmails.has(c.email.toLowerCase())).length,
    [importedContacts, existingEmails],
  );

  const importSourceName = importSource === 'gmail' ? 'Gmail' : 'Outlook';

  return (
    <ThemedView style={styles.container}>
        {/* Header action */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.importButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            onPress={handleImportPress}
            disabled={isLoadingContacts}
          >
            {isLoadingContacts ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : (
              <>
                <IconSymbol name="arrow.down.circle" size={16} color={colors.tint} />
                <ThemedText style={[styles.importButtonText, { color: colors.tint }]}>
                  インポート
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
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
            const displayLabel = tab === 'すべて' ? 'すべて' : tab;
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
                  {displayLabel}
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

        {/* Import Contacts Modal */}
        <Modal
          visible={isImportModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeImportModal}
        >
          <View style={[styles.modalContainer, { backgroundColor: modalBackground }]}>
            <SafeAreaView style={styles.modalSafeArea}>
              {/* Import Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={importStep === 'settings' ? () => setImportStep('select') : closeImportModal}>
                  <ThemedText style={[styles.modalCancel, { color: colors.tint }]}>
                    {importStep === 'settings' ? '戻る' : 'キャンセル'}
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
                  {importStep === 'select'
                    ? `${importSourceName}の連絡先`
                    : 'インポート設定'}
                </ThemedText>
                {importStep === 'select' ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedEmails.size === 0) {
                        Alert.alert('選択エラー', '連絡先を選択してください');
                        return;
                      }
                      setImportStep('settings');
                    }}
                  >
                    <ThemedText style={[styles.modalSave, { color: colors.tint }]}>
                      次へ
                    </ThemedText>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={handleConfirmImport}>
                    <ThemedText style={[styles.modalSave, { color: colors.tint }]}>
                      インポート
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>

              {importStep === 'select' ? (
                <>
                  {/* Error state */}
                  {importError ? (
                    <View style={styles.importStatusContainer}>
                      <IconSymbol name="exclamationmark.triangle" size={40} color={colors.danger} />
                      <ThemedText style={[styles.importStatusText, { color: colors.danger }]}>
                        {importError}
                      </ThemedText>
                    </View>
                  ) : isLoadingContacts ? (
                    <View style={styles.importStatusContainer}>
                      <ActivityIndicator size="large" color={colors.tint} />
                      <ThemedText style={[styles.importStatusText, { color: colors.textSecondary }]}>
                        連絡先を取得中...
                      </ThemedText>
                    </View>
                  ) : (
                    <>
                      {/* Search bar */}
                      <View style={[styles.importSearchContainer, { borderBottomColor: colors.border }]}>
                        <View style={[styles.importSearchBar, { backgroundColor: inputBackground }]}>
                          <IconSymbol name="magnifyingglass" size={16} color={colors.icon} />
                          <TextInput
                            style={[styles.importSearchInput, { color: colors.text }]}
                            value={importSearchQuery}
                            onChangeText={setImportSearchQuery}
                            placeholder="名前またはメールアドレスで検索"
                            placeholderTextColor={colors.icon}
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                        </View>
                      </View>

                      {/* Select all + count */}
                      <View style={[styles.importToolbar, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={toggleSelectAll}>
                          <ThemedText style={[styles.selectAllText, { color: colors.tint }]}>
                            {selectedEmails.size === filteredImportedContacts.length && filteredImportedContacts.length > 0
                              ? '選択解除'
                              : 'すべて選択'}
                          </ThemedText>
                        </TouchableOpacity>
                        <ThemedText style={[styles.selectedCount, { color: colors.textSecondary }]}>
                          {`${selectedEmails.size}件選択中`}
                          {skippedCount > 0 ? ` （${skippedCount}件は登録済み）` : ''}
                        </ThemedText>
                      </View>

                      {/* Contact list */}
                      {filteredImportedContacts.length === 0 ? (
                        <View style={styles.importStatusContainer}>
                          <IconSymbol name="person.2.fill" size={40} color={colors.icon} />
                          <ThemedText style={[styles.importStatusText, { color: colors.textSecondary }]}>
                            {importSearchQuery
                              ? '検索結果がありません'
                              : 'インポート可能な連絡先がありません'}
                          </ThemedText>
                        </View>
                      ) : (
                        <FlatList
                          data={filteredImportedContacts}
                          keyExtractor={(item) => item.email}
                          renderItem={({ item }) => {
                            const isSelected = selectedEmails.has(item.email);
                            return (
                              <TouchableOpacity
                                style={[
                                  styles.importContactItem,
                                  { backgroundColor: isSelected ? colors.tint + '10' : colors.surface },
                                ]}
                                onPress={() => toggleContactSelection(item.email)}
                                activeOpacity={0.6}
                              >
                                <View style={[
                                  styles.checkbox,
                                  {
                                    borderColor: isSelected ? colors.tint : colors.icon,
                                    backgroundColor: isSelected ? colors.tint : 'transparent',
                                  },
                                ]}>
                                  {isSelected && (
                                    <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                                  )}
                                </View>
                                <View style={styles.importContactInfo}>
                                  <ThemedText type="defaultSemiBold" style={styles.importContactName}>
                                    {item.name}
                                  </ThemedText>
                                  <ThemedText style={[styles.importContactEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                                    {item.email}
                                  </ThemedText>
                                </View>
                              </TouchableOpacity>
                            );
                          }}
                          contentContainerStyle={styles.importListContent}
                          showsVerticalScrollIndicator={false}
                        />
                      )}
                    </>
                  )}
                </>
              ) : (
                /* Import settings step */
                <ScrollView style={styles.formContainer}>
                  <ThemedText style={[styles.importSettingsDesc, { color: colors.textSecondary }]}>
                    {`${selectedEmails.size}件の連絡先をインポートします。グループと関係性を設定してください。`}
                  </ThemedText>

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
                                importGroup === group
                                  ? GROUP_COLORS[group]
                                  : inputBackground,
                            },
                          ]}
                          onPress={() => setImportGroup(group)}
                        >
                          <ThemedText
                            style={[
                              styles.optionChipText,
                              {
                                color:
                                  importGroup === group
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

                  <View style={[styles.formGroup, { marginTop: 24 }]}>
                    <ThemedText style={styles.formLabel}>関係性</ThemedText>
                    <View style={styles.optionGrid}>
                      {RELATIONSHIP_OPTIONS.map((rel) => (
                        <TouchableOpacity
                          key={rel}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor:
                                importRelationship === rel
                                  ? colors.tint
                                  : inputBackground,
                            },
                          ]}
                          onPress={() => setImportRelationship(rel)}
                        >
                          <ThemedText
                            style={[
                              styles.optionChipText,
                              {
                                color:
                                  importRelationship === rel
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
                </ScrollView>
              )}
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  // Import modal styles
  importSearchContainer: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  importSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  importSearchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  importToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCount: {
    fontSize: 13,
  },
  importContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importContactInfo: {
    flex: 1,
  },
  importContactName: {
    fontSize: 15,
    marginBottom: 2,
  },
  importContactEmail: {
    fontSize: 13,
  },
  importListContent: {
    paddingBottom: 40,
  },
  importStatusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  importStatusText: {
    fontSize: 15,
    textAlign: 'center',
  },
  importSettingsDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});
