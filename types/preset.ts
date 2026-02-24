import type { PurposeCategory, Relationship, Scope, PositionLevel, ToneSettings } from './mail';

export type Preset = {
  id: string;
  name: string;
  recipientName?: string;
  recipientEmail?: string;
  relationship?: Relationship;
  scope?: Scope;
  positionLevel?: PositionLevel;
  purposeCategory?: PurposeCategory;
  situation?: string;
  tone?: Partial<ToneSettings>;
  /** 保存された件名 */
  subject?: string;
  /** 保存された本文 */
  body?: string;
  createdAt: Date;
};
