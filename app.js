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
            checkout: '2025-11-04T12:00:00'
        },
        {
            id: 2,
            hotelName: 'Cala d\'Or',
            type: 'Airbnb',
            address: 'Carrer de sa Vinya, 10, Cala d\'Or, Mallorca',
            checkin: '2025-11-04T15:00:00',
            checkout: '2025-11-08T10:00:00'
        },
        {
            id: 3,
            hotelName: 'London Stay',
            type: 'Not defined',
            address: 'Not defined',
            checkin: '2025-11-08',
            checkout: '2025-11-13'
        },
        {
            id: 4,
            hotelName: 'XO Park West Hotel',
            type: 'Hotel',
            address: 'Amsterdam',
            checkin: '2025-11-13T14:00:00',
            checkout: '2025-11-16T12:00:00'
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
        flightDiv.className = 'card';
        flightDiv.innerHTML = `
            <h3>${flight.airline}: ${flight.from} to ${flight.to}</h3>
            <div class="card-details">
                <div class="card-detail route"><strong>Route:</strong> ${flight.from} → ${flight.to}</div>
                <div class="card-detail"><strong>Departure:</strong> ${formatDateTime(flight.departure)}</div>
                <div class="card-detail"><strong>Arrival:</strong> ${formatDateTime(flight.arrival)}</div>
                ${flight.details ? `<div class="card-detail"><strong>Details:</strong> ${flight.details}</div>` : ''}
            </div>
        `;
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
            flightDiv.className = 'card';
            flightDiv.innerHTML = `
                <h3>${flight.airline}: ${flight.from} to ${flight.to}</h3>
                <div class="card-details">
                    <div class="card-detail route"><strong>Route:</strong> ${flight.from} → ${flight.to}</div>
                    <div class="card-detail"><strong>Departure:</strong> ${formatDateTime(flight.departure)}</div>
                    <div class="card-detail"><strong>Arrival:</strong> ${formatDateTime(flight.arrival)}</div>
                    ${flight.details ? `<div class="card-detail"><strong>Details:</strong> ${flight.details}</div>` : ''}
                </div>
            `;
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
        hotelDiv.className = 'card';
        hotelDiv.innerHTML = `
            <h3>${hotel.hotelName} (${hotel.type})</h3>
            <div class="card-details">
                <div class="card-detail address"><strong>Address:</strong> ${hotel.address}</div>
                <div class="card-detail"><strong>Check-in:</strong> ${hotel.checkin.includes('T') ? formatDateTime(hotel.checkin) : formatDate(hotel.checkin)}</div>
                <div class="card-detail"><strong>Check-out:</strong> ${hotel.checkout.includes('T') ? formatDateTime(hotel.checkout) : formatDate(hotel.checkout)}</div>
            </div>
        `;
        hotelsList.appendChild(hotelDiv);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderFlights();
    renderHotels();
    
    // Add event listeners for tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
});