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
        
        // Update existing data with country mapping (force update to catch new mappings)
        const updatedCount = await this.updateExistingDataWithCountryMapping(true);
        if (updatedCount > 0) {
            console.log(`Updated ${updatedCount} existing location records with country mapping`);
            // Refresh the country data after updating existing records
            await this.refreshCountryDataFromImports();
        }
        
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

        // Load SIV countries for search - prioritize imported data from localStorage
        try {
            // First, try to load from imported SIV data (dynamically uploaded)
            const importedSIVData = localStorage.getItem('sivImportData');
            if (importedSIVData) {
                const data = JSON.parse(importedSIVData);
                if (data.embassies && data.embassies.length > 0) {
                    console.log('Loading countries from imported SIV data:', data.embassies.length, 'locations');
                    data.embassies.forEach(embassy => {
                        // Use location name as search key but map to proper country
                        const locationName = embassy.embassy || 'Unknown';
                        const mappedCountry = embassy.country || this.getCountryFromLocation(locationName);
                        
                        // Use location name as key for search, but store proper country info
                        if (!this.countryData[locationName]) {
                            this.countryData[locationName] = {
                                country: mappedCountry, // Store mapped country name
                                flag: this.getCountryFlag(mappedCountry), // Use country for flag
                                location: locationName,
                                visaRequired: "unknown",
                                visaType: "SQ Visas",
                                visaCost: "",
                                validity: "",
                                processingTime: "",
                                applicationMethod: "embassy",
                                officialLink: "",
                                processingSteps: [],
                                extensionPossible: "unknown",
                                extensionDuration: "",
                                extensionCost: "",
                                sourceName: "SIV Import",
                                sourceType: "siv_data",
                                lastUpdated: embassy.lastUpdated || new Date().toISOString().split('T')[0],
                                sivData: embassy, // Store the full SIV data
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
                }
            }
            
            // Fallback: Load from static file if no imported data
            if (Object.keys(this.countryData).length === 0) {
                const response = await fetch('data/embassy-siv-data.json');
                const data = await response.json();
                if (data.embassies && data.embassies.length > 0) {
                    console.log('Loading countries from static SIV data file');
                    data.embassies.forEach(embassy => {
                        if (!this.countryData[embassy.country]) {
                            this.countryData[embassy.country] = {
                                country: embassy.country,
                                flag: this.getCountryFlag(embassy.country),
                                location: embassy.embassy,
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
                }
            }
        } catch (error) {
            console.error('Error loading SIV data:', error);
        }

        // Load change history from localStorage
        const savedHistory = localStorage.getItem('adminChangeHistory');
        if (savedHistory) {
            this.changeHistory = JSON.parse(savedHistory);
        }
    }

    getCountryFromLocation(location) {
        // Comprehensive location/city to country mapping
        const locationToCountry = {
            // US Posts (Embassies and Consulates)
            'Abu Dhabi': 'United Arab Emirates',
            'Almaty': 'Kazakhstan',
            'Amman': 'Jordan',
            'Amsterdam': 'Netherlands',
            'Ankara': 'Turkey',
            'Athens': 'Greece',
            'Auckland': 'New Zealand',
            'Baghdad': 'Iraq',
            'Bangkok': 'Thailand',
            'Barcelona': 'Spain',
            'Beijing': 'China',
            'Belgrade': 'Serbia',
            'Berlin': 'Germany',
            'Bern': 'Switzerland',
            'Bogota': 'Colombia',
            'Brasilia': 'Brazil',
            'Brussels': 'Belgium',
            'Bucharest': 'Romania',
            'Budapest': 'Hungary',
            'Buenos Aires': 'Argentina',
            'Cairo': 'Egypt',
            'Calgary': 'Canada',
            'Canberra': 'Australia',
            'Cape Town': 'South Africa',
            'Caracas': 'Venezuela',
            'Casablanca': 'Morocco',
            'Chennai': 'India',
            'Chengdu': 'China',
            'Ciudad Juarez': 'Mexico',
            'Copenhagen': 'Denmark',
            'Dakar': 'Senegal',
            'Damascus': 'Syria',
            'Delhi': 'India',
            'New Delhi': 'India',
            'Dhaka': 'Bangladesh',
            'Doha': 'Qatar',
            'Dubai': 'United Arab Emirates',
            'Dublin': 'Ireland',
            'Dusseldorf': 'Germany',
            'Edinburgh': 'United Kingdom',
            'Florence': 'Italy',
            'Frankfurt': 'Germany',
            'Geneva': 'Switzerland',
            'Guatemala City': 'Guatemala',
            'Guadalajara': 'Mexico',
            'Guangzhou': 'China',
            'Hamburg': 'Germany',
            'Hanoi': 'Vietnam',
            'Havana': 'Cuba',
            'Helsinki': 'Finland',
            'Ho Chi Minh City': 'Vietnam',
            'Hong Kong': 'Hong Kong',
            'Hyderabad': 'India',
            'Istanbul': 'Turkey',
            'Islamabad': 'Pakistan',
            'Jakarta': 'Indonesia',
            'Jeddah': 'Saudi Arabia',
            'Jerusalem': 'Israel',
            'Johannesburg': 'South Africa',
            'Kabul': 'Afghanistan',
            'Kampala': 'Uganda',
            'Karachi': 'Pakistan',
            'Kathmandu': 'Nepal',
            'Kigali': 'Rwanda',
            'Kingston': 'Jamaica',
            'Kolkata': 'India',
            'Kuala Lumpur': 'Malaysia',
            'Kuwait': 'Kuwait',
            'Kuwait City': 'Kuwait',
            'Kyiv': 'Ukraine',
            'Lagos': 'Nigeria',
            'Lahore': 'Pakistan',
            'La Paz': 'Bolivia',
            'Lima': 'Peru',
            'Lisbon': 'Portugal',
            'London': 'United Kingdom',
            'Lyon': 'France',
            'Madrid': 'Spain',
            'Manila': 'Philippines',
            'Marseille': 'France',
            'Melbourne': 'Australia',
            'Mexico City': 'Mexico',
            'Milan': 'Italy',
            'Montreal': 'Canada',
            'Moscow': 'Russia',
            'Mumbai': 'India',
            'Munich': 'Germany',
            'Nairobi': 'Kenya',
            'Naples': 'Italy',
            'Nassau': 'Bahamas',
            'Nicosia': 'Cyprus',
            'Nogales': 'Mexico',
            'Nuevo Laredo': 'Mexico',
            'Oslo': 'Norway',
            'Ottawa': 'Canada',
            'Panama City': 'Panama',
            'Paris': 'France',
            'Perth': 'Australia',
            'Peshawar': 'Pakistan',
            'Prague': 'Czech Republic',
            'Pretoria': 'South Africa',
            'Quebec': 'Canada',
            'Quito': 'Ecuador',
            'Reykjavik': 'Iceland',
            'Rio de Janeiro': 'Brazil',
            'Riyadh': 'Saudi Arabia',
            'Rome': 'Italy',
            'Salvador': 'Brazil',
            'San Jose': 'Costa Rica',
            'Santiago': 'Chile',
            'Sao Paulo': 'Brazil',
            'Seoul': 'South Korea',
            'Shanghai': 'China',
            'Shenyang': 'China',
            'Singapore': 'Singapore',
            'Sofia': 'Bulgaria',
            'Stockholm': 'Sweden',
            'Strasbourg': 'France',
            'Sydney': 'Australia',
            'Taipei': 'Taiwan',
            'Tashkent': 'Uzbekistan',
            'Tbilisi': 'Georgia',
            'Tel Aviv': 'Israel',
            'Thessaloniki': 'Greece',
            'Tijuana': 'Mexico',
            'Tirana': 'Albania',
            'Tokyo': 'Japan',
            'Toronto': 'Canada',
            'Tunis': 'Tunisia',
            'Vancouver': 'Canada',
            'Vienna': 'Austria',
            'Vladivostok': 'Russia',
            'Warsaw': 'Poland',
            'Wuhan': 'China',
            'Yekaterinburg': 'Russia',
            'Yerevan': 'Armenia',
            'Zagreb': 'Croatia',
            'Zurich': 'Switzerland',
            
            // Additional mappings for common variations and missing cities
            'Ho Chi Minh': 'Vietnam',
            'New York': 'United States',
            'Los Angeles': 'United States',
            'Chicago': 'United States',
            'Houston': 'United States',
            'Boston': 'United States',
            'San Francisco': 'United States',
            'Miami': 'United States',
            'Atlanta': 'United States',
            'Seattle': 'United States',
            'Detroit': 'United States',
            
            // Additional cities that might be missing
            'Abidjan': 'Ivory Coast',
            'Accra': 'Ghana',
            'Addis Ababa': 'Ethiopia',
            'Algiers': 'Algeria',
            'Ashgabat': 'Turkmenistan',
            'Astana': 'Kazakhstan',
            'Baku': 'Azerbaijan',
            'Bamako': 'Mali',
            'Bandar Seri Begawan': 'Brunei',
            'Banjul': 'Gambia',
            'Beirut': 'Lebanon',
            'Belize City': 'Belize',
            'Bishkek': 'Kyrgyzstan',
            'Bridgetown': 'Barbados',
            'Colombo': 'Sri Lanka',
            'Conakry': 'Guinea',
            'Djibouti': 'Djibouti',
            'Freetown': 'Sierra Leone',
            'Gaborone': 'Botswana',
            'Georgetown': 'Guyana',
            'Harare': 'Zimbabwe',
            'Khartoum': 'Sudan',
            'Kinshasa': 'Democratic Republic of Congo',
            'Libreville': 'Gabon',
            'Lilongwe': 'Malawi',
            'Ljubljana': 'Slovenia',
            'Lome': 'Togo',
            'Luanda': 'Angola',
            'Lusaka': 'Zambia',
            'Manama': 'Bahrain',
            'Maputo': 'Mozambique',
            'Minsk': 'Belarus',
            'Monrovia': 'Liberia',
            'Montevideo': 'Uruguay',
            'Muscat': 'Oman',
            'Ndjamena': 'Chad',
            'Ouagadougou': 'Burkina Faso',
            'Phnom Penh': 'Cambodia',
            'Port Louis': 'Mauritius',
            'Port of Spain': 'Trinidad and Tobago',
            'Rabat': 'Morocco',
            'Riga': 'Latvia',
            'San Salvador': 'El Salvador',
            'Sanaa': 'Yemen',
            'Skopje': 'North Macedonia',
            'Suva': 'Fiji',
            'Tallinn': 'Estonia',
            'Tegucigalpa': 'Honduras',
            'Thimphu': 'Bhutan',
            'Ulaanbaatar': 'Mongolia',
            'Valletta': 'Malta',
            'Vientiane': 'Laos',
            'Vilnius': 'Lithuania',
            'Windhoek': 'Namibia',
            'Yaounde': 'Cameroon'
        };
        
        // Clean the location name and try exact match first
        const cleanLocation = location.trim();
        if (locationToCountry[cleanLocation]) {
            return locationToCountry[cleanLocation];
        }
        
        // Try partial matching for variations
        for (const [locationName, country] of Object.entries(locationToCountry)) {
            if (cleanLocation.toLowerCase().includes(locationName.toLowerCase()) ||
                locationName.toLowerCase().includes(cleanLocation.toLowerCase())) {
                return country;
            }
        }
        
        // If no match found, return the location name as country (fallback)
        return cleanLocation;
    }

    getCountryFlag(country) {
        const flagMap = {
            // Original countries
            'Pakistan': '🇵🇰', 'Qatar': '🇶🇦', 'Albania': '🇦🇱', 'Turkey': '🇹🇷',
            'Germany': '🇩🇪', 'Canada': '🇨🇦', 'Philippines': '🇵🇭', 'UAE': '🇦🇪',
            'Iraq': '🇮🇶', 'Rwanda': '🇷🇼', 'United Arab Emirates': '🇦🇪',
            'United States': '🇺🇸', 'India': '🇮🇳', 'Iran': '🇮🇷', 'Afghanistan': '🇦🇫',
            'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Belgium': '🇧🇪', 'Brazil': '🇧🇷',
            'China': '🇨🇳', 'Denmark': '🇩🇰', 'Egypt': '🇪🇬', 'France': '🇫🇷',
            
            // Embassy locations that commonly appear in SIV data
            'Abu Dhabi': '🇦🇪', 'Ankara': '🇹🇷', 'Auckland': '🇳🇿', 'Baghdad': '🇮🇶',
            'Bangkok': '🇹🇭', 'Beijing': '🇨🇳', 'Berlin': '🇩🇪', 'Bogota': '🇨🇴',
            'Brussels': '🇧🇪', 'Cairo': '🇪🇬', 'Canberra': '🇦🇺', 'Copenhagen': '🇩🇰',
            'Damascus': '🇸🇾', 'Delhi': '🇮🇳', 'Dublin': '🇮🇪', 'Frankfurt': '🇩🇪',
            'Geneva': '🇨🇭', 'Ho Chi Minh City': '🇻🇳', 'Islamabad': '🇵🇰', 'Istanbul': '🇹🇷',
            'Jakarta': '🇮🇩', 'Kabul': '🇦🇫', 'Karachi': '🇵🇰', 'Kigali': '🇷🇼',
            'Kuwait': '🇰🇼', 'Lima': '🇵🇪', 'London': '🇬🇧', 'Madrid': '🇪🇸',
            'Manila': '🇵🇭', 'Mexico City': '🇲🇽', 'Moscow': '🇷🇺', 'Mumbai': '🇮🇳',
            'Nairobi': '🇰🇪', 'New Delhi': '🇮🇳', 'Paris': '🇫🇷', 'Riyadh': '🇸🇦',
            'Rome': '🇮🇹', 'Seoul': '🇰🇷', 'Singapore': '🇸🇬', 'Sydney': '🇦🇺',
            'Tel Aviv': '🇮🇱', 'Tokyo': '🇯🇵', 'Vienna': '🇦🇹', 'Warsaw': '🇵🇱',
            
            // Common country names and additional countries
            'Thailand': '🇹🇭', 'Vietnam': '🇻🇳', 'Indonesia': '🇮🇩', 'Malaysia': '🇲🇾',
            'South Korea': '🇰🇷', 'Japan': '🇯🇵', 'Kenya': '🇰🇪', 'Syria': '🇸🇾',
            'Kuwait': '🇰🇼', 'Saudi Arabia': '🇸🇦', 'Israel': '🇮🇱', 'Italy': '🇮🇹', 
            'Spain': '🇪🇸', 'Poland': '🇵🇱', 'Russia': '🇷🇺', 'Peru': '🇵🇪', 
            'Mexico': '🇲🇽', 'Colombia': '🇨🇴', 'Ireland': '🇮🇪', 'Switzerland': '🇨🇭', 
            'United Kingdom': '🇬🇧', 'New Zealand': '🇳🇿', 'Jordan': '🇯🇴',
            
            // Additional countries for embassy mapping
            'Kazakhstan': '🇰🇿', 'Netherlands': '🇳🇱', 'Greece': '🇬🇷', 'Serbia': '🇷🇸',
            'Romania': '🇷🇴', 'Hungary': '🇭🇺', 'Argentina': '🇦🇷', 'Venezuela': '🇻🇪',
            'Morocco': '🇲🇦', 'Bangladesh': '🇧🇩', 'Finland': '🇫🇮', 'Hong Kong': '🇭🇰',
            'Uganda': '🇺🇬', 'Nepal': '🇳🇵', 'Jamaica': '🇯🇲', 'Cyprus': '🇨🇾',
            'Nigeria': '🇳🇬', 'Bolivia': '🇧🇴', 'Portugal': '🇵🇹', 'Iceland': '🇮🇸',
            'Chile': '🇨🇱', 'Bulgaria': '🇧🇬', 'Sweden': '🇸🇪', 'Taiwan': '🇹🇼',
            'Uzbekistan': '🇺🇿', 'Georgia': '🇬🇪', 'Croatia': '🇭🇷', 'South Africa': '🇿🇦',
            'Senegal': '🇸🇳', 'Guatemala': '🇬🇹', 'Cuba': '🇨🇺', 'Bahamas': '🇧🇸',
            'Panama': '🇵🇦', 'Czech Republic': '🇨🇿', 'Ecuador': '🇪🇨', 'Costa Rica': '🇨🇷',
            'Tunisia': '🇹🇳', 'Armenia': '🇦🇲', 'Ukraine': '🇺🇦', 'Singapore': '🇸🇬',
            'Norway': '🇳🇴',
            
            // Additional country flags for new embassy mappings
            'Ivory Coast': '🇨🇮', 'Ghana': '🇬🇭', 'Ethiopia': '🇪🇹', 'Algeria': '🇩🇿',
            'Turkmenistan': '🇹🇲', 'Azerbaijan': '🇦🇿', 'Mali': '🇲🇱', 'Brunei': '🇧🇳',
            'Gambia': '🇬🇲', 'Lebanon': '🇱🇧', 'Belize': '🇧🇿', 'Kyrgyzstan': '🇰🇬',
            'Barbados': '🇧🇧', 'Sri Lanka': '🇱🇰', 'Guinea': '🇬🇳', 'Djibouti': '🇩🇯',
            'Sierra Leone': '🇸🇱', 'Botswana': '🇧🇼', 'Guyana': '🇬🇾', 'Zimbabwe': '🇿🇼',
            'Sudan': '🇸🇩', 'Democratic Republic of Congo': '🇨🇩', 'Gabon': '🇬🇦', 'Malawi': '🇲🇼',
            'Slovenia': '🇸🇮', 'Togo': '🇹🇬', 'Angola': '🇦🇴', 'Zambia': '🇿🇲',
            'Bahrain': '🇧🇭', 'Mozambique': '🇲🇿', 'Belarus': '🇧🇾', 'Liberia': '🇱🇷',
            'Uruguay': '🇺🇾', 'Oman': '🇴🇲', 'Chad': '🇹🇩', 'Burkina Faso': '🇧🇫',
            'Cambodia': '🇰🇭', 'Mauritius': '🇲🇺', 'Trinidad and Tobago': '🇹🇹', 'Latvia': '🇱🇻',
            'El Salvador': '🇸🇻', 'Yemen': '🇾🇪', 'North Macedonia': '🇲🇰', 'Fiji': '🇫🇯',
            'Estonia': '🇪🇪', 'Honduras': '🇭🇳', 'Bhutan': '🇧🇹', 'Mongolia': '🇲🇳',
            'Malta': '🇲🇹', 'Laos': '🇱🇦', 'Lithuania': '🇱🇹', 'Namibia': '🇳🇦',
            'Cameroon': '🇨🇲'
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
                        <p>${country.location || country.embassy}</p>
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
                    <p>${country.location || country.embassy}</p>
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
        document.getElementById('embassyInfo').textContent = `${data.location || data.embassy}`;

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

        // Initialize selected files array
        this.selectedFiles = [];
        
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
            const files = Array.from(e.dataTransfer.files);
            this.handleMultipleFileSelect(files, 'siv');
        });

        // File input change handler
        sivFileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleMultipleFileSelect(files, 'siv');
        });

        // Button handlers
        sivPreviewBtn.addEventListener('click', () => this.previewImport());
        sivImportBtn.addEventListener('click', () => this.startMultipleImport());
        
        // Cancel import
        document.getElementById('cancelImportBtn')?.addEventListener('click', () => {
            this.cancelImport();
        });
    }

    handleMultipleFileSelect(files, type) {
        // Filter for Excel files only
        const excelFiles = files.filter(file => {
            const extension = file.name.toLowerCase().split('.').pop();
            return extension === 'xlsx' || extension === 'xls';
        });

        if (excelFiles.length === 0) {
            this.showNotification('Please select valid Excel files (.xlsx or .xls)', 'error');
            return;
        }

        // Add files to selection, avoiding duplicates
        excelFiles.forEach(file => {
            const exists = this.selectedFiles.find(f => f.name === file.name && f.size === file.size);
            if (!exists) {
                this.selectedFiles.push({
                    file: file,
                    id: Date.now() + Math.random(),
                    status: 'pending',
                    data: null,
                    error: null
                });
            }
        });

        this.updateMultipleFileUI();
        
        // Show notification for added files
        const addedCount = excelFiles.length;
        this.showNotification(`Added ${addedCount} file${addedCount > 1 ? 's' : ''} to selection`, 'success');
    }

    updateMultipleFileUI() {
        const uploadArea = document.getElementById('sivUploadArea');
        const selectedFilesDiv = document.getElementById('selectedFiles');
        const previewBtn = document.getElementById('sivPreviewBtn');
        const importBtn = document.getElementById('sivImportBtn');

        if (this.selectedFiles.length === 0) {
            // Reset to default state
            uploadArea.innerHTML = `
                <div class="upload-content">
                    <span class="upload-icon">📁</span>
                    <p class="upload-text">Drop Excel files here or <span class="upload-link">browse files</span></p>
                    <p class="upload-hint">Supports .xlsx and .xls formats • Select multiple files</p>
                </div>
            `;
            uploadArea.style.pointerEvents = '';
            uploadArea.style.opacity = '';
            selectedFilesDiv.style.display = 'none';
            previewBtn.disabled = true;
            importBtn.disabled = true;
            return;
        }

        // Update upload area to show file count
        uploadArea.innerHTML = `
            <div class="upload-content">
                <span class="upload-icon">📄</span>
                <p class="upload-text"><strong>${this.selectedFiles.length} files selected</strong></p>
                <p class="upload-hint">Click to add more files or drag and drop additional files</p>
            </div>
        `;

        // Show selected files
        selectedFilesDiv.style.display = 'block';
        selectedFilesDiv.innerHTML = `
            <div class="selected-files-header">
                <span>Selected Files (${this.selectedFiles.length})</span>
                <button class="btn btn-secondary btn-sm" onclick="adminPortal.clearAllFiles()">Clear All</button>
            </div>
            ${this.selectedFiles.map(fileObj => `
                <div class="file-item" data-file-id="${fileObj.id}">
                    <div class="file-info">
                        <span class="file-icon">📄</span>
                        <div>
                            <div class="file-name">${fileObj.file.name}</div>
                            <div class="file-size">${this.formatFileSize(fileObj.file.size)}</div>
                        </div>
                    </div>
                    <div class="file-status">
                        <span class="status-badge status-${fileObj.status}">${fileObj.status}</span>
                        <button class="file-remove" onclick="adminPortal.removeFile('${fileObj.id}')" title="Remove file">
                            ✕
                        </button>
                    </div>
                </div>
            `).join('')}
        `;

        // Enable buttons
        previewBtn.disabled = false;
        importBtn.disabled = false;
    }

    removeFile(fileId) {
        this.selectedFiles = this.selectedFiles.filter(f => f.id !== fileId);
        this.updateMultipleFileUI();
        this.showNotification('File removed from selection', 'warning');
    }

    clearAllFiles() {
        this.selectedFiles = [];
        this.updateMultipleFileUI();
        this.showNotification('All files cleared', 'warning');
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
                            <li>The file contains location/post data with SQ visa columns</li>
                            <li>The file follows the "MONTH YEAR - IV Issuances by Post and Visa Class" format</li>
                            <li>The data includes columns for Post/Location and SQ visa counts</li>
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
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (jsonData.length < 3) {
            throw new Error('Excel file must contain title, header, and data rows');
        }
        
        // Validate file format - Row 1 should contain title with month/year
        const titleRow = jsonData[0];
        if (!titleRow || !titleRow[0] || !titleRow[0].toString().toLowerCase().includes('immigrant visa issuances')) {
            throw new Error('File does not appear to be an "IV Issuances by Post and Visa Class" file');
        }
        
        // Row 2 should contain headers: Post, Visa Class, Issuances
        const headerRow = jsonData[1];
        if (!headerRow || headerRow.length < 3) {
            throw new Error('Invalid header row format');
        }
        
        const headers = headerRow.map(h => h ? h.toString().trim().toLowerCase() : '');
        if (!headers.includes('post') || !headers.includes('visa class') || !headers.includes('issuances')) {
            throw new Error('Missing required columns: Post, Visa Class, Issuances');
        }
        
        // Map column indices
        const postIndex = headers.indexOf('post');
        const visaClassIndex = headers.indexOf('visa class');
        const issuancesIndex = headers.indexOf('issuances');
        
        // Extract month/year from title or filename
        const monthYear = this.extractMonthYear(titleRow[0].toString(), this.currentImport?.file?.name || '');
        if (!monthYear) {
            throw new Error('Could not extract month and year from file');
        }
        
        // Process data rows (starting from row 3)
        const dataRows = jsonData.slice(2);
        const sqByPost = {}; // Aggregate SQ visas by post
        
        dataRows.forEach((row, index) => {
            if (!row || row.every(cell => !cell)) return; // Skip empty rows
            
            const post = row[postIndex] ? row[postIndex].toString().trim() : '';
            const visaClass = row[visaClassIndex] ? row[visaClassIndex].toString().trim() : '';
            const issuances = parseInt(row[issuancesIndex]) || 0;
            
            // Only process SQ visa classes
            if (post && visaClass.startsWith('SQ') && issuances > 0) {
                if (!sqByPost[post]) {
                    // Map location/city to country
                    const mappedCountry = this.getCountryFromLocation(post);
                    
                    sqByPost[post] = {
                        location: post,
                        country: mappedCountry, // Use mapped country
                        sqCount: 0,
                        sqBreakdown: {},
                        lastUpdated: new Date().toISOString().split('T')[0],
                        sourceFile: this.currentImport?.file?.name || '',
                        monthYear: monthYear.key,
                        month: monthYear.month,
                        year: monthYear.year,
                        monthData: {} // Initialize monthly data structure
                    };
                }
                
                sqByPost[post].sqCount += issuances;
                sqByPost[post].sqBreakdown[visaClass] = issuances;
            }
        });
        
        // Add monthly data to each post record and convert to array
        const processedData = Object.values(sqByPost).map(post => {
            // Set the monthly data for this specific month/year
            post.monthData[monthYear.key] = post.sqCount;
            return post;
        }).sort((a, b) => b.sqCount - a.sqCount);
        
        if (processedData.length === 0) {
            throw new Error('No SQ visa data found in the file');
        }
        
        return processedData;
    }

    extractMonthYear(title, filename) {
        // Try to extract from title first (e.g., "Immigrant Visa Issuances by Post May 2025")
        let monthMatch = title.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);
        
        // If not in title, try filename (e.g., "MAY 2025 - IV Issuances...")
        if (!monthMatch) {
            monthMatch = filename.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);
        }
        
        if (!monthMatch) {
            return null;
        }
        
        const monthName = monthMatch[1].toLowerCase();
        const year = monthMatch[2];
        const monthMap = {
            'january': '01', 'february': '02', 'march': '03', 'april': '04',
            'may': '05', 'june': '06', 'july': '07', 'august': '08',
            'september': '09', 'october': '10', 'november': '11', 'december': '12'
        };
        
        return {
            month: monthName,
            year: year,
            key: `${year}-${monthMap[monthName]}`,
            display: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`
        };
    }

    async previewImport() {
        if (this.selectedFiles.length === 0) {
            this.showNotification('No files selected for preview', 'error');
            return;
        }
        
        // Show progress panel
        document.getElementById('importProgress').style.display = 'block';
        document.getElementById('progressStatus').textContent = 'Parsing files for preview...';
        document.getElementById('progressFill').style.width = '0%';
        
        // Parse all selected files first
        await this.parseAllSelectedFiles();
        
        const allPreviewData = [];
        let totalRecords = 0;
        let successfulFiles = 0;
        let errorFiles = 0;
        
        for (const fileObj of this.selectedFiles) {
            if (fileObj.status === 'success' && fileObj.data) {
                totalRecords += fileObj.data.length;
                successfulFiles++;
                allPreviewData.push({
                    filename: fileObj.file.name,
                    data: fileObj.data.slice(0, 3), // Show first 3 records per file
                    totalRecords: fileObj.data.length,
                    monthYear: fileObj.data[0]?.monthYear || 'Unknown'
                });
            } else if (fileObj.status === 'error') {
                errorFiles++;
            }
        }
        
        document.getElementById('progressFill').style.width = '100%';
        document.getElementById('progressStatus').textContent = 'Preview ready';
        
        if (allPreviewData.length === 0) {
            const errorHTML = `
                <div class="preview-error">
                    <h4>⚠️ No Valid Data Found</h4>
                    <p>None of the selected files could be processed successfully.</p>
                    ${this.selectedFiles.filter(f => f.status === 'error').map(f => 
                        `<p><strong>${f.file.name}:</strong> ${f.error}</p>`
                    ).join('')}
                </div>
            `;
            document.getElementById('progressLog').innerHTML = errorHTML;
            return;
        }
        
        const previewHTML = `
            <div class="preview-summary">
                <h4>📊 Multi-File Import Preview</h4>
                <div class="preview-stats">
                    <div class="stat-item">
                        <strong>✅ Successful Files:</strong> ${successfulFiles}
                    </div>
                    <div class="stat-item">
                        <strong>❌ Error Files:</strong> ${errorFiles}
                    </div>
                    <div class="stat-item">
                        <strong>📄 Total Records:</strong> ${totalRecords}
                    </div>
                </div>
            </div>
            
            ${allPreviewData.map((fileData, index) => `
                <div class="file-preview-section">
                    <h5>📄 ${fileData.filename} (${fileData.monthYear})</h5>
                    <p><strong>Records:</strong> ${fileData.totalRecords} SQ visa entries</p>
                    
                    <table class="preview-data-table">
                        <thead>
                            <tr>
                                <th>Location/Post</th>
                                <th>SQ Visas</th>
                                <th>SQ Breakdown</th>
                                <th>Month</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fileData.data.map(record => `
                                <tr>
                                    <td>${record.location || record.embassy}</td>
                                    <td>${record.sqCount}</td>
                                    <td>${Object.entries(record.sqBreakdown || {}).map(([type, count]) => `${type}: ${count}`).join(', ')}</td>
                                    <td>${record.monthYear || 'N/A'}</td>
                                </tr>
                            `).join('')}
                            ${fileData.totalRecords > 3 ? `
                                <tr>
                                    <td colspan="4" style="text-align: center; font-style: italic; color: #666;">
                                        ... and ${fileData.totalRecords - 3} more records
                                    </td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            `).join('')}
        `;
        
        document.getElementById('progressLog').innerHTML = previewHTML;
    }

    async parseAllSelectedFiles() {
        for (let i = 0; i < this.selectedFiles.length; i++) {
            const fileObj = this.selectedFiles[i];
            
            if (fileObj.status === 'pending') {
                try {
                    fileObj.status = 'processing';
                    this.updateFileStatus(fileObj.id, 'processing');
                    
                    // Update progress
                    const progress = ((i + 1) / this.selectedFiles.length) * 100;
                    document.getElementById('progressFill').style.width = `${progress}%`;
                    
                    // Parse the file
                    const arrayBuffer = await fileObj.file.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    
                    // Create temporary currentImport for parsing
                    const tempImport = {
                        file: fileObj.file,
                        data: null
                    };
                    const originalImport = this.currentImport;
                    this.currentImport = tempImport;
                    
                    const parsedData = this.parseSIVData(workbook);
                    
                    // Restore original import
                    this.currentImport = originalImport;
                    
                    fileObj.data = parsedData;
                    fileObj.status = 'success';
                    fileObj.error = null;
                    
                } catch (error) {
                    console.error(`Error parsing ${fileObj.file.name}:`, error);
                    fileObj.status = 'error';
                    fileObj.error = error.message;
                    fileObj.data = null;
                }
                
                this.updateFileStatus(fileObj.id, fileObj.status);
            }
        }
    }

    updateFileStatus(fileId, status) {
        const fileElement = document.querySelector(`[data-file-id="${fileId}"] .status-badge`);
        if (fileElement) {
            fileElement.className = `status-badge status-${status}`;
            fileElement.textContent = status;
        }
    }

    async startMultipleImport() {
        if (this.selectedFiles.length === 0) {
            this.showNotification('No files selected for import', 'error');
            return;
        }
        
        // Parse all files first if not already parsed
        await this.parseAllSelectedFiles();
        
        // Check if we have any successful files
        const validFiles = this.selectedFiles.filter(f => f.status === 'success' && f.data);
        if (validFiles.length === 0) {
            this.showNotification('No valid files to import', 'error');
            return;
        }
        
        const replaceData = document.getElementById('sivReplaceData').checked;
        
        // Show progress
        document.getElementById('importProgress').style.display = 'block';
        document.getElementById('progressStatus').textContent = 'Starting multi-file import...';
        document.getElementById('progressFill').style.width = '0%';
        
        let totalRecordsProcessed = 0;
        let totalRecordsUpdated = 0;
        let totalErrors = 0;
        const importResults = [];
        
        try {
            for (let i = 0; i < validFiles.length; i++) {
                const fileObj = validFiles[i];
                
                // Update progress
                const progress = (i / validFiles.length) * 100;
                document.getElementById('progressFill').style.width = `${progress}%`;
                document.getElementById('progressStatus').textContent = `Processing ${fileObj.file.name}...`;
                
                try {
                    const result = await this.processSIVImport(fileObj.data, replaceData, false);
                    
                    totalRecordsProcessed += fileObj.data.length;
                    totalRecordsUpdated += result.updated;
                    totalErrors += result.errors;
                    
                    importResults.push({
                        filename: fileObj.file.name,
                        recordsProcessed: fileObj.data.length,
                        recordsUpdated: result.updated,
                        errors: result.errors,
                        status: 'success'
                    });
                    
                } catch (error) {
                    console.error(`Error importing ${fileObj.file.name}:`, error);
                    importResults.push({
                        filename: fileObj.file.name,
                        recordsProcessed: 0,
                        recordsUpdated: 0,
                        errors: 1,
                        status: 'error',
                        errorMessage: error.message
                    });
                    totalErrors++;
                }
            }
            
            // Update progress
            document.getElementById('progressFill').style.width = '100%';
            document.getElementById('progressStatus').textContent = 'Multi-file import completed!';
            
            // Create combined import record
            const combinedImportRecord = {
                id: Date.now(),
                filename: `Multi-file import (${validFiles.length} files)`,
                fileType: 'SIV Issuances (Batch)',
                fileSize: this.formatFileSize(validFiles.reduce((sum, f) => sum + f.file.size, 0)),
                status: totalErrors > 0 ? 'partial' : 'success',
                recordsProcessed: totalRecordsProcessed,
                recordsUpdated: totalRecordsUpdated,
                errors: totalErrors,
                uploadedBy: 'admin@example.com',
                uploadDate: new Date().toISOString(),
                processingTime: 'N/A',
                details: importResults
            };
            
            this.fileUploads.unshift(combinedImportRecord);
            this.saveImportHistory();
            this.updateImportHistoryTable();
            
            // Show summary notification
            const message = totalErrors > 0 
                ? `Multi-file import completed with errors. Updated ${totalRecordsUpdated} records, ${totalErrors} errors.`
                : `Multi-file import completed successfully! Updated ${totalRecordsUpdated} records.`;
            const type = totalErrors > 0 ? 'warning' : 'success';
            
            this.showNotification(message, type);
            
            // Refresh country data to include newly imported embassies
            await this.refreshCountryDataFromImports();
            
            // Clear files and reset UI after successful import
            setTimeout(() => {
                this.clearAllFiles();
                document.getElementById('importProgress').style.display = 'none';
            }, 3000);
            
        } catch (error) {
            console.error('Multi-file import error:', error);
            document.getElementById('progressStatus').textContent = 'Multi-file import failed: ' + error.message;
            this.showNotification('Multi-file import failed: ' + error.message, 'error');
        }
    }

    async updateExistingDataWithCountryMapping(forceUpdate = false) {
        try {
            // Update existing SIV import data with proper country mapping
            const importedSIVData = localStorage.getItem('sivImportData');
            if (importedSIVData) {
                const data = JSON.parse(importedSIVData);
                if (data.embassies && data.embassies.length > 0) {
                    console.log('Updating existing SIV data with country mapping...');
                    let updateCount = 0;
                    
                    // Update each location record with proper country mapping
                    data.embassies.forEach(embassy => {
                        const locationName = embassy.embassy || 'Unknown';
                        const mappedCountry = this.getCountryFromLocation(locationName);
                        
                        // Update if forced, or if country is missing/same as location name
                        if (forceUpdate || !embassy.country || embassy.country === locationName) {
                            embassy.country = mappedCountry;
                            console.log(`Mapped ${locationName} → ${mappedCountry}`);
                            updateCount++;
                        }
                    });
                    
                    // Save the updated data back to localStorage if any updates were made
                    if (updateCount > 0) {
                        localStorage.setItem('sivImportData', JSON.stringify(data));
                        
                        // Also update the database SIV data
                        localStorage.setItem('databaseSIVData', JSON.stringify(data.embassies));
                        
                        console.log('Updated', updateCount, 'location records with country mapping');
                    }
                    
                    return updateCount;
                }
            }
            
            return 0;
        } catch (error) {
            console.error('Error updating existing data with country mapping:', error);
            return 0;
        }
    }

    async refreshCountryDataFromImports() {
        try {
            // Load newly imported SIV data
            const importedSIVData = localStorage.getItem('sivImportData');
            if (importedSIVData) {
                const data = JSON.parse(importedSIVData);
                if (data.embassies && data.embassies.length > 0) {
                    console.log('Refreshing country data with newly imported locations:', data.embassies.length);
                    
                    data.embassies.forEach(embassy => {
                        const locationName = embassy.embassy || 'Unknown';
                        const mappedCountry = embassy.country || this.getCountryFromLocation(locationName);
                        
                        // Only add if not already exists or update if it's from SIV import
                        if (!this.countryData[locationName] || this.countryData[locationName].sourceType === 'siv_data') {
                            this.countryData[locationName] = {
                                country: mappedCountry, // Store mapped country name
                                flag: this.getCountryFlag(mappedCountry), // Use country for flag
                                location: locationName,
                                visaRequired: "unknown",
                                visaType: "SQ Visas",
                                visaCost: "",
                                validity: "",
                                processingTime: "",
                                applicationMethod: "embassy",
                                officialLink: "",
                                processingSteps: [],
                                extensionPossible: "unknown",
                                extensionDuration: "",
                                extensionCost: "",
                                sourceName: "SIV Import",
                                sourceType: "siv_data",
                                lastUpdated: embassy.lastUpdated || new Date().toISOString().split('T')[0],
                                sivData: embassy,
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
                    
                    console.log('Country data refreshed. Total countries available for search:', Object.keys(this.countryData).length);
                }
            }
        } catch (error) {
            console.error('Error refreshing country data from imports:', error);
        }
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
            if (!record.location && !record.embassy && !record.country) {
                errors.push(`Row ${record.sourceRow || index + 1}: Missing location and country`);
            }
            if (record.total === 0) {
                warnings.push(`Row ${record.sourceRow || index + 1}: Total is 0 for ${record.location || record.embassy || record.country}`);
            }
        });
        
        // Check for duplicates
        const locationSet = new Set();
        data.forEach((record, index) => {
            const locationKey = record.location || record.embassy;
            if (locationSet.has(locationKey)) {
                warnings.push(`Duplicate location found: ${locationKey}`);
            }
            locationSet.add(locationKey);
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
            
            // Refresh country data to include newly imported embassies
            await this.refreshCountryDataFromImports();
            
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