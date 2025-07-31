// Embassy Details Page JavaScript

class EmbassyDetailsApp {
    constructor() {
        this.embassyData = null;
        this.selectedEmbassy = null;
        this.comparisonEmbassies = [];
        this.isComparing = false;
        this.isDariMode = false;
        this.sivChart = null;
        this.fullHistoryChart = null;
        
        this.init();
    }

    async init() {
        await this.loadEmbassyData();
        this.setupEventListeners();
        this.checkURLParams();
        this.renderEmbassyGrid();
    }

    async loadEmbassyData() {
        try {
            const response = await fetch('data/embassy-siv-data.json');
            const data = await response.json();
            this.embassyData = data.embassies;
        } catch (error) {
            console.error('Error loading embassy data:', error);
        }
    }

    setupEventListeners() {
        // Mobile menu toggle
        document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
            document.getElementById('sideNav').classList.toggle('active');
        });

        // Dari translation toggle
        document.getElementById('translateToDari').addEventListener('click', () => {
            this.toggleDariTranslation();
        });

        // Compare destinations button
        document.getElementById('compareDestinationsBtn').addEventListener('click', () => {
            this.showComparisonInterface();
        });

        // Comparison interface buttons
        document.getElementById('startComparingBtn').addEventListener('click', () => {
            this.startComparison();
        });

        document.getElementById('cancelComparisonBtn').addEventListener('click', () => {
            this.hideComparisonInterface();
        });

        document.getElementById('exitComparisonBtn').addEventListener('click', () => {
            this.exitComparison();
        });

        // Modal controls
        document.getElementById('expandDataBtn').addEventListener('click', () => {
            this.showFullHistoryModal();
        });

        document.getElementById('closeDataModal').addEventListener('click', () => {
            this.hideFullHistoryModal();
        });

        // Modal backdrop click
        document.getElementById('dataModal').addEventListener('click', (e) => {
            if (e.target.id === 'dataModal') {
                this.hideFullHistoryModal();
            }
        });
    }

    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const embassyName = urlParams.get('embassy');
        
        if (embassyName && this.embassyData) {
            const embassy = this.embassyData.find(e => 
                e.embassy.toLowerCase() === embassyName.toLowerCase()
            );
            
            if (embassy) {
                this.selectEmbassy(embassy);
            }
        }
    }

    renderEmbassyGrid() {
        const embassyGrid = document.getElementById('embassyGrid');
        if (!this.embassyData) return;

        embassyGrid.innerHTML = this.embassyData.map(embassy => {
            const totalCases = Object.values(embassy.monthlyData).reduce((sum, val) => sum + val, 0);
            const flag = this.getCountryFlag(embassy.country);
            
            return `
                <div class="embassy-card" data-embassy="${embassy.embassy}" onclick="embassyApp.selectEmbassy(${JSON.stringify(embassy).replace(/"/g, '&quot;')})">
                    <div class="flag">${flag}</div>
                    <div class="name">${embassy.embassy}</div>
                    <div class="country">${embassy.country}</div>
                    <div class="total-cases">${totalCases.toLocaleString()} total cases</div>
                </div>
            `;
        }).join('');
    }

    getCountryFlag(country) {
        const flags = {
            'Qatar': '🇶🇦', 'Pakistan': '🇵🇰', 'Germany': '🇩🇪', 'Albania': '🇦🇱',
            'Turkey': '🇹🇷', 'Canada': '🇨🇦', 'UAE': '🇦🇪', 'Rwanda': '🇷🇼',
            'Iraq': '🇮🇶', 'Tajikistan': '🇹🇯', 'United Kingdom': '🇬🇧',
            'Philippines': '🇵🇭', 'France': '🇫🇷', 'Oman': '🇴🇲',
            'Uzbekistan': '🇺🇿', 'Italy': '🇮🇹', 'Sweden': '🇸🇪',
            'Kenya': '🇰🇪', 'India': '🇮🇳', 'Brazil': '🇧🇷',
            'Japan': '🇯🇵', 'Saudi Arabia': '🇸🇦', 'Spain': '🇪🇸',
            'Australia': '🇦🇺', 'Belgium': '🇧🇪', 'Kosovo': '🇽🇰',
            'Austria': '🇦🇹', 'New Zealand': '🇳🇿', 'Kazakhstan': '🇰🇿',
            'Ireland': '🇮🇪', 'Jordan': '🇯🇴', 'Greece': '🇬🇷',
            'Finland': '🇫🇮', 'Lithuania': '🇱🇹', 'Poland': '🇵🇱',
            'China': '🇨🇳', 'Malaysia': '🇲🇾', 'Switzerland': '🇨🇭',
            'Czech Republic': '🇨🇿', 'Vietnam': '🇻🇳', 'Kyrgyzstan': '🇰🇬',
            'Indonesia': '🇮🇩', 'Romania': '🇷🇴', 'Slovakia': '🇸🇰',
            'Bangladesh': '🇧🇩', 'Turkmenistan': '🇹🇲', 'South Africa': '🇿🇦',
            'Bulgaria': '🇧🇬', 'Egypt': '🇪🇬', 'Iceland': '🇮🇸',
            'Hungary': '🇭🇺', 'Tanzania': '🇹🇿', 'Nepal': '🇳🇵',
            'Netherlands': '🇳🇱'
        };
        return flags[country] || '🏛️';
    }

    async selectEmbassy(embassy) {
        this.selectedEmbassy = embassy;
        
        // Hide embassy selection and show loading
        document.getElementById('embassySelection').style.display = 'none';
        document.getElementById('embassyDetailsContent').style.display = 'block';
        document.getElementById('loadingSection').style.display = 'block';
        document.getElementById('embassyInfoSections').style.display = 'none';

        // Update header
        document.getElementById('embassyName').textContent = embassy.embassy;
        document.getElementById('embassyLocation').textContent = `${embassy.embassy}, ${embassy.country}`;

        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('embassy', embassy.embassy);
        window.history.pushState({}, '', url);

        try {
            // Load embassy information
            await this.loadEmbassyInformation(embassy);
            
            // Hide loading and show content
            document.getElementById('loadingSection').style.display = 'none';
            document.getElementById('embassyInfoSections').style.display = 'block';
            
            // Render charts and data
            this.renderSIVChart();
            
        } catch (error) {
            console.error('Error loading embassy information:', error);
            document.getElementById('loadingSection').innerHTML = `
                <div style="color: #dc3545;">
                    <h3>Error Loading Information</h3>
                    <p>We encountered an error while loading embassy information. Please try again later.</p>
                    <button onclick="location.reload()" class="retry-btn">Retry</button>
                </div>
            `;
        }
    }

    async loadEmbassyInformation(embassy) {
        // This function will make API calls to get detailed embassy information
        const embassyInfo = await this.getEmbassyInfoFromAPI(embassy);
        
        // Render all sections
        this.renderEmbassyLinks(embassyInfo.links);
        this.renderVisaInfo(embassyInfo.visaInfo);
        this.renderMedicalInfo(embassyInfo.medicalInfo);
        this.renderNGOList(embassyInfo.ngos);
        this.renderTravelCosts(embassyInfo.travelCosts);
        this.renderLivingExpenses(embassyInfo.livingExpenses);
        this.renderChecklists(embassyInfo.checklists);
    }

    async getEmbassyInfoFromAPI(embassy) {
        // Check if secure API configuration exists
        if (!window.API_CONFIG || !window.API_CONFIG.SECURE_MODE) {
            console.warn('Secure API not configured');
            return this.getFallbackEmbassyInfo(embassy);
        }

        try {
            const response = await this.callNetlifyFunction(embassy);
            return response.data;
        } catch (error) {
            console.error('Error calling embassy info API:', error);
            return this.getFallbackEmbassyInfo(embassy);
        }
    }

    createEmbassyInfoPrompt(embassy) {
        return `Please provide comprehensive information for Afghan SIV applicants about ${embassy.embassy}, ${embassy.country}. Return the information as a JSON object with the following structure:

{
  "links": [
    {"title": "US Embassy Website", "url": "...", "description": "..."},
    {"title": "Visa Office", "url": "...", "description": "..."}
  ],
  "visaInfo": {
    "visaRequired": "Yes/No",
    "visaType": "e-visa/VOA/Embassy application",
    "visaLength": "Duration of stay allowed",
    "extensionPossible": "Yes/No",
    "visaFee": "Cost in USD",
    "extensionFee": "Cost in USD if applicable"
  },
  "medicalInfo": {
    "location": "Where to book medical exam",
    "fee": "Cost in USD",
    "bookingInfo": "How to book",
    "additionalInfo": "Other relevant details"
  },
  "ngos": [
    {"name": "NGO Name", "contact": "email/phone", "services": "What they help with"}
  ],
  "travelCosts": {
    "flightCost": "Average cost from Kabul in USD",
    "overlandCost": "If applicable, overland travel cost",
    "transitInfo": "Transit requirements"
  },
  "livingExpenses": {
    "dailyRoom": "Cost per day for basic accommodation in USD",
    "monthlyRoom": "Cost per month for basic accommodation in USD",
    "dailyMeals": "Average daily food cost in USD",
    "localTransport": "Daily transport cost in USD"
  },
  "checklists": {
    "hostCountry": [
      "Document requirement 1",
      "Document requirement 2"
    ],
    "sivInterview": [
      "SIV document requirement 1",
      "SIV document requirement 2"
    ]
  }
}

Please ensure all information is current, accurate, and specifically relevant for Afghan nationals applying for SIV. Include actual websites, contact information, and realistic cost estimates.`;
    }

    async callNetlifyFunction(embassy) {
        const response = await fetch(window.API_CONFIG.EMBASSY_INFO_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                embassy: embassy.embassy,
                country: embassy.country
            })
        });

        if (!response.ok) {
            throw new Error(`Netlify function error: ${response.status}`);
        }

        const data = await response.json();
        
        // Check if the function returned an error (API key not configured, etc.)
        if (data.error) {
            if (data.error === 'API_KEY_NOT_CONFIGURED') {
                console.warn('OpenAI API key not configured on server');
            }
            throw new Error(data.message || 'API call failed');
        }

        return data;
    }

    getFallbackEmbassyInfo(embassy) {
        // Provide fallback information when API is not available
        return {
            links: [
                {
                    title: "US Embassy Website",
                    url: `https://embassy-finder.com/${embassy.country.toLowerCase()}`,
                    description: "Official US Embassy website with visa information"
                }
            ],
            visaInfo: {
                visaRequired: "Please check current requirements",
                visaType: "Varies by country",
                visaLength: "Contact embassy for details",
                extensionPossible: "Contact local authorities",
                visaFee: "Contact embassy for current fees",
                extensionFee: "Varies"
            },
            medicalInfo: {
                location: "Contact US Embassy for approved medical facilities",
                fee: "Contact medical facility for current fees",
                bookingInfo: "Embassy will provide list of approved doctors",
                additionalInfo: "Medical exam must be completed at embassy-approved facility"
            },
            ngos: [
                {
                    name: "Local Refugee Assistance Organizations",
                    contact: "Contact US Embassy for referrals",
                    services: "SIV process guidance and support"
                }
            ],
            travelCosts: {
                flightCost: "Varies by route and season",
                overlandCost: "Contact travel agencies for current rates",
                transitInfo: "Check visa requirements for transit countries"
            },
            livingExpenses: {
                dailyRoom: "Contact local accommodations",
                monthlyRoom: "Varies by location and quality",
                dailyMeals: "Varies",
                localTransport: "Contact local transport services"
            },
            checklists: {
                hostCountry: [
                    "Valid passport",
                    "Entry visa (if required)",
                    "Proof of accommodation",
                    "Financial support documentation"
                ],
                sivInterview: [
                    "Form DS-260",
                    "Supporting SIV documents",
                    "Medical examination results",
                    "Passport photos",
                    "Birth certificates",
                    "Marriage certificate (if applicable)"
                ]
            }
        };
    }

    renderSIVChart() {
        const ctx = document.getElementById('sivChart').getContext('2d');
        const currentYear = new Date().getFullYear();
        
        // Get current year data
        const monthlyData = this.selectedEmbassy.monthlyData;
        const currentYearData = {};
        
        for (const [dateKey, value] of Object.entries(monthlyData)) {
            const [year, month] = dateKey.split('-');
            if (parseInt(year) === currentYear) {
                currentYearData[month] = value;
            }
        }

        // Create chart data
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = months.map(month => currentYearData[month] || 0);

        if (this.sivChart) {
            this.sivChart.destroy();
        }

        this.sivChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthNames,
                datasets: [{
                    label: `${currentYear} SIV Issuances`,
                    data: data,
                    backgroundColor: 'rgba(26, 58, 82, 0.8)',
                    borderColor: 'rgba(26, 58, 82, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${this.selectedEmbassy.embassy} - ${currentYear} SIV Issuances`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    showFullHistoryModal() {
        document.getElementById('dataModal').style.display = 'block';
        this.renderFullHistoryChart();
    }

    hideFullHistoryModal() {
        document.getElementById('dataModal').style.display = 'none';
        if (this.fullHistoryChart) {
            this.fullHistoryChart.destroy();
            this.fullHistoryChart = null;
        }
    }

    renderFullHistoryChart() {
        const ctx = document.getElementById('fullHistoryChart').getContext('2d');
        const monthlyData = this.selectedEmbassy.monthlyData;
        
        // Sort dates and create labels and data
        const sortedEntries = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b));
        const labels = sortedEntries.map(([date]) => {
            const [year, month] = date.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
        });
        const data = sortedEntries.map(([, value]) => value);

        if (this.fullHistoryChart) {
            this.fullHistoryChart.destroy();
        }

        this.fullHistoryChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'SIV Issuances',
                    data: data,
                    borderColor: 'rgba(26, 58, 82, 1)',
                    backgroundColor: 'rgba(26, 58, 82, 0.1)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${this.selectedEmbassy.embassy} - Complete SIV Issuance History`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    renderEmbassyLinks(links) {
        const container = document.getElementById('embassyLinks');
        container.innerHTML = links.map(link => `
            <div class="info-card">
                <h3>${link.title}</h3>
                <p>${link.description}</p>
                <a href="${link.url}" target="_blank" rel="noopener noreferrer">Visit Website →</a>
            </div>
        `).join('');
    }

    renderVisaInfo(visaInfo) {
        const container = document.getElementById('visaInfo');
        container.innerHTML = `
            <div class="info-card">
                <h3>Visa Requirement</h3>
                <p><strong>Required:</strong> ${visaInfo.visaRequired}</p>
                <p><strong>Type:</strong> ${visaInfo.visaType}</p>
            </div>
            <div class="info-card">
                <h3>Visa Duration & Extension</h3>
                <p><strong>Length:</strong> ${visaInfo.visaLength}</p>
                <p><strong>Extension Possible:</strong> ${visaInfo.extensionPossible}</p>
            </div>
            <div class="info-card">
                <h3>Fees</h3>
                <p><strong>Visa Fee:</strong> ${visaInfo.visaFee}</p>
                <p><strong>Extension Fee:</strong> ${visaInfo.extensionFee}</p>
            </div>
        `;
    }

    renderMedicalInfo(medicalInfo) {
        const container = document.getElementById('medicalInfo');
        container.innerHTML = `
            <div class="medical-card">
                <h4>📍 Examination Location</h4>
                <p>${medicalInfo.location}</p>
            </div>
            <div class="medical-card">
                <h4>💰 Examination Fee</h4>
                <p>${medicalInfo.fee}</p>
            </div>
            <div class="medical-card">
                <h4>📅 Booking Information</h4>
                <p>${medicalInfo.bookingInfo}</p>
            </div>
            <div class="medical-card">
                <h4>ℹ️ Additional Information</h4>
                <p>${medicalInfo.additionalInfo}</p>
            </div>
        `;
    }

    renderNGOList(ngos) {
        const container = document.getElementById('ngoList');
        container.innerHTML = ngos.map(ngo => `
            <div class="ngo-card">
                <h4>${ngo.name}</h4>
                <div class="ngo-contact"><strong>Contact:</strong> ${ngo.contact}</div>
                <div class="ngo-contact"><strong>Services:</strong> ${ngo.services}</div>
            </div>
        `).join('');
    }

    renderTravelCosts(travelCosts) {
        const container = document.getElementById('travelCosts');
        container.innerHTML = `
            <div class="cost-card">
                <div class="cost-amount">${travelCosts.flightCost}</div>
                <div class="cost-label">Flight from Kabul</div>
            </div>
            <div class="cost-card">
                <div class="cost-amount">${travelCosts.overlandCost}</div>
                <div class="cost-label">Overland Travel</div>
            </div>
            <div class="info-card" style="grid-column: 1 / -1;">
                <h3>Transit Information</h3>
                <p>${travelCosts.transitInfo}</p>
            </div>
        `;
    }

    renderLivingExpenses(livingExpenses) {
        const container = document.getElementById('livingExpenses');
        container.innerHTML = `
            <div class="cost-card">
                <div class="cost-amount">${livingExpenses.dailyRoom}</div>
                <div class="cost-label">Daily Room</div>
            </div>
            <div class="cost-card">
                <div class="cost-amount">${livingExpenses.monthlyRoom}</div>
                <div class="cost-label">Monthly Room</div>
            </div>
            <div class="cost-card">
                <div class="cost-amount">${livingExpenses.dailyMeals}</div>
                <div class="cost-label">Daily Meals</div>
            </div>
            <div class="cost-card">
                <div class="cost-amount">${livingExpenses.localTransport}</div>
                <div class="cost-label">Local Transport</div>
            </div>
        `;
    }

    renderChecklists(checklists) {
        document.getElementById('hostCountryChecklist').innerHTML = 
            checklists.hostCountry.map(item => `
                <div class="checklist-item">
                    <div class="checklist-icon">✓</div>
                    <div class="checklist-text">${item}</div>
                </div>
            `).join('');

        document.getElementById('sivInterviewChecklist').innerHTML = 
            checklists.sivInterview.map(item => `
                <div class="checklist-item">
                    <div class="checklist-icon">✓</div>
                    <div class="checklist-text">${item}</div>
                </div>
            `).join('');
    }

    showComparisonInterface() {
        document.getElementById('comparisonInterface').style.display = 'block';
        this.renderEmbassySelector();
    }

    hideComparisonInterface() {
        document.getElementById('comparisonInterface').style.display = 'none';
        this.comparisonEmbassies = [];
        this.updateSelectedEmbassies();
    }

    renderEmbassySelector() {
        const container = document.getElementById('embassySelector');
        const availableEmbassies = this.embassyData.filter(e => e.embassy !== this.selectedEmbassy.embassy);
        
        container.innerHTML = availableEmbassies.map(embassy => `
            <label class="embassy-checkbox">
                <input type="checkbox" value="${embassy.embassy}" onchange="embassyApp.toggleEmbassyForComparison('${embassy.embassy}')">
                <span>${embassy.embassy}, ${embassy.country}</span>
            </label>
        `).join('');
    }

    toggleEmbassyForComparison(embassyName) {
        const embassy = this.embassyData.find(e => e.embassy === embassyName);
        if (!embassy) return;

        const index = this.comparisonEmbassies.findIndex(e => e.embassy === embassyName);
        if (index > -1) {
            this.comparisonEmbassies.splice(index, 1);
        } else if (this.comparisonEmbassies.length < 4) {
            this.comparisonEmbassies.push(embassy);
        } else {
            alert('You can only compare up to 4 additional locations.');
            event.target.checked = false;
            return;
        }

        this.updateSelectedEmbassies();
    }

    updateSelectedEmbassies() {
        const container = document.getElementById('selectedEmbassies');
        container.innerHTML = this.comparisonEmbassies.map(embassy => `
            <div class="selected-embassy-tag">
                ${embassy.embassy}, ${embassy.country}
                <button class="remove-embassy" onclick="embassyApp.removeEmbassyFromComparison('${embassy.embassy}')">&times;</button>
            </div>
        `).join('');

        document.getElementById('startComparingBtn').disabled = this.comparisonEmbassies.length === 0;
    }

    removeEmbassyFromComparison(embassyName) {
        this.comparisonEmbassies = this.comparisonEmbassies.filter(e => e.embassy !== embassyName);
        this.updateSelectedEmbassies();
        
        // Update checkbox
        const checkbox = document.querySelector(`input[value="${embassyName}"]`);
        if (checkbox) checkbox.checked = false;
    }

    async startComparison() {
        this.isComparing = true;
        document.getElementById('comparisonInterface').style.display = 'none';
        document.getElementById('embassyInfoSections').style.display = 'none';
        document.getElementById('loadingSection').style.display = 'block';
        document.getElementById('loadingSection').innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading comparison data for ${this.comparisonEmbassies.length + 1} embassies...</p>
        `;

        try {
            // Load information for all comparison embassies
            const allEmbassies = [this.selectedEmbassy, ...this.comparisonEmbassies];
            const comparisonData = [];

            for (const embassy of allEmbassies) {
                const info = await this.getEmbassyInfoFromAPI(embassy);
                comparisonData.push({
                    embassy: embassy,
                    info: info
                });
            }

            this.renderComparisonTable(comparisonData);
            
            document.getElementById('loadingSection').style.display = 'none';
            document.getElementById('comparisonResults').style.display = 'block';
            
        } catch (error) {
            console.error('Error loading comparison data:', error);
            document.getElementById('loadingSection').innerHTML = `
                <div style="color: #dc3545;">
                    <h3>Error Loading Comparison</h3>
                    <p>We encountered an error while loading comparison data. Please try again.</p>
                    <button onclick="embassyApp.exitComparison()" class="retry-btn">Go Back</button>
                </div>
            `;
        }
    }

    renderComparisonTable(comparisonData) {
        const container = document.getElementById('comparisonTable');
        
        const headers = ['Category', ...comparisonData.map(d => `${d.embassy.embassy}, ${d.embassy.country}`)];
        
        const rows = [
            ['SIV Cases (Current Year)', ...comparisonData.map(d => this.getCurrentYearTotal(d.embassy))],
            ['SIV Cases (All Time)', ...comparisonData.map(d => Object.values(d.embassy.monthlyData).reduce((sum, val) => sum + val, 0).toLocaleString())],
            ['Visa Required', ...comparisonData.map(d => d.info.visaInfo.visaRequired)],
            ['Visa Type', ...comparisonData.map(d => d.info.visaInfo.visaType)],
            ['Visa Fee', ...comparisonData.map(d => d.info.visaInfo.visaFee)],
            ['Flight Cost from Kabul', ...comparisonData.map(d => d.info.travelCosts.flightCost)],
            ['Daily Room Cost', ...comparisonData.map(d => d.info.livingExpenses.dailyRoom)],
            ['Monthly Room Cost', ...comparisonData.map(d => d.info.livingExpenses.monthlyRoom)],
            ['Medical Exam Fee', ...comparisonData.map(d => d.info.medicalInfo.fee)]
        ];

        let tableHTML = `
            <table class="comparison-table">
                <thead>
                    <tr>
                        ${headers.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            <td class="category-header">${row[0]}</td>
                            ${row.slice(1).map(cell => `<td>${cell}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    getCurrentYearTotal(embassy) {
        const currentYear = new Date().getFullYear();
        const monthlyData = embassy.monthlyData;
        let total = 0;
        
        for (const [dateKey, value] of Object.entries(monthlyData)) {
            const [year] = dateKey.split('-');
            if (parseInt(year) === currentYear) {
                total += value;
            }
        }
        
        return total.toLocaleString();
    }

    exitComparison() {
        this.isComparing = false;
        document.getElementById('comparisonResults').style.display = 'none';
        document.getElementById('embassyInfoSections').style.display = 'block';
        this.comparisonEmbassies = [];
    }

    async toggleDariTranslation() {
        this.isDariMode = !this.isDariMode;
        
        if (this.isDariMode) {
            await this.translateToDari();
            document.body.classList.add('rtl');
        } else {
            this.restoreEnglish();
            document.body.classList.remove('rtl');
        }
    }

    async translateToDari() {
        // This would integrate with translation API
        // For now, we'll show a placeholder
        alert('Dari translation feature will be implemented with the API integration.');
    }

    restoreEnglish() {
        // Restore original English content
        location.reload();
    }
}

// Initialize the application
let embassyApp;
document.addEventListener('DOMContentLoaded', () => {
    embassyApp = new EmbassyDetailsApp();
});