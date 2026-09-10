/**
 * Demo cohort — 10 athletes, each with a "story" (a trajectory over the last
 * ~8 weeks). `scripts/seed.ts` turns these into daily_metrics rows so the
 * baselines and domain scores have something real to analyse.
 * Replace with real data once the TrainingPeaks CSV importer exists.
 */

/** per-day modifiers applied on top of `base`. `daysAgo`: 0 = today. */
export type Story = (daysAgo: number) => {
  hrvMul?: number;
  rhrAdd?: number;
  sleepAdd?: number;
  sleepScoreAdd?: number;
  loadMul?: number;
  stressAdd?: number;
  respAdd?: number;
  spo2Add?: number;
  bbAdd?: number;
  stepsMul?: number;
};

export interface DemoProfile {
  id: string;
  name: string;
  focus: string;
  base: {
    hrv: number;
    rhr: number;
    sleepHours: number;
    sleepScore: number;
    bodyBattery: number;
    stressAvg: number;
    respiration: number;
    steps: number;
    load: number;
    weightKg: number;
    spo2: number;
    vo2max: number;
    ctl: number;
  };
  story: Story;
  checkin:
    | null
    | {
        sleepQuality: number;
        energy: number;
        mood: number;
        soreness: number;
        stress: number;
        ate: string;
        note: string;
      };
}

/** ramp: 0 before `from` days-ago, 1 at `to` days-ago (i.e. more recent = stronger). */
const ramp = (daysAgo: number, from: number, to: number) =>
  daysAgo >= from ? 0 : Math.min(1, (from - daysAgo) / (from - to));

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "noa-shapira",
    name: "נועה שפירא",
    focus: "מרתון · שבוע עומס",
    base: { hrv: 62, rhr: 48, sleepHours: 7.3, sleepScore: 80, bodyBattery: 72, stressAvg: 34, respiration: 14.5, steps: 11000, load: 60, weightKg: 57, spo2: 96, vo2max: 52, ctl: 62 },
    // overreached: last ~14d HRV down, RHR up, sleep eroding, load was high then cut
    story: (d) => {
      const k = ramp(d, 14, 0);
      return { hrvMul: 1 - 0.24 * k, rhrAdd: 6 * k, sleepAdd: -1.4 * k, sleepScoreAdd: -24 * k, stressAdd: 11 * k, loadMul: d > 4 ? 1.5 : 0.5, bbAdd: -30 * k };
    },
    checkin: { sleepQuality: 2, energy: 2, mood: 3, soreness: 4, stress: 4, ate: "פסטה ברוטב שמנת, לחם, גלידה. ארוחת ערב מאוחרת.", note: "רגליים כבדות מאוד מאז האינטרוולים. קם עייף." },
  },
  {
    id: "itai-rozen",
    name: "איתי רוזן",
    focus: "טריאתלון אולימפי",
    base: { hrv: 70, rhr: 44, sleepHours: 7.5, sleepScore: 84, bodyBattery: 82, stressAvg: 30, respiration: 13.8, steps: 9000, load: 55, weightKg: 71, spo2: 97, vo2max: 60, ctl: 70 },
    // illness incubating: last 3-4d RHR spike, respiration up, HRV drop, SpO2 dip
    story: (d) => {
      const k = ramp(d, 4, 0);
      return { hrvMul: 1 - 0.28 * k, rhrAdd: 9 * k, respAdd: 2.2 * k, spo2Add: -2 * k, sleepScoreAdd: -18 * k, bbAdd: -35 * k, loadMul: d < 3 ? 0.3 : 1 };
    },
    checkin: null,
  },
  {
    id: "daniel-abukasis",
    name: "דניאל אבוקסיס",
    focus: "HYROX",
    base: { hrv: 55, rhr: 53, sleepHours: 6.4, sleepScore: 66, bodyBattery: 60, stressAvg: 52, respiration: 15.2, steps: 12500, load: 72, weightKg: 84, spo2: 95, vo2max: 49, ctl: 74 },
    // chronic high stress + load, flat-low HRV, mediocre sleep — just grinding
    story: (d) => ({ stressAdd: 6 + 4 * Math.sin(d / 3), loadMul: 1.1, hrvMul: 0.97 }),
    checkin: null,
  },
  {
    id: "roni-azoulay",
    name: "רוני אזולאי",
    focus: "כוח + קרוספיט",
    base: { hrv: 60, rhr: 50, sleepHours: 6.9, sleepScore: 73, bodyBattery: 70, stressAvg: 38, respiration: 14.6, steps: 8500, load: 58, weightKg: 79, spo2: 96, vo2max: 47, ctl: 58 },
    story: () => ({}), // stable / normal
    checkin: { sleepQuality: 3, energy: 3, mood: 3, soreness: 3, stress: 3, ate: "אורז, עוף, ירקות מוקפצים. חטיף חלבון אחרי האימון.", note: "מרגיש בסדר, קצת עייפות בכתפיים." },
  },
  {
    id: "tomer-golan",
    name: "תומר גולן",
    focus: "כדורגל חצי-מקצועי",
    base: { hrv: 53, rhr: 54, sleepHours: 6.3, sleepScore: 64, bodyBattery: 58, stressAvg: 44, respiration: 15, steps: 13500, load: 78, weightKg: 76, spo2: 96, vo2max: 55, ctl: 66 },
    // ACWR spike this week — match + 3 sessions
    story: (d) => ({ loadMul: d <= 6 ? 1.9 : 1, sleepAdd: -0.3, hrvMul: 1 - 0.08 * ramp(d, 6, 0), stepsMul: d <= 6 ? 1.3 : 1 }),
    checkin: { sleepQuality: 2, energy: 3, mood: 4, soreness: 3, stress: 2, ate: "פיצה אחרי המשחק. בוקר: שייק בננה-שיבולת שועל.", note: "מותש אבל בכיף. שבוע דחוס." },
  },
  {
    id: "yael-berkovich",
    name: "יעל ברקוביץ׳",
    focus: "10 ק״מ · שיפור שיא",
    base: { hrv: 66, rhr: 46, sleepHours: 7.9, sleepScore: 89, bodyBattery: 90, stressAvg: 24, respiration: 13.5, steps: 10500, load: 48, weightKg: 54, spo2: 98, vo2max: 58, ctl: 50 },
    // thriving: HRV above baseline last week, RHR low
    story: (d) => { const k = ramp(d, 8, 0); return { hrvMul: 1 + 0.09 * k, rhrAdd: -2 * k, bbAdd: 4 * k }; },
    checkin: { sleepQuality: 5, energy: 5, mood: 5, soreness: 1, stress: 1, ate: "קוואקר עם פירות יער ואגוזים, קינואה עם סלמון, מרק ירקות.", note: "מרגישה מצוין, קלילה. מוכנה לטמפו." },
  },
  {
    id: "maya-kaplan",
    name: "מאיה קפלן",
    focus: "כוח · פאוורליפטינג",
    base: { hrv: 53, rhr: 48, sleepHours: 7.4, sleepScore: 81, bodyBattery: 79, stressAvg: 30, respiration: 14, steps: 7000, load: 46, weightKg: 68, spo2: 97, vo2max: 42, ctl: 44 },
    story: () => ({}),
    checkin: { sleepQuality: 4, energy: 4, mood: 4, soreness: 2, stress: 2, ate: "ביצים, טוסט מלא, אבוקדו. עוף ואורז. גבינה לבנה בערב.", note: "התאוששתי טוב מהסקוואט הכבד." },
  },
  {
    id: "omer-dahan",
    name: "עומר דהן",
    focus: "אופני כביש · גראנפונדו",
    base: { hrv: 59, rhr: 48, sleepHours: 7.1, sleepScore: 78, bodyBattery: 76, stressAvg: 34, respiration: 14.3, steps: 8000, load: 62, weightKg: 73, spo2: 97, vo2max: 56, ctl: 64 },
    // one bad night 5 days ago, recovered since
    story: (d) => (d === 5 ? { sleepAdd: -1.8, sleepScoreAdd: -24, hrvMul: 0.9 } : d === 4 ? { hrvMul: 0.95 } : {}),
    checkin: { sleepQuality: 3, energy: 3, mood: 3, soreness: 2, stress: 3, ate: "פחמימות לפני הרכיבה, ג׳ל באמצע, פסטה אחרי.", note: "לילה גרוע אחד (הילד היה ער), אבל התאוששתי." },
  },
  {
    id: "shira-levi",
    name: "שירה לוי",
    focus: "ריצת בסיס + יוגה",
    base: { hrv: 64, rhr: 46, sleepHours: 7.8, sleepScore: 87, bodyBattery: 87, stressAvg: 22, respiration: 13.6, steps: 9500, load: 36, weightKg: 59, spo2: 98, vo2max: 51, ctl: 40 },
    // easy week after a race — load down, everything calm
    story: (d) => ({ loadMul: d <= 7 ? 0.5 : 1 }),
    checkin: { sleepQuality: 4, energy: 4, mood: 4, soreness: 1, stress: 2, ate: "דייסת שיבולת שועל, סלט קטניות, ירקות בתנור.", note: "רגועה ורעננה. שבוע קל אחרי המרוץ." },
  },
  {
    id: "ori-friedman",
    name: "אורי פרידמן",
    focus: "ריצת שטח · אולטרה",
    base: { hrv: 57, rhr: 45, sleepHours: 7.4, sleepScore: 83, bodyBattery: 82, stressAvg: 28, respiration: 14, steps: 12000, load: 66, weightKg: 70, spo2: 97, vo2max: 57, ctl: 68 },
    // high volume, absorbing it well
    story: (d) => ({ loadMul: 1.15, hrvMul: 1 + 0.03 * ramp(d, 10, 0) }),
    checkin: { sleepQuality: 4, energy: 4, mood: 4, soreness: 2, stress: 2, ate: "בטטה, עדשים, טחינה. פרי יבש ואגוזים בטרייל. ביצים בבוקר.", note: "הרגליים סופגות את הנפח יפה. מוכן לריצה הארוכה." },
  },
];
