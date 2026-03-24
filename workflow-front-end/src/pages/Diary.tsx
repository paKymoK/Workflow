import { useState, useRef } from "react";

interface DiaryPage {
  id: number;
  date: string;
  title: string;
  image: string | null;
  description: string;
}

const initPages = (): DiaryPage[] => {
  try {
    const saved = localStorage.getItem("diary-pages");
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
    title: `ENTRY_${String(i + 1).padStart(3, "0")}`,
    image: null,
    description: "",
  }));
};

export default function Diary() {
  const [pages, setPages] = useState<DiaryPage[]>(initPages);
  const [spread, setSpread] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<"next" | "prev">("next");
  const [editing, setEditing] = useState<"left" | "right" | null>(null);
  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);

  const totalSpreads = Math.ceil(pages.length / 2);
  const leftIdx = spread * 2;
  const rightIdx = spread * 2 + 1;
  const leftPage = pages[leftIdx] ?? null;
  const rightPage = pages[rightIdx] ?? null;

  const savePages = (updated: DiaryPage[]) => {
    setPages(updated);
    localStorage.setItem("diary-pages", JSON.stringify(updated));
  };

  const flip = (dir: "next" | "prev") => {
    if (flipping) return;
    if (dir === "next" && spread >= totalSpreads - 1) return;
    if (dir === "prev" && spread <= 0) return;
    setFlipDir(dir);
    setFlipping(true);
    setEditing(null);
    setTimeout(() => setSpread((s) => s + (dir === "next" ? 1 : -1)), 320);
    setTimeout(() => setFlipping(false), 700);
  };

  const handleImage = (side: "left" | "right") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const idx = side === "left" ? leftIdx : rightIdx;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const updated = [...pages];
      updated[idx] = { ...updated[idx], image: ev.target?.result as string };
      savePages(updated);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDesc = (side: "left" | "right", val: string) => {
    const idx = side === "left" ? leftIdx : rightIdx;
    const updated = [...pages];
    updated[idx] = { ...updated[idx], description: val };
    savePages(updated);
  };

  const addPage = () => {
    const newPage: DiaryPage = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      title: `ENTRY_${String(pages.length + 1).padStart(3, "0")}`,
      image: null,
      description: "",
    };
    const updated = [...pages, newPage];
    savePages(updated);
    const newTotalSpreads = Math.ceil(updated.length / 2);
    if (newTotalSpreads > totalSpreads) {
      setFlipDir("next");
      setFlipping(true);
      setEditing(null);
      setTimeout(() => setSpread(newTotalSpreads - 1), 320);
      setTimeout(() => setFlipping(false), 700);
    }
  };

  const renderPage = (page: DiaryPage | null, side: "left" | "right", pageNum: number) => {
    const fileRef = side === "left" ? leftFileRef : rightFileRef;
    const isEditing = editing === side;

    if (!page) {
      return (
        <div className={`diary-page diary-page-${side}`}>
          <div className="diary-rules" />
          <div className="diary-page-blank">
            <span className="font-bebas text-[28px] tracking-[0.3em] text-[rgba(255,229,0,0.05)]">BLANK</span>
          </div>
        </div>
      );
    }

    return (
      <div className={`diary-page diary-page-${side}`}>
        <div className="diary-rules" />

        <div className="diary-page-head">
          <span className="font-mono-tech text-[10px] text-[var(--neon-cyan)] tracking-[0.12em]">{page.date}</span>
          <span className="font-bebas text-[18px] neon-text-yellow tracking-[0.12em] leading-none">{page.title}</span>
          <span className="font-mono-tech text-[9px] text-[rgba(240,240,240,0.22)] tracking-[0.08em]">#{String(pageNum).padStart(3, "0")}</span>
        </div>

        <div className="diary-sep" />

        <div className="diary-body">
          <div
            className={`diary-img-frame${isEditing ? " diary-img-frame--edit" : ""}`}
            onClick={() => isEditing && fileRef.current?.click()}
          >
            {page.image ? (
              <>
                <img src={page.image} alt="entry" className="diary-photo" />
                {isEditing && <div className="diary-img-overlay">CHANGE ◈</div>}
              </>
            ) : (
              <div className={`diary-img-empty${isEditing ? " diary-img-empty--edit" : ""}`}>
                <span className="diary-img-icon">◈</span>
                <span className="diary-img-hint">{isEditing ? "CLICK TO ADD" : "NO IMAGE"}</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage(side)} />

          <div className="diary-desc">
            {isEditing ? (
              <textarea
                autoFocus
                className="diary-textarea"
                value={page.description}
                onChange={(e) => handleDesc(side, e.target.value)}
                placeholder="// WRITE YOUR ENTRY HERE..."
              />
            ) : (
              <p className={`diary-text${!page.description ? " diary-text--empty" : ""}`}>
                {page.description || "// EMPTY ENTRY"}
              </p>
            )}
          </div>
        </div>

        <div className="diary-page-foot">
          <button className="diary-edit-btn" onClick={() => setEditing(isEditing ? null : side)}>
            {isEditing ? "◀ DONE" : "✎ EDIT"}
          </button>
          {side === "right" && <div className="diary-fold" />}
        </div>
      </div>
    );
  };

  return (
    <div className="diary-root">
      <div className="fixed inset-0 bg-neon-grid z-0 pointer-events-none" />
      <div className="scanlines-overlay" />

      <header className="diary-header">
        <span className="font-mono-tech text-[10px] text-[var(--neon-cyan)] tracking-[0.3em]">◈ PERSONAL LOG</span>
        <h1 className="font-bebas text-[clamp(28px,5vw,52px)] neon-text-yellow tracking-[0.25em] m-0 leading-none">
          DIARY
        </h1>
        <span className="font-mono-tech text-[10px] text-[rgba(240,240,240,0.3)] tracking-[0.2em]">
          // {pages.length} ENTRIES
        </span>
      </header>

      <div className="diary-perspective">
        <div className={`diary-book${flipping ? ` diary-flip-${flipDir}` : ""}`}>
          {renderPage(leftPage, "left", leftIdx + 1)}

          <div className="diary-spine">
            <span className="diary-spine-label">DIARY</span>
          </div>

          {renderPage(rightPage, "right", rightIdx + 1)}
        </div>
      </div>

      <nav className="diary-nav">
        <button className="diary-nav-btn" onClick={() => flip("prev")} disabled={spread === 0 || flipping}>
          ◀ PREV
        </button>
        <span className="font-mono-tech text-[11px] text-[rgba(240,240,240,0.35)] tracking-[0.2em]">
          {spread + 1} / {totalSpreads}
        </span>
        <button className="diary-nav-btn" onClick={() => flip("next")} disabled={spread >= totalSpreads - 1 || flipping}>
          NEXT ▶
        </button>
        <button className="diary-add-btn" onClick={addPage}>＋ NEW PAGE</button>
      </nav>
    </div>
  );
}
