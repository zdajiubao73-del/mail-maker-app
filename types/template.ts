// テンプレートに関する型定義

import type { PurposeCategory } from './mail';

/** プロンプトテンプレート */
export type PromptTemplate = {
  id: string;
  name: string;
  category: PurposeCategory;
  situation: string;
  description: string;
  isPremium: boolean;
};
