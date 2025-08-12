// Work & Accommodation Page JavaScript

class WorkAccommodationApp {
    constructor() {
        this.countryData = {};
        this.selectedCountry = null;
        this.init();
    }

    async init() {
        await this.loadCountryData();
        this.setupEventListeners();
        this.populateCountryList();
    }

    async loadCountryData() {
        // Load data from admin panel storage using new 42-field structure
        const adminData = localStorage.getItem('adminCountryData');
        if (adminData) {
            try {
                this.countryData = JSON.parse(adminData);
                console.log('Loaded work & accommodation data for', Object.keys(this.countryData).length, 'countries');
            } catch (error) {
                console.error('Error loading country data:', error);
                this.countryData = {};
            }
        }
    }

    setupEventListeners() {
        // Mobile menu toggle
        document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
            document.getElementById('sideNav').classList.toggle('active');
        });

        // Country search
        document.getElementById('countrySearchInput')?.addEventListener('input', (e) => {
            this.filterCountries(e.target.value);
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }

    populateCountryList() {
        const dropdown = document.getElementById('countryDropdown');
        if (!dropdown) return;

        const countries = Object.values(this.countryData)
            .map(data => data.country)
            .filter(country => country)
            .sort();

        dropdown.innerHTML = countries.map(country => 
            `<div class="country-option" onclick="workApp.selectCountry('${country}')">${country}</div>`
        ).join('');
    }

    filterCountries(search) {
        const dropdown = document.getElementById('countryDropdown');
        if (!dropdown) return;

        const options = dropdown.querySelectorAll('.country-option');
        options.forEach(option => {
            const matches = option.textContent.toLowerCase().includes(search.toLowerCase());
            option.style.display = matches ? 'block' : 'none';
        });

        dropdown.style.display = search ? 'block' : 'none';
    }

    selectCountry(countryName) {
        // Find the country data
        const countryKey = Object.keys(this.countryData).find(key => 
            this.countryData[key].country === countryName
        );

        if (!countryKey) {
            console.error('Country not found:', countryName);
            return;
        }

        this.selectedCountry = this.countryData[countryKey];
        this.displayCountryInfo();
        
        // Hide dropdown
        document.getElementById('countryDropdown').style.display = 'none';
        document.getElementById('countrySearchInput').value = countryName;
        
        // Show content section
        document.querySelector('.content-section').style.display = 'block';
    }

    displayCountryInfo() {
        if (!this.selectedCountry) return;

        // Update header
        document.getElementById('selectedCountryName').textContent = this.selectedCountry.country;
        document.getElementById('selectedCountryFlag').textContent = this.getCountryFlag(this.selectedCountry.country);

        // Display work rights information
        this.displayWorkRights();
        
        // Display accommodation info
        this.displayAccommodation();
        
        // Display cost of living
        this.displayCostOfLiving();
        
        // Display safety info
        this.displaySafety();
        
        // Display embassy info
        this.displayEmbassy();
    }

    displayWorkRights() {
        const container = document.getElementById('workRightsContent');
        if (!container) return;

        const data = this.selectedCountry;
        
        container.innerHTML = `
            <div class="info-card">
                <h3>Work Authorization Status</h3>
                <div class="status-badge ${data.can_work_legally_on_arrival === 'yes' ? 'status-positive' : 'status-negative'}">
                    ${data.can_work_legally_on_arrival === 'yes' ? '✓ Work Allowed on Arrival' : '✗ Work Not Allowed on Arrival'}
                </div>
                
                ${data.conditions_to_work ? `
                    <div class="info-section">
                        <h4>Conditions to Work Legally</h4>
                        <p>${data.conditions_to_work}</p>
                    </div>
                ` : ''}
                
                ${data.short_term_work_info ? `
                    <div class="info-section">
                        <h4>Short-Term Work Opportunities</h4>
                        <p>${data.short_term_work_info}</p>
                    </div>
                ` : ''}
                
                ${data.work_allowed_on_visa ? `
                    <div class="info-section">
                        <h4>Work on Tourist Visa</h4>
                        <div class="status-badge ${data.work_allowed_on_visa === 'yes' ? 'status-positive' : 'status-negative'}">
                            ${data.work_allowed_on_visa === 'yes' ? 'Allowed' : 'Not Allowed'}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    displayAccommodation() {
        const container = document.getElementById('accommodationContent');
        if (!container) return;

        const data = this.selectedCountry;
        
        const accommodationTypes = [
            {
                title: 'Hostels',
                min: data.hostel_price_min_usd,
                max: data.hostel_price_max_usd,
                period: 'per night',
                icon: '🏨'
            },
            {
                title: 'Budget Hotels',
                min: data.budget_hotel_price_min_usd,
                max: data.budget_hotel_price_max_usd,
                period: 'per night',
                icon: '🏩'
            },
            {
                title: 'Furnished Rentals',
                min: data.furnished_rental_price_min_usd,
                max: data.furnished_rental_price_max_usd,
                period: 'per month',
                icon: '🏠'
            }
        ];

        container.innerHTML = `
            <div class="accommodation-grid">
                ${accommodationTypes.map(type => `
                    <div class="accommodation-card">
                        <div class="accommodation-icon">${type.icon}</div>
                        <h4>${type.title}</h4>
                        <div class="price-range">
                            ${type.min || type.max ? 
                                `$${type.min || '?'} - $${type.max || '?'} ${type.period}` : 
                                'Contact for prices'}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            ${data.safer_neighborhoods || data.afghan_neighborhoods ? `
                <div class="neighborhoods-section">
                    ${data.safer_neighborhoods ? `
                        <div class="info-section">
                            <h4>Recommended Neighborhoods</h4>
                            <p>${data.safer_neighborhoods}</p>
                        </div>
                    ` : ''}
                    
                    ${data.afghan_neighborhoods ? `
                        <div class="info-section">
                            <h4>Afghan Communities</h4>
                            <p>${data.afghan_neighborhoods}</p>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        `;
    }

    displayCostOfLiving() {
        const container = document.getElementById('costOfLivingContent');
        if (!container) return;

        const data = this.selectedCountry;
        
        container.innerHTML = `
            <div class="cost-cards">
                <div class="cost-card">
                    <div class="cost-icon">👤</div>
                    <h4>Single Person</h4>
                    <div class="cost-amount">
                        ${data.cost_single_person_usd ? 
                            `$${parseInt(data.cost_single_person_usd).toLocaleString()}/month` : 
                            'Data not available'}
                    </div>
                </div>
                
                <div class="cost-card">
                    <div class="cost-icon">👨‍👩‍👧‍👦</div>
                    <h4>Family of 4</h4>
                    <div class="cost-amount">
                        ${data.cost_family4_usd ? 
                            `$${parseInt(data.cost_family4_usd).toLocaleString()}/month` : 
                            'Data not available'}
                    </div>
                </div>
            </div>
        `;
    }

    displaySafety() {
        const container = document.getElementById('safetyContent');
        if (!container) return;

        const data = this.selectedCountry;
        
        const advisoryLevels = {
            '1': { text: 'Exercise Normal Precautions', class: 'level-1' },
            '2': { text: 'Exercise Increased Caution', class: 'level-2' },
            '3': { text: 'Reconsider Travel', class: 'level-3' },
            '4': { text: 'Do Not Travel', class: 'level-4' }
        };
        
        const advisoryInfo = advisoryLevels[data.travel_advisory_level] || { text: 'No Advisory', class: 'level-0' };
        
        container.innerHTML = `
            ${data.travel_advisory_level ? `
                <div class="advisory-card ${advisoryInfo.class}">
                    <h4>Travel Advisory Level ${data.travel_advisory_level}</h4>
                    <p>${advisoryInfo.text}</p>
                    ${data.travel_advisory_url ? 
                        `<a href="${data.travel_advisory_url}" target="_blank" class="advisory-link">View Full Advisory →</a>` : 
                        ''}
                </div>
            ` : ''}
            
            ${data.hotspot_notes ? `
                <div class="info-section">
                    <h4>⚠️ Areas to Avoid</h4>
                    <p>${data.hotspot_notes}</p>
                </div>
            ` : ''}
        `;
    }

    displayEmbassy() {
        const container = document.getElementById('embassyContent');
        if (!container) return;

        const data = this.selectedCountry;
        
        container.innerHTML = `
            ${data.us_embassy_name ? `
                <div class="embassy-card">
                    <h4>🏛️ ${data.us_embassy_name}</h4>
                    
                    ${data.us_embassy_address ? `
                        <div class="embassy-info">
                            <strong>Address:</strong><br>
                            ${data.us_embassy_address}
                        </div>
                    ` : ''}
                    
                    <div class="embassy-links">
                        ${data.us_embassy_website_url ? 
                            `<a href="${data.us_embassy_website_url}" target="_blank" class="embassy-link">Embassy Website</a>` : 
                            ''}
                        ${data.us_embassy_iv_url ? 
                            `<a href="${data.us_embassy_iv_url}" target="_blank" class="embassy-link">Immigrant Visa Section</a>` : 
                            ''}
                        ${data.us_embassy_iv_email ? 
                            `<a href="mailto:${data.us_embassy_iv_email}" class="embassy-link">Email IV Section</a>` : 
                            ''}
                    </div>
                </div>
            ` : '<p>No U.S. Embassy information available for this location.</p>'}
            
            ${data.medical_exam_facility_name ? `
                <div class="medical-card">
                    <h4>🏥 Medical Exam Facility</h4>
                    <p><strong>${data.medical_exam_facility_name}</strong></p>
                    
                    ${data.medical_exam_facility_address ? `
                        <div class="medical-info">
                            <strong>Address:</strong><br>
                            ${data.medical_exam_facility_address}
                        </div>
                    ` : ''}
                    
                    ${data.medical_exam_facility_phone ? `
                        <div class="medical-info">
                            <strong>Phone:</strong> ${data.medical_exam_facility_phone}
                        </div>
                    ` : ''}
                    
                    ${data.medical_exam_facility_website ? 
                        `<a href="${data.medical_exam_facility_website}" target="_blank" class="medical-link">Visit Website →</a>` : 
                        ''}
                    
                    ${data.medical_exam_notes ? `
                        <div class="medical-notes">
                            <strong>Important Notes:</strong><br>
                            ${data.medical_exam_notes}
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        `;
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        document.getElementById(`${tabName}Tab`)?.classList.add('active');
        
        // Add active class to selected tab
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    }

    getCountryFlag(country) {
        const flagMap = {
            'United States': '🇺🇸', 'Canada': '🇨🇦', 'United Kingdom': '🇬🇧', 'Germany': '🇩🇪',
            'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Australia': '🇦🇺',
            'Pakistan': '🇵🇰', 'India': '🇮🇳', 'Turkey': '🇹🇷', 'UAE': '🇦🇪',
            'Qatar': '🇶🇦', 'Saudi Arabia': '🇸🇦', 'Egypt': '🇪🇬', 'Jordan': '🇯🇴',
            'Rwanda': '🇷🇼', 'Uganda': '🇺🇬', 'Kenya': '🇰🇪', 'Tanzania': '🇹🇿',
            'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Sweden': '🇸🇪', 'Norway': '🇳🇴'
        };
        return flagMap[country] || '🏳️';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.workApp = new WorkAccommodationApp();
});