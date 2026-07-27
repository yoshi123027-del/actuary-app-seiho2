import styles from "./ShokenAnswerView.module.css";

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

export default function ShokenAnswerView({ row }) {
  return (
    <div className={styles.answerView}>
      <section className={styles.section}>
        <h2>① フレームワークを用いた論点整理</h2>
        <RichText text={row.フレームワークを用いた論点整理} />
      </section>
      <section className={styles.section}>
        <div className={styles.answerHeading}>
          <h2>② 合格レベル答案</h2>
          <span>公式解答例の論点を基礎に再構成</span>
        </div>
        <RichText text={row.合格レベル答案} />
      </section>
    </div>
  );
}
