import type { TutorialStep } from '@/store/use-tutorial-store';

export type TutorialCopy = {
  title: string;
  body: string;
};

export const TUTORIAL_COPY: Record<Exclude<TutorialStep, 'idle' | 'completed'>, TutorialCopy> = {
  'learning-signature': {
    title: 'まずは署名を登録',
    body: 'メールの末尾に自動で挿入される署名を入力してください。氏名や所属など、よく使う形式でOKです。',
  },
  'learning-style': {
    title: '文体の好みを伝える',
    body: 'AIに文章のクセや使ってほしい言い回しを教えましょう。「丁寧めに」「箇条書きを使う」など自由に。',
  },
  'learning-opening': {
    title: '文頭の定型文を登録',
    body: '「お世話になっております。」など毎回使う書き出しを登録すると、生成時に自動で挿入されます。',
  },
  'contacts-add': {
    title: '送信相手を登録',
    body: '右上の「+」から、よく送る相手を1人だけ登録してみましょう。関係性に合わせてAIが敬語を最適化します。',
  },
  'rewrite-draft': {
    title: 'まずは下書きを入力',
    body: '送りたい内容をざっくり書いてください。箇条書きでもOK。文章の体裁は次でAIが整えます。',
  },
  'rewrite-generate': {
    title: 'AIで整える',
    body: '下書きが入力できたら「✨ AIで整える」を押してみてください。AIが敬語やトーンを最適化します。',
  },
  'preview-review': {
    title: 'まずは本文を確認',
    body: 'AIが生成したメール本文です。気になる箇所はそのまま編集も可能。確認できたら「次へ」を押してください。',
  },
  'preview-regenerate': {
    title: '気に入らなければ再生成',
    body: '「再生成」ボタンを押すと、別のパターンを作り直せます。一度試してみましょう。',
  },
  'preview-save-preset': {
    title: 'よく使う文章として保存',
    body: '気に入った生成結果は「よく使う文章に保存」しておくと、次回ワンタップで呼び出せます。',
  },
  'presets-tap-card': {
    title: '保存内容を確認',
    body: '保存した文章はここから確認できます。カードをタップすると、いつでも再利用できます。',
  },
};

export const TUTORIAL_PAUSE_LABEL = 'あとで見る';
export const TUTORIAL_RESUME_ENTRY_LABEL = 'チュートリアルをもう一度見る';

export const TUTORIAL_CELEBRATION = {
  title: 'チュートリアル完了！',
  body: 'これでメールメーカーの基本操作はバッチリです。あとは自由に使いこなしてください。',
  cta: 'はじめる',
};
