// 管理員工具：幫忘記密碼、沒綁 Email 的玩家重設密碼
// 用法（在自己電腦執行）：
//   1. 安裝 Node.js，然後在這個資料夾執行：npm install firebase-admin
//   2. Firebase 主控台 → 專案設定 → 服務帳戶 → 「產生新的私密金鑰」，下載成 key.json 放在這個資料夾
//   3. node reset-password.js key.json jtrn193 新密碼
//   4. 用完把 key.json 刪掉（這把金鑰等於整個專案的管理權限，不要上傳、不要傳給別人）
const path = require('path');
const admin = require('firebase-admin');

const [, , keyFile, name, pass] = process.argv;
if (!keyFile || !name || !pass) { console.log('用法：node reset-password.js key.json 帳號 新密碼'); process.exit(1); }
if (pass.length < 6) { console.log('❌ 新密碼至少要 6 個字'); process.exit(1); }

admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(keyFile))) });

(async () => {
  const key = name.trim().toLowerCase();                      // 跟遊戲裡的帳號比對方式一樣（不分大小寫）
  const db = admin.firestore(); db.settings({ preferRest: true });   // 有些網路擋 gRPC，改用 REST 比較穩
  const doc = await db.doc('usernames/' + key).get();
  if (!doc.exists) { console.log(`❌ 找不到帳號「${name}」`); process.exit(1); }
  const uid = doc.data().uid;
  const user = await admin.auth().getUser(uid);
  await admin.auth().updateUser(uid, { password: pass });
  console.log(`✅ 帳號「${name}」的密碼已經改好了（uid：${uid}，登入信箱：${user.email}）`);
  console.log('請玩家用新密碼登入後，到「個人資料 → 🔐 帳號安全」改成自己的密碼並綁定 Email，以後忘記密碼就能自己重設。');
  process.exit(0);
})().catch(e => { console.error('❌ 失敗：', e.message); process.exit(1); });
