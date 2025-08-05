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
        // Visa data from the Excel file
        this.visaData = [
            {
                rank: 1,
                embassy: "Islamabad",
                country: "Pakistan",
                flag: "🇵🇰",
                visaNeeded: "Yes, Pakistani visa required",
                visaType: "Visitor visa (Pakistan Online Visa System)",
                visaCost: "≈US$50–100",
                processingSteps: [
                    "Apply online via https://visa.nadra.gov.pk",
                    "Upload passport copy, photo, invitation letter (if applicable)",
                    "Pay fee online",
                    "Print e-visa after approval (usually 7-10 business days)"
                ],
                extension: "Possible - apply at local immigration office. Extension fees vary (≈PKR 3,000–5,000)",
                links: [
                    { text: "Pakistan Online Visa System", url: "https://visa.nadra.gov.pk" },
                    { text: "Embassy of Pakistan in Kabul", url: "https://www.pakembassykabul.org" }
                ],
                tags: ["evisa"]
            },
            {
                rank: 2,
                embassy: "Doha",
                country: "Qatar",
                flag: "🇶🇦",
                visaNeeded: "Yes, Qatari visa required",
                visaType: "Hayya e-visa (tourist/entry visa)",
                visaCost: "≈QAR 100 (≈US$27)",
                processingSteps: [
                    "Apply via Hayya Portal: https://www.qatar2022.qa/hayya",
                    "Upload documents: passport, photo, proof of accommodation",
                    "Pay online",
                    "Download Hayya card after approval"
                ],
                extension: "Extensions handled through Ministry of Interior. Cost varies.",
                links: [
                    { text: "Hayya Portal", url: "https://www.qatar2022.qa/hayya" },
                    { text: "Qatar e-Visa Portal", url: "https://www.qatarvisaservice.com" }
                ],
                tags: ["evisa"]
            },
            {
                rank: 3,
                embassy: "Tirana",
                country: "Albania",
                flag: "🇦🇱",
                visaNeeded: "Yes, Albanian visa required",
                visaType: "Short-stay Albanian e-Visa",
                visaCost: "≈€50",
                processingSteps: [
                    "Apply at https://e-visa.al",
                    "Upload passport scan, photo, travel insurance, accommodation proof",
                    "Pay fee online",
                    "Receive e-visa by email (5-10 business days)"
                ],
                extension: "Possible through local immigration office for ≈€30",
                links: [
                    { text: "Albania e-Visa Portal", url: "https://e-visa.al" }
                ],
                tags: ["evisa"]
            },
            {
                rank: 4,
                embassy: "Ankara",
                country: "Turkey",
                flag: "🇹🇷",
                visaNeeded: "Yes, Turkish visa required",
                visaType: "Turkish e-visa or sticker visa",
                visaCost: "≈US$60",
                processingSteps: [
                    "Check e-visa eligibility at https://www.evisa.gov.tr",
                    "If eligible: Apply online, pay, receive e-visa",
                    "If not eligible: Apply at Turkish embassy/consulate with full documentation",
                    "Processing time: e-visa (minutes), sticker visa (5-15 days)"
                ],
                extension: "Possible at provincial immigration offices. Fees vary.",
                links: [
                    { text: "Turkey e-Visa", url: "https://www.evisa.gov.tr" },
                    { text: "Turkish Embassy Kabul", url: "https://kabul.emb.mfa.gov.tr" }
                ],
                tags: ["evisa"]
            },
            {
                rank: 5,
                embassy: "Frankfurt",
                country: "Germany",
                flag: "🇩🇪",
                visaNeeded: "Yes, Schengen visa required",
                visaType: "Schengen short-stay visa",
                visaCost: "€90 (increased June 2024)",
                processingSteps: [
                    "Schedule appointment via embassy website",
                    "Complete application form",
                    "Gather documents: passport, photos, insurance, proof of funds, accommodation",
                    "Attend appointment for biometrics",
                    "Wait 15-30 days for decision"
                ],
                extension: "Very limited - must show exceptional circumstances",
                links: [
                    { text: "Germany Visa Info", url: "https://www.germany.info/us-en/service/visa" },
                    { text: "VFS Global (Visa Service)", url: "https://www.vfsglobal.com/germany/pakistan" }
                ],
                tags: ["schengen"]
            },
            {
                rank: 6,
                embassy: "Montreal",
                country: "Canada",
                flag: "🇨🇦",
                visaNeeded: "Yes, Canadian visa required",
                visaType: "Visitor visa (TRV)",
                visaCost: "CA$100 + biometrics CA$85 = CA$185",
                processingSteps: [
                    "Apply online via IRCC website",
                    "Upload documents: passport, photos, proof of funds, purpose of visit",
                    "Pay fees online",
                    "Give biometrics at VAC",
                    "Processing time: 4-8 weeks"
                ],
                extension: "Can apply for visitor record before expiry",
                links: [
                    { text: "IRCC Portal", url: "https://www.canada.ca/en/immigration-refugees-citizenship" },
                    { text: "VAC Pakistan", url: "https://visa.vfsglobal.com/pak/en/can" }
                ],
                tags: []
            },
            {
                rank: 7,
                embassy: "Manila",
                country: "Philippines",
                flag: "🇵🇭",
                visaNeeded: "Yes, Philippine visa required",
                visaType: "Tourist/business visa",
                visaCost: "≈US$30-60",
                processingSteps: [
                    "Apply at Philippine embassy/consulate",
                    "Submit: application form, passport, photos, bank statements, itinerary",
                    "Interview may be required",
                    "Processing: 5-10 business days"
                ],
                extension: "Can extend at Bureau of Immigration for ≈PHP 3,000",
                links: [
                    { text: "Philippine Embassy", url: "https://www.dfa.gov.ph" },
                    { text: "Bureau of Immigration", url: "https://immigration.gov.ph" }
                ],
                tags: []
            },
            {
                rank: 8,
                embassy: "Abu Dhabi",
                country: "UAE",
                flag: "🇦🇪",
                visaNeeded: "Yes, UAE visa required",
                visaType: "Tourist visa (sponsored)",
                visaCost: "≈AED 300-500",
                processingSteps: [
                    "Need UAE sponsor (hotel, airline, or resident)",
                    "Apply through sponsor or approved agency",
                    "Submit passport copy, photo, application",
                    "Processing: 3-5 working days"
                ],
                extension: "Can extend for 30 days for ≈AED 1,000",
                links: [
                    { text: "UAE Immigration", url: "https://smartservices.icp.gov.ae" },
                    { text: "GDRFA Dubai", url: "https://www.gdrfad.gov.ae" }
                ],
                tags: []
            },
            {
                rank: 9,
                embassy: "Baghdad",
                country: "Iraq",
                flag: "🇮🇶",
                visaNeeded: "Yes, Iraqi visa required",
                visaType: "Iraqi e-Visa",
                visaCost: "≈US$75-80",
                processingSteps: [
                    "Apply at https://www.mofa.gov.iq/visa",
                    "Fill application, upload documents",
                    "Pay fee online",
                    "Receive e-visa approval (7-10 days)",
                    "Visa stamped on arrival"
                ],
                extension: "Possible at residency office - fees vary",
                links: [
                    { text: "Iraq e-Visa", url: "https://www.mofa.gov.iq/visa" }
                ],
                tags: ["evisa"]
            },
            {
                rank: 10,
                embassy: "Kigali",
                country: "Rwanda",
                flag: "🇷🇼",
                visaNeeded: "Yes, but visa on arrival available",
                visaType: "Tourist visa (e-Visa or on arrival)",
                visaCost: "US$50",
                processingSteps: [
                    "Option 1: Apply online at https://irembo.gov.rw",
                    "Option 2: Get visa on arrival at airport",
                    "Need: passport, yellow fever certificate",
                    "Valid for 30 days"
                ],
                extension: "Can extend at immigration office",
                links: [
                    { text: "Rwanda e-Visa", url: "https://irembo.gov.rw" },
                    { text: "Rwanda Immigration", url: "https://www.migration.gov.rw" }
                ],
                tags: ["evisa", "visa-on-arrival"]
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
                        <span class="detail-label">Processing</span>
                        <span class="detail-value">${this.getProcessingTime(visa)}</span>
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
                    <h4>Cost</h4>
                    <p class="visa-cost" style="font-size: 18px; font-weight: 600;">${visa.visaCost}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Application Process</h4>
                    <ol>
                        ${visa.processingSteps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
                
                <div class="detail-section">
                    <h4>Extension Policy</h4>
                    <p>${visa.extension}</p>
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