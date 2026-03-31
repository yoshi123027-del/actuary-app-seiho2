
import html
import json
import re
from datetime import date, datetime
from zoneinfo import ZoneInfo

import pandas as pd
import streamlit as st

try:
    from streamlit_local_storage import LocalStorage
except Exception:
    LocalStorage = None

SITE_NAME = "アクチュアリー2次試験 生保1過去問演習"
EXAM_DATE = date(2026, 12, 8)
QUESTION_FILE = "questions_normalized.csv"
SHOKEN_FILE = "shoken.csv"
JST = ZoneInfo("Asia/Tokyo")
LOCAL_STORAGE_KEY = "actuary_app_user_state_v3"

MENU_OPTIONS = [
    "ホーム",
    "今日の課題",
    "章ごとに学ぶ",
    "問題検索",
    "教科書で学ぶ",
    "所見で学ぶ",
]

TEXTBOOK_LINKS = {
    "1": {
        "summary": "第1章 営業保険料の簡易まとめをGoogle Driveで閲覧できます。",
        "download_url": "https://drive.google.com/file/d/13fG1wuq-5YG37DpKszP0RoHpdc4B4P2X/view?usp=drive_link",
    },
    "2": {
        "summary": "第2章 解約返戻金の簡易まとめをGoogle Driveで閲覧できます。",
        "download_url": "https://drive.google.com/file/d/1olNfAVmUFRDZELWnL2J2-5gmTG5TFPto/view?usp=sharing",
    },
    "3": {
        "summary": "第3章 アセットシェアの簡易まとめをGoogle Driveで閲覧できます。",
        "download_url": "https://drive.google.com/file/d/1wLd2ihpHmq_AMCoD6TSpQXyUbpGvT0Jw/view?usp=sharing",
    },
    "4": {
        "summary": "第4章 商品開発の簡易まとめをGoogle Driveで閲覧できます。",
        "download_url": "https://drive.google.com/file/d/1I6IVO8s9DcMpkMIQqAjzqem7lwGhNzkh/view?usp=sharing",
    },
    "5": {
        "summary": "第5章 変額年金保険の簡易まとめをGoogle Driveで閲覧できます。",
        "download_url": "https://drive.google.com/file/d/1MjpsBUqMcZhWIryYQlyBtaDdOpeCeAE8/view?usp=sharing",
    },
    "6": {
        "summary": "第6章 団体生命保険の簡易まとめをGoogle Driveで閲覧できます。",
        "download_url": "https://drive.google.com/file/d/1cSjjyWocIR1D44zSNdM5RGeQ_0ZNMjiN/view?usp=sharing",
    },
    "7": {
        "summary": "第7章 医療保険の簡易まとめをGoogle Driveで閲覧できます。",
        "download_url": "https://drive.google.com/file/d/1nvfrcmni93MDk_18CcRfOurN_wBgS28d/view?usp=sharing",
    },
    "8": {"summary": "第8章の簡易まとめはまだ登録されていません。", "download_url": ""},
    "9": {
        "summary": "第9章 再保険の簡易まとめをGoogle Driveで閲覧できます。",
        "download_url": "https://drive.google.com/file/d/1HvaoS8TPe7UDnSmAm8ndZg14fcpeBxdT/view?usp=sharing",
    },
    "10": {
        "summary": "第10章 商品毎収益検証の簡易まとめをGoogle Driveで閲覧できます。",
        "download_url": "https://drive.google.com/file/d/1VEwR7glqF3MBKKXV_eM0ypbdG9wx81SM/view?usp=sharing",
    },
}

PRIMARY_EVAL_OPTIONS = ["理解", "要注意"]
PRIMARY_EVAL_LABEL = {"理解": "✅ 理解", "要注意": "⚠️ 要注意"}
PRIMARY_EVAL_SCORE = {"理解": 2, "要注意": 0}
STATUS_LABEL = {"": "未評価", "理解": "理解", "要注意": "要注意"}
REVIEW_FLAG_LABEL = "📝 後で復習"

st.set_page_config(page_title=SITE_NAME, layout="wide")


def now_jst() -> datetime:
    return datetime.now(JST)


def days_to_exam() -> int:
    return (EXAM_DATE - now_jst().date()).days


def today_group_info():
    now = now_jst()
    weekday_num = now.weekday()
    weekday_name = ["月曜", "火曜", "水曜", "木曜", "金曜", "土曜", "日曜"][weekday_num]
    return str(weekday_num + 1), weekday_name, now


def natural_sort_key(value):
    s = str(value).strip()
    m = re.search(r"\d+", s)
    return (0, int(m.group()), s) if m else (1, s)


def question_type_sort_key(value):
    s = str(value).strip()
    if s == "小問":
        return (0, s)
    if s == "中問":
        return (1, s)
    if s == "所見":
        return (2, s)
    return (3, s)


def safe_int_from_year(value):
    s = str(value).strip()
    m = re.search(r"(\d{4})", s)
    return int(m.group(1)) if m else None


def first_existing_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    for col in candidates:
        if col in df.columns:
            return col
    return None


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out = out.dropna(how="all")
    for col in out.columns:
        out[col] = out[col].fillna("").astype(str).str.strip()
    return out


def render_multiline_text(text: str):
    safe_text = html.escape(str(text or "")).replace("\n", "<br>")
    st.markdown(f"<div style='line-height:1.75'>{safe_text}</div>", unsafe_allow_html=True)


@st.cache_resource
def get_local_storage():
    if LocalStorage is None:
        return None
    return LocalStorage()


@st.cache_data(ttl=60)
def load_questions() -> pd.DataFrame:
    return clean_dataframe(pd.read_csv(QUESTION_FILE, encoding="utf-8-sig"))


@st.cache_data(ttl=60)
def load_shoken() -> pd.DataFrame:
    try:
        df = pd.read_csv(SHOKEN_FILE, encoding="utf-8-sig")
    except FileNotFoundError:
        return pd.DataFrame()
    df = clean_dataframe(df)

    unnamed_cols = [c for c in df.columns if str(c).startswith("Unnamed:")]
    if unnamed_cols:
        df = df.drop(columns=unnamed_cols)

    core_cols = [c for c in ["id", "科目", "章", "問題種別", "年度", "問題文", "論点"] if c in df.columns]
    if core_cols:
        mask = df[core_cols].apply(lambda s: s.astype(str).str.strip() != "").any(axis=1)
        df = df[mask].copy()

    if "問題種別" not in df.columns:
        df["問題種別"] = "所見"
    if "id" not in df.columns:
        df["id"] = [str(i + 1) for i in range(len(df))]

    for col in [
        "所見を学ぶ順番",
        "頻出論点",
        "考える雛形",
        "筆答論点",
        "その他書けたらいい論点",
    ]:
        if col not in df.columns:
            df[col] = ""

    return df.reset_index(drop=True)


def default_user_state():
    return {"ratings": {}, "history": {}, "review_flags": {}}


def load_user_state():
    try:
        storage = get_local_storage()
        if storage is None:
            return default_user_state()
        raw = storage.getItem(LOCAL_STORAGE_KEY)
        if raw is None:
            return default_user_state()
        data = raw if isinstance(raw, dict) else json.loads(raw)
        base = default_user_state()
        if isinstance(data, dict):
            for k in base:
                if isinstance(data.get(k), dict):
                    base[k] = data[k]
        return base
    except Exception:
        return default_user_state()


def save_user_state():
    try:
        storage = get_local_storage()
        if storage is None:
            return
        payload = json.dumps(st.session_state["user_state"], ensure_ascii=False)
        storage.setItem(LOCAL_STORAGE_KEY, payload)
    except Exception:
        pass


def ensure_state():
    defaults = {
        "user_state": load_user_state(),
        "main_menu": "ホーム",
        "current_id": None,
        "show_answer": False,
        "study_seconds_today": 0,
        "study_date_jst": now_jst().date().isoformat(),
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value
    today_iso = now_jst().date().isoformat()
    if st.session_state["study_date_jst"] != today_iso:
        st.session_state["study_date_jst"] = today_iso
        st.session_state["study_seconds_today"] = 0


def get_primary_eval(question_id: str) -> str:
    return st.session_state["user_state"]["ratings"].get(question_id, "")


def is_review_flagged(question_id: str) -> bool:
    return bool(st.session_state["user_state"]["review_flags"].get(question_id, False))


def update_primary_eval(question_id: str, rating: str):
    user_state = st.session_state["user_state"]
    user_state["ratings"][question_id] = rating
    hist = user_state["history"].setdefault(question_id, {"count": 0, "last_rated_at": "", "score_total": 0})
    hist["count"] += 1
    hist["last_rated_at"] = now_jst().isoformat(timespec="seconds")
    hist["score_total"] += PRIMARY_EVAL_SCORE.get(rating, 0)
    save_user_state()


def toggle_review_flag(question_id: str):
    current = is_review_flagged(question_id)
    st.session_state["user_state"]["review_flags"][question_id] = not current
    hist = st.session_state["user_state"]["history"].setdefault(question_id, {"count": 0, "last_rated_at": "", "score_total": 0})
    hist["last_rated_at"] = now_jst().isoformat(timespec="seconds")
    save_user_state()


def previous_action_text(question_id: str) -> str:
    hist = st.session_state["user_state"]["history"].get(question_id, {})
    ts = hist.get("last_rated_at", "")
    count = hist.get("count", 0)
    if not ts:
        return "まだ自己評価はありません。"
    return f"最終更新: {ts} / 評価回数: {count}回"


def compute_question_status(question_id: str) -> str:
    parts = []
    primary = get_primary_eval(question_id)
    if primary:
        parts.append(STATUS_LABEL.get(primary, primary))
    if is_review_flagged(question_id):
        parts.append(REVIEW_FLAG_LABEL)
    return " / ".join(parts) if parts else "未評価"


def set_primary_eval_callback(question_id: str, rating: str):
    update_primary_eval(question_id, rating)


def toggle_review_flag_callback(question_id: str):
    toggle_review_flag(question_id)


def go_prev_callback(valid_ids: list[str], current_index_zero: int):
    if current_index_zero > 0:
        st.session_state["current_id"] = valid_ids[current_index_zero - 1]
        st.session_state["show_answer"] = False


def go_next_callback(valid_ids: list[str], current_index_zero: int):
    if current_index_zero < len(valid_ids) - 1:
        st.session_state["current_id"] = valid_ids[current_index_zero + 1]
        st.session_state["show_answer"] = False


def format_question_label(row: pd.Series) -> str:
    parts = []
    if str(row.get("章", "")).strip():
        parts.append(f"第{row['章']}章")
    if str(row.get("年度", "")).strip():
        parts.append(str(row["年度"]))
    if str(row.get("問題種別", "")).strip():
        parts.append(str(row["問題種別"]))
    if str(row.get("問題番号", "")).strip():
        parts.append(str(row["問題番号"]))
    return " / ".join(parts) if parts else str(row.get("id", ""))


def filter_dataframe(df: pd.DataFrame, *, chapter="すべて", qtype="すべて", year="すべて", weekday_group="すべて"):
    filtered = df.copy()
    if chapter != "すべて" and "章" in filtered.columns:
        filtered = filtered[filtered["章"] == chapter]
    if qtype != "すべて" and "問題種別" in filtered.columns:
        filtered = filtered[filtered["問題種別"] == qtype]
    if year != "すべて" and "年度" in filtered.columns:
        filtered = filtered[filtered["年度"] == year]
    if weekday_group != "すべて" and "曜日グループ" in filtered.columns:
        filtered = filtered[filtered["曜日グループ"] == weekday_group]
    return filtered


def render_sidebar_filters(df: pd.DataFrame, key_prefix: str):
    chapter_options = ["すべて"] + sorted([x for x in df["章"].unique().tolist() if str(x).strip()], key=natural_sort_key)
    type_options = ["すべて"] + sorted([x for x in df["問題種別"].unique().tolist() if str(x).strip()], key=question_type_sort_key)
    year_options = ["すべて"]
    if "年度" in df.columns:
        year_options += sorted([x for x in df["年度"].unique().tolist() if str(x).strip()])

    chapter = st.sidebar.selectbox("章", chapter_options, key=f"{key_prefix}_chapter")
    qtype = st.sidebar.selectbox("小問 / 中問", type_options, key=f"{key_prefix}_type")
    year = st.sidebar.selectbox("年度", year_options, key=f"{key_prefix}_year")
    return chapter, qtype, year


def render_point_expanders(row: pd.Series, point_cols: dict[str, str | None]):
    year = safe_int_from_year(row.get("年度", ""))
    if year is None or year < 2018:
        return

    answer_point_col = point_cols.get("answer")
    extra_point_col = point_cols.get("extra")
    answer_point = str(row.get(answer_point_col, "")).strip() if answer_point_col else ""
    extra_point = str(row.get(extra_point_col, "")).strip() if extra_point_col else ""

    st.markdown("### 論点メモ")
    with st.expander("筆答論点", expanded=False):
        if answer_point:
            render_multiline_text(answer_point)
        else:
            st.info("あとからCSVに『筆答論点』列を追加して内容を入れられます。")

    with st.expander("その他書けたらいい論点", expanded=False):
        if extra_point:
            render_multiline_text(extra_point)
        else:
            st.info("あとからCSVに『その他書けたらいい論点』列を追加して内容を入れられます。")


def render_question_card(row: pd.Series, valid_ids: list[str], current_index_zero: int, explanation_col: str | None, point_cols: dict[str, str | None]):
    qid = str(row["id"])
    st.markdown("### 問題")
    render_multiline_text(row.get("問題文", ""))

    toggle_label = "▼ 解答を表示" if st.session_state.get("show_answer", False) else "▶ 解答を表示"
    st.button(
        toggle_label,
        key=f"toggle_answer_{qid}",
        use_container_width=True,
        on_click=lambda: st.session_state.__setitem__("show_answer", not st.session_state.get("show_answer", False)),
    )

    if st.session_state.get("show_answer", False):
        st.markdown(
            """
            <style>
            .answer-box {
                border: 1px solid rgba(250,250,250,0.14);
                border-radius: 12px;
                padding: 1rem 1rem 0.75rem 1rem;
                margin-top: 0.25rem;
                margin-bottom: 0.75rem;
                background: rgba(255,255,255,0.01);
            }
            </style>
            """,
            unsafe_allow_html=True,
        )
        st.markdown('<div class="answer-box">', unsafe_allow_html=True)
        st.markdown("### 解答")
        render_multiline_text(row.get("解答", ""))

        if explanation_col and str(row.get(explanation_col, "")).strip():
            st.markdown("### 解説")
            render_multiline_text(row.get(explanation_col, ""))

        render_point_expanders(row, point_cols)

        st.markdown("### 自己評価")
        current_eval = get_primary_eval(qid)
        review_flagged = is_review_flagged(qid)
        cols = st.columns(3)
        for idx, option in enumerate(PRIMARY_EVAL_OPTIONS):
            with cols[idx]:
                st.button(
                    PRIMARY_EVAL_LABEL[option],
                    key=f"eval_{qid}_{option}",
                    use_container_width=True,
                    type="primary" if current_eval == option else "secondary",
                    on_click=set_primary_eval_callback,
                    args=(qid, option),
                )
        with cols[2]:
            st.button(
                REVIEW_FLAG_LABEL,
                key=f"review_flag_{qid}",
                use_container_width=True,
                type="primary" if review_flagged else "secondary",
                on_click=toggle_review_flag_callback,
                args=(qid,),
            )
        st.caption(previous_action_text(qid))
        st.markdown("</div>", unsafe_allow_html=True)

    nav1, nav2 = st.columns(2)
    with nav1:
        st.button(
            "← 前へ",
            key=f"prev_{qid}",
            use_container_width=True,
            disabled=current_index_zero == 0,
            on_click=go_prev_callback,
            args=(valid_ids, current_index_zero),
        )
    with nav2:
        st.button(
            "次へ →",
            key=f"next_{qid}",
            use_container_width=True,
            disabled=current_index_zero >= len(valid_ids) - 1,
            on_click=go_next_callback,
            args=(valid_ids, current_index_zero),
        )


def render_problem_area(filtered: pd.DataFrame, explanation_col: str | None, point_cols: dict[str, str | None]):
    if filtered.empty:
        st.warning("条件に合う問題がありません。")
        return

    valid_ids = filtered["id"].astype(str).tolist()
    if st.session_state["current_id"] not in valid_ids:
        st.session_state["current_id"] = valid_ids[0]
        st.session_state["show_answer"] = False

    selected_id = st.selectbox(
        "問題を選択",
        valid_ids,
        index=valid_ids.index(st.session_state["current_id"]),
        format_func=lambda qid: format_question_label(filtered[filtered["id"].astype(str) == str(qid)].iloc[0]),
    )
    if selected_id != st.session_state["current_id"]:
        st.session_state["current_id"] = selected_id
        st.session_state["show_answer"] = False

    row = filtered[filtered["id"].astype(str) == str(st.session_state["current_id"])].iloc[0]
    current_index_zero = valid_ids.index(str(st.session_state["current_id"]))

    st.caption(f"{current_index_zero + 1} / {len(valid_ids)}問  |  状態: {compute_question_status(str(row['id']))}")
    render_question_card(row, valid_ids, current_index_zero, explanation_col, point_cols)


def render_dashboard(df: pd.DataFrame, shoken_df: pd.DataFrame):
    total = len(df)
    rated = sum(1 for qid in df["id"].astype(str) if get_primary_eval(qid))
    review_count = sum(1 for qid in df["id"].astype(str) if is_review_flagged(qid))
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("総問題数", total)
    c2.metric("評価済み", rated)
    c3.metric("後で復習", review_count)
    c4.metric("所見問題数", len(shoken_df) if not shoken_df.empty else 0)
    st.markdown("### 使い方")
    st.write("左のメニューから学習方法を選び、問題を開いてください。解答を表示すると、解答の下・自己評価の上に解説が表示されます。2018年度以降の問題には論点メモ用のexpanderも表示されます。")
    if shoken_df.empty:
        st.info("所見用の shoken.csv がまだないため、『所見で学ぶ』は骨組み表示になります。")


def render_today_tasks(df: pd.DataFrame, explanation_col: str | None, point_cols: dict[str, str | None]):
    today_group, weekday_name, _ = today_group_info()
    st.subheader(f"今日の課題（{weekday_name}）")
    if "曜日グループ" in df.columns:
        today_df = df[df["曜日グループ"].astype(str) == today_group].copy()
        st.caption(f"曜日グループ {today_group} の問題を表示しています。")
    else:
        today_df = df.copy()
        st.caption("CSVに『曜日グループ』列がないため、全問題を対象に表示しています。")
    render_problem_area(today_df, explanation_col, point_cols)


def render_chapter_learning(df: pd.DataFrame, explanation_col: str | None, point_cols: dict[str, str | None]):
    st.subheader("章ごとに学ぶ")
    chapter, qtype, year = render_sidebar_filters(df, "chapter")
    filtered = filter_dataframe(df, chapter=chapter, qtype=qtype, year=year)
    render_problem_area(filtered, explanation_col, point_cols)


def render_search(df: pd.DataFrame, explanation_col: str | None, point_cols: dict[str, str | None]):
    st.subheader("問題検索")
    chapter, qtype, year = render_sidebar_filters(df, "search")
    base_filtered = filter_dataframe(df, chapter=chapter, qtype=qtype, year=year)
    keyword = st.text_input("キーワードを入力", key="search_keyword_main", placeholder="例：付加保険料")
    st.caption("問題文・解答・解説から検索します。")

    if not keyword.strip():
        st.info("キーワードを入力すると、該当する問題を一覧表示します。")
        st.caption(f"検索対象: {len(base_filtered)}問")
        return

    keyword = keyword.strip()
    question_mask = base_filtered["問題文"].str.contains(keyword, case=False, na=False)
    answer_mask = base_filtered["解答"].str.contains(keyword, case=False, na=False)
    explanation_mask = False
    if explanation_col:
        explanation_mask = base_filtered[explanation_col].str.contains(keyword, case=False, na=False)
    results = base_filtered[question_mask | answer_mask | explanation_mask].copy()

    if results.empty:
        st.warning("該当する問題が見つかりませんでした。")
        return

    st.success(f"{len(results)}件ヒットしました。")
    render_problem_area(results, explanation_col, point_cols)


def render_textbook_learning(df: pd.DataFrame):
    chapter_options = sorted([x for x in df["章"].unique().tolist() if str(x).strip()], key=natural_sort_key)
    if not chapter_options:
        st.warning("章データがありません。")
        return
    selected_chapter = st.sidebar.selectbox("章", chapter_options, key="textbook_chapter")
    st.markdown("### 章選択")
    selected_chapter = st.selectbox(
        "画面内でも章を選べます",
        chapter_options,
        index=chapter_options.index(selected_chapter),
        key="main_textbook_chapter",
    )
    content = TEXTBOOK_LINKS.get(str(selected_chapter), {"summary": "この章の簡易まとめはまだ登録されていません。", "download_url": ""})
    st.subheader(f"第{selected_chapter}章 教科書で学ぶ")
    st.markdown("### 簡易まとめ")
    st.write(content["summary"])
    if content.get("download_url"):
        st.link_button(f"第{selected_chapter}章のまとめを開く", content["download_url"], use_container_width=True)
    else:
        st.info("この章のまとめリンクはまだ設定されていません。")
    st.markdown("### 教科書リンク")
    st.link_button("アクチュアリー会の教科書ページへ", "https://www.actuaries.jp/examin/textbook/", use_container_width=True)


def value_or_placeholder(value: str, message: str):
    if str(value).strip():
        render_multiline_text(value)
    else:
        st.info(message)


def chapter_meta_value(chapter_df: pd.DataFrame, col_name: str) -> str:
    if chapter_df.empty or col_name not in chapter_df.columns:
        return ""
    for value in chapter_df[col_name].tolist():
        if str(value).strip():
            return str(value)
    return ""


def render_shoken_learning(shoken_df: pd.DataFrame):
    st.subheader("所見で学ぶ")

    if shoken_df.empty:
        st.info("shoken.csv を置くと、ここに所見問題と論点メモを表示できます。")
        return

    chapter_options = sorted([x for x in shoken_df["章"].unique().tolist() if str(x).strip()], key=natural_sort_key)
    if not chapter_options:
        st.warning("所見CSVに章データがありません。")
        return

    selected_chapter = st.sidebar.selectbox("章", chapter_options, key="shoken_chapter")
    selected_chapter = st.selectbox(
        "画面内でも章を選べます",
        chapter_options,
        index=chapter_options.index(selected_chapter),
        key="main_shoken_chapter",
    )

    target = shoken_df[shoken_df["章"].astype(str) == str(selected_chapter)].copy()
    st.markdown(f"## 第{selected_chapter}章 所見で学ぶ")
    st.caption("章ごとの固定説明ではなく、shoken.csv の各行に入れた内容をそのまま表示します。")

    sort_cols = [c for c in ["年度", "id"] if c in target.columns]
    if sort_cols:
        target = target.sort_values(by=sort_cols, key=lambda s: s.map(str))

    for _, row in target.iterrows():
        year_text = str(row.get("年度", "")).strip()
        qtype = str(row.get("問題種別", "所見")).strip() or "所見"
        title = f"{year_text}年度 / {qtype}"
        if not year_text:
            title = f"{qtype} / id:{row.get('id', '')}"

        with st.expander(title, expanded=False):
            st.markdown("**問題文**")
            value_or_placeholder(row.get("問題文", ""), "問題文は未入力です。")

            st.markdown("**所見を学ぶ順番**")
            value_or_placeholder(
                row.get("所見を学ぶ順番", ""),
                "所見を学ぶ順番は今後記入できます。",
            )

            st.markdown("**頻出論点**")
            value_or_placeholder(
                row.get("頻出論点", ""),
                "頻出論点は今後記入できます。",
            )

            st.markdown("**考える雛形**")
            value_or_placeholder(
                row.get("考える雛形", ""),
                "考える雛形は今後記入できます。",
            )

            st.markdown("**筆答論点**")
            answer_points = row.get("筆答論点", "") or row.get("論点", "")
            value_or_placeholder(answer_points, "筆答論点は今後記入できます。")

            st.markdown("**その他書けたらいい論点**")
            value_or_placeholder(
                row.get("その他書けたらいい論点", ""),
                "追加で書けたらいい論点は今後記入できます。",
            )


def main():
    ensure_state()
    df = load_questions()
    shoken_df = load_shoken()

    required_cols = ["id", "章", "問題種別", "問題番号", "問題文", "解答"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        st.error(f"CSVに必要な列が足りません: {', '.join(missing)}")
        st.info("必要列: id, 章, 問題種別, 問題番号, 問題文, 解答")
        st.stop()

    explanation_col = first_existing_column(df, ["解説", "説明", "コメント", "補足"])
    point_cols = {
        "answer": first_existing_column(df, ["筆答論点", "筆答論点メモ", "論点", "書くべき論点"]),
        "extra": first_existing_column(df, ["その他書けたらいい論点", "追加論点", "加点論点", "その他論点"]),
    }

    st.markdown(f"## {SITE_NAME}")
    left = days_to_exam()
    _, _, now_tokyo = today_group_info()
    today_str = now_tokyo.strftime("%Y-%m-%d")
    if left >= 0:
        st.info(f"今日: **{today_str}** / 試験まであと **{left}日**（試験日: {EXAM_DATE.strftime('%Y-%m-%d')}）")
    else:
        st.warning(f"今日: **{today_str}** / 試験日は {EXAM_DATE.strftime('%Y-%m-%d')} でした。")

    menu = st.sidebar.radio("メニュー", MENU_OPTIONS, key="main_menu")

    if menu == "ホーム":
        render_dashboard(df, shoken_df)
    elif menu == "今日の課題":
        render_today_tasks(df, explanation_col, point_cols)
    elif menu == "章ごとに学ぶ":
        render_chapter_learning(df, explanation_col, point_cols)
    elif menu == "問題検索":
        render_search(df, explanation_col, point_cols)
    elif menu == "教科書で学ぶ":
        render_textbook_learning(df)
    elif menu == "所見で学ぶ":
        render_shoken_learning(shoken_df)

    if LocalStorage is None:
        st.warning("ブラウザ保存用パッケージが見つからないため、この環境では学習内容が端末保存されません。requirements.txt に streamlit-local-storage を追加してください。")


if __name__ == "__main__":
    main()
