# Sobok-Server
:snowman:소복소복 귀요미 둘:snowman::pill:

## 개발 담당

### [강한희](https://github.com/kanghanhee)
```
로그인 회원가입

공유

알림(캘린더 공유 기능)
```

### [이승헌](https://github.com/lsh328328)
```
메인

약 추가

알림(약 추가 기능)
```

## 📂 Folder Structure

```markdown
📦functions
┣ 📂api
┃ ┣ 📂routes
┃ ┃ ┣ 📂auth
┃ ┃ ┃ ┣ 📜authLoginEmail.js
┃ ┃ ┃ ┣ 📜authSignupPOST.js
┃ ┃ ┃ ┣ 📜index.js
┃ ┃ ┣ 📂group
┃ ┃ ┃ ┣ 📜groupGET.js
┃ ┃ ┃ ┣ 📜index.js
┃ ┃ ┣ 📂notice
┃ ┃ ┃ ┣ 📜index.js
┃ ┃ ┃ ┣ 📜pillInfoGET.js
┃ ┃ ┣ 📂pill
┃ ┃ ┃ ┣ 📜index.js
┃ ┃ ┃ ┣ 📜pillAdditionPOST.js
┃ ┃ ┣ 📜index.js
┃ ┣ 📜index.js
┣ 📂config
┃ ┣ 📜dbConfig.js
┃ ┣ 📜firebaseClient.js
┣ 📂constants
┃ ┣ 📜jwt.js
┃ ┣ 📜responseMessage.js
┃ ┣ 📜statusCode.js
┣ 📂db
┃ ┣ 📜db.js
┃ ┣ 📜group.js
┃ ┣ 📜index.js
┃ ┣ 📜pill.js
┃ ┣ 📜schedule.js
┃ ┣ 📜sendPill.js
┃ ┣ 📜user.js
┣ 📂lib
┃ ┣ 📜convertSnakeToCamel.js
┃ ┣ 📜jwtHandlers.js
┃ ┣ 📜util.js
┣ 📂middlewares
┃ ┣ 📜auth.js
┣ 📜.eslintrc.js
┣ 📜.prettierrc.js
┣ 📜index.js
```

## 💻 Code Convention
https://www.notion.so/baejiann120/Code-Convention-31a5fa668d2b4aa48939f3c752d54b07

## 💬 Commit Message Rules
https://www.notion.so/baejiann120/Commit-Convention-bcc6fe6c6e004e988f29ccf4dcd6dcab

**Example**

```
[feat] : "추가 로그인 함수"

로그인 API 개발

(사용 x)
Resolves: #123
Ref: #456
Related to: #48, #45
```

### 🔅 Branches

- `main` : 메인 브랜치
  - `main`에 직접적인 commit, push는 가급적 금지합니다
  - 작업 전, 반드시 `main` 브랜치를 pull 받고 시작합니다
    ```
    git pull origin main
    ```
- `develop` : develop 브랜치
  - 계획한 모든 기능 구현 & 테스트 통과 시 `main` 브랜치로 Pull Request를 보내서 Merge 합니다
- `feature/기능` : 해당 기능 개발 브랜치
  - 작업 완료 시 `main` 브랜치로 Pull Request를 보냅니다
  - 기능 개발 시 `feature/기능` 브랜치를 파서 관리합니다
    ```
    git branch feature/기능
    ```
- 작은 기능별로 `commit message rules`에 따라 커밋을 진행합니다
- 다 쓴 브랜치는 삭제합니다

## ✨ Base URL

```

```

## ERD Diagram

### 👉 [SobokSobok ERD](https://www.notion.so/baejiann120/ERD-5ff674606b2d41db89c970c65b873188)

## API 명세서

### 👉 [API 명세서](https://www.notion.so/baejiann120/API-6280231150ca40eeb2de46beb5292931)
