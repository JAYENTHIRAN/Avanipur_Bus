/**
 * Avanipur Bus Details - Production Application Script
 * Complete timetable, next-bus detection, route filtering, and morning sequence logic
 * 
 * Locations:
 * - Avanipur (Village)
 * - Tindivanam (Main Junction / Taluk)
 * - Chennai (Long-distance Destination)
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. Timetable Configuration & Official Schedule Data
     (Configurable so additional loop timings can easily be added later)
     ========================================================================== */

  const TIMETABLE_CONFIG = {
    morningCutoffTime: "11:00", // 11:00 AM Service Cutoff
    lastMorningLoopBus: "13D",
    villageName: "Avanipur",
    mainDestination: "Tindivanam",
    longDistanceDestination: "Chennai"
  };

  /**
   * Official Bus Schedule Data
   * Times are stored in standard 24h format (HH:MM) for reliable mathematical comparison.
   * Exact provided times are preserved strictly without inventing unauthorized departures.
   */
  const buses = [
    // ---------------- Avanipur → Tindivanam / Chennai ----------------
    {
      id: "13d-avn-tnd",
      number: "13D",
      from: "Avanipur",
      to: "Tindivanam",
      departure: "07:00", // 7:00 AM
      arrival: "08:00",   // 8:00 AM
      duration: "1 hour",
      frequency: "Regular",
      isLoop: true,
      onceDaily: false,
      morningSequenceIndex: 1,
      notes: "Regular morning loop service. First morning bus connecting Avanipur village to Tindivanam.",
      stops: [
        { name: "Avanipur Bus Stop", time: "07:00 AM", type: "origin" },
        { name: "En-route Villages (Gingee/Tindivanam Rd)", time: "On route", type: "intermediate" },
        { name: "Tindivanam Bus Stand", time: "08:00 AM", type: "destination" }
      ]
    },
    {
      id: "6b-avn-tnd",
      number: "6B",
      from: "Avanipur",
      to: "Tindivanam",
      departure: "07:30", // 7:30 AM
      arrival: "08:30",   // 8:30 AM
      duration: "1 hour",
      frequency: "Regular",
      isLoop: true,
      onceDaily: false,
      morningSequenceIndex: 2,
      notes: "Regular repeating service. Ideal for morning school students, college goers, and office commuters.",
      stops: [
        { name: "Avanipur Bus Stop", time: "07:30 AM", type: "origin" },
        { name: "En-route Villages", time: "On route", type: "intermediate" },
        { name: "Tindivanam Bus Stand", time: "08:30 AM", type: "destination" }
      ]
    },
    {
      id: "23-avn-tnd",
      number: "23",
      from: "Avanipur",
      to: "Tindivanam",
      departure: "08:30", // 8:30 AM
      arrival: "09:30",   // 9:30 AM
      duration: "1 hour",
      frequency: "Regular",
      isLoop: true,
      onceDaily: false,
      morningSequenceIndex: 3,
      notes: "Regular loop bus service operating in the morning sequence towards Tindivanam.",
      stops: [
        { name: "Avanipur Bus Stop", time: "08:30 AM", type: "origin" },
        { name: "En-route Villages", time: "On route", type: "intermediate" },
        { name: "Tindivanam Bus Stand", time: "09:30 AM", type: "destination" }
      ]
    },
    {
      id: "189-avn-che",
      number: "189",
      from: "Avanipur",
      to: "Chennai",
      departure: "09:30", // 9:30 AM
      arrival: "Chennai (via Tindivanam)",
      intermediateTiming: "12:30 PM at Tindivanam (intermediate timing supplied)",
      intermediatePlace: "Tindivanam",
      intermediateTime: "12:30 PM",
      duration: "Long distance to Chennai (~3h to Tindivanam)",
      frequency: "Once Daily",
      isLoop: false,
      onceDaily: true,
      morningSequenceIndex: 4,
      notes: "Direct long-distance route to Chennai. Runs ONLY ONCE PER DAY in this direction. Note: Official timing records show 12:30 PM arrival at Tindivanam as an intermediate checkpoint, after which the bus proceeds onward to Chennai.",
      stops: [
        { name: "Avanipur Bus Stop", time: "09:30 AM", type: "origin" },
        { name: "Tindivanam (Intermediate stop)", time: "12:30 PM", type: "intermediate" },
        { name: "Chennai (CMBT / Kilambakkam)", time: "Afternoon", type: "destination" }
      ]
    },

    // ---------------- Return: Tindivanam / Chennai → Avanipur ----------------
    {
      id: "13d-tnd-avn",
      number: "13D",
      from: "Tindivanam",
      to: "Avanipur",
      departure: "08:10", // 8:10 AM
      arrival: "09:00",   // 9:00 AM
      duration: "50 mins",
      frequency: "Regular",
      isLoop: true,
      onceDaily: false,
      morningSequenceIndex: null,
      notes: "Return regular loop bus departing Tindivanam Bus Stand heading back to Avanipur village.",
      stops: [
        { name: "Tindivanam Bus Stand", time: "08:10 AM", type: "origin" },
        { name: "En-route Villages", time: "On route", type: "intermediate" },
        { name: "Avanipur Bus Stop", time: "09:00 AM", type: "destination" }
      ]
    },
    {
      id: "6b-tnd-avn",
      number: "6B",
      from: "Tindivanam",
      to: "Avanipur",
      departure: "08:45", // 8:45 AM
      arrival: "09:30",   // 9:30 AM
      duration: "45 mins",
      frequency: "Regular",
      isLoop: true,
      onceDaily: false,
      morningSequenceIndex: null,
      notes: "Fast return loop service from Tindivanam back to Avanipur.",
      stops: [
        { name: "Tindivanam Bus Stand", time: "08:45 AM", type: "origin" },
        { name: "En-route Villages", time: "On route", type: "intermediate" },
        { name: "Avanipur Bus Stop", time: "09:30 AM", type: "destination" }
      ]
    },
    {
      id: "23-tnd-avn",
      number: "23",
      from: "Tindivanam",
      to: "Avanipur",
      departure: "09:10", // 9:10 AM
      arrival: "10:40",   // 10:40 AM
      duration: "1 hour 30 mins",
      frequency: "Regular",
      isLoop: true,
      onceDaily: false,
      morningSequenceIndex: null,
      notes: "Morning return trip connecting Tindivanam passengers and supplies back to Avanipur.",
      stops: [
        { name: "Tindivanam Bus Stand", time: "09:10 AM", type: "origin" },
        { name: "En-route Villages", time: "On route", type: "intermediate" },
        { name: "Avanipur Bus Stop", time: "10:40 AM", type: "destination" }
      ]
    },
    {
      id: "189-che-avn",
      number: "189",
      from: "Chennai",
      to: "Avanipur",
      departure: "13:00", // 1:00 PM
      arrival: "16:30",   // 4:30 PM
      duration: "3 hours 30 mins",
      frequency: "Once Daily",
      isLoop: false,
      onceDaily: true,
      morningSequenceIndex: null,
      notes: "Return direct long-distance bus from Chennai back to Avanipur. Runs ONLY ONCE PER DAY in this direction. Departs Chennai at 1:00 PM and arrives at Avanipur at 4:30 PM.",
      stops: [
        { name: "Chennai (CMBT / Kilambakkam)", time: "01:00 PM", type: "origin" },
        { name: "Tindivanam Bypass / Bus Stand", time: "On route", type: "intermediate" },
        { name: "Avanipur Bus Stop", time: "04:30 PM", type: "destination" }
      ]
    }
  ];

  /* ==========================================================================
     2. Internationalization / Language Support (English & Tamil)
     ========================================================================== */
  const translations = {
    en: {
      brand: "Avanipur Bus Details",
      subtitle: "Bus timings made simple for Avanipur",
      findYourBus: "Find Your Bus",
      heroDesc: "Check official bus timings between Avanipur village, Tindivanam, and Chennai. Real-time next bus calculation based on official timetable.",
      quickAvnToTnd: "Avanipur → Tindivanam",
      quickTndToAvn: "Tindivanam → Avanipur",
      quickAvnSub: "Morning regular services & direct routes",
      quickTndSub: "Return services back to the village",
      nextBusTitle: "Next Available Bus",
      searchPlaceholder: "Search bus number... (e.g. 13D, 6B, 23, 189)",
      allRoutes: "All Routes",
      morningSequence: "Morning Bus Sequence",
      morningSequenceSub: "Daily morning service cycle leading up to the 11:00 AM cutoff",
      regularLoop: "Regular Loop Service",
      onceDaily: "Once Daily",
      onceDailyBadge: "Once Daily Service",
      departure: "Departure",
      arrival: "Arrival",
      duration: "Duration",
      status: "Status",
      frequency: "Frequency",
      notes: "Notes",
      timetableTitle: "Complete Bus Timetable",
      noBusesToday: "No more buses today",
      noBusesTodayRoute: "No more scheduled buses for this route today.",
      busNotFound: "Bus not found. Try 13D, 6B, 23 or 189.",
      cutoffHeading: "11:00 AM Service Cutoff & Loop Policy",
      cutoffDesc: "Buses 13D, 6B, and 23 operate as regular loop services around the morning hours. Bus 189 operates strictly once per day in each direction. Last bus before cutoff is 13D. Additional loop schedules can be registered here as updated.",
      intermediateNotice: "12:30 PM at Tindivanam (intermediate timing supplied)",
      viewDetails: "View Full Details",
      printSchedule: "Print Timetable",
      departsIn: "Departs in",
      departedAgo: "Departed",
      firstBusTomorrow: "Next service tomorrow morning"
    },
    ta: {
      brand: "அவனிப்பூர் பேருந்து விவரங்கள்",
      subtitle: "அவனிப்பூர் கிராம பேருந்து நேரங்கள்",
      findYourBus: "உங்கள் பேருந்தை கண்டறியவும்",
      heroDesc: "அவனிப்பூர், திண்டிவனம் மற்றும் சென்னை இடையேயான அதிகாரப்பூர்வ பேருந்து நேரங்கள். நேரடி அட்டவணை அடிப்படையில் அடுத்த பேருந்து விவரங்கள்.",
      quickAvnToTnd: "அவனிப்பூர் → திண்டிவனம்",
      quickTndToAvn: "திண்டிவனம் → அவனிப்பூர்",
      quickAvnSub: "காலை வழக்கமான மற்றும் நேரடி பேருந்துகள்",
      quickTndSub: "ஊருக்கு திரும்பும் பேருந்துகள்",
      nextBusTitle: "அடுத்த பேருந்து",
      searchPlaceholder: "பேருந்து எண் தேடவும்... (13D, 6B, 23, 189)",
      allRoutes: "அனைத்து வழித்தடங்கள்",
      morningSequence: "காலை பேருந்து வரிசை",
      morningSequenceSub: "காலை 11:00 மணி வரையிலான நேரடி மற்றும் சுழற்சி முறை",
      regularLoop: "வழக்கமான சுழற்சி பேருந்து",
      onceDaily: "ஒருமுறை மட்டும்",
      onceDailyBadge: "ஒருமுறை மட்டுமே இயங்கும்",
      departure: "புறப்படும் நேரம்",
      arrival: "சென்றடையும் நேரம்",
      duration: "பயண நேரம்",
      status: "நிலை",
      frequency: "அதிர்வெண்",
      notes: "குறிப்புகள்",
      timetableTitle: "முழுமையான பேருந்து கால அட்டவணை",
      noBusesToday: "இன்று இனி பேருந்துகள் இல்லை",
      noBusesTodayRoute: "இந்த வழித்தடத்தில் இன்று இனி பேருந்துகள் இல்லை.",
      busNotFound: "பேருந்து எண் கிடைக்கவில்லை. 13D, 6B, 23 அல்லது 189 தேடவும்.",
      cutoffHeading: "காலை 11:00 மணி சுழற்சி முறை & விதிகள்",
      cutoffDesc: "13D, 6B, 23 ஆகியவை சுழற்சி முறையில் இயங்கும் வழக்கமான பேருந்துகள். 189 பேருந்து தினமும் ஒருமுறை மட்டுமே இயங்குகிறது.",
      intermediateNotice: "திண்டிவனம் சென்றடையும் நேரம்: மதியம் 12:30 (இடைப்பட்ட நேரம்)",
      viewDetails: "முழு விவரம்",
      printSchedule: "அச்சிடுக",
      departsIn: "இன்னும்",
      departedAgo: "முன்பு புறப்பட்டது",
      firstBusTomorrow: "நாளை காலை முதல் பேருந்து"
    }
  };

  let currentLang = 'en';
  let activeFilter = 'all'; // 'all', 'avn-tnd', 'tnd-avn', 'avn-che', 'che-avn'
  let currentSearchQuery = '';
  let simulatedTime = null; // null for live system clock, or 'HH:MM' string for simulation

  /* ==========================================================================
     3. Core Time Utility Functions (Requirement 14 & 15)
     ========================================================================== */

  /**
   * Get current time object using user device's local date/time or simulated time
   */
  function getCurrentTime() {
    if (simulatedTime) {
      const [hours, minutes] = simulatedTime.split(':').map(Number);
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d;
    }
    return new Date();
  }

  /**
   * Format 24-hour time "HH:MM" into 12-hour format "H:MM AM/PM"
   */
  function formatTime(time24) {
    if (!time24 || !time24.includes(':')) return time24;
    const parts = time24.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  }

  /**
   * Convert "HH:MM" to total minutes since midnight
   */
  function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Calculate duration between two "HH:MM" strings or return supplied duration
   */
  function calculateDuration(depTime, arrTime) {
    if (!depTime || !arrTime || !arrTime.includes(':')) return null;
    const depM = timeToMinutes(depTime);
    const arrM = timeToMinutes(arrTime);
    let diff = arrM - depM;
    if (diff < 0) diff += 24 * 60; // Crosses midnight
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0 && mins > 0) return `${hours} hr ${mins} mins`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${mins} mins`;
  }

  /**
   * Find next bus from today's timetable based on current time and filter
   * If no buses remain today, returns the first bus tomorrow
   */
  function getNextBus(routeFilter) {
    const now = getCurrentTime();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let candidateBuses = buses;
    if (routeFilter && routeFilter !== 'all') {
      candidateBuses = filterBusesByRoute(routeFilter);
    }

    // Sort by departure time
    const sorted = [...candidateBuses].sort((a, b) => timeToMinutes(a.departure) - timeToMinutes(b.departure));

    // Look for upcoming buses today
    const upcomingToday = sorted.filter(bus => timeToMinutes(bus.departure) >= currentMinutes);

    if (upcomingToday.length > 0) {
      const next = upcomingToday[0];
      const diffMinutes = timeToMinutes(next.departure) - currentMinutes;
      return {
        bus: next,
        isTomorrow: false,
        diffMinutes: diffMinutes
      };
    }

    // No more buses today: provide next day's first bus
    if (sorted.length > 0) {
      const tomorrowBus = sorted[0];
      const diffMinutes = (24 * 60 - currentMinutes) + timeToMinutes(tomorrowBus.departure);
      return {
        bus: tomorrowBus,
        isTomorrow: true,
        diffMinutes: diffMinutes
      };
    }

    return null;
  }

  /**
   * Filter buses by specific route
   */
  function filterBusesByRoute(filterKey) {
    switch (filterKey) {
      case 'avn-tnd':
        return buses.filter(b => b.from === 'Avanipur' && b.to === 'Tindivanam');
      case 'tnd-avn':
        return buses.filter(b => b.from === 'Tindivanam' && b.to === 'Avanipur');
      case 'avn-che':
        return buses.filter(b => b.from === 'Avanipur' && b.to === 'Chennai');
      case 'che-avn':
        return buses.filter(b => b.from === 'Chennai' && b.to === 'Avanipur');
      case 'from-avn':
        return buses.filter(b => b.from === 'Avanipur');
      case 'to-avn':
        return buses.filter(b => b.to === 'Avanipur');
      default:
        return buses;
    }
  }

  /**
   * Search buses by query (Requirement 14 & 19)
   */
  function searchBuses(query) {
    if (!query || query.trim() === '') return buses;
    const cleanQuery = query.trim().toUpperCase().replace(/\s+/g, '');
    return buses.filter(bus => {
      const num = bus.number.toUpperCase().replace(/\s+/g, '');
      const from = bus.from.toUpperCase();
      const to = bus.to.toUpperCase();
      const freq = bus.frequency.toUpperCase();
      return num.includes(cleanQuery) ||
             from.includes(cleanQuery) ||
             to.includes(cleanQuery) ||
             freq.includes(cleanQuery);
    });
  }

  /**
   * Combined filter and search
   */
  function getFilteredBuses() {
    let result = filterBusesByRoute(activeFilter);
    if (currentSearchQuery) {
      const q = currentSearchQuery.trim().toUpperCase().replace(/\s+/g, '');
      result = result.filter(bus => {
        const num = bus.number.toUpperCase().replace(/\s+/g, '');
        const from = bus.from.toUpperCase();
        const to = bus.to.toUpperCase();
        return num.includes(q) || from.includes(q) || to.includes(q);
      });
    }
    return result;
  }

  /* ==========================================================================
     4. UI Rendering Functions
     ========================================================================== */

  /**
   * Update Next Bus Hero Card and Live Clock
   */
  function updateNextBusUI() {
    const now = getCurrentTime();
    const clockEl = document.getElementById('liveClockText');
    if (clockEl) {
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      clockEl.textContent = `${formattedHours}:${minutes}:${seconds} ${ampm}`;
    }

    const nextBusContainer = document.getElementById('nextBusHeroContent');
    if (!nextBusContainer) return;

    const nextBusData = getNextBus(activeFilter === 'all' ? null : activeFilter);
    const t = translations[currentLang];

    if (!nextBusData) {
      nextBusContainer.innerHTML = `
        <div class="empty-state" style="padding: 1.5rem 1rem;">
          <p class="empty-title">${t.noBusesTodayRoute}</p>
        </div>
      `;
      return;
    }

    const { bus, isTomorrow, diffMinutes } = nextBusData;
    const depTimeFormatted = formatTime(bus.departure);
    
    let countdownText = "";
    let isTodayExhausted = false;

    if (isTomorrow) {
      isTodayExhausted = true;
      countdownText = `${t.noBusesToday} · ${t.firstBusTomorrow}: ${depTimeFormatted}`;
    } else if (diffMinutes === 0) {
      countdownText = `Departing right now! (${depTimeFormatted})`;
    } else if (diffMinutes < 60) {
      countdownText = `${t.departsIn} ${diffMinutes} min${diffMinutes > 1 ? 's' : ''}`;
    } else {
      const h = Math.floor(diffMinutes / 60);
      const m = diffMinutes % 60;
      countdownText = `${t.departsIn} ${h} hr ${m} min`;
    }

    const badgeClass = bus.onceDaily ? 'status-once-daily' : 'status-regular';
    const badgeText = bus.onceDaily ? t.onceDaily : t.regularLoop;

    nextBusContainer.innerHTML = `
      <div class="next-bus-details">
        ${isTodayExhausted ? `
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: 0.625rem 0.875rem; color: #991b1b; font-size: 0.8125rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>${t.noBusesToday} — showing tomorrow's first departure</span>
          </div>
        ` : ''}

        <div class="next-bus-main-row">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="next-bus-number">${bus.number}</span>
            <span class="status-pill ${badgeClass}">${badgeText}</span>
          </div>
          <span class="next-bus-time tabular-nums">${depTimeFormatted}</span>
        </div>

        <div class="next-bus-route-text">
          <span>${bus.from}</span>
          <span class="route-arrow">→</span>
          <span>${bus.to}</span>
        </div>

        <div class="next-bus-countdown" style="${isTodayExhausted ? 'background-color: #f1f5f9; color: var(--text-primary);' : ''}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span class="tabular-nums">${countdownText}</span>
        </div>

        ${bus.onceDaily && bus.from === 'Avanipur' ? `
          <div class="intermediate-note">
            ⚠️ <strong>${t.onceDailyBadge}</strong>: Runs only once per day. Arrives at Tindivanam at 12:30 PM (intermediate timing supplied) before proceeding to Chennai.
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;">
          <span class="next-bus-meta-text">Duration: ${bus.duration}</span>
          <button class="view-details-text" data-bus-id="${bus.id}" style="background: none; border: none; cursor: pointer; padding: 0;">
            ${t.viewDetails} →
          </button>
        </div>
      </div>
    `;

    // Attach click handler to the view details button
    const viewBtn = nextBusContainer.querySelector(`[data-bus-id="${bus.id}"]`);
    if (viewBtn) {
      viewBtn.addEventListener('click', () => showBusDetails(bus.id));
    }
  }

  /**
   * Render Bus Cards Grid (Requirement 5)
   */
  function renderBusCards(busList) {
    const grid = document.getElementById('busCardsGrid');
    const emptyState = document.getElementById('busEmptyState');
    if (!grid || !emptyState) return;

    if (busList.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'flex';
      const msg = document.getElementById('emptyStateMessage');
      if (msg) msg.textContent = translations[currentLang].busNotFound;
      return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    const t = translations[currentLang];

    grid.innerHTML = busList.map(bus => {
      const depFormatted = formatTime(bus.departure);
      const is189Avn = bus.number === '189' && bus.from === 'Avanipur';
      const badgeClass = bus.onceDaily ? 'status-once-daily' : 'status-regular';
      const badgeText = bus.onceDaily ? t.onceDaily : t.regularLoop;

      return `
        <article class="bus-card" tabindex="0" role="button" data-bus-id="${bus.id}" aria-label="Bus ${bus.number} from ${bus.from} to ${bus.to}">
          <div class="bus-card-top">
            <div class="bus-card-num-group">
              <div class="bus-badge-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 6v6"></path>
                  <path d="M15 6v6"></path>
                  <path d="M2 12h19.6"></path>
                  <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path>
                  <circle cx="7" cy="18" r="2"></circle>
                  <path d="M9 18h5"></path>
                  <circle cx="16" cy="18" r="2"></circle>
                </svg>
              </div>
              <span class="bus-number-text">${bus.number}</span>
            </div>
            <span class="status-pill ${badgeClass}">
              ${bus.onceDaily ? '🟠 ' : '🟢 '}${badgeText}
            </span>
          </div>

          <div class="bus-route-row">
            <span>${bus.from}</span>
            <span class="route-arrow">→</span>
            <span>${bus.to}</span>
          </div>

          <div class="schedule-block">
            <div class="schedule-point">
              <span class="schedule-label">${t.departure}</span>
              <span class="schedule-time tabular-nums">${depFormatted}</span>
              <span class="schedule-place">${bus.from}</span>
            </div>
            <div class="schedule-point">
              <span class="schedule-label">${t.arrival}</span>
              <span class="schedule-time tabular-nums">
                ${bus.arrival.includes(':') ? formatTime(bus.arrival) : (is189Avn ? '12:30 PM*' : bus.arrival)}
              </span>
              <span class="schedule-place">${is189Avn ? 'Tindivanam*' : bus.to}</span>
            </div>
          </div>

          ${is189Avn ? `
            <div class="intermediate-note">
              <strong>${t.intermediateNotice}</strong>. Continues onward to Chennai. Runs only once per day.
            </div>
          ` : ''}

          <div class="bus-card-footer">
            <div class="duration-info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span class="tabular-nums">${bus.duration}</span>
            </div>
            <span class="view-details-text">
              ${t.viewDetails} →
            </span>
          </div>
        </article>
      `;
    }).join('');

    // Attach card click handlers
    grid.querySelectorAll('.bus-card').forEach(card => {
      const busId = card.getAttribute('data-bus-id');
      card.addEventListener('click', () => showBusDetails(busId));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showBusDetails(busId);
        }
      });
    });
  }

  /**
   * Render Timetable Table (Requirement 6)
   */
  function renderTimetable(busList) {
    const tbody = document.getElementById('timetableBody');
    if (!tbody) return;

    const t = translations[currentLang];

    tbody.innerHTML = busList.map(bus => {
      const is189Avn = bus.number === '189' && bus.from === 'Avanipur';
      const badgeClass = bus.onceDaily ? 'status-once-daily' : 'status-regular';
      const badgeText = bus.onceDaily ? t.onceDaily : t.regularLoop;

      return `
        <tr>
          <td><span class="table-bus-num">${bus.number}</span></td>
          <td><strong>${bus.from}</strong> → <strong>${bus.to}</strong></td>
          <td class="table-time">${formatTime(bus.departure)}</td>
          <td class="table-time">
            ${bus.arrival.includes(':') ? formatTime(bus.arrival) : (is189Avn ? '12:30 PM (Tindivanam)*' : bus.arrival)}
          </td>
          <td><span class="status-pill ${badgeClass}">${badgeText}</span></td>
          <td>
            <small style="color: var(--text-muted);">
              ${is189Avn ? '12:30 PM at Tindivanam (intermediate timing supplied); destination Chennai' : bus.duration}
            </small>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Show Bus Details Modal (Requirement 8)
   */
  function showBusDetails(busId) {
    const bus = buses.find(b => b.id === busId);
    if (!bus) return;

    const modal = document.getElementById('busDetailsModal');
    const content = document.getElementById('modalDetailsBody');
    const titleEl = document.getElementById('modalBusNumber');
    const badgeEl = document.getElementById('modalBusBadge');
    if (!modal || !content || !titleEl || !badgeEl) return;

    const t = translations[currentLang];
    const is189Avn = bus.number === '189' && bus.from === 'Avanipur';

    titleEl.textContent = `Bus ${bus.number}`;
    badgeEl.className = `status-pill ${bus.onceDaily ? 'status-once-daily' : 'status-regular'}`;
    badgeEl.textContent = bus.onceDaily ? t.onceDailyBadge : t.regularLoop;

    const depFormatted = formatTime(bus.departure);
    let arrFormatted = bus.arrival.includes(':') ? formatTime(bus.arrival) : bus.arrival;
    if (is189Avn) {
      arrFormatted = "Chennai (12:30 PM at Tindivanam)*";
    }

    content.innerHTML = `
      <div class="modal-route-visual">
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.05em;">
          Route & Stop Progression
        </div>
        ${bus.stops.map((stop, idx) => `
          <div class="route-stop-point">
            <div class="stop-indicator ${idx === bus.stops.length - 1 ? 'terminal' : ''}"></div>
            <div class="stop-info">
              <span class="stop-place-name">${stop.name}</span>
              <span class="stop-time-label tabular-nums">${stop.time}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="modal-meta-grid">
        <div class="modal-meta-cell">
          <span class="modal-meta-label">${t.departure}</span>
          <span class="modal-meta-value tabular-nums">${depFormatted} (${bus.from})</span>
        </div>
        <div class="modal-meta-cell">
          <span class="modal-meta-label">${t.arrival}</span>
          <span class="modal-meta-value tabular-nums">${arrFormatted}</span>
        </div>
        <div class="modal-meta-cell">
          <span class="modal-meta-label">${t.duration}</span>
          <span class="modal-meta-value">${bus.duration}</span>
        </div>
        <div class="modal-meta-cell">
          <span class="modal-meta-label">${t.frequency}</span>
          <span class="modal-meta-value">${bus.onceDaily ? 'Once Daily Service' : 'Regular Repeating Loop'}</span>
        </div>
      </div>

      <div class="modal-notice">
        <strong>Official Notes:</strong> ${bus.notes}
      </div>

      ${is189Avn ? `
        <div class="intermediate-note" style="margin-top: -0.25rem;">
          <strong>Important Schedule Distinction:</strong> 12:30 PM is the recorded arrival at Tindivanam (intermediate stop), not Chennai arrival. The bus continues from Tindivanam towards Chennai. This bus operates only once per day.
        </div>
      ` : ''}

      ${bus.isLoop ? `
        <div style="background-color: var(--color-primary-light); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.8125rem; color: #047857;">
          🔁 <strong>Loop Service Pattern:</strong> Bus ${bus.number} is part of the morning loop cycle for Avanipur village. After reaching Tindivanam, it returns on schedule.
        </div>
      ` : ''}
    `;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus close button for accessibility
    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    const modal = document.getElementById('busDetailsModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ==========================================================================
     5. Event Listeners & Interactive Handlers
     ========================================================================== */
  function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('busSearchInput');
    const clearBtn = document.getElementById('searchClearBtn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        if (clearBtn) {
          clearBtn.style.display = currentSearchQuery ? 'block' : 'none';
        }
        refreshBusesUI();
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchQuery = '';
        clearBtn.style.display = 'none';
        searchInput.focus();
        refreshBusesUI();
      });
    }

    // Suggestion chips in empty state
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const busNum = chip.getAttribute('data-bus-num');
        if (searchInput) {
          // Reset route filter to 'all' so the bus is guaranteed visible
          setFilterByRouteKey('all');
          searchInput.value = busNum;
          currentSearchQuery = busNum;
          if (clearBtn) clearBtn.style.display = 'block';
          refreshBusesUI();
        }
      });
    });

    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // Clear direction toggles active state
        document.querySelectorAll('.direction-btn').forEach(b => b.classList.remove('active'));
        activeFilter = tab.getAttribute('data-route') || 'all';
        refreshBusesUI();
      });
    });

    // Quick route cards in hero
    const quickAvnToTnd = document.getElementById('quickCardAvnToTnd');
    const quickTndToAvn = document.getElementById('quickCardTndToAvn');

    if (quickAvnToTnd) {
      quickAvnToTnd.addEventListener('click', (e) => {
        e.preventDefault();
        setFilterByRouteKey('avn-tnd');
        scrollToSection('busesSection');
      });
    }

    if (quickTndToAvn) {
      quickTndToAvn.addEventListener('click', (e) => {
        e.preventDefault();
        setFilterByRouteKey('tnd-avn');
        scrollToSection('busesSection');
      });
    }

    // Direction quick toggles
    document.querySelectorAll('.direction-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.getAttribute('data-dir');
        const wasActive = btn.classList.contains('active');
        document.querySelectorAll('.direction-btn').forEach(b => b.classList.remove('active'));
        if (wasActive) {
          setFilterByRouteKey('all');
        } else {
          btn.classList.add('active');
          setFilterByRouteKey(dir);
        }
      });
    });

    // Modal close triggers
    const modal = document.getElementById('busDetailsModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const footerCloseBtn = document.getElementById('modalFooterCloseBtn');

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (footerCloseBtn) footerCloseBtn.addEventListener('click', closeModal);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
        closeModal();
      }
    });

    // Language Toggle (English <-> Tamil)
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'ta' : 'en';
        langBtn.querySelector('.lang-label').textContent = currentLang === 'en' ? 'தமிழ்' : 'English';
        refreshBusesUI();
        updateStaticLabels();
      });
    }

    // Print button
    const printBtn = document.getElementById('printTimetableBtn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Time Simulator (Allows verifying next bus at 6:45 AM, 7:10 AM, 9:00 AM, etc.)
    const timeSimSelect = document.getElementById('timeSimulatorSelect');
    if (timeSimSelect) {
      timeSimSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        simulatedTime = val === 'live' ? null : val;
        updateNextBusUI();
      });
    }

    // Mobile Bottom Tab Bar links
    const mobileTabs = document.querySelectorAll('.mobile-tab-item');
    mobileTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        mobileTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-target');
        if (targetId) {
          e.preventDefault();
          scrollToSection(targetId);
        }
      });
    });
  }

  function setFilterByRouteKey(routeKey) {
    activeFilter = routeKey;
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      if (tab.getAttribute('data-route') === routeKey) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    refreshBusesUI();
  }

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function refreshBusesUI() {
    const filtered = getFilteredBuses();
    renderBusCards(filtered);
    renderTimetable(filtered);
    updateNextBusUI();
  }

  function updateStaticLabels() {
    const t = translations[currentLang];
    // Update elements with data-i18n attributes if present
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) {
        el.textContent = t[key];
      }
    });

    const searchInput = document.getElementById('busSearchInput');
    if (searchInput) {
      searchInput.placeholder = t.searchPlaceholder;
    }
  }

  /* ==========================================================================
     6. Initialization & Interval Tick
     ========================================================================== */
  function init() {
    setupEventListeners();
    refreshBusesUI();

    // Start live clock & automatic next-bus ticker every second
    setInterval(() => {
      updateNextBusUI();
    }, 1000);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
