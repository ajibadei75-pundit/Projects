/* =====================================================
   PATHFINDER — FULL APPLICATION LOGIC
   AI-Powered Course & Skill Recommendation Platform
   ===================================================== */

const MODEL = "claude-sonnet-4-20250514";

// ── STATE ──────────────────────────────────────────────
let track    = null;
let qIdx     = 0;
let ans      = {};
let qs       = [];
let chatBusy = false;
let chatHist = [];

// ── ACADEMIC QUESTIONS (10) ───────────────────────────
const AQ = [
  {
    id:"a1",
    text:"What is your current field of study in school?",
    opts:[
      {l:"Science / STEM — Physics, Chemistry, Biology, Mathematics",  v:"STEM",   w:{tech:3,data:3,engineering:3,health:2,ai:2}},
      {l:"Computer Science / Information Technology / Engineering",     v:"CS",     w:{tech:4,data:4,ai:4,cybersec:3,product:2}},
      {l:"Arts / Humanities / Social Sciences / Mass Communication",   v:"ARTS",   w:{design:3,content:4,marketing:3,edtech:2,hr:2}},
      {l:"Business / Accounting / Economics / Finance",                v:"BIZ",    w:{finance:4,data:2,marketing:3,management:3,product:2}}
    ]
  },
  {
    id:"a2",
    text:"Which part of your current studies do you genuinely enjoy the most?",
    opts:[
      {l:"Numbers, patterns, calculations and analytical problem-solving",  v:"num",    w:{data:4,finance:3,ai:3,engineering:2}},
      {l:"Creating things — writing, designing, expressing ideas visually",v:"create",  w:{design:4,content:4,marketing:3,edtech:2}},
      {l:"Understanding how systems and machines work and building solutions",v:"systems",w:{tech:4,engineering:4,cybersec:3,ai:2}},
      {l:"Understanding people, society, behaviour and communication",       v:"people", w:{hr:3,marketing:3,edtech:3,content:2}}
    ]
  },
  {
    id:"a3",
    text:"When you face a complex assignment, what is your natural approach?",
    opts:[
      {l:"Break it into logical steps and solve it methodically",        v:"logical",   w:{tech:3,data:3,ai:3,engineering:3}},
      {l:"Research extensively and gather many different perspectives",  v:"research",  w:{content:3,marketing:2,consulting:3,edtech:2}},
      {l:"Collaborate and brainstorm with classmates or friends",        v:"collab",    w:{management:3,hr:3,marketing:2,product:2}},
      {l:"Sketch or visualise it first — draw diagrams and map it out", v:"visual",    w:{design:4,product:3,engineering:2,content:2}}
    ]
  },
  {
    id:"a4",
    text:"How comfortable are you with computers and technology right now?",
    opts:[
      {l:"Very — I use tech tools daily and genuinely love technology",      v:"very",  w:{tech:4,data:3,cybersec:3,ai:4,product:2}},
      {l:"Comfortable — I manage well with most common software",           v:"good",  w:{data:2,product:2,marketing:2,content:2}},
      {l:"Basic — I use it when needed but don't know the deep stuff",      v:"basic", w:{design:2,content:3,marketing:2,hr:2}},
      {l:"Limited — I prefer working less with screens and technology",     v:"low",   w:{health:2,consulting:2,hr:2,content:1}}
    ]
  },
  {
    id:"a5",
    text:"What career outcome matters most to you after graduating?",
    opts:[
      {l:"Maximum earning potential and true financial independence",                 v:"money",    w:{finance:4,tech:3,data:4,ai:4,cybersec:3}},
      {l:"Creative fulfilment — doing work I love and can express myself through",   v:"creative", w:{design:4,content:4,marketing:3,edtech:2}},
      {l:"Social impact — making a real measurable difference in people's lives",    v:"impact",   w:{health:3,edtech:3,hr:3,consulting:3}},
      {l:"Entrepreneurship — building something of my own from the ground up",       v:"startup",  w:{product:4,marketing:3,tech:3,management:3,finance:2}}
    ]
  },
  {
    id:"a6",
    text:"How do you feel about learning to code or write computer programs?",
    opts:[
      {l:"I already code or I am extremely eager to learn deeply",                    v:"yes",   w:{tech:4,ai:4,data:3,cybersec:3,product:2}},
      {l:"I am willing to learn the basics if it will help my career",                v:"maybe", w:{data:2,product:2,marketing:2,design:1}},
      {l:"I prefer minimal coding — maybe just automation or no-code tools",          v:"low",   w:{marketing:2,product:2,design:2,content:2}},
      {l:"I would rather focus on skills that do not require coding at all",          v:"no",    w:{content:3,hr:3,consulting:3,health:2,marketing:2}}
    ]
  },
  {
    id:"a7",
    text:"Which of these would you genuinely enjoy doing every single day as a career?",
    opts:[
      {l:"Building and debugging software applications and technical systems",        v:"dev",      w:{tech:5,cybersec:3,ai:3,engineering:2}},
      {l:"Analysing data and presenting findings that drive major decisions",         v:"analyst",  w:{data:5,finance:3,product:2,consulting:2}},
      {l:"Designing beautiful, intuitive digital products and user experiences",      v:"designer", w:{design:5,product:3,marketing:2,content:2}},
      {l:"Growing brands, running marketing campaigns and building audiences",        v:"marketer", w:{marketing:5,content:3,management:2,product:2}}
    ]
  },
  {
    id:"a8",
    text:"What is your single greatest academic strength right now?",
    opts:[
      {l:"Logical, analytical and critical thinking",                        v:"logic",    w:{data:4,tech:3,finance:3,ai:4,engineering:3}},
      {l:"Writing, communication and the ability to tell compelling stories",v:"comm",     w:{content:4,marketing:4,hr:3,edtech:3}},
      {l:"Creativity, aesthetic judgement and strong visual thinking",       v:"creative", w:{design:5,content:3,marketing:3,product:2}},
      {l:"Organisation, planning, leadership and getting things done",       v:"org",      w:{management:4,product:4,consulting:3,hr:2}}
    ]
  },
  {
    id:"a9",
    text:"How many hours per week can you realistically dedicate to learning a new skill alongside your studies?",
    opts:[
      {l:"1–3 hours (Very busy with school and other commitments)",               v:"low",   w:{content:2,marketing:2,design:1,hr:1}},
      {l:"4–7 hours (Moderate — I can carve out a few hours each week)",          v:"med",   w:{design:3,data:2,marketing:3,content:3}},
      {l:"8–15 hours (Serious learner — I'm genuinely committed to growing)",     v:"high",  w:{tech:4,data:4,ai:3,cybersec:3,product:3}},
      {l:"15+ hours (Full focus — I want to go deep and progress fast)",          v:"vhigh", w:{tech:5,ai:5,data:5,cybersec:4,engineering:4}}
    ]
  },
  {
    id:"a10",
    text:"Where do you most vividly see yourself working in 5 years from now?",
    opts:[
      {l:"A leading tech company, exciting startup or building my own tech product", v:"tech", w:{tech:4,ai:4,data:4,cybersec:3,product:3}},
      {l:"Running my own creative business or freelancing with global clients",      v:"free", w:{design:3,marketing:3,content:4,product:3}},
      {l:"A top bank, consulting firm, multinational corporation or NGO",            v:"corp", w:{finance:4,data:3,management:3,consulting:4}},
      {l:"Education, healthcare, public service or a social enterprise",             v:"pub",  w:{edtech:4,health:4,hr:3,consulting:3,content:2}}
    ]
  }
];

// ── PERSONAL QUESTIONS (10) ───────────────────────────
const PQ = [
  {
    id:"p1",
    text:"When you have completely free time with no obligations, what do you naturally drift towards?",
    opts:[
      {l:"Watching tutorials, tinkering with gadgets, building or solving puzzles",  v:"build",  w:{tech:4,engineering:3,ai:3,data:2}},
      {l:"Drawing, designing, photography, music or creating visual content",         v:"create", w:{design:5,content:4,marketing:3}},
      {l:"Reading, writing, debating, researching or having deep conversations",      v:"learn",  w:{content:4,consulting:3,edtech:3,hr:2}},
      {l:"Browsing trends, gaming, social media or watching entertainment",           v:"digital",w:{marketing:3,content:3,product:2}}
    ]
  },
  {
    id:"p2",
    text:"Which achievement would make you most proud to look back on in 10 years?",
    opts:[
      {l:"Building an app or platform that millions of people depend on every day",  v:"app",     w:{tech:5,product:4,ai:3,data:2}},
      {l:"Creating a brand, campaign or piece of creative work that went globally viral",v:"brand",w:{marketing:5,design:3,content:4}},
      {l:"Writing influential content, teaching people or building a loyal audience", v:"content", w:{content:5,edtech:3,hr:2}},
      {l:"Leading a team, building a company or running a successful operation",      v:"lead",    w:{management:5,product:4,consulting:3,startup:4}}
    ]
  },
  {
    id:"p3",
    text:"How do people who know you well usually describe you to others?",
    opts:[
      {l:"The smart / technical one — always figuring things out and solving problems",v:"smart",    w:{tech:4,data:4,ai:4,engineering:3}},
      {l:"The creative one — great taste, original ideas and artistic flair",          v:"creative", w:{design:5,content:4,marketing:3}},
      {l:"The people person — warm, great communicator and natural leader",            v:"social",   w:{hr:4,marketing:3,management:4,consulting:3}},
      {l:"The organised one — reliable, detail-oriented and always prepared",          v:"org",      w:{product:4,finance:3,consulting:3,management:3}}
    ]
  },
  {
    id:"p4",
    text:"Which type of problem gets you genuinely curious and excited to work on?",
    opts:[
      {l:"Why is this system broken? Let me debug it, fix it and optimise it",          v:"debug",  w:{tech:5,cybersec:4,ai:3,engineering:3}},
      {l:"How do I turn this raw data into a story that changes important decisions?",  v:"story",  w:{data:4,content:4,marketing:3,consulting:2}},
      {l:"How can I make this experience look and feel more beautiful and intuitive?",  v:"beauty", w:{design:5,product:3,marketing:2,content:2}},
      {l:"How do I get this team aligned and motivated to hit this goal faster?",       v:"manage", w:{management:5,product:4,consulting:3,hr:3}}
    ]
  },
  {
    id:"p5",
    text:"If you had to honestly describe your personality type, which resonates most?",
    opts:[
      {l:"Introverted and deep — I love focused, concentrated solo work",    v:"intro", w:{tech:4,data:4,content:3,design:3,ai:3}},
      {l:"Extroverted and energetic — I come alive when engaging with people",v:"extro", w:{marketing:4,hr:4,management:3,consulting:3}},
      {l:"Ambiverted — I work great independently AND love collaboration",    v:"ambi",  w:{product:4,design:3,data:3,content:3,marketing:2}},
      {l:"Adventurous and restless — always chasing new challenges and ideas",v:"adv",   w:{startup:5,product:4,marketing:3,consulting:2}}
    ]
  },
  {
    id:"p6",
    text:"What type of content do you consume the most online in your free time?",
    opts:[
      {l:"Tech videos, coding channels, science, innovation and AI news",     v:"tech",   w:{tech:5,ai:4,data:3,engineering:2}},
      {l:"Design inspiration, interior decor, fashion and visual aesthetics", v:"design", w:{design:5,content:3,marketing:3}},
      {l:"Business news, finance, investing, economics and startup stories",  v:"biz",    w:{finance:5,consulting:3,management:3,startup:3}},
      {l:"Social media trends, viral videos, influencer content and pop culture",v:"social",w:{marketing:5,content:4,management:2}}
    ]
  },
  {
    id:"p7",
    text:"If you could spend an entire weekend learning one thing for free, what would it be?",
    opts:[
      {l:"How to build a fully working mobile app or website from scratch",       v:"dev",    w:{tech:5,product:3,ai:2}},
      {l:"How to edit videos, design logos or create stunning visual content",    v:"media",  w:{design:5,content:4,marketing:3}},
      {l:"How the stock market, crypto and investing really work in practice",    v:"invest", w:{finance:5,data:2,consulting:2}},
      {l:"How to grow a social media audience or run profitable digital ads",     v:"grow",   w:{marketing:5,content:3,product:2}}
    ]
  },
  {
    id:"p8",
    text:"What does your ideal work environment actually look and feel like?",
    opts:[
      {l:"Headphones on, deep focus, building things alone or in a small tight team",v:"focus",  w:{tech:4,data:4,ai:4,design:3,content:3}},
      {l:"Open, collaborative space — brainstorming with energetic, creative people", v:"open",   w:{marketing:4,hr:4,management:3,product:3}},
      {l:"Flexible and remote — I want full control over my time and location",       v:"remote", w:{content:4,design:3,tech:3,marketing:3}},
      {l:"Client-facing — meetings, presentations and advising decision-makers",      v:"client", w:{consulting:5,management:4,hr:3,finance:3}}
    ]
  },
  {
    id:"p9",
    text:"Which of these best describes your relationship with money and income goals?",
    opts:[
      {l:"I want to earn as much as possible — income is my primary goal",          v:"rich",   w:{finance:4,tech:4,ai:4,data:4,cybersec:3}},
      {l:"I want stable, comfortable income doing work I genuinely enjoy each day",  v:"balance",w:{design:3,content:3,marketing:3,hr:3,edtech:3}},
      {l:"I want to build long-term wealth by owning something valuable and scalable",v:"wealth", w:{startup:4,product:3,management:3,finance:3}},
      {l:"Impact over income — I would sacrifice pay to do deeply meaningful work",   v:"impact", w:{edtech:4,health:4,consulting:3,hr:3}}
    ]
  },
  {
    id:"p10",
    text:"What future do you most vividly and excitedly imagine for yourself?",
    opts:[
      {l:"Building AI tools or software used by people across the entire world",     v:"ai",      w:{tech:5,ai:5,data:3,product:3}},
      {l:"Running a thriving creative studio, agency or influential personal brand",  v:"creative",w:{design:5,content:4,marketing:3}},
      {l:"Leading a successful business, company or managing a large investment portfolio",v:"biz", w:{startup:5,finance:4,management:3,consulting:2}},
      {l:"Teaching, healing or creating social impact that reaches millions of people",v:"impact", w:{edtech:5,health:4,hr:3,consulting:3}}
    ]
  }
];

// ── SKILLS DATABASE ────────────────────────────────────
const SKILLS = {
  tech:{
    name:"Software Development", icon:"💻",
    desc:"Build web, mobile and backend applications. One of the most demanded and best-paying careers globally — with endless specialisation paths.",
    tags:["Python","JavaScript","React","Node.js","REST APIs","Git","Cloud"],
    roadmap:["Master HTML, CSS & JavaScript fundamentals (2–4 weeks)","Choose a backend language: Python or Node.js","Build 3 real, deployed portfolio projects","Learn Git, GitHub and collaborative workflows","Apply for junior roles, internships or freelance gigs"]
  },
  ai:{
    name:"Artificial Intelligence & ML", icon:"🤖",
    desc:"Build intelligent systems that learn from data. The fastest-growing field globally with a 40%+ salary premium over standard tech roles.",
    tags:["Python","TensorFlow","PyTorch","Machine Learning","NLP","Computer Vision"],
    roadmap:["Master Python, linear algebra and statistics","Learn ML fundamentals with scikit-learn and real datasets","Study deep learning — TensorFlow or PyTorch","Compete on Kaggle and build AI GitHub portfolio","Specialise in NLP, Computer Vision or Reinforcement Learning"]
  },
  data:{
    name:"Data Science & Analytics", icon:"📊",
    desc:"Extract meaningful insights from raw data to power smarter decisions. Massive cross-industry demand with excellent compensation globally.",
    tags:["Python","SQL","Tableau","Statistics","Pandas","Power BI","Excel"],
    roadmap:["Master SQL and advanced Excel for data manipulation","Study statistics, probability and data thinking","Learn Python for data (Pandas, NumPy, Matplotlib)","Build 5 data projects with real datasets","Publish portfolio on GitHub and get Google Data Analytics cert"]
  },
  design:{
    name:"UI/UX Design", icon:"🎨",
    desc:"Design beautiful, user-friendly digital products people love. Sits perfectly at the intersection of art, psychology and technology.",
    tags:["Figma","User Research","Wireframing","Prototyping","Design Systems","Adobe XD"],
    roadmap:["Study design fundamentals: typography, colour, layout, hierarchy","Master Figma from scratch (free on figma.com)","Learn user research, usability testing and design thinking","Complete 5 detailed case studies with problem → solution","Build a Behance or Dribbble portfolio and start freelancing"]
  },
  marketing:{
    name:"Digital Marketing", icon:"📢",
    desc:"Grow brands and products through online channels. Combines creativity, analytics and strategy — needed by literally every business on earth.",
    tags:["SEO","Google Ads","Meta Ads","Email Marketing","Analytics","Content Strategy"],
    roadmap:["Learn SEO fundamentals and content marketing strategy","Master Google Ads and Meta Ads platforms practically","Study email marketing, automation and list building","Get Google Analytics 4 and HubSpot certified (free)","Run real campaigns for small businesses and build case studies"]
  },
  content:{
    name:"Content Creation & Writing", icon:"✍️",
    desc:"Create valuable content — articles, videos, newsletters, scripts. A powerful career for building personal brands, B2B work or media companies.",
    tags:["Copywriting","SEO Writing","Video Scripts","Newsletters","Brand Voice","LinkedIn"],
    roadmap:["Choose your medium: long-form writing, video or newsletters","Study copywriting and persuasion principles deeply","Pick ONE platform and publish consistently for 90 days","Build a portfolio of 10+ published, polished pieces","Monetise via freelance clients, courses or brand sponsorships"]
  },
  cybersec:{
    name:"Cybersecurity", icon:"🔐",
    desc:"Protect systems, networks and data from cyberattacks. A critical, high-paying field with massive global shortage of skilled professionals.",
    tags:["Ethical Hacking","Networking","Linux","CompTIA Security+","Penetration Testing","SIEM"],
    roadmap:["Learn networking fundamentals: TCP/IP, DNS, HTTP, firewalls","Master Linux command line completely","Earn CompTIA Security+ certification (globally recognised)","Practice daily on TryHackMe and HackTheBox platforms","Specialise in cloud security, pen testing or incident response"]
  },
  finance:{
    name:"FinTech & Financial Analysis", icon:"💰",
    desc:"Combine finance expertise with modern tech tools. From investment analysis and financial modelling to building FinTech products used by millions.",
    tags:["Financial Modelling","Excel","Python for Finance","Bloomberg","CFA","Valuation"],
    roadmap:["Master Excel and build complex financial models from scratch","Learn Python for financial data analysis (pandas, yfinance)","Study accounting principles, DCF valuation and market analysis","Build 3 financial analysis projects or investment case studies","Pursue CFA Level 1 certification or enrol in a FinTech course"]
  },
  product:{
    name:"Product Management", icon:"🗺️",
    desc:"Define what gets built and why. PMs sit at the powerful intersection of technology, user experience and business strategy in every tech company.",
    tags:["Product Strategy","Agile","Roadmaps","Jira","User Research","OKRs","A/B Testing"],
    roadmap:["Study product thinking: Jobs-to-be-Done, North Star Metric, PRDs","Learn Agile methodology, Scrum and sprint planning in practice","Build 3 detailed product case studies from real problems","Shadow or assist an existing Product Manager for experience","Earn Google PM Certificate or PSPO Scrum certification"]
  },
  management:{
    name:"Project & Operations Management", icon:"📋",
    desc:"Lead people, resources and timelines to deliver results on time. A skill needed in literally every organisation, industry and country on earth.",
    tags:["PMP Certification","Agile","Lean","Leadership","Notion","Process Design","Stakeholders"],
    roadmap:["Master core project management principles and frameworks","Earn PMP, CAPM or PRINCE2 certification","Study operations management, lean methodology and process design","Lead a real project — volunteer or freelance — and document it","Build a portfolio of 3 successfully delivered projects with metrics"]
  },
  edtech:{
    name:"EdTech & Instructional Design", icon:"🎓",
    desc:"Build or teach inside the booming $340B global education technology industry. Combine your subject knowledge with pedagogy and modern tech.",
    tags:["Curriculum Design","LMS Platforms","E-learning","Video Production","Online Coaching"],
    roadmap:["Define your niche: what subject and audience will you serve?","Build your first structured online course on Teachable or Udemy","Study instructional design theory: Bloom's taxonomy, ADDIE model","Launch a YouTube channel or newsletter to build your audience","Partner with schools, training companies or EdTech platforms"]
  },
  health:{
    name:"Health Informatics & MedTech", icon:"🏥",
    desc:"Apply technology to transform healthcare. From EHR systems and patient data to telemedicine platforms — a rapidly growing post-COVID field.",
    tags:["EHR Systems","Health Data","Telemedicine","Digital Health","MedTech","HIPAA"],
    roadmap:["Understand how the healthcare system and data flows work","Learn electronic health record (EHR) systems and HL7/FHIR standards","Study regulatory requirements: HIPAA, NDPR, GDPR for health data","Build a health-tech project or write a detailed case study","Pursue a Health Informatics certification (AHIMA or Coursera)"]
  },
  startup:{
    name:"Entrepreneurship & Startup Building", icon:"🚀",
    desc:"Build, launch and scale your own venture from scratch. Requires cross-functional thinking, creative problem-solving and relentless execution.",
    tags:["Lean Startup","MVP Development","Growth Hacking","Fundraising","Pitching","Business Models"],
    roadmap:["Identify a specific, painful problem that a real audience has","Build a lean MVP in 30 days or less — validate before perfecting","Acquire your first 10 paying or active users organically","Study startup fundamentals: unit economics, CAC, LTV, PMF","Apply to incubators (YC, Techstars) or pitch to angel investors"]
  },
  hr:{
    name:"Human Resources & People Operations", icon:"🤝",
    desc:"Attract, develop and retain the talent that builds organisations. A deeply human role that is increasingly powered by data, AI and modern tech.",
    tags:["Talent Acquisition","HRIS","Learning & Development","Culture Design","People Analytics"],
    roadmap:["Learn HR fundamentals: employment law, recruitment cycles, compensation","Master modern HRIS tools: BambooHR, Workday, Greenhouse","Study talent development, performance management and culture design","Earn SHRM-CP or CIPD Level 3 certification","Specialise in People Analytics, DEI or Learning & Development"]
  },
  consulting:{
    name:"Business Consulting & Strategy", icon:"📈",
    desc:"Help organisations solve complex problems and grow strategically. Consulting builds an incredibly broad, transferable and highly respected skillset.",
    tags:["Strategy Frameworks","Problem-solving","Excel","PowerPoint","Client Management","McKinsey 7S"],
    roadmap:["Master key consulting frameworks: MECE, 3Cs, Porter's 5 Forces","Build advanced Excel and PowerPoint skills for analysis and decks","Study case interview preparation (Case in Point, McKinsey PST)","Build a consulting project portfolio — pro bono for small businesses","Target boutique consulting firms or launch an independent practice"]
  },
  engineering:{
    name:"Engineering & Technical Design", icon:"⚙️",
    desc:"Apply engineering principles with digital tools like CAD, simulation software and automation to design and build at massive scale.",
    tags:["AutoCAD","SolidWorks","MATLAB","Python for Engineering","BIM","Simulation"],
    roadmap:["Master AutoCAD and 3D modelling software relevant to your discipline","Learn simulation and finite element analysis (FEA) tools","Study materials science, structural analysis or fluid dynamics","Complete a full end-to-end engineering design project","Get certified in relevant engineering software (Autodesk, Siemens)"]
  }
};

// ── DOM HELPERS ────────────────────────────────────────
const $  = id => document.getElementById(id);
const qs_ = sel => document.querySelectorAll(sel);

function showEl(id, disp){
  const el = $(id);
  if(!el) return;
  // Use appropriate display value per element
  const flexEls = ['trackSel','track-sel','quizArea','resultsArea','bookSuccess','typing'];
  el.style.display = disp || (flexEls.includes(id) ? '' : '');
}
function hideEl(id){
  const el = $(id);
  if(el) el.style.display = 'none';
}

// ── NAVIGATION ────────────────────────────────────────
function goAssess(){ $('assess').scrollIntoView({behavior:'smooth'}) }
function goHow()   { $('how').scrollIntoView({behavior:'smooth'}) }
function goCounsel(){ $('counsel').scrollIntoView({behavior:'smooth'}) }

// Navbar scroll effect
window.addEventListener('scroll', () =>
  $('nav').classList.toggle('solid', window.scrollY > 55), {passive:true});

// Mobile drawer
$('burger').addEventListener('click', () => {
  $('drawer').classList.add('open');
  $('ovBg').classList.add('show');
});
function closeDrawer(){
  $('drawer').classList.remove('open');
  $('ovBg').classList.remove('show');
}
document.querySelectorAll('.drawer a').forEach(a =>
  a.addEventListener('click', closeDrawer));

// ── SCROLL REVEAL ─────────────────────────────────────
const revealObs = new IntersectionObserver(entries =>
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('vis') }),
  {threshold: 0.1}
);
document.querySelectorAll('.sr').forEach(el => revealObs.observe(el));

// ── TOAST ─────────────────────────────────────────────
let toastTimer = null;
function toast(msg, type='', dur=3800){
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast up' + (type ? ' toast-' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('up'), dur);
}

// ── LOADER ────────────────────────────────────────────
function showLoader(){ $('loader').classList.add('on') }
function hideLoader(){ $('loader').classList.remove('on') }

// ── QUIZ ENGINE ───────────────────────────────────────
function pickTrack(t){
  track = t;
  qIdx  = 0;
  ans   = {};
  qs    = t === 'academic' ? AQ : PQ;

  $('tcAc').classList.toggle('sel', t === 'academic');
  $('tcPe').classList.toggle('sel', t === 'personal');

  hideEl('trackSel');
  showEl('quizArea');
  hideEl('resultsArea');
  $('trackPill').textContent = t === 'academic' ? '🎓 Academic Track' : '💡 Personal Track';

  renderQuestion();
  setTimeout(() => $('assess').scrollIntoView({behavior:'smooth', block:'start'}), 80);
}

function renderQuestion(){
  const q = qs[qIdx];
  const total = qs.length;
  const pct = Math.round((qIdx / total) * 100);

  $('progLbl').textContent  = `Question ${qIdx + 1} of ${total}`;
  $('progFill').style.width = pct + '%';
  $('qNum').textContent     = String(qIdx + 1).padStart(2, '0');
  $('qText').textContent    = q.text;
  $('nxtBtn').disabled      = true;

  // Build options
  const grid = $('optsGrid');
  grid.innerHTML = '';
  const letters = ['A','B','C','D'];

  q.opts.forEach((o, i) => {
    const btn = document.createElement('button');
    const already = ans[q.id] && ans[q.id].v === o.v;
    btn.className = 'opt' + (already ? ' sel' : '');
    btn.innerHTML = `<span class="opt-lt">${letters[i]}</span>${escHtml(o.l)}`;
    btn.setAttribute('aria-label', o.l);
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.opt').forEach(b => b.classList.remove('sel'));
      btn.classList.add('sel');
      ans[q.id] = o;
      $('nxtBtn').disabled = false;
    });
    grid.appendChild(btn);
  });

  if(ans[q.id]) $('nxtBtn').disabled = false;

  // Re-trigger slide animation
  const card = $('qCard');
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = '';
}

function quizNext(){
  if(!ans[qs[qIdx].id]){
    toast('Please select an option to continue', 'err'); return;
  }
  if(qIdx < qs.length - 1){
    qIdx++;
    renderQuestion();
  } else {
    analyseResults();
  }
}

function quizBack(){
  if(qIdx > 0){
    qIdx--;
    renderQuestion();
  } else {
    showEl('trackSel');
    hideEl('quizArea');
    $('tcAc').classList.remove('sel');
    $('tcPe').classList.remove('sel');
  }
}

function resetQuiz(){
  track = null; qIdx = 0; ans = {};
  showEl('trackSel');
  hideEl('quizArea');
  hideEl('resultsArea');
  $('tcAc').classList.remove('sel');
  $('tcPe').classList.remove('sel');
}

// ── AI ANALYSIS ENGINE ────────────────────────────────
async function analyseResults(){
  showLoader();

  const steps = [
    "Collecting your response patterns…",
    "Running ML compatibility scoring model…",
    "Computing skill alignment matrix…",
    "Generating personalised roadmaps…",
    "Finalising your AI recommendations…"
  ];

  const ldSteps = $('ldSteps');
  ldSteps.innerHTML = steps.map((s,i) =>
    `<div class="ld-s" id="ls${i}">⬜ ${s}</div>`).join('');

  // Local scoring
  const scores = {};
  Object.values(ans).forEach(a => {
    if(a && a.w) Object.entries(a.w).forEach(([k,v]) =>
      scores[k] = (scores[k] || 0) + v);
  });
  const ranked = Object.entries(scores)
    .sort(([,a],[,b]) => b - a)
    .map(([k]) => k)
    .filter(k => SKILLS[k]);

  // Animate loader steps with AI call happening in parallel
  const animPromise = (async () => {
    for(let i = 0; i < steps.length; i++){
      await pause(900);
      const el = $('ls' + i);
      if(el){ el.textContent = '✅ ' + steps[i]; el.classList.add('done'); }
    }
  })();

  // Build answer summary for AI
  const summary = Object.entries(ans).map(([qid, a]) => {
    const q = qs.find(q => q.id === qid);
    return `Q: ${q ? q.text : qid}\nA: ${a.l}`;
  }).join('\n\n');

  const prompt = `You are PathFinder's AI recommendation engine. A student completed a ${track === 'academic' ? 'Academic Track (based on school course)' : 'Personal Interest Track'} career assessment.

Analyse the student's answers carefully and provide 3 highly personalised, accurate skill/course recommendations.

STUDENT'S FULL ANSWERS:
${summary}

LOCAL ML RANKING (top skill keys by weighted score): ${ranked.slice(0, 8).join(', ')}

AVAILABLE SKILL KEYS YOU MUST CHOOSE FROM: ${Object.keys(SKILLS).join(', ')}

CRITICAL RULES:
- skillKey MUST be exactly one of the available skill keys above
- matchScore must be realistic (72–98, not all the same)
- personalReason must reference specific things from THEIR answers — not generic text
- marketInsight must include a real, specific number (salary, growth rate, or demand figure)
- quickWin must name a specific real resource, platform or tool they can use THIS WEEK

Respond with ONLY valid JSON — no markdown, no explanation:
{
  "recommendations": [
    {
      "skillKey": "exact_key_here",
      "matchScore": 95,
      "personalReason": "2-3 sentences that reference specific answers this student gave and explain precisely why this skill fits THEM",
      "marketInsight": "Specific market stat with real numbers about this skill in 2025",
      "quickWin": "Specific first action with a real platform, tool or resource name they can start this week"
    },
    {
      "skillKey": "exact_key_here",
      "matchScore": 88,
      "personalReason": "...",
      "marketInsight": "...",
      "quickWin": "..."
    },
    {
      "skillKey": "exact_key_here",
      "matchScore": 81,
      "personalReason": "...",
      "marketInsight": "...",
      "quickWin": "..."
    }
  ]
}`;

  let aiData = null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const json = await res.json();
    const raw = json.content?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    aiData = JSON.parse(clean);
  } catch(e){
    console.warn('AI analysis failed, falling back to local scores:', e.message);
  }

  await animPromise;
  hideLoader();
  renderResults(aiData, ranked);
}

function renderResults(aiData, ranked){
  hideEl('quizArea');
  showEl('resultsArea');

  $('resSubtitle').textContent = track === 'academic'
    ? 'Based on your academic background and goals — your top 3 AI-matched skill paths'
    : 'Based on your personal interests and strengths — your top 3 AI-matched skill paths';

  let recs = [];

  // Validate AI data
  if(aiData && Array.isArray(aiData.recommendations) && aiData.recommendations.length >= 3){
    recs = aiData.recommendations.slice(0, 3).map((r, i) => ({
      ...r,
      skillKey: SKILLS[r.skillKey] ? r.skillKey : (ranked[i] || 'tech')
    }));
  } else {
    // Fallback: local scoring
    recs = ranked.slice(0, 3).map((k, i) => ({
      skillKey: k,
      matchScore: Math.max(72, 95 - i * 8),
      personalReason: "Based on your assessment responses, this skill strongly aligns with your stated strengths, learning style and career goals.",
      marketInsight: "This skill commands strong global demand with competitive salaries and remote work opportunities in 2025.",
      quickWin: "Start with the free introductory course on Coursera or YouTube this weekend to test your interest and get a feel for the field."
    }));
  }

  const grid = $('resGrid');
  grid.innerHTML = '';

  const rankLabels = ['🥇 Best Match', '🥈 Strong Fit', '🥉 Great Option'];
  const rankCls    = ['rk1', 'rk2', 'rk3'];

  recs.forEach((rec, i) => {
    const sk = SKILLS[rec.skillKey];
    if(!sk) return;

    const card = document.createElement('div');
    card.className = 'res-card';
    card.style.animationDelay = (i * 0.12) + 's';

    card.innerHTML = `
      <div class="res-rank ${rankCls[i]}">${rankLabels[i]}</div>
      <span class="res-ic">${sk.icon}</span>
      <h3>${sk.name}</h3>
      <div class="match-row">
        <div class="match-track">
          <div class="match-fill" data-pct="${rec.matchScore}%"></div>
        </div>
        <span class="match-pct">${rec.matchScore}% match</span>
      </div>
      <p class="res-desc">${escHtml(rec.personalReason || sk.desc)}</p>
      <div class="res-tags">${sk.tags.map(t => `<span>${t}</span>`).join('')}</div>
      ${rec.marketInsight
        ? `<div class="ibox ibox-m">📈 ${escHtml(rec.marketInsight)}</div>`
        : ''}
      ${rec.quickWin
        ? `<div class="ibox ibox-w">⚡ This week: ${escHtml(rec.quickWin)}</div>`
        : ''}
      <div class="roadmap-sec">
        <div class="roadmap-lbl">📍 5-Step Learning Roadmap</div>
        ${sk.roadmap.map((s, j) =>
          `<div class="roadmap-step">${j+1}. ${escHtml(s)}</div>`).join('')}
      </div>`;

    grid.appendChild(card);
  });

  // Animate match bars after brief delay
  setTimeout(() => {
    document.querySelectorAll('.match-fill').forEach(el => {
      el.style.width = el.dataset.pct;
    });
  }, 300);

  $('resultsArea').scrollIntoView({behavior:'smooth', block:'start'});

  // Email admin with assessment results
  sendAssessmentEmail(recs);
}

// Send assessment result notification to admin
async function sendAssessmentEmail(recs){
  const cfg = window.EMAILJS_CONFIG || {};
  if(!ejsReady()) return;

  const skillNames = recs.slice(0,3)
    .map((r,i) => `${i+1}. ${SKILLS[r.skillKey]?.name || r.skillKey} (${r.matchScore}% match)`)
    .join('\n');

  const answerSummary = Object.entries(ans).map(([qid, a]) => {
    const q = qs.find(q => q.id === qid);
    return `Q: ${q ? q.text : qid}\nA: ${a.l}`;
  }).join('\n\n');

  await sendEmail(cfg.assessTemplateId, {
    to_email:        cfg.adminEmail,
    to_name:         'PathFinder Admin',
    subject:         `🧠 New Assessment Completed — ${track === 'academic' ? 'Academic' : 'Personal'} Track`,
    track_type:      track === 'academic' ? 'Academic Track' : 'Personal Interest Track',
    top_skills:      skillNames,
    full_answers:    answerSummary,
    completed_at:    new Date().toLocaleString('en-GB', {
                       weekday:'long', year:'numeric', month:'long',
                       day:'numeric', hour:'2-digit', minute:'2-digit'
                     }),
    // Blank student fields (anonymous unless they book)
    student_name:    'Anonymous Student',
    student_email:   '—',
    reply_to:        cfg.adminEmail || 'noreply@pathfinder.com'
  });
}

// ── EMAIL HELPERS ─────────────────────────────────────
function ejsReady(){
  // All credentials are fully embedded — always ready
  const cfg = window.EMAILJS_CONFIG || {};
  return !!(cfg.publicKey && cfg.serviceId && cfg.bookingTemplateId && cfg.adminEmail);
}

function ejsInit(){
  const cfg = window.EMAILJS_CONFIG || {};
  if(window.emailjs && cfg.publicKey){
    try { emailjs.init({ publicKey: cfg.publicKey }); return true; } catch(e){}
  }
  return false;
}

// Send email via EmailJS — returns true on success
async function sendEmail(templateId, params){
  ejsInit(); // ensure always initialised
  const cfg = window.EMAILJS_CONFIG || {};
  if(!cfg.serviceId || !templateId || templateId.includes('YOUR_')) return false;
  try {
    await emailjs.send(cfg.serviceId, templateId, params);
    return true;
  } catch(e){
    console.error('EmailJS send error:', e);
    return false;
  }
}

// ── COUNSELLING BOOKING ───────────────────────────────
async function doBook(){
  const name  = $('cName').value.trim();
  const email = $('cEmail').value.trim();
  const date  = $('cDate').value;
  const type  = $('cType').value;
  const note  = $('cNote').value.trim();

  // ── Validation ──
  if(!name)  { shakeEl('cName');  toast('Please enter your full name', 'err');               return; }
  if(!email) { shakeEl('cEmail'); toast('Please enter your email address', 'err');            return; }
  if(!validEmail(email)){ shakeEl('cEmail'); toast('Please enter a valid email address', 'err'); return; }
  if(!date)  { shakeEl('cDate');  toast('Please select a preferred date', 'err');             return; }
  if(!type)  { shakeEl('cType');  toast('Please select a session type', 'err');               return; }

  const selDate = new Date(date + 'T00:00:00');
  const todayD  = new Date(); todayD.setHours(0,0,0,0);
  if(selDate < todayD){ shakeEl('cDate'); toast('Please select a future date', 'err'); return; }

  const btn = $('bookBtn');
  btn.textContent = 'Preparing your session brief…';
  btn.disabled = true;

  const cfg           = window.EMAILJS_CONFIG || {};
  const formattedDate = fmtDate(date);
  const bookedAt      = new Date().toLocaleString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const bookingRef    = 'PF-' + Date.now().toString(36).toUpperCase();

  // ── Step 1: AI generates a FULL session brief (summary + outreach) ──
  // This is sent to YOU (the admin) as a professional session summary
  // It also generates the student-facing confirmation message

  let adminBrief    = '';   // rich brief for you (the admin/counsellor)
  let studentMsg    = '';   // warm confirmation for the student
  let outreachEmail = '';   // a ready-to-send outreach email you can forward/copy

  btn.textContent = 'AI is preparing session brief…';

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        messages: [{ role: "user", content:
`You are the AI backend of PathFinder, a career guidance platform. A student just booked a counselling session.

BOOKING DETAILS:
- Student Name: ${name}
- Student Email: ${email}
- Session Type: ${type}
- Preferred Date: ${formattedDate}
- Booking Reference: ${bookingRef}
- Student's Message: ${note || 'No message provided — student did not add a note.'}
- Booked At: ${bookedAt}

Your job: Generate THREE separate texts. Return ONLY valid JSON — no markdown, no extra text.

{
  "admin_brief": "A professional 150-200 word session brief for the counsellor/admin. Include: (1) Student profile summary based on their session type and note, (2) Likely pain points and confusion areas to explore, (3) 3 specific preparation tips for the counsellor before this session, (4) Suggested session agenda (opening, middle, close). Write it as a professional internal document.",

  "student_confirmation": "A warm, personal 3-sentence message to the student confirming their booking. Mention their name, session type, date, and booking reference. End with one encouraging sentence about what they will gain. Do NOT use a greeting or sign-off — just the message text.",

  "outreach_email": "A complete, ready-to-send outreach email FROM the counsellor TO the student. Include: Subject line on the first line starting with 'Subject: ', then a blank line, then the full email body. The email should: introduce the counsellor warmly, confirm the session details (type, date, reference), ask 2 specific preparation questions the student should think about before the session, explain what to bring/prepare, and end with a warm closing. Make it feel personal, professional and encouraging. Sign off as 'The PathFinder Team'."
}`
        }]
      })
    });
    const json = await res.json();
    const raw  = (json.content?.[0]?.text || '').replace(/```json|```/g,'').trim();
    const parsed = JSON.parse(raw);
    adminBrief    = parsed.admin_brief         || '';
    studentMsg    = parsed.student_confirmation|| '';
    outreachEmail = parsed.outreach_email      || '';
  } catch(e){
    console.warn('AI brief generation failed:', e.message);
  }

  // Fallbacks
  if(!studentMsg){
    studentMsg = `Hi ${name}, your ${type} session has been confirmed for ${formattedDate} (Ref: ${bookingRef}). Our counsellor will reach out to you at ${email} within 24 hours with everything you need. You're in the right place — this session will bring real clarity to your path.`;
  }
  if(!adminBrief){
    adminBrief = `NEW BOOKING\nStudent: ${name} (${email})\nSession: ${type}\nDate: ${formattedDate}\nRef: ${bookingRef}\nNote: ${note || 'None'}\nBooked: ${bookedAt}`;
  }
  if(!outreachEmail){
    outreachEmail = `Subject: Your PathFinder Session is Confirmed — ${formattedDate}\n\nDear ${name},\n\nThank you for booking a ${type} session with PathFinder. Your session is confirmed for ${formattedDate} (Reference: ${bookingRef}).\n\nWe will send you a meeting link and further details within 24 hours.\n\nWarm regards,\nThe PathFinder Team`;
  }

  // Extract subject line from outreach email
  const outreachLines   = outreachEmail.split('\n');
  const outreachSubject = outreachLines[0].replace(/^Subject:\s*/i,'').trim();
  const outreachBody    = outreachLines.slice(2).join('\n').trim(); // skip subject + blank line

  btn.textContent = 'Sending emails…';

  // ── Step 2: Email YOU (admin) — full professional session brief ──
  const adminSent = await sendEmail(cfg.bookingTemplateId, {
    to_email:         cfg.adminEmail,
    to_name:          'PathFinder Admin',
    subject:          `📅 New Booking [${bookingRef}] — ${name} | ${type} | ${formattedDate}`,
    booking_ref:      bookingRef,
    student_name:     name,
    student_email:    email,
    session_type:     type,
    session_date:     formattedDate,
    booked_at:        bookedAt,
    student_note:     note || 'No message provided.',
    ai_message:       adminBrief,          // ← full AI session brief for YOU
    outreach_email:   outreachBody,        // ← ready-to-send outreach email body
    outreach_subject: outreachSubject,     // ← subject line for that outreach
    reply_to:         email                // ← reply goes directly to student
  });

  // ── Step 3: Email the STUDENT — warm confirmation ──
  await sendEmail(cfg.bookingTemplateId, {
    to_email:         email,
    to_name:          name,
    subject:          `✅ Booking Confirmed [${bookingRef}] — ${formattedDate} | PathFinder`,
    booking_ref:      bookingRef,
    student_name:     name,
    student_email:    email,
    session_type:     type,
    session_date:     formattedDate,
    booked_at:        bookedAt,
    student_note:     note || '—',
    ai_message:       studentMsg,          // ← warm AI-written confirmation for student
    outreach_email:   outreachBody,        // ← the counsellor outreach preview
    outreach_subject: outreachSubject,
    reply_to:         cfg.adminEmail || 'support@pathfinder.com'
  });

  if(!ejsReady()){
    console.warn('⚠️ EmailJS not fully configured. Add your publicKey, bookingTemplateId, assessTemplateId and adminEmail in index.html. Service ID is already set: service_uws34sm');
  }

  // ── Step 4: Update UI ──
  btn.textContent   = '✅ Session Booked!';
  btn.style.background = 'linear-gradient(135deg,#06d6a0,#4fc3f7)';

  // Show rich success box
  $('bookSuccessMsg').innerHTML = `
    <strong style="display:block;margin-bottom:.5rem">${studentMsg}</strong>
    <span style="display:block;margin-top:.8rem;font-size:.78rem;opacity:.7">
      Booking Ref: <strong>${bookingRef}</strong> &nbsp;·&nbsp;
      ${adminSent ? '📧 Confirmation sent to '+email : 'Complete EmailJS setup to activate emails'}
    </span>`;

  $('bookSuccess').style.display = 'block';
  $('bookSuccess').scrollIntoView({behavior:'smooth', block:'nearest'});

  toast(
    adminSent ? `Booked! Confirmation sent to ${email} 📧` : `Booked! (Add EmailJS keys to activate emails)`,
    'ok', 6000
  );

  setTimeout(() => {
    btn.textContent      = 'Book My Session →';
    btn.style.background = '';
    btn.disabled         = false;
  }, 12000);
}

// ── AI CHAT ───────────────────────────────────────────
const CHAT_SYSTEM = `You are PathAI, the expert career and skills advisor at PathFinder — a platform that helps students discover their ideal learning path.

Your mission: Help students — especially African students — navigate career confusion, decide what to study, choose skills to learn, and plan realistic learning roadmaps.

Your expertise covers: Software Development, Data Science, AI/ML, UI/UX Design, Digital Marketing, Cybersecurity, FinTech, Product Management, Entrepreneurship, Health Tech, EdTech, Consulting, HR, Content Creation and all major academic disciplines.

Communication rules:
- Be warm, empathetic and encouraging — many students are anxious and confused
- Be specific and practical — mention real tools, platforms, salary ranges and timelines
- Keep responses concise: 2–4 short paragraphs maximum
- Use plain conversational text — no markdown headers or bullet lists
- Use 1–2 relevant emojis per message for warmth, not more
- Always end with one concrete next step OR one thoughtful follow-up question
- Never make students feel judged, stupid or late. Everyone starts somewhere.`;

function chipAsk(msg){
  $('chatIn').value = msg;
  doChat();
}

async function doChat(){
  if(chatBusy) return;
  const input = $('chatIn');
  const msg = input.value.trim();
  if(!msg) return;

  input.value = '';
  appendMsg('user', msg);
  chatHist.push({role:'user', content:msg});

  chatBusy = true;
  $('typing').style.display = 'flex';
  scrollChat();

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: CHAT_SYSTEM,
        messages: chatHist.slice(-16) // keep last 8 turns for context
      })
    });

    const json = await res.json();
    const reply = json.content?.[0]?.text ||
      "I'm here to help! Could you share a bit more about your situation so I can give you the best advice? 😊";

    chatHist.push({role:'assistant', content:reply});
    $('typing').style.display = 'none';
    appendMsg('ai', reply);

  } catch(e){
    $('typing').style.display = 'none';
    appendMsg('ai', "I'm having a brief connection issue — please try sending your message again. I'm still here for you! 🙏");
  }

  chatBusy = false;
}

function appendMsg(role, text){
  const container = $('chatMsgs');
  const div = document.createElement('div');
  div.className = 'msg' + (role === 'user' ? ' user-msg' : '');

  const av = document.createElement('div');
  av.className = 'msg-av';
  av.textContent = role === 'ai' ? '🤖' : '👤';

  const bub = document.createElement('div');
  bub.className = 'bubble';

  // Split into paragraphs for readability
  const paras = text.split('\n').filter(p => p.trim().length > 0);
  bub.innerHTML = paras.map(p => `<p>${escHtml(p)}</p>`).join('') +
                  `<span class="msg-time">${nowTime()}</span>`;

  div.appendChild(av);
  div.appendChild(bub);
  container.appendChild(div);

  // Smooth entrance
  div.style.opacity = '0';
  div.style.transform = 'translateY(8px)';
  requestAnimationFrame(() => {
    div.style.transition = 'opacity .25s ease, transform .25s ease';
    div.style.opacity = '1';
    div.style.transform = 'translateY(0)';
  });

  scrollChat();
}

function scrollChat(){
  requestAnimationFrame(() => {
    const box = $('chatMsgs');
    box.scrollTop = box.scrollHeight;
  });
}

// ── TESTIMONIALS ──────────────────────────────────────
function initTestimonials(){
  const track  = $('tTrack');
  const cards  = track.querySelectorAll('.t-card');
  const dotsEl = $('tDots');
  let cur = 0;

  cards.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 't-dot' + (i === 0 ? ' on' : '');
    d.setAttribute('aria-label', `Testimonial ${i+1}`);
    d.addEventListener('click', () => goToCard(i));
    dotsEl.appendChild(d);
  });

  function goToCard(i){
    cur = i;
    const w = track.offsetWidth;
    track.scrollTo({left: i * (cards[0].offsetWidth + 20), behavior:'smooth'});
    dotsEl.querySelectorAll('.t-dot').forEach((d, j) =>
      d.classList.toggle('on', j === i));
  }

  // Auto-scroll
  const autoPlay = setInterval(() => goToCard((cur + 1) % cards.length), 5000);
  track.addEventListener('mouseenter', () => clearInterval(autoPlay), {once:true});
}

// ── UTILITIES ─────────────────────────────────────────
function pause(ms){ return new Promise(r => setTimeout(r, ms)) }

function nowTime(){
  return new Date().toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'});
}

function fmtDate(d){
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday:'long', month:'long', day:'numeric', year:'numeric'
  });
}

function validEmail(e){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function escHtml(str){
  if(typeof str !== 'string') return '';
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function shakeEl(id){
  const el = $(id);
  if(!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 500);
}

// ── INIT ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set min booking date to today
  const today = new Date().toISOString().split('T')[0];
  $('cDate').setAttribute('min', today);

  // The email live banner — show briefly then auto-fade after 8s
  // Admin can dismiss it manually; it stays hidden after that
  const guide = $('setupGuide');
  if(guide){
    const dismissed = localStorage.getItem('pf_banner_dismissed');
    if(dismissed === '1'){
      guide.style.display = 'none';
    } else {
      // Auto-hide after 8 seconds so it doesn't clutter the page for students
      setTimeout(() => {
        if(guide){
          guide.style.transition = 'opacity .8s ease';
          guide.style.opacity = '0';
          setTimeout(() => { guide.style.display = 'none'; }, 800);
        }
      }, 8000);
    }
  }

  // Init testimonials
  initTestimonials();

  // Observe all .sr elements for scroll reveal
  document.querySelectorAll('.sr').forEach(el => revealObs.observe(el));
});

function dismissGuide(){
  const guide = $('setupGuide');
  if(guide){
    guide.style.transition = 'opacity .4s ease';
    guide.style.opacity = '0';
    setTimeout(() => { guide.style.display = 'none'; }, 400);
  }
  try { localStorage.setItem('pf_banner_dismissed','1'); } catch(e){}
}
