# Threat Model - CoachRocks AI

**Version**: 1.0.0
**Last Updated**: 2025-10-30
**Methodology**: STRIDE

## Executive Summary

CoachRocks AI 處理敏感的教練會議資料和客戶個人資訊，因此面臨多種安全威脅。本威脅模型識別主要威脅、評估風險，並定義緩解策略。

## System Overview

### High-Level Architecture

```
[User Browser] <--HTTPS--> [Cloudflare Edge]
                                 |
                    +------------+------------+
                    |                         |
            [Frontend Workers]          [Backend Workers]
                    |                         |
                    |                    [Drizzle ORM]
                    |                         |
                    +------------+------------+
                                 |
                        [Cloudflare D1 Database]
                                 |
                    +------------+------------+
                    |            |            |
              [OpenAI API]  [Deepgram]  [Gmail SMTP]
                    |            |            |
                 [Zoom]    [Google Meet]  [Perplexity]
```

### Key Assets

#### Critical Assets (高價值)
1. **使用者認證資訊**
   - JWT Tokens (access + refresh)
   - OAuth Tokens (Google, Zoom, Google Meet)
   - 密碼雜湊

2. **客戶個人資訊 (PII)**
   - 姓名、Email、電話
   - 會議記錄內容
   - 客戶行動項目

3. **會議內容**
   - 音訊/影片檔案
   - 逐字稿
   - AI 分析結果

#### Important Assets (中價值)
4. **API 金鑰**
   - OpenAI API Key
   - Deepgram API Key
   - 第三方整合金鑰

5. **業務邏輯**
   - AI Prompt 模板
   - 分析演算法
   - 商業邏輯

#### Supporting Assets (低價值)
6. **應用程式程式碼**
   - 開源/閉源程式碼
   - 配置檔案

## STRIDE Threat Analysis

### 1. Spoofing (身份偽造)

#### Threat 1.1: 使用者帳號接管
**Description**: 攻擊者透過竊取認證資訊冒充合法使用者

**Attack Vectors**:
- 釣魚攻擊竊取密碼
- Session hijacking
- JWT token 洩漏
- OAuth token 竊取

**Impact**: 🔴 Critical
- 存取所有使用者資料
- 修改或刪除會議記錄
- 冒充使用者傳送 Email

**Likelihood**: 🟡 Medium (常見攻擊手法)

**Mitigation**:
- ✅ **M1.1**: 強制使用強密碼（最少 12 字元）
- ✅ **M1.2**: bcrypt 密碼雜湊（work factor ≥ 12）
- 🚧 **M1.3**: 短期 JWT Token（15 分鐘）
- 🚧 **M1.4**: HttpOnly, Secure cookies
- ⏸️ **M1.5**: 多因素認證（MFA）
- ⏸️ **M1.6**: 異常登入偵測和警報

**Residual Risk**: 🟡 Medium (MFA 實作後降至 Low)

#### Threat 1.2: API 金鑰洩漏
**Description**: 第三方 API 金鑰被竊取並濫用

**Attack Vectors**:
- 程式碼 commit 洩漏
- 環境變數曝露
- 日誌檔案洩漏
- 記憶體 dump

**Impact**: 🟡 High
- 未授權的 API 使用（成本增加）
- 資料外洩至第三方
- 服務中斷（配額耗盡）

**Likelihood**: 🟡 Medium

**Mitigation**:
- ✅ **M1.7**: 使用 Cloudflare Secrets 儲存金鑰
- 🚧 **M1.8**: 金鑰輪換機制（每 90 天）
- 🚧 **M1.9**: Git hooks 防止金鑰 commit
- ⏸️ **M1.10**: 監控 API 使用異常

**Residual Risk**: 🟢 Low

---

### 2. Tampering (資料竄改)

#### Threat 2.1: SQL Injection
**Description**: 攻擊者注入惡意 SQL 指令修改或刪除資料

**Attack Vectors**:
- 使用者輸入未淨化
- URL 參數注入
- HTTP Header 注入

**Impact**: 🔴 Critical
- 資料庫完整性破壞
- 資料外洩
- 權限提升

**Likelihood**: 🟢 Low (使用 ORM)

**Mitigation**:
- ✅ **M2.1**: 使用 Drizzle ORM（參數化查詢）
- 🚧 **M2.2**: Zod schema 輸入驗證
- 🚧 **M2.3**: 最小權限資料庫帳號
- ⏸️ **M2.4**: 定期 SQLMap 掃描

**Residual Risk**: 🟢 Low

#### Threat 2.2: Cross-Site Scripting (XSS)
**Description**: 攻擊者注入惡意 JavaScript 腳本

**Attack Vectors**:
- Stored XSS（會議標題、註解）
- Reflected XSS（搜尋參數）
- DOM-based XSS（前端處理）

**Impact**: 🟡 High
- Session token 竊取
- 使用者操作劫持
- 惡意內容注入

**Likelihood**: 🟡 Medium

**Mitigation**:
- ✅ **M2.5**: React 自動 escaping
- 🚧 **M2.6**: DOMPurify 淨化輸入
- 🚧 **M2.7**: Content Security Policy (CSP)
- 🚧 **M2.8**: 輸入驗證和輸出編碼

**Residual Risk**: 🟡 Low-Medium

#### Threat 2.3: Man-in-the-Middle (MITM)
**Description**: 攻擊者攔截並修改傳輸中的資料

**Attack Vectors**:
- 不安全的 Wi-Fi
- DNS 劫持
- SSL Strip 攻擊

**Impact**: 🔴 Critical
- 認證資訊竊取
- 資料竄改
- 惡意內容注入

**Likelihood**: 🟢 Low (HTTPS 強制)

**Mitigation**:
- ✅ **M2.9**: 強制 HTTPS（Cloudflare 自動）
- 🚧 **M2.10**: HSTS Headers
- ⏸️ **M2.11**: Certificate Pinning（行動 App）

**Residual Risk**: 🟢 Low

---

### 3. Repudiation (否認性)

#### Threat 3.1: 缺乏審計追蹤
**Description**: 使用者否認執行的操作，無法追溯

**Attack Vectors**:
- 刪除操作無記錄
- 權限變更無追蹤
- 資料匯出無日誌

**Impact**: 🟡 Medium
- 合規性問題
- 爭議無法解決
- 安全事件調查困難

**Likelihood**: 🟡 Medium (初期系統)

**Mitigation**:
- 🚧 **M3.1**: 審計日誌記錄所有敏感操作
- 🚧 **M3.2**: 不可竄改的日誌儲存
- ⏸️ **M3.3**: 數位簽章（重要操作）
- ⏸️ **M3.4**: 90 天日誌保留

**Residual Risk**: 🟢 Low

---

### 4. Information Disclosure (資訊洩漏)

#### Threat 4.1: 資料庫洩漏
**Description**: 未授權存取資料庫內容

**Attack Vectors**:
- SQL Injection
- 權限設定錯誤
- 備份檔案洩漏
- 記憶體 dump

**Impact**: 🔴 Critical
- 所有使用者資料外洩
- PII 洩漏（GDPR 違規）
- 商業機密洩漏

**Likelihood**: 🟢 Low (Cloudflare D1 隔離)

**Mitigation**:
- ✅ **M4.1**: Cloudflare D1 at-rest 加密
- 🚧 **M4.2**: 敏感欄位額外加密（AES-256-GCM）
- 🚧 **M4.3**: Row-level 存取控制
- ⏸️ **M4.4**: 資料遮罩（非管理員）
- ⏸️ **M4.5**: 定期安全掃描

**Residual Risk**: 🟢 Low

#### Threat 4.2: API 資料洩漏
**Description**: 過度詳細的錯誤訊息或回應洩漏內部資訊

**Attack Vectors**:
- Stack trace 曝露
- 詳細錯誤訊息
- Debug 模式啟用
- Verbose API 回應

**Impact**: 🟡 Medium
- 系統架構洩漏
- 資料庫結構洩漏
- 攻擊面增加

**Likelihood**: 🟡 Medium

**Mitigation**:
- 🚧 **M4.6**: 通用錯誤訊息給使用者
- 🚧 **M4.7**: 詳細錯誤僅記錄內部
- 🚧 **M4.8**: 禁用生產環境 Debug 模式
- ⏸️ **M4.9**: API 回應最小化

**Residual Risk**: 🟢 Low

#### Threat 4.3: 第三方服務洩漏
**Description**: 透過第三方 API 洩漏資料

**Attack Vectors**:
- OpenAI 訓練資料使用
- 第三方 API 日誌
- 傳輸中攔截

**Impact**: 🟡 High
- 客戶隱私洩漏
- 商業機密洩漏
- 合規性違規

**Likelihood**: 🟡 Medium

**Mitigation**:
- ✅ **M4.10**: 使用 OpenAI Enterprise API（資料不訓練）
- 🚧 **M4.11**: TLS 加密所有 API 呼叫
- 🚧 **M4.12**: 資料最小化（僅傳送必要資料）
- ⏸️ **M4.13**: 資料處理協議（DPA）審查

**Residual Risk**: 🟡 Low-Medium

---

### 5. Denial of Service (服務阻斷)

#### Threat 5.1: DDoS 攻擊
**Description**: 大量請求導致服務無法使用

**Attack Vectors**:
- HTTP 洪水攻擊
- Slowloris 攻擊
- Application-layer DDoS

**Impact**: 🔴 High
- 服務完全中斷
- 合法使用者無法存取
- 成本增加

**Likelihood**: 🟡 Medium

**Mitigation**:
- ✅ **M5.1**: Cloudflare 自動 DDoS 防護
- 🚧 **M5.2**: 速率限制（IP + 使用者層級）
- 🚧 **M5.3**: WAF 規則設定
- ⏸️ **M5.4**: 異常流量監控和警報

**Residual Risk**: 🟢 Low (Cloudflare 緩解)

#### Threat 5.2: 資源耗盡
**Description**: 惡意上傳大檔案或複雜查詢耗盡資源

**Attack Vectors**:
- 大型檔案上傳
- 複雜 SQL 查詢
- 無限迴圈 API 呼叫

**Impact**: 🟡 Medium
- 服務效能下降
- 成本增加
- 部分服務中斷

**Likelihood**: 🟡 Medium

**Mitigation**:
- 🚧 **M5.5**: 檔案上傳大小限制（500 MB）
- 🚧 **M5.6**: 查詢超時設定
- 🚧 **M5.7**: API 速率限制
- ⏸️ **M5.8**: 資源使用監控

**Residual Risk**: 🟢 Low

---

### 6. Elevation of Privilege (權限提升)

#### Threat 6.1: 水平權限提升
**Description**: 使用者存取其他使用者的資料

**Attack Vectors**:
- IDOR (Insecure Direct Object Reference)
- 未驗證資源擁有權
- URL 參數竄改

**Impact**: 🔴 High
- 未授權資料存取
- 隱私違規
- 資料竄改

**Likelihood**: 🟡 Medium (常見漏洞)

**Mitigation**:
- 🚧 **M6.1**: 強制資源擁有權驗證
- 🚧 **M6.2**: 使用 UUID 而非序列 ID
- 🚧 **M6.3**: 授權中介層
- ⏸️ **M6.4**: 自動化測試（權限檢查）

**Residual Risk**: 🟡 Low-Medium

#### Threat 6.2: 垂直權限提升
**Description**: 一般使用者取得管理員權限

**Attack Vectors**:
- RBAC 實作錯誤
- JWT payload 竄改
- 權限檢查繞過

**Impact**: 🔴 Critical
- 完整系統控制
- 所有資料存取
- 系統破壞

**Likelihood**: 🟢 Low (設計階段防護)

**Mitigation**:
- 🚧 **M6.5**: 嚴格的 RBAC 實作
- 🚧 **M6.6**: JWT 簽名驗證（RS256）
- 🚧 **M6.7**: 最小權限原則
- ⏸️ **M6.8**: 定期權限審查

**Residual Risk**: 🟢 Low

---

## Risk Matrix

### Risk Scoring
- **Impact**: Critical (4), High (3), Medium (2), Low (1)
- **Likelihood**: High (3), Medium (2), Low (1)
- **Risk Score**: Impact × Likelihood

| Threat ID | Threat | Impact | Likelihood | Risk Score | Residual Risk |
|-----------|--------|--------|------------|------------|---------------|
| 1.1 | 帳號接管 | 4 | 2 | 8 | 🟡 Medium → 🟢 Low (MFA) |
| 1.2 | API 金鑰洩漏 | 3 | 2 | 6 | 🟢 Low |
| 2.1 | SQL Injection | 4 | 1 | 4 | 🟢 Low |
| 2.2 | XSS | 3 | 2 | 6 | 🟡 Low-Medium |
| 2.3 | MITM | 4 | 1 | 4 | 🟢 Low |
| 3.1 | 缺乏審計 | 2 | 2 | 4 | 🟢 Low |
| 4.1 | 資料庫洩漏 | 4 | 1 | 4 | 🟢 Low |
| 4.2 | API 洩漏 | 2 | 2 | 4 | 🟢 Low |
| 4.3 | 第三方洩漏 | 3 | 2 | 6 | 🟡 Low-Medium |
| 5.1 | DDoS | 3 | 2 | 6 | 🟢 Low |
| 5.2 | 資源耗盡 | 2 | 2 | 4 | 🟢 Low |
| 6.1 | 水平權限提升 | 3 | 2 | 6 | 🟡 Low-Medium |
| 6.2 | 垂直權限提升 | 4 | 1 | 4 | 🟢 Low |

---

## Data Flow Diagrams

### Authentication Flow

```
[User] --1. Login Request--> [Backend API]
                                  |
                     2. Verify Credentials (bcrypt)
                                  |
                          [Cloudflare D1]
                                  |
                     3. Generate JWT Tokens
                                  |
[User] <--4. Set Secure Cookies-- [Backend API]
```

**Threats**:
- 1→2: Credential stuffing, brute force (M1.3: Rate limiting)
- 2→3: Timing attacks (M1.2: bcrypt)
- 3→4: Token leakage (M1.4: HttpOnly, Secure cookies)

### Meeting Upload Flow

```
[User] --1. Upload File--> [Backend API]
                               |
                  2. Virus Scan & Validation
                               |
                  3. Encrypt & Store in R2
                               |
[Deepgram API] <--4. Transcribe-- [Backend API]
                               |
[OpenAI API] <----5. Analyze---- [Backend API]
                               |
                  6. Store Results (Encrypted)
                               |
                         [Cloudflare D1]
```

**Threats**:
- 1→2: Malware upload (M5.5: File validation)
- 3: Data at rest exposure (M4.1, M4.2: Encryption)
- 4→5: Data in transit exposure (M4.11: TLS)
- 5: Third-party leakage (M4.10: Enterprise API)

---

## Assumptions and Dependencies

### Assumptions
1. Cloudflare infrastructure 是安全的
2. Third-party API providers 遵守安全最佳實踐
3. 使用者裝置有基本安全防護（防毒軟體等）
4. 使用者不會與他人分享帳號

### External Dependencies
1. **Cloudflare**: DDoS 防護、WAF、Edge 運算
2. **OpenAI**: API 安全性、資料隱私承諾
3. **Deepgram**: 轉錄服務安全性
4. **Google/Zoom**: OAuth 安全性、API 可用性

---

## Security Controls Summary

### Implemented (✅)
- Cloudflare 自動 DDoS 防護
- Cloudflare D1 at-rest 加密
- Drizzle ORM（防 SQL Injection）
- React 自動 XSS 防護
- HTTPS 強制（TLS 1.3）

### In Progress (🚧)
- JWT 認證系統
- 速率限制中介層
- 輸入驗證（Zod）
- RBAC 授權
- 審計日誌系統
- 敏感資料加密

### Planned (⏸️)
- 多因素認證（MFA）
- Certificate Pinning
- 異常偵測系統
- SOC 2 認證
- 定期滲透測試

---

## Recommendations

### High Priority (實作於 Day 1-7)
1. ✅ 完成 JWT 認證系統（M1.3, M1.4）
2. ✅ 實作速率限制（M1.3, M5.2）
3. ✅ 建立輸入驗證框架（M2.2, M2.8）
4. ✅ 實作 RBAC（M6.5）
5. ✅ 建立審計日誌（M3.1）

### Medium Priority (Day 8-14)
6. ⚠️ 第三方整合安全化（M4.10-M4.13）
7. ⚠️ 實作資料加密（M4.2）
8. ⚠️ 資源限制（M5.5-M5.7）
9. ⚠️ 權限驗證（M6.1-M6.4）

### Low Priority (未來版本)
10. 📌 MFA 實作（M1.5）
11. 📌 進階監控（M1.6, M5.4, M5.8）
12. 📌 Certificate Pinning（M2.11）
13. 📌 SOC 2 認證流程

---

## Review and Updates

**Review Schedule**: 每季度或重大變更後

**Next Review**: 2025-11-30

**Stakeholders**:
- Security Team
- Tech Lead
- Product Owner

**Sign-off**: Required before production deployment

---

**Document Version**: 1.0.0
**Created**: 2025-10-30
**Last Updated**: 2025-10-30
**Author**: Security Team
