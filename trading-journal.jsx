import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  PlusCircle,
  List,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Target,
  X,
  ImagePlus,
  Gauge,
} from "lucide-react";

const DIRECTIONS = ["Long", "Short"];
const SESSIONS = ["Asia", "London", "NY AM", "NY PM"];
const SYMBOLS = ["XAUUSD", "MGC", "MNQ"];

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const todayStr = () => new Date().toISOString().slice(0, 10);

// Compress a screenshot to a small JPEG data URL so entries stay light to store.
function fileToCompressedDataUrl(file, maxWidth = 640, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Couldn't read that image"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
const fmtMoney = (n) => {
  const v = Number(n) || 0;
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
const monthLabel = (d) =>
  d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

const emptyDraft = () => ({
  symbol: "",
  date: todayStr(),
  time: "",
  direction: "Long",
  session: "London",
  entryPrice: "",
  exitPrice: "",
  pnl: "",
  rr: "",
  notes: "",
  tags: [],
  tagDraft: "",
  image: null,
});

export default function TradingJournal() {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("dashboard");
  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [toast, setToast] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());

  const updateDraft = useCallback((patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  // ---- load ----
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("journal:entries", false);
        if (res && res.value) {
          setEntries(JSON.parse(res.value));
        }
      } catch (e) {
        // no data yet, that's fine
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setEntries(next);
    try {
      const ok = await window.storage.set(
        "journal:entries",
        JSON.stringify(next),
        false
      );
      if (!ok) throw new Error("save failed");
    } catch (e) {
      setToast("Couldn't save — try again");
      setTimeout(() => setToast(null), 2500);
    }
  }, []);

  const addEntry = (entry) => {
    const next = [{ ...entry, id: uid() }, ...entries];
    persist(next);
    setDraft(emptyDraft());
    setToast("Trade logged");
    setTimeout(() => setToast(null), 2000);
    setView("dashboard");
  };

  const deleteEntry = (id) => {
    persist(entries.filter((e) => e.id !== id));
  };

  // ---- derived stats ----
  const stats = useMemo(() => {
    const total = entries.reduce((s, e) => s + (Number(e.pnl) || 0), 0);
    const wins = entries.filter((e) => Number(e.pnl) > 0).length;
    const losses = entries.filter((e) => Number(e.pnl) < 0).length;
    const decisive = wins + losses;
    const winRate = decisive ? (wins / decisive) * 100 : 0;
    const avgWin =
      wins > 0
        ? entries.filter((e) => Number(e.pnl) > 0).reduce((s, e) => s + Number(e.pnl), 0) / wins
        : 0;
    const avgLoss =
      losses > 0
        ? entries.filter((e) => Number(e.pnl) < 0).reduce((s, e) => s + Number(e.pnl), 0) / losses
        : 0;
    const rrValues = entries.map((e) => parseFloat(e.rr)).filter((n) => !isNaN(n));
    const avgRR = rrValues.length ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length : 0;
    return { total, wins, losses, winRate, avgWin, avgLoss, avgRR, count: entries.length };
  }, [entries]);

  const byDay = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      if (!e.date) return;
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [entries]);

  const recent = entries.slice(0, 8);

  return (
    <div style={styles.app}>
      <style>{`
        @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .tj-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .tj-scrollbar::-webkit-scrollbar-thumb { background: #2A333D; border-radius: 4px; }
        input, select, textarea { font-family: inherit; }
        input:focus, select:focus, textarea:focus { outline: 2px solid #E8B049; outline-offset: 1px; }
        button:focus-visible { outline: 2px solid #E8B049; outline-offset: 2px; }
      `}</style>

      <Header stats={stats} />
      {entries.length > 0 && <Ticker entries={entries} />}

      <div style={styles.body} className="tj-scrollbar">
        {!loaded ? (
          <div style={{ padding: "40px 20px", color: "#7C8A97", textAlign: "center" }}>
            Loading your journal…
          </div>
        ) : view === "dashboard" ? (
          <Dashboard
            stats={stats}
            recent={recent}
            onDelete={deleteEntry}
            onNew={() => setView("new")}
            onImageClick={setLightboxImage}
          />
        ) : view === "new" ? (
          <EntryForm
            draft={draft}
            onChange={updateDraft}
            onSave={addEntry}
            onCancel={() => setView("dashboard")}
            onDiscard={() => setDraft(emptyDraft())}
          />
        ) : view === "calendar" ? (
          <PnlCalendar
            month={calMonth}
            setMonth={setCalMonth}
            byDay={byDay}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            onImageClick={setLightboxImage}
          />
        ) : (
          <History entries={entries} onDelete={deleteEntry} onImageClick={setLightboxImage} />
        )}
      </div>

      <NavBar view={view} setView={setView} />

      {toast && <div style={styles.toast}>{toast}</div>}
      {lightboxImage && (
        <Lightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
}

// ---------------- Lightbox ----------------
function Lightbox({ src, onClose }) {
  return (
    <div style={styles.lightboxOverlay} onClick={onClose}>
      <button style={styles.lightboxClose} onClick={onClose} aria-label="Close image">
        <X size={20} />
      </button>
      <img
        src={src}
        alt="Trade screenshot"
        style={styles.lightboxImg}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ---------------- Header ----------------
function Header({ stats }) {
  const positive = stats.total >= 0;
  return (
    <div style={styles.header}>
      <div>
        <div style={styles.eyebrow}>DESK LOG</div>
        <div style={styles.h1}>Trading Journal</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={styles.eyebrow}>TOTAL P&amp;L</div>
        <div
          style={{
            ...styles.bigNumber,
            color: positive ? "#46C2A6" : "#F16063",
          }}
        >
          {fmtMoney(stats.total)}
        </div>
      </div>
    </div>
  );
}

// ---------------- Ticker (signature element) ----------------
function Ticker({ entries }) {
  const chips = entries.slice(0, 14);
  const loopChips = [...chips, ...chips];
  return (
    <div style={styles.tickerWrap}>
      <div style={{ ...styles.tickerTrack, animation: `ticker-scroll ${Math.max(chips.length * 3, 12)}s linear infinite` }}>
        {loopChips.map((e, i) => {
          const up = Number(e.pnl) >= 0;
          return (
            <span key={i} style={styles.tickerChip}>
              <span style={{ color: "#7C8A97" }}>{(e.symbol || "—").toUpperCase()}</span>
              <span style={{ color: up ? "#46C2A6" : "#F16063", fontWeight: 600 }}>
                {fmtMoney(e.pnl)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Dashboard ----------------
function Dashboard({ stats, recent, onDelete, onNew, onImageClick }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={styles.statGrid}>
        <StatCard label="WIN RATE" value={`${stats.winRate.toFixed(1)}%`} icon={<Target size={14} />} />
        <StatCard label="TOTAL TRADES" value={stats.count} icon={<List size={14} />} />
        <StatCard label="AVG RR" value={stats.avgRR ? `1:${stats.avgRR.toFixed(2)}` : "—"} icon={<Gauge size={14} />} />
        <StatCard
          label="AVG WIN"
          value={fmtMoney(stats.avgWin)}
          icon={<TrendingUp size={14} />}
          tint="#46C2A6"
        />
        <StatCard
          label="AVG LOSS"
          value={fmtMoney(stats.avgLoss)}
          icon={<TrendingDown size={14} />}
          tint="#F16063"
        />
      </div>

      <button style={styles.primaryBtn} onClick={onNew}>
        <PlusCircle size={16} /> Log a trade
      </button>

      <div style={styles.sectionLabel}>RECENT ENTRIES</div>
      {recent.length === 0 ? (
        <EmptyState text="No trades logged yet. Your first entry starts the tape." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recent.map((e) => (
            <EntryRow key={e.id} entry={e} onDelete={onDelete} onImageClick={onImageClick} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, tint }) {
  return (
    <div style={styles.statCard}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#7C8A97" }}>
        {icon}
        <span style={styles.eyebrowSmall}>{label}</span>
      </div>
      <div style={{ ...styles.statValue, color: tint || "#EDF1F4" }}>{value}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={styles.empty}>{text}</div>;
}

function EntryRow({ entry, onDelete, compact, onImageClick }) {
  const up = Number(entry.pnl) >= 0;
  const tags = entry.tags || [];
  return (
    <div style={styles.entryRow}>
      {entry.image && (
        <button
          style={styles.thumbBtn}
          onClick={() => onImageClick && onImageClick(entry.image)}
          aria-label="View screenshot"
        >
          <img src={entry.image} alt="Trade screenshot" style={styles.thumbImg} />
        </button>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={styles.symbolTag}>{(entry.symbol || "—").toUpperCase()}</span>
          <span style={{ color: "#7C8A97", fontSize: 12 }}>{entry.date}</span>
        </div>
        <div style={{ color: "#7C8A97", fontSize: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span>{entry.direction}</span>
          {entry.session && <span>· {entry.session}</span>}
          {entry.rr && <span>· RR 1:{entry.rr}</span>}
        </div>
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 2 }}>
            {tags.map((t) => (
              <span key={t} style={styles.tagChip}>{t}</span>
            ))}
          </div>
        )}
        {entry.notes && !compact && (
          <div style={{ color: "#5C6975", fontSize: 12, marginTop: 2 }}>{entry.notes}</div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontWeight: 600, color: up ? "#46C2A6" : "#F16063" }}>
          {fmtMoney(entry.pnl)}
        </span>
        <button style={styles.iconBtn} onClick={() => onDelete(entry.id)} aria-label="Delete trade">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ---------------- Entry Form ----------------
function EntryForm({ draft, onChange, onSave, onCancel, onDiscard }) {
  const { symbol, date, time, direction, session, entryPrice, exitPrice, pnl, rr, notes, tags, tagDraft, image } = draft;
  const [error, setError] = useState("");
  const [imageBusy, setImageBusy] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image.");
      return;
    }
    setImageBusy(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      onChange({ image: dataUrl });
      setError("");
    } catch (err) {
      setError("Couldn't process that screenshot — try a different file.");
    } finally {
      setImageBusy(false);
    }
  };

  const addTag = () => {
    const t = tagDraft.trim().replace(/,$/, "");
    if (t && !tags.includes(t)) onChange({ tags: [...tags, t], tagDraft: "" });
    else onChange({ tagDraft: "" });
  };
  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
      onChange({ tags: tags.slice(0, -1) });
    }
  };
  const removeTag = (t) => onChange({ tags: tags.filter((x) => x !== t) });

  const submit = (e) => {
    e.preventDefault();
    if (!symbol.trim()) return setError("Add a symbol, like EURUSD.");
    if (!date) return setError("Pick a date.");
    if (pnl === "" || isNaN(Number(pnl))) return setError("Enter a P&L amount.");
    setError("");
    onSave({
      symbol: symbol.trim(),
      date,
      time,
      direction,
      session,
      entryPrice,
      exitPrice,
      pnl: Number(pnl),
      rr,
      notes: notes.trim(),
      tags,
      image,
    });
  };

  return (
    <form style={{ padding: 16 }} onSubmit={submit}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={styles.sectionLabel}>NEW ENTRY</div>
        {(symbol || pnl || notes || image || tags.length > 0) && (
          <button type="button" style={styles.discardBtn} onClick={onDiscard}>
            Discard draft
          </button>
        )}
      </div>

      <Field label="Symbol">
        <select style={styles.input} value={SYMBOLS.includes(symbol) ? symbol : "__other__"} onChange={(e) => onChange({ symbol: e.target.value === "__other__" ? "" : e.target.value })}>
          <option value="" disabled>Select pair</option>
          {SYMBOLS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="__other__">Other…</option>
        </select>
        {!SYMBOLS.includes(symbol) && (
          <input style={{ ...styles.input, marginTop: 8 }} value={symbol} onChange={(e) => onChange({ symbol: e.target.value })} placeholder="Type symbol e.g. EURUSD" />
        )}
      </Field>

      <div style={styles.row2}>
        <Field label="Date">
          <input style={styles.input} type="date" value={date} onChange={(e) => onChange({ date: e.target.value })} />
        </Field>
        <Field label="Time">
          <input style={styles.input} type="time" value={time} onChange={(e) => onChange({ time: e.target.value })} />
        </Field>
      </div>

      <div style={styles.row2}>
        <Field label="Direction">
          <select style={styles.input} value={direction} onChange={(e) => onChange({ direction: e.target.value })}>
            {DIRECTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Session">
          <select style={styles.input} value={session} onChange={(e) => onChange({ session: e.target.value })}>
            {SESSIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>

      <div style={styles.row2}>
        <Field label="Entry price">
          <input style={styles.input} value={entryPrice} onChange={(e) => onChange({ entryPrice: e.target.value })} placeholder="0.69358" />
        </Field>
        <Field label="Exit price">
          <input style={styles.input} value={exitPrice} onChange={(e) => onChange({ exitPrice: e.target.value })} placeholder="0.69236" />
        </Field>
      </div>

      <div style={styles.row2}>
        <Field label="P&L ($)">
          <input style={styles.input} value={pnl} onChange={(e) => onChange({ pnl: e.target.value })} placeholder="e.g. 5710 or -320" inputMode="decimal" />
        </Field>
        <Field label="RR (1:x)">
          <input style={styles.input} value={rr} onChange={(e) => onChange({ rr: e.target.value })} placeholder="5.71" inputMode="decimal" />
        </Field>
      </div>

      <Field label="Setup tags">
        <div style={styles.tagInputWrap}>
          {tags.map((t) => (
            <span key={t} style={styles.tagChipEditable}>
              {t}
              <button type="button" onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`} style={styles.tagChipRemove}>
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            style={styles.tagRawInput}
            value={tagDraft}
            onChange={(e) => onChange({ tagDraft: e.target.value })}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            placeholder={tags.length ? "" : "sweep + FVG, breaker…"}
          />
        </div>
        <div style={styles.hintText}>Press enter or comma to add a tag</div>
      </Field>

      <Field label="Screenshot">
        {image ? (
          <div style={styles.imagePreviewWrap}>
            <img src={image} alt="Screenshot preview" style={styles.imagePreview} />
            <button type="button" style={styles.removeImageBtn} onClick={() => onChange({ image: null })} aria-label="Remove screenshot">
              <X size={14} />
            </button>
          </div>
        ) : (
          <label style={styles.uploadBtn}>
            <ImagePlus size={16} />
            {imageBusy ? "Processing…" : "Attach chart screenshot"}
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} disabled={imageBusy} />
          </label>
        )}
      </Field>

      <Field label="Notes">
        <textarea style={{ ...styles.input, minHeight: 70, resize: "vertical" }} value={notes} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Setup, reasoning, lessons learned…" />
      </Field>

      {error && <div style={styles.errorText}>{error}</div>}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button type="button" style={styles.secondaryBtn} onClick={onCancel}>Back</button>
        <button type="submit" style={styles.primaryBtn}>Save trade</button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={styles.fieldLabel}>{label}</div>
      {children}
    </div>
  );
}

// ---------------- Calendar ----------------
function PnlCalendar({ month, setMonth, byDay, selectedDay, setSelectedDay, onImageClick }) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateKey = (d) => `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const monthTotal = Object.entries(byDay).reduce((sum, [k, list]) => {
    const [ky, km] = k.split("-").map(Number);
    if (ky === year && km === m + 1) {
      return sum + list.reduce((s, e) => s + Number(e.pnl || 0), 0);
    }
    return sum;
  }, 0);

  return (
    <div style={{ padding: 16 }}>
      <div style={styles.calHeader}>
        <button style={styles.iconBtn} onClick={() => setMonth(new Date(year, m - 1, 1))} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={styles.eyebrowSmall}>{monthLabel(month).toUpperCase()}</div>
          <div style={{ color: monthTotal >= 0 ? "#46C2A6" : "#F16063", fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>
            {fmtMoney(monthTotal)}
          </div>
        </div>
        <button style={styles.iconBtn} onClick={() => setMonth(new Date(year, m + 1, 1))} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      <div style={styles.weekRow}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} style={styles.weekDay}>{d}</div>
        ))}
      </div>

      {/* Render weeks with P&L totals */}
      {(() => {
        const weeks = [];
        for (let i = 0; i < cells.length; i += 7) {
          const weekCells = cells.slice(i, i + 7);
          let weekTotal = 0;
          let weekHas = false;
          weekCells.forEach((d) => {
            if (d === null) return;
            const list = byDay[dateKey(d)] || [];
            if (list.length) weekHas = true;
            weekTotal += list.reduce((s, e) => s + Number(e.pnl || 0), 0);
          });
          const weekNum = Math.floor(i / 7) + 1;
          const pnlColor = weekTotal >= 0 ? "#46C2A6" : "#F16063";
          weeks.push(
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "stretch", gap: 6 }}>
                <div style={{ ...styles.calGrid, flex: 1 }}>
                  {weekCells.map((d, ci) => {
                  if (d === null) return <div key={ci} />;
                  const key = dateKey(d);
                  const list = byDay[key] || [];
                  const total = list.reduce((s, e) => s + Number(e.pnl || 0), 0);
                  const has = list.length > 0;
                  const up = total > 0;
                  const isToday = key === todayStr();
                  return (
                    <button
                      key={ci}
                      onClick={() => has && setSelectedDay(selectedDay === key ? null : key)}
                      style={{
                        ...styles.calCell,
                        background: has ? (up ? "rgba(70,194,166,0.14)" : "rgba(241,96,99,0.14)") : "transparent",
                        border: isToday ? "1px solid #E8B049" : has ? `1px solid ${up ? "#2E6A5C" : "#6A3234"}` : "1px solid transparent",
                        cursor: has ? "pointer" : "default",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#7C8A97" }}>{d}</span>
                      {has && (
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: "ui-monospace, monospace",
                            color: up ? "#46C2A6" : "#F16063",
                            fontWeight: 700,
                          }}
                        >
                          {up ? "+" : "-"}${Math.abs(total) >= 1000 ? `${(Math.abs(total) / 1000).toFixed(1)}k` : Math.abs(total).toFixed(0)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div style={{
                width: 58,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                fontSize: weekHas ? 11 : 10,
                fontWeight: 700,
                fontFamily: "ui-monospace, monospace",
                background: "#0E141B",
                border: "1px solid #1A2129",
                borderLeft: weekHas ? `3px solid ${pnlColor}` : "1px solid #1A2129",
                color: weekHas ? pnlColor : "#5C6975",
              }}>
                {weekHas ? fmtMoney(weekTotal) : "—"}
              </div>
              </div>
            </div>
          );
        }
        return weeks;
      })()}

      {selectedDay && (
        <div style={{ marginTop: 18 }}>
          <div style={styles.sectionLabel}>{selectedDay}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(byDay[selectedDay] || []).map((e) => (
              <EntryRow key={e.id} entry={e} onDelete={() => {}} compact onImageClick={onImageClick} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- History ----------------
function History({ entries, onDelete, onImageClick }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={styles.sectionLabel}>ALL ENTRIES ({entries.length})</div>
      {entries.length === 0 ? (
        <EmptyState text="Nothing logged yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {entries.map((e) => (
            <EntryRow key={e.id} entry={e} onDelete={onDelete} onImageClick={onImageClick} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Nav ----------------
function NavBar({ view, setView }) {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: TrendingUp },
    { key: "new", label: "New", icon: PlusCircle },
    { key: "calendar", label: "Calendar", icon: CalendarIcon },
    { key: "history", label: "History", icon: List },
  ];
  return (
    <div style={styles.navBar}>
      {items.map(({ key, label, icon: Icon }) => {
        const active = view === key;
        return (
          <button
            key={key}
            onClick={() => setView(key)}
            style={{
              ...styles.navItem,
              color: active ? "#E8B049" : "#7C8A97",
            }}
          >
            <Icon size={18} />
            <span style={{ fontSize: 10, letterSpacing: 0.3 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------- Styles ----------------
const styles = {
  app: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    background: "#0B0F14",
    color: "#EDF1F4",
    minHeight: 560,
    maxWidth: 480,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid #1A2129",
    position: "relative",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "18px 16px 14px",
    borderBottom: "1px solid #1A2129",
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: "#5C6975",
    fontWeight: 700,
    marginBottom: 4,
  },
  eyebrowSmall: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: 700,
  },
  h1: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  bigNumber: {
    fontSize: 22,
    fontWeight: 700,
    fontFamily: "ui-monospace, SFMono-Regular, monospace",
  },
  tickerWrap: {
    borderBottom: "1px solid #1A2129",
    overflow: "hidden",
    whiteSpace: "nowrap",
    background: "#0E141B",
    padding: "8px 0",
  },
  tickerTrack: {
    display: "inline-flex",
    gap: 22,
    paddingLeft: 16,
  },
  tickerChip: {
    display: "inline-flex",
    gap: 6,
    fontSize: 12,
    fontFamily: "ui-monospace, SFMono-Regular, monospace",
  },
  body: {
    flex: 1,
    overflowY: "auto",
    minHeight: 380,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    background: "#121820",
    border: "1px solid #1A2129",
    borderRadius: 12,
    padding: "12px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: "ui-monospace, SFMono-Regular, monospace",
  },
  primaryBtn: {
    width: "100%",
    background: "#E8B049",
    color: "#0B0F14",
    border: "none",
    borderRadius: 10,
    padding: "12px 14px",
    fontWeight: 700,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    marginBottom: 18,
  },
  secondaryBtn: {
    flex: 1,
    background: "transparent",
    color: "#7C8A97",
    border: "1px solid #232B34",
    borderRadius: 10,
    padding: "12px 14px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    color: "#5C6975",
    fontWeight: 700,
    marginBottom: 10,
  },
  discardBtn: {
    background: "transparent",
    border: "none",
    color: "#7C8A97",
    fontSize: 11,
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
  },
  entryRow: {
    background: "#121820",
    border: "1px solid #1A2129",
    borderRadius: 12,
    padding: "12px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  symbolTag: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "#5C6975",
    cursor: "pointer",
    padding: 6,
    display: "flex",
    alignItems: "center",
  },
  empty: {
    color: "#5C6975",
    fontSize: 13,
    padding: "24px 4px",
    textAlign: "center",
    border: "1px dashed #232B34",
    borderRadius: 12,
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: "#7C8A97",
    marginBottom: 6,
    fontWeight: 600,
  },
  input: {
    width: "100%",
    background: "#121820",
    border: "1px solid #232B34",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#EDF1F4",
    fontSize: 14,
    boxSizing: "border-box",
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  errorText: {
    color: "#F16063",
    fontSize: 12,
    marginTop: 4,
  },
  calHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  weekRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    marginBottom: 6,
  },
  weekDay: {
    textAlign: "center",
    fontSize: 10,
    color: "#5C6975",
    fontWeight: 700,
  },
  calGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
  },
  calCell: {
    aspectRatio: "1",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    background: "transparent",
    overflow: "hidden",
    minHeight: 44,
  },
  navBar: {
    display: "flex",
    justifyContent: "space-around",
    borderTop: "1px solid #1A2129",
    padding: "8px 4px 12px",
    background: "#0E141B",
  },
  navItem: {
    background: "transparent",
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    cursor: "pointer",
    padding: "6px 10px",
  },
  toast: {
    position: "absolute",
    bottom: 70,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#1A2129",
    border: "1px solid #E8B049",
    color: "#EDF1F4",
    padding: "8px 14px",
    borderRadius: 20,
    fontSize: 12,
  },
  thumbBtn: {
    background: "transparent",
    border: "1px solid #232B34",
    borderRadius: 8,
    padding: 0,
    cursor: "pointer",
    flexShrink: 0,
    width: 44,
    height: 44,
    overflow: "hidden",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  tagChip: {
    fontSize: 10,
    color: "#E8B049",
    background: "rgba(232,176,73,0.12)",
    border: "1px solid rgba(232,176,73,0.3)",
    borderRadius: 20,
    padding: "2px 8px",
    fontWeight: 600,
  },
  tagInputWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
    background: "#121820",
    border: "1px solid #232B34",
    borderRadius: 8,
    padding: "8px 10px",
  },
  tagChipEditable: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    color: "#E8B049",
    background: "rgba(232,176,73,0.12)",
    border: "1px solid rgba(232,176,73,0.3)",
    borderRadius: 20,
    padding: "3px 6px 3px 10px",
    fontWeight: 600,
  },
  tagChipRemove: {
    background: "transparent",
    border: "none",
    color: "#E8B049",
    cursor: "pointer",
    display: "flex",
    padding: 2,
  },
  tagRawInput: {
    flex: 1,
    minWidth: 90,
    background: "transparent",
    border: "none",
    color: "#EDF1F4",
    fontSize: 14,
    padding: "4px 2px",
    outline: "none",
  },
  hintText: {
    fontSize: 11,
    color: "#5C6975",
    marginTop: 4,
  },
  uploadBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    background: "#121820",
    border: "1px dashed #2E3A45",
    borderRadius: 10,
    padding: "14px 12px",
    color: "#7C8A97",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    boxSizing: "border-box",
  },
  imagePreviewWrap: {
    position: "relative",
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #232B34",
  },
  imagePreview: {
    width: "100%",
    maxHeight: 220,
    objectFit: "cover",
    display: "block",
  },
  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    background: "rgba(11,15,20,0.85)",
    border: "1px solid #232B34",
    borderRadius: "50%",
    color: "#EDF1F4",
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  lightboxOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(6,8,11,0.92)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: 20,
  },
  lightboxImg: {
    maxWidth: "100%",
    maxHeight: "100%",
    borderRadius: 8,
    border: "1px solid #232B34",
  },
  lightboxClose: {
    position: "absolute",
    top: 18,
    right: 18,
    background: "#121820",
    border: "1px solid #232B34",
    borderRadius: "50%",
    width: 36,
    height: 36,
    color: "#EDF1F4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
};
