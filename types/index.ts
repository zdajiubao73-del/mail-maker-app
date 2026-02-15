// 型定義の一括エクスポート

export type {
  Relationship,
  Scope,
  PositionLevel,
  PurposeCategory,
  HonorificsLevel,
  MailLength,
  Atmosphere,
  Urgency,
  RecipientSettings,
  ToneSettings,
  AdditionalInfo,
  MailGenerationRequest,
  GeneratedMail,
  MailHistoryItem,
  Attachment,
  AttachmentMeta,
  GenerationMode,
} from './mail';

export type {
  ContactGroup,
  Contact,
} from './contact';

export type {
  PlanType,
  MailAccountType,
  AuthStatus,
  MailAccount,
  User,
} from './user';

export type {
  PromptTemplate,
} from './template';

export type {
  Preset,
} from './preset';

export type {
  Distribution,
  PhrasePatterns,
  MailStatistics,
  UserStylePreferences,
  LearningProfile,
  LearningContext,
} from './learning';
