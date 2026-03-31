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

SITE_NAME = "アクチュアリー2次試験 生保2過去問演習"
EXAM_DATE = date(2026, 12, 9)
QUESTION_FILE = "questions_normalized.csv"
SHOKEN_FILE = "shoken.csv"
JST = ZoneInfo("Asia/Tokyo")
LOCAL_STORAGE_KEY = "actuary_app_user_state_v2"
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
    "8": {
        "summary": "第8章の簡易まとめはまだ登録されていません。",
        "download_url": "",
    },
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
    return (2, s)


@st.cache_resource
def get_local_storage():
    if LocalStorage is None:
        return None
    return LocalStorage()


@st.cache_data(ttl=60)
def load_questions() -> pd.DataFrame:
    return pd.read_csv(QUESTION_FILE, encoding="utf-8-sig")


@st.cache_data(ttl=60)
def load_shoken() -> pd.DataFrame:
    try:
        return pd.read_csv(SHOKEN_FILE, encoding="utf-8-sig")
    except Exception:
        return pd.DataFrame()


def first_existing_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    for col in candidates:
        if col in df.columns:
            return col
    return None


def render_multiline_text(text: str):
    safe_text = html.escape(str(text or "")).replace("\n", "<br>")
    st.markdown(f"<div style='line-height:1.75'>{safe_text}</div>", unsafe_allow_html=True)


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


def render_question_card(row: pd.Series, valid_ids: list[str], current_index_zero: int, explanation_col: str | None):
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

        # 解答と自己評価の間に解説を表示
        if explanation_col and str(row.get(explanation_col, "")).strip():
            st.markdown("### 解説")
            render_multiline_text(row.get(explanation_col, ""))

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


def render_problem_area(filtered: pd.DataFrame, explanation_col: str | None):
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

    st.caption(
        f"{current_index_zero + 1} / {len(valid_ids)}問  |  状態: {compute_question_status(str(row['id']))}"
    )
    render_question_card(row, valid_ids, current_index_zero, explanation_col)


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


def render_dashboard(df: pd.DataFrame):
    total = len(df)
    rated = sum(1 for qid in df["id"].astype(str) if get_primary_eval(qid))
    review_count = sum(1 for qid in df["id"].astype(str) if is_review_flagged(qid))
    c1, c2, c3 = st.columns(3)
    c1.metric("総問題数", total)
    c2.metric("評価済み", rated)
    c3.metric("後で復習", review_count)
    st.markdown("### 使い方")
    st.write("左のメニューから学習方法を選び、問題を開いてください。解答を表示すると、解答の下・自己評価の上に解説が表示されます。")


def render_today_tasks(df: pd.DataFrame, explanation_col: str | None):
    today_group, weekday_name, _ = today_group_info()
    st.subheader(f"今日の課題（{weekday_name}）")
    if "曜日グループ" in df.columns:
        today_df = df[df["曜日グループ"].astype(str) == today_group].copy()
        st.caption(f"曜日グループ {today_group} の問題を表示しています。")
    else:
        today_df = df.copy()
        st.caption("CSVに『曜日グループ』列がないため、全問題を対象に表示しています。")
    render_problem_area(today_df, explanation_col)


def render_chapter_learning(df: pd.DataFrame, explanation_col: str | None):
    st.subheader("章ごとに学ぶ")
    chapter, qtype, year = render_sidebar_filters(df, "chapter")
    filtered = filter_dataframe(df, chapter=chapter, qtype=qtype, year=year)
    render_problem_area(filtered, explanation_col)


def render_search(df: pd.DataFrame, explanation_col: str | None):
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
    render_problem_area(results, explanation_col)


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


def render_shoken_learning(df: pd.DataFrame):
    shoken_df = load_shoken()

    st.subheader("所見で学ぶ")
    options = ["所見の習得方法"] + [f"{year}年度" for year in range(2025, 2017, -1)]
    st.session_state.setdefault("shoken_select", options[0])

    selected = st.selectbox(
        "選択",
        options,
        index=options.index(st.session_state["shoken_select"]) if st.session_state.get("shoken_select") in options else 0,
        key="shoken_select",
    )

    if selected == "所見の習得方法":
        st.markdown("### 所見の習得方法")
        st.markdown(
            """
            **1. 年度ごとの内容をまず暗記する**  
            所見は、頻出テーマに対して「どういう切り口で書くか」が凝縮されています。まずは2018年度以降の問題文と論点を見て、各年度で何が問われ、どの切り口で書くべきかをそのまま覚えるところから始めるのが効果的です。

            **2. 中問を徹底する**  
            生保2では、中問で問われる論点のまとまりを押さえることが重要です。単語や制度の知識を点で覚えるだけでなく、  
            「このテーマなら、何を順番に書くべきか」  
            を中問単位で整理しておくと、本番で答案を作りやすくなります。

            **3. 考えるひな形を自分の中に持っておく**  
            暗記した内容を再現できるだけでなく、問い方が少し変わっても書けるように、次のようなひな形を持っておくのがおすすめです。  
            - 何が論点か  
            - なぜそれが問題になるか  
            - 制度上・実務上どう整理されるか  
            - メリット・デメリットは何か  
            - 会社・契約者・販売現場などにどんな影響があるか  
            この順で考える癖がつくと、未知の問いにも対応しやすくなります。

            **4. 読むだけで終わらせず、再現する**  
            論点を読んで理解したつもりになるのではなく、問題文だけを見て、口頭やメモでどこまで再現できるかを確認することが大切です。再現できなかった論点だけを戻って補うと、効率よく定着します。

            **5. 目的は“丸暗記”ではなく“答案の軸を作ること”**  
            本番では完全一致の表現よりも、出題意図に沿って論点の軸を外さずに書けることが大事です。年度ごとの内容を暗記しつつ、そこから共通の型を抜き出して、自分の答案の骨格にしていくイメージで進めるのがおすすめです。
            """
        )
        return

    if shoken_df.empty:
        st.info("shoken.csv が見つからないため、所見データを表示できません。")
        return

    for col in shoken_df.columns:
        shoken_df[col] = shoken_df[col].fillna("").astype(str).str.strip()

    required_cols = ["年度", "問題文"]
    missing = [col for col in required_cols if col not in shoken_df.columns]
    if missing:
        st.warning(f"shoken.csv に必要な列がありません: {', '.join(missing)}")
        return

    year = selected.replace("年度", "")
    year_df = shoken_df[shoken_df["年度"] == year].copy()

    if year_df.empty:
        st.info(f"{selected} のデータはまだありません。")
        return

    if "問題番号" in year_df.columns:
        year_df["__sort_num"] = pd.to_numeric(
            year_df["問題番号"].astype(str).str.extract(r"(\d+)")[0],
            errors="coerce",
        ).fillna(9999)
    else:
        year_df["__sort_num"] = 9999

    if "問題種別" in year_df.columns:
        year_df["__sort_type"] = year_df["問題種別"].map(lambda x: question_type_sort_key(x)[0])
    else:
        year_df["__sort_type"] = 9

    if "id" not in year_df.columns:
        year_df["id"] = year_df.index.astype(str)

    year_df = year_df.sort_values(by=["__sort_num", "__sort_type", "id"]).reset_index(drop=True)

    st.markdown(f"### {selected}")
    st.caption(f"{len(year_df)}件")

    for idx, (_, row) in enumerate(year_df.iterrows(), start=1):
        title_parts = []
        if str(row.get("問題番号", "")).strip():
            title_parts.append(str(row.get("問題番号", "")).strip())
        if str(row.get("問題種別", "")).strip():
            title_parts.append(str(row.get("問題種別", "")).strip())
        title = " | ".join(title_parts) if title_parts else f"{idx}件目"

        with st.expander(title, expanded=(idx == 1)):
            st.markdown("**問題文**")
            render_multiline_text(row.get("問題文", ""))

            st.markdown("**論点**")
            point_text = str(row.get("論点", "")).strip() if "論点" in year_df.columns else ""

            if point_text:
                render_multiline_text(point_text)
            else:
                st.info("論点はまだ登録されていません。")

def main():
    ensure_state()
    df = load_questions()

    required_cols = ["id", "章", "問題種別", "問題番号", "問題文", "解答"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        st.error(f"CSVに必要な列が足りません: {', '.join(missing)}")
        st.info("必要列: id, 章, 問題種別, 問題番号, 問題文, 解答")
        st.stop()

    for col in df.columns:
        df[col] = df[col].fillna("").astype(str).str.strip()

    explanation_col = first_existing_column(df, ["解説", "説明", "コメント", "補足"])

    st.markdown(f"## {SITE_NAME}")
    left = days_to_exam()
    today_group, _, now_tokyo = today_group_info()
    today_str = now_tokyo.strftime("%Y-%m-%d")
    if left >= 0:
        st.info(f"今日: **{today_str}** / 試験まであと **{left}日**（試験日: {EXAM_DATE.strftime('%Y-%m-%d')}）")
    else:
        st.warning(f"今日: **{today_str}** / 試験日は {EXAM_DATE.strftime('%Y-%m-%d')} でした。")

    menu = st.sidebar.radio("メニュー", MENU_OPTIONS, key="main_menu")

    if menu == "ホーム":
        render_dashboard(df)
    elif menu == "今日の課題":
        render_today_tasks(df, explanation_col)
    elif menu == "章ごとに学ぶ":
        render_chapter_learning(df, explanation_col)
    elif menu == "問題検索":
        render_search(df, explanation_col)
    elif menu == "教科書で学ぶ":
        render_textbook_learning(df)
    elif menu == "所見で学ぶ":
        render_shoken_learning(df)

    if LocalStorage is None:
        st.warning("ブラウザ保存用パッケージが見つからないため、この環境では学習内容が端末保存されません。requirements.txt に streamlit-local-storage を追加してください。")


if __name__ == "__main__":
    main()
