let tripData = {
    flights: [
        {
            id: 1,
            airline: 'Iberia',
            from: 'Madrid (MAD)',
            to: 'Palma, Mallorca (PMI)',
            departure: '2025-11-04T19:30:00',
            arrival: '2025-11-04T20:50:00',
            details: 'Economy, Airbus A321neo, I21675',
            group: 'main'
        },
        {
            id: 2,
            airline: 'British Airways',
            from: 'Palma, Mallorca (PMI)',
            to: 'London Heathrow (LHR)',
            departure: '2025-11-08T14:25:00',
            arrival: '2025-11-08T15:40:00',
            details: 'Economy, Airbus A320, BA494',
            group: 'main'
        },
        {
            id: 3,
            airline: 'KLM',
            from: 'London Heathrow (LHR)',
            to: 'Amsterdam (AMS)',
            departure: '2025-11-13T15:45:00',
            arrival: '2025-11-13T18:00:00',
            details: 'Economy, Embraer 195 E2, KL1010',
            group: 'main'
        },
        {
            id: 4,
            airline: 'PlusUltra Airlines',
            from: 'Lima (LIM)',
            to: 'Madrid (MAD)',
            departure: '2025-11-01T18:10:00',
            arrival: '2025-11-02T13:05:00',
            details: 'Economy, Airbus A340-300, PU702',
            group: 'main'
        },
        {
            id: 5,
            airline: 'United Airlines',
            from: 'Amsterdam (AMS)',
            to: 'Houston (IAH)',
            departure: '2025-11-13T10:20:00',
            arrival: '2025-11-13T14:40:00',
            details: 'Economy, Boeing 767, UA 21, 1 hr 40 min layover in Houston',
            group: 'partial'
        },
        {
            id: 6,
            airline: 'United Airlines',
            from: 'Houston (IAH)',
            to: 'Lima (LIM)',
            departure: '2025-11-13T16:20:00',
            arrival: '2025-11-13T23:55:00',
            details: 'Economy, Boeing 737-800, UA 854, 1 hr 40 min layover in Houston',
            group: 'partial'
        }
    ],
    hotels: [
        {
            id: 1,
            hotelName: 'Madrid',
            type: 'Airbnb',
            address: 'Calle de las Infantas, 34, Madrid',
            checkin: '2025-11-02T14:00:00',
            checkout: '2025-11-04T12:00:00',
            url: 'https://www.airbnb.com/rooms/placeholder-madrid'
        },
        {
            id: 2,
            hotelName: 'Cala d\'Or',
            type: 'Airbnb',
            address: 'Carrer de sa Vinya, 10, Cala d\'Or, Mallorca',
            checkin: '2025-11-04T15:00:00',
            checkout: '2025-11-08T10:00:00',
            url: 'https://www.airbnb.com/rooms/placeholder-mallorca'
        },
        {
            id: 3,
            hotelName: 'London Stay',
            type: 'Not defined',
            address: 'Not defined',
            checkin: '2025-11-08',
            checkout: '2025-11-13',
            url: ''
        },
        {
            id: 4,
            hotelName: 'XO Park West Hotel',
            type: 'Hotel',
            address: 'Molenwerf 1, 1014 AG Amsterdam',
            checkin: '2025-11-13T14:00:00',
            checkout: '2025-11-16T12:00:00',
            url: 'https://www.xo-hotels.com/en/hotels/xo-hotels-park-west/'
        }
    ]
};

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

function getDateRangeForCity(cityName) {
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
    if (matchIndex === -1) return [];

    const current = hotelsSorted[matchIndex];
    const next = hotelsSorted[matchIndex + 1] || null;

    // Start at the beginning of check-in day
    const start = toStartOfDay((current.checkin || '').includes('T') ? current.checkin : (current.checkin || '') + 'T00:00:00');
    // End is the earlier of next.checkin or current.checkout (both exclusive), normalized to start of that day
    const candidateEnds = [];
    if (current.checkout) candidateEnds.push(toStartOfDay((current.checkout).includes('T') ? current.checkout : current.checkout + 'T00:00:00'));
    if (next && next.checkin) candidateEnds.push(toStartOfDay((next.checkin).includes('T') ? next.checkin : next.checkin + 'T00:00:00'));
    if (candidateEnds.length === 0) return [];
    const endExclusive = new Date(Math.min(...candidateEnds.map(d => d.getTime())));

    const days = [];
    const d = new Date(start);
    while (d < endExclusive) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    // Include the departure day as an extra itinerary card (end day)
    if (days.length > 0) {
        days.push(new Date(endExclusive));
    }
    return days;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    try { localStorage.setItem('activeTab', tabId); } catch (_) {}
    updateHash({ tab: tabId });
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

function focusItineraryCity(cityName) {
    if (!cityName) return;
    const citySlug = slugifyCity(cityName);
    switchTab('itinerary');
    const card = document.querySelector(`.itinerary-card[data-city="${citySlug}"]`);
    if (card) {
        card.classList.add('highlight');
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => card.classList.remove('highlight'), 1600);
    }
    updateHash({ tab: 'itinerary', city: citySlug });
    try { localStorage.setItem('lastCity', citySlug); } catch (_) {}
}

function createMapsLink(address) {
    const q = encodeURIComponent(address || '');
    return `https://maps.apple.com/?q=${q}`;
}

function createGoogleMapsLink(address) {
    const q = encodeURIComponent(address || '');
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// Map helpers for UI icons
function getAirlineLogoUrl(airlineName) {
    const key = (airlineName || '').toLowerCase();
    // Prefer local assets when available
    if (key.includes('iberia')) return 'iberia.png';
    if (key.includes('british airways')) return 'british.png';
    if (key.includes('klm')) return 'klm.png';
    if (key.includes('plusultra') || key.includes('plus ultra')) return 'plusUltra.png';
    if (key.includes('american airlines') || key.includes('american')) return 'americanAirlines.png';
    if (key.includes('united')) return 'unitedAirlines.png';
    // Fallback to external or none for others
    return '';
}

function getCountryCodeFromLocation(locationStr) {
    const name = (locationStr || '').toLowerCase();
    // Simple city-to-country mapping for this itinerary
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

function updateHash({ tab, city }) {
    const params = new URLSearchParams(location.hash.slice(1));
    if (tab) params.set('tab', tab); else params.delete('tab');
    if (city) params.set('city', city); else params.delete('city');
    const next = '#' + params.toString();
    if (location.hash !== next) {
        history.replaceState(null, '', next);
    }
}

function renderFlights() {
    const flightsList = document.getElementById('flightsList');
    flightsList.innerHTML = '';
    
    if (tripData.flights.length === 0) {
        flightsList.innerHTML = '<div class="empty-state"><h3>No flights added yet</h3></div>';
        return;
    }
    
    // Render main group flights
    const mainFlights = tripData.flights.filter(flight => flight.group === 'main');
    mainFlights.forEach(flight => {
        const flightDiv = document.createElement('div');
        flightDiv.className = 'card boarding flight';
        const airlineLogo = getAirlineLogoUrl(flight.airline);
        const fromCc = getCountryCodeFromLocation(flight.from);
        const toCc = getCountryCodeFromLocation(flight.to);
        const fromFlag = getFlagUrl(fromCc);
        const toFlag = getFlagUrl(toCc);
        // Highlight layover in details
        const detailsHtml = flight.details
            ? flight.details.replace(/(,\s*[^,]+layover[^,]+)/, '<span class="layover-highlight">$1</span>')
            : '';
        flightDiv.innerHTML = `
            <div class="pass-header">
                <div class="pass-title">
                    ${fromFlag ? `<img class="tiny-flag" src="${fromFlag}" alt="${fromCc.toUpperCase()} flag" referrerpolicy="no-referrer" crossorigin="anonymous" />` : ''}
                    <span class="route-text">${flight.from}</span>
                    <span class="arrow">→</span>
                    ${toFlag ? `<img class="tiny-flag" src="${toFlag}" alt="${toCc.toUpperCase()} flag" referrerpolicy="no-referrer" crossorigin="anonymous" />` : ''}
                    <span class="route-text">${flight.to}</span>
                </div>
                <div class="pass-subtitle">
                    <span class="airline-chip" role="img" aria-label="${flight.airline}">
                        ${airlineLogo ? `<img class="tiny-logo" src="${airlineLogo}" alt="" referrerpolicy="no-referrer" crossorigin="anonymous" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling && this.nextElementSibling.classList.add('show');" />` : ''}
                        <span class="tiny-badge${airlineLogo ? '' : ' show'}" aria-hidden="true">${getAirlineInitials(flight.airline)}</span>
                    </span>
                </div>
            </div>
            <div class="pass-row">
                <div class="chip">${formatDateTimeShort(flight.departure)}</div>
                <div class="chip">${formatDateTimeShort(flight.arrival)}</div>
            </div>
            ${detailsHtml ? `<div class="pass-footer">${detailsHtml}</div>` : ''}
        `;
        flightDiv.addEventListener('click', () => {
            const city = getCityFromFlight(flight);
            focusItineraryCity(city);
        });
        flightsList.appendChild(flightDiv);
    });
    
    // Render partial group flights with separator
    const partialFlights = tripData.flights.filter(flight => flight.group === 'partial');
    if (partialFlights.length > 0) {
        const partialGroupDiv = document.createElement('div');
        partialGroupDiv.className = 'partial-group';
        partialGroupDiv.innerHTML = '<div class="partial-group-label">Partial Group Itinerary</div>';
        
        partialFlights.forEach(flight => {
            const flightDiv = document.createElement('div');
            flightDiv.className = 'card boarding flight';
            const airlineLogo = getAirlineLogoUrl(flight.airline);
            const fromCc = getCountryCodeFromLocation(flight.from);
            const toCc = getCountryCodeFromLocation(flight.to);
            const fromFlag = getFlagUrl(fromCc);
            const toFlag = getFlagUrl(toCc);
            // Highlight layover in details
            const detailsHtml = flight.details
                ? flight.details.replace(/(,\s*[^,]+layover[^,]+)/, '<span class="layover-highlight">$1</span>')
                : '';
            flightDiv.innerHTML = `
            <div class="pass-header">
                    <div class="pass-title">
                        ${fromFlag ? `<img class="tiny-flag" src="${fromFlag}" alt="${fromCc.toUpperCase()} flag" referrerpolicy="no-referrer" crossorigin="anonymous" />` : ''}
                        <span class="route-text">${flight.from}</span>
                        <span class="arrow">→</span>
                        ${toFlag ? `<img class="tiny-flag" src="${toFlag}" alt="${toCc.toUpperCase()} flag" referrerpolicy="no-referrer" crossorigin="anonymous" />` : ''}
                        <span class="route-text">${flight.to}</span>
                    </div>
                <div class="pass-subtitle">
                    <span class="airline-chip" role="img" aria-label="${flight.airline}">
                        ${airlineLogo ? `<img class="tiny-logo" src="${airlineLogo}" alt="" referrerpolicy="no-referrer" crossorigin="anonymous" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling && this.nextElementSibling.classList.add('show');" />` : ''}
                        <span class="tiny-badge${airlineLogo ? '' : ' show'}" aria-hidden="true">${getAirlineInitials(flight.airline)}</span>
                    </span>
                </div>
                </div>
                <div class="pass-row">
                    <div class="chip">${formatDateTimeShort(flight.departure)}</div>
                    <div class="chip">${formatDateTimeShort(flight.arrival)}</div>
                </div>
                ${detailsHtml ? `<div class="pass-footer">${detailsHtml}</div>` : ''}
            `;
            flightDiv.addEventListener('click', () => {
                const city = getCityFromFlight(flight);
                focusItineraryCity(city);
            });
            partialGroupDiv.appendChild(flightDiv);
        });
        
        flightsList.appendChild(partialGroupDiv);
    }
}

function renderHotels() {
    const hotelsList = document.getElementById('hotelsList');
    hotelsList.innerHTML = '';
    
    if (tripData.hotels.length === 0) {
        hotelsList.innerHTML = '<div class="empty-state"><h3>No accommodations added yet</h3></div>';
        return;
    }
    
    tripData.hotels.forEach(hotel => {
        const hotelDiv = document.createElement('div');
        hotelDiv.className = 'card boarding hotel';
        const mapsLink = hotel.address && hotel.address !== 'Not defined' ? createMapsLink(hotel.address) : '';
        const gmapsLink = hotel.address && hotel.address !== 'Not defined' ? createGoogleMapsLink(hotel.address) : '';
        hotelDiv.innerHTML = `
            <div class="pass-header">
                <div class="pass-title">${hotel.hotelName}</div>
                <div class="pass-subtitle">${hotel.type}</div>
            </div>
            <div class="pass-row">
                <div class="chip"><span class="label">Check‑in</span> ${hotel.checkin.includes('T') ? formatDateTime(hotel.checkin) : formatDate(hotel.checkin)}</div>
                <div class="chip"><span class="label">Check‑out</span> ${hotel.checkout.includes('T') ? formatDateTime(hotel.checkout) : formatDate(hotel.checkout)}</div>
            </div>
            <div class="pass-footer address">${hotel.address}</div>
            <div class="pass-actions">
                ${mapsLink ? `<a class="icon-btn" href="${mapsLink}" target="_blank" rel="noopener" aria-label="Open in Apple Maps"><img src="appleMaps.png" alt="" class="icon-img"></a>` : ''}
                ${gmapsLink ? `<a class="icon-btn" href="${gmapsLink}" target="_blank" rel="noopener" aria-label="Open in Google Maps"><img src="googleMaps.png" alt="" class="icon-img"></a>` : ''}
            </div>
        `;
        hotelDiv.addEventListener('click', () => {
            const city = getCityForHotel(hotel);
            focusItineraryCity(city);
        });
        hotelDiv.querySelectorAll('a').forEach(a => a.addEventListener('click', e => e.stopPropagation()));
        hotelsList.appendChild(hotelDiv);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderFlights();
    renderHotels();
    renderItinerary();
    
    // Add event listeners for tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    // Restore from hash or storage
    const params = new URLSearchParams(location.hash.slice(1));
    const hashTab = params.get('tab');
    const hashCity = params.get('city');
    let savedTab = null;
    try { savedTab = localStorage.getItem('activeTab'); } catch (_) {}
    const initialTab = hashTab || savedTab || 'flights';
    if (initialTab !== 'flights') switchTab(initialTab);
    if (hashTab === 'itinerary' && hashCity) {
        const guessName = hashCity.replace(/-/g, ' ');
        focusItineraryCity(guessName);
    }
});

function renderItinerary() {
    const itineraryList = document.getElementById('itineraryList');
    if (!itineraryList) return;

    const placeholders = [
        { city: 'Madrid', dates: 'Nov 2 – Nov 4', notes: 'Arrival, explore city center, tapas.' },
        { city: 'Mallorca', dates: 'Nov 4 – Nov 8', notes: 'Beach day, Cala d\'Or, scenic drive.' },
        { city: 'London', dates: 'Nov 8 – Nov 13', notes: 'Sightseeing, museums, West End show.' },
        { city: 'Amsterdam', dates: 'Nov 13 – Nov 16', notes: 'Canal tour, bikes, museums.' }
    ];

    itineraryList.innerHTML = '';

    const stored = (() => { try { return JSON.parse(localStorage.getItem('itineraryChecks') || '{}'); } catch (_) { return {}; } })();

    placeholders.forEach(stop => {
        const card = document.createElement('div');
        const citySlug = slugifyCity(stop.city);
        card.className = 'card boarding itinerary itinerary-card playing';
        card.setAttribute('data-city', citySlug);
        card.id = `itinerary-${citySlug}`;
        const days = getDateRangeForCity(stop.city);
        const checksPerCity = stored[citySlug] || {};
        // Build slides markup
        const slidesHtml = days.map((d, dayIdx) => {
            const labels = ['Morning activity', 'Afternoon activity', 'Evening activity'];
            const checkedIdxs = Array.isArray(checksPerCity[dayIdx]) ? checksPerCity[dayIdx] : [];
            const list = labels.map((label, i) => {
                const isChecked = checkedIdxs.includes(i);
                return `
                <div class="check-item${isChecked ? ' checked' : ''}" data-idx="${i}" role="listitem" tabindex="0">
                    <span class="check-indicator">${isChecked ? '✓' : ''}</span>
                    <span class="check-label">${label}</span>
                </div>`;
            }).join('');
            return `
            <div class="slide" data-day="${dayIdx}">
                <div class="date-header">
                    <div class="date-title">${formatDayShort(d)}</div>
                    <div class="date-subtitle">${stop.city}</div>
                </div>
                <div class="checklist" role="list">
                    ${list}
                </div>
            </div>`;
        }).join('');

        const dotsHtml = days.map((_, i) => `<span class="slide-dot${i === 0 ? ' active' : ''}" data-dot="${i}"></span>`).join('');

        card.innerHTML = `
            <div class="pass-header">
                <div class="pass-title">${stop.city}</div>
                <div class="pass-subtitle">Itinerary</div>
            </div>
            <div class="pass-row">
                <div class="chip"><span class="label">Dates</span> ${stop.dates}</div>
            </div>
            <div class="slides" data-index="0">
                <div class="slides-track">
                    ${slidesHtml || ''}
                </div>
            </div>
            <div class="slide-dots">${dotsHtml}</div>
            <div class="slide-nav">
                <button class="nav-btn prev" type="button">Prev</button>
                <button class="nav-btn next" type="button">Next</button>
            </div>
        `;

        // Nav and swipe behavior
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

        // Touch swipe
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
            const threshold = width * 0.18;
            const current = Number(slidesEl.getAttribute('data-index'));
            if (deltaX < -threshold) update(current + 1);
            else if (deltaX > threshold) update(current - 1);
            deltaX = 0;
        });

        // Checklist toggle per day persistence
        card.querySelectorAll('.slide').forEach(slide => {
            const dayIdx = Number(slide.getAttribute('data-day'));
            slide.querySelectorAll('.check-item').forEach(row => {
                row.addEventListener('click', () => {
                    const idx = Number(row.getAttribute('data-idx'));
                    row.classList.toggle('checked');
                    const indicator = row.querySelector('.check-indicator');
                    const nowChecked = row.classList.contains('checked');
                    indicator.textContent = nowChecked ? '✓' : '';
                    const current = (() => { try { return JSON.parse(localStorage.getItem('itineraryChecks') || '{}'); } catch (_) { return {}; } })();
                    const cityObj = current[citySlug] && typeof current[citySlug] === 'object' ? current[citySlug] : {};
                    const dayArr = Array.isArray(cityObj[dayIdx]) ? cityObj[dayIdx] : [];
                    const pos = dayArr.indexOf(idx);
                    if (nowChecked && pos === -1) dayArr.push(idx);
                    if (!nowChecked && pos !== -1) dayArr.splice(pos, 1);
                    cityObj[dayIdx] = dayArr;
                    current[citySlug] = cityObj;
                    try { localStorage.setItem('itineraryChecks', JSON.stringify(current)); } catch (_) {}
                });
            });
        });

        // Initialize
        update(0);
        itineraryList.appendChild(card);
    });
}