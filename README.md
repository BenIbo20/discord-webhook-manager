# Discord Webhook Manager

Discord.js v14 ve TypeScript ile geliştirilmiş, Discord sunucularındaki webhookları kolayca yönetmenizi sağlayan bir bottur.

## ✨ Özellikler

- Webhookları listeleme ve sayfalama
- Webhook detaylarını görüntüleme
- Webhook oluşturma
- Webhook silme ve düzenleme
- Webhook avatarlarını görüntüleme
- Yetki ve güvenlik kontrolleri
- Güvenli webhook URL görüntüleme

## 🛠️ Teknolojiler

- Node.js 20+
- TypeScript
- Discord.js v14
- dotenv

## 📥 Kurulum

**1. Projeyi klonlayın:**

```bash
git clone https://github.com/BenIbo20/discord-webhook-manager.git
cd discord-webhook-manager
```

**2. Paketleri yükleyin:**

```bash
npm install
```

**3. `.env` dosyasını oluşturun:**

Windows:
```powershell
Copy-Item .env.example .env
```

Linux:
```bash
cp .env.example .env
```

**4. `.env` dosyasını düzenleyin:**

```env
DISCORD_TOKEN=BOT_TOKEN
CLIENT_ID=BOT_CLIENT_ID
GUILD_ID=SUNUCU_ID
```

## 🚀 Çalıştırma

Slash komutlarını yüklemek için:

```bash
npm run deploy
```

Projeyi derlemek için:

```bash
npm run build
```

Botu başlatmak için:

```bash
npm start
```

Geliştirme modu:

```bash
npm run dev
```

## 📋 Komutlar

| Komut | Açıklama |
|---|---|
| `/webhook liste` | Webhookları listeler |
| `/webhook bilgi` | Webhook detaylarını gösterir |
| `/webhook olustur` | Yeni webhook oluşturur |
| `/webhook sil` | Webhook siler |
| `/webhook duzenle` | Webhook düzenler |

## 🔒 Güvenlik

- Yetkisiz webhook işlemleri engellenir.
- Silme işlemleri onay gerektirir.
- Webhook URL'leri varsayılan olarak gizlidir.
- Bot tokenı `.env` dosyasında saklanmalıdır.

**Önemli:** `.env` dosyanızı ve webhook URL'lerinizi kimseyle paylaşmayın.

## 👨‍💻 Geliştirici

**BenIbo20**

[GitHub Profilim](https://github.com/BenIbo20)

---

BenIbo20 tarafından ❤️ ile geliştirildi.