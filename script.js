/**
 * EcoQazaq - Core Logic & Interactive Engine
 * Responsive SVG Map, Eco-Calculator, Crowdsourcing Reporter, and Gamification.
 * Multi-language support: English, Russian, Kazakh
 */

// ==========================================================================
// 0. Multi-Language System
// ==========================================================================
let currentLanguage = localStorage.getItem('ecoLanguage') || 'ru';
let translations = {};

async function loadTranslations() {
    try {
        const response = await fetch('languages.json');
        translations = await response.json();
    } catch (error) {
        console.error('Error loading translations:', error);
        translations = { en: {}, ru: {}, kk: {} };
    }
}

function t(key) {
    return translations[currentLanguage]?.[key] || translations['ru']?.[key] || key;
}

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLanguage = lang;
    localStorage.setItem('ecoLanguage', lang);
    updateUILanguage();
}

function updateUILanguage() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    
    // Update all attributes with data-i18n-attr-{attrName}
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
        const attrs = JSON.parse(el.getAttribute('data-i18n-attr'));
        for (const [attr, key] of Object.entries(attrs)) {
            el.setAttribute(attr, t(key));
        }
    });
    
    // Dynamic dropdown updates
    populateReporterRegions();
    
    // Dynamic calculator button updates
    updateCalculatorButtons();
    
    // Reload region data if a region is selected
    if (currentSelectedRegion) {
        loadRegionData(currentSelectedRegion);
    } else {
        loadCountryStats();
    }
    
    renderReportsFeed(currentSelectedRegion);
    
    // Render quests with new language
    renderQuests();
}

// ==========================================================================
// 1. Regional Ecological Dataset of Kazakhstan
// ==========================================================================
const regionData = {
    'KZ-VOS': {
        name: 'Восточно-Казахстанская область',
        aqi: 92,
        forest: '6.4%',
        projects: 8,
        threat: 'Выбросы металлургии, смог',
        desc: 'Промышленный хаб с высокой концентрацией свинцово-цинковых и медных производств. Усть-Каменогорск регулярно страдает от смога при неблагоприятных метеоусловиях (НМУ). Ведется озеленение Алтая.',
        trend: [85, 92, 98, 105, 95, 88, 92]
    },
    'KZ-ALA': {
        name: 'Алматинская область и г. Алматы',
        aqi: 118,
        forest: '8.2%',
        projects: 14,
        threat: 'Транспортный смог, ТЭЦ-2 на угле',
        desc: 'Алматы расположен в котловине с плохой вентиляцией. Перевод ТЭЦ-2 на газ и расширение зеленого пояса — главные экологические приоритеты. В области развиваются ветряная и солнечная энергетика.',
        trend: [130, 125, 110, 115, 125, 130, 118]
    },
    'KZ-ZHA': {
        name: 'Жамбылская область',
        aqi: 45,
        forest: '1.2%',
        projects: 5,
        threat: 'Опустынивание, химзаводы',
        desc: 'Основной вызов — деградация почв и засуха. В Таразе фиксируются выбросы фосфорных соединений. Построены крупнейшие в РК солнечные электростанции (Burnoye Solar).',
        trend: [40, 48, 52, 42, 45, 43, 45]
    },
    'KZ-YUZ': {
        name: 'Туркестанская область',
        aqi: 58,
        forest: '2.1%',
        projects: 7,
        threat: 'Маловодье Сырдарьи, пыльные бури',
        desc: 'Интенсивное орошение приводит к дефициту воды. Проводятся посадки саксаула на осушенном дне Аральского моря (более 1 млн га) для борьбы с песчано-соляными бурями.',
        trend: [55, 58, 62, 65, 60, 57, 58]
    },
    'KZ-MAN': {
        name: 'Мангистауская область',
        aqi: 52,
        forest: '0.1%',
        projects: 4,
        threat: 'Нефтяное загрязнение Каспия',
        desc: 'Острейший дефицит пресной воды (опреснительный завод Каспий работает на пределе). Хвостохранилище "Кошкар-Ата" подлежит рекультивации из-за токсичной пыли.',
        trend: [50, 52, 58, 60, 55, 54, 52]
    },
    'KZ-KZY': {
        name: 'Кызылординская область',
        aqi: 48,
        forest: '0.8%',
        projects: 6,
        threat: 'Аральская катастрофа, пыль солончаков',
        desc: 'Зона экологического кризиса. Успешно функционирует Кокаральская плотина, вернувшая воду в Малый Арал. Продолжается лесоразведение на сухом дне моря.',
        trend: [48, 50, 55, 53, 50, 47, 48]
    },
    'KZ-AKT': {
        name: 'Актюбинская область',
        aqi: 68,
        forest: '0.9%',
        projects: 6,
        threat: 'Хромовое загрязнение, выбросы ГПЗ',
        desc: 'Смог над Актобе вызывается старым ферросплавным заводом. Реки Илек и Темир загрязнены бором и хромом. Активисты продвигают раздельный сбор мусора в школах.',
        trend: [65, 72, 75, 68, 70, 72, 68]
    },
    'KZ-SEV': {
        name: 'Северо-Казахстанская область',
        aqi: 32,
        forest: '5.2%',
        projects: 6,
        threat: 'Износ КОС, стихийные свалки',
        desc: 'Один из наиболее экологически благополучных регионов РК. Сохраняется высокая доля лесов. Проблема — изношенность очистных сооружений Петропавловска и загрязнение малых озер.',
        trend: [30, 32, 38, 35, 34, 33, 32]
    },
    'KZ-KUS': {
        name: 'Костанайская область',
        aqi: 38,
        forest: '3.8%',
        projects: 6,
        threat: 'Лесные пожары, карьерная пыль',
        desc: 'Уникальные ленточные сосновые боры регулярно подвергаются угрозе лесных пожаров. Ведется восстановление Аманкарагайского соснового бора силами волонтеров.',
        trend: [38, 42, 45, 40, 39, 41, 38]
    },
    'KZ-PAV': {
        name: 'Павлодарская область',
        aqi: 86,
        forest: '2.5%',
        projects: 8,
        threat: 'Зола угольных ГРЭС Экибастуза',
        desc: 'Концентрация тяжелой промышленности. ГРЭС Экибастуза — главные источники парниковых газов в стране. Ведется установка высокотехнологичных фильтров очистки выбросов.',
        trend: [82, 85, 90, 94, 88, 86, 86]
    },
    'KZ-ZAP': {
        name: 'Западно-Казахстанская область',
        aqi: 40,
        forest: '1.4%',
        projects: 5,
        threat: 'Обмеление реки Жайык (Урал)',
        desc: 'Критическое обмеление трансграничной реки Урал грозит биосистеме региона. Общественные движения Казахстана и России сотрудничают по спасению бассейна реки.',
        trend: [40, 43, 46, 42, 41, 44, 40]
    },
    'KZ-ATY': {
        name: 'Атырауская область',
        aqi: 78,
        forest: '0.2%',
        projects: 6,
        threat: 'Сероводород, испарители НПЗ',
        desc: 'Нефтегазовый регион. Атырауский НПЗ проводит проект по рекультивации полей испарения "Тухлая балка" для ликвидации неприятного запаха серы в городе.',
        trend: [75, 82, 88, 85, 80, 78, 78]
    },
    'KZ-AKM': {
        name: 'Акмолинская область',
        aqi: 46,
        forest: '4.2%',
        projects: 9,
        threat: 'Антропогенная нагрузка на озера',
        desc: 'Включает курорт Бурабай. Озера Бурабай и Щучье страдают от снижения уровня воды и засорения туристами. Внедряются эко-патрули и штрафы за мусор.',
        trend: [45, 52, 50, 46, 48, 45, 46]
    },
    'KZ-KAR': {
        name: 'Карагандинская область',
        aqi: 102,
        forest: '1.1%',
        projects: 11,
        threat: 'Промышленные выбросы Темиртау',
        desc: 'Металлургический комбинат в Темиртау — крупнейший загрязнитель. Жители фиксируют "черный снег" зимой. Идет реализация эко-меморандума по снижению выбросов на 30%.',
        trend: [110, 108, 102, 115, 105, 98, 102]
    },
    'KZ-AST': {
        name: 'Город Астана',
        aqi: 82,
        forest: '1.5%',
        projects: 9,
        threat: 'Дым частного сектора, смог зимой',
        desc: 'Столица газифицирует прилегающие жилые массивы (Коктал, Железнодорожный) для отказа от сжигания угля в печах. Создается масштабный Зеленый пояс вокруг города.',
        trend: [80, 88, 92, 90, 85, 82, 82]
    }
};

// ==========================================================================
// 2. Global State & DOM Selections
// ==========================================================================
let currentSelectedRegion = null;
let userPoints = parseInt(localStorage.getItem('ecoPoints')) || 120;
let completedQuests = JSON.parse(localStorage.getItem('completedQuests')) || [];
let activeStep = 1;
const totalSteps = 3;
let calcAnswers = { step1: '', step2: '', step3: '' };
let currentReportFilter = 'all';
let pendingReportPhoto = null;
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

const reportTypeKeys = {
    'свалка': 'typeDump',
    'смог': 'typeSmog',
    'вода': 'typeWater',
    'вырубка': 'typeDeforest'
};

// DOM Cache
const mapPaths = document.querySelectorAll('path.map-region');
const regionNameEl = document.getElementById('region-name');
const regionAqiBadge = document.getElementById('region-aqi-badge');
const rAqiValEl = document.getElementById('r-aqi-val');
const rForestValEl = document.getElementById('r-forest-val');
const rProjectsValEl = document.getElementById('r-projects-val');
const rThreatValEl = document.getElementById('r-threat-val');
const rDescTextEl = document.getElementById('region-desc-text');
const rReporterRegionSel = document.getElementById('reporter-region');
const reportsFeedEl = document.getElementById('reports-feed-container');
const questsContainer = document.getElementById('quests-list-container');
const activeQuestsCountEl = document.getElementById('active-quests-count');
const userPointsEl = document.getElementById('user-points');
const reporterForm = document.getElementById('reporter-form');
const mapTooltip = document.getElementById('map-tooltip');

function getReportTypeLabel(type) {
    const key = reportTypeKeys[type];
    return key ? t(key) : type;
}

function getAqiStatus(aqi) {
    if (aqi > 90) return { label: t('legendPolluted'), class: 'poor' };
    if (aqi > 50) return { label: t('legendModerate'), class: 'mod' };
    return { label: t('legendClean'), class: 'good' };
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function isSafePhotoSrc(src) {
    return typeof src === 'string' && src.startsWith('data:image/');
}

function getRegionThreat(iso) {
    return t('threat_' + iso.replace(/-/g, '_'));
}

// ==========================================================================
// 3. Theme Management
// ==========================================================================
function initTheme() {
    const savedTheme = localStorage.getItem('ecoTheme') || 'emerald';
    setTheme(savedTheme);
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = e.currentTarget.getAttribute('data-theme');
            setTheme(theme);
        });
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ecoTheme', theme);
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ==========================================================================
// 4. Interactive Map Logics
// ==========================================================================
function initMap() {
    // 1. Color map paths based on their AQI value on load
    mapPaths.forEach(path => {
        const iso = path.getAttribute('iso_3166_2');
        const data = regionData[iso];
        if (data) {
            // Set accessibility attributes
            path.setAttribute('role', 'button');
            path.setAttribute('tabindex', '0');
            path.setAttribute('aria-label', data.name);

            let fillColor = 'var(--success)';
            if (data.aqi > 90) fillColor = 'var(--danger)';
            else if (data.aqi > 50) fillColor = 'var(--warning)';
            path.style.fill = fillColor;
            path.style.opacity = '0.75';
        } else {
            path.style.fill = 'var(--text-muted)'; // glassmorphism fallback
        }

        // 2. Add event listeners
        path.addEventListener('mouseenter', handlePathMouseEnter);
        path.addEventListener('mousemove', handlePathMouseMove);
        path.addEventListener('mouseleave', handlePathMouseLeave);
        path.addEventListener('click', handlePathClick);
        path.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePathClick(e);
            }
        });
    });

    // Populate reporter select list options
    populateReporterRegions();

    // Load initial average stats
    loadCountryStats();
}

function handlePathMouseEnter(e) {
    const path = e.currentTarget;
    if (path.classList.contains('active')) return;
    path.style.opacity = '0.95';
    const iso = path.getAttribute('iso_3166_2');
    if (iso) showMapTooltip(e, iso);
}

function handlePathMouseMove(e) {
    const path = e.currentTarget;
    const iso = path.getAttribute('iso_3166_2');
    if (iso && mapTooltip?.classList.contains('visible')) {
        positionMapTooltip(e);
    }
}

function handlePathMouseLeave(e) {
    const path = e.currentTarget;
    if (path.classList.contains('active')) return;
    path.style.opacity = '0.75';
    hideMapTooltip();
}

function showMapTooltip(e, iso) {
    const data = regionData[iso];
    if (!data || !mapTooltip) return;

    const name = getRegionDisplayName(iso);
    const threat = getRegionThreat(iso);
    const status = getAqiStatus(data.aqi);

    mapTooltip.innerHTML = `
        <div class="tooltip-header">
            <strong>${name}</strong>
            <span class="tooltip-badge ${status.class}">${status.label}</span>
        </div>
        <div class="tooltip-metrics">
            <div class="tooltip-metric">
                <span class="tooltip-metric-label">AQI</span>
                <span class="tooltip-metric-val">${data.aqi}</span>
            </div>
            <div class="tooltip-metric">
                <span class="tooltip-metric-label">${t('forestLabel')}</span>
                <span class="tooltip-metric-val">${data.forest}</span>
            </div>
        </div>
        <div class="tooltip-threat"><i class="fa-solid fa-triangle-exclamation"></i> ${threat}</div>
    `;
    mapTooltip.classList.add('visible');
    mapTooltip.setAttribute('aria-hidden', 'false');
    positionMapTooltip(e);
}

function positionMapTooltip(e) {
    const container = document.getElementById('svg-map-container');
    if (!container || !mapTooltip) return;

    const rect = container.getBoundingClientRect();
    let x = e.clientX - rect.left + 18;
    let y = e.clientY - rect.top - 12;

    const tw = mapTooltip.offsetWidth || 220;
    const th = mapTooltip.offsetHeight || 120;

    if (x + tw > rect.width - 10) x = e.clientX - rect.left - tw - 18;
    if (y + th > rect.height - 10) y = rect.height - th - 10;
    if (x < 10) x = 10;
    if (y < 10) y = 10;

    mapTooltip.style.left = `${x}px`;
    mapTooltip.style.top = `${y}px`;
}

function hideMapTooltip() {
    if (!mapTooltip) return;
    mapTooltip.classList.remove('visible');
    mapTooltip.setAttribute('aria-hidden', 'true');
}

function handlePathClick(e) {
    const path = e.currentTarget;
    const iso = path.getAttribute('iso_3166_2');
    
    // Clear active states
    mapPaths.forEach(p => {
        p.classList.remove('active');
        const pIso = p.getAttribute('iso_3166_2');
        const pData = regionData[pIso];
        if (pData) {
            p.style.opacity = '0.75';
        }
    });

    // Toggle active state
    path.classList.add('active');
    path.style.opacity = '1';
    hideMapTooltip();
    
    loadRegionData(iso);
}

function loadRegionData(iso) {
    currentSelectedRegion = iso;
    const data = regionData[iso];
    if (!data) return;

    const displayName = getRegionDisplayName(iso);
    const isoKey = iso.replace(/-/g, '_');
    const displayThreat = t('threat_' + isoKey);
    const displayDesc = t('desc_' + isoKey);

    regionNameEl.textContent = displayName;
    rAqiValEl.textContent = data.aqi;
    rForestValEl.textContent = data.forest;
    rProjectsValEl.textContent = `${data.projects} ${t('projects')}`;
    rThreatValEl.textContent = displayThreat;
    rDescTextEl.textContent = displayDesc;

    // AQI badge styling
    regionAqiBadge.className = 'badge';
    if (data.aqi > 90) {
        regionAqiBadge.textContent = currentLanguage === 'en' ? 'Polluted' : currentLanguage === 'kk' ? 'Ластанған' : 'Загрязнено';
        regionAqiBadge.classList.add('poor');
    } else if (data.aqi > 50) {
        regionAqiBadge.textContent = currentLanguage === 'en' ? 'Moderate' : currentLanguage === 'kk' ? 'Орта' : 'Средне';
        regionAqiBadge.classList.add('mod');
    } else {
        regionAqiBadge.textContent = currentLanguage === 'en' ? 'Clean' : currentLanguage === 'kk' ? 'Таза' : 'Чисто';
        regionAqiBadge.classList.add('good');
    }

    // Pre-select region in the form
    rReporterRegionSel.value = iso;

    // Draw SVG Trend Chart
    drawTrendChart(data.trend);
    
    // Load local storage complaints for this region
    renderReportsFeed(iso);

    // Load nature photos for this region
    loadGallery(iso);
}

function loadCountryStats() {
    const countryLabel = currentLanguage === 'en' ? 'Kazakhstan (Average)' : 
                        currentLanguage === 'kk' ? 'Қазақстан (Орташа)' : 'Казахстан (Среднее)';
    regionNameEl.textContent = countryLabel;
    regionAqiBadge.className = 'badge mod';
    regionAqiBadge.textContent = currentLanguage === 'en' ? 'Country Analysis' : 
                                 currentLanguage === 'kk' ? 'Ел талдамасы' : 'Анализ страны';
    
    const isos = Object.keys(regionData);
    let totalAqi = 0;
    let totalProjects = 0;
    
    isos.forEach(iso => {
        totalAqi += regionData[iso].aqi;
        totalProjects += regionData[iso].projects;
    });

    rAqiValEl.textContent = Math.round(totalAqi / isos.length);
    rForestValEl.textContent = '2.3%';
    rProjectsValEl.textContent = `${totalProjects} ${currentLanguage === 'en' ? 'active' : 
                                                      currentLanguage === 'kk' ? 'белсенді' : 'активных'}`;
    rThreatValEl.textContent = currentLanguage === 'en' ? 'Coal emissions, river degradation' :
                              currentLanguage === 'kk' ? 'Көміртек шығарындылары, өндік деградациясы' : 
                              'Выбросы угля, усыхание рек';
    rDescTextEl.textContent = currentLanguage === 'en' ? 
        'Kazakhstan is characterized by a high carbon footprint due to coal-based energy generation. Select a specific region on the interactive map for a deep ecological analysis.' :
        currentLanguage === 'kk' ?
        'Қазақстан угль негіздегі энергия өндіруінің салдарынан жоғары көміртек ізін сипаттайды. Тереңдеп экологиялық талдау үшін интерактивті картадан белгілі бір облысты таңдаңыз.' :
        'Казахстан характеризуется высоким удельным углеродным следом за счет доминирования угольной генерации. Выберите конкретную область на интерактивной карте слева для глубокого анализа экологического паспорта.';
    
    drawTrendChart([65, 70, 75, 78, 73, 69, 71]);
    renderReportsFeed(null);
    loadGallery(null);
}

function drawTrendChart(trendArray) {
    const chartLine = document.querySelector('.mini-chart .chart-line');
    const chartArea = document.querySelector('.mini-chart .chart-area');
    
    if (!chartLine || !chartArea) return;

    // Calculate dynamic points mapping based on AQI values (0 - 150 scale)
    // SVG height is 100, width is 300. Padding: x=[10, 290], y=[20, 80]
    const width = 300;
    const height = 100;
    const paddingLeft = 15;
    const paddingRight = 10;
    const paddingTop = 20;
    const paddingBottom = 20;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    
    const points = trendArray.map((aqi, index) => {
        const x = paddingLeft + (index * (chartWidth / (trendArray.length - 1)));
        // Invert y: high AQI means higher line (lower Y coordinate)
        const maxVal = 150;
        const normalizedY = (aqi / maxVal) * chartHeight;
        const y = height - paddingBottom - normalizedY;
        return { x, y };
    });

    // Build SVG Path strings
    let linePathStr = `M ${points[0].x} ${points[0].y}`;
    let areaPathStr = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
        linePathStr += ` L ${points[i].x} ${points[i].y}`;
        areaPathStr += ` L ${points[i].x} ${points[i].y}`;
    }
    
    // Close area path along the bottom
    areaPathStr += ` L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

    // Inject SVG Gradient Definition if it doesn't exist
    let svg = document.getElementById('region-trend-chart');
    let defs = svg.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
            </linearGradient>
        `;
        svg.insertBefore(defs, svg.firstChild);
    }

    chartLine.setAttribute('d', linePathStr);
    chartArea.setAttribute('d', areaPathStr);
}

// ==========================================================================
// 5. Eco-Calculator Logic
// ==========================================================================
function initCalculator() {
    const prevBtn = document.getElementById('btn-prev-step');
    const nextBtn = document.getElementById('btn-next-step');
    const restartBtn = document.getElementById('btn-restart-calc');
    const optionBtns = document.querySelectorAll('.option-btn');
    const dots = document.querySelectorAll('.step-dots .dot');
    
    optionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentStepEl = document.querySelector(`.calc-step[data-step="${activeStep}"]`);
            // Clear selections in this step
            currentStepEl.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            
            // Set active selection
            btn.classList.add('selected');
            const val = btn.getAttribute('data-val');
            
            calcAnswers[`step${activeStep}`] = val;
            nextBtn.removeAttribute('disabled');
        });
    });

    nextBtn.addEventListener('click', () => {
        if (activeStep < totalSteps) {
            // Go to next step
            document.querySelector(`.calc-step[data-step="${activeStep}"]`).classList.remove('active');
            activeStep++;
            document.querySelector(`.calc-step[data-step="${activeStep}"]`).classList.add('active');
            
            // Update dots
            dots.forEach((dot, idx) => {
                if (idx + 1 === activeStep) dot.classList.add('active');
                else dot.classList.remove('active');
            });

            prevBtn.removeAttribute('disabled');
            
            // Check if step has prior answer
            const existingAnswer = calcAnswers[`step${activeStep}`];
            if (existingAnswer) {
                nextBtn.removeAttribute('disabled');
            } else {
                nextBtn.setAttribute('disabled', 'true');
            }

            if (activeStep === totalSteps) {
                nextBtn.innerHTML = 'Рассчитать <i class="fa-solid fa-square-poll-vertical"></i>';
            }
        } else {
            // Finish and calculate result
            calculateEcoFootprint();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (activeStep > 1) {
            document.querySelector(`.calc-step[data-step="${activeStep}"]`).classList.remove('active');
            activeStep--;
            document.querySelector(`.calc-step[data-step="${activeStep}"]`).classList.add('active');
            
            dots.forEach((dot, idx) => {
                if (idx + 1 === activeStep) dot.classList.add('active');
                else dot.classList.remove('active');
            });

            nextBtn.removeAttribute('disabled');
            nextBtn.innerHTML = 'Далее <i class="fa-solid fa-arrow-right"></i>';

            if (activeStep === 1) {
                prevBtn.setAttribute('disabled', 'true');
            }
        }
    });

    restartBtn.addEventListener('click', () => {
        // Reset answers & states
        activeStep = 1;
        calcAnswers = { step1: '', step2: '', step3: '' };
        
        // Reset option select states
        optionBtns.forEach(b => b.classList.remove('selected'));
        
        // Hide result, show step 1
        document.getElementById('calc-result-panel').classList.remove('active');
        document.querySelector(`.calc-step[data-step="1"]`).classList.add('active');
        document.querySelector(`.calc-step[data-step="2"]`).classList.remove('active');
        document.querySelector(`.calc-step[data-step="3"]`).classList.remove('active');
        document.getElementById('calc-nav-buttons').style.display = 'flex';
        
        // Reset nav btns
        prevBtn.setAttribute('disabled', 'true');
        nextBtn.setAttribute('disabled', 'true');
        nextBtn.innerHTML = 'Далее <i class="fa-solid fa-arrow-right"></i>';
        
        dots.forEach((dot, idx) => {
            if (idx === 0) dot.classList.add('active');
            else dot.classList.remove('active');
        });

        // Reset gauge progress circle
        const gaugeProg = document.getElementById('gauge-progress');
        if (gaugeProg) {
            gaugeProg.style.strokeDashoffset = 314;
        }
    });
}

function calculateEcoFootprint() {
    let carbonFootprint = 0.5; // Base trace

    // Step 1: Heating
    const heat = calcAnswers.step1;
    if (heat === 'coal') carbonFootprint += 8.2;
    else if (heat === 'gas') carbonFootprint += 3.1;
    else if (heat === 'central') carbonFootprint += 5.4;

    // Step 2: Mobility
    const transport = calcAnswers.step2;
    if (transport === 'car') carbonFootprint += 5.8;
    else if (transport === 'public') carbonFootprint += 1.4;
    else if (transport === 'eco') carbonFootprint += 0.1;

    // Step 3: Recycles
    const waste = calcAnswers.step3;
    if (waste === 'none') carbonFootprint += 3.2;
    else if (waste === 'partial') carbonFootprint += 1.1;
    else if (waste === 'full') carbonFootprint += 0.2;

    carbonFootprint = parseFloat(carbonFootprint.toFixed(1));

    // Show Results Panel
    document.querySelector(`.calc-step[data-step="${activeStep}"]`).classList.remove('active');
    document.getElementById('calc-nav-buttons').style.display = 'none';
    document.getElementById('calc-result-panel').classList.add('active');

    // Update gauge indicator progress ring (stroke-dasharray = 314, representing circumference r=50)
    // Max footprint scale about 20 tons CO2
    const maxFootprint = 18;
    const progressOffset = Math.max(0, 314 - (carbonFootprint / maxFootprint) * 314);
    
    const gaugeProg = document.getElementById('gauge-progress');
    gaugeProg.style.strokeDashoffset = progressOffset;
    document.getElementById('gauge-score').textContent = carbonFootprint;

    // Custom results copy
    const statusEl = document.getElementById('result-status');
    const descEl = document.getElementById('result-desc');
    const recsList = document.getElementById('recommendations-list');
    
    recsList.innerHTML = '';

    // Average footprint comparison (Kazakhstan is ~14.4 per capita)
    const kzAverage = 14.4;
    const diffPct = Math.round(((carbonFootprint - kzAverage) / kzAverage) * 100);

    let gaugeColor = 'var(--accent)';
    let recommendations = [];

    if (carbonFootprint < 7) {
        if (currentLanguage === 'en') {
            statusEl.textContent = 'Low Footprint (Eco-Leader)';
            descEl.textContent = `Your carbon footprint is ${Math.abs(diffPct)}% below Kazakhstan's average! You're doing excellent work reducing emissions.`;
            recommendations = [
                'Tell your friends about the importance of waste sorting and eco-mobility.',
                'Join local tree-planting movements (Green Belt).',
                'Try to minimize the use of disposable plastic cutlery.'
            ];
        } else if (currentLanguage === 'kk') {
            statusEl.textContent = 'Төмен із (Эко-Көшбасшы)';
            descEl.textContent = `Сіздің көміртек ізі Қазақстанның орташасынан ${Math.abs(diffPct)}% төмен! Сіз шығарындыларды азайту үшін тамаша жұмыс істеп жатырсыз.`;
            recommendations = [
                'Құлықты сортировканың және эко-мобильліктің маңыздылығы туралы достарыңызға айтыңыз.',
                'Ағашты отырғызудың жергіліктік қозғалыстарына қосылыңыз (Жасыл Белдеу).',
                'Бір рет қолданылатын пластик ыдыстарын пайдалануды азайтуға тырысыңыз.'
            ];
        } else {
            statusEl.textContent = 'Низкий след (Эко-Лидер)';
            descEl.textContent = `Ваш углеродный след на ${Math.abs(diffPct)}% ниже среднего по Казахстану! Вы делаете отличную работу для снижения выбросов.`;
            recommendations = [
                'Расскажите своим близким о важности раздельного сбора и эко-мобильности.',
                'Присоединяйтесь к локальным движениям по посадке деревьев (Зеленый Пояс).',
                'Старайтесь минимизировать использование одноразовой пластиковой посуды.'
            ];
        }
        statusEl.style.color = 'var(--success)';
        gaugeColor = 'var(--success)';
    } else if (carbonFootprint <= 13) {
        if (currentLanguage === 'en') {
            statusEl.textContent = 'Average Footprint';
            descEl.textContent = `Your footprint is close to the country's average value. There's room for optimization.`;
            recommendations = [
                'Consider switching to eco-transport during warm months.',
                'Install a programmable thermostat to save heat.',
                'Start sorting waste, return batteries to collection boxes.'
            ];
        } else if (currentLanguage === 'kk') {
            statusEl.textContent = 'Орта із';
            descEl.textContent = `Сіздің ізі елдің орташа мәніне жақын. Оңтайландыру үшін орын бар.`;
            recommendations = [
                'Жылы айларда эко-көліктарға ауысуды ойластырыңыз.',
                'Жылуды сақтау үшін программаланатын термостатты орнатыңыз.',
                'Құлықты сортировкауды бастаңыз, батарейкаларды жинау құтыларына қайтарыңыз.'
            ];
        } else {
            statusEl.textContent = 'Средний след';
            descEl.textContent = `Ваш след близок к среднему значению по стране. Есть потенциал для оптимизации.`;
            recommendations = [
                'Подумайте о переходе на эко-транспорт в теплые месяцы года.',
                'Установите программируемый термостат для экономии тепла.',
                'Начните сортировать мелкий мусор, сдавать батарейки в боксы.'
            ];
        }
        statusEl.style.color = 'var(--warning)';
        gaugeColor = 'var(--warning)';
    } else {
        if (currentLanguage === 'en') {
            statusEl.textContent = 'High Footprint';
            descEl.textContent = `Your footprint is ${diffPct}% above Kazakhstan's average. Coal heating and personal transport are key contributors.`;
            recommendations = [
                'If possible, consider home gasification (reduce emissions by 2.5x).',
                'Practice carpooling or switch to public transport at least 2 days a week.',
                'Refuse excessive packaging, turn in plastic containers for recycling.'
            ];
        } else if (currentLanguage === 'kk') {
            statusEl.textContent = 'Жоғары із';
            descEl.textContent = `Сіздің ізі Қазақстанның орташасынан ${diffPct}% жоғары. Көміртек қыздыру және жеке көлік негізгі ықпал қалдырады.`;
            recommendations = [
                'Мүмкін болса, үйді газдандыруды ойластырыңыз (шығарындыларды 2,5x төмендетіңіз).',
                'Попутчылармен сәйкес келіп жүріңіз немесе аптасына кем дегенде 2 күн ішінара жолдағы көліктарға өтіңіз.',
                'Артық ораланудан бас тарыңыз, пластик ыдыстарын қайта өңдеуге тапсырыңыз.'
            ];
        } else {
            statusEl.textContent = 'Высокий след';
            descEl.textContent = `Ваш след на ${diffPct}% выше среднего по Казахстану. Угольное отопление и личный транспорт вносят ключевой вклад.`;
            recommendations = [
                'Если возможно, рассмотрите газификацию дома (снижение выбросов в 2.5 раза).',
                'Практикуйте поездки с попутчиками или перейдите на общественный транспорт хотя бы 2 дня в неделю.',
                'Откажитесь от избыточных упаковок, сдавайте пластиковую тару на переработку.'
            ];
        }
        statusEl.style.color = 'var(--danger)';
        gaugeColor = 'var(--danger)';
    }

    gaugeProg.style.stroke = gaugeColor;

    // Inject recommendations elements
    recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recsList.appendChild(li);
    });

    // Award Eco-Points for completing the quiz
    const questMsg = currentLanguage === 'en' ? 'Completing eco-calculator' : 
                    currentLanguage === 'kk' ? 'Эко-калькуляторды орындау' : 'Прохождение эко-калькулятора';
    addEcoPoints(20, questMsg);
}

// ==========================================================================
// 6. Crowdsourced Reporter Form Logics
// ==========================================================================
function initReporter() {
    initPhotoUpload();
    initFeedFilters();

    // Sync dropdown changes to map selection
    rReporterRegionSel.addEventListener('change', (e) => {
        const iso = e.target.value;
        if (iso) {
            const path = document.querySelector(`path.map-region[iso_3166_2="${iso}"]`);
            if (path) {
                handlePathClick({ currentTarget: path });
            }
        } else {
            loadCountryStats();
            mapPaths.forEach(p => {
                p.classList.remove('active');
                const pIso = p.getAttribute('iso_3166_2');
                const pData = regionData[pIso];
                if (pData) {
                    p.style.opacity = '0.75';
                }
            });
        }
    });

    reporterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const regionIso = document.getElementById('reporter-region').value;
        const type = document.getElementById('reporter-type').value;
        const desc = document.getElementById('reporter-desc').value;
        
        if (!regionIso || !type || !desc) return;

        const newReport = {
            id: 'rep-' + Date.now(),
            regionIso: regionIso,
            type: type,
            desc: desc,
            photo: pendingReportPhoto || null,
            time: new Date().toLocaleString(currentLanguage === 'en' ? 'en-GB' : currentLanguage === 'kk' ? 'kk-KZ' : 'ru-RU', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
            status: 'pending'
        };

        // Load complaints, add new, save
        const allReports = JSON.parse(localStorage.getItem('ecoReports')) || [];
        allReports.unshift(newReport);
        try {
            localStorage.setItem('ecoReports', JSON.stringify(allReports));
        } catch (err) {
            alert(t('photoStorageError'));
            return;
        }

        // Reset form
        document.getElementById('reporter-type').value = '';
        document.getElementById('reporter-desc').value = '';
        clearReportPhoto();

        // Refresh feed view
        renderReportsFeed(regionIso);
        
        // Auto-complete quest 4 if not already completed
        if (!completedQuests.includes('q-4')) {
            toggleQuest('q-4', 30);
        } else {
            const msg = currentLanguage === 'en' ? 'Eco-violation registered' :
                       currentLanguage === 'kk' ? 'Эко-құқық бұзушылығы тіркелді' :
                       'Регистрация эко-нарушения';
            addEcoPoints(30, msg);
        }
    });
}

function initPhotoUpload() {
    const zone = document.getElementById('photo-upload-zone');
    const input = document.getElementById('reporter-photo');
    const placeholder = document.getElementById('photo-upload-placeholder');
    const preview = document.getElementById('photo-preview');
    const previewImg = document.getElementById('photo-preview-img');
    const removeBtn = document.getElementById('photo-remove-btn');

    if (!zone || !input) return;

    zone.addEventListener('click', (e) => {
        if (e.target.closest('.photo-remove-btn')) return;
        input.click();
    });

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const file = e.dataTransfer?.files?.[0];
        if (file) processReportPhoto(file);
    });

    input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (file) processReportPhoto(file);
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            clearReportPhoto();
        });
    }

    function processReportPhoto(file) {
        if (!file.type.startsWith('image/')) {
            alert(t('photoTypeError'));
            return;
        }
        if (file.size > MAX_PHOTO_SIZE) {
            alert(t('photoSizeError'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            pendingReportPhoto = ev.target.result;
            if (previewImg) previewImg.src = pendingReportPhoto;
            if (placeholder) placeholder.style.display = 'none';
            if (preview) preview.style.display = 'block';
            zone.classList.add('has-photo');
        };
        reader.readAsDataURL(file);
    }
}

function clearReportPhoto() {
    pendingReportPhoto = null;
    const input = document.getElementById('reporter-photo');
    const placeholder = document.getElementById('photo-upload-placeholder');
    const preview = document.getElementById('photo-preview');
    const previewImg = document.getElementById('photo-preview-img');
    const zone = document.getElementById('photo-upload-zone');

    if (input) input.value = '';
    if (previewImg) previewImg.src = '';
    if (placeholder) placeholder.style.display = 'flex';
    if (preview) preview.style.display = 'none';
    if (zone) zone.classList.remove('has-photo');
}

function initFeedFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentReportFilter = btn.getAttribute('data-filter');
            renderReportsFeed(currentSelectedRegion);
        });
    });
}

function resolveReport(id) {
    const userReports = JSON.parse(localStorage.getItem('ecoReports')) || [];
    const index = userReports.findIndex(r => r.id === id);
    
    if (index !== -1) {
        userReports[index].status = 'resolved';
        localStorage.setItem('ecoReports', JSON.stringify(userReports));
    } else {
        const resolvedMocks = JSON.parse(localStorage.getItem('resolvedMocks')) || [];
        if (!resolvedMocks.includes(id)) {
            resolvedMocks.push(id);
            localStorage.setItem('resolvedMocks', JSON.stringify(resolvedMocks));
        }
    }
    
    const reason = currentLanguage === 'en' ? 'Resolving eco-violation' :
                  currentLanguage === 'kk' ? 'Эко-құқық бұзушылығын шешу' :
                  'Решение эко-нарушения';
    addEcoPoints(15, reason);
    incrementResolvedCounter();
    
    // Refresh feed
    renderReportsFeed(currentSelectedRegion);
}

function renderReportsFeed(regionIso) {
    reportsFeedEl.innerHTML = '';
    
    // Default initial mock reports to make it look alive
    let defaultReports = [
        {
            id: 'mock-1',
            regionIso: 'KZ-ALA',
            type: 'свалка',
            desc: 'Гора мусора на тропе к водопаду Кызгалдак в Алматинском ущелье.',
            time: 'Вчера, 14:20',
            status: 'resolved'
        },
        {
            id: 'mock-2',
            regionIso: 'KZ-KAR',
            type: 'смог',
            desc: 'Густой оранжевый дым со стороны металлургического завода Темиртау.',
            time: '2 дня назад',
            status: 'pending'
        },
        {
            id: 'mock-3',
            regionIso: 'KZ-AST',
            type: 'свалка',
            desc: 'Выгрузка строительного мусора грузовиками в районе озера Талдыколь.',
            time: '3 дня назад',
            status: 'pending'
        }
    ];

    const resolvedMocks = JSON.parse(localStorage.getItem('resolvedMocks')) || [];
    defaultReports.forEach(rep => {
        if (resolvedMocks.includes(rep.id)) {
            rep.status = 'resolved';
        }
    });

    const userReports = JSON.parse(localStorage.getItem('ecoReports')) || [];
    const allReports = [...userReports, ...defaultReports];

    const filteredReports = allReports.filter(rep => {
        if (regionIso && rep.regionIso !== regionIso) return false;
        if (currentReportFilter === 'pending' && rep.status !== 'pending') return false;
        if (currentReportFilter === 'resolved' && rep.status !== 'resolved') return false;
        return true;
    });

    if (filteredReports.length === 0) {
        const emptyMsg = currentLanguage === 'en' ? 'No incidents registered in this region yet. Be the first!' :
                        currentLanguage === 'kk' ? 'Осы аймақта әлі ешқандай оқиғалар тіркелмеді. Алғаш болыңыз!' :
                        'В этом регионе пока нет зарегистрированных инцидентов. Будьте первыми!';
        reportsFeedEl.innerHTML = `<div class="empty-feed">${emptyMsg}</div>`;
        return;
    }

    filteredReports.forEach(rep => {
        const item = document.createElement('div');
        item.className = 'report-item';

        const regionName = regionData[rep.regionIso] ? getRegionDisplayName(rep.regionIso) : 'Kazakhstan';
        const typeLabel = getReportTypeLabel(rep.type);
        const statusLabel = rep.status === 'resolved' ?
            (currentLanguage === 'en' ? 'Resolved' : currentLanguage === 'kk' ? 'Шешілді' : 'Решено') :
            (currentLanguage === 'en' ? 'Under Review' : currentLanguage === 'kk' ? 'Тексерісте' : 'На проверке');
        const statusClass = rep.status === 'resolved' ? 'resolved' : 'pending';

        const body = document.createElement('div');
        body.className = 'report-body';

        if (rep.photo && isSafePhotoSrc(rep.photo)) {
            const photoWrap = document.createElement('div');
            photoWrap.className = 'report-photo';
            const img = document.createElement('img');
            img.src = rep.photo;
            img.alt = typeLabel;
            img.loading = 'lazy';
            photoWrap.appendChild(img);
            body.appendChild(photoWrap);
        }

        const content = document.createElement('div');
        content.className = 'report-content';

        const header = document.createElement('div');
        header.className = 'report-header';

        const typeSpan = document.createElement('span');
        typeSpan.className = 'report-prob-type';
        typeSpan.textContent = typeLabel;

        const statusSpan = document.createElement('span');
        statusSpan.className = `report-status ${statusClass}`;
        statusSpan.textContent = statusLabel;

        header.appendChild(typeSpan);
        header.appendChild(statusSpan);

        const descEl = document.createElement('div');
        descEl.className = 'report-desc';
        descEl.textContent = rep.desc;

        const footer = document.createElement('div');
        footer.className = 'report-footer';

        if (rep.status === 'pending') {
            const resolveLabel = currentLanguage === 'en' ? 'Resolve Issue' :
                currentLanguage === 'kk' ? 'Мәселені шешу' : 'Решить проблему';
            const resolveBtn = document.createElement('button');
            resolveBtn.className = 'btn-resolve-report';
            resolveBtn.setAttribute('data-id', rep.id);
            resolveBtn.title = resolveLabel;
            resolveBtn.innerHTML = `<i class="fa-solid fa-check"></i> ${escapeHtml(resolveLabel)}`;
            resolveBtn.addEventListener('click', (e) => {
                resolveReport(e.currentTarget.getAttribute('data-id'));
            });
            footer.appendChild(resolveBtn);
        }

        const timeEl = document.createElement('div');
        timeEl.className = 'report-time';
        timeEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${escapeHtml(regionName)} &bull; ${escapeHtml(rep.time)}`;
        footer.appendChild(timeEl);

        content.appendChild(header);
        content.appendChild(descEl);
        content.appendChild(footer);
        body.appendChild(content);
        item.appendChild(body);
        reportsFeedEl.appendChild(item);
    });
}

// ==========================================================================
// 7. Gamification & Quests Board
// ==========================================================================
const questsData = [
    { id: 'q-1', title: 'Использовать эко-сумку вместо пластика', reward: 10, icon: 'fa-bag-shopping' },
    { id: 'q-2', title: 'Сдать 5 батареек в пункт сбора', reward: 15, icon: 'fa-battery-three-quarters' },
    { id: 'q-3', title: 'Пешая прогулка (10к шагов) вместо авто', reward: 20, icon: 'fa-shoe-prints' },
    { id: 'q-4', title: 'Сообщить об эко-нарушении на карту', reward: 30, icon: 'fa-camera' }
];

function initQuests() {
    renderQuests();
    updateQuestsStats();
}

function renderQuests() {
    questsContainer.innerHTML = '';
    
    const questTitles = {
        'q-1': {
            en: 'Use an eco-bag instead of plastic',
            ru: 'Использовать эко-сумку вместо пластика',
            kk: 'Пластиктің орнына эко-сөмкесін қолдану'
        },
        'q-2': {
            en: 'Return 5 batteries to a collection point',
            ru: 'Сдать 5 батареек в пункт сбора',
            kk: '5 батарейканы жинау орнына қайтару'
        },
        'q-3': {
            en: 'Take a 10k steps walk instead of driving',
            ru: 'Пешая прогулка (10к шагов) вместо авто',
            kk: 'Машинаның орнына 10к қадамдық жүрісе'
        },
        'q-4': {
            en: 'Report an eco-violation to the map',
            ru: 'Сообщить об эко-нарушении на карту',
            kk: 'Эко-құқық бұзушылығын картаға хабарлау'
        }
    };
    
    questsData.forEach(q => {
        const isCompleted = completedQuests.includes(q.id);
        const item = document.createElement('div');
        item.className = `quest-item ${isCompleted ? 'completed' : ''}`;
        
        const title = questTitles[q.id]?.[currentLanguage] || questTitles[q.id]?.['ru'] || q.title;
        const resetLabel = currentLanguage === 'en' ? 'Reset' : currentLanguage === 'kk' ? 'Болдату' : 'Сбросить';
        const completeLabel = currentLanguage === 'en' ? 'Complete' : currentLanguage === 'kk' ? 'Орындау' : 'Выполнить';
        
        item.innerHTML = `
            <div class="quest-info">
                <div class="quest-icon">
                    <i class="fa-solid ${q.icon}"></i>
                </div>
                <div class="quest-details">
                    <span class="quest-title">${title}</span>
                    <span class="quest-reward">+${q.reward} ${currentLanguage === 'en' ? 'Eco-Points' : currentLanguage === 'kk' ? 'Эко-Ұпайлар' : 'Eco-Points'}</span>
                </div>
            </div>
            <div class="quest-check" data-id="${q.id}" title="${isCompleted ? resetLabel : completeLabel}"></div>
        `;
        
        // Add click listener on check button
        item.querySelector('.quest-check').addEventListener('click', (e) => {
            toggleQuest(q.id, q.reward);
        });
        
        questsContainer.appendChild(item);
    });
}

function toggleQuest(id, reward) {
    const index = completedQuests.indexOf(id);
    if (index === -1) {
        // Complete quest
        completedQuests.push(id);
        const reason = currentLanguage === 'en' ? 'Eco-quest completed' :
                      currentLanguage === 'kk' ? 'Эко-тапсырма орындалды' :
                      'Эко-квест выполнен';
        addEcoPoints(reward, reason);
    } else {
        // Un-complete quest
        completedQuests.splice(index, 1);
        const reason = currentLanguage === 'en' ? 'Eco-quest reset' :
                      currentLanguage === 'kk' ? 'Эко-тапсырма болдатылды' :
                      'Сброс эко-квеста';
        addEcoPoints(-reward, reason);
    }
    
    localStorage.setItem('completedQuests', JSON.stringify(completedQuests));
    
    renderQuests();
    updateQuestsStats();
}

function updateQuestsStats() {
    activeQuestsCountEl.textContent = `${completedQuests.length}/${questsData.length}`;
}

function addEcoPoints(points, reason) {
    userPoints += points;
    if (userPoints < 0) userPoints = 0;
    
    localStorage.setItem('ecoPoints', userPoints);
    userPointsEl.textContent = userPoints + ' XP';

    // Spawn a floating micro-animation for XP change
    if (points !== 0) {
        showFloatingText(points > 0 ? `+${points} XP` : `${points} XP`, userPointsEl, points > 0);
    }
}

function showFloatingText(text, targetEl, isPositive) {
    const float = document.createElement('span');
    float.textContent = text;
    float.style.position = 'absolute';
    float.style.color = isPositive ? 'var(--success)' : 'var(--danger)';
    float.style.fontWeight = 'bold';
    float.style.fontSize = '0.9rem';
    float.style.pointerEvents = 'none';
    float.style.zIndex = '999';
    float.style.animation = 'floatUp 1.2s ease-out forwards';
    
    // Positioning near target
    const rect = targetEl.getBoundingClientRect();
    float.style.top = `${rect.top + window.scrollY - 15}px`;
    float.style.left = `${rect.left + window.scrollX + (rect.width / 2)}px`;
    
    document.body.appendChild(float);
    
    setTimeout(() => {
        float.remove();
    }, 1200);
}

// Persistent resolved counter initialization
function initResolvedCounter() {
    const counterEl = document.getElementById('resolved-reports-count');
    if (counterEl) {
        let resolvedCount = parseInt(localStorage.getItem('resolvedReportsCount'));
        if (isNaN(resolvedCount)) {
            resolvedCount = 142;
            localStorage.setItem('resolvedReportsCount', resolvedCount);
        }
        counterEl.textContent = resolvedCount;
    }
}

// Increment persistent resolved counter
function incrementResolvedCounter() {
    const counterEl = document.getElementById('resolved-reports-count');
    if (counterEl) {
        let resolvedCount = parseInt(localStorage.getItem('resolvedReportsCount')) || 142;
        resolvedCount++;
        localStorage.setItem('resolvedReportsCount', resolvedCount);
        counterEl.textContent = resolvedCount;
    }
}

// ==========================================================================
// 8. Initialization on Window Load
// ==========================================================================
window.addEventListener('DOMContentLoaded', async () => {
    // Load translations first
    await loadTranslations();
    
    // Sync points and resolved counter from localStorage on load
    if (userPointsEl) {
        userPointsEl.textContent = userPoints + ' XP';
    }
    initResolvedCounter();

    initTheme();
    initLanguage();
    initMap();
    initCalculator();
    initReporter();
    initQuests();
    initGallery();
});

function initLanguage() {
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = e.currentTarget.getAttribute('data-lang');
            setLanguage(lang);
            
            // Update active state
            langBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
        
        // Set initial active state
        if (btn.getAttribute('data-lang') === currentLanguage) {
            btn.classList.add('active');
        }
    });
}

// ==========================================================================
// Helper functions for nature photo gallery and dynamic translations
// ==========================================================================

function getRegionDisplayName(iso) {
    const data = regionData[iso];
    if (!data) return '';
    if (currentLanguage === 'en') {
        const enNames = {
            'KZ-VOS': 'East Kazakhstan Region',
            'KZ-ALA': 'Almaty Region and Almaty City',
            'KZ-ZHA': 'Zhambyl Region',
            'KZ-YUZ': 'Turkestan Region',
            'KZ-MAN': 'Mangystau Region',
            'KZ-KZY': 'Kyzylorda Region',
            'KZ-AKT': 'Aktobe Region',
            'KZ-SEV': 'North Kazakhstan Region',
            'KZ-KUS': 'Kostanay Region',
            'KZ-PAV': 'Pavlodar Region',
            'KZ-ZAP': 'West Kazakhstan Region',
            'KZ-ATY': 'Atyrau Region',
            'KZ-AKM': 'Akmola Region',
            'KZ-KAR': 'Karaganda Region',
            'KZ-AST': 'Astana City'
        };
        return enNames[iso] || data.name;
    } else if (currentLanguage === 'kk') {
        const kkNames = {
            'KZ-VOS': 'Шығыс Қазақстан облысы',
            'KZ-ALA': 'Алматы облысы және Алматы қаласы',
            'KZ-ZHA': 'Жамбыл облысы',
            'KZ-YUZ': 'Түркістан облысы',
            'KZ-MAN': 'Маңғыстау облысы',
            'KZ-KZY': 'Қызылорда облысы',
            'KZ-AKT': 'Ақтөбе облысы',
            'KZ-SEV': 'Солтүстік Қазақстан облысы',
            'KZ-KUS': 'Қостанай облысы',
            'KZ-PAV': 'Павлодар облысы',
            'KZ-ZAP': 'Батыс Қазақстан облысы',
            'KZ-ATY': 'Атырау облысы',
            'KZ-AKM': 'Ақмола облысы',
            'KZ-KAR': 'Қарағанды облысы',
            'KZ-AST': 'Астана қаласы'
        };
        return kkNames[iso] || data.name;
    }
    return data.name;
}

function updateCalculatorButtons() {
    const nextBtn = document.getElementById('btn-next-step');
    const prevBtn = document.getElementById('btn-prev-step');
    if (!nextBtn || !prevBtn) return;
    
    if (activeStep === totalSteps) {
        nextBtn.innerHTML = `${t('calculate')} <i class="fa-solid fa-square-poll-vertical"></i>`;
    } else {
        nextBtn.innerHTML = `${t('btnNext')} <i class="fa-solid fa-arrow-right"></i>`;
    }
    prevBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> ${t('btnBack')}`;
}

function populateReporterRegions() {
    const currentValue = rReporterRegionSel.value;
    rReporterRegionSel.innerHTML = '';
    
    const placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.textContent = t('reporterRegionPlaceholder');
    placeholderOpt.setAttribute('data-i18n', 'reporterRegionPlaceholder');
    rReporterRegionSel.appendChild(placeholderOpt);
    
    Object.keys(regionData).forEach(iso => {
        const opt = document.createElement('option');
        opt.value = iso;
        opt.textContent = getRegionDisplayName(iso);
        rReporterRegionSel.appendChild(opt);
    });
    
    if (currentValue) {
        rReporterRegionSel.value = currentValue;
    }
}

// Gallery State
let currentPhotoIndex = 0;
let currentRegionPhotos = [];

const regionPhotos = {
    'KZ-VOS': [
        { url: 'images/altai.png', caption: { ru: 'Алтайские горы', en: 'Altai Mountains', kk: 'Алтай таулары' } },
        { url: 'images/steppe.png', caption: { ru: 'Степные предгорья Рудного Алтая', en: 'Steppe foothills of Rudny Altai', kk: 'Кенді Алтайдың бөктеріндегі дала' } }
    ],
    'KZ-ALA': [
        { url: 'images/almaty.png', caption: { ru: 'Природа Заилийского Алатау', en: 'Nature of Trans-Ili Alatau', kk: 'Іле Алатауының табиғаты' } },
        { url: 'images/charyn.png', caption: { ru: 'Чарынский каньон', en: 'Charyn Canyon', kk: 'Шарын каньоны' } }
    ],
    'KZ-ZHA': [
        { url: 'images/steppe.png', caption: { ru: 'Степи Жамбылской области', en: 'Steppes of Zhambyl Region', kk: 'Жамбыл облысының далалары' } },
        { url: 'images/altai.png', caption: { ru: 'Горы Каратау', en: 'Karatau Mountains', kk: 'Қаратау таулары' } }
    ],
    'KZ-YUZ': [
        { url: 'images/steppe.png', caption: { ru: 'Туркестанские степные просторы', en: 'Turkestan Steppe expanses', kk: 'Түркістан далалары' } },
        { url: 'images/almaty.png', caption: { ru: 'Заповедник Аксу-Жабаглы', en: 'Aksu-Zhabagly Nature Reserve', kk: 'Ақсу-Жабағылы қорығы' } }
    ],
    'KZ-MAN': [
        { url: 'images/mangystau.png', caption: { ru: 'Каспийское побережье Мангистау', en: 'Caspian coast of Mangystau', kk: 'Маңғыстаудың Каспий жағалауы' } },
        { url: 'images/steppe.png', caption: { ru: 'Пустынные плато Устюрта', en: 'Desert plateaus of Ustyurt', kk: 'Үстірттің шөлді үстірттері' } }
    ],
    'KZ-KZY': [
        { url: 'images/steppe.png', caption: { ru: 'Долина реки Сырдарья', en: 'Syrdarya River Valley', kk: 'Сырдария өзенінің аңғары' } },
        { url: 'images/mangystau.png', caption: { ru: 'Берег Аральского моря', en: 'Aral Sea Coast', kk: 'Арал теңізінің жағалауы' } }
    ],
    'KZ-AKT': [
        { url: 'images/steppe.png', caption: { ru: 'Актюбинские степные равнины', en: 'Aktobe Steppe plains', kk: 'Ақтөбе дала жазықтары' } },
        { url: 'images/altai.png', caption: { ru: 'Мугоджарские холмы', en: 'Mugodzhar Hills', kk: 'Мұғалжар таулары' } }
    ],
    'KZ-SEV': [
        { url: 'images/burabay.png', caption: { ru: 'Озера Северо-Казахстанской области', en: 'Lakes of North Kazakhstan', kk: 'Солтүстік Қазақстан көлдері' } },
        { url: 'images/steppe.png', caption: { ru: 'Березовые колки севера', en: 'Northern birch groves', kk: 'Солтүстік қайыңды тоғайлары' } }
    ],
    'KZ-KUS': [
        { url: 'images/burabay.png', caption: { ru: 'Наурзумский сосновый бор', en: 'Naurzum pine forest', kk: 'Наурызым қарағайлы орманы' } },
        { url: 'images/steppe.png', caption: { ru: 'Костанайские степи', en: 'Kostanay Steppes', kk: 'Қостанай далалары' } }
    ],
    'KZ-PAV': [
        { url: 'images/burabay.png', caption: { ru: 'Баянаульские сосновые скалы', en: 'Bayanaul pine rocks', kk: 'Баянауыл қарағайлы жартастары' } },
        { url: 'images/altai.png', caption: { ru: 'Пойма реки Иртыш', en: 'Irtysh River Floodplain', kk: 'Ертіс өзенінің жайылмасы' } }
    ],
    'KZ-ZAP': [
        { url: 'images/steppe.png', caption: { ru: 'Западно-Казахстанские степные просторы', en: 'West Kazakhstan Steppes', kk: 'Батыс Қазақстан далалары' } },
        { url: 'images/burabay.png', caption: { ru: 'Леса поймы реки Урал', en: 'Ural River Floodplain forests', kk: 'Жайық өзенінің жайылма ормандары' } }
    ],
    'KZ-ATY': [
        { url: 'images/mangystau.png', caption: { ru: 'Шельф Каспийского моря', en: 'Caspian Sea Shelf', kk: 'Каспий теңізінің қайраңы' } },
        { url: 'images/steppe.png', caption: { ru: 'Атырауские солончаки', en: 'Atyrau Salt Flats', kk: 'Атырау сорлары' } }
    ],
    'KZ-AKM': [
        { url: 'images/burabay.png', caption: { ru: 'Озеро Боровое (Бурабай)', en: 'Lake Borovoe (Burabay)', kk: 'Бурабай көлі' } },
        { url: 'images/steppe.png', caption: { ru: 'Акмолинские степи', en: 'Akmola Steppes', kk: 'Ақмола далалары' } }
    ],
    'KZ-KAR': [
        { url: 'images/altai.png', caption: { ru: 'Каркаралинские горные сосны', en: 'Karkaraly Mountain pines', kk: 'Қарқаралы тау қарағайлары' } },
        { url: 'images/steppe.png', caption: { ru: 'Степные просторы Сарыарки', en: 'Saryarka Steppe expanses', kk: 'Сарыарқа далалары' } }
    ],
    'KZ-AST': [
        { url: 'images/burabay.png', caption: { ru: 'Зеленый пояс столицы', en: 'Capital Green Belt', kk: 'Елорданың жасыл белдеуі' } },
        { url: 'images/steppe.png', caption: { ru: 'Долина реки Есиль (Ишим)', en: 'Esil (Ishim) River Valley', kk: 'Есіл өзенінің аңғары' } }
    ]
};

function initGallery() {
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            goToSlide(currentPhotoIndex - 1);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToSlide(currentPhotoIndex + 1);
        });
    }
}

function loadGallery(iso) {
    const galleryPlaceholder = document.getElementById('gallery-placeholder');
    const gallerySlider = document.getElementById('gallery-slider');
    const galleryViewport = document.getElementById('gallery-viewport');
    const galleryDots = document.getElementById('gallery-dots');
    const galleryCaption = document.getElementById('gallery-caption');
    
    if (!galleryPlaceholder || !gallerySlider || !galleryViewport || !galleryDots || !galleryCaption) return;

    if (!iso || !regionPhotos[iso]) {
        galleryPlaceholder.style.display = 'flex';
        gallerySlider.style.display = 'none';
        galleryDots.innerHTML = '';
        galleryCaption.textContent = '';
        return;
    }
    
    currentRegionPhotos = regionPhotos[iso];
    currentPhotoIndex = 0;
    
    galleryPlaceholder.style.display = 'none';
    gallerySlider.style.display = 'block';
    
    // Inject images
    galleryViewport.innerHTML = '';
    currentRegionPhotos.forEach(photo => {
        const img = document.createElement('img');
        img.src = photo.url;
        img.alt = photo.caption[currentLanguage] || photo.caption['ru'];
        img.className = 'gallery-img';
        galleryViewport.appendChild(img);
    });
    
    // Create dots
    galleryDots.innerHTML = '';
    currentRegionPhotos.forEach((_, idx) => {
        const dot = document.createElement('span');
        dot.className = `gallery-dot ${idx === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            goToSlide(idx);
        });
        galleryDots.appendChild(dot);
    });
    
    updateSlidePosition();
}

function goToSlide(index) {
    if (index < 0) index = currentRegionPhotos.length - 1;
    if (index >= currentRegionPhotos.length) index = 0;
    
    currentPhotoIndex = index;
    updateSlidePosition();
}

function updateSlidePosition() {
    const galleryViewport = document.getElementById('gallery-viewport');
    const galleryDots = document.querySelectorAll('.gallery-dot');
    const galleryCaption = document.getElementById('gallery-caption');
    
    if (!galleryViewport || !currentRegionPhotos || currentRegionPhotos.length === 0) return;
    
    galleryViewport.style.transform = `translateX(-${currentPhotoIndex * 100}%)`;
    
    // Update dots active class
    galleryDots.forEach((dot, idx) => {
        if (idx === currentPhotoIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });
    
    // Update caption text
    const photo = currentRegionPhotos[currentPhotoIndex];
    if (photo && galleryCaption) {
        galleryCaption.textContent = photo.caption[currentLanguage] || photo.caption['ru'];
    }
}
