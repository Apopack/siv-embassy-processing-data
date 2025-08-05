// Professional Embassy Details Application - Fixed Version

class EmbassyDetailsApp {
    constructor() {
        this.embassyData = null;
        this.selectedEmbassy = null;
        this.searchResults = [];
        this.comparisonEmbassies = [];
        this.isComparing = false;
        this.currentModal = null;
        this.isDariMode = false;
        this.useAPI = localStorage.getItem('useAPI') !== 'false'; // Default to true
        
        this.init();
    }

    async init() {
        await this.loadEmbassyData();
        this.setupEventListeners();
        this.initializeSearch();
        this.initializeAPIToggle();
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
        // Mobile menu toggle (matching main site functionality)
        document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
            document.getElementById('sideNav').classList.toggle('active');
        });

        // Search functionality
        const searchInput = document.getElementById('embassySearch');
        const searchResults = document.getElementById('searchResults');
        
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        searchInput.addEventListener('focus', () => {
            if (this.searchResults.length > 0) {
                searchResults.classList.add('active');
            }
        });

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.classList.remove('active');
            }
        });

        // Sticky action buttons
        document.getElementById('compareBtn').addEventListener('click', () => {
            this.toggleComparisonPanel();
        });

        document.getElementById('translateBtn').addEventListener('click', () => {
            this.toggleTranslation();
        });

        // Info card clicks
        document.addEventListener('click', (e) => {
            const infoCard = e.target.closest('.info-card');
            if (infoCard && this.selectedEmbassy) {
                this.openInfoModal(infoCard.dataset.type);
            }
        });

        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('detailModal').addEventListener('click', (e) => {
            if (e.target.id === 'detailModal') {
                this.closeModal();
            }
        });

        // Escape key to close modal/panels
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeComparisonPanel();
            }
        });
    }

    initializeSearch() {
        if (!this.embassyData) {
            const searchInput = document.getElementById('embassySearch');
            searchInput.disabled = true;
            searchInput.placeholder = 'Loading embassies...';
            return;
        }
        this.searchResults = this.embassyData;
    }

    handleSearch(query) {
        const searchResults = document.getElementById('searchResults');
        
        if (!query.trim()) {
            searchResults.classList.remove('active');
            return;
        }

        const filtered = this.embassyData.filter(embassy => 
            embassy.embassy.toLowerCase().includes(query.toLowerCase()) ||
            embassy.country.toLowerCase().includes(query.toLowerCase())
        );

        this.searchResults = filtered;
        this.renderSearchResults();
        searchResults.classList.add('active');
    }

    renderSearchResults() {
        const searchResults = document.getElementById('searchResults');
        
        if (this.searchResults.length === 0) {
            searchResults.innerHTML = `
                <div class="embassy-result">
                    <div class="embassy-info">
                        <h3>No embassies found</h3>
                        <p>Try searching by embassy name or country</p>
                    </div>
                </div>
            `;
            return;
        }

        searchResults.innerHTML = this.searchResults.slice(0, 8).map(embassy => {
            const currentYearCases = this.getCurrentYearTotal(embassy);
            const flag = this.getCountryFlag(embassy.country);
            
            return `
                <div class="embassy-result" onclick="embassyApp.selectEmbassy('${embassy.embassy}')">
                    <div class="embassy-flag">${flag}</div>
                    <div class="embassy-info">
                        <h3>${embassy.embassy}</h3>
                        <p>${embassy.country} • ${currentYearCases} cases in ${new Date().getFullYear()}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    selectEmbassy(embassyName) {
        const embassy = this.embassyData.find(e => e.embassy === embassyName);
        if (!embassy) return;

        this.selectedEmbassy = embassy;
        
        document.getElementById('searchResults').classList.remove('active');
        document.getElementById('embassySearch').value = `${embassy.embassy}, ${embassy.country}`;
        
        this.showEmbassyDetails();
    }

    async showEmbassyDetails() {
        const embassyDetails = document.getElementById('embassyDetails');
        const embassyLoading = document.getElementById('embassyLoading');
        
        document.getElementById('embassyName').textContent = this.selectedEmbassy.embassy;
        document.getElementById('embassyLocation').textContent = `${this.selectedEmbassy.embassy}, ${this.selectedEmbassy.country}`;
        
        embassyDetails.classList.add('active');
        embassyLoading.style.display = 'flex';
        
        try {
            this.embassyInfo = await this.getEmbassyInfoFromAPI(this.selectedEmbassy);
            embassyLoading.style.display = 'none';
        } catch (error) {
            console.error('Error loading embassy info:', error);
            embassyLoading.innerHTML = `
                <div style="color: var(--danger); text-align: center;">
                    <p>Unable to load embassy information</p>
                    <p style="font-size: 12px; color: var(--gray-500);">Using fallback data</p>
                </div>
            `;
        }
    }

    async openInfoModal(infoType) {
        const modal = document.getElementById('detailModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        this.currentModal = infoType;
        
        const titles = {
            data: 'SIV Processing Data',
            links: 'Official Embassy Resources',
            visa: 'Visa Requirements',
            medical: 'Medical Examinations',
            travel: 'Travel Costs',
            living: 'Living Expenses',
            support: 'Support Organizations',
            documents: 'Document Checklists'
        };
        
        modalTitle.textContent = titles[infoType] || 'Information';
        
        modalBody.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Loading detailed information...
            </div>
        `;
        
        modal.classList.add('active');
        
        try {
            const content = await this.generateModalContent(infoType);
            modalBody.innerHTML = content;
            
            // Render chart for data modal
            if (infoType === 'data') {
                setTimeout(() => this.renderCurrentYearChart(), 100);
            }
        } catch (error) {
            modalBody.innerHTML = `
                <div style="color: var(--danger); text-align: center; padding: 40px;">
                    <p>Unable to load information</p>
                    <p style="font-size: 12px; color: var(--gray-500);">Please try again later</p>
                </div>
            `;
        }
    }

    async generateModalContent(infoType) {
        if (!this.embassyInfo) {
            throw new Error('Embassy information not loaded');
        }

        switch (infoType) {
            case 'data':
                return this.generateDataContent();
            case 'links':
                return this.generateLinksContent();
            case 'visa':
                return this.generateVisaContent();
            case 'medical':
                return this.generateMedicalContent();
            case 'travel':
                return this.generateTravelContent();
            case 'living':
                return this.generateLivingContent();
            case 'support':
                return this.generateSupportContent();
            case 'documents':
                return this.generateDocumentsContent();
            default:
                return '<p>Information not available</p>';
        }
    }

    generateDataContent() {
        const currentYear = new Date().getFullYear();
        const currentYearCases = this.getCurrentYearTotal(this.selectedEmbassy);
        
        return `
            <div style="text-align: center; margin-bottom: 32px;">
                <p style="color: var(--gray-600); margin: 0 0 8px; font-size: 14px;">${currentYear} SIV Issuances by Month</p>
                <h3 style="color: var(--primary); font-size: 28px; margin: 0; font-weight: 700;">${currentYearCases} Total Cases</h3>
            </div>
            
            <div id="modalChart" style="height: 350px; background: var(--gray-50); border-radius: var(--radius); padding: 16px; margin-bottom: 24px;">
                <canvas id="currentYearChart"></canvas>
            </div>
            
            <div style="text-align: center;">
                <button onclick="embassyApp.showAllTimeData()" style="background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: var(--radius); font-size: 14px; font-weight: 600; cursor: pointer; transition: var(--transition);">View All-Time Historical Data (32 Months)</button>
            </div>
        `;
    }

    renderCurrentYearChart() {
        const ctx = document.getElementById('currentYearChart')?.getContext('2d');
        if (!ctx) return;
        
        const currentYear = new Date().getFullYear();
        const monthlyData = this.selectedEmbassy.monthlyData;
        const currentYearData = {};
        
        for (const [dateKey, value] of Object.entries(monthlyData)) {
            const [year, month] = dateKey.split('-');
            if (parseInt(year) === currentYear) {
                currentYearData[month] = value;
            }
        }
        
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = months.map(month => currentYearData[month] || 0);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthNames,
                datasets: [{
                    label: `${currentYear} SIV Issuances`,
                    data: data,
                    backgroundColor: '#1a3a52',
                    borderColor: '#1a3a52',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${this.selectedEmbassy.embassy} - ${currentYear} Monthly SIV Issuances`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 }
                    }
                }
            }
        });
    }

    showAllTimeData() {
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div style="text-align: center; margin-bottom: 24px;">
                <h3 style="color: var(--primary); margin: 0;">Complete SIV Processing History</h3>
                <p style="color: var(--gray-600); margin: 8px 0 0;">32 months of data (October 2022 - May 2025)</p>
            </div>
            <div style="height: 500px; background: var(--gray-50); border-radius: var(--radius); padding: 16px;">
                <canvas id="allTimeChart"></canvas>
            </div>
        `;
        
        setTimeout(() => this.renderAllTimeChart(), 100);
    }

    renderAllTimeChart() {
        const ctx = document.getElementById('allTimeChart')?.getContext('2d');
        if (!ctx) return;
        
        const monthlyData = this.selectedEmbassy.monthlyData;
        const sortedEntries = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b));
        
        const labels = sortedEntries.map(([date]) => {
            const [year, month] = date.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
        });
        
        const data = sortedEntries.map(([, value]) => value);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'SIV Issuances',
                    data: data,
                    borderColor: '#1a3a52',
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
                        text: `${this.selectedEmbassy.embassy} - Complete History`
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    generateLinksContent() {
        const links = this.embassyInfo.links || [];
        
        if (links.length === 0) {
            return '<p style="text-align: center; color: var(--gray-500); padding: 40px;">No official links available</p>';
        }
        
        return links.map(link => `
            <div style="background: var(--gray-50); border-radius: var(--radius); padding: 20px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px; color: var(--gray-900);">${link.title}</h4>
                <p style="margin: 0 0 12px; color: var(--gray-600); font-size: 14px;">${link.description}</p>
                <a href="${link.url}" target="_blank" style="color: var(--primary); font-weight: 600; text-decoration: none;">
                    Visit Website →
                </a>
            </div>
        `).join('');
    }

    generateVisaContent() {
        const visa = this.embassyInfo.visaInfo || {};
        
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: var(--gray-600); font-size: 14px;">Visa Required</p>
                    <h4 style="margin: 0; color: var(--primary); font-size: 16px; font-weight: 700;">${visa.visaRequired || 'Contact embassy'}</h4>
                </div>
                
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: var(--gray-600); font-size: 14px;">Visa Type</p>
                    <h4 style="margin: 0; color: var(--primary); font-size: 16px; font-weight: 700;">${visa.visaType || 'Various types'}</h4>
                </div>
                
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: var(--gray-600); font-size: 14px;">Duration</p>
                    <h4 style="margin: 0; color: var(--primary); font-size: 16px; font-weight: 700;">${visa.visaLength || 'Varies'}</h4>
                </div>
                
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: var(--gray-600); font-size: 14px;">Fee</p>
                    <h4 style="margin: 0; color: var(--primary); font-size: 16px; font-weight: 700;">${visa.visaFee || 'Contact embassy'}</h4>
                </div>
            </div>
        `;
    }

    generateMedicalContent() {
        const medical = this.embassyInfo.medicalInfo || {};
        
        return `
            <div style="display: grid; gap: 20px;">
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: var(--gray-600); font-size: 14px;">📍 Examination Location</p>
                    <h4 style="margin: 0; color: var(--primary); font-size: 16px; font-weight: 700;">${medical.location || 'Contact US Embassy'}</h4>
                </div>
                
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: var(--gray-600); font-size: 14px;">💰 Examination Fee</p>
                    <h4 style="margin: 0; color: var(--primary); font-size: 16px; font-weight: 700;">${medical.fee || 'Contact facility'}</h4>
                </div>
                
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: var(--gray-600); font-size: 14px;">📅 Booking Info</p>
                    <h4 style="margin: 0; color: var(--primary); font-size: 16px; font-weight: 700;">${medical.bookingInfo || 'Embassy approved doctors'}</h4>
                </div>
            </div>
        `;
    }

    generateTravelContent() {
        const travel = this.embassyInfo.travelCosts || {};
        
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: var(--gray-600); font-size: 14px;">✈️ Flight from Kabul</p>
                    <h4 style="margin: 0; color: var(--primary); font-size: 18px; font-weight: 700;">${travel.flightCost || 'Varies'}</h4>
                </div>
                
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: var(--gray-600); font-size: 14px;">🚗 Overland Travel</p>
                    <h4 style="margin: 0; color: var(--primary); font-size: 18px; font-weight: 700;">${travel.overlandCost || 'N/A'}</h4>
                </div>
            </div>
            
            <div style="background: var(--gray-50); border-radius: var(--radius); padding: 20px; margin-top: 20px;">
                <h4 style="margin: 0 0 12px; color: var(--gray-900);">Transit Information</h4>
                <p style="margin: 0; color: var(--gray-700); line-height: 1.6;">${travel.transitInfo || 'Check visa requirements for transit countries'}</p>
            </div>
        `;
    }

    generateLivingContent() {
        const living = this.embassyInfo.livingExpenses || {};
        
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: var(--gray-600); font-size: 14px;">Daily Room</p>
                    <h4 style="margin: 0; color: var(--primary); font-size: 18px; font-weight: 700;">${living.dailyRoom || 'Varies'}</h4>
                </div>
                
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: var(--gray-600); font-size: 14px;">Monthly Room</p>
                    <h4 style="margin: 0; color: var(--primary); font-size: 18px; font-weight: 700;">${living.monthlyRoom || 'Varies'}</h4>
                </div>
                
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: var(--gray-600); font-size: 14px;">Daily Meals</p>
                    <h4 style="margin: 0; color: var(--primary); font-size: 18px; font-weight: 700;">${living.dailyMeals || 'Varies'}</h4>
                </div>
                
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: var(--gray-600); font-size: 14px;">Local Transport</p>
                    <h4 style="margin: 0; color: var(--primary); font-size: 18px; font-weight: 700;">${living.localTransport || 'Varies'}</h4>
                </div>
            </div>
        `;
    }

    generateSupportContent() {
        const ngos = this.embassyInfo.ngos || [];
        
        if (ngos.length === 0) {
            return '<p style="text-align: center; color: var(--gray-500); padding: 40px;">No support organizations listed.<br>Contact US Embassy for referrals.</p>';
        }
        
        return ngos.map(ngo => `
            <div style="background: var(--gray-50); border-radius: var(--radius); padding: 20px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px; color: var(--gray-900);">${ngo.name}</h4>
                <p style="margin: 0 0 8px; color: var(--gray-700); font-size: 14px;"><strong>Contact:</strong> ${ngo.contact}</p>
                <p style="margin: 0; color: var(--gray-600); font-size: 14px;">${ngo.services}</p>
            </div>
        `).join('');
    }

    generateDocumentsContent() {
        const checklists = this.embassyInfo.checklists || {};
        
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div>
                    <h4 style="margin: 0 0 16px; color: var(--gray-900);">Host Country Entry</h4>
                    <div style="background: var(--gray-50); border-radius: var(--radius); padding: 16px;">
                        ${(checklists.hostCountry || ['Valid passport', 'Entry visa (if required)', 'Proof of accommodation']).map(item => `
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span style="color: var(--success);">✓</span>
                                <span style="font-size: 14px; color: var(--gray-700);">${item}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <h4 style="margin: 0 0 16px; color: var(--gray-900);">SIV Interview</h4>
                    <div style="background: var(--gray-50); border-radius: var(--radius); padding: 16px;">
                        ${(checklists.sivInterview || ['Form DS-260', 'Supporting SIV documents', 'Medical examination results', 'Passport photos']).map(item => `
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span style="color: var(--success);">✓</span>
                                <span style="font-size: 14px; color: var(--gray-700);">${item}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    closeModal() {
        const modal = document.getElementById('detailModal');
        modal.classList.remove('active');
        this.currentModal = null;
    }

    toggleComparisonPanel() {
        const panel = document.getElementById('comparisonPanel');
        const btn = document.getElementById('compareBtn');
        
        if (panel.classList.contains('active')) {
            panel.classList.remove('active');
            btn.classList.remove('active');
        } else {
            // Load comparison content
            this.loadComparisonContent();
            panel.classList.add('active');
            btn.classList.add('active');
        }
    }

    loadComparisonContent() {
        const content = document.getElementById('comparisonContent');
        
        if (!this.selectedEmbassy) {
            content.innerHTML = `
                <div style="padding: 24px; text-align: center; color: var(--gray-500);">
                    <p>Select an embassy first to start comparing</p>
                </div>
            `;
            return;
        }

        const availableEmbassies = this.embassyData.filter(e => e.embassy !== this.selectedEmbassy.embassy);
        
        content.innerHTML = `
            <div style="padding: 24px;">
                <h3 style="margin: 0 0 16px; color: var(--gray-900);">Compare with ${this.selectedEmbassy.embassy}</h3>
                <p style="margin: 0 0 20px; color: var(--gray-600); font-size: 14px;">Select up to 3 other embassies to compare</p>
                
                <div style="max-height: 400px; overflow-y: auto;">
                    ${availableEmbassies.slice(0, 20).map(embassy => {
                        const cases = this.getCurrentYearTotal(embassy);
                        const flag = this.getCountryFlag(embassy.country);
                        return `
                            <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 6px; margin-bottom: 8px; cursor: pointer; transition: var(--transition);" 
                                 onmouseover="this.style.background='var(--gray-50)'" 
                                 onmouseout="this.style.background='transparent'"
                                 onclick="embassyApp.compareWith('${embassy.embassy}')">
                                <span style="font-size: 20px;">${flag}</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: var(--gray-900);">${embassy.embassy}</div>
                                    <div style="font-size: 12px; color: var(--gray-600);">${embassy.country} • ${cases} cases</div>
                                </div>
                                <span style="color: var(--primary); font-size: 12px;">Compare →</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    compareWith(embassyName) {
        const embassy = this.embassyData.find(e => e.embassy === embassyName);
        if (!embassy) return;

        // Simple comparison - you can expand this
        const currentCases = this.getCurrentYearTotal(this.selectedEmbassy);
        const compareCases = this.getCurrentYearTotal(embassy);
        
        const content = document.getElementById('comparisonContent');
        content.innerHTML = `
            <div style="padding: 24px;">
                <h3 style="margin: 0 0 20px; color: var(--gray-900);">Embassy Comparison</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div style="text-align: center; padding: 20px; background: var(--gray-50); border-radius: var(--radius);">
                        <div style="font-size: 18px; font-weight: 700; color: var(--primary); margin-bottom: 8px;">${this.selectedEmbassy.embassy}</div>
                        <div style="font-size: 24px; font-weight: 700; color: var(--gray-900);">${currentCases}</div>
                        <div style="font-size: 12px; color: var(--gray-600);">2025 Cases</div>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; background: var(--gray-50); border-radius: var(--radius);">
                        <div style="font-size: 18px; font-weight: 700; color: var(--primary); margin-bottom: 8px;">${embassy.embassy}</div>
                        <div style="font-size: 24px; font-weight: 700; color: var(--gray-900);">${compareCases}</div>
                        <div style="font-size: 12px; color: var(--gray-600);">2025 Cases</div>
                    </div>
                </div>
                
                <button onclick="embassyApp.loadComparisonContent()" style="background: var(--primary); color: white; border: none; padding: 10px 16px; border-radius: var(--radius); font-size: 14px; cursor: pointer; width: 100%;">Compare Different Embassy</button>
            </div>
        `;
    }

    closeComparisonPanel() {
        const panel = document.getElementById('comparisonPanel');
        const btn = document.getElementById('compareBtn');
        
        panel.classList.remove('active');
        btn.classList.remove('active');
    }

    toggleTranslation() {
        const btn = document.getElementById('translateBtn');
        
        if (this.isDariMode) {
            // Switch back to English
            this.isDariMode = false;
            btn.classList.remove('active');
            document.body.classList.remove('rtl');
            
            // Reload the page to restore English content
            if (this.selectedEmbassy) {
                this.showEmbassyDetails();
            }
        } else {
            // Switch to Dari
            this.isDariMode = true;
            btn.classList.add('active');
            document.body.classList.add('rtl');
            
            // Apply Dari translations
            this.applyDariTranslations();
        }
    }

    applyDariTranslations() {
        // Basic Dari translations for key UI elements
        const translations = {
            'Embassy Information & Resources': 'اطلاعات و منابع سفارت',
            'Find detailed information for SIV applicants by embassy location': 'اطلاعات تفصیلی برای متقاضیان SIV بر اساس موقعیت سفارت پیدا کنید',
            'Search embassy by name or country...': 'سفارت را با نام یا کشور جستجو کنید...',
            'Compare': 'مقایسه',
            'SIV Processing Data': 'داده‌های پردازش SIV',
            'Official Resources': 'منابع رسمی',
            'Visa Requirements': 'نیازمندی‌های ویزا',
            'Medical Examinations': 'معاینات پزشکی',
            'Travel Costs': 'هزینه‌های سفر',
            'Living Expenses': 'هزینه‌های زندگی',
            'Support Organizations': 'سازمان‌های حمایتی',
            'Document Checklists': 'فهرست‌های اسناد'
        };

        // Apply translations to visible text elements
        document.querySelectorAll('h1, h2, h3, p, button, .page-subtitle').forEach(element => {
            const text = element.textContent.trim();
            if (translations[text]) {
                element.textContent = translations[text];
            }
        });

        // Update placeholder
        const searchInput = document.getElementById('embassySearch');
        if (searchInput && translations[searchInput.placeholder]) {
            searchInput.placeholder = translations[searchInput.placeholder];
        }
    }

    // Initialize API Toggle
    initializeAPIToggle() {
        const apiToggle = document.getElementById('apiToggle');
        if (apiToggle) {
            // Set initial state
            apiToggle.checked = this.useAPI;
            
            // Add event listener
            apiToggle.addEventListener('change', (e) => {
                this.useAPI = e.target.checked;
                localStorage.setItem('useAPI', this.useAPI);
                
                // If embassy is already selected, reload the info
                if (this.selectedEmbassy) {
                    const loading = document.getElementById('embassyLoading');
                    if (loading) loading.style.display = 'flex';
                    
                    // Clear existing modals
                    document.querySelectorAll('.modal').forEach(modal => {
                        modal.classList.remove('active');
                    });
                    
                    // Reload info cards with new setting
                    this.loadEmbassyInfo();
                }
            });
        }
    }

    // API Integration (unchanged)
    async getEmbassyInfoFromAPI(embassy) {
        if (!window.API_CONFIG || !window.API_CONFIG.SECURE_MODE || window.API_CONFIG.API_DISABLED || !this.useAPI) {
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

    async callNetlifyFunction(embassy) {
        const response = await fetch(window.API_CONFIG.EMBASSY_INFO_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embassy: embassy.embassy,
                country: embassy.country
            })
        });

        if (!response.ok) {
            throw new Error(`Netlify function error: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.message || 'API call failed');
        }

        return data;
    }

    getFallbackEmbassyInfo(embassy) {
        return {
            links: [{
                title: "US Embassy Website",
                url: `https://embassy-finder.com/${embassy.country.toLowerCase()}`,
                description: "Official US Embassy website with visa information"
            }],
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
            ngos: [{
                name: "Local Refugee Assistance Organizations",
                contact: "Contact US Embassy for referrals",
                services: "SIV process guidance and support"
            }],
            travelCosts: {
                flightCost: "Varies by route and season",
                overlandCost: "Contact travel agencies",
                transitInfo: "Check visa requirements for transit countries"
            },
            livingExpenses: {
                dailyRoom: "Contact local accommodations",
                monthlyRoom: "Varies by location",
                dailyMeals: "Varies",
                localTransport: "Contact local transport services"
            },
            checklists: {
                hostCountry: ["Valid passport", "Entry visa (if required)", "Proof of accommodation", "Financial support documentation"],
                sivInterview: ["Form DS-260", "Supporting SIV documents", "Medical examination results", "Passport photos", "Birth certificates"]
            }
        };
    }

    // Utility functions
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
}

// Initialize the application
let embassyApp;
document.addEventListener('DOMContentLoaded', () => {
    embassyApp = new EmbassyDetailsApp();
});