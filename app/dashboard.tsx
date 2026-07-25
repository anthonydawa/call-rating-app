"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CallEvaluation, RubricScores } from "@/lib/types";

type Props = { initialData: CallEvaluation[]; mode: "live" | "demo" };
type Tab = "overview" | "calls" | "agents";
const scoreKeys: { key: keyof RubricScores; label: string }[] = [
  { key: "opening", label: "Opening" }, { key: "discovery", label: "Discovery" },
  { key: "communication", label: "Communication" }, { key: "objection_handling", label: "Objection handling" },
  { key: "closing", label: "Closing" },
];
const fmtDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
const fmtDate = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
const initials = (name: string) => name.split(" ").map((part) => part[0]).join("").slice(0, 2);
const scoreClass = (score: number) => score >= 85 ? "great" : score >= 75 ? "good" : "needs-work";

export default function Dashboard({ initialData, mode }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [query, setQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [selected, setSelected] = useState<CallEvaluation | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const filtered = useMemo(() => initialData.filter((call) => {
    const matchesAgent = agentFilter === "all" || call.agent_name === agentFilter;
    return matchesAgent && `${call.agent_name} ${call.contact_name} ${call.summary}`.toLowerCase().includes(query.toLowerCase());
  }), [initialData, query, agentFilter]);
  const agents = useMemo(() => {
    const grouped = new Map<string, CallEvaluation[]>();
    initialData.forEach((call) => grouped.set(call.agent_name, [...(grouped.get(call.agent_name) || []), call]));
    return Array.from(grouped, ([name, calls]) => ({
      name, calls: calls.length,
      score: Math.round(calls.reduce((sum, call) => sum + call.overall_score, 0) / calls.length),
      wins: calls.filter((call) => call.outcome === "won").length,
      positive: calls.filter((call) => call.sentiment === "positive").length,
    })).sort((a, b) => b.score - a.score);
  }, [initialData]);
  const average = initialData.length ? Math.round(initialData.reduce((sum, call) => sum + call.overall_score, 0) / initialData.length) : 0;
  const positiveRate = initialData.length ? Math.round(initialData.filter((call) => call.sentiment === "positive").length / initialData.length * 100) : 0;
  const winRate = initialData.length ? Math.round(initialData.filter((call) => call.outcome === "won").length / initialData.length * 100) : 0;
  const averageDuration = initialData.length ? Math.round(initialData.reduce((sum, call) => sum + call.duration_seconds, 0) / initialData.length) : 0;
  const rubricAverages = scoreKeys.map(({ key, label }) => ({ label, value: initialData.length ? Math.round(initialData.reduce((sum, call) => sum + call.rubric_scores[key], 0) / initialData.length) : 0 }));
  const refresh = () => startTransition(() => router.refresh());

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setTab("overview")} aria-label="CallLens home"><span className="brand-mark"><i/><i/><i/></span><span>CallLens</span></button>
      <nav aria-label="Main navigation">
        <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}><span>⌂</span> Overview</button>
        <button className={tab === "calls" ? "active" : ""} onClick={() => setTab("calls")}><span>◫</span> All calls</button>
        <button className={tab === "agents" ? "active" : ""} onClick={() => setTab("agents")}><span>♙</span> Agents</button>
      </nav>
      <div className="sidebar-foot"><div className="workspace-avatar">NS</div><div><strong>Northstar Sales</strong><span>MVP workspace</span></div><button aria-label="Workspace menu">•••</button></div>
    </aside>
    <main>
      <header className="topbar"><div><span className={`status-dot ${mode}`} />{mode === "live" ? "Live data" : "Demo data"}</div><button className="refresh" onClick={refresh} disabled={isPending}>{isPending ? "Refreshing…" : "↻  Refresh"}</button><div className="user-avatar">AM</div></header>
      <div className="content">
        <section className="page-heading">
          <div><p className="eyebrow">{tab === "overview" ? "QUALITY OVERVIEW" : tab === "calls" ? "CONVERSATION LIBRARY" : "TEAM PERFORMANCE"}</p><h1>{tab === "overview" ? "Your team at a glance" : tab === "calls" ? "Every conversation, scored" : "Agent performance"}</h1><p>{tab === "overview" ? "See what’s working and where your team can improve." : tab === "calls" ? "Search, review, and learn from every customer conversation." : "Compare coaching signals and recognize your strongest performers."}</p></div>
          <div className="period-control"><button>Last 30 days</button><button>⌄</button></div>
        </section>
        {tab !== "agents" && <section className="metrics-grid" aria-label="Key metrics">
          <Metric label="Average quality score" value={`${average}`} suffix="/100" delta="+4.2%" tone="mint" />
          <Metric label="Calls analyzed" value={`${initialData.length}`} delta="All processed" tone="blue" />
          <Metric label="Positive sentiment" value={`${positiveRate}%`} delta="+6.1%" tone="purple" />
          <Metric label="Conversion rate" value={`${winRate}%`} delta={`${fmtDuration(averageDuration)} avg. call`} tone="orange" />
        </section>}
        {tab === "overview" && <>
          <section className="overview-grid">
            <div className="panel performance-panel"><div className="panel-title"><div><h2>Quality breakdown</h2><p>Average score by coaching category</p></div><span className="score-pill great">{average} overall</span></div><div className="rubric-list">{rubricAverages.map((item) => <div className="rubric-row" key={item.label}><span>{item.label}</span><div className="bar"><i style={{ width: `${item.value}%` }} /></div><strong>{item.value}</strong></div>)}</div></div>
            <div className="panel leaders-panel"><div className="panel-title"><div><h2>Team leaderboard</h2><p>Ranked by quality score</p></div><button onClick={() => setTab("agents")}>View all →</button></div><div className="leader-list">{agents.map((agent, index) => <button key={agent.name} onClick={() => { setAgentFilter(agent.name); setTab("calls"); }}><span className="rank">{index + 1}</span><span className={`agent-avatar avatar-${index % 3}`}>{initials(agent.name)}</span><span className="leader-name"><strong>{agent.name}</strong><small>{agent.calls} calls reviewed</small></span><strong className={`leader-score ${scoreClass(agent.score)}`}>{agent.score}</strong></button>)}</div></div>
          </section>
          <CallTable calls={filtered.slice(0, 5)} agents={agents.map((a) => a.name)} query={query} setQuery={setQuery} agentFilter={agentFilter} setAgentFilter={setAgentFilter} onSelect={setSelected} onViewAll={() => setTab("calls")} compact />
        </>}
        {tab === "calls" && <CallTable calls={filtered} agents={agents.map((a) => a.name)} query={query} setQuery={setQuery} agentFilter={agentFilter} setAgentFilter={setAgentFilter} onSelect={setSelected} />}
        {tab === "agents" && <section className="agent-grid">{agents.map((agent, index) => <article className="agent-card" key={agent.name}><div className="agent-card-top"><span className={`agent-avatar large avatar-${index % 3}`}>{initials(agent.name)}</span><span className={`score-ring ${scoreClass(agent.score)}`}>{agent.score}</span></div><h2>{agent.name}</h2><p>{agent.calls} calls analyzed</p><div className="agent-stats"><div><span>Positive</span><strong>{Math.round(agent.positive / agent.calls * 100)}%</strong></div><div><span>Won</span><strong>{agent.wins}</strong></div></div><button onClick={() => { setAgentFilter(agent.name); setTab("calls"); }}>Review calls <span>→</span></button></article>)}</section>}
      </div>
    </main>
    {selected && <CallDetail call={selected} onClose={() => setSelected(null)} />}
  </div>;
}

function Metric({ label, value, suffix, delta, tone }: { label: string; value: string; suffix?: string; delta: string; tone: string }) {
  return <article className={`metric-card ${tone}`}><div className="metric-icon">{tone === "mint" ? "↗" : tone === "blue" ? "◫" : tone === "purple" ? "♥" : "◎"}</div><p>{label}</p><strong>{value}<small>{suffix}</small></strong><span>{delta}</span></article>;
}

function CallTable({ calls, agents, query, setQuery, agentFilter, setAgentFilter, onSelect, onViewAll, compact = false }: {
  calls: CallEvaluation[]; agents: string[]; query: string; setQuery: (v: string) => void; agentFilter: string; setAgentFilter: (v: string) => void; onSelect: (call: CallEvaluation) => void; onViewAll?: () => void; compact?: boolean;
}) {
  return <section className="panel calls-panel">
    <div className="panel-title calls-title"><div><h2>{compact ? "Recent calls" : "Call history"}</h2><p>{compact ? "Latest analyzed conversations" : `${calls.length} conversations shown`}</p></div><div className="table-tools"><label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search calls…" aria-label="Search calls" /></label><select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} aria-label="Filter by agent"><option value="all">All agents</option>{agents.map((agent) => <option key={agent}>{agent}</option>)}</select>{compact && <button className="view-all" onClick={onViewAll}>View all →</button>}</div></div>
    <div className="table-wrap"><table><thead><tr><th>Contact</th><th>Agent</th><th>Date & duration</th><th>Outcome</th><th>Sentiment</th><th>Score</th><th /></tr></thead><tbody>{calls.map((call, index) => <tr key={call.id} onClick={() => onSelect(call)}>
      <td><div className="contact-cell"><span className={`contact-avatar contact-${index % 4}`}>{initials(call.contact_name)}</span><div><strong>{call.contact_name}</strong><small>{call.direction === "inbound" ? "Inbound call" : "Outbound call"}</small></div></div></td>
      <td><span className="agent-name">{call.agent_name}</span></td><td><strong className="date">{fmtDate(call.started_at)}</strong><small>{fmtDuration(call.duration_seconds)}</small></td>
      <td><span className={`outcome ${call.outcome}`}>{call.outcome.replace("_", " ")}</span></td><td><span className={`sentiment ${call.sentiment}`}><i />{call.sentiment}</span></td><td><span className={`table-score ${scoreClass(call.overall_score)}`}>{call.overall_score}</span></td><td><button aria-label={`View ${call.contact_name} call`}>›</button></td>
    </tr>)}</tbody></table>{!calls.length && <div className="empty-state"><strong>No matching calls</strong><span>Try a different agent or search term.</span></div>}</div>
  </section>;
}

function CallDetail({ call, onClose }: { call: CallEvaluation; onClose: () => void }) {
  const [detailTab, setDetailTab] = useState<"insights" | "transcript" | "data">("insights");
  return <div className="modal-backdrop" onMouseDown={onClose}><aside className="detail-drawer" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Call details">
    <div className="drawer-head"><div><p>CALL REVIEW</p><h2>{call.contact_name}</h2><span>{call.agent_name} · {fmtDate(call.started_at)} · {fmtDuration(call.duration_seconds)}</span></div><button onClick={onClose} aria-label="Close details">×</button></div>
    <div className="drawer-score"><div className={`big-score ${scoreClass(call.overall_score)}`}><strong>{call.overall_score}</strong><span>QUALITY</span></div><div><span className={`outcome ${call.outcome}`}>{call.outcome.replace("_", " ")}</span><span className={`sentiment ${call.sentiment}`}><i />{call.sentiment}</span></div></div>
    <div className="drawer-tabs"><button className={detailTab === "insights" ? "active" : ""} onClick={() => setDetailTab("insights")}>AI insights</button><button className={detailTab === "transcript" ? "active" : ""} onClick={() => setDetailTab("transcript")}>Transcript</button><button className={detailTab === "data" ? "active" : ""} onClick={() => setDetailTab("data")}>Source data</button></div>
    <div className="drawer-body">
      {detailTab === "insights" && <><section><h3>Call summary</h3><p>{call.summary}</p></section><section><h3>Scorecard</h3><div className="mini-rubrics">{scoreKeys.map(({ key, label }) => <div key={key}><span>{label}</span><i><b style={{ width: `${call.rubric_scores[key]}%` }} /></i><strong>{call.rubric_scores[key]}</strong></div>)}</div></section><section className="insight-list strength"><h3>What went well</h3>{call.strengths.map((item) => <p key={item}><span>✓</span>{item}</p>)}</section><section className="insight-list improve"><h3>Coaching opportunities</h3>{call.improvements.map((item) => <p key={item}><span>↗</span>{item}</p>)}</section></>}
      {detailTab === "transcript" && <section><h3>Full transcript</h3><div className="transcript">{call.transcript || "No transcript was provided for this call."}</div></section>}
      {detailTab === "data" && <section><h3>Stored workflow payload</h3><p className="data-note">The original payload is retained so your workflow can be expanded later without losing source information.</p><pre>{JSON.stringify({ external_call_id: call.external_call_id, agent_id: call.agent_id, recording_url: call.recording_url, ai_model: call.ai_model, raw_payload: call.raw_payload }, null, 2)}</pre></section>}
    </div>
  </aside></div>;
}
