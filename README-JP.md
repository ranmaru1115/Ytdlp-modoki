# Ytdlp-modoki (YouTubeメディア変換Webサービス)

Googleの **Material 3 Design System** に準拠したUIと、Windows自宅PC上で動作する **yt-dlp** & **FFmpeg** を利用したメディア変換Webサービスです。

フロントエンドは **Vercel** へのデプロイを前提とし、重い変換処理・ダウンロード処理は自宅PCのバックエンド側で安全に実行・管理されます。

---

## 主な特徴

- **Material 3 準拠 UI**:
  - Material 3 の Typography, Color Scheme, Surface/Elevation, 角丸Shape (Pillボタン等) を完全採用
  - OS設定に追従する自動 Light / Dark モード切り替え + 手動切替 (Light / Dark / System)
  - モバイルファーストのレスポンシブ設計（スマートフォンでも快適に片手操作可能）
- **対応メディア形式**:
  - **音声**: MP3 (128k, 192k, 256k, 320k), M4A (AAC), Opus
  - **動画**: MP4 (最高画質, 1080p, 720p, 480p)
- **堅牢なジョブ & 進捗管理**:
  - `queued` → `fetching` → `downloading` → `converting` → `completed`
  - yt-dlp および FFmpeg の進捗（%）をリアルタイムでProgress Indicatorに反映
  - 同時実行数制限 (`MAX_CONCURRENT_JOBS`) によるPC負荷防止
- **自動クリーンアップ**:
  - 変換済みファイルは指定TTL (`FILE_TTL_MINUTES`, デフォルト30分) 経過後に自動削除
  - 異常終了・中断された一時ファイルも定期スケジューラーが自動削除
- **高度なセキュリティ**:
  - `spawn` による完全配列引数渡し（シェル文字列連結によるコマンドインジェクションを根絶）
  - URL構文検証・SSRF防止（ローカルネットワーク宛て通信の遮断）
  - パストラバーサル対策（一時ディレクトリ外部のファイルアクセス遮断）
  - レートリミット & API認証 (`API_TOKEN`) & CORSホワイトリスト

---

## システム構成図

```text
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │ Vercel          │
              │ Web Frontend    │
              │ React + Vite    │
              │ (Material 3 UI) │
              └────────┬────────┘
                       │ HTTPS API (Cloudflare Tunnel / グローバルURL)
                       ▼
              ┌─────────────────┐
              │ 自宅Windows PC  │
              │ Node.js Backend │
              └────────┬────────┘
                       │
                 ┌─────┴─────┐
                 ▼           ▼
              yt-dlp       FFmpeg
                 │           │
                 └─────┬─────┘
                       ▼
                  一時ファイル (backend/temp/)
                       │
                       ▼
                  ブラウザへダウンロード
```

---

## セットアップ手順

### 1. Node.js のインストール
Node.js (v20以上推奨、v24動作確認済み) をインストールします。
- 公式サイト: [https://nodejs.org/](https://nodejs.org/)

インストール確認:
```powershell
node -v
npm -v
```

### 2. yt-dlp のセットアップ
Windows PCに `yt-dlp.exe` を用意します。

- 公式GitHub Releases: [https://github.com/yt-dlp/yt-dlp/releases](https://github.com/yt-dlp/yt-dlp/releases)
- ダウンロードした `yt-dlp.exe` を任意のフォルダ（例: `C:\Users\<ユーザー名>\yt-dlp.exe` または PATH の通った場所）に配置します。

### 3. FFmpeg のセットアップ
Windows用の FFmpeg を用意します。

- 公式配布元 (gyan.dev等): [https://www.gyan.dev/ffmpeg/builds/](https://www.gyan.dev/ffmpeg/builds/)
- 解凍後、`bin/ffmpeg.exe` のパスを確認します。
- （例: `C:\Users\<ユーザー名>\Downloads\ffmpeg-master-latest-win64-gpl-shared\bin\ffmpeg.exe` または システムPATH）

### 4. `.env` の作成

#### バックエンド設定 (`backend/.env`)
`backend/.env.example` をコピーして `backend/.env` を作成します。

```powershell
cp backend/.env.example backend/.env
```

内容例:
```env
PORT=4000
HOST=0.0.0.0

# 実行ファイルパス (環境に合わせて設定)
YTDLP_PATH=C:\Users\Ranmaru\yt-dlp.exe
FFMPEG_PATH=C:\Users\Ranmaru\Downloads\ffmpeg-master-latest-win64-gpl-shared\ffmpeg-master-latest-win64-gpl-shared\bin\ffmpeg.exe

# ジョブ & リソース管理
MAX_CONCURRENT_JOBS=2
FILE_TTL_MINUTES=30

# APIトークン (外部公開時に保護したい場合は設定)
API_TOKEN=your-secret-token

# CORS許可オリジン (カンマ区切り)
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.vercel.app
```

#### フロントエンド設定 (`frontend/.env`)
`frontend/.env.example` をコピーして `frontend/.env` を作成します。

```powershell
cp frontend/.env.example frontend/.env
```

内容例:
```env
# ローカル開発時は未指定でOK (Viteプロキシが利用されます)
# Vercelデプロイ時: 自宅PCのバックエンド公開URLを指定
VITE_API_URL=https://api.yourdomain.com
VITE_API_TOKEN=your-secret-token
```

### 5. 依存関係のインストール

プロジェクトルートで以下を実行します。
```powershell
npm install
```

### 6. 開発サーバーの起動

#### バックエンドとフロントエンドを同時に起動
```powershell
npm run dev
```

個別に起動する場合:
- バックエンド: `npm run dev:backend` (http://localhost:4000)
- フロントエンド: `npm run dev:frontend` (http://localhost:5173)

ブラウザで `http://localhost:5173` を開くと、Material 3 UI の画面が表示されます。

---

## 7. Vercel へのデプロイ手順

フロントエンドは静的SPAとして Vercel に簡単にデプロイできます。

1. GitHub 等にリポジトリをプッシュします。
2. [Vercel Dashboard](https://vercel.com/) で「New Project」を選択し、リポジトリをインポートします。
3. デプロイ設定:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_API_URL`: 自宅PCのバックエンドURL（後述）
   - `VITE_API_TOKEN`: (設定している場合) バックエンドの `API_TOKEN`
5. 「Deploy」をクリックして完了です。

---

## 8. 自宅PCバックエンドへの外部接続設定

Vercel 上のフロントエンドから自宅PCのバックエンドに安全に接続するには、無料の **Cloudflare Tunnel** などを利用するのが最も安全で推奨されます（ルーターのポート開放不要）。

### Cloudflare Tunnel を利用した接続例:
```powershell
# cloudflared をダウンロードして実行
cloudflared tunnel --url http://localhost:4000
```
発行された URL (例: `https://xxxxxx.trycloudflare.com`) を:
1. `backend/.env` の `ALLOWED_ORIGINS` に Vercel のドメインを追加
2. Vercel の環境変数 `VITE_API_URL` に設定
3. または画面右上の ⚙️「設定」ダイアログからブラウザ上で直接入力して即時接続可能

---

## API仕様

| メソッド | エンドポイント | 説明 |
| :--- | :--- | :--- |
| `GET` | `/api/health` | サーバー稼働状態・yt-dlp / FFmpeg バージョン確認 |
| `POST` | `/api/info` | 動画メタデータ取得 (タイトル, サムネイル, 長さ等) |
| `POST` | `/api/jobs` | 変換ジョブ作成 (`url`, `format`, `quality`) |
| `GET` | `/api/jobs/:id` | ジョブ状態・進捗取得 (0〜100%) |
| `GET` | `/api/jobs/:id/download` | 変換済みメディアのダウンロード配信 |
| `DELETE` | `/api/jobs/:id` | ジョブと一時ファイルの削除 |

---

## ライセンス
MIT License
