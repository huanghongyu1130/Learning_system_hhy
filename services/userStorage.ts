import { v4 as uuidv4 } from 'uuid';
import { DatabaseSnapshot, StoredUserRecord, UserData, UserProfile } from '../types';

const STORAGE_KEY = 'learning_system_db_v1';

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
};

const readDb = (): DatabaseSnapshot => {
  const storage = getStorage();
  if (!storage) return { users: {} };

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return { users: {} };

  try {
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || {},
      activeUserId: parsed.activeUserId,
    };
  } catch (error) {
    console.warn('Failed to parse local user database, resetting.', error);
    return { users: {} };
  }
};

const writeDb = (db: DatabaseSnapshot) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(db));
};

const findByEmail = (db: DatabaseSnapshot, email: string): StoredUserRecord | null => {
  const target = email.trim().toLowerCase();
  return (
    Object.values(db.users).find((user) => user.profile.email.toLowerCase() === target) || null
  );
};

export const loadActiveSession = (): { userId: string; data: UserData } | null => {
  const db = readDb();
  if (db.activeUserId && db.users[db.activeUserId]) {
    return { userId: db.activeUserId, data: db.users[db.activeUserId].data };
  }
  return null;
};

export const clearActiveSession = () => {
  const db = readDb();
  delete db.activeUserId;
  writeDb(db);
};

export const persistUserData = (userId: string, data: UserData) => {
  const db = readDb();
  const record = db.users[userId];
  if (!record) return;

  record.data = {
    ...data,
    lastUpdated: Date.now(),
  };
  db.users[userId] = record;
  db.activeUserId = userId;
  writeDb(db);
};

export const registerUser = (
  email: string,
  password: string,
  name: string,
  seedData: Pick<
    UserData,
    'settings' | 'categories' | 'chatHistory' | 'isDarkMode' | 'activeChapterId'
  >,
): { userId: string; data: UserData } => {
  const db = readDb();
  if (findByEmail(db, email)) {
    throw new Error('Email 已被使用，請改用登入或換一個 email。');
  }

  const profile: UserProfile = {
    id: uuidv4(),
    email: email.trim(),
    name: name?.trim() || email.trim(),
  };

  const data: UserData = {
    profile,
    settings: seedData.settings,
    categories: seedData.categories || [],
    chatHistory: seedData.chatHistory || [],
    isDarkMode: seedData.isDarkMode ?? false,
    activeChapterId: seedData.activeChapterId ?? null,
    lastUpdated: Date.now(),
  };

  db.users[profile.id] = { profile, password, data };
  db.activeUserId = profile.id;
  writeDb(db);

  return { userId: profile.id, data };
};

export const loginUser = (email: string, password: string): { userId: string; data: UserData } => {
  const db = readDb();
  const found = findByEmail(db, email);
  if (!found) {
    throw new Error('找不到帳號，請先註冊。');
  }
  if (found.password !== password) {
    throw new Error('密碼不正確。');
  }

  db.activeUserId = found.profile.id;
  writeDb(db);
  return { userId: found.profile.id, data: found.data };
};

export const listSavedProfiles = (): UserProfile[] => {
  const db = readDb();
  return Object.values(db.users).map((user) => user.profile);
};
