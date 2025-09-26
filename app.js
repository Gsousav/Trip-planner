// app.js

// Robust data loading with retry mechanism and validation
async function loadTripData(retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Cargando datos del viaje (intento ${attempt}/${retries})...`);
            
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch('tripData.json', {
                signal: controller.signal,
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Validate data structure
            if (!validateTripData(data)) {
                throw new Error('Estructura de datos inválida');
            }
            
            console.log('✅ Datos del viaje cargados exitosamente:', data);
            return data;
            
        } catch (error) {
            console.warn(`❌ Intento ${attempt} falló:`, error.message);
            
            if (attempt === retries) {
                console.error('🚨 Falló la carga de datos después de todos los intentos:', error);
                handleDataLoadError(error);
                return getDefaultTripData();
            }
            
            // Wait before retry
            console.log(`Error cargando datos. Reintentando... (${attempt}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
    }
}

// Validate trip data structure
function validateTripData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.flights)) return false;
    if (!Array.isArray(data.hotels)) return false;
    if (!Array.isArray(data.itinerary)) return false;
    
    // Validate flights have required fields
    for (const flight of data.flights) {
        if (!flight.id || !flight.airline || !flight.from || !flight.to) {
            console.error('Vuelo inválido encontrado:', flight);
            return false;
        }
    }
    
    return true;
}

// Handle data loading errors gracefully
function handleDataLoadError(error) {
    const flightsList = document.getElementById('flightsList');
    const hotelsList = document.getElementById('hotelsList');
    const itineraryList = document.getElementById('itineraryList');
    
    const errorMessage = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Error al cargar los datos</h3>
            <p>No se pudieron cargar los datos del viaje.</p>
            <p class="error-details">${error.message}</p>
            <button onclick="location.reload()" class="retry-btn">🔄 Reintentar</button>
        </div>
    `;
    
    if (flightsList) flightsList.innerHTML = errorMessage;
    if (hotelsList) hotelsList.innerHTML = errorMessage.replace('datos del viaje', 'alojamientos');
    if (itineraryList) itineraryList.innerHTML = errorMessage.replace('datos del viaje', 'itinerario');
    
    console.error('Error crítico: No se pudieron cargar los datos');
}

// Provide default data structure as fallback
function getDefaultTripData() {
    return {
        flights: [],
        hotels: [],
        itinerary: []
    };
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return 'No definido';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('es-PE', {
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
    if (!dateTimeStr) return 'No definido';
    const date = new Date(dateTimeStr);
    
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // More compact format for mobile
        const day = date.toLocaleString('es-PE', { day: 'numeric' });
        const month = date.toLocaleString('es-PE', { month: 'short' }).replace('.', '');
        const time = date.toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${day} ${month} ${time}`; // Remove the colon to save space
    } else {
        // Original format for desktop
        const day = date.toLocaleString('es-PE', { day: '2-digit' });
        const month = date.toLocaleString('es-PE', { month: 'short' }).replace('.', '');
        const time = date.toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${day} ${month}: ${time}`;
    }
}

function formatDate(dateStr) {
    if (!dateStr) return 'No definido';
    const date = new Date(dateStr);
    return date.toLocaleString('es-PE', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatDayShort(dateObj) {
    if (!(dateObj instanceof Date)) return '';
    return dateObj.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' });
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
    const address = (hotel.address || '').toLowerCase();
    if (name.includes('madrid') || address.includes('madrid')) return 'Madrid';
    if (name.includes('cala') || address.includes('mallorca')) return 'Mallorca';
    if (name.includes('london') || address.includes('london') || address.includes('gran londres')) return 'London';
    if (name.includes('amsterdam') || address.includes('amsterdam')) return 'Amsterdam';
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
    const location = (locationStr || '').toUpperCase().trim();
    
    // Direct airport code to country code mapping
    const airportToCountry = {
        'MAD': 'es',     // Madrid, Spain
        'MALL': 'es',    // Mallorca, Spain (assuming this is Palma)
        'PMI': 'es',     // Palma de Mallorca (official code)
        'LON': 'gb',     // London, UK (generic)
        'LHR': 'gb',     // London Heathrow
        'LGW': 'gb',     // London Gatwick
        'STN': 'gb',     // London Stansted
        'LTN': 'gb',     // London Luton
        'LCY': 'gb',     // London City
        'AMS': 'nl',     // Amsterdam, Netherlands
        'HOUSTON': 'us', // Houston, USA (generic)
        'IAH': 'us',     // Houston Intercontinental
        'HOU': 'us',     // Houston Hobby
        'LIM': 'pe',     // Lima, Peru
        'JFK': 'us',     // New York JFK
        'LAX': 'us',     // Los Angeles
        'CDG': 'fr',     // Paris Charles de Gaulle
        'FCO': 'it',     // Rome Fiumicino
        'FRA': 'de',     // Frankfurt
        'BCN': 'es',     // Barcelona
        'DUB': 'ie',     // Dublin
        'ZUR': 'ch',     // Zurich
        'VIE': 'at',     // Vienna
        'ARN': 'se',     // Stockholm
        'CPH': 'dk',     // Copenhagen
        'OSL': 'no',     // Oslo
        'HEL': 'fi',     // Helsinki
        'WAW': 'pl',     // Warsaw
        'PRG': 'cz',     // Prague
        'BUD': 'hu',     // Budapest
        'ATH': 'gr',     // Athens
        'IST': 'tr',     // Istanbul
        'SVO': 'ru',     // Moscow
        'NRT': 'jp',     // Tokyo Narita
        'ICN': 'kr',     // Seoul Incheon
        'PEK': 'cn',     // Beijing
        'HKG': 'hk',     // Hong Kong
        'SIN': 'sg',     // Singapore
        'BKK': 'th',     // Bangkok
        'DXB': 'ae',     // Dubai
        'DOH': 'qa',     // Doha
        'CAI': 'eg',     // Cairo
        'JNB': 'za',     // Johannesburg
        'GRU': 'br',     // São Paulo
        'EZE': 'ar',     // Buenos Aires
        'SCL': 'cl',     // Santiago
        'BOG': 'co',     // Bogotá
        'MEX': 'mx',     // Mexico City
        'YYZ': 'ca',     // Toronto
        'YVR': 'ca',     // Vancouver
        'SYD': 'au',     // Sydney
        'MEL': 'au',     // Melbourne
    };
    
    // Check for exact match first
    if (airportToCountry[location]) {
        return airportToCountry[location];
    }
    
    // Fallback: check if the location string contains any known codes
    for (const [code, country] of Object.entries(airportToCountry)) {
        if (location.includes(code)) {
            return country;
        }
    }
    
    // Additional fallback for city/country name patterns
    const locationLower = location.toLowerCase();
    if (locationLower.includes('madrid') || locationLower.includes('spain') || locationLower.includes('españa')) return 'es';
    if (locationLower.includes('mallorca') || locationLower.includes('palma')) return 'es';
    if (locationLower.includes('london') || locationLower.includes('england') || locationLower.includes('uk')) return 'gb';
    if (locationLower.includes('amsterdam') || locationLower.includes('netherlands') || locationLower.includes('holland')) return 'nl';
    if (locationLower.includes('houston') || locationLower.includes('texas') || locationLower.includes('usa') || locationLower.includes('united states')) return 'us';
    if (locationLower.includes('lima') || locationLower.includes('peru')) return 'pe';
    
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
    const cityLower = city.toLowerCase();
    
    // === MADRID ACTIVITIES ===
    if (cityLower.includes('madrid')) {
        if (desc.includes('casa lucio')) {
            return { url: 'https://casalucio.es', displayText: 'Casa Lucio' };
        }
        if (desc.includes('parque del retiro')) {
            return { url: createGoogleMapsLink('Parque del Retiro, Madrid, Spain'), displayText: 'Parque del Retiro' };
        }
        if (desc.includes('palacio de cristal')) {
            return { url: createGoogleMapsLink('Palacio de Cristal, Parque del Retiro, Madrid'), displayText: 'Palacio de Cristal' };
        }
        if (desc.includes('puerta de alcalá')) {
            return { url: createGoogleMapsLink('Puerta de Alcalá, Madrid, Spain'), displayText: 'Puerta de Alcalá' };
        }
        if (desc.includes('plaza mayor')) {
            return { url: createGoogleMapsLink('Plaza Mayor, Madrid, Spain'), displayText: 'Plaza Mayor' };
        }
        if (desc.includes('mercado de san miguel')) {
            return { url: createGoogleMapsLink('Mercado de San Miguel, Madrid, Spain'), displayText: 'Mercado de San Miguel' };
        }
        if (desc.includes('catedral de la almudena')) {
            return { url: createGoogleMapsLink('Catedral de la Almudena, Madrid, Spain'), displayText: 'Catedral de la Almudena' };
        }
        if (desc.includes('palacio real')) {
            return { url: createGoogleMapsLink('Palacio Real de Madrid, Spain'), displayText: 'Palacio Real' };
        }
        if (desc.includes('puerta del sol')) {
            return { url: createGoogleMapsLink('Puerta del Sol, Madrid, Spain'), displayText: 'Puerta del Sol' };
        }
        if (desc.includes('gran vía')) {
            return { url: createGoogleMapsLink('Gran Vía, Madrid, Spain'), displayText: 'Gran Vía' };
        }
        if (desc.includes('barrio de las letras')) {
            return { url: createGoogleMapsLink('Barrio de las Letras, Madrid, Spain'), displayText: 'Barrio de las Letras' };
        }
        if (desc.includes('chueca')) {
            return { url: createGoogleMapsLink('Chueca, Madrid, Spain'), displayText: 'Chueca' };
        }
    }
    
    // === MALLORCA ACTIVITIES ===
    if (cityLower.includes('mallorca')) {
        if (desc.includes('cala gran')) {
            return { url: createGoogleMapsLink('Cala Gran, Cala d\'Or, Mallorca, Spain'), displayText: 'Cala Gran' };
        }
        if (desc.includes('cala esmeralda')) {
            return { url: createGoogleMapsLink('Cala Esmeralda, Cala d\'Or, Mallorca, Spain'), displayText: 'Cala Esmeralda' };
        }
        if (desc.includes('mondragó')) {
            return { url: createGoogleMapsLink('Parque Natural de Mondragó, Mallorca, Spain'), displayText: 'Parque Natural de Mondragó' };
        }
        if (desc.includes('cuevas del drach')) {
            return { url: createGoogleMapsLink('Cuevas del Drach, Porto Cristo, Mallorca, Spain'), displayText: 'Cuevas del Drach' };
        }
        if (desc.includes('vall d\'or golf')) {
            return { url: createGoogleMapsLink('Vall d\'Or Golf, Mallorca, Spain'), displayText: 'Vall d\'Or Golf' };
        }
        if (desc.includes('es fortí')) {
            return { url: createGoogleMapsLink('Es Fortí, Cala d\'Or, Mallorca, Spain'), displayText: 'Es Fortí' };
        }
        if (desc.includes('cala d\'or')) {
            return { url: createGoogleMapsLink('Cala d\'Or, Mallorca, Spain'), displayText: 'Cala d\'Or' };
        }
    }
    
    // === LONDON ACTIVITIES ===
    if (cityLower.includes('london')) {
        if (desc.includes('harry potter') && desc.includes('studio')) {
            return { url: 'https://www.wbstudiotour.co.uk', displayText: 'Warner Bros. Studio Tour London' };
        }
        if (desc.includes('british museum')) {
            return { url: 'https://www.britishmuseum.org', displayText: 'British Museum' };
        }
        if (desc.includes('borough market')) {
            return { url: createGoogleMapsLink('Borough Market, London, UK'), displayText: 'Borough Market' };
        }
        if (desc.includes('buckingham')) {
            return { url: createGoogleMapsLink('Buckingham Palace, London, UK'), displayText: 'Buckingham Palace' };
        }
        if (desc.includes('torre de londres')) {
            return { url: createGoogleMapsLink('Tower of London, UK'), displayText: 'Tower of London' };
        }
        if (desc.includes('puente de la torre')) {
            return { url: createGoogleMapsLink('Tower Bridge, London, UK'), displayText: 'Tower Bridge' };
        }
        if (desc.includes('london eye')) {
            return { url: createGoogleMapsLink('London Eye, London, UK'), displayText: 'London Eye' };
        }
        if (desc.includes('hyde park')) {
            return { url: createGoogleMapsLink('Hyde Park, London, UK'), displayText: 'Hyde Park' };
        }
        if (desc.includes('oxford street')) {
            return { url: createGoogleMapsLink('Oxford Street, London, UK'), displayText: 'Oxford Street' };
        }
        if (desc.includes('regent street')) {
            return { url: createGoogleMapsLink('Regent Street, London, UK'), displayText: 'Regent Street' };
        }
        if (desc.includes('camden')) {
            return { url: createGoogleMapsLink('Camden Market, London, UK'), displayText: 'Camden Market' };
        }
        if (desc.includes('piccadilly circus')) {
            return { url: createGoogleMapsLink('Piccadilly Circus, London, UK'), displayText: 'Piccadilly Circus' };
        }
        if (desc.includes('soho')) {
            return { url: createGoogleMapsLink('Soho, London, UK'), displayText: 'Soho' };
        }
        if (desc.includes('west end')) {
            return { url: createGoogleMapsLink('West End, London, UK'), displayText: 'West End' };
        }
        if (desc.includes('covent garden')) {
            return { url: createGoogleMapsLink('Covent Garden, London, UK'), displayText: 'Covent Garden' };
        }
        if (desc.includes('támesis')) {
            return { url: createGoogleMapsLink('River Thames, London, UK'), displayText: 'River Thames' };
        }
    }
    
    // === AMSTERDAM ACTIVITIES ===
    if (cityLower.includes('amsterdam')) {
        if (desc.includes('ceremonia de graduación') || desc.includes('graduación')) {
            return { url: createGoogleMapsLink('De La Mar Theater, Marnixstraat 402, Amsterdam, Netherlands'), displayText: 'De La Mar Theater' };
        }
        if (desc.includes('rijksmuseum')) {
            return { url: 'https://www.rijksmuseum.nl', displayText: 'Rijksmuseum' };
        }
        if (desc.includes('van gogh')) {
            return { url: 'https://www.vangoghmuseum.nl', displayText: 'Van Gogh Museum' };
        }
        if (desc.includes('museumplein')) {
            return { url: createGoogleMapsLink('Museumplein, Amsterdam, Netherlands'), displayText: 'Museumplein' };
        }
        if (desc.includes('ana frank')) {
            return { url: 'https://www.annefrank.org', displayText: 'Anne Frank House' };
        }
        if (desc.includes('vondelpark')) {
            return { url: createGoogleMapsLink('Vondelpark, Amsterdam, Netherlands'), displayText: 'Vondelpark' };
        }
        if (desc.includes('barrio rojo')) {
            return { url: createGoogleMapsLink('Red Light District, Amsterdam, Netherlands'), displayText: 'Red Light District' };
        }
        if (desc.includes('canales') || desc.includes('canal')) {
            return { url: createGoogleMapsLink('Amsterdam Canal Cruise departure points'), displayText: 'Amsterdam Canal Cruise' };
        }
        if (desc.includes('ceppi')) {
            return { url: createGoogleMapsLink('Ceppi\'s Amsterdam, Lijnbaansgracht 256, Amsterdam'), displayText: 'Ceppi\'s Amsterdam' };
        }
    }
    
    // === TRANSPORTATION & NON-LINKABLE ===
    if (desc.includes('vuelo') || desc.includes('check-in') || desc.includes('checkout') || 
        desc.includes('llegada') || desc.includes('tiempo en') || desc.includes('traslado') ||
        desc.includes('flight') || desc.includes('departure') || desc.includes('arrival')) {
        return { url: '', displayText: description };
    }
    
    // === FALLBACK ===
    // If no specific match, create a targeted Google search
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
                <div class="arrive">
                    ${toFlag ? `<img class="tiny-flag" src="${toFlag}" alt="${toCc.toUpperCase()} flag" referrerpolicy="no-referrer" crossorigin="anonymous" />` : ''}
                    <span class="city">${flight.to}</span>
                    <span class="time">${formatDateTimeShort(flight.arrival)}</span>
                </div>
            </div>
            <div class="pass-subtitle">
                <div class="airline-button" role="img" aria-label="${flight.airline}">
                    <span class="airline-initials">${getAirlineInitials(flight.airline)}</span>
                    <span class="airline-name">${flight.airline}</span>
                </div>
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
            ${mapsLink ? `<a class="icon-btn apple-maps" href="${mapsLink}" target="_blank" rel="noopener" aria-label="Open in Apple Maps"><img src="appleMaps.png" alt="" class="icon-img"><span>Apple Maps</span></a>` : ''}
            ${gmapsLink ? `<a class="icon-btn google-maps" href="${gmapsLink}" target="_blank" rel="noopener" aria-label="Open in Google Maps"><img src="googleMaps.png" alt="" class="icon-img"><span>Google Maps</span></a>` : ''}
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
                    <div class="activity-content">
                        <a href="${url}" target="_blank" rel="noopener" class="activity-link" aria-label="${activity.description}">
                            ${displayText}
                        </a>
                        ${displayText !== activity.description ? `<div class="activity-context">${activity.description}</div>` : ''}
                    </div>
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

async function renderFlights(tripData) {
    const flightsList = document.getElementById('flightsList');
    
    try {
        if (!flightsList) {
            throw new Error('Elemento flightsList no encontrado');
        }
        
        // Show loading state
        flightsList.innerHTML = '<div class="loading-state">🛫 Cargando vuelos...</div>';
        
        // Use promise instead of setTimeout for better async handling
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return new Promise((resolve, reject) => {
            try {
                flightsList.innerHTML = '';
                
                if (!tripData || !tripData.flights || tripData.flights.length === 0) {
                    flightsList.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">✈️</div>
                            <h3>No hay vuelos disponibles</h3>
                            <p>Los datos de vuelos se cargarán automáticamente.</p>
                        </div>
                    `;
                    return;
                }
                
                const mainFlights = tripData.flights.filter(flight => flight && flight.group === 'main');
                console.log(`Renderizando ${mainFlights.length} vuelos principales`);
                
                mainFlights.forEach((flight, index) => {
                    try {
                        const flightDiv = createFlightCard(flight, true);
                        const city = getCityFromFlight(flight);
                        
                        // Add secure click handler with error handling
                        flightDiv.addEventListener('click', (e) => {
                            try {
                                e.preventDefault();
                                console.log(`Vuelo clickeado: ${flight.from} → ${flight.to}, ciudad: ${city}`);
                                showAccommodationForCity(city, tripData);
                            } catch (clickError) {
                                console.error('Error al hacer click en vuelo:', clickError);
                            }
                        });
                        
                        flightsList.appendChild(flightDiv);
                        console.log(`✅ Vuelo ${index + 1} renderizado: ${flight.from} → ${flight.to}`);
                        
                    } catch (flightError) {
                        console.error('Error renderizando vuelo individual:', flightError, flight);
                        // Continue with other flights
                    }
                });
                
                // Render partial flights if any
                const partialFlights = tripData.flights.filter(flight => flight && flight.group === 'partial');
                if (partialFlights.length > 0) {
                    try {
                        const partialGroupDiv = document.createElement('div');
                        partialGroupDiv.className = 'partial-group';
                        partialGroupDiv.innerHTML = '<div class="partial-group-label">Itinerario del Grupo Parcial</div>';
                        
                        partialFlights.forEach(flight => {
                            try {
                                const flightDiv = createFlightCard(flight, false);
                                partialGroupDiv.appendChild(flightDiv);
                            } catch (partialError) {
                                console.error('Error renderizando vuelo parcial:', partialError);
                            }
                        });
                        
                        flightsList.appendChild(partialGroupDiv);
                        console.log(`✅ ${partialFlights.length} vuelos parciales renderizados`);
                        
                    } catch (partialGroupError) {
                        console.error('Error renderizando grupo parcial:', partialGroupError);
                    }
                }
                
                // Success feedback
                if (mainFlights.length > 0) {
                    console.log(`🎉 Renderizado completo: ${mainFlights.length} vuelos principales, ${partialFlights.length} vuelos parciales`);
                }
                
                resolve(); // Resolve the promise when rendering is complete
                
            } catch (renderError) {
                console.error('Error crítico en renderizado:', renderError);
                flightsList.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Error al mostrar vuelos</h3>
                        <p>Hubo un problema renderizando los vuelos.</p>
                        <button onclick="location.reload()" class="retry-btn">🔄 Reintentar</button>
                    </div>
                `;
                console.error('Error renderizando vuelos');
                reject(renderError);
            }
        });
        
    } catch (criticalError) {
        console.error('Error crítico en renderFlights:', criticalError);
        if (flightsList) {
            flightsList.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">🚨</div>
                    <h3>Error crítico</h3>
                    <p>No se pudo inicializar la vista de vuelos.</p>
                    <button onclick="location.reload()" class="retry-btn">🔄 Reintentar</button>
                </div>
            `;
        }
        console.error('Error crítico en la aplicación');
        throw criticalError; // Re-throw to let caller handle
    }
}

function showSection(sectionId, direction = 'right', tripData = null) {
    const currentSection = document.querySelector('.section.active');
    const targetSection = document.getElementById(sectionId);
    
    // If already in the target section, just re-render the content
    if (currentSection && currentSection.id === sectionId) {
        if (tripData) {
            if (sectionId === 'flights') {
                renderFlights(tripData);
            } else if (sectionId === 'accommodation') {
                showAllAccommodations(tripData);
            } else if (sectionId === 'itinerary') {
                showAllItineraries(tripData);
            }
        }
        return;
    }
    
    // Add loading state
    targetSection.classList.add('loading');
    
    // Smooth transition
    if (currentSection) {
        currentSection.classList.add(direction === 'right' ? 'slide-in-left' : 'slide-in-right');
        setTimeout(() => {
            currentSection.classList.remove('active', 'slide-in-left', 'slide-in-right');
        }, 200);
    }
    
    setTimeout(() => {
        targetSection.classList.add('active', direction === 'right' ? 'slide-in-right' : 'slide-in-left');
        setTimeout(() => {
            targetSection.classList.remove('slide-in-right', 'slide-in-left', 'loading');
        }, 400);
    }, 100);
    
    // Update navigation button states
    updateNavigationButtons(sectionId);
    
    updateHash({ section: sectionId });
    updateBreadcrumb(sectionId);
    
    // Show all destinations when clicking navigation buttons
    if (tripData) {
        if (sectionId === 'accommodation') {
            showAllAccommodations(tripData);
        } else if (sectionId === 'itinerary') {
            showAllItineraries(tripData);
        }
    }
}

function addBackButton(sectionId, onClick, label = 'Volver a Vuelos') {
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
        hotelsList.innerHTML = '<div class="empty-state"><h3>No se encontró alojamiento para esta ciudad</h3></div>';
    }
    addBackButton('accommodation', () => showSection('flights', 'left'), 'Volver a Vuelos');
    updateHash({ section: 'accommodation', city: slugifyCity(city) });
    addHeaderContext('accommodation', city);
}

function showAllAccommodations(tripData) {
    showSection('accommodation');
    const hotelsList = document.getElementById('hotelsList');
    hotelsList.innerHTML = '';
    
    // Get all hotels and group by city
    const hotelsByCity = {};
    tripData.hotels.forEach(hotel => {
        const city = getCityForHotel(hotel);
        if (!hotelsByCity[city]) {
            hotelsByCity[city] = [];
        }
        hotelsByCity[city].push(hotel);
    });
    
    // Create cards for all cities
    Object.keys(hotelsByCity).forEach(city => {
        const cityHeader = document.createElement('div');
        cityHeader.className = 'city-header';
        cityHeader.innerHTML = `<h3>${city}</h3>`;
        hotelsList.appendChild(cityHeader);
        
        hotelsByCity[city].forEach(hotel => {
            const hotelDiv = createHotelCard(hotel);
            hotelDiv.addEventListener('click', () => {
                showItineraryForCity(city, tripData);
            });
            hotelsList.appendChild(hotelDiv);
        });
    });
    
    addBackButton('accommodation', () => showSection('flights', 'left'), 'Volver a Vuelos');
    updateHash({ section: 'accommodation' });
    addHeaderContext('accommodation');
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
        itineraryList.innerHTML = '<div class="empty-state"><h3>No se encontró itinerario para esta ciudad</h3></div>';
    }
    addBackButton('itinerary', () => showAccommodationForCity(city, tripData), 'Volver al Alojamiento');
    updateHash({ section: 'itinerary', city: slugifyCity(city) });
    addHeaderContext('itinerary', city);
}

function showAllItineraries(tripData) {
    showSection('itinerary');
    const itineraryList = document.getElementById('itineraryList');
    itineraryList.innerHTML = '';
    
    // Create cards for all cities
    tripData.itinerary.forEach((stop, index) => {
        const card = createItineraryCard(stop, tripData);
        if (index === 0) {
            card.classList.add('highlight');
            setTimeout(() => card.classList.remove('highlight'), 1600);
        }
        itineraryList.appendChild(card);
    });
    
    addBackButton('itinerary', () => showSection('flights', 'left'), 'Volver a Vuelos');
    updateHash({ section: 'itinerary' });
    addHeaderContext('itinerary');
}

function populateQuickJump(tripData) {
    const select = document.getElementById('quick-jump');
    select.innerHTML = '<option value="">Ir al Itinerario</option>';
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

// Enhanced UX Functions

function updateBreadcrumb(sectionId, city = '') {
    let breadcrumb = document.querySelector('.breadcrumb');
    if (!breadcrumb) {
        breadcrumb = document.createElement('nav');
        breadcrumb.className = 'breadcrumb';
        document.querySelector('.container').insertBefore(breadcrumb, document.querySelector('main'));
    }
    
    const breadcrumbItems = [
        { id: 'flights', label: 'Vuelos', active: sectionId === 'flights' },
        { id: 'accommodation', label: 'Alojamiento', active: sectionId === 'accommodation' },
        { id: 'itinerary', label: 'Itinerario', active: sectionId === 'itinerary' }
    ];
    
    breadcrumb.innerHTML = breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        const itemHtml = `<a href="#" class="breadcrumb-item ${item.active ? 'active' : ''}" data-section="${item.id}">${item.label}${city && item.active ? ` - ${city}` : ''}</a>`;
        return itemHtml + (isLast ? '' : '<span class="breadcrumb-separator">›</span>');
    }).join('');
    
    // Add click handlers
    breadcrumb.querySelectorAll('.breadcrumb-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = item.dataset.section;
            if (targetSection !== sectionId) {
                showSection(targetSection, targetSection === 'flights' ? 'left' : 'right');
            }
        });
    });
}

function showToast(message, type = 'info') {
    // Remove any existing toasts to prevent overlap
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 100);
    });
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 150);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function getSectionDisplayName(sectionId) {
    const names = {
        flights: 'Vuelos',
        accommodation: 'Alojamiento', 
        itinerary: 'Itinerario'
    };
    return names[sectionId] || sectionId;
}

function createFloatingActionButton() {
    const fabContainer = document.createElement('div');
    fabContainer.className = 'fab-container';
    
    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.innerHTML = '⚡';
    fab.setAttribute('aria-label', 'Quick Actions');
    
    const quickActions = document.createElement('div');
    quickActions.className = 'quick-actions';
    quickActions.innerHTML = `
        <a href="#" class="quick-action" data-section="flights">
            <span>✈️</span> Vuelos
        </a>
        <a href="#" class="quick-action" data-section="accommodation">
            <span>🏨</span> Alojamiento
        </a>
        <a href="#" class="quick-action" data-section="itinerary">
            <span>📅</span> Itinerario
        </a>
    `;
    
    let isOpen = false;
    fab.addEventListener('click', () => {
        isOpen = !isOpen;
        quickActions.classList.toggle('show', isOpen);
        fab.style.transform = isOpen ? 'rotate(45deg)' : 'rotate(0deg)';
    });
    
    // Add click handlers for quick actions
    quickActions.querySelectorAll('.quick-action').forEach(action => {
        action.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = action.dataset.section;
            // Get tripData from global scope or pass it as parameter
            const tripData = window.currentTripData;
            if (tripData) {
                showSection(targetSection, 'right', tripData);
            } else {
                showSection(targetSection);
            }
            isOpen = false;
            quickActions.classList.remove('show');
            fab.style.transform = 'rotate(0deg)';
        });
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!fabContainer.contains(e.target) && isOpen) {
            isOpen = false;
            quickActions.classList.remove('show');
            fab.style.transform = 'rotate(0deg)';
        }
    });
    
    fabContainer.appendChild(fab);
    fabContainer.appendChild(quickActions);
    document.body.appendChild(fabContainer);
}

function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    showSection('flights');
                    break;
                case '2':
                    e.preventDefault();
                    showSection('accommodation');
                    break;
                case '3':
                    e.preventDefault();
                    showSection('itinerary');
                    break;
            }
        }
        
        // Arrow key navigation
        if (!e.ctrlKey && !e.metaKey && !e.target.matches('input, select, textarea')) {
            const currentSection = document.querySelector('.section.active').id;
            const sections = ['flights', 'accommodation', 'itinerary'];
            const currentIndex = sections.indexOf(currentSection);
            
            if (e.key === 'ArrowRight' && currentIndex < sections.length - 1) {
                e.preventDefault();
                showSection(sections[currentIndex + 1], 'right');
            } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                e.preventDefault();
                showSection(sections[currentIndex - 1], 'left');
            }
        }
    });
}

function updateNavigationButtons(activeSectionId) {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        const sectionId = btn.getAttribute('data-section');
        if (sectionId === activeSectionId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function addHeaderContext(sectionId, city = '') {
    const section = document.getElementById(sectionId);
    let headerContext = section.querySelector('.header-context');
    
    if (headerContext) {
        headerContext.remove();
    }
    
    headerContext = document.createElement('div');
    headerContext.className = 'header-context';
    
    const contextData = {
        flights: { icon: '✈️', title: 'Tus Vuelos', desc: 'Selecciona un vuelo para ver el alojamiento' },
        accommodation: { icon: '🏨', title: `Alojamiento${city ? ` en ${city}` : ''}`, desc: 'Haz clic para ver el itinerario detallado' },
        itinerary: { icon: '📅', title: `Itinerario${city ? ` para ${city}` : ''}`, desc: 'Tus actividades detalladas día por día' }
    };
    
    const context = contextData[sectionId];
    if (context) {
        headerContext.innerHTML = `
            <div class="context-icon">${context.icon}</div>
            <div class="context-info">
                <h3>${context.title}</h3>
                <p>${context.desc}</p>
            </div>
        `;
        
        const firstChild = section.firstElementChild;
        section.insertBefore(headerContext, firstChild);
    }
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

    // Initialize enhanced UX features first
    createFloatingActionButton();
    addKeyboardShortcuts();
    updateBreadcrumb('flights');
    addHeaderContext('flights');

    // Load data and render flights
    const tripData = await loadTripData();
    
    // Store tripData globally for FAB access
    window.currentTripData = tripData;
    
    // Add navigation button event listeners
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = btn.getAttribute('data-section');
            showSection(sectionId, 'right', tripData);
        });
    });
    
    // Ensure flights section is properly active and render flights
    const flightsSection = document.getElementById('flights');
    if (flightsSection) {
        // Make sure flights section is visible
        flightsSection.classList.add('active');
        // Remove active class from other sections
        document.querySelectorAll('.section').forEach(section => {
            if (section.id !== 'flights') {
                section.classList.remove('active');
            }
        });
    }
    
    // Render flights after ensuring section is active
    await renderFlights(tripData);

    // Handle URL hash navigation
    const params = new URLSearchParams(location.hash.slice(1));
    const hashSection = params.get('section');
    const hashCity = params.get('city');
    
    if (hashSection && hashSection !== 'flights') {
        if (hashSection === 'accommodation' && hashCity) {
            const city = hashCity.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            showAccommodationForCity(city, tripData);
        } else if (hashSection === 'itinerary' && hashCity) {
            const city = hashCity.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            showItineraryForCity(city, tripData);
        } else {
            showSection(hashSection);
        }
    }
    // If no hash or flights hash, flights section is already active and rendered
});
