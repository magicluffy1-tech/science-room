# science-room 배포 안내

## 폴더 구조
```
science-room/
├─ index.html              메인 대시보드
├─ cabinet.html            밀폐시약장 8칸 상세 페이지
├─ assets/
│  ├─ reagent-cabinet.png  시약장 사진
│  └─ reagent-data.js      화학물질 8칸 배치 데이터 (55종)
└─ README.md               (이 파일)
```

## 이번에 원본 대비 고친 것
1. `<body>` 바로 아래에 마크다운 코드펜스( ```html )와 중복 `<meta>` 태그가 그대로
   끼어 들어가 있던 버그 제거 (원본 사이트 소스에서 발견됨).
2. 비상연락망 라벨 오류 수정 — "SCHOOL NURSE"/"LAB IN-CHARGE" 라벨에 119·경찰 번호가
   잘못 붙어있던 것을 실제 항목(119 안전센터, 지구대, 안전관리책임자 조한울)으로 재배치.
3. "St. Jude Lab", "LabSafe Systems" 등 템플릿 원본 텍스트 제거.
4. MSDS 화학물질 분류 오류 수정 — 염화칼슘 중복 등록, 크로뮴산칼륨의 잘못된
   "무기산" 분류 수정 (`assets/reagent-data.js`에 반영됨).
5. 화학물질을 하드코딩 텍스트가 아니라 `assets/reagent-data.js` 데이터로 분리 →
   시약장 페이지·MSDS 요약이 이 파일 하나만 고치면 자동으로 같이 바뀜.
6. 비상 연락처는 클릭하면 바로 전화 연결되도록 `tel:` 링크 처리.

## 아직 손대지 않은 것 (원하시면 이어서 작업)
- Google Sheets(안전관리 점검표) / Apps Script(안전점검 시스템) 링크는 원본 그대로
  유지했습니다. 시트 공유 권한만 배포 전 확인하세요.
- "Lab Floor Plan" 자리는 실제 과학실 평면도 이미지가 없어 텍스트 placeholder로 남겨뒀습니다.
- 서식01~11(안전점검표, 약품출납대장 등)은 아직 페이지로 안 만들었습니다 — 필요하시면 말씀해주세요.

## GitHub 업로드 방법 (이미 science-room 리포지토리를 만들어두셨으니)

1. 이 4개 파일(폴더 구조 그대로: `index.html`, `cabinet.html`, `assets/reagent-cabinet.png`,
   `assets/reagent-data.js`)을 로컬 폴더 하나에 내려받아 정리합니다.
2. 터미널에서 그 폴더로 이동한 뒤:

```bash
git init
git add .
git commit -m "과학실 안전 대시보드 + 밀폐시약장 페이지 추가"
git branch -M main
git remote add origin https://github.com/magicluffy1-tech/science-room.git
git push -u origin main
```

   (리포지토리에 이미 커밋이 있다면 `git remote add` 대신 `git clone` 받은 폴더 안에
   파일을 넣고 `git add . && git commit -m "..." && git push` 만 하면 됩니다.)

3. **GitHub Pages 켜기**: 리포지토리 → Settings → Pages → Source를
   `Deploy from a branch` → Branch: `main` / `/(root)` 로 설정 → Save.
   몇 분 뒤 `https://magicluffy1-tech.github.io/science-room/` 로 접속하면 됩니다.
