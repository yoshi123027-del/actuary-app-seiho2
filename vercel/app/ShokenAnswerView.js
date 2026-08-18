import styles from "./ShokenAnswerView.module.css";
import QuestionComment from "./QuestionComment";

const ORDER = ["目的", "変化", "影響", "計測", "併用", "経営対応"];
const HEADING_MAP = [
  [/何を守る|何を実現|目的/u, "目的"],
  [/何が変化|変化・制約/u, "変化"],
  [/何に影響|収支・契約者・リスク/u, "影響"],
  [/どう測る|確認・計測/u, "計測"],
  [/二つを併用|併用する視点/u, "併用"],
  [/どう対応|反映/u, "経営対応"],
];
const DOMAIN_TERMS = [
  "契約者保護", "契約者間の公平性", "公平性", "収益性", "健全性", "責任準備金",
  "ソルベンシー", "内部管理会計", "法定会計", "区分経理", "利源分析", "アセットシェア",
  "経済価値", "EV", "将来収支", "計算基礎率", "予定利率", "死亡率", "発生率", "解約率",
  "事業費", "ALM", "流動性", "リスクアペタイト", "ストレステスト", "再保険", "内部留保",
  "事後モニタリング", "モデルリスク", "データ品質", "独立検証", "回復計画",
];

function clean(value) {
  return String(value || "").replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
}

function frameworkEntries(text) {
  const buckets = Object.fromEntries(ORDER.map((key) => [key, []]));
  let current = null;
  String(text || "").replace(/\r/g, "").split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;
    const heading = line.match(/^【(.+)】$/u)?.[1] || "";
    if (heading) {
      current = HEADING_MAP.find(([pattern]) => pattern.test(heading))?.[1] || null;
      return;
    }
    if (current) buckets[current].push(line);
  });
  return ORDER.map((key) => ({
    key,
    text: buckets[key].join(" ").replace(/[。！？]+$/u, "") || "問題文から主要論点を確認",
  }));
}

function emphasisTerms(entries) {
  const source = entries.map((entry) => entry.text).join(" ");
  const terms = DOMAIN_TERMS.filter((term) => source.includes(term));
  source.split(/[、。，・／/（）()「」『』：:\n]/u)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3 && part.length <= 18)
    .forEach((part) => terms.push(part));
  return [...new Set(terms)].sort((left, right) => right.length - left.length);
}

function EmphasizedText({ text, terms }) {
  const nodes = [];
  let cursor = 0;
  let key = 0;
  while (cursor < text.length) {
    let bestIndex = -1;
    let bestTerm = "";
    terms.forEach((term) => {
      const index = text.indexOf(term, cursor);
      if (index < 0) return;
      if (bestIndex < 0 || index < bestIndex || (index === bestIndex && term.length > bestTerm.length)) {
        bestIndex = index;
        bestTerm = term;
      }
    });
    if (bestIndex < 0) {
      nodes.push(text.slice(cursor));
      break;
    }
    if (bestIndex > cursor) nodes.push(text.slice(cursor, bestIndex));
    nodes.push(<strong key={`strong-${key}`}>{bestTerm}</strong>);
    key += 1;
    cursor = bestIndex + bestTerm.length;
  }
  return nodes.length ? nodes : text;
}

function Framework({ entries }) {
  return (
    <div className={styles.frameworkBox}>
      <h3>論文式の思考フレーム</h3>
      <p className={styles.frameworkFlow}><strong>{ORDER.join(" → ")}</strong></p>
      {entries.map((entry) => <p key={entry.key}><strong>{entry.key}：</strong>{entry.text}</p>)}
      <p className={styles.frameworkNote}>1分程度で答案の骨格と加点論点を整理するメモ。</p>
    </div>
  );
}

export default function ShokenAnswerView({ row = {} }) {
  const shortAnswers = Array.isArray(row.短答) ? row.短答 : [];
  const groups = Array.isArray(row.論文式答案) ? row.論文式答案 : [];
  const framework = frameworkEntries(row.フレームワークを用いた論点整理);
  const terms = emphasisTerms(framework);

  return (
    <div className={styles.answerView}>
      <section className={styles.section}>
        <div className={styles.answerHeading}><h2>合格レベル答案</h2></div>

        {shortAnswers.map((answer) => answer.text && (
          <div className={styles.shortAnswer} key={answer.title}>
            <h3>{answer.title}</h3>
            <div className={styles.text}><p>{answer.text}</p></div>
          </div>
        ))}

        <Framework entries={framework} />

        <div className={styles.essayHeading}><h3>論文式答案</h3></div>
        <div className={styles.text}>
          {groups.map((group) => (
            <section className={styles.majorGroup} key={group.title}>
              <h3 className={styles.majorTitle}>{group.title}</h3>
              {group.subgroups.map((subgroup) => (
                <div className={styles.middleGroup} key={`${group.title}-${subgroup.title}`}>
                  <h4 className={styles.middleTitle}>{subgroup.title}</h4>
                  {subgroup.bullets.map((bullet, index) => (
                    <p className={styles.bullet} key={`${group.title}-${subgroup.title}-${index}`}>
                      <EmphasizedText text={clean(bullet)} terms={terms} />
                    </p>
                  ))}
                </div>
              ))}
            </section>
          ))}
        </div>
        <QuestionComment row={row} />
      </section>
    </div>
  );
}
