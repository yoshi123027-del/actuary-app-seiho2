export const FREQUENCY_PERIOD = "2018–2025年度";
export const FREQUENCY_TOTAL_YEARS = 8;

const topic = (label, years, terms) => ({
  label,
  years,
  terms: [...new Set(terms)].sort((left, right) => right.length - left.length),
  level: years.length >= 6 ? "must" : "frequent",
});

// 日本アクチュアリー会の2018～2025年度「生保2」問題・模範解答を年度横断で検索し、
// 4年度以上で確認できた論点だけを表示対象とする。
export const FREQUENCY_TOPICS = [
  topic("健全性・ソルベンシー", [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], ["ソルベンシー・マージン", "財務健全性", "必要資本", "自己資本", "ソルベンシー", "健全性"]),
  topic("法定会計・内部管理会計", [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], ["内部管理会計", "経済価値評価", "法定会計", "将来収支", "経済価値", "EV"]),
  topic("利源分析・区分経理", [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], ["責任準備金関係損益", "商品区分", "資産区分", "区分経理", "利源分析", "費差損益", "利差損益", "死差損益"]),
  topic("感応度分析・ストレステスト", [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], ["リバースストレス", "ストレステスト", "複合ストレス", "感応度分析", "ストレス後", "感応度"]),
  topic("ALM・流動性", [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], ["流動性バッファー", "資産負債管理", "デュレーション", "再投資リスク", "流動性", "ALM"]),
  topic("責任準備金・基礎率", [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], ["標準責任準備金", "責任準備金", "計算基礎率", "予定利率", "基礎率"]),
  topic("事業費管理", [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], ["コストドライバー", "予定事業費", "実際事業費", "単位原価", "費差損益", "事業費"]),
  topic("再保険・ヘッジ", [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], ["再保険", "ヘッジ"]),
  topic("契約者保護・公平性", [2018, 2019, 2020, 2021, 2023, 2024, 2025], ["契約者間の公平性", "契約者間公平", "世代間公平", "契約者保護", "公平性"]),
  topic("事後モニタリング・経営対応", [2018, 2019, 2020, 2021, 2022, 2023, 2025], ["事後モニタリング", "モニタリング", "経営施策", "経営判断へ反映", "計画対実績"]),
  topic("ERM・ガバナンス", [2018, 2021, 2022, 2025], ["リスクアペタイト", "リスク限度額", "ガバナンス", "リスク限度", "ERM"]),
];

export function frequentTopicsFor(text) {
  const source = String(text || "");
  return FREQUENCY_TOPICS
    .filter((item) => item.terms.some((term) => source.includes(term)))
    .sort((left, right) => right.years.length - left.years.length || left.label.localeCompare(right.label, "ja"));
}

export function primaryFrequencyFor(text) {
  const matches = frequentTopicsFor(text);
  if (!matches.length) return null;
  return { ...matches[0], matches };
}

export function frequentTermsFor(text, topics) {
  const source = String(text || "");
  return [...new Set((topics || []).flatMap((item) => item.terms))]
    .filter((term) => source.includes(term))
    .sort((left, right) => right.length - left.length);
}
