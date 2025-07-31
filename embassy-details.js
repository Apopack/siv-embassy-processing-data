// Professional Embassy Details Application

class EmbassyDetailsApp {
    constructor() {
        this.embassyData = null;
        this.selectedEmbassy = null;
        this.searchResults = [];
        this.comparisonEmbassies = [];
        this.isComparing = false;
        this.currentModal = null;
        
        this.init();
    }

    async init() {
        await this.loadEmbassyData();
        this.setupEventListeners();
        this.initializeSearch();
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
        // Show placeholder in search if no embassies loaded
        if (!this.embassyData) {
            const searchInput = document.getElementById('embassySearch');
            searchInput.disabled = true;
            searchInput.placeholder = 'Loading embassies...';
            return;
        }

        // Initialize with all embassies
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
            const totalCases = Object.values(embassy.monthlyData).reduce((sum, val) => sum + val, 0);
            const flag = this.getCountryFlag(embassy.country);
            
            return `
                <div class="embassy-result" onclick="embassyApp.selectEmbassy('${embassy.embassy}')">
                    <div class="embassy-flag">${flag}</div>
                    <div class="embassy-info">
                        <h3>${embassy.embassy}</h3>
                        <p>${embassy.country} • ${totalCases.toLocaleString()} total cases</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    selectEmbassy(embassyName) {
        const embassy = this.embassyData.find(e => e.embassy === embassyName);
        if (!embassy) return;

        this.selectedEmbassy = embassy;
        
        // Hide search results
        document.getElementById('searchResults').classList.remove('active');
        
        // Update search input
        document.getElementById('embassySearch').value = `${embassy.embassy}, ${embassy.country}`;
        
        // Show embassy details
        this.showEmbassyDetails();
    }

    async showEmbassyDetails() {
        const embassyDetails = document.getElementById('embassyDetails');
        const embassyLoading = document.getElementById('embassyLoading');
        
        // Update header
        document.getElementById('embassyName').textContent = this.selectedEmbassy.embassy;
        document.getElementById('embassyLocation').textContent = `${this.selectedEmbassy.embassy}, ${this.selectedEmbassy.country}`;
        
        // Show details section with loading
        embassyDetails.classList.add('active');
        embassyLoading.style.display = 'flex';
        
        // Load embassy information
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
        
        // Set title based on type
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
        
        // Show loading
        modalBody.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Loading detailed information...
            </div>
        `;
        
        modal.classList.add('active');
        
        // Generate content based on type
        try {
            const content = await this.generateModalContent(infoType);
            modalBody.innerHTML = content;
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
        const embassy = this.selectedEmbassy;
        const totalCases = Object.values(embassy.monthlyData).reduce((sum, val) => sum + val, 0);
        const currentYear = new Date().getFullYear();
        const currentYearCases = this.getCurrentYearTotal(embassy);
        
        return `
            <div style="text-align: center; margin-bottom: 32px;">
                <h3 style="color: var(--primary); font-size: 24px; margin-bottom: 8px;">${totalCases.toLocaleString()}</h3>
                <p style="color: var(--gray-600); margin: 0;">Total SIV cases processed</p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 32px;">
                <div style="text-align: center; padding: 20px; background: var(--gray-50); border-radius: var(--radius);">
                    <div style="font-size: 20px; font-weight: 700; color: var(--gray-900);">${currentYearCases}</div>
                    <div style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">${currentYear} Cases</div>
                </div>
                <div style="text-align: center; padding: 20px; background: var(--gray-50); border-radius: var(--radius);">
                    <div style="font-size: 20px; font-weight: 700; color: var(--gray-900);">${Math.round(totalCases / 32)}</div>
                    <div style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Avg/Month</div>
                </div>
                <div style="text-align: center; padding: 20px; background: var(--gray-50); border-radius: var(--radius);">
                    <div style="font-size: 20px; font-weight: 700; color: var(--gray-900);">32</div>
                    <div style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Months Data</div>
                </div>
            </div>
            
            <div id="modalChart" style="height: 300px; background: var(--gray-50); border-radius: var(--radius); padding: 16px;">
                <!-- Chart will be rendered here -->
            </div>
        `;
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
            <div style="display: grid; gap: 20px;">
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 20px;">
                    <h4 style="margin: 0 0 12px; color: var(--gray-900);">Visa Requirement</h4>
                    <p style="margin: 0; color: var(--gray-700);"><strong>Required:</strong> ${visa.visaRequired || 'Contact embassy'}</p>
                    <p style="margin: 8px 0 0; color: var(--gray-700);"><strong>Type:</strong> ${visa.visaType || 'Various types available'}</p>
                </div>
                
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 20px;">
                    <h4 style="margin: 0 0 12px; color: var(--gray-900);">Duration & Extension</h4>
                    <p style="margin: 0; color: var(--gray-700);"><strong>Length:</strong> ${visa.visaLength || 'Varies by visa type'}</p>
                    <p style="margin: 8px 0 0; color: var(--gray-700);"><strong>Extension:</strong> ${visa.extensionPossible || 'Contact local authorities'}</p>
                </div>
                
                <div style="background: var(--gray-50); border-radius: var(--radius); padding: 20px;">
                    <h4 style="margin: 0 0 12px; color: var(--gray-900);">Fees</h4>
                    <p style="margin: 0; color: var(--gray-700);"><strong>Visa Fee:</strong> ${visa.visaFee || 'Contact embassy for current rates'}</p>
                    <p style="margin: 8px 0 0; color: var(--gray-700);"><strong>Extension Fee:</strong> ${visa.extensionFee || 'Varies'}</p>
                </div>
            </div>
        `;
    }

    generateMedicalContent() {
        const medical = this.embassyInfo.medicalInfo || {};
        
        return `
            <div style="display: grid; gap: 20px;">
                <div style="background: var(--secondary-light, var(--gray-50)); border-radius: var(--radius); padding: 20px;">
                    <h4 style="margin: 0 0 12px; color: var(--primary);">📍 Examination Location</h4>
                    <p style="margin: 0; color: var(--gray-700);">${medical.location || 'Contact US Embassy for approved medical facilities'}</p>
                </div>
                
                <div style="background: var(--secondary-light, var(--gray-50)); border-radius: var(--radius); padding: 20px;">
                    <h4 style="margin: 0 0 12px; color: var(--primary);">💰 Examination Fee</h4>
                    <p style="margin: 0; color: var(--gray-700);">${medical.fee || 'Contact medical facility for current fees'}</p>
                </div>
                
                <div style="background: var(--secondary-light, var(--gray-50)); border-radius: var(--radius); padding: 20px;">
                    <h4 style="margin: 0 0 12px; color: var(--primary);">📅 Booking Information</h4>
                    <p style="margin: 0; color: var(--gray-700);">${medical.bookingInfo || 'Embassy will provide list of approved doctors'}</p>
                </div>
                
                <div style="background: var(--secondary-light, var(--gray-50)); border-radius: var(--radius); padding: 20px;">
                    <h4 style="margin: 0 0 12px; color: var(--primary);">ℹ️ Additional Information</h4>
                    <p style="margin: 0; color: var(--gray-700);">${medical.additionalInfo || 'Medical exam must be completed at embassy-approved facility'}</p>
                </div>
            </div>
        `;
    }

    generateTravelContent() {
        const travel = this.embassyInfo.travelCosts || {};
        
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px;">
                <div style="background: linear-gradient(135deg, #FFF8E1, rgba(245, 158, 11, 0.1)); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: var(--accent); margin-bottom: 8px;">${travel.flightCost || 'Varies'}</div>
                    <div style="font-size: 13px; color: var(--gray-600); text-transform: uppercase;">Flight from Kabul</div>
                </div>
                
                <div style="background: linear-gradient(135deg, #FFF8E1, rgba(245, 158, 11, 0.1)); border-radius: var(--radius); padding: 24px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: var(--accent); margin-bottom: 8px;">${travel.overlandCost || 'N/A'}</div>
                    <div style="font-size: 13px; color: var(--gray-600); text-transform: uppercase;">Overland Travel</div>
                </div>
            </div>
            
            <div style="background: var(--gray-50); border-radius: var(--radius); padding: 20px;">
                <h4 style="margin: 0 0 12px; color: var(--gray-900);">Transit Information</h4>
                <p style="margin: 0; color: var(--gray-700); line-height: 1.6;">${travel.transitInfo || 'Check visa requirements for transit countries'}</p>
            </div>
        `;
    }

    generateLivingContent() {
        const living = this.embassyInfo.livingExpenses || {};
        
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
                <div style="background: linear-gradient(135deg, #F0F9FF, rgba(59, 130, 246, 0.1)); border-radius: var(--radius); padding: 20px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: var(--primary); margin-bottom: 6px;">${living.dailyRoom || 'Varies'}</div>
                    <div style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Daily Room</div>
                </div>
                
                <div style="background: linear-gradient(135deg, #F0F9FF, rgba(59, 130, 246, 0.1)); border-radius: var(--radius); padding: 20px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: var(--primary); margin-bottom: 6px;">${living.monthlyRoom || 'Varies'}</div>
                    <div style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Monthly Room</div>
                </div>
                
                <div style="background: linear-gradient(135deg, #F0F9FF, rgba(59, 130, 246, 0.1)); border-radius: var(--radius); padding: 20px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: var(--primary); margin-bottom: 6px;">${living.dailyMeals || 'Varies'}</div>
                    <div style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Daily Meals</div>
                </div>
                
                <div style="background: linear-gradient(135deg, #F0F9FF, rgba(59, 130, 246, 0.1)); border-radius: var(--radius); padding: 20px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: var(--primary); margin-bottom: 6px;">${living.localTransport || 'Varies'}</div>
                    <div style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Local Transport</div>
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
        
        panel.classList.toggle('active');
        btn.classList.toggle('active');
    }

    closeComparisonPanel() {
        const panel = document.getElementById('comparisonPanel');
        const btn = document.getElementById('compareBtn');
        
        panel.classList.remove('active');
        btn.classList.remove('active');
    }

    toggleTranslation() {
        const btn = document.getElementById('translateBtn');
        btn.classList.toggle('active');
        
        // Placeholder for translation functionality
        if (btn.classList.contains('active')) {
            console.log('Translation activated');
        } else {
            console.log('Translation deactivated');
        }
    }

    // API Integration
    async getEmbassyInfoFromAPI(embassy) {
        if (!window.API_CONFIG || !window.API_CONFIG.SECURE_MODE) {
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
        
        if (data.error) {
            throw new Error(data.message || 'API call failed');
        }

        return data;
    }

    getFallbackEmbassyInfo(embassy) {
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
                    "Birth certificates"
                ]
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