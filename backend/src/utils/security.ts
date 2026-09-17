import path from 'path';

/**
 * URLが安全かつ妥当な形式か検証する
 */
export function validateUrl(rawUrl: unknown): { valid: boolean; error?: string; url?: string } {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { valid: false, error: 'URLが入力されていません。' };
  }

  const trimmed = rawUrl.trim();

  // コマンドライン引数オプションの誤認識を防止 (- や -- から始まる文字列を拒否)
  if (trimmed.startsWith('-')) {
    return { valid: false, error: '無効なURL形式です。' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: '正しいURLの形式ではありません。' };
  }

  // http / https プロトコルのみ許可 (file:// や ftp:// などのSSRF/ローカルアクセス防止)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'httpまたはhttpsから始まるURLを指定してください。' };
  }

  // プライベートIP / localhost へのSSRF攻撃防止
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
  ) {
    return { valid: false, error: 'ローカルネットワークへのアクセスは禁止されています。' };
  }

  return { valid: true, url: parsed.toString() };
}

/**
 * ファイル名を安全な名前にサニタイズし、パストラバーサルを防止する
 */
export function sanitizeFilename(filename: string): string {
  // パス区切り文字や親ディレクトリ参照を除去
  const base = path.basename(filename);
  // OSで禁止されている文字や危険な文字を除去・置換
  return base.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'download';
}

/**
 * 指定されたファイルパスが許可されたディレクトリ内に存在するか確認
 */
export function isPathInsideDir(filePath: string, parentDir: string): boolean {
  const relative = path.relative(parentDir, filePath);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}
