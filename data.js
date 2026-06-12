/* FinSight Live — mock/synthetic data
   All values are illustrative for demo purposes only. */
window.FINSIGHT_DATA = {
  kpis: [
    { label: "Revenue",           value: "$48.2M",  delta: "+12.4%",        direction: "up",   tone: "good", note: "Above plan for the period.", spark: [31.2, 33.1, 34.5, 38.8, 42.3, 48.2] },
    { label: "Gross Margin",      value: "63.8%",   delta: "-1.7 pts",      direction: "down", tone: "warn", note: "Pressure in select segments.", spark: [62.1, 62.4, 63.0, 63.5, 63.7, 63.8] },
    { label: "Pipeline",          value: "$126.5M", delta: "+8.9%",         direction: "up",   tone: "info", note: "Healthy coverage vs. quota.", spark: [98.0, 104.2, 110.5, 116.3, 121.4, 126.5] },
    { label: "Forecast Accuracy", value: "91.2%",   delta: "+3.1 pts",      direction: "up",   tone: "good", note: "Improved vs. prior quarter.", spark: [84.8, 86.9, 87.6, 88.7, 90.1, 91.2] },
    { label: "Operating Cost",    value: "$18.4M",  delta: "+4.2%",         direction: "up",   tone: "warn", note: "Cloud infra trending up.", spark: [16.5, 16.9, 17.2, 17.6, 18.0, 18.4] },
    { label: "Risk Score",        value: "MED",     delta: "6 active",      direction: "flat", tone: "warn", note: "Reviewed weekly.", spark: [8, 7, 7, 6, 6, 6] },
    { label: "Forecast Variance", value: "+2.4%",   delta: "vs plan",       direction: "up",   tone: "good", note: "Tracking ahead of FY26 plan.", spark: [-1.1, -0.6, 0.2, 0.9, 1.7, 2.4] }
  ],

  trend: {
    months: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"],
    revenue:  [31.2, 33.1, 34.5, 38.8, 42.3, 48.2],
    margin:   [62.1, 62.4, 63.0, 63.5, 63.7, 63.8],
    pipeline: [98.0, 104.2, 110.5, 116.3, 121.4, 126.5]
  },
  trendSeries: {
    revenue:  { label: "REV ($M)",  unit: "M", prefix: "$", color: "amber" },
    margin:   { label: "MGN (%)",   unit: "%", prefix: "",  color: "green" },
    pipeline: { label: "PIPE ($M)", unit: "M", prefix: "$", color: "cyan"  }
  },

  regions: [
    { name: "NORTH AMERICA",        revenue: "$18.6M", growth: "+14.2%", margin: "65.1%", forecast: "94%", status: "On Track" },
    { name: "EUROPE",               revenue: "$11.4M", growth: "+8.1%",  margin: "61.2%", forecast: "89%", status: "Watch" },
    { name: "ASIA PACIFIC",         revenue: "$9.8M",  growth: "+16.5%", margin: "64.0%", forecast: "92%", status: "On Track" },
    { name: "LATIN AMERICA",        revenue: "$4.7M",  growth: "+5.6%",  margin: "58.9%", forecast: "84%", status: "At Risk" },
    { name: "MIDDLE EAST & AFRICA", revenue: "$3.7M",  growth: "+10.8%", margin: "60.4%", forecast: "87%", status: "Watch" }
  ],

  products: [
    { name: "CLOUD SOLUTIONS",       revenue: "$19.4M", growth: "+18.2%", adoption: 84 },
    { name: "SECURITY",              revenue: "$11.8M", growth: "+12.5%", adoption: 71 },
    { name: "AI SERVICES",           revenue: "$9.7M",  growth: "+34.6%", adoption: 62 },
    { name: "BUSINESS APPLICATIONS", revenue: "$7.3M",  growth: "+4.1%",  adoption: 58 }
  ],

  risks: [
    { text: "Margin compression in Latin America",           severity: "High" },
    { text: "Forecast confidence below threshold in Europe",  severity: "Medium" },
    { text: "Operating cost growth in cloud infrastructure",  severity: "Medium" },
    { text: "Pipeline concentration in top 3 accounts",       severity: "Low" }
  ],

  insights: [
    [
      "Revenue growth is strongest in APAC and North America.",
      "Margin pressure is concentrated in Latin America and selected business applications.",
      "Pipeline quality improved, but concentration risk remains.",
      "Recommended next step: review region-level margin drivers and validate forecast assumptions."
    ],
    [
      "AI Services is the fastest-growing product line at +34.6% YoY.",
      "Europe forecast confidence remains below the 90% threshold and warrants closer review.",
      "Top 3 accounts represent an outsized share of pipeline — diversification recommended.",
      "Recommended next step: schedule a deep-dive on AI Services capacity and EMEA forecast hygiene."
    ],
    [
      "Operating cost growth of +4.2% is being driven primarily by cloud infrastructure.",
      "Latin America status flipped to 'At Risk' due to combined margin and forecast pressure.",
      "Forecast accuracy improved +3.1 points — operating cadence is paying off.",
      "Recommended next step: validate cloud cost optimization initiatives and reforecast LATAM."
    ],
    [
      "Pipeline is up +8.9% but concentrated in three accounts representing >40% of total.",
      "Margin watch persists; Business Applications is the segment dragging the blended rate.",
      "APAC continues to outperform with +16.5% growth and 92% forecast accuracy.",
      "Recommended next step: build a contingency plan for top-account concentration risk."
    ]
  ],

  // Synthetic ticker symbols for the marquee
  ticker: [
    { sym: "REV",  val: "48.20M",  chg: "+12.4%" },
    { sym: "MGN",  val: "63.80%",  chg: "-1.7" },
    { sym: "PIPE", val: "126.50M", chg: "+8.9%" },
    { sym: "FCST", val: "91.20%",  chg: "+3.1" },
    { sym: "OPEX", val: "18.40M",  chg: "+4.2%" },
    { sym: "CASH", val: "212.40M", chg: "+1.8%" },
    { sym: "EBIT", val: "11.30M",  chg: "+6.5%" },
    { sym: "NAM",  val: "18.60M",  chg: "+14.2%" },
    { sym: "EUR",  val: "11.40M",  chg: "+8.1%" },
    { sym: "APAC", val: "9.80M",   chg: "+16.5%" },
    { sym: "LATAM",val: "4.70M",   chg: "+5.6%" },
    { sym: "MEA",  val: "3.70M",   chg: "+10.8%" },
    { sym: "CLOUD",val: "19.40M",  chg: "+18.2%" },
    { sym: "SEC",  val: "11.80M",  chg: "+12.5%" },
    { sym: "AI",   val: "9.70M",   chg: "+34.6%" },
    { sym: "BIZ",  val: "7.30M",   chg: "+4.1%" }
  ]
};
