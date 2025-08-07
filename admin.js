// Admin Portal JavaScript - Country Information Management System

class AdminPortal {
    constructor() {
        this.currentCountry = null;
        this.unsavedChanges = false;
        this.countryData = {};
        this.changeHistory = [];
        this.fileUploads = [];
        this.currentImport = null;
        
        this.init();
    }

    async init() {
        await this.loadCountryData();
        this.setupEventListeners();
        this.initializeFormValidation();
        this.setupFileImport();
        this.loadImportHistory();
    }

    async loadCountryData() {
        // Load country data from localStorage if it exists
        const savedData = localStorage.getItem('adminCountryData');
        if (savedData) {
            try {
                this.countryData = JSON.parse(savedData);
                console.log('Loaded admin country data:', Object.keys(this.countryData).length, 'countries');
            } catch (error) {
                console.error('Error loading saved country data:', error);
                this.countryData = {};
            }
        } else {
            // Start with empty data
            this.countryData = {};
        }

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
        
        // Import center toggle
        document.getElementById('dataImportBtn')?.addEventListener('click', () => this.toggleImportCenter());
        document.getElementById('closeImportBtn')?.addEventListener('click', () => this.closeImportCenter());

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
        
        // Update database-specific storage for database view
        this.updateDatabaseStorage();

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
        this.updateDatabaseStorage();
        this.showNotification('All changes saved to database!');
    }

    updateDatabaseStorage() {
        // Update database-specific storage entries for the database view
        // Convert admin country data to database format
        const visaData = [];
        const travelData = [];
        
        Object.values(this.countryData).forEach(country => {
            if (country.embassy) {
                // Add to visa data
                visaData.push({
                    embassy: country.embassy,
                    country: country.country,
                    visaRequired: country.visaRequired || "",
                    visaType: country.visaType || "",
                    visaCost: country.visaCost || "",
                    validity: country.validity || "",
                    processingTime: country.processingTime || "",
                    applicationMethod: country.applicationMethod || "",
                    officialLink: country.officialLink || "",
                    extensionPossible: country.extensionPossible || "",
                    sourceName: country.sourceName || "",
                    lastUpdated: country.lastUpdated || new Date().toISOString().split('T')[0]
                });
                
                // Add to travel data
                travelData.push({
                    embassy: country.embassy,
                    country: country.country,
                    directFlights: country.directFlights || "",
                    airlines: country.airlines || "",
                    flightDuration: country.flightDuration || "",
                    mainAirport: country.mainAirport || "",
                    airportCode: country.airportCode || "",
                    cityDistance: country.cityDistance || "",
                    safetyLevel: country.safetyLevel || "",
                    travelNotes: country.travelNotes || "",
                    lastUpdated: new Date().toISOString().split('T')[0]
                });
            }
        });
        
        // Save database-specific formats
        localStorage.setItem('databaseVisaData', JSON.stringify(visaData));
        localStorage.setItem('databaseTravelData', JSON.stringify(travelData));
        localStorage.setItem('databaseHistoryData', JSON.stringify(this.changeHistory));
        
        console.log('Updated database storage: ', visaData.length, 'visa records,', travelData.length, 'travel records');
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

    // Excel Import Functionality
    setupFileImport() {
        // SIV File Upload Setup
        const sivUploadArea = document.getElementById('sivUploadArea');
        const sivFileInput = document.getElementById('sivFileInput');
        const sivPreviewBtn = document.getElementById('sivPreviewBtn');
        const sivImportBtn = document.getElementById('sivImportBtn');

        // File upload area click handler
        sivUploadArea.addEventListener('click', () => {
            sivFileInput.click();
        });

        // Drag and drop handlers
        sivUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            sivUploadArea.classList.add('dragover');
        });

        sivUploadArea.addEventListener('dragleave', () => {
            sivUploadArea.classList.remove('dragover');
        });

        sivUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            sivUploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0], 'siv');
            }
        });

        // File input change handler
        sivFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0], 'siv');
            }
        });

        // Button handlers
        sivPreviewBtn.addEventListener('click', () => this.previewImport());
        sivImportBtn.addEventListener('click', () => this.startImport());
        
        // Cancel import
        document.getElementById('cancelImportBtn')?.addEventListener('click', () => {
            this.cancelImport();
        });
    }

    handleFileSelect(file, type) {
        // Validate file type
        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            this.showNotification('Please select a valid Excel file (.xlsx or .xls)', 'error');
            return;
        }

        // Validate file size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
            this.showNotification('File size too large. Maximum 50MB allowed.', 'error');
            return;
        }

        // Store current file
        this.currentImport = {
            file: file,
            type: type,
            data: null,
            status: 'ready'
        };

        // Update UI
        this.updateUploadUI(file, type);
        
        // Parse file immediately for preview
        this.parseExcelFile(file, type);
    }

    updateUploadUI(file, type) {
        const uploadArea = document.getElementById(`${type}UploadArea`);
        const previewBtn = document.getElementById(`${type}PreviewBtn`);
        const importBtn = document.getElementById(`${type}ImportBtn`);
        
        // Update upload area content (without remove button to prevent click conflicts)
        uploadArea.innerHTML = `
            <div class="upload-content">
                <span class="upload-icon">📄</span>
                <p class="upload-text"><strong>${file.name}</strong></p>
                <p class="upload-hint">${this.formatFileSize(file.size)} - Ready to process</p>
            </div>
        `;
        
        // Add remove button outside the clickable upload area
        const uploadContainer = uploadArea.parentElement;
        let removeButton = uploadContainer.querySelector('.remove-file-btn');
        if (!removeButton) {
            removeButton = document.createElement('div');
            removeButton.className = 'remove-file-btn';
            removeButton.style.marginTop = '10px';
            removeButton.style.textAlign = 'center';
            uploadContainer.insertBefore(removeButton, uploadArea.nextSibling);
        }
        
        removeButton.innerHTML = `
            <button class="btn btn-secondary btn-sm" onclick="adminPortal.clearFile('${type}'); return false;">
                🗑️ Remove File
            </button>
        `;
        
        // Disable upload area click when file is loaded
        uploadArea.style.pointerEvents = 'none';
        uploadArea.style.opacity = '0.8';
        
        // Enable buttons
        previewBtn.disabled = false;
        importBtn.disabled = false;
    }

    clearFile(type, event) {
        // Prevent event bubbling if called from button click
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        const uploadArea = document.getElementById(`${type}UploadArea`);
        const previewBtn = document.getElementById(`${type}PreviewBtn`);
        const importBtn = document.getElementById(`${type}ImportBtn`);
        const fileInput = document.getElementById(`${type}FileInput`);
        
        // Clear current import data
        this.currentImport = null;
        
        // Reset UI
        uploadArea.innerHTML = `
            <div class="upload-content">
                <span class="upload-icon">📁</span>
                <p class="upload-text">Drop Excel file here or <span class="upload-link">browse files</span></p>
                <p class="upload-hint">Supports .xlsx and .xls formats</p>
            </div>
        `;
        
        // Re-enable upload area click
        uploadArea.style.pointerEvents = '';
        uploadArea.style.opacity = '';
        
        // Remove the separate remove button
        const uploadContainer = uploadArea.parentElement;
        const removeButton = uploadContainer.querySelector('.remove-file-btn');
        if (removeButton) {
            removeButton.remove();
        }
        
        // Disable buttons
        previewBtn.disabled = true;
        importBtn.disabled = true;
        
        // Clear file input
        fileInput.value = '';
        
        // Clear current import
        this.currentImport = null;
    }

    async parseExcelFile(file, type) {
        try {
            this.showProgressLog(`Parsing ${file.name}...`);
            
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            if (type === 'siv') {
                this.currentImport.data = this.parseSIVData(workbook);
            }
            
            this.showProgressLog(`File parsed successfully. Found ${this.currentImport.data.length} records.`);
            
        } catch (error) {
            console.error('Error parsing Excel file:', error);
            this.showNotification('Error parsing Excel file: ' + error.message, 'error');
            
            // Show error in progress log but keep the file loaded so user can remove it
            document.getElementById('progressLog').innerHTML = `
                <div style="color: var(--danger); padding: 20px;">
                    <h4>⚠️ Error Parsing File</h4>
                    <p>${error.message}</p>
                    <p style="margin-top: 10px; font-size: 14px;">
                        This file format may not be compatible. Please ensure:
                        <ul>
                            <li>The file contains embassy/post data with SQ visa columns</li>
                            <li>The file follows the "MONTH YEAR - IV Issuances by Post and Visa Class" format</li>
                            <li>The data includes columns for Post/Embassy and SQ visa counts</li>
                        </ul>
                    </p>
                    <button class="btn btn-secondary btn-sm" onclick="adminPortal.clearFile('siv'); return false;" style="margin-top: 10px;">
                        Remove File and Try Again
                    </button>
                </div>
            `;
            document.getElementById('importProgress').style.display = 'block';
        }
    }

    parseSIVData(workbook) {
        // Assume first sheet contains the data
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (jsonData.length < 2) {
            throw new Error('Excel file must contain header row and data rows');
        }
        
        // Find header row (look for Embassy/Country/Post columns)
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const row = jsonData[i];
            if (row && row.some(cell => 
                cell && typeof cell === 'string' && 
                (cell.toLowerCase().includes('embassy') || 
                 cell.toLowerCase().includes('country') || 
                 cell.toLowerCase().includes('post'))
            )) {
                headerRowIndex = i;
                break;
            }
        }
        
        if (headerRowIndex === -1) {
            // Show first few rows to help debug
            const preview = jsonData.slice(0, 5).map((row, i) => 
                `Row ${i}: ${row.slice(0, 5).join(' | ')}`
            ).join('\n');
            throw new Error(`Could not find header row with Embassy/Country/Post columns.\n\nFile preview:\n${preview}`);
        }
        
        const headers = jsonData[headerRowIndex].map(h => h ? h.toString().trim() : '');
        const dataRows = jsonData.slice(headerRowIndex + 1);
        
        // Map column indices - specifically look for SQ visa columns
        const columnMap = this.mapSIVColumns(headers);
        
        // Process data rows
        const processedData = [];
        dataRows.forEach((row, index) => {
            if (!row || row.every(cell => !cell)) return; // Skip empty rows
            
            try {
                const record = this.processSIVRow(row, columnMap, index + headerRowIndex + 2);
                if (record && record.sqCount > 0) { // Only include if has SQ visas
                    processedData.push(record);
                }
            } catch (error) {
                console.warn(`Error processing row ${index + headerRowIndex + 2}:`, error);
            }
        });
        
        // Sort by SQ count descending
        processedData.sort((a, b) => b.sqCount - a.sqCount);
        
        return processedData;
    }

    mapSIVColumns(headers) {
        const columnMap = {};
        
        headers.forEach((header, index) => {
            const lowerHeader = header.toLowerCase();
            
            // Map common column variations
            if (lowerHeader.includes('embassy') || lowerHeader.includes('post') || lowerHeader.includes('city')) {
                columnMap.embassy = index;
            } else if (lowerHeader.includes('country')) {
                columnMap.country = index;
            } else if (lowerHeader === 'sq' || lowerHeader.includes('sq1') || lowerHeader.includes('sq2')) {
                // Look for SQ visa columns
                columnMap.sq = index;
            } else if (lowerHeader.includes('total') && !lowerHeader.includes('grand')) {
                columnMap.total = index;
            } else if (lowerHeader.includes('grand total')) {
                columnMap.grandTotal = index;
            }
        });
        
        // If no specific embassy/post column, look for the first column
        if (columnMap.embassy === undefined) {
            columnMap.embassy = 0;
        }
        
        return columnMap;
    }

    processSIVRow(row, columnMap, rowNumber) {
        const embassy = row[columnMap.embassy];
        const country = row[columnMap.country];
        
        // Skip if no embassy/post name
        if (!embassy || embassy.toString().trim() === '') {
            return null;
        }
        
        // Extract SQ visa count
        const sqCount = columnMap.sq !== undefined ? (parseInt(row[columnMap.sq]) || 0) : 0;
        
        // Skip rows with no SQ visas
        if (sqCount === 0) {
            return null;
        }
        
        // Extract the month and year from the filename
        const filename = this.currentImport?.file?.name || '';
        const monthMatch = filename.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);
        
        let monthKey = '';
        if (monthMatch) {
            const monthName = monthMatch[1].toLowerCase();
            const year = monthMatch[2];
            const monthMap = {
                'january': '01', 'february': '02', 'march': '03', 'april': '04',
                'may': '05', 'june': '06', 'july': '07', 'august': '08',
                'september': '09', 'october': '10', 'november': '11', 'december': '12'
            };
            monthKey = `${year}-${monthMap[monthName]}`;
        }
        
        const record = {
            embassy: embassy.toString().trim(),
            country: country ? country.toString().trim() : embassy.toString().trim(),
            sqCount: sqCount,
            lastUpdated: new Date().toISOString().split('T')[0],
            sourceRow: rowNumber,
            sourceFile: filename
        };
        
        // If we identified the month, add it to the record
        if (monthKey) {
            record[monthKey] = sqCount;
            record.monthData = { [monthKey]: sqCount };
        }
        
        return record;
    }

    previewImport() {
        if (!this.currentImport || !this.currentImport.data) {
            this.showNotification('No data to preview', 'error');
            return;
        }
        
        // Show import progress panel
        document.getElementById('importProgress').style.display = 'block';
        document.getElementById('progressStatus').textContent = 'Data Preview';
        document.getElementById('progressFill').style.width = '100%';
        
        // Generate preview
        const data = this.currentImport.data;
        const previewHTML = `
            <div class="preview-summary">
                <h4>Import Preview - ${this.currentImport.file.name}</h4>
                <p><strong>Records found:</strong> ${data.length}</p>
                <p><strong>File type:</strong> SIV Issuances Data</p>
                <p><strong>Date range:</strong> ${this.getDataDateRange(data)}</p>
            </div>
            <div class="preview-table">
                <h5>Sample Records (first 5):</h5>
                <table class="preview-data-table">
                    <thead>
                        <tr>
                            <th>Embassy/Post</th>
                            <th>Country</th>
                            <th>SQ Visas</th>
                            <th>Month</th>
                            <th>Source File</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.slice(0, 5).map(record => `
                            <tr>
                                <td>${record.embassy}</td>
                                <td>${record.country}</td>
                                <td>${record.sqCount}</td>
                                <td>${record.monthData ? Object.keys(record.monthData)[0] : 'N/A'}</td>
                                <td>${record.sourceFile}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${this.validateImportData(data)}
        `;
        
        document.getElementById('progressLog').innerHTML = previewHTML;
    }

    getDataDateRange(data) {
        const months = [];
        if (data.length > 0) {
            Object.keys(data[0]).forEach(key => {
                if (key.match(/^\d{4}-\d{2}$/)) {
                    months.push(key);
                }
            });
        }
        months.sort();
        return months.length > 0 ? `${months[0]} to ${months[months.length - 1]}` : 'No date columns found';
    }

    getMonthlyDataSummary(record) {
        const months = [];
        Object.keys(record).forEach(key => {
            if (key.match(/^\d{4}-\d{2}$/) && record[key] > 0) {
                months.push(`${key}: ${record[key]}`);
            }
        });
        return months.slice(0, 3).join(', ') + (months.length > 3 ? '...' : '');
    }

    validateImportData(data) {
        const errors = [];
        const warnings = [];
        
        // Check for required fields
        data.forEach((record, index) => {
            if (!record.embassy && !record.country) {
                errors.push(`Row ${record.sourceRow || index + 1}: Missing embassy and country`);
            }
            if (record.total === 0) {
                warnings.push(`Row ${record.sourceRow || index + 1}: Total is 0 for ${record.embassy || record.country}`);
            }
        });
        
        // Check for duplicates
        const embassySet = new Set();
        data.forEach((record, index) => {
            if (embassySet.has(record.embassy)) {
                warnings.push(`Duplicate embassy found: ${record.embassy}`);
            }
            embassySet.add(record.embassy);
        });
        
        let validationHTML = '';
        if (errors.length > 0) {
            validationHTML += `
                <div class="validation-errors">
                    <h5 style="color: #DC2626;">⚠️ Errors (${errors.length}):</h5>
                    <ul>${errors.map(error => `<li>${error}</li>`).join('')}</ul>
                </div>
            `;
        }
        
        if (warnings.length > 0) {
            validationHTML += `
                <div class="validation-warnings">
                    <h5 style="color: #D97706;">⚠️ Warnings (${warnings.length}):</h5>
                    <ul>${warnings.map(warning => `<li>${warning}</li>`).join('')}</ul>
                </div>
            `;
        }
        
        if (errors.length === 0 && warnings.length === 0) {
            validationHTML = '<div class="validation-success"><h5 style="color: #059669;">✅ All validations passed!</h5></div>';
        }
        
        return validationHTML;
    }

    async startImport() {
        if (!this.currentImport || !this.currentImport.data) {
            this.showNotification('No data to import', 'error');
            return;
        }
        
        const replaceData = document.getElementById('sivReplaceData').checked;
        const validateData = document.getElementById('sivValidateData').checked;
        
        // Show progress
        document.getElementById('importProgress').style.display = 'block';
        document.getElementById('progressStatus').textContent = 'Importing data...';
        document.getElementById('progressFill').style.width = '0%';
        
        try {
            const result = await this.processSIVImport(this.currentImport.data, replaceData, validateData);
            
            // Update progress
            document.getElementById('progressFill').style.width = '100%';
            document.getElementById('progressStatus').textContent = 'Import completed successfully!';
            
            // Create import record
            const importRecord = {
                id: Date.now(),
                filename: this.currentImport.file.name,
                fileType: 'SIV Issuances',
                fileSize: this.formatFileSize(this.currentImport.file.size),
                status: 'success',
                recordsProcessed: this.currentImport.data.length,
                recordsUpdated: result.updated,
                errors: result.errors,
                uploadedBy: 'admin@example.com',
                uploadDate: new Date().toISOString(),
                processingTime: result.processingTime + 'ms'
            };
            
            this.fileUploads.unshift(importRecord);
            this.saveImportHistory();
            this.updateImportHistoryTable();
            
            this.showNotification(`Import completed! Updated ${result.updated} records.`, 'success');
            
            // Clear current import
            setTimeout(() => {
                this.clearFile('siv');
                document.getElementById('importProgress').style.display = 'none';
            }, 3000);
            
        } catch (error) {
            console.error('Import error:', error);
            document.getElementById('progressStatus').textContent = 'Import failed: ' + error.message;
            this.showNotification('Import failed: ' + error.message, 'error');
        }
    }

    async processSIVImport(data, replaceData, validateData) {
        const startTime = Date.now();
        let updated = 0;
        let errors = 0;
        
        // Load existing SIV data from localStorage first
        let existingSIVData = {};
        const savedData = localStorage.getItem('sivImportData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.embassies) {
                    parsed.embassies.forEach(embassy => {
                        existingSIVData[embassy.embassy] = embassy;
                    });
                }
            } catch (error) {
                console.warn('Could not parse existing SIV data:', error);
            }
        }
        
        // Process each record
        for (let i = 0; i < data.length; i++) {
            const record = data[i];
            const progress = ((i + 1) / data.length) * 100;
            document.getElementById('progressFill').style.width = `${progress}%`;
            
            try {
                // Update or create embassy record
                if (existingSIVData[record.embassy]) {
                    // Update existing embassy data
                    const existing = existingSIVData[record.embassy];
                    
                    // Initialize monthlyData if not exists
                    if (!existing.monthlyData) {
                        existing.monthlyData = {};
                    }
                    
                    // Add month data from this record
                    if (record.monthData) {
                        Object.entries(record.monthData).forEach(([month, count]) => {
                            existing.monthlyData[month] = count;
                        });
                    }
                    
                    // Update country if not set
                    if (!existing.country && record.country) {
                        existing.country = record.country;
                    }
                    
                    // Recalculate total from all monthly data
                    existing.total = Object.values(existing.monthlyData).reduce((sum, val) => sum + (val || 0), 0);
                    
                } else {
                    // Create new embassy record
                    existingSIVData[record.embassy] = {
                        embassy: record.embassy,
                        country: record.country,
                        monthlyData: record.monthData || {},
                        total: record.sqCount || 0,
                        lastUpdated: record.lastUpdated
                    };
                }
                
                updated++;
                
            } catch (error) {
                console.error(`Error processing record for ${record.embassy}:`, error);
                errors++;
            }
            
            // Small delay to show progress
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        // Sort by total descending and add rank
        const sivArray = Object.values(existingSIVData)
            .sort((a, b) => (b.total || 0) - (a.total || 0))
            .map((embassy, index) => ({ ...embassy, rank: index + 1 }));
        
        // Save updated data to localStorage
        localStorage.setItem('sivImportData', JSON.stringify({ embassies: sivArray }));
        
        // Also update database SIV data
        localStorage.setItem('databaseSIVData', JSON.stringify(sivArray));
        
        return {
            updated,
            errors,
            processingTime: Date.now() - startTime
        };
    }

    cancelImport() {
        this.currentImport = null;
        document.getElementById('importProgress').style.display = 'none';
        this.showNotification('Import cancelled', 'warning');
    }

    loadImportHistory() {
        const saved = localStorage.getItem('fileUploads');
        if (saved) {
            this.fileUploads = JSON.parse(saved);
        } else {
            // Start with empty import history
            this.fileUploads = [];
        }
        this.updateImportHistoryTable();
    }

    updateImportHistoryTable() {
        const tbody = document.getElementById('importsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = this.fileUploads.slice(0, 10).map(upload => `
            <tr>
                <td>${upload.filename}</td>
                <td>
                    <span class="status-badge status-${upload.status}">
                        ${upload.status.toUpperCase()}
                    </span>
                </td>
                <td>${upload.recordsProcessed}/${upload.recordsUpdated}</td>
                <td>${this.formatDate(upload.uploadDate)}</td>
                <td>${upload.uploadedBy}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="adminPortal.viewImportDetails(${upload.id})" title="View Details">
                        👁️
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="adminPortal.deleteImport(${upload.id})" title="Delete">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    }

    saveImportHistory() {
        localStorage.setItem('fileUploads', JSON.stringify(this.fileUploads));
    }

    viewImportDetails(id) {
        const upload = this.fileUploads.find(u => u.id === id);
        if (upload) {
            alert(`Import Details:\n\nFile: ${upload.filename}\nType: ${upload.fileType}\nStatus: ${upload.status}\nRecords: ${upload.recordsProcessed} processed, ${upload.recordsUpdated} updated\nErrors: ${upload.errors}\nDate: ${this.formatDate(upload.uploadDate)}\nUser: ${upload.uploadedBy}\nProcessing Time: ${upload.processingTime}`);
        }
    }

    deleteImport(id) {
        if (confirm('Are you sure you want to delete this import record?')) {
            this.fileUploads = this.fileUploads.filter(u => u.id !== id);
            this.saveImportHistory();
            this.updateImportHistoryTable();
            this.showNotification('Import record deleted', 'success');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showProgressLog(message) {
        const log = document.getElementById('progressLog');
        if (log) {
            const timestamp = new Date().toLocaleTimeString();
            log.textContent += `[${timestamp}] ${message}\n`;
            log.scrollTop = log.scrollHeight;
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showNotification(message, type = 'success') {
        const toast = document.getElementById('notificationToast');
        const icon = toast.querySelector('.notification-icon');
        const messageEl = toast.querySelector('.notification-message');
        
        // Update content
        messageEl.textContent = message;
        
        // Update icon based on type
        switch (type) {
            case 'success':
                icon.textContent = '✓';
                break;
            case 'error':
                icon.textContent = '⚠️';
                break;
            case 'warning':
                icon.textContent = '⚠️';
                break;
            default:
                icon.textContent = 'ℹ️';
        }
        
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
    }

    // Import Center Toggle
    toggleImportCenter() {
        const importSection = document.getElementById('importSection');
        const isVisible = importSection.style.display !== 'none';
        
        if (isVisible) {
            this.closeImportCenter();
        } else {
            this.openImportCenter();
        }
    }

    openImportCenter() {
        const importSection = document.getElementById('importSection');
        const editorSection = document.getElementById('editorSection');
        
        // Hide country editor if visible
        if (editorSection.style.display !== 'none') {
            editorSection.style.display = 'none';
        }
        
        // Show import center
        importSection.style.display = 'block';
        
        // Smooth scroll to import center
        importSection.scrollIntoView({ behavior: 'smooth' });
        
        // Update button text
        const btn = document.getElementById('dataImportBtn');
        btn.innerHTML = '<span class="btn-icon">📊</span>Hide Import Center';
    }

    closeImportCenter() {
        const importSection = document.getElementById('importSection');
        importSection.style.display = 'none';
        
        // Reset button text
        const btn = document.getElementById('dataImportBtn');
        btn.innerHTML = '<span class="btn-icon">📊</span>Data Import Center';
        
        // Clear any current import
        if (this.currentImport) {
            this.clearFile('siv');
        }
        
        // Hide progress panel
        document.getElementById('importProgress').style.display = 'none';
    }
}

// Initialize admin portal
const adminPortal = new AdminPortal();