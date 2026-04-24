import { useState } from "react";
import { useUrlState } from "@state";
import { useTheme } from "../context/useTheme";
import { useFont } from "../context/useFont";
import BubbleBackground from "../components/BubbleBackground";

interface DiaryPage {
  id: number;
  date: string;
  title: string;
  image: string | null;
  description: string;
}

const TAB_KEYS  = ["diary-tab-0", "diary-tab-1", "diary-tab-2"];
const TAB_ICONS = ["📒", "🌟", "💭"];

const makeDefaultPages = (n: number): DiaryPage[] =>
  Array.from({ length: n }, (_, i) => ({
    id: Date.now() + i,
    date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
    title: `Entry ${String(i + 1).padStart(3, "0")}`,
    image: null,
    description: "",
  }));

const initAllTabs = (): DiaryPage[][] =>
  TAB_KEYS.map((key, idx) => {
    try {
      if (idx === 0 && !localStorage.getItem(key)) {
        const legacy = localStorage.getItem("diary-pages");
        if (legacy) { localStorage.setItem(key, legacy); return JSON.parse(legacy); }
      }
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return makeDefaultPages(idx === 0 ? 4 : 2);
  });

export default function Diary() {
  const { isDark, toggleTheme } = useTheme();
  const { isCustomFont, toggleFont } = useFont();

  const [allPages, setAllPages] = useState<DiaryPage[][]>(initAllTabs);
  const [activeTab, setActiveTab] = useUrlState("tab", 0);
  const [spreads, setSpreads]     = useState([0, 0, 0]);
  const [flipping, setFlipping]   = useState(false);
  const [flipDir, setFlipDir]     = useState<"next" | "prev">("next");

  const pages        = allPages[activeTab];
  const spread       = spreads[activeTab];
  const totalSpreads = Math.ceil(pages.length / 2);
  const leftIdx      = spread * 2;
  const rightIdx     = spread * 2 + 1;
  const leftPage     = pages[leftIdx]  ?? null;
  const rightPage    = pages[rightIdx] ?? null;

  const setSpread = (s: number) => {
    const next = [...spreads];
    next[activeTab] = s;
    setSpreads(next);
  };

  const switchTab = (tab: number) => {
    if (tab === activeTab) return;
    setFlipping(false);
    setActiveTab(tab);
  };

  const flip = (dir: "next" | "prev") => {
    if (flipping) return;
    if (dir === "next" && spread >= totalSpreads - 1) return;
    if (dir === "prev" && spread <= 0) return;
    setFlipDir(dir);
    setFlipping(true);
    setTimeout(() => setSpread(spread + (dir === "next" ? 1 : -1)), 320);
    setTimeout(() => setFlipping(false), 700);
  };

  const addPage = () => {
    const newPage: DiaryPage = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      title: `Entry ${String(pages.length + 1).padStart(3, "0")}`,
      image: null,
      description: "",
    };
    const updated = [...pages, newPage];
    const next = [...allPages];
    next[activeTab] = updated;
    setAllPages(next);
    localStorage.setItem(TAB_KEYS[activeTab], JSON.stringify(updated));
    const newTotalSpreads = Math.ceil(updated.length / 2);
    if (newTotalSpreads > totalSpreads) {
      setFlipDir("next");
      setFlipping(true);
      setTimeout(() => setSpread(newTotalSpreads - 1), 320);
      setTimeout(() => setFlipping(false), 700);
    }
  };

  const renderLeftPage = (page: DiaryPage | null, pageNum: number) => {
    if (!page) {
      return (
        <div className="diary-page diary-page-left">
          <div className="diary-corner diary-corner-tl" />
          <div className="diary-corner diary-corner-tr" />
          <div className="diary-corner diary-corner-bl" />
          <div className="diary-corner diary-corner-br" />
          <div className="diary-page-blank"><span className="diary-blank-text">BLANK</span></div>
          <div className="diary-page-foot"><span className="diary-page-num">— {pageNum} —</span></div>
        </div>
      );
    }

    return (
      <div className="diary-page diary-page-left">
        <div className="diary-corner diary-corner-tl" />
        <div className="diary-corner diary-corner-tr" />
        <div className="diary-corner diary-corner-bl" />
        <div className="diary-corner diary-corner-br" />

        <div className="diary-scroll-banner">
          <span className="diary-scroll-title-text">{page.title}</span>
        </div>

        <div className="diary-img-book">
          <div className="diary-img-bracket diary-img-bracket-tl" />
          <div className="diary-img-bracket diary-img-bracket-tr" />
          <div className="diary-img-bracket diary-img-bracket-bl" />
          <div className="diary-img-bracket diary-img-bracket-br" />
          {page.image ? (
            <img src={page.image} alt="entry" className="diary-photo" />
          ) : (
            <div className="diary-img-placeholder">
              <span className="diary-img-ph-icon">✦</span>
              <span className="diary-img-ph-hint">No image</span>
            </div>
          )}
        </div>

        <div className="diary-left-desc">
          <p className={`diary-text${!page.description ? " diary-text--empty" : ""}`}>
            {page.description || "No entry written yet..."}
          </p>
        </div>

        <div className="diary-page-foot">
          <span className="diary-page-num">— {pageNum} —</span>
        </div>
      </div>
    );
  };

  const renderRightPage = (page: DiaryPage | null, pageNum: number) => {
    if (!page) {
      return (
        <div className="diary-page diary-page-right">
          <div className="diary-corner diary-corner-tl" />
          <div className="diary-corner diary-corner-tr" />
          <div className="diary-corner diary-corner-bl" />
          <div className="diary-corner diary-corner-br" />
          <div className="diary-page-blank"><span className="diary-blank-text">BLANK</span></div>
          <div className="diary-page-foot"><span className="diary-page-num">— {pageNum} —</span></div>
        </div>
      );
    }

    return (
      <div className="diary-page diary-page-right">
        <div className="diary-corner diary-corner-tl" />
        <div className="diary-corner diary-corner-tr" />
        <div className="diary-corner diary-corner-bl" />
        <div className="diary-corner diary-corner-br" />

        <div className="diary-badges">
          <div className="diary-badge">
            <div className="diary-badge-circle">📅</div>
            <span className="diary-badge-label">{page.date}</span>
          </div>
          <div className="diary-badge">
            <div className="diary-badge-circle">✦</div>
            <span className="diary-badge-label">Entry {pageNum}</span>
          </div>
          <div className="diary-badge">
            <div className="diary-badge-circle">📖</div>
            <span className="diary-badge-label">Personal</span>
          </div>
        </div>

        <div className="diary-sep" />

        <div className="diary-right-body">
          <div className="diary-right-img-col">
            <div className="diary-img-small">
              {page.image ? (
                <img src={page.image} alt="entry" className="diary-photo" />
              ) : (
                <div className="diary-img-placeholder">
                  <span className="diary-img-ph-icon diary-img-ph-icon--sm">✦</span>
                </div>
              )}
            </div>
            <span className="diary-img-label">{page.title}</span>
          </div>

          <div className="diary-right-text-col">
            <div className="diary-steps">
              {page.description
                ? page.description.split("\n").filter(Boolean).map((line, i) => (
                    <p key={i} className="diary-step">{i + 1}. {line}</p>
                  ))
                : <p className="diary-step diary-text--empty">No entry written yet...</p>
              }
            </div>
          </div>
        </div>

        <div className="diary-page-foot">
          <span className="diary-page-num">— {pageNum} —</span>
        </div>
      </div>
    );
  };

  return (
    <div className="diary-root">
      <BubbleBackground />
      <div className="fixed inset-0 bg-neon-grid z-0 pointer-events-none" />
      <div className="scanlines-overlay" />

      <div className="diary-controls">
        <button className="diary-ctrl-btn" onClick={toggleFont} title={isCustomFont ? "Default Font" : "Custom Font"}>
          Aa
        </button>
        <button className="diary-ctrl-btn" onClick={toggleTheme} title={isDark ? "Light Mode" : "Dark Mode"}>
          {isDark ? "☀" : "☾"}
        </button>
      </div>

      <div className="diary-book-outer">
        <div className="diary-strap diary-strap-left"><div className="diary-strap-clasp" /></div>
        <div className="diary-strap diary-strap-right"><div className="diary-strap-clasp" /></div>

        <div className="diary-tabs">
          {TAB_ICONS.map((icon, i) => (
            <button
              key={i}
              className={`diary-tab diary-tab--${i}${activeTab === i ? " diary-tab--active" : ""}`}
              onClick={() => switchTab(i)}
              title={`Tab ${i + 1}`}
            >
              <span className="diary-tab-icon">{icon}</span>
            </button>
          ))}
        </div>

        <div className={`diary-book${flipping ? ` diary-flip-${flipDir}` : ""}`}>
          {renderLeftPage(leftPage, leftIdx + 1)}

          <div className="diary-spine">
            <div className="diary-spine-medallion">✦</div>
            <span className="diary-spine-label">DIARY</span>
          </div>

          {renderRightPage(rightPage, rightIdx + 1)}
        </div>
      </div>

      <nav className="diary-nav">
        <button className="diary-nav-btn" onClick={() => flip("prev")} disabled={spread === 0 || flipping}>
          ◀ Prev Page
        </button>
        <span className="diary-nav-counter">{spread + 1} / {totalSpreads}</span>
        <button className="diary-nav-btn" onClick={() => flip("next")} disabled={spread >= totalSpreads - 1 || flipping}>
          Next Page ▶
        </button>
        <button className="diary-add-btn" onClick={addPage}>＋ New Entry</button>
      </nav>
    </div>
  );
}
