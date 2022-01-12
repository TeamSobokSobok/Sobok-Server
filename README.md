## 
소복소복, 소중한 사람과 함께하는 복약 체크서비스:pill:

## 개발 담당

### [강한희](https://github.com/kanghanhee)
```
로그인, 회원가입

공유관련

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
┣ 📂config
┣ 📂constants
┣ 📂db
┣ 📂lib
┣ 📂middlewares
┣ 📜.eslintrc.js
┣ 📜.prettierrc.js
┣ 📜index.js
```

## 💻 Code Convention

## 💬 Commit Message Rules
| 태그 이름  |                             설명                             |
| :--------: | :----------------------------------------------------------: |
|   [feat]   |                       새로운 기능 구현                       |
|  [update]  |                   feat 이외의 부수적인 코드 추가             |
|   [fix]    |                         버그, 오류 해결                      |
|  [hotfix]  |             issue나 QA에서 급한 버그 수정에 사용             |
|   [style]  |       코드 포맷 변경, 세미콜론 누락, 코드 수정이 없는 경우    |
| [refactor] |                     프로덕션 코드 리팩토링                   |
|   [docs]   |             문서를 수정한 경우, 파일 삭제, 파일명 수정 등     |
|  [chore]   |                          내부 파일 수정                      |

**Example**

```
[feat] : "로그인 api 구현"
```

### 🔅 Branches

- `develop` : develop 브랜치
  - `develop`에 직접적인 commit, push는 가급적 금지합니다
  - 작업 전, 반드시 `develop` 브랜치를 pull 받고 시작합니다
    ```
    git pull origin develop
    ```
  - 계획한 모든 기능 구현 & 테스트 통과 시 `main` 브랜치로 Pull Request를 보내서 Merge 합니다
 
- `feature/#issue number` : 해당 기능 개발 브랜치
  - 작업 완료 시 `develop` 브랜치로 Pull Request를 보냅니다
  - 새로운 기능 개발 시 `feature/#issue number` 브랜치를 파서 관리합니다
    ```
    git branch feature/#issue number
    ```
- 커밋은 되도록 파일, 폴더단위로 직접 입력하여 진행합니다
- merge는 github에서 진행합니다
- 다 쓴 브랜치는 삭제합니다

## ✨ Base URL

```

```

### 👉 [SobokSobok ERD]
![image](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/374f114b-4dcd-4f0a-83d2-cc3f4bca9061/sobok-erd.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20220112%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20220112T113821Z&X-Amz-Expires=86400&X-Amz-Signature=edd0cd1abb22e6c8a60abac10044f0f3698e11ce7d562e5b9d256c9bffb022da&X-Amz-SignedHeaders=host&response-content-disposition=filename%20%3D%22sobok-erd.png%22&x-id=GetObject)


### 👉 [API 명세서 링크](https://www.notion.so/baejiann120/API-6280231150ca40eeb2de46beb5292931)
