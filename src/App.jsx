import React, { useState, useEffect, useMemo } from "react";




let NEXT_ID = 1;
function newId() { return "n" + (NEXT_ID++); }


class AVLNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
    this.height = 1;
    this.id = newId();
  }
}

function nodeHeight(n) { return n ? n.height : 0; }
function updateHeight(n) { if (!n) return 0; n.height = 1 + Math.max(nodeHeight(n.left), nodeHeight(n.right)); return n.height; }
function getBalance(n) { if (!n) return 0; return nodeHeight(n.left) - nodeHeight(n.right); }

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
    trace.push({ text: `Left-Right at ${node.val} → rotateLeft(${node.left.val}) then rotateRight`, line: "RotateLeftRight" });
    node.left = rotateLeft(node.left);
    return rotateRight(node);
  }
  if (bal < -1 && key < node.right.val) {
    trace.push({ text: `Right-Left at ${node.val} → rotateRight(${node.right.val}) then rotateLeft`, line: "RotateRightLeft" });
    node.right = rotateRight(node.right);
    return rotateLeft(node);
  }
  return node;
}

function minValueNode(n) {
  let cur = n;
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
      const succ = minValueNode(node.right);
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


function layoutInorder(root, hSpacing = 90, vSpacing = 110) {
  const nodes = [];
  let idx = 0;
  function inorder(n, depth) {
    if (!n) return;
    inorder(n.left, depth + 1);
    const x = idx * hSpacing + 60;
    const y = depth * vSpacing + 60;
    nodes.push({ id: n.id, val: n.val, x, y, bf: getBalance(n), depth });
    idx++;
    inorder(n.right, depth + 1);
  }
  inorder(root, 0);

  const edges = [];
  function collect(n) {
    if (!n) return;
    if (n.left) edges.push({ from: n.id, to: n.left.id });
    if (n.right) edges.push({ from: n.id, to: n.right.id });
    collect(n.left);
    collect(n.right);
  }
  collect(root);

  const width = Math.max(360, idx * hSpacing + 120);
  const maxDepth = nodes.reduce((m, x) => Math.max(m, x.depth), 0);
  const height = Math.max(300, (maxDepth + 1) * vSpacing + 120);
  return { nodes, edges, width, height };
}


function cloneTreePreserve(node) {
  if (!node) return null;
  const n = new AVLNode(node.val);
  n.id = node.id ?? newId();
  n.height = node.height ?? 1;
  n.left = cloneTreePreserve(node.left);
  n.right = cloneTreePreserve(node.right);
  return n;
}

const PSEUDOCODE = [
  { key: "Compare", text: "Compare key with node value" },
  { key: "GoLeft", text: "If key < node.val → recurse left" },
  { key: "GoRight", text: "If key > node.val → recurse right" },
  { key: "InsertNode", text: "Insert new node when null reached" },
  { key: "UpdateHeight", text: "Update node.height = 1 + max(height(left), height(right))" },
  { key: "Balance", text: "Compute balance = height(left) - height(right)" },
  { key: "RotateRight", text: "Right rotation (LL case)" },
  { key: "RotateLeft", text: "Left rotation (RR case)" },
  { key: "RotateLeftRight", text: "Left-Right rotation (LR case)" },
  { key: "RotateRightLeft", text: "Right-Left rotation (RL case)" },
  { key: "Duplicate", text: "Handle duplicate (ignore)" },
  { key: "NotFound", text: "Key not found for delete" },
  { key: "Found", text: "Found node to delete" },
];


export default function App() {
  const [root, setRoot] = useState(null);
  const [input, setInput] = useState("");
  const [trace, setTrace] = useState([]);
  const [stepIndex, setStepIndex] = useState(-1);
  const [autoplay, setAutoplay] = useState(false);
  const [speed, setSpeed] = useState(700);
  const [notice, setNotice] = useState("");

  
  const layout = useMemo(() => layoutInorder(root, 90, 110), [root]);
  const nodes = layout.nodes;
  const edges = layout.edges;
  const canvasW = layout.width;
  const canvasH = layout.height;

  
  useEffect(() => {
    if (!autoplay || trace.length === 0) return;
    const id = setInterval(() => {
      setStepIndex((s) => {
        const next = Math.min(s + 1, trace.length - 1);
        if (next === trace.length - 1) setAutoplay(false);
        return next;
      });
    }, Math.max(80, speed));
    return () => clearInterval(id);
  }, [autoplay, trace, speed]);

  
  function flash(msg, ms = 1000) {
    setNotice(msg);
    setTimeout(() => setNotice(""), ms);
  }

  
  function applyNewRoot(rawRoot, newTrace) {
    
    const fresh = cloneTreePreserve(rawRoot);
    setRoot(fresh);
    setTrace(newTrace || []);
    setStepIndex((newTrace && newTrace.length > 0) ? 0 : -1);
  }

  
  function handleInsert() {
    if (input === "" || input === null) { flash("Enter a number"); return; }
    const num = Number(input);
    if (Number.isNaN(num)) { flash("Not a number"); return; }

    
    const newTrace = [];
    const newRoot = avlInsertTrace(root, num, newTrace);

    applyNewRoot(newRoot, newTrace);
    setInput("");
    flash(`Inserted ${num}`);
    console.log("Inserted", num, "trace:", newTrace);
  }

  
  function handleDelete() {
    if (input === "" || input === null) { flash("Enter a number"); return; }
    const num = Number(input);
    if (Number.isNaN(num)) { flash("Not a number"); return; }

    const newTrace = [];
    const newRoot = avlDeleteTrace(root, num, newTrace);

    applyNewRoot(newRoot, newTrace);
    setInput("");
    flash(`Delete ${num}`);
    console.log("Deleted", num, "trace:", newTrace);
  }

  function handleClear() {
    setRoot(null);
    setTrace([]);
    setStepIndex(-1);
    flash("Cleared tree");
  }

  
  function onKeyDown(e) {
    if (e.key === "Enter") handleInsert();
  }

  const current = stepIndex >= 0 ? trace[stepIndex] : null;
  const currentLine = current ? current.line : null;


  const pageStyle = { minHeight: "100vh", background: "linear-gradient(180deg,#071021,#04202d)", color: "#e6fbff", padding: 18, fontFamily: "Inter, system-ui, Arial" };
  const cardStyle = { background: "rgba(8,15,20,0.6)", border: "1px solid rgba(8,20,24,0.5)", borderRadius: 10, padding: 12 };

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 10 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>🌲 AVL Tree Visualizer</h1>
          <div style={{ color: "#9de6de", fontSize: 13, marginTop: 6 }}>Insert / Delete / Trace — BF shown in green</div>
        </header>

        {/* toolbar */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 12, flexWrap: "wrap" }}>
          <input
            type="number"
            placeholder="value"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #253239", background: "#0a1418", color: "#fff", width: 120 }}
          />
          <button onClick={handleInsert} style={{ padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: "#0aa6b2", color: "#021418" }}>Insert</button>
          <button onClick={handleDelete} style={{ padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: "#ff6b6b", color: "#fff" }}>Delete</button>
          <button onClick={handleClear} style={{ padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: "#6b7280", color: "#fff" }}>Clear</button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 20 }}>
            <label style={{ fontSize: 13, color: "#bfeef7" }}>Speed</label>
            <input type="range" min="200" max="1400" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
            <span style={{ color: "#bfeef7", marginLeft: 6 }}>{speed} ms</span>
            <label style={{ marginLeft: 14, fontSize: 13, color: "#bfeef7" }}>Autoplay</label>
            <input style={{ marginLeft: 6 }} type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />
          </div>
        </div>

        {/* notice */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          {notice && <span style={{ padding: "6px 10px", background: "#053b3b", borderRadius: 6 }}>{notice}</span>}
        </div>

        {/* main layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 18 }}>
          {/* LEFT: canvas */}
          <div style={cardStyle}>
            <div style={{ background: "rgba(3,15,20,0.4)", borderRadius: 8, padding: 8 }}>
              <svg viewBox={`0 0 ${canvasW} ${canvasH}`} width="100%" height={Math.min(canvasH, 740)} preserveAspectRatio="xMidYMid meet">
                {/* edges */}
                {edges.map((e, i) => {
                  const a = nodes.find(n => n.id === e.from);
                  const b = nodes.find(n => n.id === e.to);
                  if (!a || !b) return null;
                  return (
                    <line key={i}
                      x1={a.x} y1={a.y}
                      x2={b.x} y2={b.y}
                      stroke="#4b5563" strokeWidth={2} strokeLinecap="round" />
                  );
                })}

                {/* nodes */}
                {nodes.map(n => (
                  <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                    <circle r={22} fill="#071f24" stroke="#06b6d4" strokeWidth={2} />
                    <text x={0} y={6} textAnchor="middle" fill="#ffffff" fontSize={14} fontWeight="700">{n.val}</text>
                    <text x={0} y={36} textAnchor="middle" fill="#34d399" fontSize={12} fontWeight="700">BF: {n.bf}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* RIGHT: pseudocode & trace */}
          <aside style={{ ...cardStyle, height: "760px", overflow: "auto" }}>
            <div style={{ marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: "#aeeff4" }}>Algorithm & Trace</h3>
              <div style={{ fontSize: 13, color: "#bfeef7", marginTop: 6 }}>Pseudocode (current line highlighted) and operation trace.</div>
            </div>

            <section style={{ marginBottom: 12, padding: 8, borderRadius: 8, background: "rgba(2,10,12,0.4)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#dffeff", marginBottom: 6 }}>Pseudocode</div>
              <ol style={{ paddingLeft: 18, color: "#cfeff3" }}>
                {PSEUDOCODE.map((p) => {
                  const active = p.key === currentLine;
                  return (
                    <li key={p.key} style={{ marginBottom: 8, padding: 8, borderRadius: 6, background: active ? "rgba(6,182,212,0.12)" : "transparent", color: active ? "#eaffff" : "#cfeff3" }}>
                      <div style={{ fontWeight: 700 }}>{p.key}</div>
                      <div style={{ fontSize: 12 }}>{p.text}</div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section style={{ marginBottom: 12, padding: 8, borderRadius: 8, background: "rgba(2,10,12,0.35)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, color: "#dffeff" }}>Trace Steps</div>
                <div style={{ fontSize: 12, color: "#bfeef7" }}>Total: {trace.length}</div>
              </div>
              <ul style={{ paddingLeft: 18 }}>
                {trace.length === 0 && <li style={{ color: "#9bdad6" }}>No operations yet. Insert or Delete to generate steps.</li>}
                {trace.map((t, i) => (
                  <li key={i} style={{ marginBottom: 8, padding: 8, borderRadius: 6, background: i === stepIndex ? "rgba(6,182,212,0.12)" : "transparent", color: i === stepIndex ? "#eaffff" : "#cfeff3" }}>
                    <div style={{ fontSize: 12, color: "#9bdad6" }}>Step {i + 1}</div>
                    <div style={{ marginTop: 6 }}>{t.text}</div>
                  </li>
                ))}
              </ul>
            </section>

            <section style={{ padding: 8, borderRadius: 8, background: "rgba(2,10,12,0.25)" }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Legend & Tips</div>
              <div style={{ fontSize: 12, color: "#cfeff3" }}>
                <div>• BF = balance factor = height(left) − height(right)</div>
                <div>• Toolbar above canvas: type a number, press Enter or click Insert.</div>
                <div>• Use Speed + Autoplay to step through the trace automatically.</div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
