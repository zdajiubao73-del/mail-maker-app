// メール作成フローに関する型定義

/** 送信相手との関係性 */
export type Relationship =
  | '上司'
  | '同僚'
  | '部下'
  | '取引先'
  | '顧客'
  | '教授'
  | '先輩'
  | '友人'
  | '家族'
  | '初対面';

/** メールの範囲 */
export type Scope = '社内' | '社外' | '個人間';

/** 役職レベル */
export type PositionLevel = '経営層' | '管理職' | '一般社員' | '学生' | 'その他';

/** 目的カテゴリ */
export type PurposeCategory = 'ビジネス' | '就職・転職' | '学校・学術' | 'プライベート' | 'その他';

/** 敬語レベル */
export type HonorificsLevel = '最敬体' | '丁寧' | '普通' | 'カジュアル';

/** メールの長さ */
export type MailLength = '短め' | '標準' | '長め';

/** メールの雰囲気 */
export type Atmosphere = '堅い' | '落ち着いた' | '親しみやすい' | '明るい';

/** 緊急度 */
export type Urgency = '通常' | 'やや急ぎ' | '至急';

/** 送信先の設定 */
export type RecipientSettings = {
  relationship: Relationship;
  scope: Scope;
  positionLevel: PositionLevel;
};

/** トーン設定 */
export type ToneSettings = {
  honorificsLevel: HonorificsLevel;
  mailLength: MailLength;
  atmosphere: Atmosphere;
  urgency: Urgency;
};

/** 追加情報 */
export type AdditionalInfo = {
  keyPoints: string;
  dateTime?: string;
  properNouns?: string;
  notes?: string;
};

/** メール生成リクエスト */
export type MailGenerationRequest = {
  recipient: RecipientSettings;
  purposeCategory: PurposeCategory;
  situation: string;
  tone: ToneSettings;
  additionalInfo: AdditionalInfo;
  templateId?: string;
  learningContext?: {
    preferredOpenings?: string[];
    preferredClosings?: string[];
    averageBodyLength?: number;
    signature?: string;
    writingStyleNotes?: string;
  };
};

/** 生成されたメール */
export type GeneratedMail = {
  id: string;
  subject: string;
  body: string;
  createdAt: Date;
};

/** メール履歴アイテム */
export type MailHistoryItem = {
  id: string;
  subject: string;
  body: string;
  recipientName: string;
  recipientEmail: string;
  cc?: string[];
  bcc?: string[];
  sentAt?: Date;
  createdAt: Date;
  status: 'draft' | 'generated' | 'sent';
  attachments?: AttachmentMeta[];
  generationContext?: {
    recipient: RecipientSettings;
    purposeCategory: PurposeCategory;
    situation: string;
    tone: ToneSettings;
  };
};

/** 添付ファイル（プレビュー画面での一時利用） */
export type Attachment = {
  id: string;
  name: string;
  uri: string;
  mimeType: string;
  size: number;
};

/** 添付ファイルメタデータ（履歴保存用、base64データは含まない） */
export type AttachmentMeta = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
};

/** 生成モード */
export type GenerationMode = 'simple' | 'detailed' | 'template';
