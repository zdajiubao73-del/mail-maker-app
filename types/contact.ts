// 連絡先に関する型定義

import type { Relationship, Scope, PositionLevel } from './mail';

/** 連絡先グループ */
export type ContactGroup = '仕事' | '学校' | 'プライベート';

/** 連絡先 */
export type Contact = {
  id: string;
  name: string;
  email: string;
  relationship: Relationship;
  positionTitle?: string;
  group: ContactGroup;
  scope: Scope;
  positionLevel: PositionLevel;
};
