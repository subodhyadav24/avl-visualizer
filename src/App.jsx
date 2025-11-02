import React, { useState, useEffect, useRef, useMemo } from "react";

/* ---------- AVL Implementation ---------- */

class AVLNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
    this.height = 1;
    this.id = Math.random().toString(36).slice(2, 9);
  }
}

function height(n) { return n ? n.height : 0; }
function updateHeight(n) { if (!n) return 0; n.height = 1 + Math.max(height(n.left), height(n.right)); return n.height; }
function getBalance(n) { if (!n) return 0; return height(n.left) - height(n.right); }

function rotateRight(y) {
  const x = y.left;
  const T = x.right;
  x.right = y;
  y.left = T;
  updateHeight(y);
  updateHeight(x);
  return x;
}
function rotateLeft(x) {
  const y = x.right;
  const T = y.left;
  y.left = x;
  x.right = T;
  updateHeight(x);
  updateHeight(y);
  return y;
}

/* Insert / Delete with trace (unchanged logic) */
function avlInsertTrace(node, key, trace) {
  if (!node) {
    trace.push({ text: `Insert ${key} as new node`, line: "InsertNode" });
    return new AVLNode(key);
  }
  trace.push({ text: `Compare ${key} with ${node.val}`, line: "Compare" });
  if (key === node.val) {
    trace.push({ text: `Duplicate ${key} ignored`, line: "Duplicate" });
    return node;
  }
  if (key < node.val) {
    trace.push({ text: `Go left from ${node.val}`, line: "GoLeft" });
    node.left = avlInsertTrace(node.left, key, trace);
  } else {
    trace.push({ text: `Go right from ${node.val}`, line: "GoRight" });
    node.right = avlInsertTrace(node.right, key, trace);
  }

  updateHeight(node);
  const bal = getBalance(node);
  trace.push({ text: `Balance at ${node.val} = ${bal}`, line: "Balance" });

  if (bal > 1 && key < node.left.val) {
    trace.push({ text: `Left-Left at ${node.val} → rotateRight`, line: "RotateRight" });
    return rotateRight(node);
  }
  if (bal < -1 && key > node.right.val) {
    trace.push({ text: `Right-Right at ${node.val} → rotateLeft`, line: "RotateLeft" });
    return rotateLeft(node);
  }
  if (bal > 1 && key > node.left.val) {
    trace.push({ text: `Left-Right at ${node.val} → rotateLeft(${node.left.val}), rotateRight`, line: "RotateLeftRight" });
    node.left = rotateLeft(node.left);
    return rotateRight(node);
  }
  if (bal < -1 && key < node.right.val) {
    trace.push({ text: `Right-Left at ${node.val} → rotateRight(${node.right.val}), rotateLeft`, line: "RotateRightLeft" });
    node.right = rotateRight(node.right);
    return rotateLeft(node);
  }
  return node;
}

function minValue(node) {
  let cur = node;
  while (cur && cur.left) cur = cur.left;
  return cur;
}

function avlDeleteTrace(node, key, trace) {
  if (!node) {
    trace.push({ text: `${key} not found`, line: "NotFound" });
    return null;
  }
  trace.push({ text: `Compare ${key} with ${node.val}`, line: "Compare" });
  if (key < node.val) {
    node.left = avlDeleteTrace(node.left, key, trace);
  } else if (key > node.val) {
    node.right = avlDeleteTrace(node.right, key, trace);
  } else {
    trace.push({ text: `Found ${node.val} → deleting`, line: "Found" });
    if (!node.left || !node.right) {
      const t = node.left || node.right;
      return t || null;
    } else {
      const succ = minValue(node.right);
      trace.push({ text: `Replace ${node.val} with inorder successor ${succ.val}`, line: "TwoChildren" });
      node.val = succ.val;
      node.right = avlDeleteTrace(node.right, succ.val, trace);
    }
  }

  updateHeight(node);
  const bal = getBalance(node);
  trace.push({ text: `Balance at ${node.val} = ${bal}`, line: "Balance" });

  if (bal > 1 && getBalance(node.left) >= 0) {
    trace.push({ text: `Left-Left at ${node.val} → rotateRight`, line: "RotateRight" });
    return rotateRight(node);
  }
  if (bal > 1 && getBalance(node.left) < 0) {
    trace.push({ text: `Left-Right at ${node.val}`, line: "RotateLeftRight" });
    node.left = rotateLeft(node.left);
    return rotateRight(node);
  }
  if (bal < -1 && getBalance(node.right) <= 0) {
    trace.push({ text: `Right-Right at ${node.val} → rotateLeft`, line: "RotateLeft" });
    return rotateLeft(node);
  }
  if (bal < -1 && getBalance(node.right) > 0) {
    trace.push({ text: `Right-Left at ${node.val}`, line: "RotateRightLeft" });
    node.right = rotateRight(node.right);
    return rotateLeft(node);
  }
  return node;
}

/* ---------- Inorder layout (dynamic canvas) ---------- */
function computeInorderPositions(root, options = {}) {
  const horizontalSpacing = options.hSpacing ?? 90;
  const verticalSpacing = options.vSpacing ?? 100;
  const nodes = [];
  let index = 0;
  function inorderAssign(n, depth) {
    if (!n) return;
    inorderAssign(n.left, depth + 1);
    const x = index * horizontalSpacing + 60;
    const y = depth * verticalSpacing + 60;
    nodes.push({ id: n.id, val: n.val, x, y, bf: getBalance(n), nodeRef: n, depth });
    index++;
    inorderAssign(n.right, depth + 1);
  }
  inorderAssign(root, 0);

  const edges = [];
  function collect(n) {
    if (!n) return;
    if (n.left) edges.push({ from: n.id, to: n.left.id });
    if (n.right) edges.push({ from: n.id, to: n.right.id });
    collect(n.left);
    collect(n.right);
  }
  collect(root);

  const width = Math.max(300, index * horizontalSpacing + 120);
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);
  const height = Math.max(300, (maxDepth + 1) * verticalSpacing + 120);
  return { nodes, edges, width, height };
}

/* pseudocode lines */
const PSEUDOCODE = [
  { key: "Compare", text: "Compare key with node value" },
  { key: "GoLeft", text: "If key < node.val -> go left" },
  { key: "GoRight", text: "If key > node.val -> go right" },
  { key: "InsertNode", text: "Insert when null reached" },
  { key: "UpdateHeight", text: "Update node.height = 1 + max(height(left), height(right))" },
  { key: "Balance", text: "Compute balance = height(left) - height(right)" },
  { key: "RotateRight", text: "Right rotation (LL case)" },
  { key: "RotateLeft", text: "Left rotation (RR case)" },
  { key: "RotateLeftRight", text: "Left-Right rotation (LR case)" },
  { key: "RotateRightLeft", text: "Right-Left rotation (RL case)" },
  { key: "Duplicate", text: "Ignore duplicate" },
  { key: "NotFound", text: "Key not found for delete" },
  { key: "Found", text: "Found node to delete" },
];

/* ---------- App component ---------- */

export default function App() {
  const [root, setRoot] = useState(null);
  const [value, setValue] = useState("");
  const [trace, setTrace] = useState([]);
  const [step, setStep] = useState(-1);
  const [speed, setSpeed] = useState(700);
  const [autoplay, setAutoplay] = useState(false);
  const [notice, setNotice] = useState(""); // small on-screen message
  const intervalRef = useRef(null);

  // layout
  const layout = useMemo(() => computeInorderPositions(root, { hSpacing: 90, vSpacing: 100 }), [root]);
  const nodes = layout.nodes;
  const edges = layout.edges;
  const canvasW = layout.width;
  const canvasH = layout.height;

  // autoplay stepping
  useEffect(() => {
    if (autoplay && trace.length > 0) {
      intervalRef.current = setInterval(() => {
        setStep((s) => Math.min(s + 1, trace.length - 1));
      }, Math.max(80, speed));
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoplay, trace, speed]);

  // helper to display notice temporarily
  function flashNotice(msg, ms = 1200) {
    setNotice(msg);
    setTimeout(() => setNotice(""), ms);
  }

  // debug helper
  function debugLog(...args) {
    // logs both to console and on-screen notice when short
    console.log(...args);
    if (args.length === 1 && typeof args[0] === "string") flashNotice(args[0], 1200);
  }

  // Insert handler — defensive, with logs
  function handleInsert() {
    if (value === "" || value === null) {
      debugLog("Insert aborted: no value entered");
      return;
    }
    const n = Number(value);
    if (Number.isNaN(n)) {
      debugLog("Insert aborted: value is not a number");
      return;
    }

    debugLog("Attempting insert:", n, "current root:", root ? "(exists)" : "(null)");
    const newTrace = [];
    const newRoot = avlInsertTrace(root, n, newTrace);

    // Sanity: if newRoot is null something went wrong (shouldn't happen)
    if (!newRoot) {
      console.error("Insert returned null root — unexpected");
      flashNotice("Insert error — see console");
      return;
    }

    setRoot(newRoot);
    setTrace(newTrace);
    setStep(0);
    setValue(""); // clear input
    debugLog(`Inserted ${n} — trace length: ${newTrace.length}`);
  }

  // Delete handler — defensive, with logs
  function handleDelete() {
    if (value === "" || value === null) {
      debugLog("Delete aborted: no value entered");
      return;
    }
    const n = Number(value);
    if (Number.isNaN(n)) {
      debugLog("Delete aborted: not a number");
      return;
    }
    debugLog("Attempting delete:", n, "current root:", root ? "(exists)" : "(null)");
    const newTrace = [];
    const newRoot = avlDeleteTrace(root, n, newTrace);
    setRoot(newRoot);
    setTrace(newTrace);
    setStep(0);
    setValue("");
    debugLog(`Delete ${n} — trace length: ${newTrace.length}`);
  }

  function handleClear() {
    setRoot(null);
    setTrace([]);
    setStep(-1);
    flashNotice("Cleared tree");
  }

  const current = step >= 0 ? trace[step] : null;
  const pseudocodeKey = current ? current.line : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-4">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-4 text-center">
          <h1 className="text-3xl font-extrabold text-cyan-300">🌲 AVL Tree Visualizer</h1>
          <p className="text-sm text-cyan-200/70 mt-1">Insert / Delete / Trace — BF shown in green</p>
        </header>

        {/* toolbar above canvas */}
        <div className="flex flex-wrap items-center gap-2 justify-center mb-4">
          <input
            type="number"
            placeholder="value"
            className="px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white w-36"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleInsert(); }}
          />
          <button onClick={handleInsert} className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500">Insert</button>
          <button onClick={handleDelete} className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500">Delete</button>
          <button onClick={handleClear} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500">Clear</button>

          <div className="ml-4 flex items-center gap-2">
            <label className="text-sm text-cyan-200/80">Speed</label>
            <input type="range" min="200" max="1400" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
            <span className="text-sm text-cyan-200 ml-2">{speed} ms</span>
            <label className="ml-4 text-sm">Autoplay</label>
            <input className="ml-1" type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />
          </div>
        </div>

        {/* small on-screen debug/notification */}
        <div className="text-center mb-2">
          {notice && <span className="bg-cyan-700 px-3 py-1 rounded text-sm">{notice}</span>}
        </div>

        {/* main layout */}
        <div className="grid" style={{ gridTemplateColumns: "1fr 410px", gap: "20px" }}>
          {/* Canvas */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-3">
            <div className="bg-slate-900/60 rounded-md border border-slate-700 p-2">
              <svg viewBox={`0 0 ${canvasW} ${canvasH}`} width="100%" height={Math.min(canvasH, 720)} preserveAspectRatio="xMidYMid meet">
                {/* edges */}
                {edges.map((e, i) => {
                  const a = nodes.find((n) => n.id === e.from);
                  const b = nodes.find((n) => n.id === e.to);
                  if (!a || !b) return null;
                  return (
                    <line
                      key={i}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="#475569"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* nodes */}
                {nodes.map((n) => (
                  <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                    <circle r={22} fill="#0b1220" stroke="#06b6d4" strokeWidth={2} />
                    <text x={0} y={6} textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="700">
                      {n.val}
                    </text>
                    <text x={0} y={36} textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">
                      BF: {n.bf}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Right panel */}
          <aside className="bg-slate-800 rounded-lg border border-slate-700 p-4 h-[720px] overflow-auto">
            <div className="mb-3">
              <h2 className="text-xl font-semibold text-cyan-200">Algorithm & Trace</h2>
              <p className="text-sm text-cyan-100/60 mt-1">Pseudocode on top — current line highlighted while trace runs.</p>
            </div>

            <div className="mb-4 bg-slate-900/50 border border-slate-700 rounded p-3">
              <div className="text-sm font-medium text-cyan-100 mb-2">Pseudocode</div>
              <ol className="list-decimal ml-4 space-y-2 text-sm">
                {PSEUDOCODE.map((l) => {
                  const active = l.key === pseudocodeKey;
                  return (
                    <li key={l.key} className={`p-2 rounded ${active ? "bg-cyan-700/40 text-white" : "text-cyan-100/70"}`}>
                      <div className="font-semibold text-sm">{l.key}</div>
                      <div className="text-xs mt-1">{l.text}</div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="mb-4 bg-slate-900/40 border border-slate-700 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-cyan-100">Trace Steps</div>
                <div className="text-xs text-cyan-200/60">Total: {trace.length}</div>
              </div>
              <ul className="space-y-2 text-sm">
                {trace.length === 0 && <li className="text-cyan-200/60">No steps yet — insert or delete a node.</li>}
                {trace.map((t, i) => (
                  <li key={i} className={`p-2 rounded ${i === step ? "bg-cyan-800 text-white" : "bg-transparent text-cyan-100/80"}`}>
                    <div className="text-xs text-cyan-200/70">Step {i + 1}</div>
                    <div className="mt-1">{t.text}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900/30 border border-slate-700 rounded p-3 text-sm text-cyan-100/70">
              <div className="font-medium mb-1">Legend & Tips</div>
              <ul className="list-disc ml-5 text-xs space-y-1">
                <li><strong>BF</strong> = balance factor (left height − right height).</li>
                <li>Use <em>Speed</em> to slow down or speed up autoplay.</li>
                <li>Toolbar above canvas: enter value → Insert / Delete / Clear. Press Enter to insert quickly.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
