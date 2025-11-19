# CoachRocks AI 技術文件索引

**專案**: CoachRocks AI - Enterprise-Grade AI Coaching Platform
**最後更新**: 2025-11-19
**維護者**: Development Team

---

## 📋 文件索引

### 核心功能模組

1. [Google OAuth 認證系統](./01_google_oauth.md) - Google OAuth 2.0 認證流程與實作
2. [會議分析服務](./03_meeting_analysis.md) - OpenAI 會議分析與 AI 生成
3. [資料庫服務](./04_database_service.md) - D1 資料庫操作與管理
4. [自動分析服務](./05_auto_analysis.md) - 會議自動分析調度系統

### 整合服務

6. [Zoom 整合](./06_zoom_integration.md) - Zoom 會議平台整合
7. [Google Meet 整合](./07_google_meet_integration.md) - Google Meet 會議平台整合
8. [通知郵件系統](./08_notification_emails.md) - 系統通知郵件發送

### 部署與維運

9. [GitLab CI/CD 自動部署](./09_gitlab_cicd.md) - GitLab CI/CD 自動部署設定
10. [Cloudflare 部署](./10_cloudflare_deployment.md) - Cloudflare Workers & Pages 部署

### 安全性

11. [安全最佳實踐](./11_security_practices.md) - OWASP Top 10 與安全開發規範

### 環境設定

12. [環境變數設置指南](./12_environment_variables_setup.md) ⭐ - Phase 2 環境變數完整設置指南（包含實際部署驗證）

---

## 📁 文件結構

每個技術文件包含以下章節:

### 必備章節
- **功能描述** - 功能概述與使用場景
- **檔案位置** - 相關程式碼檔案路徑
- **主要函數** - 核心函數列表與說明
- **相關函數** - 相依函數與呼叫關係
- **函數與變數列表** - 完整的函數與變數清單
- **設計概念** - 架構設計與設計模式
- **函數變數使用位置** - 函數與變數的使用位置追蹤
- **QA 常見問題** - 常見問題與解決方案
- **Debug 說明** - 除錯方法與工具

### 選用章節
- **API 端點** - API 路由與請求/回應格式
- **資料庫結構** - 資料表結構與關聯
- **環境變數** - 必要的環境變數設定
- **測試範例** - 測試案例與測試方法

---

## 🔍 快速查找

### 依功能查找

| 功能 | 文件 | 關鍵檔案 |
|------|------|----------|
| 使用者登入 | [01_google_oauth.md](./01_google_oauth.md) | `authGoogle.ts`, `authGoogleInit.ts` |
| 會議分析 | [03_meeting_analysis.md](./03_meeting_analysis.md) | `openai.ts`, `analyzeAuthenticatedMeeting.ts` |
| 資料庫操作 | [04_database_service.md](./04_database_service.md) | `database.ts` |
| 自動分析 | [05_auto_analysis.md](./05_auto_analysis.md) | `autoAnalysisService.ts` |
| Zoom 整合 | [06_zoom_integration.md](./06_zoom_integration.md) | `zoomWebhook.ts` (未實作) |
| Google Meet | [07_google_meet_integration.md](./07_google_meet_integration.md) | `googleWebhook.ts` |
| 通知郵件 | [08_notification_emails.md](./08_notification_emails.md) | `gmail.ts` |
| CI/CD 部署 | [09_gitlab_cicd.md](./09_gitlab_cicd.md) | `.gitlab-ci.yml` |
| Cloudflare 部署 | [10_cloudflare_deployment.md](./10_cloudflare_deployment.md) | `wrangler.jsonc` |
| 安全實踐 | [11_security_practices.md](./11_security_practices.md) | Security guidelines |
| 環境變數設定 | [12_environment_variables_setup.md](./12_environment_variables_setup.md) | `.gitlab-ci.yml`, `wrangler.jsonc` |

### 依開發階段查找

| 階段 | 需要閱讀的文件 |
|------|--------------|
| **環境設定** | 12_environment_variables_setup.md ⭐, 10_cloudflare_deployment.md |
| **認證開發** | 01_google_oauth.md |
| **郵件功能** | 08_notification_emails.md |
| **會議分析** | 03_meeting_analysis.md, 04_database_service.md |
| **自動化整合** | 05_auto_analysis.md, 06_zoom_integration.md, 07_google_meet_integration.md |
| **部署上線** | 12_environment_variables_setup.md, 09_gitlab_cicd.md, 10_cloudflare_deployment.md |
| **安全檢查** | 11_security_practices.md |

---

## 🛠️ 使用指南

### 新成員入門

1. **閱讀順序** (建議):
   - ⭐ 環境變數設置 → Cloudflare 部署 → 資料庫服務 → Google OAuth → 會議分析
2. **環境設定**: 參考 `12_environment_variables_setup.md` ⭐ 和 `10_cloudflare_deployment.md`
3. **本地開發**: 參考各功能文件的「開發環境設定」章節
4. **測試驗證**: 參考各功能文件的「測試範例」章節

### 問題排查

1. **檢查相關文件的 QA 章節**
2. **查看 Debug 說明**
3. **參考 `11_security_practices.md` 確認安全問題**
4. **查看專案的 `memory-bank/activeContext.md` 了解當前已知問題**

### 文件更新

- **更新頻率**: 每次功能變更後需同步更新文件
- **更新範圍**: 至少包含「函數與變數列表」、「主要函數」章節
- **版本控制**: 在文件頭部記錄「最後更新」日期

---

## 📞 支援

如有技術問題:
1. 查閱相關技術文件
2. 檢查 `memory-bank/` 目錄的專案記憶庫
3. 查看 `documents/` 目錄的開發文件
4. 聯繫開發團隊

---

**文件版本**: 1.0
**建立日期**: 2025-11-18
