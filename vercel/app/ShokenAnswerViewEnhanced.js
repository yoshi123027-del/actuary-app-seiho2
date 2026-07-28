import styles from "./ShokenAnswerView.module.css";

const ORDER = ["目的", "変化", "影響", "計測", "経営対応"];
const KEYS = {
  目的: ["目的", "意義", "契約者保護", "健全性", "公平", "収益性", "経営"],
  変化: ["変化", "導入", "新商品", "金利", "インフレ", "競争", "制度", "環境", "リスクプロファイル"],
  影響: ["影響", "損益", "利益", "責任準備金", "自己資本", "経済価値", "流動性", "配当", "費差", "利差"],
  計測: ["計測", "評価", "分析", "検証", "前提", "モデル", "シナリオ", "ストレス", "利源", "EV", "ALM"],
  経営対応: ["対応", "活用", "管理", "商品", "料率", "販売", "再保険", "ヘッジ", "資本", "配当", "モニタリング", "回復計画"],
};
const FRAMEWORK_GUIDE = {
  目的: "何のための制度・分析・管理か。",
  変化: "商品、環境、制度、契約者行動の何が変わるか。",
  影響: "損益、健全性、経済価値、流動性へどう効くか。",
  計測: "どの指標・分析・シナリオで確認するか。",
  経営対応: "結果を商品、資産、資本、販売、配当へどう反映するか。",
};

const STRUCTURES = {
  "1": { essayStart: 1, sections: [
    ["① 生命保険会計の意義および特徴", ["目的"], 1],
    ["② 現行法定会計と内部管理会計の役割分担", ["目的", "計測"], 2],
    ["② 価値基準会計等による期間損益・企業価値の把握", ["影響", "計測"], 1],
    ["② 国際的に統一された会計基準を導入する意義と留意点", ["変化", "影響"], 2],
    ["② アクチュアリーの役割と経営への反映", ["計測", "経営対応"], 1],
  ]},
  "2": { essayStart: 2, sections: [
    ["① 静的なソルベンシー検証", ["計測"], 1],
    ["① 動的なソルベンシー検証", ["計測"], 1],
    ["② ソルベンシー評価の意義", ["目的"], 1],
    ["② 適切な責任準備金評価", ["影響", "計測"], 1],
    ["② 通常予測を超えるリスクへの財務上の備え", ["影響", "経営対応"], 1],
    ["② ERM・グローバル展開を踏まえた総合評価", ["変化", "計測"], 2],
    ["② 評価結果を具体的な経営行動へつなげる方法", ["経営対応"], 1],
  ]},
  "3": { essayStart: 3, sections: [
    ["① 契約者配当の四原則", ["目的"], 1],
    ["② 利源別配当方式", ["計測"], 1],
    ["② アセットシェア方式", ["計測"], 1],
    ["③ A．商品特性の相違を踏まえた配当", ["変化", "影響"], 2],
    ["③ B．金利低下傾向における取扱い", ["変化", "影響"], 1],
    ["③ C．基礎率改定時の新旧契約間調整", ["影響", "経営対応"], 2],
    ["③ D．発売後年数が短い医療保険の配当率", ["計測", "経営対応"], 1],
    ["③ 公正・衡平な配当の総合判断", ["目的", "経営対応"], 1],
  ]},
  "4": { essayStart: 2, sections: [
    ["① 利源枠・純保枠のメリットとデメリット", ["計測"], 1],
    ["② EVの意義・考え方・特徴", ["計測"], 1],
    ["③ A．純損失の要因および今後の見通し", ["変化", "影響"], 2],
    ["③ B．事業費管理のあり方", ["影響", "経営対応"], 1],
    ["③ C．単年度収支・将来収支・EVの留意点", ["計測"], 2],
    ["③ D．具体的な収益管理手法の提案", ["経営対応"], 2],
  ]},
  "5": { essayStart: 2, sections: [
    ["① 区分経理の意義", ["目的"], 1],
    ["② 新商品について新区分を設ける理由", ["変化", "影響"], 1],
    ["③ A．区分ごとの損益把握方法", ["計測"], 2],
    ["③ B．全社区分との関係", ["影響", "経営対応"], 1],
    ["③ C．区分ごとのリスク管理", ["計測", "経営対応"], 2],
    ["③ 契約者間公平とセルフサポートの総合判断", ["目的", "経営対応"], 1],
  ]},
  "6": { essayStart: 1, sections: [
    ["① VaRのデメリットとストレステストの意義・目的", ["目的", "計測"], 1],
    ["② A．パンデミックシナリオの設定方法", ["変化", "計測"], 2],
    ["② B．ストレステストにおける確認項目", ["影響", "計測"], 1],
    ["② C．パンデミックが確認項目に与える影響", ["変化", "影響"], 2],
    ["② D．テスト結果の活用方法", ["経営対応"], 2],
  ]},
  "7": { essayStart: 2, sections: [
    ["① 責任準備金の長期性による特徴・基礎率の評価性", ["目的", "影響"], 1],
    ["② ロックイン方式のデメリットを補完する現行制度", ["計測"], 1],
    ["③ A．ロックフリー方式における計算基礎率の設定", ["変化", "計測"], 2],
    ["③ B．資産評価・収益管理", ["影響", "計測"], 2],
    ["③ C．ソルベンシー管理", ["影響", "経営対応"], 2],
    ["③ 導入時のガバナンスと移行管理", ["計測", "経営対応"], 1],
  ]},
  "8": { essayStart: 2, sections: [
    ["① リスク管理プロセスの六段階", ["計測"], 1],
    ["① 回避・受容・軽減・移転の四カテゴリー", ["経営対応"], 1],
    ["② A．医療保険販売によるリスクプロファイルの変化", ["変化", "影響"], 2],
    ["② B．変化したリスクへの対応", ["計測", "経営対応"], 2],
    ["② C．リスク管理高度化のための検討事項", ["計測", "経営対応"], 2],
  ]},
  "9": { essayStart: 3, sections: [
    ["（ア）利源分析の意義", ["目的", "計測"], 1],
    ["（イ）予定利息の内容と役割", ["計測"], 1],
    ["（イ）解約・失効契約の消滅時保険料積立金", ["計測"], 1],
    ["（ウ）A．医療保険の特性を踏まえた利源分析", ["変化", "影響"], 2],
    ["（ウ）B．追加責任準備金の利源分析上の取扱い", ["影響", "計測"], 2],
    ["（ウ）分析結果の内部管理・経営施策への活用", ["経営対応"], 1],
  ]},
  "10": { essayStart: 3, sections: [
    ["（ア）ソルベンシー評価の意義", ["目的"], 1],
    ["（イ）経済価値ベース評価のメリット", ["計測"], 1],
    ["（イ）経済価値ベース評価のデメリット", ["計測"], 1],
    ["（ウ）A．内部管理目的でのソルベンシー評価", ["目的", "計測"], 2],
    ["（ウ）B．健全性確保の方策とリスク管理", ["影響", "経営対応"], 2],
    ["（ウ）C．収益性向上への活用", ["計測", "経営対応"], 2],
  ]},
  "11": { essayStart: 2, sections: [
    ["（ア）予定事業費枠の意義と役割", ["目的", "計測"], 1],
    ["（イ）商品別原価計算の目的と概要", ["計測"], 1],
    ["（ウ）A．事業費・事業費効率を把握する一般論", ["影響", "計測"], 2],
    ["（ウ）B．インフレ率上昇を踏まえた留意点", ["変化", "影響"], 2],
    ["（ウ）C．IT投資等の経営政策上の留意点", ["計測", "経営対応"], 2],
  ]},
  "12": { essayStart: 2, sections: [
    ["（ア）金利リスク以外の三つの市場リスク", ["影響"], 1],
    ["（イ）流動性リスクと潜在的要因", ["影響", "計測"], 1],
    ["（ウ）A．考慮すべき保険契約者のオプション", ["変化", "影響"], 2],
    ["（ウ）B．資産ポートフォリオ・運用方針", ["計測", "経営対応"], 2],
    ["（ウ）C．流動性管理と継続的リスク管理", ["計測", "経営対応"], 2],
  ]},
  "13": { essayStart: 1, sections: [
    ["（ア）契約者配当を行う理由", ["目的"], 1],
    ["（イ）A．商品特性の相違を踏まえた配当", ["変化", "影響"], 2],
    ["（イ）B．新旧予定利率契約の利差配当水準", ["変化", "計測"], 2],
    ["（イ）C．キャピタルゲイン還元", ["影響", "経営対応"], 2],
    ["（イ）健全性・公平性・合理的期待の総合判断", ["目的", "経営対応"], 1],
  ]},
  "14": { essayStart: 3, sections: [
    ["（ア）経済価値ベース保険負債評価の概要と法定会計との差", ["目的", "計測"], 1],
    ["（イ）死亡率前提上昇の影響", ["変化", "影響"], 1],
    ["（イ）解約率前提上昇の影響", ["変化", "影響"], 1],
    ["（ウ）A．経済価値評価の意義と留意点", ["目的", "計測"], 2],
    ["（ウ）B．非経済前提の設定方法と留意点", ["変化", "計測"], 2],
    ["（ウ）C．前提・モデル・結果の妥当性向上と理解促進", ["計測", "経営対応"], 2],
  ]},
  "15": { essayStart: 3, sections: [
    ["（ア）内部管理会計の意義と必要性", ["目的", "計測"], 1],
    ["（イ）新商品発売当初の費差損益", ["変化", "影響"], 1],
    ["（イ）新商品発売当初の責任準備金関係損益", ["変化", "影響"], 1],
    ["（ウ）A．新商品を区分経理する意義", ["目的", "経営対応"], 2],
    ["（ウ）B．損益把握上の留意点", ["影響", "計測"], 2],
    ["（ウ）C．チャネル・商品間の相乗効果の評価", ["変化", "経営対応"], 2],
  ]},
  "16": { essayStart: 1, sections: [
    ["（ア）ストレステストの意義・目的", ["目的", "計測"], 1],
    ["（イ）A．商品別・全社的な主要リスク", ["変化", "影響"], 2],
    ["（イ）B．ストレスシナリオの設定", ["変化", "計測"], 2],
    ["（イ）C．テスト結果の活用方法", ["経営対応"], 2],
  ]},
};

const sentences = (text) => String(text || "").replace(/\r/g, "")
  .split(/(?<=[。！？])|\n+/).map((x) => x.trim()).filter((x) => x.length >= 10);

const short = (text, n = 112) => {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  return value.length <= n ? value : `${value.slice(0, n).replace(/[、。\s]+$/, "")}…`;
};

function splitAtSentenceBoundary(text) {
  const list = sentences(text);
  if (list.length >= 2) {
    const midpoint = Math.ceil(list.length / 2);
    return [list.slice(0, midpoint).join(""), list.slice(midpoint).join("")];
  }
  if (String(text).length >= 100) {
    const cut = Math.floor(String(text).length / 2);
    return [String(text).slice(0, cut).trim(), String(text).slice(cut).trim()].filter(Boolean);
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

function allocateEssayUnits(units, sections, essayStart) {
  const remaining = [...units];
  const groups = [];
  for (let index = 0; index < essayStart; index += 1) {
    const requested = sections[index][2] || 1;
    const leave = Math.max(0, sections.length - index - 1);
    const count = Math.max(1, Math.min(requested, remaining.length - leave));
    groups.push(remaining.splice(0, count));
  }
  const essaySections = sections.slice(essayStart);
  let remainingWeight = essaySections.reduce((total, section) => total + (section[2] || 1), 0);
  essaySections.forEach((section, essayIndex) => {
    if (essayIndex === essaySections.length - 1) {
      groups.push(remaining.splice(0));
      return;
    }
    const weight = section[2] || 1;
    const sectionsAfter = essaySections.length - essayIndex - 1;
    const proportional = Math.round(remaining.length * weight / remainingWeight);
    const count = Math.max(1, Math.min(proportional, remaining.length - sectionsAfter));
    groups.push(remaining.splice(0, count));
    remainingWeight -= weight;
  });
  return groups;
}

function focusCategories(row) {
  const source = `${row.問題文 || ""}\n${row.合格レベル答案 || ""}`;
  return ORDER.map((name) => ({
    name,
    score: (KEYS[name] || []).reduce((sum, key) => sum + (source.includes(key) ? 1 : 0), 0),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.name);
}

function EssayFramework({ row }) {
  const focus = focusCategories(row);
  return <div className={styles.text}>
    <h3>論文式の思考フレーム</h3>
    <p><strong>{ORDER.join(" → ")}</strong></p>
    {focus.length > 0 && <p><strong>この問題の主軸：</strong>{focus.join("・")}</p>}
    {ORDER.map((name) => <p key={name}><strong>{name}：</strong>{FRAMEWORK_GUIDE[name]}</p>)}
    <p>問題文がA・B・C・D等の順序を指定している場合は、その順序を崩さず、各パートの中で上記の観点を用いて論点を広げる。</p>
  </div>;
}

function threePoints(parts, title) {
  const result = [];
  for (const text of sentences(parts.join("\n"))) {
    const value = short(text, 118);
    if (!result.includes(value)) result.push(value);
    if (result.length === 3) break;
  }
  const fallback = [
    `${title}について、問題文固有の前提と制度・数理上の原則を結び付ける。`,
    "法定損益・経済価値・健全性・流動性への影響を分けて示す。",
    "計測結果を具体的な経営対応へ接続し、限界と事後検証まで述べる。",
  ];
  for (const value of fallback) {
    if (result.length === 3) break;
    if (!result.includes(value)) result.push(value);
  }
  return result.slice(0, 3);
}

function StructuredAnswer({ row }) {
  const config = STRUCTURES[String(row.id)] || {
    essayStart: 0,
    sections: [["論文式答案", ORDER, 1]],
  };
  const shortUnits = config.sections.slice(0, config.essayStart)
    .reduce((total, section) => total + (section[2] || 1), 0);
  const minimumUnits = shortUnits + Math.max(1, config.sections.length - config.essayStart) * 2;
  const units = answerUnits(row.合格レベル答案, minimumUnits);
  const groups = allocateEssayUnits(units, config.sections, config.essayStart);

  return <div className={styles.text}>
    {config.sections.map(([title, framework], index) => {
      const isEssay = index >= config.essayStart;
      const body = groups[index] || [];
      return <div key={`${row.id}-${title}`}>
        {index === config.essayStart && <EssayFramework row={row} />}
        <h3>{title}</h3>
        {isEssay && <p><strong>【フレームワーク：{framework.join("・")}】</strong></p>}
        {isEssay && threePoints(body, title).map((point, pointIndex) => (
          <p className={styles.bullet} key={`${row.id}-${index}-point-${pointIndex}`}>
            <strong>論点{pointIndex + 1}</strong>　{point}
          </p>
        ))}
        {body.map((paragraph, paragraphIndex) => (
          <p key={`${row.id}-${index}-body-${paragraphIndex}`}>{paragraph}</p>
        ))}
      </div>;
    })}
  </div>;
}

export default function ShokenAnswerViewEnhanced({ row }) {
  return <div className={styles.answerView}>
    <section className={styles.section}>
      <div className={styles.answerHeading}>
        <h2>合格レベル答案</h2>
        <span>前半は模範解答、最後の高配点論文式のみフレームワークで展開</span>
      </div>
      <StructuredAnswer row={row} />
    </section>
  </div>;
}
