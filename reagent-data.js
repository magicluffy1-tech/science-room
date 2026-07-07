/**
 * 서산명지중 과학실 밀폐시약장 데이터
 * 시약장 구조: 문 4개(door 1~4) x 상/하 2단(shelf: 'top'|'bottom') = 8칸
 * 분류 기준: 2026학년도 과학교육 운영계획서 Ⅶ장 참고6(위험시약 보관관리), 참고7(위험시약 분류·라벨표시)
 *
 * special: 운영계획서 참고7 "극약" 목록에 실제 포함되어 별도 시건장치(이중잠금)가
 *          필요한 물질에 true 표시. (임의 판단이 아니라 학교 자체 문서 기준입니다)
 */

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

// KOSHA MSDS 검색 페이지: 검색폼이 JS 기반이라 이름으로 결과에 바로 딥링크할 수 없음.
// → 이름을 클립보드에 복사한 뒤 검색 페이지를 새 탭으로 열어, 붙여넣기(Ctrl+V)만 하면 되도록 처리.
const MSDS_SEARCH_URL = "https://msds.kosha.or.kr/MSDSInfo/kcic/msdssearchMsds.do";

function openMsds(name) {
  navigator.clipboard?.writeText(name).catch(() => {});
  window.open(MSDS_SEARCH_URL, "_blank", "noopener");
}
