import fs from 'fs/promises';
import path from 'path';

export type LocalAdminAccount = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type LocalAdminDatabase = {
  adminAccounts?: LocalAdminAccount[];
  nextAdminAccountId?: number;
};

const localDatabasePath = path.join(process.cwd(), 'storage', 'local-db.json');

async function readLocalDatabase(): Promise<LocalAdminDatabase> {
  try {
    const rawContent = await fs.readFile(localDatabasePath, 'utf8');
    return JSON.parse(rawContent) as LocalAdminDatabase;
  } catch {
    return {};
  }
}

async function writeLocalDatabase(database: LocalAdminDatabase) {
  await fs.mkdir(path.dirname(localDatabasePath), { recursive: true });
  await fs.writeFile(localDatabasePath, JSON.stringify(database, null, 2), 'utf8');
}

export async function findLocalAdminAccount(username: string, passwordHash?: string) {
  const database = await readLocalDatabase();
  const accounts = database.adminAccounts || [];
  const normalizedUsername = username.trim().toLowerCase();

  return accounts.find((account) => {
    if (!account.is_active) {
      return false;
    }

    const matchesUsername = account.username.trim().toLowerCase() === normalizedUsername;
    const matchesPassword = passwordHash ? account.password_hash === passwordHash : true;
    return matchesUsername && matchesPassword;
  }) || null;
}

export async function createLocalAdminAccount(input: {
  username: string;
  email: string;
  passwordHash: string;
}) {
  const database = await readLocalDatabase();
  const accounts = database.adminAccounts || [];
  const normalizedUsername = input.username.trim().toLowerCase();
  const normalizedEmail = input.email.trim().toLowerCase();

  const duplicate = accounts.find((account) => {
    return (
      account.username.trim().toLowerCase() === normalizedUsername ||
      account.email.trim().toLowerCase() === normalizedEmail
    );
  });

  if (duplicate) {
    return { created: false as const, reason: 'duplicate' as const };
  }

  const nextId = database.nextAdminAccountId || (accounts.length > 0 ? Math.max(...accounts.map((account) => account.id)) + 1 : 1);
  const now = new Date().toISOString();

  const newAccount: LocalAdminAccount = {
    id: nextId,
    username: input.username,
    email: input.email,
    password_hash: input.passwordHash,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  database.adminAccounts = [...accounts, newAccount];
  database.nextAdminAccountId = nextId + 1;
  await writeLocalDatabase(database);

  return { created: true as const, account: newAccount };
}
