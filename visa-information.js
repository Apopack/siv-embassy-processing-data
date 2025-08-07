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
        await this.loadSIVCountries(); // Load countries from SIV data
        this.setupEventListeners();
        this.handleURLParameters();
    }

    async loadVisaData() {
        // Check for visa data from admin panel first
        const adminData = localStorage.getItem('databaseVisaData');
        if (adminData) {
            try {
                const data = JSON.parse(adminData);
                this.visaData = Array.from(data.values ? data.values() : data);
                console.log('Loading visa data from admin portal:', this.visaData.length, 'countries');
                this.filteredData = [...this.visaData];
                
                if (this.visaData.length === 0) {
                    this.showEmptyState();
                    return;
                }
                return;
            } catch (error) {
                console.error('Error parsing admin visa data:', error);
            }
        }

        // No static visa data - will show empty state until admin adds data
        this.visaData = [];
        
        this.filteredData = [...this.visaData];
        
        // Show empty state if no data
        if (this.visaData.length === 0) {
            this.showEmptyState();
        }
    }
    
    showEmptyState() {
        const container = document.querySelector('.container');
        if (!container) return;
        
        // Hide normal content sections
        const sectionsToHide = ['.visa-table-container', '.country-selection-section'];
        sectionsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) element.style.display = 'none';
        });
        
        // Create and show empty state
        const existingEmptyState = document.querySelector('.visa-empty-state');
        if (existingEmptyState) {
            existingEmptyState.remove();
        }
        
        const emptyStateHTML = `
            <div class="visa-empty-state" style="text-align: center; padding: 60px 20px; color: #6B7280; margin: 40px 0;">
                <div style="font-size: 64px; margin-bottom: 20px;">📋</div>
                <h3 style="color: #374151; margin-bottom: 10px;">No Visa Information Available</h3>
                <p style="margin-bottom: 20px;">Visa information will appear here once added through the Admin Portal.</p>
                <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
                    <h4 style="color: #374151; margin: 0 0 10px;">How to Add Visa Information:</h4>
                    <ol style="color: #6B7280; margin: 0; padding-left: 20px;">
                        <li>Go to <strong>Admin Portal</strong> in the navigation</li>
                        <li>Search for a country using the search box</li>
                        <li>Select a country and fill in visa requirements</li>
                        <li>Save the information</li>
                        <li>Data will automatically appear on this page</li>
                    </ol>
                </div>
                <a href="admin.html" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-right: 12px;">Go to Admin Portal</a>
                <button onclick="location.reload()" style="display: inline-block; background: #6B7280; color: white; padding: 12px 24px; border-radius: 6px; border: none; font-weight: 500; cursor: pointer;">Refresh Page</button>
            </div>
        `;
        
        // Insert after page header
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) {
            pageHeader.insertAdjacentHTML('afterend', emptyStateHTML);
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

    async loadSIVCountries() {
        // Load the same SIV embassy data that's used in the main issuances page
        try {
            // First check for imported SIV data from admin panel
            const importedData = localStorage.getItem('sivImportData');
            if (importedData) {
                try {
                    const data = JSON.parse(importedData);
                    this.sivCountries = data.embassies.map(embassy => ({
                        name: embassy.country,
                        embassy: embassy.embassy,
                        flag: this.getCountryFlag(embassy.country)
                    }));
                    console.log('Loading SIV countries from admin imports:', this.sivCountries.length, 'countries');
                    return;
                } catch (error) {
                    console.error('Error parsing imported SIV data:', error);
                }
            }

            // Try to get data from script.js global variable if available
            if (typeof embassyData !== 'undefined' && embassyData.embassies) {
                this.sivCountries = embassyData.embassies.map(embassy => ({
                    name: embassy.country,
                    embassy: embassy.embassy,
                    flag: this.getCountryFlag(embassy.country)
                }));
                return;
            }
            
            // Otherwise try to fetch the JSON file
            const response = await fetch('data/embassy-siv-data.json');
            const data = await response.json();
            this.sivCountries = data.embassies.map(embassy => ({
                name: embassy.country,
                embassy: embassy.embassy,
                flag: this.getCountryFlag(embassy.country)
            }));
        } catch (error) {
            console.error('Error loading SIV countries:', error);
            // Create a comprehensive list of SIV countries as fallback
            this.sivCountries = [
                // Add all the countries that would be in the SIV data
                { name: 'Afghanistan', embassy: 'Kabul', flag: this.getCountryFlag('Afghanistan') },
                { name: 'Pakistan', embassy: 'Islamabad', flag: this.getCountryFlag('Pakistan') },
                { name: 'India', embassy: 'New Delhi', flag: this.getCountryFlag('India') },
                { name: 'Qatar', embassy: 'Doha', flag: this.getCountryFlag('Qatar') },
                { name: 'UAE', embassy: 'Abu Dhabi', flag: this.getCountryFlag('UAE') },
                { name: 'Turkey', embassy: 'Ankara', flag: this.getCountryFlag('Turkey') },
                { name: 'Germany', embassy: 'Frankfurt', flag: this.getCountryFlag('Germany') },
                { name: 'Canada', embassy: 'Montreal', flag: this.getCountryFlag('Canada') },
                { name: 'Albania', embassy: 'Tirana', flag: this.getCountryFlag('Albania') },
                { name: 'Iraq', embassy: 'Baghdad', flag: this.getCountryFlag('Iraq') },
                { name: 'Iran', embassy: 'Tehran', flag: this.getCountryFlag('Iran') },
                { name: 'Philippines', embassy: 'Manila', flag: this.getCountryFlag('Philippines') },
                { name: 'Rwanda', embassy: 'Kigali', flag: this.getCountryFlag('Rwanda') },
                { name: 'United States', embassy: 'Washington DC', flag: this.getCountryFlag('United States') }
            ];
        }
    }

    getCountryFlag(country) {
        const flagMap = {
            // Current visa countries
            'Pakistan': '🇵🇰', 'Qatar': '🇶🇦', 'Albania': '🇦🇱', 'Turkey': '🇹🇷',
            'Germany': '🇩🇪', 'Canada': '🇨🇦', 'Philippines': '🇵🇭', 'UAE': '🇦🇪',
            'Iraq': '🇮🇶', 'Rwanda': '🇷🇼', 'United Arab Emirates': '🇦🇪',
            
            // Additional common countries
            'United States': '🇺🇸', 'India': '🇮🇳', 'Iran': '🇮🇷', 'Afghanistan': '🇦🇫',
            'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Belgium': '🇧🇪', 'Brazil': '🇧🇷',
            'China': '🇨🇳', 'Denmark': '🇩🇰', 'Egypt': '🇪🇬', 'France': '🇫🇷',
            'Greece': '🇬🇷', 'Italy': '🇮🇹', 'Japan': '🇯🇵', 'Jordan': '🇯🇴',
            'Kazakhstan': '🇰🇿', 'Kuwait': '🇰🇼', 'Lebanon': '🇱🇧', 'Malaysia': '🇲🇾',
            'Mexico': '🇲🇽', 'Netherlands': '🇳🇱', 'Norway': '🇳🇴', 'Poland': '🇵🇱',
            'Russia': '🇷🇺', 'Saudi Arabia': '🇸🇦', 'South Korea': '🇰🇷', 'Spain': '🇪🇸',
            'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Thailand': '🇹🇭', 'United Kingdom': '🇬🇧',
            'Uzbekistan': '🇺🇿', 'Vietnam': '🇻🇳', 'Indonesia': '🇮🇩', 'Bangladesh': '🇧🇩',
            'Sri Lanka': '🇱🇰', 'Nepal': '🇳🇵', 'Myanmar': '🇲🇲', 'Cambodia': '🇰🇭',
            'Laos': '🇱🇦', 'Singapore': '🇸🇬', 'South Africa': '🇿🇦', 'Nigeria': '🇳🇬',
            'Kenya': '🇰🇪', 'Ethiopia': '🇪🇹', 'Morocco': '🇲🇦', 'Tunisia': '🇹🇳',
            'Algeria': '🇩🇿', 'Libya': '🇱🇾', 'Sudan': '🇸🇩', 'Somalia': '🇸🇴',
            'Yemen': '🇾🇪', 'Oman': '🇴🇲', 'Bahrain': '🇧🇭', 'Syria': '🇸🇾'
        };
        return flagMap[country] || '🏛️';
    }

    setupEventListeners() {
        // Mobile menu toggle
        document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
            document.getElementById('sideNav').classList.toggle('active');
        });


        // Add country to comparison
        document.getElementById('addCountryBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCountrySelectionPopout();
        });

        // Close popout
        document.getElementById('closePopoutBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeCountrySelectionPopout();
        });

        // Comparison country search
        document.getElementById('comparisonCountrySearch')?.addEventListener('input', (e) => {
            this.handleComparisonCountrySearch(e.target.value);
        });




        // Close modals with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeComparisonPanel();
                this.closeAllDropdowns();
                this.closeCountrySelectionPopout();
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.info-dropdown')) {
                this.closeAllDropdowns();
            }
            if (!e.target.closest('.add-country-container')) {
                this.closeCountrySelectionPopout();
            }
        });
    }

    
    toggleCountrySelectionPopout() {
        const popout = document.getElementById('countrySelectionPopout');
        if (!popout) return;
        
        const isVisible = popout.style.display === 'block';
        
        if (isVisible) {
            this.closeCountrySelectionPopout();
        } else {
            this.openCountrySelectionPopout();
        }
    }
    
    openCountrySelectionPopout() {
        const popout = document.getElementById('countrySelectionPopout');
        const searchInput = document.getElementById('comparisonCountrySearch');
        
        if (!popout || !searchInput) return;
        
        popout.style.display = 'block';
        
        // Focus on search input
        setTimeout(() => {
            searchInput.focus();
        }, 100);
        
        // Load all countries initially
        this.handleComparisonCountrySearch('');
    }
    
    closeCountrySelectionPopout() {
        const popout = document.getElementById('countrySelectionPopout');
        const searchInput = document.getElementById('comparisonCountrySearch');
        
        if (popout) {
            popout.style.display = 'none';
        }
        
        if (searchInput) {
            searchInput.value = '';
        }
    }
    
    handleComparisonCountrySearch(query) {
        const resultsContainer = document.getElementById('comparisonSearchResults');
        if (!resultsContainer) return;
        
        // Get all available countries
        const allCountries = new Map();
        
        // Add visa countries first (they have detailed info)
        this.visaData.forEach(visa => {
            allCountries.set(visa.country, {
                name: visa.country,
                flag: visa.flag,
                embassy: visa.embassy,
                hasVisaInfo: true
            });
        });
        
        // Add SIV countries if they exist
        if (this.sivCountries && Array.isArray(this.sivCountries)) {
            this.sivCountries.forEach(country => {
                if (!allCountries.has(country.name)) {
                    allCountries.set(country.name, {
                        name: country.name,
                        flag: country.flag,
                        embassy: country.embassy || 'Embassy information available',
                        hasVisaInfo: false
                    });
                }
            });
        }
        
        // Filter countries based on search query
        let filteredCountries = Array.from(allCountries.values());
        
        if (query.trim()) {
            filteredCountries = filteredCountries.filter(country => 
                country.name.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        // Sort countries - already selected ones last
        const selectedCountryNames = this.comparisonCountries.map(c => c.country);
        filteredCountries.sort((a, b) => {
            const aSelected = selectedCountryNames.includes(a.name);
            const bSelected = selectedCountryNames.includes(b.name);
            
            if (aSelected && !bSelected) return 1;
            if (!aSelected && bSelected) return -1;
            return a.name.localeCompare(b.name);
        });
        
        if (filteredCountries.length === 0) {
            resultsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--gray-500);">No countries found</div>';
        } else {
            resultsContainer.innerHTML = filteredCountries.map(country => {
                const isAlreadySelected = selectedCountryNames.includes(country.name);
                const canAddMore = this.comparisonCountries.length < this.maxComparisons;
                
                return `
                    <div class="popout-result-item ${isAlreadySelected ? 'disabled' : ''}" 
                         ${!isAlreadySelected && canAddMore ? `onclick="visaApp.addCountryFromPopout('${country.name}')"` : ''}>
                        <span class="popout-result-flag">${country.flag}</span>
                        <div class="popout-result-info">
                            <h5>${country.name}${country.hasVisaInfo ? '' : ' (Limited info)'}</h5>
                            <p>${country.embassy}</p>
                        </div>
                        ${isAlreadySelected ? 
                            '<span class="popout-result-status already-selected">Already selected</span>' : 
                            (!canAddMore ? '<span class="popout-result-status already-selected">Max reached</span>' : '')
                        }
                    </div>
                `;
            }).join('');
        }
    }
    
    addCountryFromPopout(countryName) {
        if (this.comparisonCountries.length >= this.maxComparisons) {
            alert(`You can only compare up to ${this.maxComparisons} countries at once.`);
            return;
        }
        
        if (!this.comparisonCountries.some(c => c.country === countryName)) {
            const countryData = this.getCountryData(countryName);
            if (countryData) {
                this.comparisonCountries.push(countryData);
                this.updateSelectedCountriesBar();
                this.renderVisaInformation();
                
                // Refresh the popout results to reflect the new selection
                const searchInput = document.getElementById('comparisonCountrySearch');
                this.handleComparisonCountrySearch(searchInput ? searchInput.value : '');
            }
        }
    }
    
    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const country = urlParams.get('country');
        if (country) {
            this.selectCountry(country);
        }
    }
    
    selectCountry(countryName) {
        // Update URL without page reload
        if (window.history) {
            const url = new URL(window.location);
            url.searchParams.set('country', countryName);
            window.history.pushState({}, '', url);
        }
        
        // Add to selected countries if not already there
        if (!this.comparisonCountries.some(c => c.country === countryName)) {
            const countryData = this.getCountryData(countryName);
            if (countryData) {
                this.comparisonCountries = [countryData]; // Replace with new selection
                this.updateSelectedCountriesBar();
                this.renderVisaInformation();
            }
        }
    }
    
    
    
    getCountryData(countryName) {
        // First try to find in visa data
        let countryData = this.visaData.find(visa => visa.country === countryName);
        
        if (!countryData) {
            // If not in visa data, create basic info from SIV data
            const sivCountry = this.sivCountries.find(c => c.name === countryName);
            if (sivCountry) {
                countryData = {
                    country: countryName,
                    flag: sivCountry.flag,
                    embassy: sivCountry.embassy,
                    visaType: 'Information not available',
                    visaCost: 'Contact embassy for details',
                    validity: 'Varies',
                    extensionPossible: false,
                    processingSteps: ['Contact the embassy directly for visa requirements'],
                    links: [{ text: 'Contact Embassy', url: '#' }],
                    sourceName: 'Embassy Contact Required',
                    hasDetailedInfo: false
                };
            }
        } else {
            countryData.hasDetailedInfo = true;
        }
        
        return countryData;
    }

    updateSelectedCountriesBar() {
        const bar = document.getElementById('selectedCountriesBar');
        const list = document.getElementById('selectedCountriesList');
        
        if (this.comparisonCountries.length === 0) {
            bar.style.display = 'none';
            return;
        }
        
        bar.style.display = 'flex';
        list.innerHTML = this.comparisonCountries.map(country => `
            <div class="country-chip">
                <span>${country.flag}</span>
                <span>${country.country}</span>
                <button class="remove-chip" onclick="visaApp.removeFromComparison('${country.country}')">&times;</button>
            </div>
        `).join('');
    }
    
    renderVisaInformation() {
        const container = document.getElementById('visaInfoContainer');
        
        if (this.comparisonCountries.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        
        // Update table title
        const tableTitle = document.getElementById('tableTitle');
        if (tableTitle) {
            const countryNames = this.comparisonCountries.map(c => c.country).join(', ');
            tableTitle.textContent = `Visa Requirements - ${countryNames}`;
        }
        
        // Render table rows
        const tbody = document.getElementById('visaTableBody');
        tbody.innerHTML = this.comparisonCountries.map(country => this.renderTableRow(country)).join('');
    }
    
    renderTableRow(country) {
        const countryId = country.country.replace(/\s+/g, '-').toLowerCase();
        const visaDropdownId = `visa-${countryId}`;
        const extensionDropdownId = `extension-${countryId}`;
        
        return `
            <tr>
                <td class="country-col">
                    <div class="country-cell">
                        <span class="country-flag">${country.flag}</span>
                        <div class="country-info">
                            <h4>${country.country}</h4>
                            <p>${country.embassy}</p>
                        </div>
                    </div>
                </td>
                <td class="visa-type-col">
                    <div class="visa-type-container">
                        <div style="font-weight: 500;">${country.visaType}</div>
                        <div class="info-dropdown">
                            <button class="dropdown-trigger" onclick="visaApp.toggleDropdown('${visaDropdownId}')">
                                <span>More Info</span>
                                <span id="icon-${visaDropdownId}">▼</span>
                            </button>
                            <div class="dropdown-content" id="${visaDropdownId}">
                                <h5>Application Process</h5>
                                <ol>
                                    ${country.processingSteps.map(step => `<li>${this.makeLinksClickable(step)}</li>`).join('')}
                                </ol>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="cost-col">
                    <span class="cost-value">${country.visaCost}</span>
                </td>
                <td class="validity-col">
                    ${country.validity}
                </td>
                <td class="extension-col">
                    <div class="extension-container">
                        <span class="${country.extensionPossible ? 'extension-yes' : 'extension-no'}">
                            ${country.extensionPossible ? 'Yes' : 'No'}
                        </span>
                        ${country.extensionPossible ? `
                            <div class="info-dropdown">
                                <button class="dropdown-trigger" onclick="visaApp.toggleDropdown('${extensionDropdownId}')">
                                    <span>Details</span>
                                    <span id="icon-${extensionDropdownId}">▼</span>
                                </button>
                                <div class="dropdown-content" id="${extensionDropdownId}">
                                    <h5>Extension Information</h5>
                                    <div class="extension-details">
                                        <p><strong>Duration:</strong> ${country.extensionDuration}</p>
                                        <p><strong>Cost:</strong> ${country.extensionCost}</p>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </td>
                <td class="official-link-col">
                    ${country.links.length > 0 ? `
                        <a href="${country.links[0].url}" target="_blank" rel="noopener" class="official-link">
                            <span>Official Link</span>
                            <span>→</span>
                        </a>
                    ` : `
                        <span style="color: var(--gray-500); font-size: 13px;">Contact Embassy</span>
                    `}
                </td>
            </tr>
        `;
    }
    
    toggleDropdown(dropdownId, triggerElement) {
        // Close all other dropdowns first
        this.closeAllDropdowns();
        
        // Toggle the clicked dropdown
        const dropdown = document.getElementById(dropdownId);
        const trigger = dropdown?.previousElementSibling;
        const icon = trigger?.querySelector('[id^="icon-"]');
        
        if (dropdown && trigger && icon) {
            const isActive = dropdown.classList.contains('active');
            
            if (!isActive) {
                // Create and show overlay
                this.showDropdownOverlay();
                
                // Position the dropdown in the center of the screen
                dropdown.style.left = '50%';
                dropdown.style.top = '50%';
                dropdown.style.transform = 'translate(-50%, -50%)';
                
                dropdown.classList.add('active');
                trigger.classList.add('active');
                icon.textContent = '▲';
            }
        }
    }
    
    showDropdownOverlay() {
        let overlay = document.getElementById('dropdownOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'dropdownOverlay';
            overlay.className = 'dropdown-overlay';
            overlay.onclick = () => this.closeAllDropdowns();
            document.body.appendChild(overlay);
        }
        overlay.classList.add('active');
    }
    
    hideDropdownOverlay() {
        const overlay = document.getElementById('dropdownOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    closeAllDropdowns() {
        document.querySelectorAll('.dropdown-content.active').forEach(dropdown => {
            dropdown.classList.remove('active');
            const trigger = dropdown.previousElementSibling;
            if (trigger) {
                trigger.classList.remove('active');
                const icon = trigger.querySelector('[id^="icon-"]');
                if (icon) icon.textContent = '▼';
            }
        });
        this.hideDropdownOverlay();
    }
    
    makeLinksClickable(text) {
        // Convert URLs in text to clickable links
        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener" style="color: var(--primary); text-decoration: underline;">$1</a>');
    }
    
    
    renderCountryCard(country) {
        const hasDetailedInfo = country.hasDetailedInfo !== false;
        
        return `
            <div class="visa-info-card">
                <div class="visa-card-header">
                    <div class="country-info">
                        <div class="country-flag">${country.flag}</div>
                        <h3 class="country-name">${country.country}</h3>
                        <p class="embassy-location">${country.embassy || country.city || 'Embassy information available'}</p>
                    </div>
                    <div class="visa-type-badge">${hasDetailedInfo && country.tags?.includes('evisa') ? 'E-Visa' : hasDetailedInfo ? 'Embassy' : 'Contact Required'}</div>
                </div>
                
                <!-- Key Details -->
                <div class="visa-details-section">
                    <h4><span class="section-icon">💰</span> Cost & Validity</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Cost</div>
                            <div class="detail-value cost">${country.visaCost}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Validity</div>
                            <div class="detail-value">${country.validity || 'Varies'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Extension</div>
                            <div class="detail-value ${country.extensionPossible ? 'extension-yes' : 'extension-no'}">
                                ${country.extensionPossible ? 'Available' : 'Not Available'}
                            </div>
                        </div>
                    </div>
                </div>
                
                ${hasDetailedInfo ? `
                    <!-- Processing Steps -->
                    <div class="visa-details-section">
                        <h4><span class="section-icon">📋</span> Application Process</h4>
                        <div class="processing-steps">
                            <ol>
                                ${country.processingSteps.map(step => `<li>${step}</li>`).join('')}
                            </ol>
                        </div>
                    </div>
                    
                    <!-- Extension Information -->
                    <div class="visa-details-section">
                        <h4><span class="section-icon">⏰</span> Extension Policy</h4>
                        <div class="extension-info ${country.extensionPossible ? 'extension-available' : 'extension-not-available'}">
                            ${country.extensionPossible ? `
                                <p><strong>Duration:</strong> ${country.extensionDuration}</p>
                                <p><strong>Cost:</strong> ${country.extensionCost}</p>
                            ` : '<p>Visa extensions are not available for this destination.</p>'}
                        </div>
                    </div>
                    
                    <!-- Official Links -->
                    <div class="official-links">
                        <h4><span class="section-icon">🔗</span> Official Resources</h4>
                        <ul class="links-list">
                            ${country.links.map(link => `
                                <li><a href="${link.url}" target="_blank" rel="noopener">${link.text} →</a></li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <!-- Source Information -->
                    <div class="source-info">
                        <strong>Source:</strong> ${country.sourceName} (${country.sourceType})<br>
                        <strong>Update Frequency:</strong> ${country.updateFrequency}
                    </div>
                ` : `
                    <!-- Limited Information Notice -->
                    <div class="visa-details-section">
                        <div class="extension-info extension-not-available">
                            <p><strong>Limited Information Available</strong></p>
                            <p>Detailed visa requirements are not available in our database for this country. Please contact the embassy directly for accurate and up-to-date visa information.</p>
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    addToComparison(countryName) {
        if (this.comparisonCountries.length >= this.maxComparisons) {
            alert(`You can only compare up to ${this.maxComparisons} countries at once.`);
            return;
        }
        
        if (!this.comparisonCountries.some(c => c.country === countryName)) {
            const countryData = this.getCountryData(countryName);
            if (countryData) {
                this.comparisonCountries.push(countryData);
                this.updateSelectedCountriesBar();
                this.renderVisaInformation();
                this.closeCountrySelection();
                this.renderComparisonTable();
            }
        }
    }
    
    removeFromComparison(countryName) {
        this.comparisonCountries = this.comparisonCountries.filter(c => c.country !== countryName);
        this.updateSelectedCountriesBar();
        this.renderVisaInformation();
        this.renderSelectedCountries();
        this.renderComparisonTable();
        
        // Update URL if this was the main country
        if (this.comparisonCountries.length === 0) {
            if (window.history) {
                const url = new URL(window.location);
                url.searchParams.delete('country');
                window.history.pushState({}, '', url);
            }
        }
    }



    // Comparison functionality
    openComparisonPanel() {
        const panel = document.getElementById('comparisonPanel');
        const btn = document.getElementById('compareBtn');
        
        panel.classList.add('active');
        btn.classList.add('active');
        
        this.renderSelectedCountries();
        this.renderComparisonTable();
    }

    closeComparisonPanel() {
        const panel = document.getElementById('comparisonPanel');
        const btn = document.getElementById('compareBtn');
        
        panel.classList.remove('active');
        btn.classList.remove('active');
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