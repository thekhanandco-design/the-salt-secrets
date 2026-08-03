"use client";

import { useMemo, useState } from "react";

type CountryPoint = { name: string; value: number };

const coords: Record<string, [number, number]> = {
  Pakistan:[69,57], India:[73,59], China:[78,47], "United States":[23,43], "United States of America":[23,43], Canada:[20,28], Mexico:[20,55], Brazil:[36,76], Argentina:[34,91], "United Kingdom":[47,36], UK:[47,36], France:[49,43], Germany:[52,39], Spain:[46,48], Portugal:[44,47], Italy:[53,47], Turkey:[59,49], UAE:[64,58], "United Arab Emirates":[64,58], "Saudi Arabia":[61,59], Bahrain:[63,56], Qatar:[64,57], Oman:[66,61], Egypt:[56,59], Nigeria:[51,70], Kenya:[59,74], "South Africa":[57,91], Russia:[70,29], Japan:[89,49], Australia:[87,84], Indonesia:[80,74], Malaysia:[78,69], Singapore:[79,72], Bangladesh:[75,59], "Sri Lanka":[73,68], Afghanistan:[68,53], Iran:[64,52], Iraq:[61,53], Netherlands:[50,38], Belgium:[49,40], Switzerland:[51,43], Austria:[53,42], Poland:[55,38], Sweden:[52,26], Norway:[49,25], Denmark:[51,32], Ireland:[45,36], Greece:[56,49], Morocco:[46,57], Algeria:[49,58], Ghana:[48,69], Tanzania:[59,78], Korea:[85,49], "South Korea":[85,49], Thailand:[77,64], Vietnam:[81,61], Philippines:[85,67], "New Zealand":[96,90]
};

export default function WorldTrafficMap({ countries, realtime = false }: { countries: CountryPoint[]; realtime?: boolean }) {
  const [active, setActive] = useState<CountryPoint | null>(null);
  const rows = useMemo(() => countries.filter(c => c.value > 0).slice(0, 18), [countries]);
  const max = Math.max(1, ...rows.map(r => r.value));
  return <div className="geo-map" aria-label={realtime ? "Realtime GA4 geography map" : "GA4 geography map"}>
    <svg viewBox="0 0 1000 500" role="img">
      <defs>
        <linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#eaf0f8"/><stop offset="1" stopColor="#dce6f3"/></linearGradient>
        <radialGradient id="ocean"><stop stopColor="#ffffff"/><stop offset="1" stopColor="#f4f7fb"/></radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="1000" height="500" rx="26" fill="url(#ocean)"/>
      <g fill="url(#land)" stroke="#cbd8e8" strokeWidth="2">
        <path d="M56 102L116 48l90 10 69 46-22 48-55 17-24 42-48 1-33-36-48-24z"/>
        <path d="M212 236l52 29 31 67-20 93-36 43-25-64-20-62-31-45z"/>
        <path d="M403 88l62-35 89 9 52 31 48-8 70 29 85 6 92 48-22 43-59-2-36 31-48-10-56 24-54-29-56 11-42-34-49 6-34-38-40 4-31-37z"/>
        <path d="M467 222l73 8 49 52-7 93-46 78-56-13-32-69 15-68-32-42z"/>
        <path d="M803 341l63-20 59 37-2 56-66 31-57-37z"/>
        <path d="M914 445l24-8 21 14-17 18-28-7z"/>
      </g>
      <g opacity=".45" stroke="#dce5f0" strokeWidth="1">{[100,200,300,400].map(y=><line key={y} x1="0" x2="1000" y1={y} y2={y}/>)}{[200,400,600,800].map(x=><line key={x} y1="0" y2="500" x1={x} x2={x}/>)}</g>
      {rows.map((c, index) => { const p = coords[c.name] || [50 + (index%7)*6, 30 + (index%5)*11]; const x=p[0]*10, y=p[1]*5; const r=5 + (c.value/max)*9; return <g key={`${c.name}-${index}`} transform={`translate(${x} ${y})`} onMouseEnter={()=>setActive(c)} onMouseLeave={()=>setActive(null)} className="geo-point">
        <circle r={r+8} fill="#ef4f86" opacity=".11"><animate attributeName="r" values={`${r+4};${r+13};${r+4}`} dur={`${1.8+index*.08}s`} repeatCount="indefinite"/></circle>
        <circle r={r} fill="#d9366f" stroke="white" strokeWidth="3" filter="url(#glow)"/>
      </g>})}
    </svg>
    {active && <div className="geo-tooltip"><b>{active.name}</b><span>{active.value} {realtime ? "active now" : "active users"}</span></div>}
    {!rows.length && <div className="geo-empty">No country activity returned by GA4 for this period.</div>}
  </div>;
}
