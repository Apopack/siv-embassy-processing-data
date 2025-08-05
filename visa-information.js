// Visa Information Application

class VisaInformationApp {
    constructor() {
        this.visaData = [];
        this.filteredData = [];
        this.comparisonCountries = [];
        this.maxComparisons = 5;
        this.currentFilter = 'all';
        
        this.init();
    }

    async init() {
        await this.loadVisaData();
        this.setupEventListeners();
        this.renderVisaCards();
    }

    async loadVisaData() {
        // Visa data from the CSV file: Visa_Information_Sources_with_Extension_Details.csv
        this.visaData = [
            {
                rank: 1,
                embassy: "Islamabad",
                country: "Pakistan",
                flag: "🇵🇰",
                visaNeeded: "Yes, Pakistani visa required",
                visaType: "Visitor Visa (Tourist/Family Visit)",
                visaCost: "US$50–100",
                validity: "3 months (90 days)",
                processingSteps: [
                    "Visit the Pakistan Online Visa portal at https://visa.nadra.gov.pk",
                    "Create account and complete online application form",
                    "Upload required documents: passport copy, photo, invitation letter (if applicable)",
                    "Pay visa fee online (US$50-100)",
                    "Wait for processing (typically 3-5 business days)",
                    "Download and print approved e-visa"
                ],
                extension: "Yes - Up to additional 90 days. Extension cost varies (portal fee approx US$20)",
                extensionPossible: true,
                extensionDuration: "Up to additional 90 days",
                extensionCost: "Varies (portal fee; approx US$20)",
                links: [
                    { text: "Pakistan Online Visa System", url: "https://visa.nadra.gov.pk" }
                ],
                sourceName: "Pakistan Online Visa",
                sourceType: "Government Portal",
                updateFrequency: "Real-time",
                tags: ["evisa", "government-portal"]
            },
            {
                rank: 2,
                embassy: "Doha",
                country: "Qatar",
                flag: "🇶🇦",
                visaNeeded: "Yes, Qatari entry permit required",
                visaType: "Hayya Entry Permit",
                visaCost: "US$27",
                validity: "30 days",
                processingSteps: [
                    "Visit the official Hayya Portal at https://hayya.qa",
                    "Create account and fill application form",
                    "Upload required documents: passport copy, photo, proof of accommodation",
                    "Pay entry permit fee online (US$27)",
                    "Receive approval notification (usually same day)",
                    "Download and print Hayya Entry Permit"
                ],
                extension: "No - Extensions not available",
                extensionPossible: false,
                extensionDuration: "",
                extensionCost: "",
                links: [
                    { text: "Hayya Portal", url: "https://hayya.qa" }
                ],
                sourceName: "Hayya Portal",
                sourceType: "Government Portal",
                updateFrequency: "Real-time",
                tags: ["evisa", "government-portal"]
            },
            {
                rank: 3,
                embassy: "Tirana", 
                country: "Albania",
                flag: "🇦🇱",
                visaNeeded: "Yes, Albanian visa required",
                visaType: "Short-Stay Type C Schengen Visa",
                visaCost: "€50 (~US$55)",
                validity: "90 days",
                processingSteps: [
                    "Visit the Albanian e-Visa portal at https://e-visa.al",
                    "Create account and complete application form",
                    "Upload required documents: passport scan, photo, travel insurance, accommodation proof",
                    "Pay visa fee online (€50)",
                    "Wait for processing (typically 5-10 business days)",
                    "Receive e-visa approval by email"
                ],
                extension: "No - Extensions not available",
                extensionPossible: false,
                extensionDuration: "",
                extensionCost: "",
                links: [
                    { text: "Albanian e-Visa Portal", url: "https://e-visa.al" }
                ],
                sourceName: "Albanian e-Visa",
                sourceType: "Government Portal",
                updateFrequency: "Real-time",
                tags: ["evisa", "government-portal"]
            },
            {
                rank: 4,
                embassy: "Ankara",
                country: "Turkey",
                flag: "🇹🇷",
                visaNeeded: "Yes, Turkish visa required",
                visaType: "Single-Entry Turkish e-Visa",
                visaCost: "US$60",
                validity: "30 days",
                processingSteps: [
                    "Visit the Turkish e-Visa portal at https://www.evisa.gov.tr",
                    "Check eligibility for e-visa",
                    "Complete online application form",
                    "Upload required documents and photo",
                    "Pay visa fee online (US$60)",
                    "Receive e-visa approval (usually within minutes)"
                ],
                extension: "No - Extensions not available",
                extensionPossible: false,
                extensionDuration: "",
                extensionCost: "",
                links: [
                    { text: "Turkish e-Visa Portal", url: "https://www.evisa.gov.tr" }
                ],
                sourceName: "Turkish e-Visa",
                sourceType: "Government Portal",
                updateFrequency: "Real-time",
                tags: ["evisa", "government-portal"]
            },
            {
                rank: 5,
                embassy: "Frankfurt",
                country: "Germany",
                flag: "🇩🇪",
                visaNeeded: "Yes, Schengen visa required",
                visaType: "Schengen Short-Stay Visa (Type C)",
                visaCost: "€90 (~US$98)",
                validity: "90 days",
                processingSteps: [
                    "Visit the Auswärtiges Amt website at https://www.auswaertiges-amt.de/en",
                    "Schedule appointment at German embassy or consulate",
                    "Complete Schengen visa application form",
                    "Gather documents: passport, photos, travel insurance, proof of funds, accommodation",
                    "Attend appointment for biometrics and document submission",
                    "Wait for decision (typically 15-30 days)"
                ],
                extension: "No - Only in exceptional cases",
                extensionPossible: false,
                extensionDuration: "",
                extensionCost: "",
                links: [
                    { text: "Auswärtiges Amt (German Foreign Office)", url: "https://www.auswaertiges-amt.de/en" }
                ],
                sourceName: "Auswärtiges Amt",
                sourceType: "Government Portal",
                updateFrequency: "Monthly",
                tags: ["schengen", "government-portal"]
            },
            {
                rank: 6,
                embassy: "Montreal",
                country: "Canada",
                flag: "🇨🇦",
                visaNeeded: "Yes, Canadian visitor visa required",
                visaType: "Visitor Visa (Temporary Resident Visa)",
                visaCost: "CA$100 + CA$85 biometrics (~US$137)",
                validity: "6 months",
                processingSteps: [
                    "Visit IRCC website at https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/visitor-visa.html",
                    "Create online account and complete application",
                    "Upload required documents: passport, photos, proof of funds, purpose of visit",
                    "Pay application and biometric fees online",
                    "Schedule and attend biometrics appointment at VAC",
                    "Wait for processing (typically 4-8 weeks)"
                ],
                extension: "Yes - Up to 6 months. Extension cost CA$100 (~US$74)",
                extensionPossible: true,
                extensionDuration: "Up to 6 months",
                extensionCost: "CA$100 (~US$74)",
                links: [
                    { text: "IRCC Visitor Visa Info", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/visitor-visa.html" }
                ],
                sourceName: "IRCC Visitor Visa",
                sourceType: "Government Portal",
                updateFrequency: "Monthly",
                tags: ["government-portal"]
            },
            {
                rank: 7,
                embassy: "Manila",
                country: "Philippines",
                flag: "🇵🇭",
                visaNeeded: "Yes, Philippine tourist visa required",
                visaType: "Tourist Visa (9(a) category)",
                visaCost: "US$30",
                validity: "59 days",
                processingSteps: [
                    "Visit DFA website at https://dfa.gov.ph/visa-info",
                    "Complete visa application form",
                    "Prepare required documents: passport, photos, bank statements, itinerary",
                    "Submit application at Philippine embassy/consulate",
                    "Attend interview if required",
                    "Wait for processing (typically 5-10 business days)"
                ],
                extension: "Yes - 30 days per extension. Extension cost PHP 3,430 (~US$60)",
                extensionPossible: true,
                extensionDuration: "30 days per extension",
                extensionCost: "PHP 3,430 (~US$60)",
                links: [
                    { text: "DoF Passport & Visa Info", url: "https://dfa.gov.ph/visa-info" }
                ],
                sourceName: "DoF Passport & Visa",
                sourceType: "Government Portal",
                updateFrequency: "Monthly",
                tags: ["government-portal"]
            },
            {
                rank: 8,
                embassy: "Abu Dhabi",
                country: "UAE",
                flag: "🇦🇪",
                visaNeeded: "Yes, UAE tourist visa required",
                visaType: "Tourist Visa via ICA Smart Services",
                visaCost: "AED350–400 (~US$95–110)",
                validity: "30 days",
                processingSteps: [
                    "Visit ICA Smart Services at https://www.icp.gov.ae",
                    "Create account on the portal",
                    "Complete tourist visa application",
                    "Upload required documents: passport copy, photo",
                    "Pay visa fee online (AED350-400)",
                    "Wait for approval (typically 3-5 working days)"
                ],
                extension: "Yes - 30 days extension for AED 650 (~US$177)",
                extensionPossible: true,
                extensionDuration: "30 days",
                extensionCost: "AED 650 (~US$177)",
                links: [
                    { text: "ICA Smart Services", url: "https://www.icp.gov.ae" }
                ],
                sourceName: "ICA Smart Services",
                sourceType: "Government Portal",
                updateFrequency: "Real-time",
                tags: ["government-portal"]
            },
            {
                rank: 9,
                embassy: "Baghdad",
                country: "Iraq",
                flag: "🇮🇶",
                visaNeeded: "Yes, Iraqi tourist visa required",
                visaType: "Tourist e-Visa",
                visaCost: "US$75",
                validity: "30 days",
                processingSteps: [
                    "Visit Iraqi e-Visa Portal at https://evisa.iraq.egov.iq",
                    "Create account and complete application form",
                    "Upload required documents: passport copy, photo",
                    "Pay visa fee online (US$75)",
                    "Wait for e-visa approval (typically 7-10 days)",
                    "Present e-visa at port of entry"
                ],
                extension: "Yes - 30 days extension for approximately US$75",
                extensionPossible: true,
                extensionDuration: "30 days",
                extensionCost: "Approx US$75",
                links: [
                    { text: "Iraqi e-Visa Portal", url: "https://evisa.iraq.egov.iq" }
                ],
                sourceName: "Iraqi e-Visa Portal",
                sourceType: "Government Portal",
                updateFrequency: "Real-time",
                tags: ["evisa", "government-portal"]
            },
            {
                rank: 10,
                embassy: "Kigali",
                country: "Rwanda",
                flag: "🇷🇼",
                visaNeeded: "Yes, tourist visa required",
                visaType: "Tourist Visa (V-1)",
                visaCost: "US$50",
                validity: "30 days",
                processingSteps: [
                    "Visit Irembo e-Visa portal at https://irembo.gov.rw",
                    "Create account and complete online application",
                    "Upload required documents: passport copy, photo, yellow fever certificate",
                    "Pay visa fee online (US$50)",
                    "Receive e-visa approval (usually same day)",
                    "Alternative: Visa available on arrival at airport"
                ],
                extension: "Yes - 30 days extension for US$50",
                extensionPossible: true,
                extensionDuration: "30 days",
                extensionCost: "US$50",
                links: [
                    { text: "Irembo e-Visa Portal", url: "https://irembo.gov.rw" }
                ],
                sourceName: "Irembo e-Visa",
                sourceType: "Government Portal",
                updateFrequency: "Real-time",
                tags: ["evisa", "government-portal", "visa-on-arrival"]
            }
        ];
        
        this.filteredData = [...this.visaData];
    }

    setupEventListeners() {
        // Mobile menu toggle
        document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
            document.getElementById('sideNav').classList.toggle('active');
        });

        // Search functionality
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleFilter(btn.dataset.filter);
                // Update active state
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Comparison button
        document.getElementById('compareBtn')?.addEventListener('click', () => {
            this.openComparisonPanel();
        });

        // Download button
        document.getElementById('downloadBtn')?.addEventListener('click', () => {
            this.downloadVisaData();
        });

        // Add country button
        document.getElementById('addCountryBtn')?.addEventListener('click', () => {
            this.openCountrySelection();
        });

        // Comparison search
        document.getElementById('comparisonSearch')?.addEventListener('input', (e) => {
            this.filterCountrySelection(e.target.value);
        });

        // Close modals with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeComparisonPanel();
                this.closeCountrySelection();
                this.closeDetailModal();
            }
        });
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredData = this.applyFilter(this.visaData);
        } else {
            this.filteredData = this.applyFilter(this.visaData).filter(visa => 
                visa.country.toLowerCase().includes(searchTerm) ||
                visa.embassy.toLowerCase().includes(searchTerm) ||
                visa.visaType.toLowerCase().includes(searchTerm)
            );
        }
        
        this.renderVisaCards();
    }

    handleFilter(filter) {
        this.currentFilter = filter;
        this.filteredData = this.applyFilter(this.visaData);
        
        // Apply search if exists
        const searchTerm = document.getElementById('searchInput')?.value;
        if (searchTerm) {
            this.handleSearch(searchTerm);
        } else {
            this.renderVisaCards();
        }
    }

    applyFilter(data) {
        switch (this.currentFilter) {
            case 'evisa':
                return data.filter(visa => visa.tags.includes('evisa'));
            case 'schengen':
                return data.filter(visa => visa.tags.includes('schengen'));
            default:
                return data;
        }
    }

    renderVisaCards() {
        const grid = document.getElementById('visaGrid');
        
        if (this.filteredData.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--gray-500);">
                    <p style="font-size: 16px;">No visa information found matching your criteria.</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.filteredData.map(visa => `
            <div class="visa-card" onclick="visaApp.showVisaDetails(${visa.rank})">
                <div class="visa-card-header">
                    <div class="country-info">
                        <div class="country-flag">${visa.flag}</div>
                        <h3 class="country-name">${visa.country}</h3>
                        <p class="embassy-location">${visa.embassy}</p>
                    </div>
                    <div class="visa-type-badge">${visa.tags.includes('evisa') ? 'E-Visa' : 'Embassy'}</div>
                </div>
                
                <div class="visa-details">
                    <div class="visa-detail-row">
                        <span class="detail-label">Visa Type</span>
                        <span class="detail-value">${visa.visaType}</span>
                    </div>
                    <div class="visa-detail-row">
                        <span class="detail-label">Cost</span>
                        <span class="detail-value visa-cost">${visa.visaCost}</span>
                    </div>
                    <div class="visa-detail-row">
                        <span class="detail-label">Validity</span>
                        <span class="detail-value">${visa.validity}</span>
                    </div>
                    <div class="visa-detail-row">
                        <span class="detail-label">Extension</span>
                        <span class="detail-value">${visa.extensionPossible ? 'Available' : 'Not Available'}</span>
                    </div>
                </div>
                
                <div class="visa-actions">
                    <button class="visa-action-btn" onclick="event.stopPropagation(); visaApp.addToComparison('${visa.country}')">
                        Compare
                    </button>
                    <button class="visa-action-btn primary" onclick="event.stopPropagation(); visaApp.showVisaDetails(${visa.rank})">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    getProcessingTime(visa) {
        // Extract processing time from steps or provide default
        if (visa.country === "Rwanda") return "Instant/Same day";
        if (visa.country === "Qatar") return "3-5 days";
        if (visa.country === "Pakistan") return "7-10 days";
        if (visa.country === "Albania") return "5-10 days";
        if (visa.country === "Turkey") return "Varies";
        if (visa.country === "Germany") return "15-30 days";
        if (visa.country === "Canada") return "4-8 weeks";
        if (visa.country === "Philippines") return "5-10 days";
        if (visa.country === "UAE") return "3-5 days";
        if (visa.country === "Iraq") return "7-10 days";
        return "5-15 days";
    }

    showVisaDetails(rank) {
        const visa = this.visaData.find(v => v.rank === rank);
        if (!visa) return;
        
        const modal = document.getElementById('detailModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        modalTitle.textContent = `${visa.country} Visa Information`;
        
        modalBody.innerHTML = `
            <div class="visa-detail-content">
                <div class="detail-header">
                    <div class="country-flag" style="font-size: 64px; margin-bottom: 16px;">${visa.flag}</div>
                    <h3>${visa.country} - ${visa.embassy}</h3>
                    <p class="visa-type">${visa.visaType}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Visa Requirements</h4>
                    <p>${visa.visaNeeded}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Cost & Validity</h4>
                    <p class="visa-cost" style="font-size: 18px; font-weight: 600;">${visa.visaCost}</p>
                    <p><strong>Validity:</strong> ${visa.validity}</p>
                    <p><strong>Source:</strong> ${visa.sourceName} (${visa.sourceType})</p>
                    <p><strong>Update Frequency:</strong> ${visa.updateFrequency}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Application Process</h4>
                    <ol>
                        ${visa.processingSteps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
                
                <div class="detail-section">
                    <h4>Extension Policy</h4>
                    <p><strong>Extensions Available:</strong> ${visa.extensionPossible ? 'Yes' : 'No'}</p>
                    ${visa.extensionPossible ? `
                        <p><strong>Extension Duration:</strong> ${visa.extensionDuration}</p>
                        <p><strong>Extension Cost:</strong> ${visa.extensionCost}</p>
                    ` : '<p>Visa extensions are not available for this destination.</p>'}
                </div>
                
                <div class="detail-section">
                    <h4>Official Links</h4>
                    <ul class="links-list">
                        ${visa.links.map(link => `
                            <li><a href="${link.url}" target="_blank" rel="noopener">${link.text} →</a></li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }

    closeDetailModal() {
        document.getElementById('detailModal').classList.remove('active');
    }

    // Comparison functionality
    openComparisonPanel() {
        const panel = document.getElementById('comparisonPanel');
        const btn = document.getElementById('compareBtn');
        
        panel.classList.add('active');
        btn.classList.add('active');
        
        this.updateComparisonView();
    }

    closeComparisonPanel() {
        const panel = document.getElementById('comparisonPanel');
        const btn = document.getElementById('compareBtn');
        
        panel.classList.remove('active');
        btn.classList.remove('active');
    }

    openCountrySelection() {
        if (this.comparisonCountries.length >= this.maxComparisons) {
            alert(`You can only compare up to ${this.maxComparisons} countries at once.`);
            return;
        }
        
        const modal = document.getElementById('countrySelectionModal');
        modal.classList.add('active');
        this.renderCountrySelectionList();
    }

    closeCountrySelection() {
        const modal = document.getElementById('countrySelectionModal');
        modal.classList.remove('active');
    }

    renderCountrySelectionList(filter = '') {
        const list = document.getElementById('countrySelectionList');
        const countries = filter 
            ? this.visaData.filter(v => 
                v.country.toLowerCase().includes(filter.toLowerCase()) ||
                v.embassy.toLowerCase().includes(filter.toLowerCase())
              )
            : this.visaData;
        
        list.innerHTML = countries.map(visa => {
            const isSelected = this.comparisonCountries.some(c => c.country === visa.country);
            
            return `
                <div class="country-selection-item ${isSelected ? 'selected' : ''}" 
                     ${!isSelected ? `onclick="visaApp.addToComparison('${visa.country}')"` : ''}>
                    <span class="flag" style="font-size: 24px;">${visa.flag}</span>
                    <div>
                        <h4 style="margin: 0 0 4px; font-size: 15px;">${visa.country}</h4>
                        <p style="margin: 0; font-size: 13px; color: var(--gray-600);">${visa.embassy} • ${visa.visaType}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    filterCountrySelection(query) {
        this.renderCountrySelectionList(query);
    }

    addToComparison(countryName) {
        const visa = this.visaData.find(v => v.country === countryName);
        if (!visa || this.comparisonCountries.length >= this.maxComparisons) return;
        
        if (!this.comparisonCountries.some(c => c.country === countryName)) {
            this.comparisonCountries.push(visa);
            this.closeCountrySelection();
            this.updateComparisonView();
        }
    }

    removeFromComparison(countryName) {
        this.comparisonCountries = this.comparisonCountries.filter(c => c.country !== countryName);
        this.updateComparisonView();
    }

    updateComparisonView() {
        this.renderSelectedCountries();
        this.renderComparisonTable();
    }

    renderSelectedCountries() {
        const container = document.getElementById('selectedCountries');
        
        container.innerHTML = this.comparisonCountries.map(visa => `
            <div class="country-chip">
                <span>${visa.flag}</span>
                <span>${visa.country}</span>
                <button class="remove-chip" onclick="visaApp.removeFromComparison('${visa.country}')">&times;</button>
            </div>
        `).join('');
        
        // Show/hide add button
        const addBtn = document.getElementById('addCountryBtn');
        if (addBtn) {
            addBtn.style.display = this.comparisonCountries.length >= this.maxComparisons ? 'none' : 'flex';
        }
    }

    renderComparisonTable() {
        const content = document.getElementById('comparisonContent');
        
        if (this.comparisonCountries.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 64px; color: var(--gray-500);">
                    <p style="font-size: 16px; margin-bottom: 8px;">No countries selected for comparison</p>
                    <p style="font-size: 14px;">Click "Add Country" to get started</p>
                </div>
            `;
            return;
        }
        
        const metrics = [
            { key: 'visaType', label: 'Visa Type' },
            { key: 'visaCost', label: 'Cost' },
            { key: 'processing', label: 'Processing Time' },
            { key: 'visaNeeded', label: 'Requirements' },
            { key: 'extension', label: 'Extension Policy' },
            { key: 'links', label: 'Apply Online' }
        ];
        
        content.innerHTML = `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        ${this.comparisonCountries.map(visa => `
                            <th style="text-align: center;">
                                <div>${visa.flag}</div>
                                <div style="font-weight: 700; margin-top: 8px;">${visa.country}</div>
                                <div style="font-size: 12px; color: var(--gray-600);">${visa.embassy}</div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${metrics.map(metric => `
                        <tr>
                            <td class="metric-label">${metric.label}</td>
                            ${this.comparisonCountries.map(visa => `
                                <td>${this.getMetricValue(visa, metric.key)}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    getMetricValue(visa, key) {
        switch(key) {
            case 'processing':
                return this.getProcessingTime(visa);
            case 'links':
                return visa.links.length > 0 
                    ? `<a href="${visa.links[0].url}" target="_blank" style="color: var(--primary);">Apply Online →</a>`
                    : 'Apply at Embassy';
            default:
                return visa[key] || 'N/A';
        }
    }

    downloadVisaData() {
        // Create CSV content
        const headers = ['Country', 'Embassy', 'Visa Type', 'Cost', 'Processing Time', 'Extension Policy'];
        const rows = this.filteredData.map(visa => [
            visa.country,
            visa.embassy,
            visa.visaType,
            visa.visaCost,
            this.getProcessingTime(visa),
            visa.extension
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visa-requirements-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

// Style additions for detail modal
const style = document.createElement('style');
style.textContent = `
    .visa-detail-content {
        max-width: 600px;
        margin: 0 auto;
    }
    
    .detail-header {
        text-align: center;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--gray-200);
        margin-bottom: 24px;
    }
    
    .detail-header h3 {
        font-size: 24px;
        color: var(--gray-900);
        margin: 0 0 8px;
    }
    
    .visa-type {
        color: var(--gray-600);
        font-size: 16px;
    }
    
    .detail-section {
        margin-bottom: 32px;
    }
    
    .detail-section h4 {
        font-size: 16px;
        font-weight: 600;
        color: var(--gray-900);
        margin: 0 0 12px;
    }
    
    .detail-section p {
        color: var(--gray-700);
        line-height: 1.6;
    }
    
    .detail-section ol {
        margin: 0;
        padding-left: 20px;
    }
    
    .detail-section li {
        margin-bottom: 8px;
        color: var(--gray-700);
        line-height: 1.6;
    }
    
    .links-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .links-list li {
        margin-bottom: 8px;
    }
    
    .links-list a {
        color: var(--primary);
        text-decoration: none;
        font-weight: 500;
    }
    
    .links-list a:hover {
        text-decoration: underline;
    }
`;
document.head.appendChild(style);

// Initialize app
const visaApp = new VisaInformationApp();