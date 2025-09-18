// app.js

async function loadTripData() {
    try {
        const response = await fetch('tripData.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('Loaded tripData:', data);
        return data;
    } catch (error) {
        console.error('Failed to load tripData.json:', error);
        const flightsList = document.getElementById('flightsList');
        const hotelsList = document.getElementById('hotelsList');
        const itineraryList = document.getElementById('itineraryList');
        if (flightsList) flightsList.innerHTML = '<div class="empty-state"><h3>Error loading flight data</h3></div>';
        if (hotelsList) hotelsList.innerHTML = '<div class="empty-state"><h3>Error loading hotel data</h3></div>';
        if (itineraryList) itineraryList.innerHTML = '<div class="empty-state"><h3>Error loading itinerary data</h3></div>';
        return { flights: [], hotels: [], itinerary: [] };
    }
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return 'Not defined';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function formatDateTimeShort(dateTimeStr) {
    if (!dateTimeStr) return 'Not defined';
    const date = new Date(dateTimeStr);
    const weekday = date.toLocaleString('en-GB', { weekday: 'short' });
    const day = date.toLocaleString('en-GB', { day: '2-digit' });
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const time = date.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${weekday}, ${day} ${month}, ${time}`;
}

function formatDate(dateStr) {
    if (!dateStr) return 'Not defined';
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatDayShort(dateObj) {
    if (!(dateObj instanceof Date)) return '';
    return dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
}

function toStartOfDay(dateLike) {
    const d = new Date(dateLike);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getDateRangeForCity(cityName, tripData) {
    const name = (cityName || '').toLowerCase();
    const hotelsSorted = [...tripData.hotels]
        .filter(h => h.checkin)
        .sort((a, b) => new Date(a.checkin).getTime() - new Date(b.checkin).getTime());

    const matchIndex = hotelsSorted.findIndex(h => {
        const hname = (h.hotelName || '').toLowerCase();
        const addr = (h.address || '').toLowerCase();
        if (name.includes('madrid')) return hname.includes('madrid');
        if (name.includes('mallorca')) return hname.includes('cala') || addr.includes('mallorca');
        if (name.includes('london')) return hname.includes('london');
        if (name.includes('amsterdam')) return hname.includes('amsterdam') || addr.includes('amsterdam');
        return false;
    });
    if (matchIndex === -1) {
        console.warn(`No hotel found for city: ${cityName}`);
        return [];
    }

    const current = hotelsSorted[matchIndex];
    const next = hotelsSorted[matchIndex + 1] || null;

    const start = toStartOfDay((current.checkin || '').includes('T') ? current.checkin : (current.checkin || '') + 'T00:00:00');
    const candidateEnds = [];
    if (current.checkout) candidateEnds.push(toStartOfDay((current.checkout).includes('T') ? current.checkout : current.checkout + 'T00:00:00'));
    if (next && next.checkin) candidateEnds.push(toStartOfDay((next.checkin).includes('T') ? next.checkin : next.checkin + 'T00:00:00'));
    if (candidateEnds.length === 0) {
        console.warn(`No valid end date for ${cityName}`);
        return [];
    }
    const endExclusive = new Date(Math.min(...candidateEnds.map(d => d.getTime())));

    const days = [];
    const d = new Date(start);
    while (d <= endExclusive) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    return days;
}

function slugifyCity(name) {
    return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getCityForHotel(hotel) {
    const name = (hotel.hotelName || '').toLowerCase();
    if (name.includes('madrid')) return 'Madrid';
    if (name.includes('cala')) return 'Mallorca';
    if (name.includes('london')) return 'London';
    if (name.includes('amsterdam') || (hotel.address || '').toLowerCase().includes('amsterdam')) return 'Amsterdam';
    return hotel.hotelName || 'Itinerary';
}

function getCityFromFlight(flight) {
    const to = flight.to || '';
    const beforeParen = to.split('(')[0].trim();
    if (beforeParen.toLowerCase().includes('mallorca')) return 'Mallorca';
    if (beforeParen.toLowerCase().includes('london')) return 'London';
    if (beforeParen.toLowerCase().includes('amsterdam')) return 'Amsterdam';
    if (beforeParen.toLowerCase().includes('madrid')) return 'Madrid';
    return beforeParen || 'Itinerary';
}

function createMapsLink(address) {
    const q = encodeURIComponent(address || '');
    return `https://maps.apple.com/?q=${q}`;
}

function createGoogleMapsLink(address) {
    const q = encodeURIComponent(address || '');
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function getAirlineLogoUrl(airlineName) {
    const key = (airlineName || '').toLowerCase();
    if (key.includes('iberia')) return 'iberia.png';
    if (key.includes('british airways')) return 'british.png';
    if (key.includes('klm')) return 'klm.png';
    if (key.includes('plusultra') || key.includes('plus ultra')) return 'plusUltra.png';
    if (key.includes('american airlines') || key.includes('american')) return 'americanAirlines.png';
    if (key.includes('united')) return 'unitedAirlines.png';
    return '';
}

function getCountryCodeFromLocation(locationStr) {
    const name = (locationStr || '').toLowerCase();
    if (name.includes('madrid')) return 'es';
    if (name.includes('mallorca') || name.includes('palma')) return 'es';
    if (name.includes('london')) return 'gb';
    if (name.includes('amsterdam')) return 'nl';
    if (name.includes('houston')) return 'us';
    if (name.includes('lima')) return 'pe';
    return '';
}

function getFlagUrl(cc) {
    if (!cc) return '';
    const code = cc.toLowerCase();
    return `https://flagcdn.com/w20/${code}.png`;
}

function getAirlineInitials(airlineName) {
    const s = (airlineName || '').replace(/[^A-Za-z ]/g, '').trim();
    if (!s) return '?';
    const parts = s.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function updateHash({ section, city }) {
    const params = new URLSearchParams(location.hash.slice(1));
    if (section) params.set('section', section); else params.delete('section');
    if (city) params.set('city', city); else params.delete('city');
    const next = '#' + params.toString();
    if (location.hash !== next) {
        history.replaceState(null, '', next);
    }
}

function toggleTheme() {
    if (window.innerWidth <= 768) return; // Disable theme toggle on mobile
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'system';
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let nextTheme;

    if (currentTheme === 'system') {
        nextTheme = isDark ? 'light' : 'dark';
    } else if (currentTheme === 'dark') {
        nextTheme = 'light';
    } else {
        nextTheme = 'dark';
    }

    html.setAttribute('data-theme', nextTheme);
    try { localStorage.setItem('theme', nextTheme); } catch (_) {}
    updateThemeIcon(nextTheme);
}

function updateThemeIcon(theme) {
    if (window.innerWidth <= 768) return; // Skip icon update on mobile
    const icon = document.querySelector('.theme-icon');
    if (!icon) return;
    if (theme === 'dark') {
        icon.textContent = '☀️';
        icon.setAttribute('aria-label', 'Switch to light mode');
    } else {
        icon.textContent = '🌙';
        icon.setAttribute('aria-label', 'Switch to dark mode');
    }
}

function getActivityLink(description, city) {
    const desc = description.toLowerCase();
    // Specific venues or events
    if (desc.includes('casa lucio')) {
        return { url: 'https://casalucio.es', displayText: 'Casa Lucio' };
    }
    if (desc.includes('harry potter') && desc.includes('studio tour')) {
        return { url: 'https://www.wbstudiotour.co.uk', displayText: 'Harry Potter Warner Bros. Studio Tour' };
    }
    if (desc.includes('ceppi')) {
        return { url: createGoogleMapsLink('Ceppi’s, Amsterdam'), displayText: 'Ceppi’s' };
    }
    // Addresses or neighborhoods
    if (desc.includes('calle de las infantas')) {
        return { url: createGoogleMapsLink('Calle de las Infantas, Madrid'), displayText: 'Calle de las Infantas' };
    }
    if (desc.includes('cala d\'or')) {
        return { url: createGoogleMapsLink('Cala d\'Or, Mallorca'), displayText: 'Cala d\'Or' };
    }
    if (desc.includes('piccadilly circus')) {
        return { url: createGoogleMapsLink('Piccadilly Circus, London'), displayText: 'Piccadilly Circus' };
    }
    if (desc.includes('puerta del sol')) {
        return { url: createGoogleMapsLink('Puerta del Sol, Madrid'), displayText: 'Puerta del Sol' };
    }
    if (desc.includes('gran vía')) {
        return { url: createGoogleMapsLink('Gran Vía, Madrid'), displayText: 'Gran Vía' };
    }
    if (desc.includes('canales cercanos') || desc.includes('canal cruise')) {
        return { url: createGoogleMapsLink('Amsterdam Canals'), displayText: 'Amsterdam Canals' };
    }
    // Fallback: Non-linkable or generic search
    if (desc.includes('vuelo') || desc.includes('check-in') || desc.includes('llegada') || desc.includes('tiempo en')) {
        return { url: '', displayText: description };
    }
    // Generic search for unknown activities
    return { url: `https://www.google.com/search?q=${encodeURIComponent(description + ' ' + city)}`, displayText: description };
}

function createFlightCard(flight, isClickable = false) {
    const flightDiv = document.createElement('div');
    flightDiv.className = 'card boarding flight';
    if (!isClickable) flightDiv.classList.add('non-clickable');
    const airlineLogo = getAirlineLogoUrl(flight.airline);
    const fromCc = getCountryCodeFromLocation(flight.from);
    const toCc = getCountryCodeFromLocation(flight.to);
    const fromFlag = getFlagUrl(fromCc);
    const toFlag = getFlagUrl(toCc);
    const detailsHtml = flight.details
        ? flight.details.replace(/(,\s*[^,]+layover[^,]+)/, '<span class="layover-highlight">$1</span>')
        : '';
    flightDiv.innerHTML = `
        <div class="pass-header">
            <div class="pass-primary">
                <div class="depart">
                    ${fromFlag ? `<img class="tiny-flag" src="${fromFlag}" alt="${fromCc.toUpperCase()} flag" referrerpolicy="no-referrer" crossorigin="anonymous" />` : ''}
                    <span class="city">${flight.from}</span>
                    <span class="time">${formatDateTimeShort(flight.departure)}</span>
                </div>
                <span class="arrow">→</span>
                <div class="arrive">
                    ${toFlag ? `<img class="tiny-flag" src="${toFlag}" alt="${toCc.toUpperCase()} flag" referrerpolicy="no-referrer" crossorigin="anonymous" />` : ''}
                    <span class="city">${flight.to}</span>
                    <span class="time">${formatDateTimeShort(flight.arrival)}</span>
                </div>
            </div>
            <div class="pass-subtitle">
                <span class="airline-chip" role="img" aria-label="${flight.airline}">
                    ${airlineLogo ? `<img class="tiny-logo" src="${airlineLogo}" alt="" referrerpolicy="no-referrer" crossorigin="anonymous" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling && this.nextElementSibling.classList.add('show');" />` : ''}
                    <span class="tiny-badge${airlineLogo ? '' : ' show'}" aria-hidden="true">${getAirlineInitials(flight.airline)}</span>
                </span>
            </div>
        </div>
        ${detailsHtml ? `<div class="pass-footer">${detailsHtml}</div>` : ''}
    `;
    return flightDiv;
}

function createHotelCard(hotel) {
    const hotelDiv = document.createElement('div');
    hotelDiv.className = 'card boarding hotel';
    const mapsLink = hotel.address && hotel.address !== 'Not defined' ? createMapsLink(hotel.address) : '';
    const gmapsLink = hotel.address && hotel.address !== 'Not defined' ? createGoogleMapsLink(hotel.address) : '';
    hotelDiv.innerHTML = `
        <div class="pass-header">
            <div class="pass-title">${hotel.hotelName}</div>
            <div class="pass-subtitle">${hotel.type}</div>
        </div>
        <div class="pass-primary">
            <div class="depart">
                <span class="label">Check-in</span>
                <span class="time">${hotel.checkin.includes('T') ? formatDateTime(hotel.checkin) : formatDate(hotel.checkin)}</span>
            </div>
            <span class="arrow">→</span>
            <div class="arrive">
                <span class="label">Check-out</span>
                <span class="time">${hotel.checkout.includes('T') ? formatDateTime(hotel.checkout) : formatDate(hotel.checkout)}</span>
            </div>
        </div>
        <div class="pass-footer address">${hotel.address}</div>
        <div class="pass-actions">
            ${mapsLink ? `<a class="icon-btn apple-maps" href="${mapsLink}" target="_blank" rel="noopener" aria-label="Open in Apple Maps"><img src="appleMaps.png" alt="" class="icon-img"></a>` : ''}
            ${gmapsLink ? `<a class="icon-btn google-maps" href="${gmapsLink}" target="_blank" rel="noopener" aria-label="Open in Google Maps"><img src="googleMaps.png" alt="" class="icon-img"></a>` : ''}
        </div>
    `;
    hotelDiv.querySelectorAll('a').forEach(a => a.addEventListener('click', e => e.stopPropagation()));
    return hotelDiv;
}

function createItineraryCard(stop, tripData) {
    const card = document.createElement('div');
    const citySlug = slugifyCity(stop.city);
    card.className = 'card boarding itinerary itinerary-card playing';
    card.setAttribute('data-city', citySlug);
    card.id = `itinerary-${citySlug}`;
    const days = getDateRangeForCity(stop.city, tripData);

    const slidesHtml = days.map((d, dayIdx) => {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayData = stop.days.find(day => day.date === dateStr) || { activities: [] };
        const activities = dayData.activities || [];
        const labels = ['mañana', 'tarde', 'noche'];
        const list = labels.map((label, i) => {
            const activity = activities.find(act => act.period.trim().toLowerCase() === label);
            if (!activity) {
                console.warn(`No activity found for ${label} on ${dateStr} in ${stop.city}`);
                return `<div class="activity-item"><span class="activity-period">${label.charAt(0).toUpperCase() + label.slice(1)}</span><span class="activity-label">No activity defined</span></div>`;
            }
            const { url, displayText } = getActivityLink(activity.description, stop.city);
            return `
            <div class="activity-item" role="listitem" tabindex="0">
                <span class="activity-period">${label.charAt(0).toUpperCase() + label.slice(1)}</span>
                ${url ? `
                    <a href="${url}" target="_blank" rel="noopener" class="activity-link" aria-label="${activity.description}">
                        ${displayText}
                    </a>
                    ${displayText !== activity.description ? `<span class="activity-context">${activity.description.replace(displayText, '')}</span>` : ''}
                ` : `
                    <span class="activity-label">${activity.description}</span>
                `}
            </div>`;
        }).join('');
        return `
        <div class="slide" data-day="${dayIdx}">
            <div class="date-header">
                <div class="date-title">${formatDayShort(d)}</div>
                <div class="date-subtitle">${stop.city}</div>
            </div>
            <div class="activity-list" role="list">
                ${list}
            </div>
        </div>`;
    }).join('');

    const dotsHtml = days.map((_, i) => `<span class="slide-dot${i === 0 ? ' active' : ''}" data-dot="${i}"></span>`).join('');

    card.innerHTML = `
        <div class="pass-header">
            <div class="pass-title">${stop.city}</div>
            <div class="pass-subtitle">Itinerario</div>
        </div>
        <div class="pass-row">
            <div class="chip"><span class="label">Fechas</span> ${stop.dates}</div>
        </div>
        <div class="slides" data-index="0">
            <div class="slides-track">
                ${slidesHtml || ''}
            </div>
        </div>
        <div class="slide-dots">${dotsHtml}</div>
        <div class="slide-nav">
            <button class="nav-btn prev" type="button">Anterior</button>
            <button class="nav-btn next" type="button">Siguiente</button>
        </div>
    `;

    const slidesEl = card.querySelector('.slides');
    const trackEl = card.querySelector('.slides-track');
    const dotsEl = card.querySelectorAll('.slide-dot');
    const prevBtn = card.querySelector('.nav-btn.prev');
    const nextBtn = card.querySelector('.nav-btn.next');
    const total = Math.max(days.length, 1);
    function update(index) {
        const clamped = Math.max(0, Math.min(index, total - 1));
        slidesEl.setAttribute('data-index', String(clamped));
        trackEl.style.transform = `translateX(-${clamped * 100}%)`;
        dotsEl.forEach((d, i) => d.classList.toggle('active', i === clamped));
        prevBtn.disabled = clamped === 0;
        nextBtn.disabled = clamped === total - 1;
    }
    prevBtn.addEventListener('click', () => update(Number(slidesEl.getAttribute('data-index')) - 1));
    nextBtn.addEventListener('click', () => update(Number(slidesEl.getAttribute('data-index')) + 1));
    dotsEl.forEach(dot => dot.addEventListener('click', () => update(Number(dot.getAttribute('data-dot')))));

    let startX = 0; let deltaX = 0; let dragging = false;
    slidesEl.addEventListener('touchstart', (e) => {
        if (!e.touches || !e.touches[0]) return;
        dragging = true; startX = e.touches[0].clientX; deltaX = 0;
    }, { passive: true });
    slidesEl.addEventListener('touchmove', (e) => {
        if (!dragging || !e.touches || !e.touches[0]) return;
        deltaX = e.touches[0].clientX - startX;
    }, { passive: true });
    slidesEl.addEventListener('touchend', () => {
        if (!dragging) return; dragging = false;
        const width = slidesEl.clientWidth || 1;
        const threshold = width * 0.15;
        const current = Number(slidesEl.getAttribute('data-index'));
        if (deltaX < -threshold) update(current + 1);
        else if (deltaX > threshold) update(current - 1);
        deltaX = 0;
    });

    return card;
}

function renderFlights(tripData) {
    const flightsList = document.getElementById('flightsList');
    flightsList.innerHTML = '';
    
    if (tripData.flights.length === 0) {
        flightsList.innerHTML = '<div class="empty-state"><h3>No flights added yet</h3></div>';
        return;
    }
    
    const mainFlights = tripData.flights.filter(flight => flight.group === 'main');
    mainFlights.forEach(flight => {
        const flightDiv = createFlightCard(flight, true);
        const city = getCityFromFlight(flight);
        flightDiv.addEventListener('click', () => {
            showAccommodationForCity(city, tripData);
        });
        flightsList.appendChild(flightDiv);
    });
    
    const partialFlights = tripData.flights.filter(flight => flight.group === 'partial');
    if (partialFlights.length > 0) {
        const partialGroupDiv = document.createElement('div');
        partialGroupDiv.className = 'partial-group';
        partialGroupDiv.innerHTML = '<div class="partial-group-label">Partial Group Itinerary</div>';
        
        partialFlights.forEach(flight => {
            const flightDiv = createFlightCard(flight, false);
            partialGroupDiv.appendChild(flightDiv);
        });
        
        flightsList.appendChild(partialGroupDiv);
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    updateHash({ section: sectionId });
}

function addBackButton(sectionId, onClick, label = 'Back to Flights') {
    const sectionEl = document.getElementById(sectionId);
    let backBtn = sectionEl.querySelector('.back-btn');
    if (backBtn) backBtn.remove();
    backBtn = document.createElement('button');
    backBtn.className = 'back-btn';
    backBtn.innerHTML = `<span class="back-icon">←</span> ${label}`;
    backBtn.addEventListener('click', onClick);
    sectionEl.prepend(backBtn);
}

function showAccommodationForCity(city, tripData) {
    showSection('accommodation');
    const hotelsList = document.getElementById('hotelsList');
    hotelsList.innerHTML = '';
    const hotel = tripData.hotels.find(h => getCityForHotel(h) === city);
    if (hotel) {
        const hotelDiv = createHotelCard(hotel);
        hotelDiv.addEventListener('click', () => {
            showItineraryForCity(city, tripData);
        });
        hotelsList.appendChild(hotelDiv);
    } else {
        hotelsList.innerHTML = '<div class="empty-state"><h3>No accommodation found for this city</h3></div>';
    }
    addBackButton('accommodation', () => showSection('flights'), 'Back to Flights');
    updateHash({ section: 'accommodation', city: slugifyCity(city) });
}

function showItineraryForCity(city, tripData) {
    showSection('itinerary');
    const itineraryList = document.getElementById('itineraryList');
    itineraryList.innerHTML = '';
    const stop = tripData.itinerary.find(s => s.city === city);
    if (stop) {
        const card = createItineraryCard(stop, tripData);
        card.classList.add('highlight');
        setTimeout(() => card.classList.remove('highlight'), 1600);
        itineraryList.appendChild(card);
    } else {
        itineraryList.innerHTML = '<div class="empty-state"><h3>No itinerary found for this city</h3></div>';
    }
    addBackButton('itinerary', () => showAccommodationForCity(city, tripData), 'Back to Accommodation');
    updateHash({ section: 'itinerary', city: slugifyCity(city) });
}

function populateQuickJump(tripData) {
    const select = document.getElementById('quick-jump');
    select.innerHTML = '<option value="">Jump to Itinerary</option>';
    tripData.itinerary.forEach(stop => {
        const option = document.createElement('option');
        option.value = stop.city;
        option.textContent = stop.city;
        select.appendChild(option);
    });
    select.addEventListener('change', (e) => {
        const city = e.target.value;
        if (city) {
            showItineraryForCity(city, tripData);
            e.target.value = '';
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const html = document.documentElement;
    let savedTheme = null;
    try { savedTheme = localStorage.getItem('theme'); } catch (_) {}
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = window.innerWidth <= 768 ? 'light' : (savedTheme && savedTheme !== 'system' ? savedTheme : 'system');
    html.setAttribute('data-theme', initialTheme);
    updateThemeIcon(initialTheme === 'system' ? systemTheme : initialTheme);

    if (window.innerWidth > 768) {
        document.querySelector('.theme-toggle')?.addEventListener('click', toggleTheme);
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (html.getAttribute('data-theme') === 'system') {
                updateThemeIcon(e.matches ? 'dark' : 'light');
            }
        });
    }

    const tripData = await loadTripData();
    renderFlights(tripData);
    populateQuickJump(tripData);

    const params = new URLSearchParams(location.hash.slice(1));
    const hashSection = params.get('section');
    const hashCity = params.get('city');
    let initialSection = hashSection || 'flights';
    if (initialSection === 'flights') {
        showSection('flights');
    } else if (initialSection === 'accommodation' && hashCity) {
        const city = hashCity.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        showAccommodationForCity(city, tripData);
    } else if (initialSection === 'itinerary' && hashCity) {
        const city = hashCity.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        showItineraryForCity(city, tripData);
    } else {
        showSection('flights');
    }
});