export interface MaraJob {
  id: string;
  position: string;
  company: string;
  pay: string;
  payMin?: number;
  payMax?: number;
  location: string;
  type: string;
  snippet: string;
  jd: string;
  requirements: number;
  atomicFacts: string[];
}

export interface B4MockData {
  supported: number;
  total: number;
  pct: number;
  evidenceCount?: number;
  partial?: number;
  narrowed?: number;
  evidence: { req: string; disposition: 'PASS' | 'QUALIFIED_BOUNDED' | 'UNRESOLVED' | 'CONTRADICTED'; evidenceCount: number }[];
}

export interface B5MockData {
  before: number;
  after: number;
  improvement: number;
  strategy: string;
  upliftNote?: string;
  prismOwner: string;
  geometry: string;
  emphasis: Record<string, number>;
  resumeHtml: string;
  sendMarkdown: string;
}

export const INITIAL_MARA_JOBS: MaraJob[] = [
  {
    id: "j01",
    position: "General Manager / Operating Partner",
    company: "Andrea's Chop House",
    pay: "$78k–$92k",
    payMin: 78000,
    payMax: 92000,
    location: "Oakland County, MI",
    type: "Full-time • On-site",
    snippet: "Lead P&L, labor model, guest recovery for high-volume independent.",
    jd: "Own controllable P&L lines, labor variance, COGS, service execution. 4+ years GM, multi-unit exposure preferred. P&L accountability required.",
    requirements: 24,
    atomicFacts: [
      "Own controllable P&L lines and labor variance model.",
      "Manage food cost and COGS control <28.4%.",
      "Lead high-volume service execution and guest recovery.",
      "4+ years General Manager experience required (*).",
      "Multi-unit oversight exposure preferred.",
      "P&L accountability and team development across 3 locations."
    ]
  },
  {
    id: "j02",
    position: "Restaurant AGM",
    company: "Method Hospitality",
    pay: "$72k–$85k",
    payMin: 72000,
    payMax: 85000,
    location: "Detroit, MI 48226",
    type: "Full-time • On-site",
    snippet: "Support GM in high-volume service execution and team development.",
    jd: "High-volume service execution, opening/closing, team coaching, floor leadership, guest standards. 2+ years AGM or KM.",
    requirements: 27,
    atomicFacts: [
      "Support GM in daily service choreography and opening/closing.",
      "Lead team coaching and floor leadership standards.",
      "FOH and BOH coordination in luxury boutique setting.",
      "2+ years AGM or KM experience required (*).",
      "Guest satisfaction score tracking and service recovery."
    ]
  },
  {
    id: "j03",
    position: "General Manager",
    company: "Fern Hill Golf Club",
    pay: "$50k–$55k",
    payMin: 50000,
    payMax: 55000,
    location: "Detroit, MI",
    type: "Full-time",
    snippet: "Golf club F&B + events + daily ops.",
    jd: "Oversee clubhouse operations, beverage cost, events, member experience. Golf or country club experience preferred.",
    requirements: 22,
    atomicFacts: [
      "Oversee banquet and private event operations.",
      "Control beverage cost and bar inventory.",
      "Manage clubhouse member hospitality experience.",
      "Country club or golf venue experience preferred."
    ]
  },
  {
    id: "j04",
    position: "Food and Beverage Director",
    company: "Rev'd Up Fun",
    pay: "$70k–$84k",
    payMin: 70000,
    payMax: 84000,
    location: "Oakland County, MI",
    type: "Full-time",
    snippet: "Lead F&B strategy for FEC with bar, kitchen, events.",
    jd: "Direct all F&B operations, P&L, safety, vendor management. 3+ years F&B leadership in high-volume.",
    requirements: 24,
    atomicFacts: [
      "Direct FEC entertainment venue food and beverage strategy.",
      "P&L ownership and vendor cost renegotiation for $2.4M unit.",
      "Safety, compliance, and amusement center operations.",
      "3+ years F&B multi-outlet leadership required (*)."
    ]
  },
  {
    id: "j05",
    position: "Aquatics Manager",
    company: "Aqua Tots",
    pay: "$50k–$55k",
    payMin: 50000,
    payMax: 55000,
    location: "Detroit, MI",
    type: "Full-time",
    snippet: "Operations, staffing, safety compliance for aquatics center.",
    jd: "Manage swim school operations, instructor staffing, scheduling, compliance, parent experience.",
    requirements: 19,
    atomicFacts: [
      "Manage instructor staffing and scheduling.",
      "Water safety compliance and certification audits (*).",
      "Parent communication and enrollment experience."
    ]
  },
  {
    id: "j06",
    position: "Operations Manager",
    company: "North Peak Hospitality",
    pay: "$65k–$72k",
    payMin: 65000,
    payMax: 72000,
    location: "Oakland County, MI",
    type: "Full-time",
    snippet: "Multi-unit ops support and cost variance control.",
    jd: "Drive SOP compliance, labor optimization, cost variance, training. Multi-unit preferred.",
    requirements: 26,
    atomicFacts: [
      "Drive SOP compliance across multi-unit group.",
      "Labor optimization and shift schedule variance reduction.",
      "Deliver leadership training and managerial onboarding.",
      "Multi-unit restaurant experience preferred."
    ]
  },
  {
    id: "j07",
    position: "GM - Fast Casual",
    company: "Bloom Kitchen Co",
    pay: "$58k–$64k",
    payMin: 58000,
    payMax: 64000,
    location: "Detroit, MI 48226",
    type: "Full-time",
    snippet: "Owner-operator mindset for fast casual growth.",
    jd: "Own P&L, QSC, hiring, local marketing. Fast casual experience required.",
    requirements: 21,
    atomicFacts: [
      "Owner-operator mindset for new store expansion.",
      "QSC audits and throughput acceleration.",
      "Hiring, onboarding, and local store marketing.",
      "Fast casual management experience required (*)."
    ]
  },
  {
    id: "j08",
    position: "Assistant General Manager",
    company: "The Apparatus Room",
    pay: "$52k–$58k",
    payMin: 52000,
    payMax: 58000,
    location: "Detroit, MI",
    type: "Full-time",
    snippet: "Craft hospitality AGM, floor leadership.",
    jd: "Support GM, service standards, beverage knowledge, team development.",
    requirements: 20,
    atomicFacts: [
      "Deliver craft hospitality guest standards.",
      "Sommelier and craft beverage knowledge.",
      "Team floor coaching during high-volume dinner service."
    ]
  },
  {
    id: "j09",
    position: "Director of Operations",
    company: "Metro Eats Group",
    pay: "$85k–$95k",
    payMin: 85000,
    payMax: 95000,
    location: "Oakland County, MI",
    type: "Full-time",
    snippet: "Portfolio P&L, new store openings.",
    jd: "Lead ops for 6-unit portfolio, P&L, openings, leadership bench.",
    requirements: 30,
    atomicFacts: [
      "Lead operations for 6-unit regional portfolio.",
      "Total portfolio P&L accountability ($14M+ gross).",
      "New store opening playbook execution and bench building.",
      "Executive stakeholder reporting and capital allocation."
    ]
  },
  {
    id: "j10",
    position: "Kitchen Manager",
    company: "Andrea's Chop House",
    pay: "$48k–$55k",
    payMin: 48000,
    payMax: 55000,
    location: "Oakland County, MI",
    type: "Full-time",
    snippet: "BOH systems and cost control.",
    jd: "Manage BOH labor, COGS, inventory, food safety, team.",
    requirements: 18,
    atomicFacts: [
      "BOH labor scheduling and line production.",
      "Food cost and protein waste mitigation.",
      "ServSafe kitchen food safety compliance (*)."
    ]
  },
  {
    id: "j11",
    position: "Service Director",
    company: "Method Hospitality",
    pay: "$60k–$68k",
    payMin: 60000,
    payMax: 68000,
    location: "Detroit, MI",
    type: "Full-time",
    snippet: "Service systems for luxury boutique.",
    jd: "Service choreography, training, guest recovery, standards.",
    requirements: 23,
    atomicFacts: [
      "Service choreography and VIP hospitality protocol.",
      "Develop training modules for service team.",
      "Guest recovery and review sentiment management."
    ]
  },
  {
    id: "j12",
    position: "Hospitality Manager",
    company: "Rev'd Up Fun",
    pay: "$55k–$60k",
    payMin: 55000,
    payMax: 60000,
    location: "Oakland County, MI",
    type: "Full-time",
    snippet: "Guest experience + F&B ops.",
    jd: "Guest experience lead, team scheduling, safety, upsell.",
    requirements: 22,
    atomicFacts: [
      "Lead venue guest experience ambassadors.",
      "Team scheduling and labor coverage.",
      "Event package upsell and party execution."
    ]
  }
];

export const MARA_B4_PROFILES: Record<string, B4MockData> = {
  j01: {
    supported: 16,
    total: 24,
    pct: 77,
    evidence: [
      { req: "4+ years General Manager (*)", disposition: "PASS", evidenceCount: 4 },
      { req: "Controllable P&L lines (COGS/Labor)", disposition: "PASS", evidenceCount: 3 },
      { req: "Multi-unit oversight", disposition: "PASS", evidenceCount: 3 },
      { req: "High-volume service execution", disposition: "PASS", evidenceCount: 4 },
      { req: "Full unit capex / real estate", disposition: "QUALIFIED_BOUNDED", evidenceCount: 1 },
      { req: "Liquor license regulatory holder", disposition: "UNRESOLVED", evidenceCount: 0 }
    ]
  },
  j02: {
    supported: 19,
    total: 27,
    pct: 68,
    evidence: [
      { req: "2+ years AGM or KM (*)", disposition: "PASS", evidenceCount: 3 },
      { req: "Service choreography & training", disposition: "PASS", evidenceCount: 4 },
      { req: "Floor leadership standards", disposition: "PASS", evidenceCount: 2 },
      { req: "Liquor compliance operations", disposition: "QUALIFIED_BOUNDED", evidenceCount: 1 },
      { req: "Concept development build-out", disposition: "UNRESOLVED", evidenceCount: 0 }
    ]
  },
  j03: {
    supported: 14,
    total: 22,
    pct: 64,
    evidence: [
      { req: "Banquet & event leadership", disposition: "PASS", evidenceCount: 2 },
      { req: "Beverage inventory control", disposition: "PASS", evidenceCount: 2 },
      { req: "Country club membership protocol", disposition: "QUALIFIED_BOUNDED", evidenceCount: 1 }
    ]
  },
  j04: {
    supported: 21,
    total: 24,
    pct: 88,
    evidence: [
      { req: "3+ years high-volume F&B (*)", disposition: "PASS", evidenceCount: 4 },
      { req: "Multi-outlet P&L ownership", disposition: "PASS", evidenceCount: 4 },
      { req: "Vendor cost renegotiation", disposition: "PASS", evidenceCount: 3 },
      { req: "Amusement arcade tech maintenance", disposition: "UNRESOLVED", evidenceCount: 0 }
    ]
  },
  j06: {
    supported: 18,
    total: 26,
    pct: 84,
    evidence: [
      { req: "SOP compliance at scale", disposition: "PASS", evidenceCount: 4 },
      { req: "Labor optimization variance", disposition: "PASS", evidenceCount: 3 },
      { req: "Managerial onboarding bench", disposition: "PASS", evidenceCount: 3 }
    ]
  },
  j09: {
    supported: 22,
    total: 30,
    pct: 81,
    evidence: [
      { req: "Multi-unit portfolio management (*)", disposition: "PASS", evidenceCount: 5 },
      { req: "Portfolio P&L variance control", disposition: "PASS", evidenceCount: 4 },
      { req: "New store openings bench", disposition: "PASS", evidenceCount: 3 }
    ]
  }
};

export const MARA_B5_PROFILES: Record<string, B5MockData> = {
  j01: {
    before: 77,
    after: 82,
    improvement: 5,
    strategy: "Lead with multi-unit ops and cost control; position P&L at controllable lines (labor, COGS).",
    prismOwner: "Independent Staffing-Firm Owner",
    geometry: "leadership-spine • ops-forward • proof-stacked",
    emphasis: { Operations: 34, Leadership: 28, Performance: 18, Experience: 10, Skills: 6, Education: 2, Certifications: 2 },
    resumeHtml: `
      <div style="font-family:Inter,sans-serif;color:#111827;line-height:1.5;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111827;padding-bottom:12px;margin-bottom:20px;">
          <div>
            <h1 style="font-size:24px;font-weight:700;margin:0;">Alex Rivera</h1>
            <p style="font-size:13px;color:#4B5563;margin:4px 0 0 0;">General Manager / Operating Partner • Multi-Unit Leader • Oakland County, MI • (248) 555-0142 • a.rivera@email.com</p>
          </div>
          <span style="font-size:11px;font-family:monospace;background:#DCFCE7;color:#166534;padding:4px 8px;border-radius:4px;font-weight:600;">MATCH: 82% (B5)</span>
        </div>
        <div style="margin-bottom:18px;">
          <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#6B7280;margin:0 0 6px 0;">Executive Summary</h2>
          <p style="font-size:13px;color:#1F2937;margin:0;">High-impact hospitality executive with 7+ years directing multi-unit independent dining operations. Proven mastery over controllable P&L lines ($4.2M scope), driving labor variance down 3.2% while expanding gross operating margins. Built high-retention management teams across 3 venues.</p>
        </div>
        <div style="margin-bottom:18px;">
          <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#6B7280;margin:0 0 6px 0;">Professional Experience</h2>
          <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;font-weight:600;font-size:13px;">
              <span>General Manager — North Peak Hospitality Group</span>
              <span>2021 — Present</span>
            </div>
            <p style="font-size:12px;color:#4B5563;margin:2px 0 6px 0;">Oakland County, MI • Direct oversight of 3 high-volume concepts</p>
            <ul style="font-size:12.5px;color:#374151;margin:0;padding-left:18px;">
              <li>Owned controllable P&L lines across $3.8M volume, reducing COGS from 31.2% to 28.4% via rigorous inventory audits and direct purveyor renegotiation.</li>
              <li>Engineered dynamic labor schedule matrix, slashing overtime variance to under 1.2% while sustaining a 94% guest satisfaction benchmark.</li>
              <li>Trained and promoted 11 shift supervisors to assistant general manager roles across portfolio locations.</li>
            </ul>
          </div>
        </div>
        <div>
          <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#6B7280;margin:0 0 6px 0;">Core Competencies & Evidence Links</h2>
          <p style="font-size:12px;font-family:monospace;color:#4B5563;margin:0;">• Operations: Controllable P&L, Food Cost & Labor Models, Supply Chain Management<br/>• Truth Gate Audit: 16/24 PASS (t.id.org, t.gate.g01, t.duty.d01-d06 verified)<br/>• Strategic Prism: Independent Staffing-Firm Owner (34% Operations emphasis)</p>
        </div>
      </div>
    `,
    sendMarkdown: `# ALEX RIVERA
General Manager / Operating Partner — Andrea's Chop House
Location: Oakland County, MI | Phone: (248) 555-0142 | Email: a.rivera@email.com

## SUMMARY
General Manager with 7+ years leading high-volume dining and multi-unit hospitality. Owned controllable P&L across $3.8M scope, reducing COGS to 28.4% and holding labor variance under 1.2%.

## EXPERIENCE
### General Manager — North Peak Hospitality Group | 2021—Present | Oakland County, MI
- Owned controllable P&L lines, reducing COGS from 31.2% to 28.4% via direct vendor renegotiations.
- Decreased labor variance to 1.2% with algorithmic shift matrix while managing 55+ team members.
- Directed floor service execution, guest recovery protocols, and opening rollout for flagship location.

### Assistant General Manager — Method Hospitality | 2018—2021 | Detroit, MI
- Led daily FOH/BOH coordination and service training; achieved 92% audit compliance.
- Supported GM on inventory costing, vendor logistics, and staff development.

## VERIFIED EVIDENCE LEDGER
- t.gate.g01: 4+ years GM experience -> PASS (Verified 5.5y)
- t.duty.d01: Controllable P&L lines -> PASS (Labor & COGS documented)
- t.duty.d02: High-volume service execution -> PASS (NPS 94%)
- B4 Status: 16/24 (77%) -> B5 Optimized: 82% (+5% uplift)
- Prism Alignment: Independent Staffing-Firm Owner (Operations 34%, Leadership 28%)
`
  },
  j02: {
    before: 68,
    after: 70,
    improvement: 2,
    strategy: "Lead with high-volume service execution and team coaching; narrow liquor compliance to ops.",
    prismOwner: "Sales Headhunter",
    geometry: "execution-first • team-centric",
    emphasis: { Operations: 30, Leadership: 35, Performance: 15, Experience: 12, Skills: 5, Education: 2, Certifications: 1 },
    resumeHtml: `
      <div style="font-family:Inter,sans-serif;color:#111827;">
        <h1>Alex Rivera — Restaurant AGM</h1>
        <p>Method Hospitality • Detroit, MI • Match: 70% (B5)</p>
        <p>High-volume service leader specialized in FOH choreography, team coaching, and guest recovery.</p>
      </div>
    `,
    sendMarkdown: `# ALEX RIVERA — RESTAURANT AGM
Method Hospitality | Detroit, MI | Match: 70% (+2% uplift)
Strategy: High-volume service choreography and floor leadership.
`
  },
  j04: {
    before: 88,
    after: 92,
    improvement: 4,
    strategy: "Lead with entertainment venue F&B turnaround, safety compliance, and vendor cost renegotiation.",
    prismOwner: "Casting Director",
    geometry: "dominant_plus_secondary",
    emphasis: { Operations: 40, Leadership: 25, Performance: 20, Experience: 10, Skills: 3, Education: 1, Certifications: 1 },
    resumeHtml: `
      <div style="font-family:Inter,sans-serif;color:#111827;">
        <h1>Alex Rivera — Food & Beverage Director</h1>
        <p>Rev'd Up Fun • Oakland County, MI • Match: 92% (B5)</p>
        <p>Directed $2.4M multi-outlet entertainment venue F&B program. 4+ years high-volume family entertainment center leadership.</p>
      </div>
    `,
    sendMarkdown: `# ALEX RIVERA — F&B DIRECTOR
Rev'd Up Fun | Oakland County, MI | Match: 92% (+4% uplift)
P&L turnaround, vendor renegotiation, safety & amusement compliance verified.
`
  }
};