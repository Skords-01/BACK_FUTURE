// BACK_FUTURE — redesign prototype
const { useState, useEffect, useRef, useMemo } = React;

/* ---------- DATA ---------- */

const ERAS = [
  { id: 1, range: [1991, 1999], name: "Незалежність і модем", short: "1991–1999", color: "#3b6e8f", tone: "1991—1999. Доба касет, перших $1, дисків Windows 95 і модему «диал-ап»." },
  { id: 2, range: [2000, 2009], name: "Євро, флешки, MP3", short: "2000–2009", color: "#c89034", tone: "2000—2009. Євро в кишені, mp3-плеєри, перший iPhone, помаранчевий Київ." },
  { id: 3, range: [2010, 2013], name: "Смартфон і соцмережа", short: "2010–2013", color: "#7a8b3a", tone: "2010—2013. Instagram, Bitcoin white paper, бозон Хіггса, Voyager-1 за межами." },
  { id: 4, range: [2014, 2021], name: "Війна на сході, e-Україна", short: "2014–2021", color: "#a02f15", tone: "2014—2021. Майдан, Крим, Дія, ChatGPT уже близько, Лонг-COVID." },
  { id: 5, range: [2022, 2026], name: "Велика війна і ШІ", short: "2022–2026", color: "#5e3a7a", tone: "2022—2026. Повномасштабна війна, генеративний ШІ, перші мРНК-Нобелі." }
];

function eraOf(year) {
  return ERAS.find(e => year >= e.range[0] && year <= e.range[1]) || ERAS[0];
}

const SUBJECTS = {
  ast: { code: "АСТ", name: "Астрономія", color: "#3b6e8f" },
  bio: { code: "БІО", name: "Біологія",   color: "#557a3a" },
  geo: { code: "ГЕО", name: "Географія",  color: "#7a5e3a" },
  ist: { code: "ІСТ", name: "Історія",    color: "#a02f15" },
  fiz: { code: "ФІЗ", name: "Фізика",     color: "#5e3a7a" },
  tex: { code: "ТЕХ", name: "Технологія", color: "#2a2218" },
  med: { code: "МЕД", name: "Медицина",   color: "#a83a5e" },
  kul: { code: "КУЛ", name: "Культура",   color: "#c89034" },
  ekl: { code: "ЕКЛ", name: "Екологія",   color: "#3a7a5e" }
};

// Facts for the example year page (2012). Each: subject, year, title, body, source.
const FACTS_2012_FORWARD = [
  { y: 2012, s: "fiz", t: "Бозон Хіггса виявили експериментально", b: "ATLAS і CMS у CERN зафіксували частку, відповідальну за «масу маси». 50 років теорії — підтверджено експериментом.", src: "CERN" },
  { y: 2012, s: "tex", t: "Voyager-1 покинув Сонячну систему", b: "Перший рукотворний об'єкт у міжзоряному просторі. Він і зараз летить — носить «Золоту платівку» з музикою Землі.", src: "NASA" },
  { y: 2013, s: "bio", t: "У чашці виростили мініатюрний мозок", b: "З нейральних стовбурових клітин — органоїд завбільшки з горошину. Початок ери модельних мозків.", src: "Nature" },
  { y: 2014, s: "ist", t: "Революція Гідності та окупація Криму", b: "Майдан змінив траєкторію країни. У лютому 2014 Росія анексувала Крим — почалась російсько-українська війна.", src: "архіви" },
  { y: 2014, s: "tex", t: "Kubernetes — Google віддав інфраструктуру у open-source", b: "Те, як зараз працюють тисячі сервісів у світі, виросло з цього релізу. Зокрема — й сайти твоїх банків.", src: "CNCF" },
  { y: 2015, s: "fiz", t: "LIGO напряму зафіксував гравітаційні хвилі", b: "Простір-час справді хвилюється. Ейнштейн мав рацію, і це нарешті почули детектори.", src: "LIGO" },
  { y: 2015, s: "kul", t: "«Гамільтон» переписав мову бродвейського мюзиклу", b: "Реп замість аріозо, темношкірий каст у ролях батьків-засновників США. Театр перестав бути «для бабусь».", src: "NYT" },
  { y: 2016, s: "tex", t: "AlphaGo переграв чемпіона з го Лі Седоля", b: "Гру, яку вважали недоступною для машин ще 10 років, ШІ виграв 4:1. Нейромережі вийшли з лабораторії.", src: "DeepMind" },
  { y: 2016, s: "kul", t: "Джамала виграла «Євробачення-2016» з піснею «1944»", b: "Україна вдруге взяла головний пісенний приз Європи — і нагадала світу про депортацію кримських татар.", src: "EBU" },
  { y: 2019, s: "ast", t: "Уперше сфотографували чорну діру", b: "Телескоп Event Horizon Telescope побудував зображення з 8 радіотелескопів планети. Не уява художника — справжнє фото.", src: "EHT" },
  { y: 2020, s: "med", t: "мРНК-вакцини стали реальністю — і отримали Нобеля", b: "Десятиліття роботи Каріко й Вайсмана нарешті дістали підтвердження в пандемії — і Нобелівську у 2023.", src: "Nobel" },
  { y: 2020, s: "tex", t: "«Дія»: держава у смартфоні", b: "Україна перша у світі прирівняла цифровий паспорт до фізичного. 22 млн користувачів зараз.", src: "diia.gov.ua" },
  { y: 2022, s: "tex", t: "ChatGPT відкрив генеративний ШІ для всіх", b: "За 5 днів — мільйон користувачів. За рік — мова, переклад, код і дизайн більше не ексклюзив експертів.", src: "OpenAI" },
  { y: 2022, s: "ast", t: "James Webb показав найдальші зорі Всесвіту", b: "Його перші знімки — це світло, що летіло до нас 13.5 мільярда років. Підручник 2012 цього не знав.", src: "NASA" },
  { y: 2023, s: "ekl", t: "Підрив Каховської ГЕС — найбільша екокатастрофа України", b: "Зникло Каховське море площею з пів-Кіпру. Наслідки — на десятиліття.", src: "ООН" },
  { y: 2024, s: "ast", t: "Китай привіз зразки зі зворотного боку Місяця", b: "Місія «Чан'е-6» вперше повернула на Землю ґрунт із далекого боку. Туди не сідала жодна країна до того.", src: "CNSA" }
];

// "Тоді…" anchors per year
const EPOCH_2012 = [
  { k: "Президент",   v: "В. Янукович" },
  { k: "Курс",        v: "8.0 ₴/$" },
  { k: "Хіт року",    v: "Gangnam Style" },
  { k: "Кінотеатр",   v: "«Месники»" },
  { k: "У кишені",    v: "iPhone 4S, Nokia E72" },
  { k: "Соцмережа",   v: "ВКонтакті, Facebook" },
  { k: "Подія Євро",  v: "Євро-2012, Київ–Варшава" },
  { k: "Вартість 🥖", v: "≈ 4 ₴" }
];

const DECADES = [
  { d: "90-ті", y: 1995 },
  { d: "00-ті", y: 2003 },
  { d: "10-ті", y: 2014 },
  { d: "20-ті", y: 2022 }
];

/* ---------- ATOMS ---------- */

function Odometer({ value, onChange }) {
  // 4-digit year, each digit is a vertical strip we translate
  const digits = String(value).padStart(4, "0").split("").map(Number);
  return (
    <div className="odo" role="group" aria-label="Рік випуску">
      {digits.map((d, i) => (
        <div className="odo__col" key={i}>
          <div className="odo__strip" style={{ transform: `translateY(${-d * 10}%)` }}>
            {Array.from({ length: 10 }, (_, n) => <span key={n}>{n}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function YearStepper({ value, setValue, min = 1991, max = 2026 }) {
  const clamp = v => Math.max(min, Math.min(max, v));
  return (
    <div className="stepper">
      <button className="stepper__btn" onClick={() => setValue(clamp(value - 1))} aria-label="Попередній рік">−</button>
      <Odometer value={value} />
      <button className="stepper__btn" onClick={() => setValue(clamp(value + 1))} aria-label="Наступний рік">+</button>
    </div>
  );
}

function EraDot({ era, active, onClick }) {
  return (
    <button
      className={`era ${active ? "era--active" : ""}`}
      onClick={onClick}
      style={{ "--era-color": era.color }}
      aria-pressed={active}
    >
      <span className="era__num">0{era.id}</span>
      <span className="era__name">{era.name}</span>
      <span className="era__range">{era.short}</span>
    </button>
  );
}

function SubjectChip({ k, count }) {
  const s = SUBJECTS[k];
  return (
    <span className="chip" style={{ "--chip-color": s.color }}>
      <span className="chip__code">{s.code}</span>
      <span className="chip__name">{s.name}</span>
      {count != null && <span className="chip__count">{count}</span>}
    </span>
  );
}

function Stamp({ children, rot = -3 }) {
  return <span className="stamp" style={{ transform: `rotate(${rot}deg)` }}>{children}</span>;
}

/* ---------- HEADER ---------- */

function Header({ theme, setTheme, route, go }) {
  return (
    <header className="hdr">
      <button className="hdr__logo" onClick={() => go({ name: "home" })}>
        <span className="hdr__mark">◐</span>
        <span className="hdr__word">BACK_FUTURE</span>
        <span className="hdr__sub">укр · з 1991</span>
      </button>
      <nav className="hdr__nav">
        <a onClick={() => go({ name: "home" })} className={route.name === "home" ? "is-on" : ""}>Головна</a>
        <a onClick={() => go({ name: "year", year: 2012 })} className={route.name === "year" ? "is-on" : ""}>2012 — приклад</a>
        <a>Методологія</a>
        <a>Про проєкт</a>
        <button className="theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Тема">
          {theme === "dark" ? "☼ світло" : "☽ темно"}
        </button>
      </nav>
    </header>
  );
}

/* ---------- HOME ---------- */

function Home({ go }) {
  const [year, setYear] = useState(2012);
  const era = eraOf(year);
  const yearsAgo = 2026 - year;
  const factCount = useMemo(() => 8 + Math.floor((2026 - year) * 3.2), [year]);

  return (
    <main className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero__rule"></div>
        <div className="hero__top">
          <span className="kicker">№ 001 · просвітницький журнал · українською</span>
          <span className="kicker kicker--right">видання 2026</span>
        </div>

        <h1 className="hero__title">
          Що ти<br/>
          <em>пропустив</em><br/>
          після випускного?
        </h1>

        <p className="hero__lede">
          Введи рік випуску — отримай стрічку оновлень у науці, історії й світі від&nbsp;тих часів.
          Стисло, науково-популярно, з&nbsp;джерелами.
        </p>

        <div className="machine">
          <div className="machine__label">
            <span className="machine__l1">МАШИНА ЧАСУ · v. 1.0</span>
            <span className="machine__l2">↓ обери рік випуску ↓</span>
          </div>
          <YearStepper value={year} setValue={setYear} />
          <button className="machine__go" onClick={() => go({ name: "year", year })}>
            <span>↵ ПОЇХАЛИ</span>
            <span className="machine__go-sub">розрахувати</span>
          </button>
        </div>

        <div className="counter">
          <div className="counter__num">{factCount}</div>
          <div className="counter__txt">
            <strong>відкриттів</strong> ти пропустив<br/>
            за <em>{yearsAgo} років</em> після {year}-го.
            <span className="counter__era" style={{ "--era-color": era.color }}>· епоха «{era.name}»</span>
          </div>
        </div>

        <div className="quick">
          <span className="quick__l">Не пам'ятаєш точно?</span>
          {DECADES.map(d => (
            <button key={d.d} className="quick__b" onClick={() => setYear(d.y)}>{d.d}</button>
          ))}
          <button className="quick__b quick__b--rand" onClick={() => setYear(1991 + Math.floor(Math.random()*36))}>
            ※ випадковий
          </button>
        </div>
      </section>

      {/* ERAS */}
      <section className="block">
        <div className="block__head">
          <h2>П'ять епох</h2>
          <span className="block__hint">шкільні програми &amp; покоління, 1991—сьогодні</span>
        </div>
        <div className="eras">
          {ERAS.map(e => (
            <EraDot key={e.id} era={e} active={e.id === era.id} onClick={() => setYear(e.range[0] + 2)} />
          ))}
        </div>
        <p className="eras__tone">{era.tone}</p>
      </section>

      {/* TIMELINE strip */}
      <section className="block">
        <div className="block__head">
          <h2>Густина часу</h2>
          <span className="block__hint">висота смужки = кількість фактів того року</span>
        </div>
        <DensityStrip year={year} setYear={setYear} />
      </section>

      {/* SUBJECTS */}
      <section className="block">
        <div className="block__head">
          <h2>Тематичні рубрики</h2>
          <span className="block__hint">9 предметів · 120+ фактів у базі</span>
        </div>
        <div className="subjects">
          {Object.keys(SUBJECTS).map(k => <SubjectChip key={k} k={k} count={Math.floor(Math.random()*18)+6} />)}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="block how">
        <div className="block__head">
          <h2>Як це працює</h2>
        </div>
        <ol className="how__list">
          <li><span className="how__n">01</span><strong>Введи рік випуску.</strong> Від 1991 до сьогодні.</li>
          <li><span className="how__n">02</span><strong>Отримаєш стрічку.</strong> 9 предметів · хронологічно · з епіграфом епохи.</li>
          <li><span className="how__n">03</span><strong>Кожен факт — з джерелом.</strong> Розгорни деталі або поділись як вирізкою.</li>
        </ol>
      </section>

      {/* PRESETS */}
      <section className="block presets">
        <div className="block__head">
          <h2>Або одразу</h2>
        </div>
        <div className="presets__grid">
          {[
            { y: 2005, t: "Закінчив школу у 2005-му", n: "21 рік новин" },
            { y: 2012, t: "Вишівський диплом 2012", n: "14 років новин" },
            { y: 2024, t: "Молодший брат 2024-го", n: "2 роки новин" }
          ].map(p => (
            <button key={p.y} className="presets__card" onClick={() => go({ name: "year", year: p.y })}>
              <div className="presets__y">{p.y}</div>
              <div className="presets__t">{p.t}</div>
              <div className="presets__n">{p.n} →</div>
            </button>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function DensityStrip({ year, setYear }) {
  // Fake density 1991..2026
  const years = Array.from({length: 2026-1991+1}, (_,i)=>1991+i);
  const counts = years.map(y => {
    // peaks around 2014-2016, 2020-2024
    const base = 2 + Math.abs(Math.sin(y*0.7))*6;
    const peak1 = Math.exp(-Math.pow((y-2015)/3,2))*8;
    const peak2 = Math.exp(-Math.pow((y-2022)/2,2))*10;
    return Math.round(base + peak1 + peak2);
  });
  const max = Math.max(...counts);
  return (
    <div className="density">
      {years.map((y, i) => {
        const era = eraOf(y);
        const h = (counts[i] / max) * 100;
        const active = y === year;
        const tick = y % 5 === 0;
        return (
          <button
            key={y}
            className={`density__bar ${active ? "is-on" : ""}`}
            onClick={() => setYear(y)}
            style={{ "--h": `${h}%`, "--c": era.color }}
            aria-label={`${y} рік`}
            title={`${y} · ${counts[i]} фактів`}
          >
            <span className="density__cap" />
            {tick && <span className="density__year">{y}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- YEAR PAGE ---------- */

function YearPage({ year, go }) {
  const [filter, setFilter] = useState("all");
  const era = eraOf(year);
  const yearsAgo = 2026 - year;
  const facts = FACTS_2012_FORWARD;
  const filtered = filter === "all" ? facts : facts.filter(f => f.s === filter);

  return (
    <main className="year">
      <section className="year__hero">
        <div className="year__top">
          <button className="back" onClick={() => go({ name: "home" })}>← головна</button>
          <span className="kicker">випуск №{year - 1990}</span>
        </div>

        <div className="year__big">
          <div className="year__num">{year}</div>
          <div className="year__meta">
            <Stamp rot={-4}>САМЕ ТУТ</Stamp>
            <p className="year__since">
              Минуло <strong>{yearsAgo} років</strong>. Епоха «{era.name}».<br/>
              Тоді тобі було, скажімо, <strong>17</strong>. Сьогодні — <strong>{17 + yearsAgo}</strong>.
            </p>
          </div>
        </div>

        {/* THEN */}
        <aside className="then">
          <div className="then__head">
            <span className="then__year">{year}-й</span>
            <span className="then__sub">контекст · епіграф епохи</span>
          </div>
          <dl className="then__grid">
            {EPOCH_2012.map(e => (
              <div className="then__item" key={e.k}>
                <dt>{e.k}</dt>
                <dd>{e.v}</dd>
              </div>
            ))}
          </dl>
        </aside>

        {/* Filters */}
        <div className="filters">
          <button className={filter === "all" ? "is-on" : ""} onClick={() => setFilter("all")}>
            усі <em>{facts.length}</em>
          </button>
          {Object.keys(SUBJECTS).filter(k => facts.some(f => f.s === k)).map(k => {
            const c = facts.filter(f => f.s === k).length;
            return (
              <button key={k} className={filter === k ? "is-on" : ""} onClick={() => setFilter(k)} style={{"--chip-color": SUBJECTS[k].color}}>
                {SUBJECTS[k].code} · {SUBJECTS[k].name} <em>{c}</em>
              </button>
            );
          })}
        </div>
      </section>

      {/* TIMELINE */}
      <section className="timeline">
        <div className="timeline__rail">
          {filtered.map((f, i) => (
            <FactCard key={i} f={f} fromYear={year} />
          ))}
        </div>
      </section>

      {/* PAGINATION */}
      <section className="ynav">
        <button className="ynav__b" onClick={() => go({ name: "year", year: Math.max(1991, year - 1) })}>
          <span className="ynav__sub">← попередній</span>
          <span className="ynav__y">{year - 1}</span>
        </button>
        <button className="ynav__b ynav__b--ctr" onClick={() => go({ name: "home" })}>
          <span className="ynav__sub">змінити рік</span>
          <span className="ynav__y">●</span>
        </button>
        <button className="ynav__b ynav__b--r" onClick={() => go({ name: "year", year: Math.min(2026, year + 1) })}>
          <span className="ynav__sub">наступний →</span>
          <span className="ynav__y">{year + 1}</span>
        </button>
      </section>

      <Footer />
    </main>
  );
}

function FactCard({ f, fromYear }) {
  const s = SUBJECTS[f.s];
  const offset = f.y - fromYear;
  const [open, setOpen] = useState(false);
  return (
    <article className="fact" style={{ "--c": s.color }}>
      <div className="fact__rail">
        <div className="fact__year">{f.y}</div>
        <div className="fact__delta">{offset === 0 ? "того ж року" : `+${offset} р.`}</div>
        <div className="fact__dot" />
      </div>
      <div className="fact__body">
        <div className="fact__chip">
          <span className="fact__code">{s.code}</span>
          <span className="fact__name">{s.name}</span>
          <span className="fact__src">джерело: {f.src}</span>
        </div>
        <h3 className="fact__title">{f.t}</h3>
        <p className="fact__lede">{f.b}</p>
        <div className="fact__actions">
          <button className="fact__more" onClick={() => setOpen(o => !o)}>
            {open ? "згорнути ↑" : "розгорнути · 3-5 абзаців ↓"}
          </button>
          <button className="fact__share">↗ поділитися як вирізкою</button>
        </div>
        {open && (
          <div className="fact__deep">
            <p>До {f.y}-го це звучало б як фантастика. Зараз — рутина у новинах і підручниках. У цьому розгорнутому фрагменті — 3—5 абзаців науково-популярного тексту з посиланнями на першоджерела, бічними довідками й хронологією подій до й після.</p>
            <p>«Бічна довідка» зліва пояснила б терміни. Інтерактивна карта чи графік ішов би тут. У кінці — блок «До і після» з порівнянням підручника {f.y}-го і сучасного знання.</p>
          </div>
        )}
      </div>
    </article>
  );
}

/* ---------- FOOTER ---------- */

function Footer() {
  return (
    <footer className="ftr">
      <div className="ftr__col">
        <div className="ftr__big">BACK_FUTURE</div>
        <div className="ftr__sub">© 2026 · зроблено в Україні · CC BY-SA</div>
      </div>
      <div className="ftr__col">
        <div className="ftr__h">проєкт</div>
        <a>Методологія</a><a>Про проєкт</a><a>GitHub</a><a>RSS</a>
      </div>
      <div className="ftr__col">
        <div className="ftr__h">підтримати</div>
        <a className="ftr__support">monobank · банка →</a>
        <div className="ftr__note">Просвітницький, без реклами. Підтримка — добровільна.</div>
      </div>
    </footer>
  );
}

/* ---------- APP ---------- */

function App() {
  const [route, setRoute] = useState({ name: "home" });
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const go = (r) => {
    setRoute(r);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <div className="app">
      <Header theme={theme} setTheme={setTheme} route={route} go={go} />
      {route.name === "home" && <Home go={go} />}
      {route.name === "year" && <YearPage year={route.year || 2012} go={go} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
