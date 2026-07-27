"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { appConfig } from "./config";

const EMPTY_PROGRESS = { ratings: {}, reviewFlags: {}, history: {}, answerViews: {} };
const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

const TWO_WEEK_CYCLE_DAYS = 14;
const TWO_WEEK_CYCLE_START = Date.UTC(2026, 6, 27) / 86400000;

function twoWeekCycleGroup(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const serial = Date.UTC(year, month - 1, day) / 86400000;
  const offset = Math.floor(serial - TWO_WEEK_CYCLE_START);
  return ((offset % TWO_WEEK_CYCLE_DAYS) + TWO_WEEK_CYCLE_DAYS) % TWO_WEEK_CYCLE_DAYS + 1;
}

function viewedOnDate(progress, id, dateKey) {
  const timestamp = Date.parse(progress.answerViews[id] || "");
  return Number.isFinite(timestamp) && japanDateKey(timestamp) === dateKey;
}

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

function japanDateKey(timestamp = Date.now()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

function addStudyInterval(dailySeconds, startTimestamp, endTimestamp) {
  const next = { ...dailySeconds };
  let cursor = Number(startTimestamp);
  const end = Number(endTimestamp);
  if (!Number.isFinite(cursor) || !Number.isFinite(end) || end <= cursor) return next;

  while (cursor < end) {
    const shifted = new Date(cursor + 9 * 60 * 60 * 1000);
    const key = shifted.toISOString().slice(0, 10);
    const nextMidnight = Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate() + 1,
    ) - 9 * 60 * 60 * 1000;
    const segmentEnd = Math.min(end, nextMidnight);
    next[key] = (Number(next[key]) || 0) + (segmentEnd - cursor) / 1000;
    cursor = segmentEnd;
  }
  return next;
}

function recentJapanDays(count, timestamp) {
  const shifted = new Date(timestamp + 9 * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(shifted.getTime() - (count - 1 - index) * 86400000);
    return day.toISOString().slice(0, 10);
  });
}

const STUDY_VIEW_OPTIONS = {
  daily: { label: "日次", periods: 14 },
  weekly: { label: "週次" },
  monthly: { label: "月次", periods: 12 },
};

function utcDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function monthDayLabel(date) {
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

function sumStudySeconds(dailySeconds, startKey, endKey) {
  return Object.entries(dailySeconds).reduce((total, [key, value]) => {
    if (key < startKey || key > endKey) return total;
    return total + Math.max(0, Number(value) || 0);
  }, 0);
}

function availableStudyYears(dailySeconds, currentYear) {
  return [...new Set([
    currentYear,
    ...Object.keys(dailySeconds)
      .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key))
      .map((key) => Number(key.slice(0, 4))),
  ])].sort((a, b) => b - a);
}

function buildStudyPeriods(viewMode, dailySeconds, timestamp, selectedYear) {
  const currentDay = new Date(timestamp + 9 * 60 * 60 * 1000);
  currentDay.setUTCHours(0, 0, 0, 0);

  if (viewMode === "daily") {
    return Array.from({ length: STUDY_VIEW_OPTIONS.daily.periods }, (_, index) => {
      const day = new Date(currentDay.getTime() - (STUDY_VIEW_OPTIONS.daily.periods - 1 - index) * 86400000);
      const key = utcDateKey(day);
      return {
        key,
        label: monthDayLabel(day),
        title: key,
        seconds: Number(dailySeconds[key]) || 0,
      };
    });
  }

  const year = Number(selectedYear) || currentDay.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));

  if (viewMode === "weekly") {
    const daysSinceMonday = (yearStart.getUTCDay() + 6) % 7;
    const firstMonday = new Date(yearStart.getTime() - daysSinceMonday * 86400000);
    const lastWeekDays = (7 - ((yearEnd.getUTCDay() + 6) % 7) - 1) % 7;
    const lastSunday = new Date(yearEnd.getTime() + lastWeekDays * 86400000);
    const periodCount = Math.floor((lastSunday.getTime() - firstMonday.getTime()) / (7 * 86400000)) + 1;

    return Array.from({ length: periodCount }, (_, index) => {
      const weekStart = new Date(firstMonday.getTime() + index * 7 * 86400000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
      const clippedStart = weekStart < yearStart ? yearStart : weekStart;
      const clippedEnd = weekEnd > yearEnd ? yearEnd : weekEnd;
      const startKey = utcDateKey(clippedStart);
      const endKey = utcDateKey(clippedEnd);
      return {
        key: `week-${utcDateKey(weekStart)}`,
        label: monthDayLabel(clippedStart),
        title: `${startKey}〜${endKey}`,
        seconds: sumStudySeconds(dailySeconds, startKey, endKey),
      };
    });
  }

  return Array.from({ length: STUDY_VIEW_OPTIONS.monthly.periods }, (_, index) => {
    const start = new Date(Date.UTC(year, index, 1));
    const end = new Date(Date.UTC(year, index + 1, 0));
    const startKey = utcDateKey(start);
    const endKey = utcDateKey(end);
    return {
      key: `month-${startKey}`,
      label: `${index + 1}月`,
      title: `${year}年${index + 1}月`,
      seconds: sumStudySeconds(dailySeconds, startKey, endKey),
    };
  });
}

function formatStudyBarValue(totalSeconds) {
  const minutes = Math.round((totalSeconds || 0) / 60);
  if (minutes < 1) return "0m";
  if (minutes < 120) return `${minutes}m`;
  const hours = totalSeconds / 3600;
  return hours < 10 ? `${hours.toFixed(1)}h` : `${Math.round(hours)}h`;
}

function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return [hours, minutes, rest].map((value) => String(value).padStart(2, "0")).join(":");
}

function formatStudyDuration(totalSeconds) {
  const minutes = Math.floor((totalSeconds || 0) / 60);
  if (minutes < 60) return `${minutes}分`;
  return `${Math.floor(minutes / 60)}時間${minutes % 60}分`;
}

function formatCompactStudyDuration(totalSeconds) {
  const minutes = Math.floor((totalSeconds || 0) / 60);
  if (minutes < 60) return `${minutes}分`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h${rest}m` : `${hours}h`;
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
          answerViews: saved.answerViews || saved.answer_views || {},
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

  const markAnswerViewed = (id) => setProgress((current) => ({
    ...current,
    answerViews: { ...current.answerViews, [id]: new Date().toISOString() },
  }));

  return { progress, rate, toggleReview, markAnswerViewed };
}

function useStudyTimer(storageKey) {
  const timerStorageKey = `${storageKey}_study_time_v1`;
  const [dailySeconds, setDailySeconds] = useState({});
  const [activeSince, setActiveSince] = useState(null);
  const [now, setNow] = useState(0);
  const dailySecondsRef = useRef({});
  const activeSinceRef = useRef(null);

  useEffect(() => {
    let savedDays = {};
    try {
      const saved = JSON.parse(localStorage.getItem(timerStorageKey) || "null");
      if (saved && typeof saved === "object") savedDays = saved.dailySeconds || {};
    } catch {
      // 壊れた保存値は無視する。
    }

    dailySecondsRef.current = savedDays;
    setDailySeconds(savedDays);

    const persist = (days) => {
      localStorage.setItem(timerStorageKey, JSON.stringify({ dailySeconds: days }));
    };

    const start = (timestamp) => {
      if (activeSinceRef.current == null) {
        activeSinceRef.current = timestamp;
        setActiveSince(timestamp);
      }
      setNow(timestamp);
    };

    const commit = (timestamp, keepRunning = false) => {
      const startedAt = activeSinceRef.current;
      let nextDays = dailySecondsRef.current;
      if (startedAt != null && timestamp > startedAt) {
        nextDays = addStudyInterval(nextDays, startedAt, timestamp);
        dailySecondsRef.current = nextDays;
        setDailySeconds(nextDays);
        persist(nextDays);
      }
      const nextActive = keepRunning ? timestamp : null;
      activeSinceRef.current = nextActive;
      setActiveSince(nextActive);
      setNow(timestamp);
    };

    const handleVisibility = () => {
      const current = Date.now();
      if (document.visibilityState === "visible") start(current);
      else commit(current);
    };
    const handlePageHide = () => commit(Date.now());
    const handlePageShow = () => {
      if (document.visibilityState === "visible") start(Date.now());
    };

    const current = Date.now();
    if (document.visibilityState === "visible") start(current);
    else setNow(current);

    const intervalId = setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      const startedAt = activeSinceRef.current;
      if (startedAt != null && tick - startedAt >= 30000) commit(tick, true);
    }, 1000);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
      const stoppedAt = Date.now();
      const startedAt = activeSinceRef.current;
      if (startedAt != null && stoppedAt > startedAt) {
        const nextDays = addStudyInterval(dailySecondsRef.current, startedAt, stoppedAt);
        dailySecondsRef.current = nextDays;
        persist(nextDays);
        activeSinceRef.current = null;
      }
    };
  }, [timerStorageKey]);

  const displayedDailySeconds = useMemo(
    () => activeSince != null && now ? addStudyInterval(dailySeconds, activeSince, now) : dailySeconds,
    [activeSince, dailySeconds, now],
  );

  return {
    running: activeSince != null,
    dailySeconds: displayedDailySeconds,
    todaySeconds: displayedDailySeconds[japanDateKey(now || Date.now())] || 0,
    now: now || Date.now(),
  };
}

function Stat({ value, label, tone = "", onClick, disabled = false, icon = "" }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      className={`stat ${tone} ${onClick ? "stat-action" : ""}`}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
      type={onClick ? "button" : undefined}
    >
      {icon && <span className="stat-icon" aria-hidden="true">{icon}</span>}
      <strong>{value}</strong>
      <span>{label}</span>
      {onClick && <small>{disabled ? "該当する問題はありません" : "クリックして演習する →"}</small>}
    </Tag>
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

function AssignmentModeSelect({ mode, onChange }) {
  return (
    <label className="assignment-mode-select">
      <span>学習ペース</span>
      <select value={mode} onChange={(event) => onChange(event.target.value)} aria-label="今日の課題の学習ペース">
        <option value="two-week">2週間で一周</option>
        <option value="one-week">1週間で一周</option>
      </select>
    </label>
  );
}

function QuestionCard({ rows, currentId, setCurrentId, progress, rate, toggleReview, markAnswerViewed }) {
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
        onClick={() => {
          if (showing) {
            setShowAnswerFor(null);
          } else {
            setShowAnswerFor(question.id);
            markAnswerViewed(question.id);
          }
        }}
      >
        {showing ? "解答・解説を閉じる" : "解答・解説を表示"}
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

function understandingStage(percent) {
  if (percent >= 100) {
    return { key: "complete", label: "完全理解", icon: "★", message: "全問題を理解済みにしました。積み上げた力を、定期的な復習で定着させましょう。" };
  }
  if (percent >= 75) {
    return { key: "final", label: "仕上げ", icon: "", message: "ゴールが見えてきました。要注意問題を解き直して、理解の穴を埋めましょう。" };
  }
  if (percent >= 50) {
    return { key: "steady", label: "折り返し突破", icon: "", message: "半分を超えました。この調子で、理解済みの範囲を着実に広げましょう。" };
  }
  if (percent >= 25) {
    return { key: "growing", label: "成長中", icon: "", message: "学習のペースができています。一問ずつ理解に変えていきましょう。" };
  }
  return { key: "start", label: "スタート", icon: "", message: "最初の一歩です。理解済みを増やして、学習の土台を作りましょう。" };
}

function Dashboard({ questions, progress, onOpenCaution, onOpenReview, onOpenChapter }) {
  const understood = questions.filter((q) => progress.ratings[q.id] === "理解").length;
  const caution = questions.filter((q) => progress.ratings[q.id] === "要注意").length;
  const review = questions.filter((q) => progress.reviewFlags[q.id]).length;
  const percent = questions.length ? Math.round(understood / questions.length * 100) : 0;
  const remaining = Math.max(0, questions.length - understood);
  const stage = understandingStage(percent);
  const goldProgress = Math.max(0, Math.min(1, (percent - 50) / 50));
  const dashboardStyle = {
    "--gold-progress": goldProgress,
    "--gold-soft": Number((goldProgress * 0.72).toFixed(3)),
    "--gold-glow": Number((goldProgress * 0.38).toFixed(3)),
  };
  const chapters = [...new Set(questions.map((q) => q.章).filter(Boolean))].sort((a, b) => natural(a) - natural(b));

  return (
    <div className={`learning-dashboard stage-${stage.key}`} style={dashboardStyle}>
      <div className="dashboard-status">
        <div><span>UNDERSTANDING LEVEL</span><h3>{stage.label}</h3></div>
        <strong>{stage.icon && <b>{stage.icon}</b>}{percent}%</strong>
      </div>
      <p className="motivation-message">{stage.message}</p>
      <div className="stats">
        <Stat value={`${understood} / ${questions.length}`} label="理解／全問題" tone="understanding" />
        <Stat value={caution} label="要注意" tone="caution" icon="!" onClick={onOpenCaution} disabled={caution === 0} />
        <Stat value={review} label="後で復習" tone="review" icon="↺" onClick={onOpenReview} disabled={review === 0} />
      </div>
      <div className="progress-block">
        <div><span>全体理解度</span><strong>{percent}%</strong></div>
        <div
          className="understanding-track"
          role="progressbar"
          aria-label="全体理解度"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={percent}
        >
          <div className="understanding-fill" style={{ width: `${percent}%` }} />
        </div>
        <small>{remaining ? `あと${remaining}問を理解すると全問達成です` : "全問理解を達成しました！"}</small>
      </div>
      <div className="chapter-grid">
        {chapters.map((chapter) => {
          const rows = questions.filter((q) => q.章 === chapter);
          const done = rows.filter((q) => progress.ratings[q.id] === "理解").length;
          return (
            <button
              type="button"
              className="chapter-progress"
              key={chapter}
              onClick={() => onOpenChapter(chapter)}
              aria-label={`第${chapter}章の問題を開く。理解済み${done}問、全${rows.length}問`}
            >
              <div className="chapter-progress-head"><span>第{chapter}章</span><strong>{done}/{rows.length}</strong></div>
              <progress value={done} max={rows.length} />
              <small>この章を学ぶ →</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuestionQueue({ rows, currentId, setCurrentId, progress, rate, toggleReview, markAnswerViewed, eyebrow, title, description, emptyMessage }) {
  return (
    <>
      <div className="page-heading"><span>{eyebrow}</span><h2>{title}</h2><p>{description}（現在{rows.length}問）</p></div>
      {rows.length ? (
        <QuestionCard rows={rows} currentId={currentId} setCurrentId={setCurrentId} progress={progress} rate={rate} toggleReview={toggleReview} markAnswerViewed={markAnswerViewed} />
      ) : <div className="empty queue-complete">{emptyMessage}</div>}
    </>
  );
}
function StudyHistory({ dailySeconds, now }) {
  const [viewMode, setViewMode] = useState("monthly");
  const currentYear = Number(japanDateKey(now).slice(0, 4));
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const yearOptions = availableStudyYears(dailySeconds, currentYear);
  const todayKey = japanDateKey(now);
  const todaySeconds = Number(dailySeconds[todayKey]) || 0;

  const currentDay = new Date(now + 9 * 60 * 60 * 1000);
  const monthStart = utcDateKey(new Date(Date.UTC(currentDay.getUTCFullYear(), currentDay.getUTCMonth(), 1)));
  const monthEnd = utcDateKey(new Date(Date.UTC(currentDay.getUTCFullYear(), currentDay.getUTCMonth() + 1, 0)));
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;
  const monthlySeconds = sumStudySeconds(dailySeconds, monthStart, monthEnd);
  const yearlySeconds = sumStudySeconds(dailySeconds, yearStart, yearEnd);

  const periods = buildStudyPeriods(viewMode, dailySeconds, now, selectedYear);
  const maxSeconds = Math.max(60, ...periods.map((period) => period.seconds));
  const viewLabel = STUDY_VIEW_OPTIONS[viewMode].label;

  return (
    <section className="surface study-history">
      <div className="section-title">
        <div><span>STUDY LOG</span><h2>日々の勉強記録</h2></div>
        <div className="study-history-tools">
          <div className="study-filter-row">
            <label>表示単位
              <select
                aria-label="勉強記録の表示単位"
                value={viewMode}
                onChange={(event) => setViewMode(event.target.value)}
              >
                {Object.entries(STUDY_VIEW_OPTIONS).map(([value, option]) => (
                  <option key={value} value={value}>{option.label}</option>
                ))}
              </select>
            </label>
            {viewMode !== "daily" && (
              <label>表示年
                <select
                  aria-label="勉強記録の表示年"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                >
                  {yearOptions.map((year) => <option key={year} value={year}>{year}年</option>)}
                </select>
              </label>
            )}
          </div>
          <p>週次・月次では、選択した年の1月から12月まで確認できます。</p>
        </div>
      </div>
      <div className="study-summary">
        <Stat value={formatCompactStudyDuration(todaySeconds)} label="今日" tone="study-today" />
        <Stat value={formatCompactStudyDuration(monthlySeconds)} label="今月" />
        <Stat value={formatCompactStudyDuration(yearlySeconds)} label="今年" tone="study-year" />
      </div>
      <div
        className={`study-chart ${viewMode === "monthly" ? "study-chart-monthly" : ""}`}
        aria-label={`${viewLabel}で集計した勉強時間`}
        style={{ "--study-period-count": periods.length }}
      >
        {periods.map((period) => {
          const height = period.seconds ? Math.max(8, period.seconds / maxSeconds * 100) : 2;
          return (
            <div className="study-bar-column" key={period.key} title={`${period.title}: ${formatStudyDuration(period.seconds)}`}>
              <div className="study-bar-track">
                <span className="study-bar-value">{formatStudyBarValue(period.seconds)}</span>
                <div className="study-bar" style={{ height: `${height}%` }} />
              </div>
              <span className="study-bar-label">{period.label}</span>
            </div>
          );
        })}
      </div>
    </section>
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
  const { progress, rate, toggleReview, markAnswerViewed } = useProgress(appConfig.storageKey);
  const studyTimer = useStudyTimer(appConfig.storageKey);
  const today = todayInJapan();
  const assignmentModeStorageKey = `${appConfig.storageKey}_assignment_mode_v1`;
  const [assignmentMode, setAssignmentMode] = useState("two-week");

  useEffect(() => {
    const savedMode = localStorage.getItem(assignmentModeStorageKey);
    if (savedMode === "two-week" || savedMode === "one-week") setAssignmentMode(savedMode);
  }, [assignmentModeStorageKey]);

  const changeAssignmentMode = (mode) => {
    setAssignmentMode(mode);
    localStorage.setItem(assignmentModeStorageKey, mode);
  };

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

  const filtered = useMemo(() => questions.filter((q) => {
    const keyword = filters.keyword.trim().toLowerCase();
    return (!filters.chapter || q.章 === filters.chapter)
      && (!filters.type || q.問題種別 === filters.type)
      && (!filters.year || q.年度 === filters.year)
      && (!keyword || [q.問題文, q.解答, q.解説].join(" ").toLowerCase().includes(keyword));
  }), [questions, filters]);

  const todayCycleGroup = twoWeekCycleGroup(today.iso);
  const oneWeekStartGroup = Number(today.group) * 2 - 1;
  const todayGroupNumbers = assignmentMode === "one-week"
    ? [oneWeekStartGroup, oneWeekStartGroup + 1]
    : [todayCycleGroup];
  const todayRows = useMemo(
    () => questions.filter((question) => todayGroupNumbers.includes(Number(question.曜日グループ))),
    [questions, assignmentMode, today.group, todayCycleGroup],
  );
  const todayCompleted = todayRows.filter((q) => viewedOnDate(progress, q.id, today.iso)).length;
  const todayRemaining = Math.max(0, todayRows.length - todayCompleted);
  const todayComplete = todayRows.length > 0 && todayRemaining === 0;
  const nextTodayQuestion = todayRows.find((q) => !viewedOnDate(progress, q.id, today.iso)) || todayRows[0];
  const assignmentDescription = assignmentMode === "one-week"
    ? "今日の問題をすべて進めると、1週間で全問題を一周できます。"
    : "毎日の課題を終えると、2週間で全問題を一周できます。";

  const cautionRows = questions.filter((q) => progress.ratings[q.id] === "要注意");
  const reviewRows = questions.filter((q) => progress.reviewFlags[q.id]);

  const examDays = daysUntil(appConfig.examDate);

  const openQuestion = (id, targetMenu) => {
    setCurrentId(id);
    setMenu(targetMenu);
  };

  const openChapter = (chapter) => {
    const chapterRows = questions.filter((q) => q.章 === chapter);
    setFilters({ chapter, type: "", year: "", keyword: "" });
    openQuestion(chapterRows[0]?.id || "", "章ごとに学ぶ");
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div><span className="eyebrow">ACTUARIAL EXAM STUDY</span><h1>アクチュアリー2次試験 <b>{appConfig.subject}</b></h1></div>
        <div className="exam-count">
          <span>試験まで</span>
          <div><strong>{examDays > 0 ? examDays : 0}</strong><span>日</span></div>
        </div>
      </header>

      <nav className="main-nav" aria-label="メインメニュー">
        {appConfig.menus.map((item) => <button key={item} className={menu === item ? "active" : ""} onClick={() => setMenu(item)}>{item}</button>)}
      </nav>

      <main>
        {loadingError && <div className="error">{loadingError}</div>}
        {menu === "ホーム" && (
          <>
            <section className={`hero daily-hero ${todayComplete ? "is-complete" : "has-pending"}`}>
              <div>
                <span className="today">{today.iso}（{today.weekday}）</span>
                <h2>{todayComplete ? "今日の課題、完了です。" : "今日も、1問ずつ確実に。"}</h2>
                <p className="daily-task-progress-copy">
                  {todayComplete
                    ? `本日の${todayRows.length}問を完了しました。`
                    : `本日は${todayCompleted} / ${todayRows.length}問完了。残り${todayRemaining}問です。`}
                </p>
                <p>学習状況はこの端末に自動保存されます。解答を確認し、理解度を記録しましょう。</p>
              </div>
              <div className="daily-task-actions">
                <button
                  className={`daily-task-button ${todayComplete ? "is-complete" : ""}`}
                  onClick={() => openQuestion(nextTodayQuestion?.id || "", "今日の課題")}
                >
                  <span>{todayComplete ? "本日分完了" : "今日の課題"}</span>
                  <strong>{todayComplete ? "もう一度確認する →" : `残り${todayRemaining}問を進める →`}</strong>
                </button>
                <AssignmentModeSelect mode={assignmentMode} onChange={changeAssignmentMode} />
              </div>
            </section>
            <section className="surface"><h2>学習ダッシュボード</h2><Dashboard
              questions={questions}
              progress={progress}
              onOpenCaution={() => openQuestion(cautionRows[0]?.id || "", "要注意問題")}
              onOpenReview={() => openQuestion(reviewRows[0]?.id || "", "後で復習問題")}
              onOpenChapter={openChapter}
            /></section>
            <section className="surface timer automatic-timer">
              <div><span>今日の勉強時間</span><strong>{formatClock(studyTimer.todaySeconds)}</strong></div>
              <div className={`auto-timer-status ${studyTimer.running ? "is-running" : ""}`}>
                <span><i aria-hidden="true" />{studyTimer.running ? "自動計測中" : "一時停止中"}</span>
                <small>このWEBアプリを開いて勉強している時間を自動保存</small>
              </div>
            </section>
            <StudyHistory dailySeconds={studyTimer.dailySeconds} now={studyTimer.now} />
          </>
        )}

        {menu === "今日の課題" && (
          <>
            <div className="page-heading today-task-heading">
              <span>{assignmentMode === "one-week" ? "7-DAY REVIEW" : "14-DAY STUDY CYCLE"}</span>
              <h2>今日の課題</h2>
              <p>{assignmentDescription}</p>
              <div className={`today-task-meter ${todayComplete ? "is-complete" : ""}`}>
                <div><span>本日の進捗</span><strong>{todayCompleted} / {todayRows.length}問</strong></div>
                <div
                  className="today-task-track"
                  role="progressbar"
                  aria-label="今日の課題の進捗"
                  aria-valuemin="0"
                  aria-valuemax={todayRows.length}
                  aria-valuenow={todayCompleted}
                >
                  <i style={{ width: `${todayRows.length ? todayCompleted / todayRows.length * 100 : 0}%` }} />
                </div>
                <small>{todayComplete ? "本日の課題を完了しました。" : `今日の残りは${todayRemaining}問です。`}</small>
              </div>
            </div>
            <QuestionCard rows={todayRows} currentId={currentId} setCurrentId={setCurrentId} progress={progress} rate={rate} toggleReview={toggleReview} markAnswerViewed={markAnswerViewed} />
          </>
        )}

        {menu === "要注意問題" && <QuestionQueue
          rows={cautionRows}
          currentId={currentId}
          setCurrentId={setCurrentId}
          progress={progress}
          rate={rate}
          toggleReview={toggleReview} markAnswerViewed={markAnswerViewed}
          eyebrow="CAUTION REVIEW"
          title="要注意問題を解く"
          description="「要注意」にした問題だけを続けて演習します。理解できたら自己評価を「理解」に変更しましょう。"
          emptyMessage="要注意問題をすべて解消しました。ホームのダッシュボードから次の学習に進みましょう。"
        />}

        {menu === "後で復習問題" && <QuestionQueue
          rows={reviewRows}
          currentId={currentId}
          setCurrentId={setCurrentId}
          progress={progress}
          rate={rate}
          toggleReview={toggleReview} markAnswerViewed={markAnswerViewed}
          eyebrow="REVIEW STOCK"
          title="後で復習する問題"
          description="復習フラグを付けた問題だけを続けて演習します。復習後はフラグを外せます。"
          emptyMessage="復習ストックをすべて完了しました。ホームのダッシュボードから次の学習に進みましょう。"
        />}

        {menu === "章ごとに学ぶ" && <><div className="page-heading"><span>CHAPTER STUDY</span><h2>章ごとに学ぶ</h2><p>章・問題種別・年度で絞り込めます。</p></div><Filters questions={questions} filters={filters} setFilters={setFilters} /><QuestionCard rows={filtered} currentId={currentId} setCurrentId={setCurrentId} progress={progress} rate={rate} toggleReview={toggleReview} markAnswerViewed={markAnswerViewed} /></>}

        {menu === "問題検索" && <><div className="page-heading"><span>QUESTION SEARCH</span><h2>問題検索</h2><p>問題文、解答、解説を横断検索できます。</p></div><Filters questions={questions} filters={filters} setFilters={setFilters} showKeyword /><QuestionCard rows={filtered} currentId={currentId} setCurrentId={setCurrentId} progress={progress} rate={rate} toggleReview={toggleReview} markAnswerViewed={markAnswerViewed} /></>}

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
