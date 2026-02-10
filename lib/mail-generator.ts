// モックAIメール生成サービス
// バックエンド未構築のため、入力パラメータに基づいてリアルなモック日本語メールを生成する

import type { MailGenerationRequest, GeneratedMail, HonorificsLevel } from '@/types/mail';

/**
 * シチュエーションに応じた件名を生成する
 */
function generateSubject(situation: string, purposeCategory: string): string {
  const subjectMap: Record<string, string> = {
    // ビジネス系
    '依頼': 'ご依頼の件について',
    '報告': '進捗状況のご報告',
    '相談': 'ご相談させていただきたい件がございます',
    '日程調整': '打ち合わせ日程のご相談',
    'スケジュール': 'スケジュール調整のお願い',
    'お詫び': 'お詫びとご報告',
    'お礼': '御礼申し上げます',
    '感謝': 'ご対応いただきありがとうございました',
    '挨拶': 'ご挨拶',
    '自己紹介': 'はじめまして（ご挨拶）',
    '見積': '見積書送付のご案内',
    '請求': '請求書送付のご連絡',
    '納品': '納品のご連絡',
    '確認': '確認のお願い',
    '連絡': 'ご連絡事項',
    '催促': '先日のお願いにつきまして',
    '辞退': '辞退のご連絡',
    '欠席': '欠席のご連絡',
    '遅刻': '遅刻のご連絡とお詫び',
    '退職': '退職のご挨拶',
    '異動': '異動のご挨拶',
    '会議': '会議のご案内',
    '招待': 'ご案内',
    '紹介': 'ご紹介のお願い',
    // 就職・転職系
    'OB訪問': 'OB訪問のお願い',
    'インターン': 'インターンシップ参加のお礼',
    '面接': '面接日程のご確認',
    '内定': '内定承諾のご連絡',
    '選考': '選考結果についてのお問い合わせ',
    'エントリー': 'エントリーシートの送付',
    '応募': '求人への応募',
    // 学校・学術系
    'ゼミ': 'ゼミに関するご相談',
    '論文': '論文指導のお願い',
    '推薦状': '推薦状作成のお願い',
    '研究': '研究についてのご質問',
    '授業': '授業に関するお問い合わせ',
    '単位': '成績・単位についてのご相談',
    '休講': '休講のご連絡',
    // プライベート系
    '食事': 'お食事のお誘い',
    '飲み会': '飲み会のお知らせ',
    '旅行': '旅行の件について',
    '誕生日': 'お誕生日おめでとうございます',
    '結婚': 'ご結婚のお祝い',
    '引っ越し': '引っ越しのご報告',
    'お見舞い': 'お見舞い申し上げます',
    'お悔やみ': 'お悔やみ申し上げます',
  };

  // シチュエーション文字列に含まれるキーワードを検索
  for (const [keyword, subject] of Object.entries(subjectMap)) {
    if (situation.includes(keyword)) {
      return subject;
    }
  }

  // カテゴリに応じたデフォルト件名
  const defaultSubjects: Record<string, string> = {
    'ビジネス': 'ご連絡',
    '就職・転職': '選考に関するご連絡',
    '学校・学術': 'ご連絡・ご相談',
    'プライベート': 'ご連絡',
  };

  return defaultSubjects[purposeCategory] ?? `${situation}について`;
}

/**
 * 敬語レベルに応じた書き出しを生成する
 */
function generateOpening(
  honorificsLevel: HonorificsLevel,
  scope: string,
  relationship: string,
): string {
  switch (honorificsLevel) {
    case '最敬体':
      if (scope === '社外') {
        return '拝啓\n\n時下ますますご清祥のこととお慶び申し上げます。';
      }
      return '拝啓\n\n平素は格別のご高配を賜り、厚く御礼申し上げます。';

    case '丁寧':
      if (scope === '社外') {
        return 'いつも大変お世話になっております。';
      }
      if (
        relationship === '上司' ||
        relationship === '教授' ||
        relationship === '先輩'
      ) {
        return 'お疲れ様です。いつもお世話になっております。';
      }
      return 'お疲れ様です。';

    case '普通':
      if (scope === '社内') {
        return 'お疲れ様です。';
      }
      return 'お世話になっています。';

    case 'カジュアル': {
      const casualOpenings = [
        'こんにちは！',
        'お元気ですか？',
        'ご無沙汰しています！',
        'お久しぶりです！',
      ];
      return casualOpenings[Math.floor(Math.random() * casualOpenings.length)];
    }
  }
}

/**
 * 敬語レベルに応じた締めの文を生成する
 */
function generateClosing(
  honorificsLevel: HonorificsLevel,
  urgency: string,
): string {
  let urgencyNote = '';
  if (urgency === '至急') {
    urgencyNote =
      '\n\n※お忙しいところ恐縮ですが、お急ぎでご対応いただけますと幸いです。';
  } else if (urgency === 'やや急ぎ') {
    urgencyNote =
      '\nお忙しいところ恐れ入りますが、お早めにご確認いただけますと助かります。';
  }

  switch (honorificsLevel) {
    case '最敬体':
      return `${urgencyNote}\n\n何卒よろしくお願い申し上げます。\n\n敬具`;

    case '丁寧':
      return `${urgencyNote}\n\nお忙しいところ恐れ入りますが、ご確認のほどよろしくお願いいたします。`;

    case '普通':
      return `${urgencyNote}\n\nよろしくお願いします。`;

    case 'カジュアル': {
      const casualClosings = [
        'よろしくね！',
        'また連絡するね！',
        'それではまた！',
        'よろしく〜！',
      ];
      return `${urgencyNote}\n\n${casualClosings[Math.floor(Math.random() * casualClosings.length)]}`;
    }
  }
}

/**
 * メール本文のメインコンテンツを生成する
 */
function generateMainContent(
  situation: string,
  honorificsLevel: HonorificsLevel,
  additionalKeyPoints: string,
  atmosphere: string,
  mailLength: string,
): string {
  const lines: string[] = [];

  // シチュエーションに基づく導入文
  const introMap: Record<string, Record<string, string>> = {
    '依頼': {
      '最敬体':
        'さて、このたびは下記の件につきまして、お力添えを賜りたくご連絡を差し上げました。',
      '丁寧': 'さて、本日は以下の件でご依頼がありご連絡いたしました。',
      '普通': '以下の件でお願いがあります。',
      'カジュアル': 'ちょっとお願いがあるんだけど、聞いてもらえるかな？',
    },
    '報告': {
      '最敬体': 'さて、下記の件につきましてご報告申し上げます。',
      '丁寧': '以下の件について、ご報告させていただきます。',
      '普通': '以下の件について報告します。',
      'カジュアル': '例の件、報告するね！',
    },
    '相談': {
      '最敬体':
        'さて、ご多忙のところ誠に恐縮ではございますが、下記の件につきましてご相談させていただきたく存じます。',
      '丁寧':
        '本日は以下の件についてご相談させていただきたく、ご連絡いたしました。',
      '普通': '以下の件について相談があります。',
      'カジュアル': 'ちょっと相談に乗ってほしいことがあるんだけど。',
    },
    'お詫び': {
      '最敬体':
        'このたびは、多大なるご迷惑をおかけいたしましたこと、深くお詫び申し上げます。',
      '丁寧': 'このたびはご迷惑をおかけし、大変申し訳ございませんでした。',
      '普通': 'この度はご迷惑をおかけして申し訳ありません。',
      'カジュアル': 'ごめんね、迷惑かけちゃって。',
    },
    'お礼': {
      '最敬体':
        'このたびは、ご厚情を賜りまして誠にありがとうございます。心より感謝申し上げます。',
      '丁寧': 'このたびは大変お世話になりました。心よりお礼申し上げます。',
      '普通': '先日はありがとうございました。',
      'カジュアル': 'この前はありがとう！',
    },
    '日程調整': {
      '最敬体':
        'さて、打ち合わせの日程につきまして、ご調整をお願い申し上げたく存じます。',
      '丁寧':
        '打ち合わせの日程について、ご相談させていただければと思います。',
      '普通': '打ち合わせの日程について相談させてください。',
      'カジュアル': '予定合わせたいんだけど、いつが都合いい？',
    },
    'OB訪問': {
      '最敬体':
        'このたびは突然のご連絡、誠に恐縮でございます。OB訪問のお願いにつきましてご連絡を差し上げました。',
      '丁寧':
        '突然のご連絡失礼いたします。OB訪問のお願いでご連絡いたしました。',
      '普通': 'OB訪問をお願いしたくご連絡しました。',
      'カジュアル': 'OB訪問のお願いなんだけど。',
    },
    '面接': {
      '最敬体': 'さて、面接日程の件につきましてご連絡を差し上げました。',
      '丁寧': '面接の日程についてご連絡いたします。',
      '普通': '面接の日程について連絡します。',
      'カジュアル': '面接の日程の件なんだけど。',
    },
    'ゼミ': {
      '最敬体':
        'さて、ゼミに関しましてご相談させていただきたい件がございまして、ご連絡を差し上げました。',
      '丁寧': 'ゼミに関してご相談させていただきたく、ご連絡いたしました。',
      '普通': 'ゼミについて相談があります。',
      'カジュアル': 'ゼミのことでちょっと相談なんだけど。',
    },
    '論文': {
      '最敬体':
        'さて、論文執筆につきましてご指導を賜りたく、ご連絡を差し上げました。',
      '丁寧': '論文についてご指導をお願いしたく、ご連絡いたしました。',
      '普通': '論文についてご指導をお願いしたいです。',
      'カジュアル': '論文のことで相談に乗ってほしいんだけど。',
    },
    '欠席': {
      '最敬体':
        'さて、誠に申し訳ございませんが、下記の理由により欠席させていただきたくご連絡を差し上げました。',
      '丁寧':
        '大変申し訳ございませんが、欠席のご連絡をさせていただきます。',
      '普通': '欠席の連絡をいたします。',
      'カジュアル': 'ごめん、休む連絡なんだけど。',
    },
    '食事': {
      '最敬体': 'さて、お食事にお誘いしたくご連絡を差し上げました。',
      '丁寧': 'お食事にお誘いしたく、ご連絡いたしました。',
      '普通': '食事に誘いたくて連絡しました。',
      'カジュアル': '今度ご飯行かない？',
    },
  };

  // シチュエーションに一致する導入文を検索
  let intro = '';
  for (const [keyword, levelMap] of Object.entries(introMap)) {
    if (situation.includes(keyword)) {
      intro = levelMap[honorificsLevel] ?? levelMap['丁寧'];
      break;
    }
  }

  if (!intro) {
    // デフォルトの導入文
    const defaults: Record<string, string> = {
      '最敬体': `さて、${situation}の件につきましてご連絡を差し上げました。`,
      '丁寧': `${situation}の件についてご連絡いたします。`,
      '普通': `${situation}の件について連絡します。`,
      'カジュアル': `${situation}の件なんだけど。`,
    };
    intro = defaults[honorificsLevel];
  }

  lines.push(intro);

  // キーポイントの組み込み
  if (additionalKeyPoints.trim()) {
    const points = additionalKeyPoints
      .split(/[、,\n]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (points.length > 0) {
      lines.push('');

      if (honorificsLevel === 'カジュアル') {
        lines.push('ポイントをまとめると：');
      } else if (honorificsLevel === '最敬体') {
        lines.push('詳細につきまして、下記のとおりご案内申し上げます。');
      } else {
        lines.push('詳細は以下のとおりです。');
      }

      lines.push('');
      for (const point of points) {
        lines.push(`・${point}`);
      }
    }
  }

  // 長さに応じた追加文
  if (mailLength === '長め') {
    lines.push('');
    if (honorificsLevel === '最敬体' || honorificsLevel === '丁寧') {
      lines.push(
        'ご不明な点やご質問がございましたら、いつでもお気軽にお問い合わせくださいませ。',
      );
      lines.push(
        'また、上記の内容に変更や追加がございましたら、お知らせいただけますと幸いです。',
      );
    } else if (honorificsLevel === '普通') {
      lines.push('何か質問があれば連絡してください。');
    } else {
      lines.push('何か分からないことがあったら気軽に聞いてね！');
    }
  }

  return lines.join('\n');
}

/**
 * ユニークIDを生成する
 */
function generateId(): string {
  return `mail_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * メールを生成する（モック実装）
 *
 * 将来的にはバックエンドのAI APIを呼び出すが、
 * 現時点ではリクエストパラメータに基づいてリアルなモック日本語メールを生成する
 */
export async function generateMail(
  request: MailGenerationRequest,
): Promise<GeneratedMail> {
  // API呼び出しのレイテンシをシミュレート（1〜2秒）
  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 1000),
  );

  const { recipient, purposeCategory, situation, tone, additionalInfo } =
    request;

  // 件名の生成
  const subject = generateSubject(situation, purposeCategory);

  // 本文の組み立て
  const opening = generateOpening(
    tone.honorificsLevel,
    recipient.scope,
    recipient.relationship,
  );

  const mainContent = generateMainContent(
    situation,
    tone.honorificsLevel,
    additionalInfo.keyPoints,
    tone.atmosphere,
    tone.mailLength,
  );

  const closing = generateClosing(tone.honorificsLevel, tone.urgency);

  // 日時情報がある場合は本文に含める
  let dateTimeNote = '';
  if (additionalInfo.dateTime) {
    dateTimeNote = `\n\n日時：${additionalInfo.dateTime}`;
  }

  // 補足事項
  let notesSection = '';
  if (additionalInfo.notes) {
    if (tone.honorificsLevel === 'カジュアル') {
      notesSection = `\n\n※ ${additionalInfo.notes}`;
    } else {
      notesSection = `\n\n【補足】\n${additionalInfo.notes}`;
    }
  }

  const bodyParts = [
    opening,
    '',
    mainContent,
    dateTimeNote,
    notesSection,
    closing,
  ].filter((section) => section !== '');

  const body = bodyParts.join('\n');

  return {
    id: generateId(),
    subject,
    body,
    createdAt: new Date(),
  };
}
