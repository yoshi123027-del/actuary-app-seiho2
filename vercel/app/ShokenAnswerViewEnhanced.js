import styles from "./ShokenAnswerView.module.css";

const ORDER = ["目的", "変化", "影響", "計測", "経営対応"];
const KEYS = {"目的":["目的","意義","契約者保護","健全性","公平","収益性","経営"],"変化":["変化","導入","新商品","金利","インフレ","競争","制度","環境","リスクプロファイル"],"影響":["影響","損益","利益","責任準備金","自己資本","経済価値","流動性","配当","費差","利差"],"計測":["計測","評価","分析","検証","前提","モデル","シナリオ","ストレス","利源","EV","ALM"],"経営対応":["対応","活用","管理","商品","料率","販売","再保険","ヘッジ","資本","配当","モニタリング","回復計画"]};
const FALLBACK = {"目的":["契約者保護、健全性、公平性、持続的収益性の中心目的を明確にする。","指標の計算自体ではなく、経営判断に役立てる目的を示す。","法定目的と内部管理目的を区別し、必要に応じて併用する。"],"変化":["商品、チャネル、経済環境、制度、契約者行動の変化を抽出する。","複数要因の相互作用と時間軸を確認する。","保有契約、資産構成、リスクプロファイルへの波及を整理する。"],"影響":["法定損益、経済価値、責任準備金、自己資本、流動性への影響を分ける。","商品・契約年度・チャネル・利源別に影響を分解する。","短期と将来、通常時とストレス時で影響方向が変わる可能性を示す。"],"計測":["単年度と将来収支、法定会計と経済価値、通常計測とストレスを併用する。","前提・モデル・データを実績対比、感応度、独立検証で確認する。","結果を要因分解し、指標間の差異と限界を経営へ説明する。"],"経営対応":["商品・料率、販売、ALM、再保険、資本、配当、事業費へ反映する。","リスク限度、警戒・介入・回復トリガーと責任部署を定める。","施策実施後の効果と副作用をモニタリングし、見直す。"]};

const sentences = (text) => String(text || "").replace(/\r/g, "")
  .split(/(?<=[。！？])|\n+/).map((x) => x.trim()).filter((x) => x.length >= 10);
const short = (text, n = 112) => {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  return value.length <= n ? value : `${value.slice(0, n).replace(/[、。\s]+$/, "")}…`;
};

function frameworkPoints(row) {
  const source = sentences(`${row.問題文 || ""}\n${row.合格レベル答案 || ""}`);
  return Object.fromEntries(ORDER.map((name) => {
    const ranked = source.map((text, index) => ({ text, index,
      score: (KEYS[name] || []).reduce((s, key) => s + (text.includes(key) ? 2 : 0), 0),
    })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || a.index - b.index);
    const result = [];
    for (const item of ranked) {
      const value = short(item.text);
      if (!result.includes(value)) result.push(value);
      if (result.length === 3) break;
    }
    for (const value of FALLBACK[name] || []) {
      if (result.length === 3) break;
      if (!result.includes(value)) result.push(value);
    }
    return [name, result.slice(0, 3)];
  }));
}

function problemSections(problem) {
  const lines = String(problem || "").replace(/\r/g, "").split("\n").map((x) => x.trim()).filter(Boolean);
  const result = [];
  let required = false;
  lines.forEach((line, index) => {
    if (/[＜【].*(論点|観点).*[＞】]/u.test(line) || /以下の(点|論点).*触れる/u.test(line)) { required = true; return; }
    if (/[＜【].*(前提|特徴|状況|環境変化).*[＞】]/u.test(line) || /^※/u.test(line)) required = false;
    let match = line.match(/^(（[ア-オ]）|\([ア-オ]\)|[①-⑩])\s*(.*)$/u);
    if (!match) match = line.match(/^([Ａ-ＦA-F][．.])\s*(.*)$/u);
    if (match) {
      let body = match[2].trim();
      if (!body || /^(次の|以下|あなた|このような|上記)/.test(body)) body = `${body} ${lines[index + 1] || ""}`.trim();
      body = body.replace(/。.*$/u, "").replace(/\s+/g, " ").trim();
      result.push(`${match[1]} ${short(body || "問題文で指定された論点", 64)}`);
    } else if (required && /^[-・]/u.test(line)) {
      result.push(`指定論点 ${short(line.replace(/^[-・]\s*/u, ""), 60)}`);
    }
  });
  return [...new Set(result)].slice(0, 12).length ? [...new Set(result)].slice(0, 12) : ["問題文に沿った答案"];
}

function categories(title) {
  const ranked = ORDER.map((name) => ({ name,
    score: (KEYS[name] || []).reduce((s, key) => s + (title.includes(key) ? 2 : 0), title.includes(name) ? 4 : 0),
  })).sort((a, b) => b.score - a.score);
  const result = ranked.filter((x) => x.score > 0).slice(0, 3).map((x) => x.name);
  for (const name of ORDER) { if (result.length >= 3) break; if (!result.includes(name)) result.push(name); }
  return result;
}

function answerParts(text, minimum) {
  const parts = String(text || "").split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  while (parts.length < minimum) {
    const index = parts.reduce((best, x, i) => best < 0 || x.length > parts[best].length ? i : best, -1);
    const list = sentences(parts[index]);
    if (index < 0 || list.length < 2) break;
    const half = Math.ceil(list.length / 2);
    parts.splice(index, 1, list.slice(0, half).join(""), list.slice(half).join(""));
  }
  return parts;
}

function distribute(parts, count) {
  const rest = [...parts];
  return Array.from({ length: count }, (_, i) => {
    if (i === count - 1) return rest.splice(0);
    return rest.splice(0, Math.max(1, Math.floor(rest.length / (count - i))));
  });
}

function threePoints(parts) {
  const result = [];
  for (const text of sentences(parts.join("\n"))) {
    const value = short(text, 104);
    if (!result.includes(value)) result.push(value);
    if (result.length === 3) break;
  }
  const extra = [
    "中問で確認した定義・意義を、所見の判断根拠として使う。",
    "問題文固有の前提を一般論へ当てはめ、影響の方向を示す。",
    "施策の効果に加え、限界・副作用・事後検証まで記述する。",
  ];
  for (const value of extra) { if (result.length === 3) break; if (!result.includes(value)) result.push(value); }
  return result.slice(0, 3);
}

function Framework({ row }) {
  const points = frameworkPoints(row);
  return <div className={styles.text}>
    <p><strong>{ORDER.join(" → ")}</strong></p>
    {ORDER.map((name) => <div key={name}>
      <h3>{name}</h3>
      {points[name].map((point, i) => <p className={styles.bullet} key={`${name}-${i}`}><strong>論点{i + 1}</strong>　{point}</p>)}
    </div>)}
  </div>;
}

function Answer({ row }) {
  const sections = problemSections(row.問題文);
  const groups = distribute(answerParts(row.合格レベル答案, sections.length), sections.length);
  return <div className={styles.text}>{sections.map((title, i) => {
    const frame = categories(title);
    const body = groups[i] || [];
    return <div key={`${row.id}-${title}`}>
      <h3>{title}</h3>
      <p><strong>【フレームワーク：{frame.join("・")}】</strong></p>
      <p><strong>中問知識の使い方：</strong>この区分の知識を、後続の所見では「{frame.join("・")}」の判断根拠として使う。</p>
      {threePoints(body).map((point, j) => <p className={styles.bullet} key={`${row.id}-${i}-${j}`}><strong>加点論点{j + 1}</strong>　{point}</p>)}
      {body.map((paragraph, j) => <p key={`${row.id}-${i}-body-${j}`}>{paragraph}</p>)}
    </div>;
  })}</div>;
}

export default function ShokenAnswerViewEnhanced({ row }) {
  return <div className={styles.answerView}>
    <section className={styles.section}>
      <h2>① フレームワークを用いた論点整理</h2>
      <Framework row={row} />
    </section>
    <section className={styles.section}>
      <div className={styles.answerHeading}>
        <h2>② 合格レベル答案</h2>
        <span>問題文の指定構成を土台に、各区分で最低3論点を展開</span>
      </div>
      <Answer row={row} />
    </section>
  </div>;
}
