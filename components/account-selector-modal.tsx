import {
  Modal,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { MailAccount, MailAccountType } from '@/types/user';

type Props = {
  visible: boolean;
  onClose: () => void;
  accounts: MailAccount[];
  onSelect: (account: MailAccount) => void;
};

const ACCOUNT_TYPE_LABEL: Record<MailAccountType, string> = {
  gmail: 'Gmail',
  outlook: 'Outlook',
  yahoo: 'Yahoo!メール',
  icloud: 'iCloud メール',
};

const ACCOUNT_TYPE_COLOR: Record<MailAccountType, string> = {
  gmail: '#EA4335',
  outlook: '#0078D4',
  yahoo: '#720E9E',
  icloud: '#555555',
};

export function AccountSelectorModal({ visible, onClose, accounts, onSelect }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSelect = (account: MailAccount) => {
    if (account.authStatus === 'unauthenticated') return;
    onSelect(account);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
            {'送信アカウントを選択'}
          </ThemedText>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {'どのアカウントからメールを送信しますか？'}
        </ThemedText>

        {/* Account list */}
        <View style={styles.accountList}>
          {accounts.map((account) => {
            const isExpired = account.authStatus === 'expired';
            const isUnauthenticated = account.authStatus === 'unauthenticated';
            const isDisabled = isExpired || isUnauthenticated;
            const accentColor = ACCOUNT_TYPE_COLOR[account.type];

            return (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.accountItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  isDisabled && styles.accountItemDisabled,
                ]}
                onPress={() => handleSelect(account)}
                activeOpacity={isDisabled ? 1 : 0.7}
              >
                {/* Icon */}
                <View style={[styles.accountIcon, { backgroundColor: accentColor + '18' }]}>
                  <MaterialIcons name="mail" size={22} color={accentColor} />
                </View>

                {/* Info */}
                <View style={styles.accountInfo}>
                  <View style={styles.accountTypeRow}>
                    <ThemedText
                      type="defaultSemiBold"
                      style={[
                        styles.accountTypeLabel,
                        { color: isDisabled ? colors.textSecondary : colors.text },
                      ]}
                    >
                      {ACCOUNT_TYPE_LABEL[account.type]}
                    </ThemedText>
                    {isExpired && (
                      <View style={[styles.statusBadge, { backgroundColor: '#FF9500' + '20' }]}>
                        <ThemedText style={[styles.statusBadgeText, { color: '#FF9500' }]}>
                          {'期限切れ'}
                        </ThemedText>
                      </View>
                    )}
                    {isUnauthenticated && (
                      <View style={[styles.statusBadge, { backgroundColor: colors.surfaceSecondary }]}>
                        <ThemedText style={[styles.statusBadgeText, { color: colors.textSecondary }]}>
                          {'未連携'}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText
                    style={[
                      styles.accountEmail,
                      { color: isDisabled ? colors.textSecondary : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {account.email}
                  </ThemedText>
                </View>

                {/* Chevron */}
                {!isDisabled && (
                  <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  accountList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  accountItemDisabled: {
    opacity: 0.5,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
    gap: 3,
  },
  accountTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountTypeLabel: {
    fontSize: 15,
  },
  accountEmail: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
