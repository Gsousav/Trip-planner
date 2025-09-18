let tripData = {
    flights: [
        {
            id: 1,
            airline: 'Iberia',
            from: 'Madrid (MAD)',
            to: 'Palma, Mallorca (PMI)',
            departure: '2025-11-04T19:30:00',
            arrival: '2025-11-04T20:50:00',
            group: 'main'
        },
        {
            id: 2,
            airline: 'British Airways',
            from: 'Palma, Mallorca (PMI)',
            to: 'London Heathrow (LHR)',
            departure: '2025-11-08T14:25:00',
            arrival: '2025-11-08T15:40:00',
            group: 'main'
        },
        {
            id: 3,
            airline: 'KLM',
            from: 'London Heathrow (LHR)',
            to: 'Amsterdam (AMS)',
            departure: '2025-11-13T15:45:00',
            arrival: '2025-11-13T18:00:00',
            group: 'main'
        },
        {
            id: 4,
            airline: 'PlusUltra Airlines',
            from: 'Lima (LIM)',
            to: 'Madrid (MAD)',
            departure: '2025-11-01T18:10:00',
            arrival: '2025-11-02T13:05:00',
            group: 'main'
        },
        {
            id: 5,
            airline: 'United Airlines',
            from: 'Amsterdam (AMS)',
            to: 'Houston (IAH)',
            departure: '2025-11-13T10:20:00',
            arrival: '2025-11-13T14:40:00',
            details: 'Economy, Boeing 767, UA 21',
            group: 'partial'
        },
        {
            id: 6,
            airline: 'United Airlines',
            from: 'Houston (IAH)',
            to: 'Lima (LIM)',
            departure: '2025-11-13T16:20:00',
            arrival: '2025-11-13T23:55:00',
            details: '1 hr 40 min layover in Houston',
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
        flightDiv.innerHTML = `
            <div class="pass-header">
                <div class="pass-title">${flight.from} → ${flight.to}</div>
                <div class="pass-subtitle">${flight.airline}</div>
            </div>
            <div class="pass-row">
                <div class="chip"><span class="label">Dep</span> ${formatDateTime(flight.departure)}</div>
                <div class="chip"><span class="label">Arr</span> ${formatDateTime(flight.arrival)}</div>
            </div>
            ${flight.details ? `<div class="pass-footer">${flight.details}</div>` : ''}
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
            flightDiv.innerHTML = `
                <div class="pass-header">
                    <div class="pass-title">${flight.from} → ${flight.to}</div>
                    <div class="pass-subtitle">${flight.airline}</div>
                </div>
                <div class="pass-row">
                    <div class="chip"><span class="label">Dep</span> ${formatDateTime(flight.departure)}</div>
                    <div class="chip"><span class="label">Arr</span> ${formatDateTime(flight.arrival)}</div>
                </div>
                ${flight.details ? `<div class="pass-footer">${flight.details}</div>` : ''}
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
                ${mapsLink ? `<a class="link-btn" href="${mapsLink}" target="_blank" rel="noopener">Apple Maps</a>` : ''}
                ${gmapsLink ? `<a class="link-btn" href="${gmapsLink}" target="_blank" rel="noopener">Google Maps</a>` : ''}
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
        card.className = 'card boarding itinerary itinerary-card';
        card.setAttribute('data-city', citySlug);
        card.id = `itinerary-${citySlug}`;
        const checks = stored[citySlug] || [];
        card.innerHTML = `
            <div class="pass-header">
                <div class="pass-title">${stop.city}</div>
                <div class="pass-subtitle">Itinerary</div>
            </div>
            <div class="pass-row">
                <div class="chip"><span class="label">Dates</span> ${stop.dates}</div>
            </div>
            <div class="pass-footer">${stop.notes}</div>
            <div class="checklist" role="list">
                ${['Top sights', 'Local food', 'Photos spot'].map((label, i) => {
                    const isChecked = checks.includes(i);
                    return `
                    <div class="check-item${isChecked ? ' checked' : ''}" data-idx="${i}" role="listitem" tabindex="0">
                        <span class="check-indicator">${isChecked ? '✓' : ''}</span>
                        <span class="check-label">${label}</span>
                    </div>`;
                }).join('')}
            </div>
        `;
        // Toggle handling
        card.querySelectorAll('.check-item').forEach(row => {
            row.addEventListener('click', () => {
                const idx = Number(row.getAttribute('data-idx'));
                row.classList.toggle('checked');
                const indicator = row.querySelector('.check-indicator');
                const nowChecked = row.classList.contains('checked');
                indicator.textContent = nowChecked ? '✓' : '';
                const current = (() => { try { return JSON.parse(localStorage.getItem('itineraryChecks') || '{}'); } catch (_) { return {}; } })();
                const cityArr = Array.isArray(current[citySlug]) ? current[citySlug] : [];
                const pos = cityArr.indexOf(idx);
                if (nowChecked && pos === -1) cityArr.push(idx);
                if (!nowChecked && pos !== -1) cityArr.splice(pos, 1);
                current[citySlug] = cityArr;
                try { localStorage.setItem('itineraryChecks', JSON.stringify(current)); } catch (_) {}
            });
        });
        itineraryList.appendChild(card);
    });
}