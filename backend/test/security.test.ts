import assert from 'assert';
import path from 'path';
import { validateUrl, sanitizeFilename, isPathInsideDir } from '../src/utils/security';

console.log('--- Running Security Unit Tests ---');

// 1. URLバリデーションテスト
console.log('1. Testing URL Validation...');

// 正常なURL
assert.strictEqual(validateUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ').valid, true);
assert.strictEqual(validateUrl('http://example.com/video.mp4').valid, true);

// 不正なURL (コマンドインジェクション・引数偽装)
assert.strictEqual(validateUrl('--help').valid, false);
assert.strictEqual(validateUrl('-v').valid, false);
assert.strictEqual(validateUrl('').valid, false);
assert.strictEqual(validateUrl('   ').valid, false);
assert.strictEqual(validateUrl('not-a-url').valid, false);

// 危険なスキーム (file://, ftp://)
assert.strictEqual(validateUrl('file:///C:/Windows/System32/calc.exe').valid, false);
assert.strictEqual(validateUrl('ftp://example.com/file').valid, false);

// SSRF (localhost / プライベートIP)
assert.strictEqual(validateUrl('http://localhost:8080/secret').valid, false);
assert.strictEqual(validateUrl('http://127.0.0.1:4000/').valid, false);
assert.strictEqual(validateUrl('http://192.168.1.1/admin').valid, false);
assert.strictEqual(validateUrl('http://10.0.0.1/').valid, false);

console.log('✓ URL Validation passed!');

// 2. ファイル名サニタイズテスト
console.log('2. Testing Filename Sanitization...');

assert.strictEqual(sanitizeFilename('../../../etc/passwd'), 'passwd');
assert.strictEqual(sanitizeFilename('..\\..\\Windows\\System32\\cmd.exe'), 'cmd.exe');
assert.strictEqual(sanitizeFilename('my:video*name?.mp3'), 'my_video_name_.mp3');
assert.strictEqual(sanitizeFilename('normal_title.mp3'), 'normal_title.mp3');

console.log('✓ Filename Sanitization passed!');

// 3. パストラバーサル防止テスト
console.log('3. Testing Directory Boundary Protection...');

const baseDir = path.resolve('C:/Users/Ranmaru/Ytdlp-modoki/backend/temp');
const safeFile = path.resolve('C:/Users/Ranmaru/Ytdlp-modoki/backend/temp/sample.mp3');
const unsafeFile = path.resolve('C:/Users/Ranmaru/Ytdlp-modoki/backend/package.json');
const outsideFile = path.resolve('C:/Windows/System32/cmd.exe');

assert.strictEqual(isPathInsideDir(safeFile, baseDir), true);
assert.strictEqual(isPathInsideDir(unsafeFile, baseDir), false);
assert.strictEqual(isPathInsideDir(outsideFile, baseDir), false);

console.log('✓ Directory Boundary Protection passed!');
console.log('🎉 All Security Tests Passed Successfully!');
