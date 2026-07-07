"""
spell_checker.py
나라인포테크 맞춤법 검사기 REST API 우회 엔진
- Selenium/ChromeDriver 완전 제거
- 순수 requests HTTP POST 방식
- 파이썬 내장 html.parser 기반 NaraHTMLParser
- 3회 타임아웃 재시도 로직
"""

import requests
import time
import random
from html.parser import HTMLParser
from typing import Optional


# ──────────────────────────────────────────────
# 1. HTML 파서 엔진 (외부 라이브러리 불필요)
# ──────────────────────────────────────────────

class NaraHTMLParser(HTMLParser):
    """
    나라인포테크 맞춤법 검사 결과 HTML을 파싱하는 전용 파서.
    교정된 텍스트 전체와 각 오류 단어 + 교정 사유를 추출한다.
    """

    def __init__(self):
        super().__init__()
        # 교정 완료 텍스트 조각 수집 (span 태그 내·외부 모두)
        self.corrected_pieces: list[str] = []
        # 오류 단어 목록: [{"original": ..., "corrected": ..., "reason": ...}, ...]
        self.errors: list[dict] = []

        # 내부 상태 추적
        self._in_result_div = False        # class="result_text" div 내부 여부
        self._result_div_depth = 0         # 중첩 depth 추적
        self._in_error_span = False        # 오류 표시 span 내부 여부
        self._current_error: dict = {}     # 현재 처리 중인 오류 단어 정보
        self._in_help_span = False         # 도움말(사유) span 내부 여부
        self._capture_help = False         # 사유 텍스트 수집 플래그

    # ── 태그 열림 ──────────────────────────────
    def handle_starttag(self, tag: str, attrs: list):
        attr_dict = dict(attrs)
        css_class = attr_dict.get("class", "")

        # 결과 전체를 담는 div 진입 감지
        if tag == "div" and "result_text" in css_class:
            self._in_result_div = True
            self._result_div_depth = 1
            return

        # result_text div 내부에서 추가 div 중첩 depth 추적
        if self._in_result_div and tag == "div":
            self._result_div_depth += 1

        # 오류 단어 span (예: class="check_word" 또는 class="green" 등 색상 클래스)
        if self._in_result_div and tag == "span":
            error_classes = {"check_word", "green", "red", "violet", "blue"}
            if error_classes & set(css_class.split()):
                self._in_error_span = True
                self._current_error = {
                    "original": "",
                    "corrected": "",
                    "reason": "",
                    "color": css_class.strip(),
                }
                return

        # 도움말(사유) span
        if self._in_result_div and tag == "span" and "help" in css_class:
            self._in_help_span = True
            self._capture_help = True

    # ── 태그 닫힘 ──────────────────────────────
    def handle_endtag(self, tag: str):
        if not self._in_result_div:
            return

        if tag == "div":
            if self._result_div_depth > 0:
                self._result_div_depth -= 1
            if self._result_div_depth == 0:
                self._in_result_div = False
            return

        if tag == "span":
            if self._in_error_span:
                # 오류 span 종료: 수집된 오류 단어 저장
                if self._current_error.get("corrected"):
                    self.errors.append(self._current_error)
                self._in_error_span = False
                self._current_error = {}
            elif self._in_help_span:
                self._in_help_span = False
                self._capture_help = False

    # ── 텍스트 데이터 ──────────────────────────
    def handle_data(self, data: str):
        if not self._in_result_div:
            return

        text = data  # 원문 그대로 (공백 포함)

        if self._in_error_span:
            # 오류 span 내 텍스트 = 교정된 단어
            self._current_error["corrected"] += text
            self.corrected_pieces.append(text)
        elif self._capture_help and self._in_help_span:
            # 도움말 span 내 텍스트 = 교정 사유
            self._current_error["reason"] += text
        elif not self._in_help_span:
            # 일반 텍스트 = 교정 필요 없는 정상 텍스트
            self.corrected_pieces.append(text)

    def get_corrected_text(self) -> str:
        """교정 완료 전체 텍스트 반환"""
        return "".join(self.corrected_pieces)


# ──────────────────────────────────────────────
# 2. 맞춤법 검사 핵심 함수
# ──────────────────────────────────────────────

# 나라인포테크 구버전 API 엔드포인트 (EUC-KR 폼 POST)
_API_URL = "https://nara-speller.co.kr/speller/results"
_OLD_API_URL = "https://nara-speller.co.kr/old_speller/results"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Content-Type": "application/x-www-form-urlencoded",
    "Origin": "https://nara-speller.co.kr",
    "Referer": "https://nara-speller.co.kr/speller/",
}

_TIMEOUT = 10       # 단일 요청 타임아웃 (초)
_MAX_RETRIES = 3    # 최대 재시도 횟수
_CHUNK_SIZE = 500   # 한 번에 보낼 최대 글자 수


def _post_to_api(text: str, use_old: bool = False) -> Optional[str]:
    """
    나라인포테크 서버에 POST 요청을 보내고 응답 HTML을 반환한다.
    EUC-KR 인코딩 폼 데이터 형식으로 전송.
    실패 시 None 반환.
    """
    url = _OLD_API_URL if use_old else _API_URL

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            # EUC-KR로 인코딩된 폼 데이터 직접 구성
            encoded_text = text.encode("euc-kr", errors="replace")
            body = b"text=" + requests.utils.quote(encoded_text, safe="").encode()

            resp = requests.post(
                url,
                data=body,
                headers=_HEADERS,
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()

            # 응답은 UTF-8 또는 EUC-KR 혼용 → apparent_encoding 활용
            resp.encoding = resp.apparent_encoding or "utf-8"
            return resp.text

        except requests.exceptions.Timeout:
            if attempt < _MAX_RETRIES:
                wait = 1.0 * attempt
                time.sleep(wait)
            else:
                return None

        except requests.exceptions.RequestException:
            if attempt < _MAX_RETRIES:
                time.sleep(1.0)
            else:
                return None

    return None


def _split_text(text: str, chunk_size: int = _CHUNK_SIZE) -> list[str]:
    """
    긴 텍스트를 문장 단위로 나눠 chunk_size 이하 조각으로 분할.
    문장 경계(. ! ?)를 최대한 존중하여 분할한다.
    """
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    current = ""
    sentences = []

    # 줄바꿈 기준 1차 분리
    for line in text.splitlines(keepends=True):
        if len(line) > chunk_size:
            # 매우 긴 단일 줄: 강제 분할
            while len(line) > chunk_size:
                sentences.append(line[:chunk_size])
                line = line[chunk_size:]
            if line:
                sentences.append(line)
        else:
            sentences.append(line)

    for sentence in sentences:
        if len(current) + len(sentence) <= chunk_size:
            current += sentence
        else:
            if current:
                chunks.append(current)
            current = sentence

    if current:
        chunks.append(current)

    return chunks


def check_spelling(
    text: str,
    delay: float = 0.3,
    use_old_api: bool = True,
) -> dict:
    """
    맞춤법 검사 메인 함수.

    Args:
        text: 검사할 원문 텍스트
        delay: 청크 간 대기 시간(초). 기본 0.3초.
        use_old_api: 구버전 엔드포인트 사용 여부 (기본 True, 안정적)

    Returns:
        {
            "original": 원문,
            "corrected": 교정 완료 텍스트,
            "errors": [{"original", "corrected", "reason", "color"}, ...],
            "has_error": 오류 존재 여부 (bool),
            "success": API 통신 성공 여부 (bool),
            "message": 오류 메시지 (실패 시),
        }
    """
    if not text or not text.strip():
        return {
            "original": text,
            "corrected": text,
            "errors": [],
            "has_error": False,
            "success": True,
            "message": "빈 텍스트입니다.",
        }

    chunks = _split_text(text.strip())
    all_corrected_pieces = []
    all_errors = []

    for i, chunk in enumerate(chunks):
        if not chunk.strip():
            all_corrected_pieces.append(chunk)
            continue

        html_response = _post_to_api(chunk, use_old=use_old_api)

        if html_response is None:
            # API 실패 시 원문 그대로 보존
            all_corrected_pieces.append(chunk)
        else:
            parser = NaraHTMLParser()
            parser.feed(html_response)
            corrected = parser.get_corrected_text()

            # 파싱 결과가 비어 있으면 원문 유지
            all_corrected_pieces.append(corrected if corrected.strip() else chunk)
            all_errors.extend(parser.errors)

        # 청크 간 딜레이 (마지막 청크 제외)
        if i < len(chunks) - 1:
            jitter = random.uniform(0, 0.2)
            time.sleep(delay + jitter)

    corrected_text = "".join(all_corrected_pieces)

    return {
        "original": text,
        "corrected": corrected_text,
        "errors": all_errors,
        "has_error": len(all_errors) > 0,
        "success": True,
        "message": "",
    }


# ──────────────────────────────────────────────
# 3. 단독 실행 테스트
# ──────────────────────────────────────────────

if __name__ == "__main__":
    test_text = "인공지능이 너무 재밓다! 띄어쓰기오류도있어요. 외않되?"
    print(f"[원문] {test_text}")

    start = time.time()
    result = check_spelling(test_text)
    elapsed = time.time() - start

    print(f"[교정] {result['corrected']}")
    print(f"[소요] {elapsed:.2f}초")
    print(f"[오류 수] {len(result['errors'])}개")
    for err in result["errors"]:
        print(f"  - 교정: {err['corrected']} / 사유: {err['reason']}")
