import baseAnswers from "./shoken-answers.mjs";
import outlines from "./shoken-answer-outline.mjs";
import officialPoints, { BANKS } from "./shoken-official-points.mjs";

function clean(value) {
  return String(value || "").replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
}

function sentenceUnits(text) {
  return (clean(text).match(/[^。！？\n]+[。！？]?/gu) || [])
    .map((part) => part.trim())
    .filter((part) => part.length >= 12 && part !== "分析や指標の計算は目的ではない。");
}

function keywordsFor(group) {
  return [group.title, ...group.middles.flatMap((middle) => [middle.title, ...middle.keywords])];
}

function keywordScore(text, keywords) {
  return keywords.reduce((score, keyword) => {
    const normalized = clean(keyword).replace(/^（\d+）/u, "");
    return score + (normalized.length >= 2 && text.includes(normalized) ? Math.min(normalized.length, 12) : 0);
  }, 0);
}

function assignBaseSentences(sentences, groups) {
  const assigned = groups.map(() => []);
  sentences.forEach((text, order) => {
    const scores = groups.map((group) => keywordScore(text, keywordsFor(group)));
    const best = Math.max(...scores);
    const target = best > 0
      ? scores.indexOf(best)
      : Math.min(groups.length - 1, Math.floor((order * groups.length) / Math.max(1, sentences.length)));
    assigned[target].push({ text, source: "base", order });
  });
  return assigned;
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = clean(item.text).replace(/[、。！？・]/gu, "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const SUPPLEMENT_BANKS = {
  "1": [["economicValue", "governance"], ["modelData"]],
  "2": [["economicValue"], ["modelData"], ["stressDesign"], ["stressUse"]],
  "3": [["profitSource"], ["solvencyCore"], [], ["ermResponse"], []],
  "4": [["reserveAssumptions"], ["modelData"], ["stressDesign"], ["solvencyCore"]],
  "5": [["profitSource"], ["internalAccounting"], ["solvencyCore"], ["modelData"]],
  "6": [["reserveAssumptions"], ["modelData"], ["ermResponse"], ["almLiquidity"]],
  "7": [["modelData"], ["internalAccounting"], ["stressDesign"], ["ermResponse"]],
  "8": [["reserveAssumptions"], ["profitSource"], ["stressDesign"]],
  "9": [["modelData"], ["internalAccounting"], ["ermResponse"]],
  "10": [["modelData"], ["stressUse"], ["governance"]],
  "11": [["modelData"], ["stressDesign"], ["synergy"]],
  "12": [["modelData"], ["economicValue"], ["stressDesign"]],
  "13": [["profitSource"], ["reserveAssumptions"], ["modelData"], ["stressUse"]],
  "14": [["internalAccounting"], ["reserveAssumptions"], ["ermResponse"]],
  "15": [["solvencyCore"], ["expenseManagement"], ["governance"]],
  "16": [["solvencyCore", "reserveAssumptions"], ["governance", "modelData"], ["almLiquidity", "profitSource"]],
};

function supplementPoints(id, groupIndex, existing) {
  const used = new Set(existing.map((text) => clean(text)));
  return (SUPPLEMENT_BANKS[id]?.[groupIndex] || [])
    .flatMap((bank) => BANKS[bank] || [])
    .filter((text) => !used.has(clean(text)));
}

function organizeMiddles(items, definitions) {
  const buckets = definitions.map(() => []);
  items.forEach((item, order) => {
    const scores = definitions.map((definition) => keywordScore(item.text, [definition.title, ...definition.keywords]));
    const best = Math.max(...scores);
    const target = best > 0
      ? scores.indexOf(best)
      : Math.min(definitions.length - 1, Math.floor((order * definitions.length) / Math.max(1, items.length)));
    buckets[target].push({ ...item, order, fit: scores[target] });
  });

  const minimumItems = 2;
  buckets.forEach((bucket, target) => {
    while (bucket.length < minimumItems) {
    let donor = -1;
    let donorItem = -1;
    let donorFit = -1;
    buckets.forEach((candidate, candidateIndex) => {
      if (candidate.length <= minimumItems) return;
      candidate.forEach((item, itemIndex) => {
        const fit = keywordScore(item.text, [definitions[target].title, ...definitions[target].keywords]);
        if (fit > donorFit) {
          donor = candidateIndex;
          donorItem = itemIndex;
          donorFit = fit;
        }
      });
    });
    if (donor < 0) throw new Error(`中項目「${definitions[target].title}」へ十分な論点を割り当てられません。`);
    bucket.push(buckets[donor].splice(donorItem, 1)[0]);
    }
  });

  return definitions.map((definition, index) => ({
    title: definition.title,
    bullets: buckets[index].sort((left, right) => left.order - right.order),
  }));
}

function essayLength(groups) {
  return groups.flatMap((group) => group.subgroups)
    .flatMap((subgroup) => subgroup.bullets)
    .reduce((sum, item) => sum + item.text.length, 0);
}

function capEssay(groups, limit = 3500) {
  while (essayLength(groups) > limit) {
    const removable = groups.flatMap((group, groupIndex) => group.subgroups.flatMap((subgroup, subgroupIndex) => (
      subgroup.bullets.length <= 2
        ? []
        : subgroup.bullets.map((item, itemIndex) => ({ item, groupIndex, subgroupIndex, itemIndex }))
    ))).sort((left, right) => {
      if (left.item.source !== right.item.source) return left.item.source === "base" ? -1 : 1;
      if (left.item.fit !== right.item.fit) return left.item.fit - right.item.fit;
      return right.item.text.length - left.item.text.length;
    });
    const target = removable[0];
    if (!target) break;
    groups[target.groupIndex].subgroups[target.subgroupIndex].bullets.splice(target.itemIndex, 1);
  }
}

const result = {};

for (const [id, base] of Object.entries(baseAnswers)) {
  const outline = outlines[id];
  const additions = officialPoints[id];
  if (!outline || !additions || outline.groups.length !== additions.length) {
    throw new Error(`所見答案 ${id} の構成または公式論点が不足しています。`);
  }

  const baseByGroup = assignBaseSentences(sentenceUnits(base.合格レベル答案), outline.groups);
  const groups = outline.groups.map((group, groupIndex) => {
    const supplemental = supplementPoints(id, groupIndex, additions[groupIndex]);
    const items = uniqueItems([
      ...baseByGroup[groupIndex],
      ...additions[groupIndex].map((text, order) => ({ text: clean(text), source: "official", order: 1000 + order })),
      ...supplemental.map((text, order) => ({ text: clean(text), source: "official", order: 2000 + order })),
    ]);
    return {
      title: group.title,
      subgroups: organizeMiddles(items, group.middles),
    };
  });

  capEssay(groups);
  const characters = essayLength(groups);
  if (characters < 2700) throw new Error(`所見答案 ${id} が2,700字未満です: ${characters}字`);
  if (groups.some((group) => group.subgroups.some((subgroup) => !subgroup.bullets.length))) {
    throw new Error(`所見答案 ${id} に空の中項目があります。`);
  }

  const essayGroups = groups.map((group) => ({
    title: group.title,
    subgroups: group.subgroups.map((subgroup) => ({
      title: subgroup.title,
      bullets: subgroup.bullets.map((item) => item.text),
    })),
  }));
  const shortAnswers = outline.shortAnswers;
  result[id] = {
    ...base,
    短答: shortAnswers,
    論文式答案: essayGroups,
    合格レベル答案: [
      ...shortAnswers.map((answer) => `【${answer.title}】\n${answer.text}`),
      ...essayGroups.flatMap((group) => [
        `【${group.title}】`,
        ...group.subgroups.flatMap((subgroup) => [
          `〔${subgroup.title}〕`,
          ...subgroup.bullets,
        ]),
      ]),
    ].join("\n\n"),
  };
}

export default result;
