import styles from "./ShokenAnswerView.module.css";

const FRAMEWORK_ORDER = ["目的", "変化", "影響", "計測", "経営対応"];

const HEADING_ALIASES = {
  "【目的】": { key: "目的" },
  "【①何を実現・保護するか】": { key: "目的" },
  "【①何を守るのか】": { key: "目的" },
  "【変化】": { key: "変化" },
  "【②問題文から読み取る変化・制約】": { key: "変化" },
  "【②何が変化したのか】": { key: "変化" },
  "【影響】": { key: "影響" },
  "【③収支・契約者・リスクへの影響】": { key: "影響" },
  "【③何に影響するのか】": { key: "影響" },
  "【計測】": { key: "計測" },
  "【④確認・計測する方法】": { key: "計測" },
  "【④どう測るのか】": { key: "計測" },
  "【二つを併用する視点】": { key: "計測", prefix: "併用の視点：" },
  "【経営対応】": { key: "経営対応" },
  "【⑤商品・料率・販売・リスク管理への反映】": { key: "経営対応" },
  "【⑤どう対応するのか】": { key: "経営対応" },
};

const ANSWER_STRUCTURES = {
  "1": [
    ["① 生命保険会計の意義および特徴", ["目的", "変化", "影響"], 1],
    ["② 現行法定会計と内部管理会計の役割分担", ["目的", "計測"], 2],
    ["② 価値基準会計等による期間損益・企業価値の把握", ["影響", "計測"], 1],
    ["② 国際的に統一された会計基準を導入する意義と留意点", ["変化", "影響", "計測"], 2],
    ["② アクチュアリーの役割と経営への反映", ["計測", "経営対応"], 1]
  ],
  "2": [
    ["① 静的なソルベンシー検証", ["計測"], 1],
    ["① 動的なソルベンシー検証", ["計測"], 1],
    ["② ソルベンシー評価の意義", ["目的"], 1],
    ["② 適切な責任準備金評価", ["影響", "計測"], 1],
    ["② 通常予測を超えるリスクへの財務上の備え", ["影響", "経営対応"], 1],
    ["② ERM・グローバル展開を踏まえた総合評価", ["変化", "計測"], 2],
    ["② 評価結果を具体的な経営行動へつなげる方法", ["経営対応"], 1]
  ],
  "3": [
    ["① 契約者配当の四原則", ["目的"], 1],
    ["② 利源別配当方式", ["計測"], 1],
    ["② アセットシェア方式", ["計測"], 1],
    ["③ A．商品特性の相違を踏まえた配当", ["変化", "影響"], 2],
    ["③ B．金利低下傾向における取扱い", ["変化", "影響", "計測"], 1],
    ["③ C．基礎率改定時の新旧契約間調整", ["変化", "影響", "経営対応"], 2],
    ["③ D．発売後年数が短い医療保険の配当率", ["影響", "計測", "経営対応"], 1],
    ["③ 公正・衡平な配当の総合判断", ["目的", "経営対応"], 1]
  ],
  "4": [
    ["① 利源枠・純保枠のメリットとデメリット", ["計測"], 1],
    ["② EVの意義・考え方・特徴", ["計測"], 1],
    ["③ A．純損失の要因および今後の見通し", ["変化", "影響", "計測"], 2],
    ["③ B．事業費管理のあり方", ["影響", "経営対応"], 1],
    ["③ C．単年度収支・将来収支・EVの留意点", ["計測"], 2],
    ["③ D．具体的な収益管理手法の提案", ["経営対応"], 2]
  ],
  "5": [
    ["① 区分経理の意義", ["目的"], 1],
    ["② 新商品について新区分を設ける理由", ["変化", "影響"], 1],
    ["③ A．区分ごとの損益把握方法", ["計測"], 2],
    ["③ B．全社区分との関係", ["影響", "計測", "経営対応"], 1],
    ["③ C．区分ごとのリスク管理", ["計測", "経営対応"], 2],
    ["③ 契約者間公平とセルフサポートの総合判断", ["目的", "経営対応"], 1]
  ],
  "6": [
    ["① VaRのデメリットとストレステストの意義・目的", ["目的", "計測"], 1],
    ["② A．パンデミックシナリオの設定方法", ["変化", "計測"], 2],
    ["② B．ストレステストにおける確認項目", ["影響", "計測"], 1],
    ["② C．パンデミックが確認項目に与える影響", ["変化", "影響"], 2],
    ["② D．テスト結果の活用方法", ["経営対応"], 2]
  ],
  "7": [
    ["① 責任準備金の長期性による特徴・基礎率の評価性", ["目的", "影響"], 1],
    ["② ロックイン方式のデメリットを補完する現行制度", ["計測", "経営対応"], 1],
    ["③ A．ロックフリー方式における計算基礎率の設定", ["変化", "計測"], 2],
    ["③ B．資産評価・収益管理", ["影響", "計測"], 2],
    ["③ C．ソルベンシー管理", ["影響", "経営対応"], 2],
    ["③ 導入時のガバナンスと移行管理", ["計測", "経営対応"], 1]
  ],
  "8": [
    ["① リスク管理プロセスの六段階", ["計測"], 1],
    ["① 回避・受容・軽減・移転の四カテゴリー", ["経営対応"], 1],
    ["② A．医療保険販売によるリスクプロファイルの変化", ["変化", "影響"], 2],
    ["② B．変化したリスクへの対応", ["計測", "経営対応"], 2],
    ["② C．リスク管理高度化のための検討事項", ["計測", "経営対応"], 2]
  ],
  "9": [
    ["（ア）利源分析の意義", ["目的", "計測"], 1],
    ["（イ）予定利息の内容と役割", ["計測"], 1],
    ["（イ）解約・失効契約の消滅時保険料積立金", ["計測"], 1],
    ["（ウ）A．医療保険の特性を踏まえた利源分析", ["変化", "影響", "計測"], 2],
    ["（ウ）B．追加責任準備金の利源分析上の取扱い", ["影響", "計測"], 2],
    ["（ウ）分析結果の内部管理・経営施策への活用", ["経営対応"], 1]
  ],
  "10": [
    ["（ア）ソルベンシー評価の意義", ["目的"], 1],
    ["（イ）経済価値ベース評価のメリット", ["計測"], 1],
    ["（イ）経済価値ベース評価のデメリット", ["計測"], 1],
    ["（ウ）A．内部管理目的でのソルベンシー評価", ["計測"], 2],
    ["（ウ）B．健全性確保の方策とリスク管理", ["影響", "経営対応"], 2],
    ["（ウ）C．収益性向上への活用", ["計測", "経営対応"], 2]
  ],
  "11": [
    ["（ア）予定事業費枠の意義と役割", ["目的", "計測"], 1],
    ["（イ）商品別原価計算の目的と概要", ["計測"], 1],
    ["（ウ）A．事業費・事業費効率を把握する一般論", ["影響", "計測"], 2],
    ["（ウ）B．インフレ率上昇を踏まえた留意点", ["変化", "影響", "計測"], 2],
    ["（ウ）C．IT投資等の経営政策上の留意点", ["計測", "経営対応"], 2]
  ],
  "12": [
    ["（ア）金利リスク以外の三つの市場リスク", ["影響"], 1],
    ["（イ）流動性リスクと潜在的要因", ["影響", "計測"], 1],
    ["（ウ）A．考慮すべき保険契約者のオプション", ["変化", "影響", "計測"], 2],
    ["（ウ）B．資産ポートフォリオ・運用方針", ["計測", "経営対応"], 2],
    ["（ウ）C．流動性管理と継続的リスク管理", ["計測", "経営対応"], 2]
  ],
  "13": [
    ["（ア）契約者配当を行う理由", ["目的"], 1],
    ["（イ）A．商品特性の相違を踏まえた配当", ["変化", "影響"], 2],
    ["（イ）B．新旧予定利率契約の利差配当水準", ["変化", "影響", "計測"], 2],
    ["（イ）C．キャピタルゲイン還元", ["影響", "計測", "経営対応"], 2],
    ["（イ）健全性・公平性・合理的期待の総合判断", ["目的", "経営対応"], 1]
  ],
  "14": [
    ["（ア）経済価値ベース保険負債評価の概要と法定会計との差", ["目的", "計測"], 1],
    ["（イ）死亡率前提上昇の影響", ["変化", "影響"], 1],
    ["（イ）解約率前提上昇の影響", ["変化", "影響"], 1],
    ["（ウ）A．経済価値評価の意義と留意点", ["目的", "計測"], 2],
    ["（ウ）B．非経済前提の設定方法と留意点", ["変化", "計測"], 2],
    ["（ウ）C．前提・モデル・結果の妥当性向上と理解促進", ["計測", "経営対応"], 2]
  ],
  "15": [
    ["（ア）内部管理会計の意義と必要性", ["目的", "計測"], 1],
    ["（イ）新商品発売当初の費差損益", ["変化", "影響"], 1],
    ["（イ）新商品発売当初の責任準備金関係損益", ["変化", "影響"], 1],
    ["（ウ）A．新商品を区分経理する意義", ["目的", "経営対応"], 2],
    ["（ウ）B．損益把握上の留意点", ["影響", "計測"], 2],
    ["（ウ）C．チャネル・商品間の相乗効果の評価", ["変化", "計測", "経営対応"], 2]
  ],
  "16": [
    ["（ア）ストレステストの意義・目的", ["目的", "計測"], 1],
    ["（イ）A．商品別・全社的な主要リスク", ["変化", "影響"], 2],
    ["（イ）B．ストレスシナリオの設定", ["変化", "計測"], 2],
    ["（イ）C．テスト結果の活用方法", ["経営対応"], 2]
  ]
};

function normalizeFramework(text) {
  const buckets = Object.fromEntries(FRAMEWORK_ORDER.map((key) => [key, []]));
  let current = null;
  let prefix = "";
  let recognized = false;

  String(text || "").split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;
    const alias = HEADING_ALIASES[line];
    if (alias) {
      current = alias.key;
      prefix = alias.prefix || "";
      recognized = true;
      return;
    }
    if (current) buckets[current].push(`${prefix}${line}`);
  });

  if (!recognized) return String(text || "");
  return FRAMEWORK_ORDER
    .filter((key) => buckets[key].length)
    .map((key) => `【${key}】\n${buckets[key].join("\n")}`)
    .join("\n\n");
}

function RichText({ text }) {
  const lines = String(text || "").split("\n");
  const elements = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    elements.push(<p key={`p-${elements.length}`}>{paragraph.join(" ")}</p>);
    paragraph = [];
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      return;
    }
    if (/^(【.+】|■.+|[①-⑩].+)/.test(line)) {
      flushParagraph();
      elements.push(<h3 key={`h-${index}`}>{line}</h3>);
      return;
    }
    if (/^[-・]/.test(line)) {
      flushParagraph();
      elements.push(<p className={styles.bullet} key={`b-${index}`}>{line.replace(/^[-・]\s*/, "")}</p>);
      return;
    }
    paragraph.push(line);
  });
  flushParagraph();

  return <div className={styles.text}>{elements}</div>;
}

function splitAtSentenceBoundary(text) {
  const sentences = String(text).match(/[^。！？]+[。！？]?/g)?.map((part) => part.trim()).filter(Boolean) || [];
  if (sentences.length >= 2) {
    const midpoint = Math.ceil(sentences.length / 2);
    return [sentences.slice(0, midpoint).join(""), sentences.slice(midpoint).join("")];
  }

  const commaPositions = [...String(text).matchAll(/、/g)].map((match) => match.index + 1);
  if (commaPositions.length) {
    const center = text.length / 2;
    const cut = commaPositions.reduce((best, value) => (
      Math.abs(value - center) < Math.abs(best - center) ? value : best
    ), commaPositions[0]);
    return [text.slice(0, cut).trim(), text.slice(cut).trim()].filter(Boolean);
  }

  if (text.length >= 80) {
    const cut = Math.floor(text.length / 2);
    return [text.slice(0, cut).trim(), text.slice(cut).trim()].filter(Boolean);
  }
  return [text];
}

function answerUnits(text, minimumCount) {
  const units = String(text || "").split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);

  while (units.length < minimumCount) {
    let candidateIndex = -1;
    let candidateParts = null;

    units.forEach((unit, index) => {
      const parts = splitAtSentenceBoundary(unit);
      if (parts.length < 2) return;
      if (candidateIndex < 0 || unit.length > units[candidateIndex].length) {
        candidateIndex = index;
        candidateParts = parts;
      }
    });

    if (candidateIndex < 0) break;
    units.splice(candidateIndex, 1, ...candidateParts);
  }
  return units;
}

function allocateUnits(units, sections) {
  const remaining = [...units];
  let remainingWeight = sections.reduce((total, section) => total + (section[2] || 1), 0);

  return sections.map((section, index) => {
    if (index === sections.length - 1) return remaining.splice(0);

    const weight = section[2] || 1;
    const sectionsAfter = sections.length - index - 1;
    const proportional = Math.round(remaining.length * weight / remainingWeight);
    const count = Math.max(1, Math.min(proportional, remaining.length - sectionsAfter));
    remainingWeight -= weight;
    return remaining.splice(0, count);
  });
}

function StructuredAnswer({ row }) {
  const sections = ANSWER_STRUCTURES[String(row.id)] || [
    ["問題文に沿った答案", ["目的", "変化", "影響", "計測", "経営対応"], 1],
  ];
  const units = answerUnits(row.合格レベル答案, sections.length);
  const groups = allocateUnits(units, sections);

  return (
    <div className={styles.text}>
      {sections.map(([title, framework], index) => (
        <div key={`${row.id}-${title}`}>
          <h3>{title}</h3>
          <p><strong>【フレームワーク：{framework.join("・")}】</strong></p>
          {groups[index].map((paragraph, paragraphIndex) => (
            <p key={`${row.id}-${index}-${paragraphIndex}`}>{paragraph}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ShokenAnswerView({ row }) {
  return (
    <div className={styles.answerView}>
      <section className={styles.section}>
        <h2>① フレームワークを用いた論点整理</h2>
        <RichText text={normalizeFramework(row.フレームワークを用いた論点整理)} />
      </section>
      <section className={styles.section}>
        <div className={styles.answerHeading}>
          <h2>② 合格レベル答案</h2>
          <span>問題文の指定順序を優先し、フレームワークとの対応を表示</span>
        </div>
        <StructuredAnswer row={row} />
      </section>
    </div>
  );
}
