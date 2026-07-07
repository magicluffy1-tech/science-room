/**
 * 서산명지중 과학실 밀폐시약장 데이터
 * 시약장 구조: 문 4개(door 1~4) x 상/하 2단(shelf: 'top'|'bottom') = 8칸
 * 분류 기준: 2026학년도 과학교육 운영계획서 Ⅶ장 참고6(위험시약 보관관리), 참고7(위험시약 분류·라벨표시)
 *
 * special: 운영계획서 참고7 "극약" 목록에 실제 포함되어 별도 시건장치(이중잠금)가
 *          필요한 물질에 true 표시. (임의 판단이 아니라 학교 자체 문서 기준입니다)
 *
 * CONFIG.APPS_SCRIPT_URL: 구글 시트를 재고 DB로 쓰는 Apps Script 웹앱 주소.
 *  - 비워두면(빈 문자열) 아래 CHEMICALS 배열(고정 데이터)만 사용합니다.
 *  - 값을 채우면 페이지가 열릴 때 이 주소에서 최신 재고를 불러와 CHEMICALS를 대체합니다.
 *  - 학교를 옮기면 이 줄 하나만 새 학교의 웹앱 주소로 바꾸면 됩니다.
 *    (설정 방법: apps-script/README.md 참고)
 */
const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzly8R-aJc_dgM7ypofjI3pINtbV1MFPH5w3a-Wv3DueWSyhIiw2P2kEN2gBfviIb5P/exec" // 예: "https://script.google.com/macros/s/AKfycb.../exec"
};

const REAGENT_DOORS = [
  {
    id: 1,
    label: "1번 문",
    top:    { key: "flammable",  title: "🔥 인화성·휘발성 물질", note: "화기 엄금 · 환기 필수" },
    bottom: { key: "indicator",  title: "🧪 저위험 지시약·유기시약", note: "" }
  },
  {
    id: 2,
    label: "2번 문",
    top:    { key: "acid",       title: "⚗️ 부식성 무기산", note: "내산 트레이 사용" },
    bottom: { key: "poison",     title: "☠️ 독약·극약 특별관리", note: "이중 잠금 권장" }
  },
  {
    id: 3,
    label: "3번 문",
    top:    { key: "oxidizer",   title: "💥 산화성 염류", note: "인화물과 이격 보관" },
    bottom: { key: "chloride",  title: "🧂 일반 무기 염화물", note: "" }
  },
  {
    id: 4,
    label: "4번 문",
    top:    { key: "carbonate",  title: "🪨 탄산염·붕산염·황산염 등", note: "" },
    bottom: { key: "metal",     title: "⚙️ 금속분말류 + 생물시료", note: "분말은 밀폐 보관" }
  }
];

const CHEMICALS = [
  // ── 1번 문 상단: 인화성·휘발성 ──
  { name: "아세톤", door: 1, shelf: "top", group: "인화물", special: false },
  { name: "에탄올", door: 1, shelf: "top", group: "인화물", special: false },
  { name: "디클로로벤젠", door: 1, shelf: "top", group: "인화물", special: false },
  { name: "나프탈렌", door: 1, shelf: "top", group: "유기일반", special: false },

  // ── 1번 문 하단: 저위험 지시약·유기시약 ──
  { name: "BTB용액", door: 1, shelf: "bottom", group: "특수약품", special: false },
  { name: "깁스액", door: 1, shelf: "bottom", group: "특수약품", special: false },
  { name: "메틸렌블루", door: 1, shelf: "bottom", group: "특수약품", special: false },
  { name: "메틸오렌지", door: 1, shelf: "bottom", group: "특수약품", special: false },
  { name: "베네딕트용액", door: 1, shelf: "bottom", group: "특수약품", special: false },
  { name: "수단Ⅲ용액", door: 1, shelf: "bottom", group: "특수약품", special: false },
  { name: "아세트산카민", door: 1, shelf: "bottom", group: "특수약품", special: false },
  { name: "인디고카민", door: 1, shelf: "bottom", group: "특수약품", special: false },
  { name: "아세트산나트륨", door: 1, shelf: "bottom", group: "유기산염", special: false },
  { name: "염화세틸피리디늄", door: 1, shelf: "bottom", group: "유기산염", special: false },
  { name: "글리세린", door: 1, shelf: "bottom", group: "유기일반", special: false },
  { name: "스테아르산", door: 1, shelf: "bottom", group: "유기일반", special: false },

  // ── 2번 문 상단: 부식성 무기산 ──
  { name: "염산", door: 2, shelf: "top", group: "무기산", special: true },
  { name: "황산", door: 2, shelf: "top", group: "무기산", special: true },
  { name: "붕산", door: 2, shelf: "top", group: "무기일반", special: true },

  // ── 2번 문 하단: 독약·극약 특별관리 ──
  { name: "아이오딘", door: 2, shelf: "bottom", group: "독극물", special: true },
  { name: "아이오딘화칼륨", door: 2, shelf: "bottom", group: "독극물", special: true },
  { name: "황산구리", door: 2, shelf: "bottom", group: "독극물", special: true },
  { name: "질산은", door: 2, shelf: "bottom", group: "특수약품", special: true },
  { name: "크로뮴산칼륨", door: 2, shelf: "bottom", group: "무기산(재분류)", special: true },
  { name: "과산화수소", door: 2, shelf: "bottom", group: "독극물", special: true },
  { name: "페놀프탈레인", door: 2, shelf: "bottom", group: "특수약품", special: true },
  { name: "티오황산나트륨 5수화물", door: 2, shelf: "bottom", group: "독극물", special: false },

  // ── 3번 문 상단: 산화성 염류 ──
  { name: "질산구리", door: 3, shelf: "top", group: "질산염", special: false },
  { name: "질산나트륨", door: 3, shelf: "top", group: "질산염", special: false },
  { name: "질산니켈", door: 3, shelf: "top", group: "질산염", special: false },
  { name: "질산칼륨", door: 3, shelf: "top", group: "질산염", special: false },
  { name: "질산칼슘", door: 3, shelf: "top", group: "질산염", special: false },
  { name: "과망간산칼륨", door: 3, shelf: "top", group: "무기일반/황산염", special: false },

  // ── 3번 문 하단: 일반 무기 염화물 ──
  { name: "염화구리", door: 3, shelf: "bottom", group: "염화물", special: false },
  { name: "염화나트륨", door: 3, shelf: "bottom", group: "염화물", special: false },
  { name: "염화바륨", door: 3, shelf: "bottom", group: "염화물", special: true },
  { name: "염화스트론튬", door: 3, shelf: "bottom", group: "염화물", special: false },
  { name: "염화칼슘", door: 3, shelf: "bottom", group: "염화물", special: false },
  { name: "염화코발트", door: 3, shelf: "bottom", group: "염화물", special: false },

  // ── 4번 문 상단: 탄산염·붕산염·황산염 등 ──
  { name: "이산화망간", door: 4, shelf: "top", group: "산화물/탄산염", special: false },
  { name: "탄산나트륨", door: 4, shelf: "top", group: "산화물/탄산염", special: false },
  { name: "탄산수소나트륨", door: 4, shelf: "top", group: "산화물/탄산염", special: false },
  { name: "붕사", door: 4, shelf: "top", group: "무기일반/황산염", special: false },
  { name: "황산나트륨", door: 4, shelf: "top", group: "무기일반/황산염", special: false },

  // ── 4번 문 하단: 금속분말류 + 생물시료 ──
  { name: "구리가루", door: 4, shelf: "bottom", group: "금속(powder)", special: false },
  { name: "구리판", door: 4, shelf: "bottom", group: "금속(powder)", special: false },
  { name: "마그네슘리본", door: 4, shelf: "bottom", group: "금속(powder)", special: false },
  { name: "아연가루", door: 4, shelf: "bottom", group: "금속(powder)", special: false },
  { name: "철가루", door: 4, shelf: "bottom", group: "금속(powder)", special: false },
  { name: "활성탄소", door: 4, shelf: "bottom", group: "비금속(powder)", special: false },
  { name: "황가루", door: 4, shelf: "bottom", group: "비금속(powder)", special: false },
  { name: "감자전분", door: 4, shelf: "bottom", group: "탄수화물", special: false },
  { name: "녹말", door: 4, shelf: "bottom", group: "탄수화물", special: false },
  { name: "포도당", door: 4, shelf: "bottom", group: "탄수화물", special: false },
  { name: "한천분말", door: 4, shelf: "bottom", group: "탄수화물", special: false }
];

// 1순위: 저장소 안의 msds/ 폴더에 "<시약명>.pdf" 로 저장된 실제 MSDS 원문을 직접 연다.
//        (예: msds/염산.pdf, msds/티오황산나트륨 5수화물.pdf)
// 2순위: 해당 파일이 없으면(파일명 불일치 등) 기존 방식대로 이름을 클립보드에 복사하고
//        KOSHA MSDS 검색 페이지를 새 탭으로 열어 붙여넣기(Ctrl+V)만 하면 되도록 자동 대체.
const MSDS_LOCAL_DIR = "msds/";
const MSDS_SEARCH_URL = "https://msds.kosha.or.kr/MSDSInfo/kcic/msdssearchMsds.do";

/**
 * 시약명만 보고 어느 문/칸에 넣어야 할지 자동으로 추정한다.
 * 1) 기존/과거에 등록된 적 있는 이름이면 그때 위치 그대로 재사용 (가장 신뢰도 높음)
 * 2) 처음 보는 이름이면 이름에 포함된 패턴(질산~, 염화~, ~가루, ~용액 등)으로 추정
 * 3) 그래도 모르면 "미분류"로 반환 — 화면에서 반드시 교사가 최종 확인/수정하도록 함
 *    (자동판단은 어디까지나 "제안"이고, 위험물 배치를 기계가 확정짓지 않게 하기 위함)
 */
function classifyChemical(name) {
  const known = CHEMICALS.find(c => c.name === name);
  if (known) {
    return { door: known.door, shelf: known.shelf, group: known.group, special: known.special, confidence: "exact" };
  }

  const rules = [
    { test: n => /^질산/.test(n), door: 3, shelf: "top", group: "질산염", special: false },
    { test: n => /^염화/.test(n), door: 3, shelf: "bottom", group: "염화물", special: false },
    { test: n => /탄산/.test(n), door: 4, shelf: "top", group: "산화물/탄산염", special: false },
    { test: n => /(가루|분말|리본|금속판|구리판)/.test(n), door: 4, shelf: "bottom", group: "금속·생물시료", special: false },
    { test: n => /(용액|카민|블루|오렌지|프탈레인|인디고|BTB)/i.test(n), door: 1, shelf: "bottom", group: "지시약·유기시약", special: false },
    { test: n => /(알코올|에탄올|아세톤|벤젠|나프탈렌)/.test(n), door: 1, shelf: "top", group: "인화성·휘발성", special: false },
    { test: n => /(요오드|아이오딘|청산|시안|비소|수은)/.test(n), door: 2, shelf: "bottom", group: "독극물", special: true },
    { test: n => /^(염산|황산|붕산)$/.test(n), door: 2, shelf: "top", group: "무기산", special: true }
  ];
  for (const r of rules) {
    if (r.test(name)) return { door: r.door, shelf: r.shelf, group: r.group, special: r.special, confidence: "guess" };
  }
  return { door: 1, shelf: "bottom", group: "미분류", special: false, confidence: "unknown" };
}

async function openMsds(name) {
  const localPath = MSDS_LOCAL_DIR + encodeURIComponent(name) + ".pdf";
  try {
    const res = await fetch(localPath, { method: "HEAD", cache: "no-store" });
    if (res.ok) {
      window.open(localPath, "_blank", "noopener");
      return;
    }
  } catch (e) {
    // 네트워크 오류 등 → 아래 폴백으로 진행
  }
  navigator.clipboard?.writeText(name).catch(() => {});
  window.open(MSDS_SEARCH_URL, "_blank", "noopener");
}

/* ============================================================
 * 재고 관리 (구글 시트 연동, CONFIG.APPS_SCRIPT_URL 설정 시에만 동작)
 * ============================================================ */

// 현재 화면에서 쓰는 실제 목록. 처음엔 고정 데이터로 시작하고,
// Apps Script 연결이 되어 있으면 최신 재고로 교체됨.
let INVENTORY = CHEMICALS.slice();

// 세션 동안만 유지되는 교사 인증 상태 (새로고침하면 다시 인증 필요 — 보안을 위해 일부러 이렇게 둠)
let teacherAuth = { authenticated: false, password: null, teacher: null };

function isBackendConfigured() {
  return !!CONFIG.APPS_SCRIPT_URL;
}

async function loadInventory() {
  if (!isBackendConfigured()) return INVENTORY; // 백엔드 미설정 시 고정 데이터 그대로 사용
  try {
    const res = await fetch(CONFIG.APPS_SCRIPT_URL, { cache: "no-store" });
    const data = await res.json();
    if (data.ok && Array.isArray(data.items) && data.items.length) {
      INVENTORY = data.items;
    }
  } catch (e) {
    console.warn("재고 서버 연결 실패, 고정 데이터로 표시합니다.", e);
  }
  return INVENTORY;
}

async function teacherLogin(teacherName, password) {
  if (!isBackendConfigured()) {
    alert("재고 관리 서버(Apps Script)가 아직 연결되어 있지 않습니다.\napps-script/README.md 설정을 먼저 완료해주세요.");
    return false;
  }
  try {
    const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "login", teacher: teacherName, password })
    });
    const data = await res.json();
    if (data.ok) {
      teacherAuth = { authenticated: true, password, teacher: teacherName };
      return true;
    }
    alert(data.error || "이름 또는 비밀번호가 올바르지 않습니다.");
    return false;
  } catch (e) {
    alert("서버 연결에 실패했습니다: " + e.message);
    return false;
  }
}

function teacherLogout() {
  teacherAuth = { authenticated: false, password: null, teacher: null };
}

async function sendInventoryAction(payload) {
  if (!isBackendConfigured()) {
    alert("아직 재고 관리 서버(Apps Script)가 연결되어 있지 않습니다.\napps-script/README.md 설정을 먼저 완료해주세요.");
    return { ok: false };
  }
  if (!teacherAuth.authenticated) {
    alert("먼저 교사 인증을 해주세요.");
    return { ok: false };
  }
  try {
    const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ ...payload, password: teacherAuth.password, teacher: teacherAuth.teacher })
    });
    const data = await res.json();
    if (!data.ok) {
      alert("실패: " + (data.error || "알 수 없는 오류"));
      if ((data.error || "").includes("이름 또는 비밀번호")) teacherLogout();
    }
    return data;
  } catch (e) {
    alert("서버 연결에 실패했습니다: " + e.message);
    return { ok: false };
  }
}

async function addChemical({ name, door, shelf, group, special, note }) {
  const result = await sendInventoryAction({ action: "add", name, door, shelf, group, special, note });
  if (result.ok) await loadInventory();
  return result;
}

async function removeChemical(name, note) {
  const result = await sendInventoryAction({ action: "remove", name, note });
  if (result.ok) await loadInventory();
  return result;
}

async function useChemical(name, note) {
  return sendInventoryAction({ action: "use", name, note });
}

/**
 * MSDS PDF 파일(File 객체)을 base64로 읽어서 GitHub의 msds/<name>.pdf 로 바로 업로드한다.
 * 서버(Apps Script)가 GitHub 토큰을 갖고 실제 업로드를 대신 처리하므로, 브라우저에는
 * GitHub 접근 권한이 전혀 노출되지 않는다.
 */
async function uploadMsdsFile(name, file) {
  if (!file) return { ok: true }; // 파일을 안 골랐으면 그냥 넘어감 (선택사항)
  if (file.size > 15 * 1024 * 1024) {
    alert("파일이 너무 큽니다 (15MB 이하로 올려주세요).");
    return { ok: false };
  }
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]); // "data:...;base64,XXXX" 에서 XXXX만
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return sendInventoryAction({ action: "uploadMsds", name, fileBase64: base64 });
}
