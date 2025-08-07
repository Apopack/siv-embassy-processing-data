// Admin Portal JavaScript - Country Information Management System

class AdminPortal {
    constructor() {
        this.currentCountry = null;
        this.unsavedChanges = false;
        this.countryData = {};
        this.changeHistory = [];
        
        this.init();
    }

    async init() {
        await this.loadCountryData();
        this.setupEventListeners();
        this.initializeFormValidation();
    }

    async loadCountryData() {
        // Load existing visa data
        const visaData = [
            {
                country: "Pakistan",
                flag: "🇵🇰",
                embassy: "Islamabad",
                visaRequired: "yes",
                visaType: "Visitor Visa (Tourist/Family Visit)",
                visaCost: "US$50–100",
                validity: "3 months (90 days)",
                processingTime: "3-5 business days",
                applicationMethod: "online",
                officialLink: "https://visa.nadra.gov.pk",
                processingSteps: [
                    "Visit the Pakistan Online Visa portal at https://visa.nadra.gov.pk",
                    "Create account and complete online application form",
                    "Upload required documents: passport copy, photo, invitation letter (if applicable)",
                    "Pay visa fee online (US$50-100)",
                    "Wait for processing (typically 3-5 business days)",
                    "Download and print approved e-visa"
                ],
                extensionPossible: "yes",
                extensionDuration: "Up to additional 90 days",
                extensionCost: "Varies (portal fee; approx US$20)",
                sourceName: "Pakistan Online Visa",
                sourceType: "government",
                lastUpdated: "2025-01-15",
                // Travel information
                directFlights: "yes",
                airlines: "PIA, Turkish Airlines, Emirates",
                flightDuration: "8-12 hours",
                mainAirport: "Islamabad International Airport",
                airportCode: "ISB",
                cityDistance: "25km",
                safetyLevel: "caution",
                travelNotes: "Check current security advisories. Visa required for all Afghan nationals."
            },
            {
                country: "Qatar",
                flag: "🇶🇦",
                embassy: "Doha",
                visaRequired: "yes",
                visaType: "Hayya Entry Permit",
                visaCost: "US$27",
                validity: "30 days",
                processingTime: "Same day",
                applicationMethod: "online",
                officialLink: "https://hayya.qa",
                processingSteps: [
                    "Visit the official Hayya Portal at https://hayya.qa",
                    "Create account and fill application form",
                    "Upload required documents: passport copy, photo, proof of accommodation",
                    "Pay entry permit fee online (US$27)",
                    "Receive approval notification (usually same day)",
                    "Download and print Hayya Entry Permit"
                ],
                extensionPossible: "no",
                extensionDuration: "",
                extensionCost: "",
                sourceName: "Hayya Portal",
                sourceType: "government",
                lastUpdated: "2025-01-15",
                // Travel information
                directFlights: "yes",
                airlines: "Qatar Airways",
                flightDuration: "6-8 hours",
                mainAirport: "Hamad International Airport",
                airportCode: "DOH",
                cityDistance: "15km",
                safetyLevel: "safe",
                travelNotes: "Modern facilities. Entry permit required."
            }
            // Add more countries as needed
        ];

        // Convert to map for easy access
        visaData.forEach(country => {
            this.countryData[country.country] = country;
        });

        // Load SIV countries for search
        try {
            const response = await fetch('data/embassy-siv-data.json');
            const data = await response.json();
            data.embassies.forEach(embassy => {
                if (!this.countryData[embassy.country]) {
                    this.countryData[embassy.country] = {
                        country: embassy.country,
                        flag: this.getCountryFlag(embassy.country),
                        embassy: embassy.embassy,
                        visaRequired: "unknown",
                        visaType: "",
                        visaCost: "",
                        validity: "",
                        processingTime: "",
                        applicationMethod: "embassy",
                        officialLink: "",
                        processingSteps: [],
                        extensionPossible: "unknown",
                        extensionDuration: "",
                        extensionCost: "",
                        sourceName: "",
                        sourceType: "embassy",
                        lastUpdated: new Date().toISOString().split('T')[0],
                        // Travel information
                        directFlights: "unknown",
                        airlines: "",
                        flightDuration: "",
                        mainAirport: "",
                        airportCode: "",
                        cityDistance: "",
                        safetyLevel: "unknown",
                        travelNotes: ""
                    };
                }
            });
        } catch (error) {
            console.error('Error loading SIV data:', error);
        }

        // Load change history from localStorage
        const savedHistory = localStorage.getItem('adminChangeHistory');
        if (savedHistory) {
            this.changeHistory = JSON.parse(savedHistory);
        }
    }

    getCountryFlag(country) {
        const flagMap = {
            'Pakistan': '🇵🇰', 'Qatar': '🇶🇦', 'Albania': '🇦🇱', 'Turkey': '🇹🇷',
            'Germany': '🇩🇪', 'Canada': '🇨🇦', 'Philippines': '🇵🇭', 'UAE': '🇦🇪',
            'Iraq': '🇮🇶', 'Rwanda': '🇷🇼', 'United Arab Emirates': '🇦🇪',
            'United States': '🇺🇸', 'India': '🇮🇳', 'Iran': '🇮🇷', 'Afghanistan': '🇦🇫',
            'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Belgium': '🇧🇪', 'Brazil': '🇧🇷',
            'China': '🇨🇳', 'Denmark': '🇩🇰', 'Egypt': '🇪🇬', 'France': '🇫🇷'
        };
        return flagMap[country] || '🏳️';
    }

    setupEventListeners() {
        // Mobile menu toggle
        document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
            document.getElementById('sideNav').classList.toggle('active');
        });

        // Country search
        const searchInput = document.getElementById('countrySearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('focus', () => this.showAllCountries());
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Extension toggle
        document.getElementById('extensionPossible')?.addEventListener('change', (e) => {
            const show = e.target.value === 'yes';
            document.getElementById('extensionDetails').style.display = show ? 'block' : 'none';
            document.getElementById('extensionCostGroup').style.display = show ? 'block' : 'none';
        });

        // Form changes
        document.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('input', () => this.markAsChanged());
        });

        // Action buttons
        document.getElementById('saveBtn')?.addEventListener('click', () => this.saveChanges());
        document.getElementById('saveAllBtn')?.addEventListener('click', () => this.saveAllChanges());
        document.getElementById('discardBtn')?.addEventListener('click', () => this.discardChanges());
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('addStepBtn')?.addEventListener('click', () => this.addProcessingStep());

        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSearchResults();
            }
        });

        // Prevent navigation with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.unsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    handleSearch(query) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (!query.trim()) {
            this.hideSearchResults();
            return;
        }

        const filtered = Object.values(this.countryData).filter(country =>
            country.country.toLowerCase().includes(query.toLowerCase())
        );

        if (filtered.length === 0) {
            searchResults.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--admin-gray-500);">No countries found</div>';
        } else {
            searchResults.innerHTML = filtered.map(country => `
                <div class="search-result-item" onclick="adminPortal.selectCountry('${country.country}')">
                    <span class="search-result-flag">${country.flag}</span>
                    <div class="search-result-info">
                        <h4>${country.country}</h4>
                        <p>${country.embassy} Embassy</p>
                    </div>
                </div>
            `).join('');
        }

        searchResults.style.display = 'block';
    }

    showAllCountries() {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        const countries = Object.values(this.countryData).sort((a, b) => 
            a.country.localeCompare(b.country)
        );

        searchResults.innerHTML = countries.map(country => `
            <div class="search-result-item" onclick="adminPortal.selectCountry('${country.country}')">
                <span class="search-result-flag">${country.flag}</span>
                <div class="search-result-info">
                    <h4>${country.country}</h4>
                    <p>${country.embassy} Embassy</p>
                </div>
            </div>
        `).join('');

        searchResults.style.display = 'block';
    }

    hideSearchResults() {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
        }
    }

    selectCountry(countryName) {
        if (this.unsavedChanges) {
            if (!confirm('You have unsaved changes. Do you want to discard them?')) {
                return;
            }
        }

        this.currentCountry = countryName;
        const data = this.countryData[countryName];

        // Update header
        document.getElementById('countryFlag').textContent = data.flag;
        document.getElementById('countryName').textContent = data.country;
        document.getElementById('embassyInfo').textContent = `${data.embassy} Embassy`;

        // Load visa information
        this.loadVisaData(data);
        this.loadTravelData(data);
        this.loadChangeHistory(countryName);

        // Show editor and switch to visa tab
        document.getElementById('editorSection').style.display = 'block';
        this.switchTab('visa');

        // Clear search
        document.getElementById('countrySearch').value = '';
        this.hideSearchResults();

        this.unsavedChanges = false;
    }

    loadVisaData(data) {
        // Basic Requirements
        document.getElementById('visaRequired').value = data.visaRequired || 'unknown';
        document.getElementById('visaType').value = data.visaType || '';
        document.getElementById('visaCost').value = data.visaCost || '';
        document.getElementById('validity').value = data.validity || '';

        // Processing Information
        document.getElementById('processingTime').value = data.processingTime || '';
        document.getElementById('applicationMethod').value = data.applicationMethod || 'embassy';
        document.getElementById('officialLink').value = data.officialLink || '';

        // Processing Steps
        this.loadProcessingSteps(data.processingSteps || []);

        // Extension Policy
        document.getElementById('extensionPossible').value = data.extensionPossible || 'unknown';
        const showExtension = data.extensionPossible === 'yes';
        document.getElementById('extensionDetails').style.display = showExtension ? 'block' : 'none';
        document.getElementById('extensionCostGroup').style.display = showExtension ? 'block' : 'none';
        document.getElementById('extensionDuration').value = data.extensionDuration || '';
        document.getElementById('extensionCost').value = data.extensionCost || '';

        // Source Information
        document.getElementById('sourceName').value = data.sourceName || '';
        document.getElementById('sourceType').value = data.sourceType || 'embassy';
        document.getElementById('lastUpdated').value = data.lastUpdated || new Date().toISOString().split('T')[0];
    }

    loadTravelData(data) {
        // Flight Information
        document.getElementById('directFlights').value = data.directFlights || 'unknown';
        document.getElementById('airlines').value = data.airlines || '';
        document.getElementById('flightDuration').value = data.flightDuration || '';

        // Airport & Transportation
        document.getElementById('mainAirport').value = data.mainAirport || '';
        document.getElementById('airportCode').value = data.airportCode || '';
        document.getElementById('cityDistance').value = data.cityDistance || '';

        // Travel Advisories
        document.getElementById('safetyLevel').value = data.safetyLevel || 'unknown';
        document.getElementById('travelNotes').value = data.travelNotes || '';
    }

    loadProcessingSteps(steps) {
        const container = document.getElementById('processingStepsList');
        container.innerHTML = '';

        steps.forEach((step, index) => {
            this.addProcessingStep(step);
        });

        if (steps.length === 0) {
            this.addProcessingStep('');
        }
    }

    addProcessingStep(value = '') {
        const container = document.getElementById('processingStepsList');
        const index = container.children.length + 1;

        const stepDiv = document.createElement('div');
        stepDiv.className = 'list-item';
        stepDiv.innerHTML = `
            <span class="list-item-number">${index}.</span>
            <input type="text" class="list-item-input" value="${value}" placeholder="Enter processing step...">
            <button class="list-item-remove" onclick="adminPortal.removeProcessingStep(this)">×</button>
        `;

        container.appendChild(stepDiv);

        // Add change listener
        stepDiv.querySelector('.list-item-input').addEventListener('input', () => this.markAsChanged());
    }

    removeProcessingStep(button) {
        button.parentElement.remove();
        this.renumberSteps();
        this.markAsChanged();
    }

    renumberSteps() {
        const steps = document.querySelectorAll('#processingStepsList .list-item-number');
        steps.forEach((step, index) => {
            step.textContent = `${index + 1}.`;
        });
    }

    loadChangeHistory(countryName) {
        const historyList = document.getElementById('historyList');
        const countryHistory = this.changeHistory.filter(h => h.country === countryName);

        if (countryHistory.length === 0) {
            historyList.innerHTML = `
                <div style="padding: 32px; text-align: center; color: var(--admin-gray-500);">
                    No changes recorded for this country yet
                </div>
            `;
            return;
        }

        historyList.innerHTML = countryHistory.slice(-10).reverse().map(change => `
            <div class="history-item">
                <span class="history-icon">${this.getChangeIcon(change.type)}</span>
                <div class="history-content">
                    <div class="history-action">${change.action}</div>
                    <div class="history-details">${change.details}</div>
                    <div class="history-meta">
                        ${change.user} • ${this.formatDate(change.timestamp)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getChangeIcon(type) {
        const icons = {
            'create': '➕',
            'update': '✏️',
            'delete': '🗑️',
            'visa': '📋',
            'travel': '✈️'
        };
        return icons[type] || '📝';
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
    }

    markAsChanged() {
        this.unsavedChanges = true;
        document.getElementById('saveBtn').textContent = 'Save Changes*';
    }

    async saveChanges() {
        if (!this.currentCountry) return;

        const data = this.collectFormData();
        
        // Validate required fields
        if (!this.validateData(data)) {
            return;
        }

        // Update country data
        this.countryData[this.currentCountry] = {
            ...this.countryData[this.currentCountry],
            ...data
        };

        // Record change in history
        this.recordChange('update', 'Updated country information', this.getChangeSummary(data));

        // Save to localStorage (in production, this would be an API call)
        localStorage.setItem('adminCountryData', JSON.stringify(this.countryData));
        localStorage.setItem('adminChangeHistory', JSON.stringify(this.changeHistory));

        // Reset unsaved changes
        this.unsavedChanges = false;
        document.getElementById('saveBtn').textContent = 'Save Changes';

        // Show success notification
        this.showNotification('Changes saved successfully!');
    }

    collectFormData() {
        // Collect processing steps
        const steps = [];
        document.querySelectorAll('#processingStepsList .list-item-input').forEach(input => {
            if (input.value.trim()) {
                steps.push(input.value.trim());
            }
        });

        return {
            // Visa Information
            visaRequired: document.getElementById('visaRequired').value,
            visaType: document.getElementById('visaType').value,
            visaCost: document.getElementById('visaCost').value,
            validity: document.getElementById('validity').value,
            processingTime: document.getElementById('processingTime').value,
            applicationMethod: document.getElementById('applicationMethod').value,
            officialLink: document.getElementById('officialLink').value,
            processingSteps: steps,
            extensionPossible: document.getElementById('extensionPossible').value,
            extensionDuration: document.getElementById('extensionDuration').value,
            extensionCost: document.getElementById('extensionCost').value,
            sourceName: document.getElementById('sourceName').value,
            sourceType: document.getElementById('sourceType').value,
            lastUpdated: document.getElementById('lastUpdated').value,
            
            // Travel Information
            directFlights: document.getElementById('directFlights').value,
            airlines: document.getElementById('airlines').value,
            flightDuration: document.getElementById('flightDuration').value,
            mainAirport: document.getElementById('mainAirport').value,
            airportCode: document.getElementById('airportCode').value,
            cityDistance: document.getElementById('cityDistance').value,
            safetyLevel: document.getElementById('safetyLevel').value,
            travelNotes: document.getElementById('travelNotes').value
        };
    }

    validateData(data) {
        const errors = [];

        if (data.visaRequired === 'yes' && !data.visaType) {
            errors.push('Visa Type is required when visa is required');
        }

        if (data.applicationMethod === 'online' && !data.officialLink) {
            errors.push('Official Link is required for online applications');
        }

        if (errors.length > 0) {
            alert('Please fix the following errors:\n\n' + errors.join('\n'));
            return false;
        }

        return true;
    }

    getChangeSummary(data) {
        const changes = [];
        const current = this.countryData[this.currentCountry];

        if (data.visaType !== current.visaType) changes.push('visa type');
        if (data.visaCost !== current.visaCost) changes.push('visa cost');
        if (data.validity !== current.validity) changes.push('validity period');
        if (data.processingSteps.length !== current.processingSteps.length) changes.push('processing steps');

        return changes.length > 0 ? `Updated ${changes.join(', ')}` : 'Updated information';
    }

    recordChange(type, action, details) {
        this.changeHistory.push({
            country: this.currentCountry,
            type: type,
            action: action,
            details: details,
            user: 'Admin User', // In production, get from auth
            timestamp: new Date().toISOString()
        });
    }

    discardChanges() {
        if (!this.unsavedChanges) return;

        if (confirm('Are you sure you want to discard all changes?')) {
            this.selectCountry(this.currentCountry);
        }
    }

    saveAllChanges() {
        // In production, this would sync with backend
        localStorage.setItem('adminCountryData', JSON.stringify(this.countryData));
        this.showNotification('All changes saved to database!');
    }

    exportData() {
        const data = Object.values(this.countryData);
        const csv = this.convertToCSV(data);
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `country-visa-data-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully!');
    }

    convertToCSV(data) {
        const headers = [
            'Country', 'Embassy', 'Visa Required', 'Visa Type', 'Cost', 'Validity',
            'Processing Time', 'Application Method', 'Official Link', 'Extension Possible',
            'Direct Flights', 'Airlines', 'Safety Level'
        ];

        const rows = data.map(country => [
            country.country,
            country.embassy,
            country.visaRequired,
            country.visaType,
            country.visaCost,
            country.validity,
            country.processingTime,
            country.applicationMethod,
            country.officialLink,
            country.extensionPossible,
            country.directFlights,
            country.airlines,
            country.safetyLevel
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
        ].join('\n');
    }

    showNotification(message) {
        const toast = document.getElementById('notificationToast');
        toast.querySelector('.notification-message').textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    initializeFormValidation() {
        // URL validation
        document.getElementById('officialLink')?.addEventListener('blur', (e) => {
            if (e.target.value && !this.isValidURL(e.target.value)) {
                e.target.style.borderColor = 'var(--admin-danger)';
            } else {
                e.target.style.borderColor = '';
            }
        });

        // Airport code validation (3 letters)
        document.getElementById('airportCode')?.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().slice(0, 3);
        });
    }

    isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// Initialize admin portal
const adminPortal = new AdminPortal();