// ============================================================
// CUTM Campus News — Backend Server
// ============================================================
require('dotenv').config();

const express = require('express');
const crypto  = require('crypto');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

const ARTICLES_FILE      = path.join(__dirname, 'articles.json');
const CONFIG_FILE        = path.join(__dirname, 'config.json');
const SITE_SETTINGS_FILE = path.join(__dirname, 'site-settings.json');

const captureRaw = (req, _res, buf) => { req.rawBody = buf.toString(); };
app.use(express.urlencoded({ extended: true, verify: captureRaw }));
app.use(express.json({ verify: captureRaw }));

// Folder where photos pulled from Slack are stored and served from
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(express.static(__dirname));

// ============================================================
// Seed data — populates articles.json on first run
// ============================================================
const SEED_ARTICLES = [
  { id:1,  title:"CUTM Ranks Among Top 100 Universities in NIRF 2026", summary:"Centurion University secured an All-India Rank of 87 in NIRF 2026, reflecting excellence in teaching, research, and industry outreach.", content:"<p>Centurion University of Technology and Management has achieved its <strong>best-ever NIRF ranking</strong>, securing an All-India Rank of 87 in the National Institutional Ranking Framework 2026 released by the Ministry of Education.</p><p>The university performed strongly across all five parameters — Teaching, Learning & Resources, Research and Professional Practice, Graduation Outcomes, Outreach and Inclusivity, and Perception.</p><p>\"This is a proud moment for every student, faculty member, and staff at CUTM. The ranking reflects our collective commitment to quality education and meaningful research,\" said Vice-Chancellor Prof. Shubhanshu Shekhar Pathak.</p><p>Over 120 research papers from CUTM were published in Scopus-indexed journals in 2025 alone.</p>", category:"Achievements", author:"Editorial Desk", image:"https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80", timestamp:"2026-06-06T10:00:00.000Z", featured:true,  breaking:false, archived:false, tags:["NIRF","Rankings","CUTM","Excellence"] },
  { id:2,  title:"Convocation 2026: 2,400 Students Receive Degrees", summary:"CUTM's 14th Annual Convocation was held with Governor of Odisha as Chief Guest. Gold medals were awarded to 28 rank holders across departments.", content:"<p>Centurion University held its <strong>14th Annual Convocation Ceremony</strong> on Saturday, with the Honourable Governor of Odisha presiding as Chief Guest. A total of 2,400 graduating students received their degrees across undergraduate, postgraduate, and doctoral programmes.</p><p>Gold medals were awarded to <strong>28 rank holders</strong> across departments including Computer Science, Mechanical Engineering, Business Administration, Agriculture, and Law.</p><p>Vice-Chancellor Prof. Pathak presented the annual report, highlighting a 94% placement rate for the 2025 batch and over 150 research publications.</p>", category:"Campus", author:"Campus Reporter", image:"https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80", timestamp:"2026-06-06T08:30:00.000Z", featured:false, breaking:true,  archived:false, tags:["Convocation","Graduation","Gold Medal"] },
  { id:3,  title:"CUTM Students Bag 47 Offers in Infosys Campus Drive", summary:"The Placement Cell completed a mega campus recruitment drive with Infosys, offering packages of ₹3.6 LPA to 47 final-year students.", content:"<p>The CUTM Placement Cell concluded a successful campus recruitment drive with <strong>Infosys Limited</strong>, resulting in <strong>47 job offers</strong> to final-year students from CSE, IT, and ECE departments.</p><p>Selected students will join Infosys as Systems Engineers with a package of <strong>₹3.6 Lakhs Per Annum</strong>. Additionally, 12 students were selected for the Power Programmer track at ₹8 LPA.</p><p>The Placement Cell has facilitated 340 offers from 35 companies this season, including TCS, Wipro, Capgemini, and Mindtree.</p>", category:"Placements", author:"Placement Cell", image:"https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80", timestamp:"2026-06-05T17:00:00.000Z", featured:false, breaking:true,  archived:false, tags:["Placements","Infosys","Campus Drive"] },
  { id:4,  title:"CENTURION FEST 2026: Three Days of Culture and Energy", summary:"CUTM's flagship annual cultural festival returns with 60+ events including music, dance, drama, hackathons, and robotics competitions.", content:"<p><strong>Centurion Fest 2026</strong> kicked off on Friday with an electric opening ceremony at the main ground in Paralakhemundi, attended by 8,000 students across all campuses.</p><p>The festival features over 60 events spanning dance, music battles, street plays, stand-up comedy, fashion shows, and technical competitions. The technical flagship — <strong>HackCentury 2026</strong> — attracted 180 teams from 35 colleges across Odisha and Andhra Pradesh.</p>", category:"Events", author:"Student Affairs Desk", image:"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80", timestamp:"2026-06-05T12:00:00.000Z", featured:false, breaking:false, archived:false, tags:["Fest","CenturionFest","Cultural","Technical"] },
  { id:5,  title:"CUTM Cricket Team Wins Inter-University Tournament", summary:"The CUTM men's cricket team clinched the Odisha Inter-University Cricket Trophy 2026, defeating Utkal University in the final by 6 wickets.", content:"<p>The Centurion University cricket team brought home the <strong>Odisha Inter-University Cricket Trophy 2026</strong> after a commanding 6-wicket victory over Utkal University in the final at KIIT Cricket Stadium, Bhubaneswar.</p><p>Captain Subhrajit Sahoo (68 not out) guided the team home with 14 balls to spare. Bowler Praveen Rao was named Man of the Match for his spell of 4 wickets for 32 runs.</p>", category:"Sports", author:"Sports Desk", image:"https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80", timestamp:"2026-06-04T20:00:00.000Z", featured:false, breaking:false, archived:false, tags:["Cricket","Sports","Inter-University","Trophy"] },
  { id:6,  title:"School of Engineering Launches B.Tech in AI & Data Science", summary:"CUTM introduces a new 4-year B.Tech programme in Artificial Intelligence & Data Science from 2026-27, with 60 seats and industry-embedded curriculum.", content:"<p>Centurion University's School of Engineering will offer a new <strong>B.Tech programme in Artificial Intelligence & Data Science</strong> from 2026-27, designed in collaboration with TCS iON, IBM, and the National Informatics Centre.</p><p>The programme includes a 6th-semester industry placement where students earn both academic credits and a stipend. An optional international exchange semester is available with partner universities in Germany and Singapore.</p>", category:"Academics", author:"Academic Affairs", image:"https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80", timestamp:"2026-06-04T11:00:00.000Z", featured:false, breaking:false, archived:false, tags:["AI","B.Tech","Admissions","New Programme"] },
  { id:7,  title:"CUTM Researcher Develops Low-Cost Water Purification System", summary:"Dr. Sanjib Panda from Civil Engineering has developed a solar-powered water purification unit that can serve 500 households at a cost of ₹40,000.", content:"<p>A research team led by <strong>Dr. Sanjib Panda</strong>, Associate Professor in Civil Engineering, has developed a low-cost solar-powered water purification system for rural Odisha.</p><p>The system, branded <em>SujalTech</em>, purifies 5,000 litres per day — sufficient for 500 households — at ₹40,000. It has been deployed in 3 villages in Gajapati district and received a patent filing from the university's IP Cell.</p>", category:"Research", author:"Research & Innovation Cell", image:"https://images.unsplash.com/photo-1548366086-7f1b76106622?w=800&q=80", timestamp:"2026-06-03T15:00:00.000Z", featured:false, breaking:false, archived:false, tags:["Research","Innovation","Water","Rural","Patent"] },
  { id:8,  title:"Student Anjali Devi Wins National Debate Championship", summary:"Third-year Law student Anjali Devi won the All India Inter-University Debate Championship at JNU, New Delhi, beating 94 participants from 47 universities.", content:"<p><strong>Anjali Devi</strong>, a third-year student of the School of Law, won the prestigious <strong>All India Inter-University Debate Championship 2026</strong> at Jawaharlal Nehru University, New Delhi, beating 94 participants from 47 universities.</p><p>The competition topic was <em>\"Uniform Civil Code: Necessity or Imposition?\"</em> Anjali was praised by judges for her analytical depth and command of constitutional jurisprudence.</p>", category:"Achievements", author:"Student Affairs Desk", image:"https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80", timestamp:"2026-06-03T10:00:00.000Z", featured:false, breaking:false, archived:false, tags:["Debate","Achievement","Law","National"] },
  { id:9,  title:"International MoU Signed with University of Groningen", summary:"CUTM signed a bilateral MoU with the University of Groningen, Netherlands for student exchange, joint research, and dual-degree programmes.", content:"<p>Centurion University signed a <strong>Memorandum of Understanding</strong> with the <strong>University of Groningen</strong>, Netherlands for student exchange, faculty exchange, joint research, and dual-degree programme development in Sustainability, AgriTech, and Computer Science.</p><p>This is CUTM's 11th international MoU. Applications for the 2027 exchange programme open in October 2026.</p>", category:"Academics", author:"International Relations Office", image:"https://images.unsplash.com/photo-1509521185197-43e9c9af3eed?w=800&q=80", timestamp:"2026-06-02T14:00:00.000Z", featured:false, breaking:false, archived:false, tags:["MoU","International","Exchange","Netherlands"] },
  { id:10, title:"CUTM Alumni Rajeev Kumar Joins as VP Engineering at Microsoft India", summary:"CUTM 2013 alumnus Rajeev Kumar has been appointed Vice President – Engineering at Microsoft India, a remarkable milestone.", content:"<p><strong>Rajeev Kumar</strong>, a 2013 alumnus of CUTM's B.Tech CSE, has been appointed <strong>Vice President – Engineering at Microsoft India</strong>. He joined CUTM in 2009 and was known for competitive programming.</p><p>Rajeev has expressed interest in supporting a Microsoft campus hiring programme at CUTM. The Alumni Association database now tracks over 18,000 graduates globally.</p>", category:"Alumni", author:"Alumni Relations Office", image:"https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80", timestamp:"2026-06-01T11:00:00.000Z", featured:false, breaking:false, archived:false, tags:["Alumni","Microsoft","Success","CSE"] },
  { id:11, title:"Annual Sports Meet 'Centurion Games 2026' Concludes", summary:"The week-long inter-department sports meet saw 1,800 students compete in 22 disciplines. School of Engineering topped the overall trophy tally.", content:"<p>The <strong>Centurion Games 2026</strong> concluded after seven days of competition across 22 sports disciplines with <strong>1,800 student athletes</strong>. The School of Engineering topped the medal tally with 34 medals (14 gold, 11 silver, 9 bronze).</p><p>Suresh Behera of Mechanical Engineering broke the university 100m sprint record (10.8 seconds). The basketball final attracted the largest crowd of the meet.</p>", category:"Sports", author:"Sports Desk", image:"https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80", timestamp:"2026-05-31T18:00:00.000Z", featured:false, breaking:false, archived:false, tags:["Sports Meet","Athletics","Inter-Department"] },
  { id:12, title:"CUTM Launches Centre of Excellence in Cybersecurity", summary:"The new CoE in Cybersecurity with DSCI will train 500 students annually in ethical hacking, digital forensics, and cloud security.", content:"<p>CUTM inaugurated its <strong>Centre of Excellence in Cybersecurity</strong> with the <strong>Data Security Council of India (DSCI)</strong>, equipped with a cyber range featuring 50 workstations with industry-standard tools.</p><p>The centre will train 500 students annually and offer certifications in Ethical Hacking, Digital Forensics, Cloud Security, and SOC Analyst tracks. DSCI will provide internship support through 300+ member companies.</p>", category:"Research", author:"Research & Innovation Cell", image:"https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80", timestamp:"2026-05-30T10:00:00.000Z", featured:false, breaking:false, archived:false, tags:["Cybersecurity","CoE","DSCI","Training"] },
  { id:13, title:"End Semester Examinations Schedule — June–July 2026", summary:"The Controller of Examinations has released the timetable. Exams begin June 20 and conclude July 15. Admit cards available from June 12.", content:"<p>The <strong>Office of the Controller of Examinations</strong> has published the official timetable for End Semester Examinations. Examinations commence <strong>June 20, 2026</strong> and conclude <strong>July 15, 2026</strong>.</p><ul style='margin:12px 0 12px 24px; line-height:2'><li>Admit card download opens: June 12</li><li>Theory examinations begin: June 20</li><li>Last examination: July 15</li><li>Result declaration (tentative): August 10</li></ul><p>Students with exam-related grievances must report to the Examination Section by June 14.</p>", category:"Academics", author:"Examination Cell", image:"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80", timestamp:"2026-05-29T09:00:00.000Z", featured:false, breaking:false, archived:false, tags:["Examinations","Schedule","Academics","Important"] },
  { id:14, title:"CUTM Wins Best University in Skill Education Award", summary:"The university received the 'Best University for Skill-Integrated Education 2026' award at the National Education and Technology Summit in New Delhi.", content:"<p>Centurion University received the <strong>'Best University for Skill-Integrated Education 2026'</strong> award at the National Education and Technology Summit, organised by the Ministry of Skill Development and Entrepreneurship.</p><p>CUTM is the nodal institution for PMKVY in Southern Odisha, having trained over 45,000 youth in skill programmes since 2016.</p>", category:"Achievements", author:"PR & Communications Cell", image:"https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&q=80", timestamp:"2026-05-28T16:00:00.000Z", featured:false, breaking:false, archived:true, tags:["Award","Skill Education","Recognition","National"] },
  { id:15, title:"Guest Lecture: NASA Scientist Dr. Priya Nair on Space Exploration", summary:"Over 600 students attended an inspiring lecture by NASA Research Scientist Dr. Priya Nair on the future of space exploration.", content:"<p>The School of Engineering hosted a guest lecture by <strong>Dr. Priya Nair</strong>, Research Scientist at NASA Jet Propulsion Laboratory, titled <em>\"Beyond Earth: The Next Frontier of Human Space Exploration\"</em>.</p><p>Dr. Nair spoke about the Perseverance rover, the Artemis moon programme, and plans for a crewed Mars mission. She has agreed to be a guest mentor for CUTM's Aerospace Club.</p>", category:"Events", author:"Events Desk", image:"https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80", timestamp:"2026-05-25T14:00:00.000Z", featured:false, breaking:false, archived:true, tags:["Guest Lecture","NASA","Space","Engineering"] },
  { id:16, title:"25 CUTM Students Selected for Google Summer of Code 2026", summary:"A record 25 students from CUTM have been selected as GSoC 2026 contributors — the highest from any single university in Eastern India.", content:"<p>A record <strong>25 students</strong> from Centurion University have been selected as contributors in <strong>Google Summer of Code 2026</strong>, the highest from any single university in Eastern India.</p><p>Selected students will work with organisations including Mozilla, TensorFlow, OpenCV, and Apache Software Foundation, earning stipends of $1,500–$3,300.</p>", category:"Achievements", author:"Technology Desk", image:"https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80", timestamp:"2026-05-22T10:00:00.000Z", featured:false, breaking:false, archived:true, tags:["Google","GSoC","Open Source","Achievement"] },
  { id:17, title:"New Hostel Block with 800 Beds Inaugurated", summary:"Girls' Hostel Block D and Boys' Hostel Block F were inaugurated by the Chancellor, adding 800 beds with modern amenities.", content:"<p>The <strong>Paralakhemundi campus</strong> welcomed two new hostel blocks — <strong>Girls' Hostel Block D</strong> and <strong>Boys' Hostel Block F</strong> — inaugurated by Chancellor Sri Manoj Nayak.</p><p>Each six-storey block accommodates 400 residents with attached bathrooms, 24-hour hot water, high-speed Wi-Fi, and a mess for 500 students per sitting. The blocks were built in 18 months at a cost of ₹28 crore.</p>", category:"Campus", author:"Administration Desk", image:"https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80", timestamp:"2026-05-20T11:00:00.000Z", featured:false, breaking:false, archived:true, tags:["Hostel","Infrastructure","Campus","Facilities"] },
  { id:18, title:"Agriculture Students Win National Agri-Innovation Challenge", summary:"A team of five students developed a drone-based precision fertiliser system and won the top prize at the national competition in Pune.", content:"<p>A team of five students from CUTM's School of Agriculture won the <strong>First Prize at the National Agri-Innovation Challenge 2026</strong> in Pune. They developed <em>PreciDrone</em>, an autonomous drone that identifies nutrient deficiency zones and dispenses fertiliser only where needed, reducing usage by up to 40%.</p><p>The prize carries ₹2 lakh, a commercialisation grant, and a 6-month incubation opportunity at the Pune Agritech Hub.</p>", category:"Achievements", author:"Research & Innovation Cell", image:"https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80", timestamp:"2026-05-15T09:00:00.000Z", featured:false, breaking:false, archived:true, tags:["Agriculture","Drone","Innovation","Award","National"] }
];

// ============================================================
// File helpers
// ============================================================
function loadArticles() {
  try {
    const raw = fs.readFileSync(ARTICLES_FILE, 'utf8').trim();
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveArticles(a) { fs.writeFileSync(ARTICLES_FILE, JSON.stringify(a, null, 2)); }

function loadConfig() {
  const cfg = { slackSigningSecret:'', slackBotToken:'', slackChannel:'', adminPassword:'cutm@admin' };
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8').trim();
    if (raw) Object.assign(cfg, JSON.parse(raw));
  } catch {}
  // .env fallback — only fills values not already set in config.json
  if (!cfg.slackSigningSecret && process.env.SLACK_SIGNING_SECRET) cfg.slackSigningSecret = process.env.SLACK_SIGNING_SECRET.trim();
  if (!cfg.slackBotToken      && process.env.SLACK_BOT_TOKEN)      cfg.slackBotToken      = process.env.SLACK_BOT_TOKEN.trim();
  if (!cfg.slackChannel       && process.env.SLACK_CHANNEL)        cfg.slackChannel       = process.env.SLACK_CHANNEL.trim();
  return cfg;
}
function saveConfig(c) { fs.writeFileSync(CONFIG_FILE, JSON.stringify(c, null, 2)); }

function loadSettings() {
  try {
    const raw = fs.readFileSync(SITE_SETTINGS_FILE, 'utf8').trim();
    return raw ? JSON.parse(raw) : { ticker:[], quickLinks:[] };
  } catch { return { ticker:[], quickLinks:[] }; }
}
function saveSettings(s) { fs.writeFileSync(SITE_SETTINGS_FILE, JSON.stringify(s, null, 2)); }

function nextId(articles) {
  return articles.length ? Math.max(...articles.map(a => a.id)) + 1 : 100;
}

const DEFAULT_IMAGES = {
  Campus:'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
  Academics:'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
  Events:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
  Sports:'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
  Placements:'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80',
  Research:'https://images.unsplash.com/photo-1564325724739-bae0bd08762c?w=800&q=80',
  Achievements:'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&q=80',
  Alumni:'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
};
const VALID_SECTIONS = Object.keys(DEFAULT_IMAGES);

// ── Keyword-based category detection ──────────────────────────
// When a post has no explicit #Section hashtag, the category is guessed
// from the words in the content. Multi-word phrases score higher.
const CATEGORY_KEYWORDS = {
  Placements:   ['placement','recruit','recruitment','hiring','hired','package','lpa','ctc','offer letter','job offer','intern','internship','campus drive','placed','selected by','recruiter'],
  Sports:       ['match','tournament','cricket','football','kabaddi','hockey','basketball','volleyball','athletics','athlete','sports meet','trophy','championship','medal','league','final','runner-up','marathon','defeated','wickets'],
  Research:     ['research','paper','patent','innovation','laboratory',' lab ','scientist','publication','published in','journal','prototype','r&d','findings','experiment','scopus'],
  Achievements: ['award','winner','rank','ranking','prize','recognition','honour','honoured','gold medal','champion','topper','felicitated','accolade','first prize','wins '],
  Alumni:       ['alumni','alumnus','alumna','ex-student','former student','batch of','passout','pass-out'],
  Events:       ['fest','festival','ceremony','celebration','workshop','conference','cultural','concert','competition','hackathon','webinar','guest lecture','inaugural','expo','reunion','symposium'],
  Academics:    ['exam','examination','semester','syllabus','curriculum','b.tech','m.tech','phd','programme','admission','lecture','timetable','faculty','degree','academic','course','result'],
  Campus:       ['campus','hostel','infrastructure','library','inaugurat','facility','building','mess','wi-fi','convocation','administration','canteen','transport','foundation stone'],
};
// Specific sections are checked before generic ones so ties don't all fall to Campus
const DETECT_PRIORITY = ['Placements','Sports','Research','Achievements','Alumni','Events','Academics','Campus'];

function detectCategory(text) {
  const t = (text || '').toLowerCase();
  let best = 'Campus', bestScore = 0;
  for (const cat of DETECT_PRIORITY) {
    let score = 0;
    for (const w of (CATEGORY_KEYWORDS[cat] || [])) {
      if (t.includes(w)) score += w.includes(' ') ? 2 : 1;   // phrases weigh more
    }
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

// Seed articles.json on first run
function seedIfEmpty() {
  const existing = loadArticles();
  if (existing.length === 0) {
    saveArticles(SEED_ARTICLES);
    console.log('  Seeded articles.json with 18 default articles.');
  }
}

// ============================================================
// Admin Auth
// ============================================================
const activeTokens = new Set();

function requireAdmin(req, res, next) {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!activeTokens.has(token)) return res.status(401).json({ error: 'Unauthorized.' });
  next();
}

// ============================================================
// Slack Verification
// ============================================================
function verifySlack(req, res, next) {
  const secret = loadConfig().slackSigningSecret;
  if (!secret) return next();
  const timestamp = req.headers['x-slack-request-timestamp'];
  const slackSig  = req.headers['x-slack-signature'];
  if (!timestamp || !slackSig) return res.status(403).json({ error: 'Missing Slack headers' });
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return res.status(403).json({ error: 'Stale request' });
  const expected = 'v0=' + crypto.createHmac('sha256', secret).update(`v0:${timestamp}:${req.rawBody}`).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(slackSig))) return res.status(403).json({ error: 'Bad signature' });
  next();
}

// ============================================================
// Slack Web API helpers (need a bot token: xoxb-…)
// ============================================================
async function slackApi(method, params, token) {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json; charset=utf-8', 'Authorization':`Bearer ${token}` },
    body: JSON.stringify(params || {})
  });
  return res.json();
}

// Resolve a Slack user id (U…) to a human display name, cached
const userNameCache = new Map();
async function resolveUserName(userId, token) {
  if (!userId || !token) return null;
  if (userNameCache.has(userId)) return userNameCache.get(userId);
  try {
    const r = await slackApi('users.info', { user: userId }, token);
    const p = r.ok ? r.user.profile : null;
    const name = p ? (p.real_name || p.display_name || r.user.name) : null;
    if (name) userNameCache.set(userId, name);
    return name;
  } catch { return null; }
}

// Download a private Slack file (needs the bot token) and re-host it under /uploads
async function downloadSlackImage(file, token) {
  try {
    const r = await fetch(file.url_private_download || file.url_private, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!r.ok) return null;
    const buf  = Buffer.from(await r.arrayBuffer());
    const ext  = (file.filetype || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const name = `slack_${file.id || Date.now()}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, name), buf);
    return `/uploads/${name}`;
  } catch { return null; }
}

async function firstImageUrl(files, token) {
  if (!Array.isArray(files) || !token) return null;
  const img = files.find(f => (f.mimetype || '').startsWith('image/'));
  return img ? downloadSlackImage(img, token) : null;
}

// Light Slack-mrkdwn cleanup → plain text
function cleanSlackText(s = '') {
  return s
    .replace(/<([^|>]+)\|([^>]+)>/g, '$2')      // <url|label> → label
    .replace(/<(https?:\/\/[^>]+)>/g, '$1')     // <url> → url
    .replace(/<@[^>]+>/g, '')                   // strip @user mentions
    .replace(/<![^>]+>/g, '')                   // strip @here / @channel
    .replace(/\*([^*\n]+)\*/g, '$1')            // *bold*   → bold
    .replace(/~([^~\n]+)~/g, '$1')              // ~strike~ → strike
    .replace(/`([^`\n]+)`/g, '$1')              // `code`   → code
    .replace(/(^|\s)_([^_\n]+)_(?=\s|$)/g, '$1$2') // _italic_ → italic
    .trim();
}

// Trim to a length without cutting a word in half; add an ellipsis if shortened
function smartTrim(s = '', n) {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const sp  = cut.lastIndexOf(' ');
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.\-]+$/, '') + '…';
}

// Greeting lines we don't want as a headline ("Good morning all", "Dear team"…)
function isGreeting(line = '') {
  return /^(hi+|hey|hello|good\s+(morning|afternoon|evening|day)|greetings|namaste|namaskar|dear\s+(all|team|sir|madam|everyone)|respected|warm\s+greetings)\b/i.test(line.trim());
}

// Turn a free-form Slack message into article fields.
// Convention: first line = headline, rest = body. Hashtags drive metadata:
//   #<Section> sets the category, #breaking/#notice flags a notice,
//   #featured pins it to the hero, any other #tag becomes a tag.
function parseMessage(text = '') {
  const tagRe    = /#([A-Za-z][A-Za-z0-9_-]*)/g;
  const hashtags = [...text.matchAll(tagRe)].map(m => m[1]);

  let category = null, breaking = false, featured = false;   // category set by hashtag if present
  const tags = [];
  for (const h of hashtags) {
    const lc      = h.toLowerCase();
    const section = VALID_SECTIONS.find(s => s.toLowerCase() === lc);
    if (section)                             { category = section; continue; }
    if (lc === 'breaking' || lc === 'notice') { breaking = true;   continue; }
    if (lc === 'featured')                    { featured = true;   continue; }
    tags.push(h);
  }

  const body  = cleanSlackText(text.replace(tagRe, ''));
  let lines   = body.split('\n').map(l => l.trim()).filter(Boolean);
  // Drop leading greeting lines so they don't become the headline
  while (lines.length > 1 && isGreeting(lines[0])) lines.shift();

  const opener = lines[0] || 'Campus Update';
  let title, paras;
  if (opener.length > 90) {
    // Chatty opener with no short headline → headline = its first sentence,
    // and keep the full text in the body so nothing is lost.
    title = smartTrim(opener.split(/(?<=[.!?])\s/)[0], 140);
    paras = lines;
  } else {
    title = smartTrim(opener, 140);
    paras = lines.slice(1);
  }
  const summary = smartTrim(paras[0] || title, 200);
  const content = paras.length ? paras.map(p => `<p>${p}</p>`).join('') : `<p>${title}</p>`;
  // No explicit #Section hashtag → auto-detect category from the words
  if (!category) category = detectCategory(`${title}\n${paras.join('\n')}`);
  return { title, summary, content, category, breaking, featured, tags: tags.length ? tags : [category] };
}

// ============================================================
// Public API
// ============================================================
app.get('/api/articles',   (_req, res) => res.json(loadArticles()));
app.get('/api/ticker',     (_req, res) => res.json(loadSettings().ticker     || []));
app.get('/api/quicklinks', (_req, res) => res.json(loadSettings().quickLinks || []));

// ============================================================
// Admin — Auth
// ============================================================
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== loadConfig().adminPassword)
    return res.status(401).json({ error: 'Incorrect password.' });
  const token = crypto.randomBytes(32).toString('hex');
  activeTokens.add(token);
  res.json({ token });
});

app.post('/admin/logout', requireAdmin, (req, res) => {
  activeTokens.delete((req.headers['authorization'] || '').replace('Bearer ', '').trim());
  res.json({ ok: true });
});

// ============================================================
// Admin — Config (Slack secret, admin password)
// ============================================================
app.get('/admin/config', requireAdmin, (_req, res) => {
  const cfg = loadConfig();
  res.json({
    slackConfigured: !!cfg.slackSigningSecret,
    botConfigured:   !!cfg.slackBotToken,
    slackChannel:    cfg.slackChannel || ''
  });
});

app.post('/admin/config', requireAdmin, (req, res) => {
  const cfg = loadConfig();
  const { slackSigningSecret, slackBotToken, slackChannel, adminPassword } = req.body;
  if (typeof slackSigningSecret === 'string') cfg.slackSigningSecret = slackSigningSecret.trim();
  if (typeof slackBotToken      === 'string') cfg.slackBotToken      = slackBotToken.trim();
  if (typeof slackChannel       === 'string') cfg.slackChannel       = slackChannel.trim();
  if (typeof adminPassword      === 'string' && adminPassword.length >= 6) cfg.adminPassword = adminPassword;
  saveConfig(cfg);
  res.json({ ok: true, slackConfigured: !!cfg.slackSigningSecret, botConfigured: !!cfg.slackBotToken });
});

// ============================================================
// Admin — Site Settings (ticker, quicklinks)
// ============================================================
app.get('/admin/settings', requireAdmin, (_req, res) => res.json(loadSettings()));

app.post('/admin/settings', requireAdmin, (req, res) => {
  const current = loadSettings();
  const { ticker, quickLinks } = req.body;
  if (Array.isArray(ticker))     current.ticker     = ticker;
  if (Array.isArray(quickLinks)) current.quickLinks = quickLinks;
  saveSettings(current);
  res.json({ ok: true });
});

// ============================================================
// Admin — Articles (full CRUD)
// ============================================================
app.get('/admin/articles', requireAdmin, (_req, res) => {
  const articles = loadArticles();
  res.json({
    articles,
    stats: {
      total:    articles.length,
      live:     articles.filter(a => !a.archived).length,
      archived: articles.filter(a =>  a.archived).length,
      featured: articles.filter(a =>  a.featured).length,
    }
  });
});

app.post('/admin/articles', requireAdmin, (req, res) => {
  const { title, summary, content, category, author, image, breaking, featured, tags } = req.body;
  if (!title || !summary || !category || !author)
    return res.status(400).json({ error: 'title, summary, category and author are required.' });
  if (!VALID_SECTIONS.includes(category))
    return res.status(400).json({ error: `Invalid category.` });

  const articles = loadArticles();

  // Un-feature all others if this one is featured
  if (featured) articles.forEach(a => { a.featured = false; });

  const article = {
    id:        nextId(articles),
    title, summary,
    content:   content || `<p>${summary}</p>`,
    category, author,
    image:     image || DEFAULT_IMAGES[category],
    timestamp: new Date().toISOString(),
    featured:  !!featured,
    breaking:  !!breaking,
    archived:  false,
    tags:      tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [category],
    postedBy:  'admin'
  };
  articles.unshift(article);
  saveArticles(articles);
  res.status(201).json(article);
});

// Full update (edit)
app.put('/admin/articles/:id', requireAdmin, (req, res) => {
  const id       = parseInt(req.params.id);
  const articles = loadArticles();
  const index    = articles.findIndex(a => a.id === id);
  if (index === -1) return res.status(404).json({ error: `Article #${id} not found.` });

  const { title, summary, content, category, author, image, breaking, featured, archived, tags } = req.body;

  // Only one article can be featured at a time
  if (featured) articles.forEach(a => { if (a.id !== id) a.featured = false; });

  const a = articles[index];
  if (title     !== undefined) a.title    = title;
  if (summary   !== undefined) a.summary  = summary;
  if (content   !== undefined) a.content  = content || `<p>${summary}</p>`;
  if (category  !== undefined && VALID_SECTIONS.includes(category)) a.category = category;
  if (author    !== undefined) a.author   = author;
  if (image     !== undefined) a.image    = image || DEFAULT_IMAGES[a.category];
  if (breaking  !== undefined) a.breaking = !!breaking;
  if (featured  !== undefined) a.featured = !!featured;
  if (archived  !== undefined) a.archived = !!archived;
  if (tags      !== undefined) a.tags     = tags.split(',').map(t => t.trim()).filter(Boolean);

  saveArticles(articles);
  res.json(a);
});

app.patch('/admin/articles/:id', requireAdmin, (req, res) => {
  const id       = parseInt(req.params.id);
  const articles = loadArticles();
  const article  = articles.find(a => a.id === id);
  if (!article) return res.status(404).json({ error: `Article #${id} not found.` });

  const { archived, featured, breaking } = req.body;
  if (featured) articles.forEach(a => { a.featured = false; }); // un-feature others
  if (typeof archived  === 'boolean') article.archived  = archived;
  if (typeof featured  === 'boolean') article.featured  = featured;
  if (typeof breaking  === 'boolean') article.breaking  = breaking;

  saveArticles(articles);
  res.json(article);
});

app.delete('/admin/articles/:id', requireAdmin, (req, res) => {
  const id       = parseInt(req.params.id);
  const articles = loadArticles();
  const index    = articles.findIndex(a => a.id === id);
  if (index === -1) return res.status(404).json({ error: `Article #${id} not found.` });
  const [removed] = articles.splice(index, 1);
  saveArticles(articles);
  res.json({ ok: true, removed });
});

// ============================================================
// Slack Slash Commands
// ============================================================
app.post('/slack/publish', verifySlack, (req, res) => {
  const parts = (req.body.text || '').split('|').map(s => s.trim());
  const user  = req.body.user_name || 'editor';
  if (parts.length < 4) return res.json({ response_type:'ephemeral', text:'❌ Format: `/publish Section | Title | Summary | Author | ImageURL(optional)`\nSections: ' + VALID_SECTIONS.join(', ') });

  const [category, title, summary, author, imageUrl] = parts;
  if (!VALID_SECTIONS.includes(category)) return res.json({ response_type:'ephemeral', text:`❌ Invalid section "${category}". Valid: ${VALID_SECTIONS.join(', ')}` });

  const articles = loadArticles();
  const article  = { id:nextId(articles), title, summary, content:`<p>${summary}</p>`, category, author, image:imageUrl||DEFAULT_IMAGES[category], timestamp:new Date().toISOString(), featured:false, breaking:false, archived:false, tags:[category], postedBy:user };
  articles.unshift(article);
  saveArticles(articles);
  console.log(`[SLACK] Published #${article.id} "${title}" by @${user}`);

  res.json({ response_type:'in_channel', blocks:[
    { type:'header', text:{ type:'plain_text', text:'📰 New article on CUTM Campus News!' } },
    { type:'section', fields:[{ type:'mrkdwn', text:`*Title:*\n${title}` },{ type:'mrkdwn', text:`*Section:*\n${category}` },{ type:'mrkdwn', text:`*Author:*\n${author}` },{ type:'mrkdwn', text:`*ID:*\n#${article.id}` }] },
    { type:'context', elements:[{ type:'mrkdwn', text:`Posted by @${user} · Archive: \`/archive-news ${article.id}\`` }] }
  ]});
});

app.post('/slack/archive', verifySlack, (req, res) => {
  const id = parseInt((req.body.text||'').trim()), user = req.body.user_name||'editor';
  if (isNaN(id)) return res.json({ response_type:'ephemeral', text:'❌ Usage: `/archive-news [id]`' });
  const articles = loadArticles(), article = articles.find(a=>a.id===id);
  if (!article) return res.json({ response_type:'ephemeral', text:`❌ No article #${id}.` });
  article.archived = true; saveArticles(articles);
  res.json({ response_type:'in_channel', text:`📦 Article *#${id}* archived by @${user}.` });
});

app.post('/slack/list', verifySlack, (_req, res) => {
  const articles = loadArticles().slice(0,10);
  if (!articles.length) return res.json({ response_type:'ephemeral', text:'No articles yet.' });
  res.json({ response_type:'ephemeral', text:'*Recent articles:*\n' + articles.map(a=>`• *#${a.id}* [${a.category}] ${a.title} — ${a.archived?'📦 Archived':'🟢 Live'}`).join('\n') });
});

app.post('/slack/delete', verifySlack, (req, res) => {
  const id = parseInt((req.body.text||'').trim()), user = req.body.user_name||'editor';
  if (isNaN(id)) return res.json({ response_type:'ephemeral', text:'❌ Usage: `/delete-news [id]`' });
  const articles = loadArticles(), index = articles.findIndex(a=>a.id===id);
  if (index===-1) return res.json({ response_type:'ephemeral', text:`❌ No article #${id}.` });
  const [r] = articles.splice(index,1); saveArticles(articles);
  res.json({ response_type:'in_channel', text:`🗑️ Article *#${id}* "${r.title}" deleted by @${user}.` });
});

// ============================================================
// Slack Events API — auto-publish from channel messages
//   Post a message  → new article (photos downloaded via bot token)
//   Edit a message  → that article is updated
//   Delete a message→ that article is removed
// ============================================================
const processedEvents = new Set();

app.post('/slack/events', verifySlack, (req, res) => {
  const { type, challenge, event, event_id } = req.body;

  // 1. One-time URL verification handshake from Slack
  if (type === 'url_verification') return res.send(challenge);

  // 2. Ack immediately — Slack retries anything that isn't a fast 200
  res.sendStatus(200);
  if (type !== 'event_callback' || !event || event.type !== 'message') return;

  // De-dupe Slack's retries
  if (event_id) {
    if (processedEvents.has(event_id)) return;
    processedEvents.add(event_id);
    if (processedEvents.size > 2000) processedEvents.delete(processedEvents.values().next().value);
  }

  const cfg     = loadConfig();
  const allowed = (cfg.slackChannel || '').split(',').map(s => s.trim()).filter(Boolean);
  const channel = event.channel || (event.message && event.message.channel);
  if (allowed.length && !allowed.includes(channel)) return;   // not a watched channel

  handleSlackMessage(event, cfg.slackBotToken)
    .catch(e => console.error('[SLACK] event error:', e.message));
});

async function handleSlackMessage(event, token) {
  const subtype = event.subtype;

  // ── Deleted message → remove the article ──
  if (subtype === 'message_deleted') {
    const ts       = event.deleted_ts || (event.previous_message && event.previous_message.ts);
    const articles = loadArticles();
    const idx      = articles.findIndex(a => a.slackTs === ts);
    if (idx !== -1) {
      const [r] = articles.splice(idx, 1);
      saveArticles(articles);
      console.log(`[SLACK] Removed #${r.id} (source message deleted)`);
    }
    return;
  }

  // ── Edited message → update the article in place ──
  if (subtype === 'message_changed') {
    const msg = event.message || {};
    if (msg.bot_id) return;
    const articles = loadArticles();
    const article  = articles.find(a => a.slackTs === msg.ts);
    if (!article) return;                       // edit of something we never ingested
    const parsed = parseMessage(msg.text || '');
    const img    = await firstImageUrl(msg.files, token);
    Object.assign(article, {
      title:    parsed.title,
      summary:  parsed.summary,
      content:  parsed.content,
      category: parsed.category,
      breaking: parsed.breaking,
      tags:     parsed.tags,
      image:    img || article.image
    });
    if (parsed.featured) articles.forEach(a => { a.featured = (a === article); });
    saveArticles(articles);
    console.log(`[SLACK] Updated #${article.id} (source message edited)`);
    return;
  }

  // ── New message → create an article ──
  if (subtype && subtype !== 'file_share') return;          // ignore joins, pins, etc.
  if (event.bot_id) return;                                  // ignore bot/app posts
  if (event.thread_ts && event.thread_ts !== event.ts) return; // ignore thread replies

  const articles = loadArticles();
  if (articles.some(a => a.slackTs === event.ts)) return;    // already ingested

  const parsed = parseMessage(event.text || '');
  const img    = await firstImageUrl(event.files, token);
  const author = (await resolveUserName(event.user, token)) || 'Campus Desk';

  if (parsed.featured) articles.forEach(a => { a.featured = false; });

  const article = {
    id:        nextId(articles),
    title:     parsed.title,
    summary:   parsed.summary,
    content:   parsed.content,
    category:  parsed.category,
    author,
    image:     img || DEFAULT_IMAGES[parsed.category],
    timestamp: new Date().toISOString(),
    featured:  parsed.featured,
    breaking:  parsed.breaking,
    archived:  false,
    tags:      parsed.tags,
    postedBy:  author,
    slackTs:   event.ts
  };
  articles.unshift(article);
  saveArticles(articles);
  console.log(`[SLACK] Auto-published #${article.id} "${article.title}" from channel message`);
}

// ============================================================
// Start
// ============================================================
seedIfEmpty();
app.listen(PORT, () => {
  console.log(`\n✅  CUTM Campus News  →  http://localhost:${PORT}`);
  console.log(`    Admin portal      →  http://localhost:${PORT}/admin.html`);
  console.log(`    Default password  →  cutm@admin\n`);
});
