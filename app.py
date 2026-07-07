"""
app.py
생기부 맞춤법 검사기 - Streamlit 메인 앱
- Selenium / gspread 직접 쓰기 UI 완전 제거
- 순수 requests REST API 기반 초고속 맞춤법 검사
- 입력: 엑셀/CSV 업로드 OR 구글 시트 공유 링크(읽기 전용)
- 출력: 교정 결과 테이블 + 엑셀/CSV 다운로드
"""

import time
import random

import pandas as pd
import streamlit as st

from spell_checker import check_spelling
from sheets_handler import (
    df_to_csv_bytes,
    df_to_excel_bytes,
    get_raw_data_from_dataframe,
    get_raw_data_from_public_url,
    load_uploaded_file,
)

# ──────────────────────────────────────────────
# 페이지 설정
# ──────────────────────────────────────────────

st.set_page_config(
    page_title="생기부 맞춤법 검사기",
    page_icon="✏️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ──────────────────────────────────────────────
# 사이드바: 설정
# ──────────────────────────────────────────────

with st.sidebar:
    st.title("⚙️ 설정")

    st.subheader("📂 데이터 입력 방식")
    input_mode = st.radio(
        "입력 방식 선택",
        options=["파일 업로드 (엑셀/CSV)", "구글 시트 공유 링크"],
        index=0,
        help="엑셀(.xlsx), CSV 파일 업로드 또는 '링크가 있는 모든 사용자' 권한의 구글 시트 URL 사용",
    )

    st.divider()

    st.subheader("🔧 검사 옵션")
    delay_sec = st.slider(
        "청크 간 대기 시간 (초)",
        min_value=0.1,
        max_value=2.0,
        value=0.3,
        step=0.1,
        help="REST API 방식으로 서버 차단 위험이 매우 낮습니다. 0.3초 권장.",
    )
    chunk_delay_every = st.slider(
        "N줄마다 추가 휴식",
        min_value=5,
        max_value=50,
        value=20,
        step=5,
        help="지정한 줄 수마다 3초 추가 휴식. 대량 처리 시 서버 부하 방지용.",
    )
    use_old_api = st.toggle(
        "구버전 API 사용 (안정적)",
        value=True,
        help="old_speller 엔드포인트 사용. 차단 없이 안정적으로 동작합니다.",
    )

    st.divider()
    st.caption(
        "ℹ️ 본 앱은 나라인포테크 맞춤법 검사 서버를 비공식으로 활용합니다. "
        "개인 업무용으로만 사용하세요."
    )


# ──────────────────────────────────────────────
# 메인 화면
# ──────────────────────────────────────────────

st.title("✏️ 생기부 맞춤법 검사기")
st.caption("나라인포테크 REST API 기반 · Selenium 없음 · 초고속 처리")

# ── 세션 상태 초기화 ───────────────────────────
for key, default in {
    "df_original": None,
    "df_result": None,
    "text_column": None,
    "processing": False,
    "done": False,
}.items():
    if key not in st.session_state:
        st.session_state[key] = default


# ──────────────────────────────────────────────
# 1단계: 데이터 로드
# ──────────────────────────────────────────────

st.header("1️⃣ 데이터 불러오기")

df_loaded: pd.DataFrame | None = None
load_error: str = ""

if input_mode == "파일 업로드 (엑셀/CSV)":
    uploaded = st.file_uploader(
        "엑셀(.xlsx) 또는 CSV 파일 업로드",
        type=["xlsx", "xls", "csv"],
        help="첫 번째 행이 헤더(열 이름)여야 합니다.",
    )
    if uploaded:
        try:
            df_loaded, _ = load_uploaded_file(uploaded)
            st.success(f"✅ 파일 로드 완료: {len(df_loaded)}행 × {len(df_loaded.columns)}열")
        except Exception as e:
            load_error = str(e)

else:  # 구글 시트 공유 링크
    sheet_url = st.text_input(
        "구글 시트 공유 링크 입력",
        placeholder="https://docs.google.com/spreadsheets/d/...",
        help="파일 → 공유 → '링크가 있는 모든 사용자' 뷰어 권한으로 설정 후 링크 복사",
    )
    if sheet_url:
        with st.spinner("구글 시트 로드 중..."):
            try:
                df_loaded, _ = get_raw_data_from_public_url(sheet_url)
                st.success(f"✅ 구글 시트 로드 완료: {len(df_loaded)}행 × {len(df_loaded.columns)}열")
            except PermissionError as e:
                load_error = f"🔒 접근 권한 오류: {e}"
            except Exception as e:
                load_error = str(e)

if load_error:
    st.error(f"❌ {load_error}")

# 데이터 프리뷰 + 열 선택
if df_loaded is not None:
    with st.expander("📋 데이터 미리보기 (상위 5행)", expanded=True):
        st.dataframe(df_loaded.head(5), use_container_width=True)

    text_col = st.selectbox(
        "맞춤법을 검사할 열(컬럼) 선택",
        options=list(df_loaded.columns),
        index=0,
        help="맞춤법 검사를 수행할 텍스트가 들어 있는 열을 선택하세요.",
    )
    st.session_state["df_original"] = df_loaded
    st.session_state["text_column"] = text_col


# ──────────────────────────────────────────────
# 2단계: 맞춤법 검사 실행
# ──────────────────────────────────────────────

st.header("2️⃣ 맞춤법 검사 실행")

can_run = st.session_state["df_original"] is not None

run_btn = st.button(
    "🚀 맞춤법 검사 시작",
    disabled=not can_run,
    use_container_width=True,
    type="primary",
)

if run_btn and can_run:
    df_src = st.session_state["df_original"].copy()
    col = st.session_state["text_column"]

    try:
        records = get_raw_data_from_dataframe(df_src, col)
    except ValueError as e:
        st.error(str(e))
        st.stop()

    total = len(records)
    if total == 0:
        st.warning("검사할 텍스트가 없습니다. 선택한 열에 내용이 있는지 확인하세요.")
        st.stop()

    # 결과 열 추가
    result_col = col + "_교정"
    error_col = col + "_오류수"
    df_src[result_col] = ""
    df_src[error_col] = 0

    progress_bar = st.progress(0, text="검사 준비 중...")
    status_area = st.empty()
    start_total = time.time()

    for i, record in enumerate(records):
        row_idx = record["row_index"]
        original = record["original_text"]

        status_area.info(
            f"🔍 [{i + 1}/{total}] 검사 중: {original[:40]}{'...' if len(original) > 40 else ''}"
        )

        result = check_spelling(original, delay=delay_sec, use_old_api=use_old_api)

        df_src.at[row_idx, result_col] = result["corrected"]
        df_src.at[row_idx, error_col] = len(result["errors"])

        progress_bar.progress(
            (i + 1) / total,
            text=f"진행 중: {i + 1}/{total}행 완료",
        )

        # N줄마다 추가 휴식
        if (i + 1) % chunk_delay_every == 0 and (i + 1) < total:
            status_area.warning(f"⏸️ {chunk_delay_every}줄 처리 완료 - 3초 휴식 중...")
            time.sleep(3)
        else:
            jitter = random.uniform(0, 0.1)
            time.sleep(delay_sec + jitter)

    elapsed = time.time() - start_total
    status_area.success(
        f"✅ 맞춤법 검사 완료! 총 {total}행 처리 · 소요시간 {elapsed:.1f}초"
    )
    progress_bar.progress(1.0, text="완료!")

    st.session_state["df_result"] = df_src
    st.session_state["done"] = True


# ──────────────────────────────────────────────
# 3단계: 결과 확인 및 다운로드
# ──────────────────────────────────────────────

if st.session_state["done"] and st.session_state["df_result"] is not None:
    st.header("3️⃣ 결과 확인 및 다운로드")

    df_res = st.session_state["df_result"]
    col = st.session_state["text_column"]
    result_col = col + "_교정"
    error_col = col + "_오류수"

    # 요약 지표
    total_rows = len(df_res[df_res[col].notna() & (df_res[col].astype(str).str.strip() != "")])
    error_rows = int((df_res[error_col] > 0).sum())
    total_errors = int(df_res[error_col].sum())

    c1, c2, c3 = st.columns(3)
    c1.metric("검사 행 수", f"{total_rows}행")
    c2.metric("오류 발견 행", f"{error_rows}행")
    c3.metric("총 오류 수", f"{total_errors}개")

    # 오류 있는 행만 필터링 옵션
    show_errors_only = st.checkbox("오류가 있는 행만 보기", value=False)
    display_df = df_res if not show_errors_only else df_res[df_res[error_col] > 0]

    st.dataframe(display_df, use_container_width=True, height=400)

    # 다운로드 버튼
    st.subheader("💾 결과 다운로드")
    dl_col1, dl_col2 = st.columns(2)

    with dl_col1:
        excel_bytes = df_to_excel_bytes(df_res)
        st.download_button(
            label="📥 엑셀(.xlsx)로 다운로드",
            data=excel_bytes,
            file_name="맞춤법검사결과.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True,
        )

    with dl_col2:
        csv_bytes = df_to_csv_bytes(df_res)
        st.download_button(
            label="📥 CSV로 다운로드",
            data=csv_bytes,
            file_name="맞춤법검사결과.csv",
            mime="text/csv",
            use_container_width=True,
        )

    # 재시작
    st.divider()
    if st.button("🔄 새 파일로 다시 검사", use_container_width=True):
        for key in ["df_original", "df_result", "text_column", "processing", "done"]:
            st.session_state[key] = None if key not in ("processing", "done") else False
        st.rerun()
