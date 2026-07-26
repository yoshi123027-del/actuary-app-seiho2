"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { appConfig } from "./config";

const EMPTY_PROGRESS = { ratings: {}, reviewFlags: {}, history: {} };
const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function natural(value) {
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : 9999;
}

function normalizeRow(row) {
  const clean = {};
  Object.entries(row).forEach(([key, value]) => {
    clean[String(key).replace(/^\uFEFF/, "")] = value == null ? "" : String(value);
  });
  return clean;
}

function todayInJapan() {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
  const weekday = get("weekday").replace("曜日", "");
  return {
    iso: `${get("year")}-${get("month")}-${get("day")}`,
    weekday,
    group: String(["月", "火", "水", "木", "金", "土", "日"].indexOf(weekday) + 1),
  };
}

function daysUntil(dateString) {
  return Math.ceil((new Date(dateString).getTime() - Date.now()) / 86400000);
}

function rowLabel(row) {
  return [
    `No.${row.id}`,
    row.章 ? `第${row.章}章` : "",
    row.問題種別,
    row.年度 ? `${row.年度}年度` : "",
    row.問題番号,
  ].filter(Boolean).join(" ｜ ");
}

function useProgress(storageKey) {
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && typeof saved === "object") {
        setProgress({
          ratings: saved.ratings || {},
          reviewFlags: saved.reviewFlags || saved.review_flags || {},
          history: saved.history || {},
        });
      }
    } catch {
      // 壊れた保存値は無視し、空の学習履歴で開始する。
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (ready) localStorage.setItem(storageKey, JSON.stringify(progress));
  }, [progress, ready, storageKey]);

  const rate = (id, rating) => setProgress((current) => {
    const old = current.history[id] || { count: 0 };
    return {
      ...current,
      ratings: { ...current.ratings, [id]: rating },
      history: {
        ...current.history,
        [id]: { count: old.count + 1, lastRatedAt: new Date().toISOString() },
      },
    };
  });

  const toggleReview = (id) => setProgress((current) => ({
    ...current,
    reviewFlags: { ...current.reviewFlags, [id]: !current.reviewFlags[id] },
  }));

  return { progress, rate, toggleReview };
}

function Stat({ value, label, tone = "" }) {
  return (
    <div className={`stat ${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Filters({ questions, filters, setFilters, showKeyword = false }) {
  const chapters = [...new Set(questions.map((q) => q.章).filter(Boolean))].sort((a, b) => natural(a) - natural(b));
  const types = [...new Set(questions.map((q) => q.問題種別).filter(Boolean))];
  const years = [...new Set(questions.map((q) => q.年度).filter(Boolean))].sort((a, b) => natural(b) - natural(a));
  const update = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));

  return (
    <section className="filter-panel" aria-label="問題の絞り込み">
      <label>章<select value={filters.chapter} onChange={update("chapter")}><option value="">すべて</option>{chapters.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label>問題種別<select value={filters.type} onChange={update("type")}><option value="">すべて</option>{types.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label>年度<select value={filters.year} onChange={update("year")}><option value="">すべて</option>{years.map((x) => <option key={x}>{x}</option>)}</select></label>
      {showKeyword && <label className="keyword">キーワード<input value={filters.keyword} onChange={update("keyword")} placeholder="問題文・解答・解説を検索" /></label>}
    </section>
  );
}

function QuestionCard({ rows, currentId, setCurrentId, progress, rate, toggleReview }) {
  const [showAnswerFor, setShowAnswerFor] = useState(null);
  const topRef = useRef(null);
  const index = Math.max(0, rows.findIndex((q) => q.id === currentId));
  const question = rows[index];

  useEffect(() => {
    if (rows.length && !rows.some((q) => q.id === currentId)) setCurrentId(rows[0].id);
  }, [rows, currentId, setCurrentId]);

  useEffect(() => {
    setShowAnswerFor(null);
  }, [currentId]);

  if (!question) return <div className="empty">条件に一致する問題がありません。</div>;

  const move = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= rows.length) return;
    setCurrentId(rows[nextIndex].id);
    setShowAnswerFor(null);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const showing = showAnswerFor === question.id;

  return (
    <article className="question-card" ref={topRef}>
      <div className="question-toolbar">
        <label>問題を選択
          <select value={question.id} onChange={(event) => setCurrentId(event.target.value)}>
            {rows.map((row) => <option key={row.id} value={row.id}>{rowLabel(row)}</option>)}
          </select>
        </label>
        <span>{index + 1} / {rows.length}</span>
      </div>

      <div className="question-meta">
        <span>第{question.章}章</span><span>{question.問題種別}</span>
        {question.年度 && <span>{question.年度}年度</span>}
        {question.問題番号 && <span>{question.問題番号}</span>}
      </div>
      <h2>問題</h2>
      <div className="multiline">{question.問題文}</div>

      <button
        type="button"
        className="answer-toggle"
        aria-expanded={showing}
        onClick={() => setShowAnswerFor(showing ? null : question.id)}
      >
        {showing ? "解答を閉じる" : "解答を表示"}
      </button>

      {showing && (
        <div className="answer-panel">
          <h2>解答</h2>
          <div className="multiline">{question.解答 || "解答は未登録です。"}</div>
          {question.解説 && <><h3>解説</h3><div className="multiline">{question.解説}</div></>}
        </div>
      )}

      <div className="evaluation">
        <span>自己評価</span>
        <button className={progress.ratings[question.id] === "理解" ? "selected good" : ""} onClick={() => rate(question.id, "理解")}>✓ 理解</button>
        <button className={progress.ratings[question.id] === "要注意" ? "selected caution" : ""} onClick={() => rate(question.id, "要注意")}>△ 要注意</button>
        <button className={progress.reviewFlags[question.id] ? "selected review" : ""} onClick={() => toggleReview(question.id)}>🚩 後で復習</button>
      </div>

      <div className="pager">
        <button disabled={index === 0} onClick={() => move(index - 1)}>← 前の問題</button>
        <button disabled={index === rows.length - 1} onClick={() => move(index + 1)}>次の問題 →</button>
      </div>
    </article>
  );
}

function Dashboard({ questions, progress }) {
  const understood = questions.filter((q) => progress.ratings[q.id] === "理解").length;
  const caution = questions.filter((q) => progress.ratings[q.id] === "要注意").length;
  const review = questions.filter((q) => progress.reviewFlags[q.id]).length;
  const percent = questions.length ? Math.round(understood / questions.length * 100) : 0;
  const chapters = [...new Set(questions.map((q) => q.章).filter(Boolean))].sort((a, b) => natural(a) - natural(b));

  return (
    <>
      <div className="stats">
        <Stat value={questions.length} label="全問題" />
        <Stat value={understood} label="理解" tone="green" />
        <Stat value={caution} label="要注意" tone="yellow" />
        <Stat value={review} label="後で復習" tone="red" />
      </div>
      <div className="progress-block"><div><span>全体理解度</span><strong>{percent}%</strong></div><progress value={percent} max="100" /></div>
      <div className="chapter-grid">
        {chapters.map((chapter) => {
          const rows = questions.filter((q) => q.章 === chapter);
          const done = rows.filter((q) => progress.ratings[q.id] === "理解").length;
          return <div className="chapter-progress" key={chapter}><span>第{chapter}章</span><strong>{done}/{rows.length}</strong><progress value={done} max={rows.length} /></div>;
        })}
      </div>
    </>
  );
}

function ShokenStudy({ rows }) {
  const options = ["所見の習得方法", "2025年度", "2024年度", "2023年度", "2022年度", "2021年度", "2020年度", "2019年度", "2018年度"];
  const [selected, setSelected] = useState(options[0]);
  const year = selected.replace("年度", "");
  const selectedRows = rows.filter((row) => String(row.年度).replace(/\.0$/, "") === year);

  return (
    <>
      <div className="page-heading"><span>ESSAY STUDY</span><h2>所見で学ぶ</h2><p>問題文から論点を再現する練習を行います。</p></div>
      <section className="filter-panel shoken-select">
        <label>選択
          <select value={selected} onChange={(event) => setSelected(event.target.value)}>
            {options.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </section>
      {selected === "所見の習得方法" ? (
        <section className="surface shoken-guide">
          <h2>所見の習得方法</h2>
          <p>所見は、問題文を見たときに論点を思い出し、一定の型で書けるようにすることが重要です。</p>
          <h3>1．年度ごとの問題と論点を覚える</h3>
          <p>各年度の問題文と論点を繰り返し見て、何がどう問われたかを整理します。テーマが違っても、使う視点には共通点があります。</p>
          <h3>2．中問を丁寧に学ぶ</h3>
          <p>「何を聞かれているか」「どの順で答えるか」を確認し、論点を分けて順序立てて書く力を養います。</p>
          <h3>3．考えるための型を持つ</h3>
          <p>契約者保護、健全性、公平性、収益性、実務負荷、説明責任などの視点から、問題に応じた論点を組み立てます。</p>
        </section>
      ) : selectedRows.length ? (
        <div className="shoken-list">
          {selectedRows.map((row, index) => (
            <article className="question-card shoken-card" key={`${row.id}-${index}`}>
              <div className="question-meta"><span>{selected}</span>{row.問題番号 && <span>{row.問題番号}</span>}</div>
              <h2>問題文</h2><div className="multiline">{row.問題文}</div>
              <h2>論点</h2><div className="multiline answer-panel">{row.論点}</div>
            </article>
          ))}
        </div>
      ) : <div className="empty">{selected}のデータはまだ登録されていません。</div>}
    </>
  );
}

export default function Home() {
  const [questions, setQuestions] = useState([]);
  const [shoken, setShoken] = useState([]);
  const [menu, setMenu] = useState("ホーム");
  const [currentId, setCurrentId] = useState("");
  const [filters, setFilters] = useState({ chapter: "", type: "", year: "", keyword: "" });
  const [loadingError, setLoadingError] = useState("");
  const [timer, setTimer] = useState({ running: false, started: 0, accumulated: 0 });
  const { progress, rate, toggleReview } = useProgress(appConfig.storageKey);
  const today = todayInJapan();

  useEffect(() => {
    fetch("/questions.json")
      .then((response) => {
        if (!response.ok) throw new Error("問題データを取得できませんでした");
        return response.json();
      })
      .then((data) => {
        const rows = data.map(normalizeRow).sort((a, b) => natural(a.id) - natural(b.id));
        setQuestions(rows);
        setCurrentId(rows[0]?.id || "");
      })
      .catch((error) => setLoadingError(error.message));
  }, []);

  useEffect(() => {
    fetch("/shoken.json")
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setShoken(data.map(normalizeRow)))
      .catch(() => setShoken([]));
  }, []);

  useEffect(() => {
    if (!timer.running) return undefined;
    const id = setInterval(() => setTimer((value) => ({ ...value })), 1000);
    return () => clearInterval(id);
  }, [timer.running]);

  const filtered = useMemo(() => questions.filter((q) => {
    const keyword = filters.keyword.trim().toLowerCase();
    return (!filters.chapter || q.章 === filters.chapter)
      && (!filters.type || q.問題種別 === filters.type)
      && (!filters.year || q.年度 === filters.year)
      && (!keyword || [q.問題文, q.解答, q.解説].join(" ").toLowerCase().includes(keyword));
  }), [questions, filters]);

  const todayRows = useMemo(() => {
    const grouped = questions.filter((q) => q.曜日グループ === today.group);
    return grouped.length ? grouped : questions;
  }, [questions, today.group]);

  const elapsed = timer.accumulated + (timer.running ? Math.max(0, Date.now() - timer.started) : 0);
  const timerText = new Date(elapsed).toISOString().slice(11, 19);
  const examDays = daysUntil(appConfig.examDate);

  const openQuestion = (id, targetMenu) => {
    setCurrentId(id);
    setMenu(targetMenu);
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div><span className="eyebrow">ACTUARIAL EXAM STUDY</span><h1>アクチュアリー2次試験 <b>{appConfig.subject}</b></h1></div>
        <div className="exam-count"><span>試験まで</span><strong>{examDays > 0 ? examDays : 0}</strong><span>日</span></div>
      </header>

      <nav className="main-nav" aria-label="メインメニュー">
        {appConfig.menus.map((item) => <button key={item} className={menu === item ? "active" : ""} onClick={() => setMenu(item)}>{item}</button>)}
      </nav>

      <main>
        {loadingError && <div className="error">{loadingError}</div>}
        {menu === "ホーム" && (
          <>
            <section className="hero">
              <div><span className="today">{today.iso}（{today.weekday}）</span><h2>今日も、一問ずつ確実に。</h2><p>学習状況はこの端末に自動保存されます。解答を確認し、理解度を記録しましょう。</p></div>
              <button onClick={() => openQuestion(todayRows.find((q) => !progress.ratings[q.id])?.id || todayRows[0]?.id, "今日の課題")}>今日の課題を始める →</button>
            </section>
            <section className="surface"><h2>学習ダッシュボード</h2><Dashboard questions={questions} progress={progress} /></section>
            <section className="surface timer">
              <div><span>今日の勉強時間</span><strong>{timerText}</strong></div>
              <button onClick={() => setTimer((value) => value.running
                ? { running: false, started: 0, accumulated: value.accumulated + Date.now() - value.started }
                : { ...value, running: true, started: Date.now() })}>{timer.running ? "学習終了" : "学習開始"}</button>
            </section>
          </>
        )}

        {menu === "今日の課題" && <><div className="page-heading"><span>{today.weekday}曜グループ</span><h2>今日の課題</h2><p>{todayRows.length}問から取り組みます。</p></div><QuestionCard rows={todayRows} currentId={currentId} setCurrentId={setCurrentId} progress={progress} rate={rate} toggleReview={toggleReview} /></>}

        {menu === "章ごとに学ぶ" && <><div className="page-heading"><span>CHAPTER STUDY</span><h2>章ごとに学ぶ</h2><p>章・問題種別・年度で絞り込めます。</p></div><Filters questions={questions} filters={filters} setFilters={setFilters} /><QuestionCard rows={filtered} currentId={currentId} setCurrentId={setCurrentId} progress={progress} rate={rate} toggleReview={toggleReview} /></>}

        {menu === "問題検索" && <><div className="page-heading"><span>QUESTION SEARCH</span><h2>問題検索</h2><p>問題文、解答、解説を横断検索できます。</p></div><Filters questions={questions} filters={filters} setFilters={setFilters} showKeyword /><QuestionCard rows={filtered} currentId={currentId} setCurrentId={setCurrentId} progress={progress} rate={rate} toggleReview={toggleReview} /></>}

        {menu === "教科書で学ぶ" && (
          <><div className="page-heading"><span>TEXTBOOK</span><h2>教科書で学ぶ</h2><p>章ごとの簡易まとめを開きます。</p></div>
          <div className="textbook-grid">{Object.entries(appConfig.textbookLinks).map(([chapter, [title, url]]) => (
            <article className="textbook" key={chapter}><span>CHAPTER {chapter}</span><h3>{title}</h3>{url ? <a href={url} target="_blank" rel="noreferrer">資料を開く ↗</a> : <button disabled>準備中</button>}</article>
          ))}</div></>
        )}
        {menu === "所見で学ぶ" && <ShokenStudy rows={shoken} />}
      </main>
      <footer>アクチュアリー2次試験 {appConfig.subject} 過去問演習</footer>
    </div>
  );
}
