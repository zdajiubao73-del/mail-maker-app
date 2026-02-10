import type { Relationship, HonorificsLevel } from '@/types/mail';

export const RELATIONSHIP_TONE_MAP: Record<Relationship, HonorificsLevel> = {
  '上司': '丁寧',
  '同僚': '丁寧',
  '部下': '普通',
  '取引先': '最敬体',
  '顧客': '最敬体',
  '教授': '最敬体',
  '先輩': '丁寧',
  '友人': 'カジュアル',
  '家族': 'カジュアル',
  '初対面': '丁寧',
};
