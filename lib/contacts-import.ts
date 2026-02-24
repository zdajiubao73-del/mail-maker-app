// 連絡先インポートモジュール
// Google People API / Microsoft Graph API から連絡先を取得する

export type ImportedContact = {
  name: string;
  email: string;
  source: 'gmail' | 'outlook';
};

// --- Google People API ---

type GooglePerson = {
  names?: { displayName?: string }[];
  emailAddresses?: { value?: string }[];
};

type GoogleConnectionsResponse = {
  connections?: GooglePerson[];
  nextPageToken?: string;
  totalPeople?: number;
};

export async function fetchGoogleContacts(
  accessToken: string,
): Promise<ImportedContact[]> {
  const contacts: ImportedContact[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(
      'https://people.googleapis.com/v1/people/me/connections',
    );
    url.searchParams.set('personFields', 'names,emailAddresses');
    url.searchParams.set('pageSize', '1000');
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google 連絡先の取得に失敗しました: ${errorText}`);
    }

    const data: GoogleConnectionsResponse = await response.json();

    if (data.connections) {
      for (const person of data.connections) {
        const email = person.emailAddresses?.[0]?.value;
        if (!email) continue;

        const name =
          person.names?.[0]?.displayName ?? email.split('@')[0] ?? '';

        contacts.push({ name, email, source: 'gmail' });
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return contacts;
}

// --- Microsoft Graph API ---

type MicrosoftContact = {
  displayName?: string;
  emailAddresses?: { address?: string; name?: string }[];
};

type MicrosoftContactsResponse = {
  value?: MicrosoftContact[];
  '@odata.nextLink'?: string;
};

export async function fetchMicrosoftContacts(
  accessToken: string,
): Promise<ImportedContact[]> {
  const contacts: ImportedContact[] = [];
  let nextLink: string | undefined =
    'https://graph.microsoft.com/v1.0/me/contacts?$select=displayName,emailAddresses&$top=1000';

  do {
    const response = await fetch(nextLink, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Microsoft 連絡先の取得に失敗しました: ${errorText}`);
    }

    const data: MicrosoftContactsResponse = await response.json();

    if (data.value) {
      for (const contact of data.value) {
        const email = contact.emailAddresses?.[0]?.address;
        if (!email) continue;

        const name =
          contact.displayName ?? email.split('@')[0] ?? '';

        contacts.push({ name, email, source: 'outlook' });
      }
    }

    nextLink = data['@odata.nextLink'];
  } while (nextLink);

  return contacts;
}

// --- モック（開発用） ---

export function getMockContacts(source: 'gmail' | 'outlook'): ImportedContact[] {
  return [
    { name: '田中太郎', email: 'tanaka@example.com', source },
    { name: '佐藤花子', email: 'sato@example.com', source },
    { name: '鈴木一郎', email: 'suzuki@example.com', source },
    { name: '山田美咲', email: 'yamada@example.com', source },
    { name: '高橋健太', email: 'takahashi@example.com', source },
    { name: '伊藤直子', email: 'ito@example.com', source },
    { name: '渡辺翔太', email: 'watanabe@example.com', source },
    { name: '中村さくら', email: 'nakamura@example.com', source },
  ];
}
