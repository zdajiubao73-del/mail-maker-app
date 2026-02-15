import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import aesjs from 'aes-js';

// --- 定数 ---

const SECURE_STORE_KEY = 'mail-maker-aes-key-v2';
const ENCRYPTED_V2_PREFIX = '__enc_v2:';
const ENCRYPTED_V1_PREFIX = '__enc_v1:';
const KEY_SEED_V1 = 'mail-maker-app-storage-key-v1';
const IV_LENGTH = 16; // AES block size
const KEY_LENGTH = 32; // 256 bits

// --- AES-256-CBC 鍵管理 ---

let _aesKey: Uint8Array | null = null;

/**
 * AES-256鍵を取得する。
 * 初回起動時に expo-crypto で256bit乱数鍵を生成し、expo-secure-store（iOS Keychain）に保存。
 */
async function getAesKey(): Promise<Uint8Array> {
  if (_aesKey) return _aesKey;

  const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
  if (stored) {
    _aesKey = hexToBytes(stored);
    return _aesKey;
  }

  // 初回: ランダム鍵を生成して保存
  const randomBytes = await Crypto.getRandomBytesAsync(KEY_LENGTH);
  _aesKey = new Uint8Array(randomBytes);
  await SecureStore.setItemAsync(SECURE_STORE_KEY, bytesToHex(_aesKey));
  return _aesKey;
}

// --- バイト列ユーティリティ ---

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// --- PKCS7 パディング ---

function pkcs7Pad(data: Uint8Array): Uint8Array {
  const blockSize = 16;
  const padding = blockSize - (data.length % blockSize);
  const padded = new Uint8Array(data.length + padding);
  padded.set(data);
  for (let i = data.length; i < padded.length; i++) {
    padded[i] = padding;
  }
  return padded;
}

function pkcs7Unpad(data: Uint8Array): Uint8Array {
  if (data.length === 0) throw new Error('Empty data');
  const padding = data[data.length - 1];
  if (padding < 1 || padding > 16) throw new Error('Invalid padding');
  for (let i = data.length - padding; i < data.length; i++) {
    if (data[i] !== padding) throw new Error('Invalid padding');
  }
  return data.slice(0, data.length - padding);
}

// --- AES-256-CBC 暗号化/復号 ---

async function encryptV2(plaintext: string): Promise<string> {
  const key = await getAesKey();
  const iv = new Uint8Array(await Crypto.getRandomBytesAsync(IV_LENGTH));
  const data = pkcs7Pad(stringToBytes(plaintext));

  const aesCbc = new aesjs.ModeOfOperation.cbc(Array.from(key), Array.from(iv));
  const encrypted = aesCbc.encrypt(Array.from(data));

  // IV + 暗号文を結合してBase64エンコード
  const combined = new Uint8Array(iv.length + encrypted.length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return ENCRYPTED_V2_PREFIX + bytesToBase64(combined);
}

async function decryptV2(stored: string): Promise<string> {
  const key = await getAesKey();
  const combined = base64ToBytes(stored.slice(ENCRYPTED_V2_PREFIX.length));

  const iv = combined.slice(0, IV_LENGTH);
  const encrypted = combined.slice(IV_LENGTH);

  const aesCbc = new aesjs.ModeOfOperation.cbc(Array.from(key), Array.from(iv));
  const decrypted = aesCbc.decrypt(Array.from(encrypted));

  return bytesToString(pkcs7Unpad(new Uint8Array(decrypted)));
}

// --- v1（XOR）復号（マイグレーション用） ---

let _v1KeyBytes: Uint8Array | null = null;

async function getV1KeyBytes(): Promise<Uint8Array> {
  if (_v1KeyBytes) return _v1KeyBytes;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    KEY_SEED_V1,
  );
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hash.substring(i * 2, i * 2 + 2), 16);
  }
  _v1KeyBytes = bytes;
  return _v1KeyBytes;
}

async function decryptV1(stored: string): Promise<string> {
  const key = await getV1KeyBytes();
  const base64 = stored.slice(ENCRYPTED_V1_PREFIX.length);
  const encrypted = base64ToBytes(base64);
  const result = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    result[i] = encrypted[i] ^ key[i % key.length];
  }
  return bytesToString(result);
}

// --- 統合 decrypt（v1/v2/平文の自動判別） ---

async function decrypt(stored: string): Promise<string> {
  if (stored.startsWith(ENCRYPTED_V2_PREFIX)) {
    return decryptV2(stored);
  }
  if (stored.startsWith(ENCRYPTED_V1_PREFIX)) {
    // v1データ: 復号して返す（次回書き込み時にv2で再暗号化される）
    return decryptV1(stored);
  }
  // 暗号化されていないデータ（後方互換性）
  return stored;
}

// --- 暗号化ストレージアダプタ ---

const encryptedStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const stored = await AsyncStorage.getItem(name);
    if (stored === null) return null;
    return decrypt(stored);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const encrypted = await encryptV2(value);
    await AsyncStorage.setItem(name, encrypted);
  },
  removeItem: async (name: string): Promise<void> => {
    await AsyncStorage.removeItem(name);
  },
};

export const zustandStorage = createJSONStorage(() => encryptedStorage);
