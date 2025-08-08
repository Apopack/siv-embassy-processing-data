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
        // First, clear any old hardcoded visa data from localStorage
        // This ensures we start fresh without legacy data
        const savedData = localStorage.getItem('adminCountryData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                // Filter out any entries that look like hardcoded visa data
                // Keep only entries that come from SIV imports
                const filteredData = {};
                Object.entries(parsedData).forEach(([key, value]) => {
                    // Only keep data that has sourceType = 'siv_data' or has SIV-related fields
                    if (value.sourceType === 'siv_data' || value.sivData) {
                        filteredData[key] = value;
                    }
                });
                this.countryData = filteredData;
                
                // Save the filtered data back
                localStorage.setItem('adminCountryData', JSON.stringify(filteredData));
                console.log('Filtered admin data - kept', Object.keys(filteredData).length, 'SIV-sourced countries');
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
        // Comprehensive location/city to country mapping - 500+ cities organized by regions
        const locationToCountry = {
            // ========== AFRICA ==========
            // North Africa
            'Algiers': 'Algeria',
            'Cairo': 'Egypt',
            'Alexandria': 'Egypt',
            'Giza': 'Egypt',
            'Tripoli': 'Libya',
            'Benghazi': 'Libya',
            'Casablanca': 'Morocco',
            'Rabat': 'Morocco',
            'Fez': 'Morocco',
            'Marrakech': 'Morocco',
            'Tangier': 'Morocco',
            'Khartoum': 'Sudan',
            'Port Sudan': 'Sudan',
            'Tunis': 'Tunisia',
            'Sfax': 'Tunisia',

            // West Africa
            'Luanda': 'Angola',
            'Porto-Novo': 'Benin',
            'Cotonou': 'Benin',
            'Ouagadougou': 'Burkina Faso',
            'Praia': 'Cape Verde',
            'Yaounde': 'Cameroon',
            'Douala': 'Cameroon',
            'Ndjamena': 'Chad',
            "N'Djamena": 'Chad',
            'Moroni': 'Comoros',
            'Brazzaville': 'Republic of Congo',
            'Kinshasa': 'Democratic Republic of Congo',
            'Lubumbashi': 'Democratic Republic of Congo',
            'Abidjan': 'Ivory Coast',
            'Yamoussoukro': 'Ivory Coast',
            'Djibouti': 'Djibouti',
            'Malabo': 'Equatorial Guinea',
            'Asmara': 'Eritrea',
            'Addis Ababa': 'Ethiopia',
            'Libreville': 'Gabon',
            'Banjul': 'Gambia',
            'Accra': 'Ghana',
            'Kumasi': 'Ghana',
            'Conakry': 'Guinea',
            'Bissau': 'Guinea-Bissau',
            'Monrovia': 'Liberia',
            'Bamako': 'Mali',
            'Nouakchott': 'Mauritania',
            'Port Louis': 'Mauritius',
            'Niamey': 'Niger',
            'Abuja': 'Nigeria',
            'Lagos': 'Nigeria',
            'Kano': 'Nigeria',
            'Ibadan': 'Nigeria',
            'Kaduna': 'Nigeria',
            'Port Harcourt': 'Nigeria',
            'Sao Tome': 'Sao Tome and Principe',
            'Dakar': 'Senegal',
            'Freetown': 'Sierra Leone',
            'Lome': 'Togo',

            // East Africa
            'Bujumbura': 'Burundi',
            'Asmara': 'Eritrea',
            'Addis Ababa': 'Ethiopia',
            'Nairobi': 'Kenya',
            'Mombasa': 'Kenya',
            'Maseru': 'Lesotho',
            'Antananarivo': 'Madagascar',
            'Lilongwe': 'Malawi',
            'Blantyre': 'Malawi',
            'Port Louis': 'Mauritius',
            'Maputo': 'Mozambique',
            'Windhoek': 'Namibia',
            'Kigali': 'Rwanda',
            'Victoria': 'Seychelles',
            'Mogadishu': 'Somalia',
            'Pretoria': 'South Africa',
            'Cape Town': 'South Africa',
            'Johannesburg': 'South Africa',
            'Durban': 'South Africa',
            'Juba': 'South Sudan',
            'Dar es Salaam': 'Tanzania',
            'Dodoma': 'Tanzania',
            'Kampala': 'Uganda',
            'Lusaka': 'Zambia',
            'Harare': 'Zimbabwe',
            'Bulawayo': 'Zimbabwe',

            // Southern Africa
            'Gaborone': 'Botswana',
            'Mbabane': 'Eswatini',

            // ========== ASIA ==========
            // Central Asia
            'Kabul': 'Afghanistan',
            'Kandahar': 'Afghanistan',
            'Herat': 'Afghanistan',
            'Mazar-i-Sharif': 'Afghanistan',
            'Baku': 'Azerbaijan',
            'Minsk': 'Belarus',
            'Thimphu': 'Bhutan',
            'Almaty': 'Kazakhstan',
            'Nur-Sultan': 'Kazakhstan',
            'Astana': 'Kazakhstan',
            'Shymkent': 'Kazakhstan',
            'Bishkek': 'Kyrgyzstan',
            'Ulaanbaatar': 'Mongolia',
            'Kathmandu': 'Nepal',
            'Islamabad': 'Pakistan',
            'Karachi': 'Pakistan',
            'Lahore': 'Pakistan',
            'Rawalpindi': 'Pakistan',
            'Faisalabad': 'Pakistan',
            'Multan': 'Pakistan',
            'Peshawar': 'Pakistan',
            'Quetta': 'Pakistan',
            'Hyderabad': 'Pakistan',
            'Dushanbe': 'Tajikistan',
            'Ashgabat': 'Turkmenistan',
            'Tashkent': 'Uzbekistan',
            'Samarkand': 'Uzbekistan',

            // East Asia
            'Beijing': 'China',
            'Shanghai': 'China',
            'Guangzhou': 'China',
            'Shenzhen': 'China',
            'Tianjin': 'China',
            'Wuhan': 'China',
            'Dongguan': 'China',
            'Chengdu': 'China',
            'Nanjing': 'China',
            'Shenyang': 'China',
            'Hangzhou': 'China',
            'Xian': 'China',
            'Harbin': 'China',
            'Suzhou': 'China',
            'Qingdao': 'China',
            'Dalian': 'China',
            'Zhengzhou': 'China',
            'Jinan': 'China',
            'Kunming': 'China',
            'Changchun': 'China',
            'Hong Kong': 'Hong Kong',
            'Tokyo': 'Japan',
            'Yokohama': 'Japan',
            'Osaka': 'Japan',
            'Nagoya': 'Japan',
            'Sapporo': 'Japan',
            'Fukuoka': 'Japan',
            'Kobe': 'Japan',
            'Kyoto': 'Japan',
            'Kawasaki': 'Japan',
            'Saitama': 'Japan',
            'Hiroshima': 'Japan',
            'Sendai': 'Japan',
            'Naha': 'Japan',
            'Pyongyang': 'North Korea',
            'Seoul': 'South Korea',
            'Busan': 'South Korea',
            'Incheon': 'South Korea',
            'Daegu': 'South Korea',
            'Daejeon': 'South Korea',
            'Gwangju': 'South Korea',
            'Taipei': 'Taiwan',
            'Kaohsiung': 'Taiwan',
            'Taichung': 'Taiwan',
            'Tainan': 'Taiwan',

            // South Asia
            'Dhaka': 'Bangladesh',
            'Chittagong': 'Bangladesh',
            'Khulna': 'Bangladesh',
            'New Delhi': 'India',
            'Delhi': 'India',
            'Mumbai': 'India',
            'Kolkata': 'India',
            'Chennai': 'India',
            'Bangalore': 'India',
            'Hyderabad': 'India',
            'Ahmedabad': 'India',
            'Pune': 'India',
            'Surat': 'India',
            'Jaipur': 'India',
            'Lucknow': 'India',
            'Kanpur': 'India',
            'Nagpur': 'India',
            'Indore': 'India',
            'Bhopal': 'India',
            'Visakhapatnam': 'India',
            'Patna': 'India',
            'Vadodara': 'India',
            'Ludhiana': 'India',
            'Agra': 'India',
            'Nashik': 'India',
            'Faridabad': 'India',
            'Meerut': 'India',
            'Rajkot': 'India',
            'Kalyan-Dombivali': 'India',
            'Vasai-Virar': 'India',
            'Varanasi': 'India',
            'Srinagar': 'India',
            'Aurangabad': 'India',
            'Dhanbad': 'India',
            'Amritsar': 'India',
            'Navi Mumbai': 'India',
            'Allahabad': 'India',
            'Ranchi': 'India',
            'Howrah': 'India',
            'Coimbatore': 'India',
            'Jabalpur': 'India',
            'Gwalior': 'India',
            'Vijayawada': 'India',
            'Jodhpur': 'India',
            'Madurai': 'India',
            'Raipur': 'India',
            'Kota': 'India',
            'Guwahati': 'India',
            'Chandigarh': 'India',
            'Solapur': 'India',
            'Hubli-Dharwad': 'India',
            'Tiruchirappalli': 'India',
            'Bareilly': 'India',
            'Mysore': 'India',
            'Tiruppur': 'India',
            'Gurgaon': 'India',
            'Aligarh': 'India',
            'Jalandhar': 'India',
            'Bhubaneswar': 'India',
            'Salem': 'India',
            'Mira-Bhayandar': 'India',
            'Warangal': 'India',
            'Thiruvananthapuram': 'India',
            'Guntur': 'India',
            'Bhiwandi': 'India',
            'Saharanpur': 'India',
            'Gorakhpur': 'India',
            'Bikaner': 'India',
            'Amravati': 'India',
            'Noida': 'India',
            'Jamshedpur': 'India',
            'Bhilai': 'India',
            'Cuttack': 'India',
            'Firozabad': 'India',
            'Kochi': 'India',
            'Nellore': 'India',
            'Bhavnagar': 'India',
            'Dehradun': 'India',
            'Durgapur': 'India',
            'Asansol': 'India',
            'Rourkela': 'India',
            'Nanded': 'India',
            'Kolhapur': 'India',
            'Ajmer': 'India',
            'Akola': 'India',
            'Gulbarga': 'India',
            'Jamnagar': 'India',
            'Ujjain': 'India',
            'Loni': 'India',
            'Siliguri': 'India',
            'Jhansi': 'India',
            'Ulhasnagar': 'India',
            'Jammu': 'India',
            'Sangli-Miraj & Kupwad': 'India',
            'Mangalore': 'India',
            'Erode': 'India',
            'Belgaum': 'India',
            'Ambattur': 'India',
            'Tirunelveli': 'India',
            'Malegaon': 'India',
            'Gaya': 'India',
            'Jalgaon': 'India',
            'Udaipur': 'India',
            'Maheshtala': 'India',
            'Colombo': 'Sri Lanka',
            'Kandy': 'Sri Lanka',

            // Southeast Asia
            'Bandar Seri Begawan': 'Brunei',
            'Phnom Penh': 'Cambodia',
            'Siem Reap': 'Cambodia',
            'Jakarta': 'Indonesia',
            'Surabaya': 'Indonesia',
            'Medan': 'Indonesia',
            'Bandung': 'Indonesia',
            'Bekasi': 'Indonesia',
            'Tangerang': 'Indonesia',
            'Depok': 'Indonesia',
            'Semarang': 'Indonesia',
            'Palembang': 'Indonesia',
            'Makassar': 'Indonesia',
            'South Tangerang': 'Indonesia',
            'Batam': 'Indonesia',
            'Bogor': 'Indonesia',
            'Pekanbaru': 'Indonesia',
            'Bandar Lampung': 'Indonesia',
            'Padang': 'Indonesia',
            'Malang': 'Indonesia',
            'Vientiane': 'Laos',
            'Kuala Lumpur': 'Malaysia',
            'George Town': 'Malaysia',
            'Ipoh': 'Malaysia',
            'Shah Alam': 'Malaysia',
            'Petaling Jaya': 'Malaysia',
            'Klang': 'Malaysia',
            'Johor Bahru': 'Malaysia',
            'Subang Jaya': 'Malaysia',
            'Seremban': 'Malaysia',
            'Kuching': 'Malaysia',
            'Kota Kinabalu': 'Malaysia',
            'Sandakan': 'Malaysia',
            'Tawau': 'Malaysia',
            'Nay Pyi Taw': 'Myanmar',
            'Yangon': 'Myanmar',
            'Mandalay': 'Myanmar',
            'Manila': 'Philippines',
            'Quezon City': 'Philippines',
            'Davao City': 'Philippines',
            'Caloocan': 'Philippines',
            'Cebu City': 'Philippines',
            'Zamboanga City': 'Philippines',
            'Antipolo': 'Philippines',
            'Taguig': 'Philippines',
            'Cagayan de Oro': 'Philippines',
            'Paranaque': 'Philippines',
            'Dasmarinas': 'Philippines',
            'Pasig': 'Philippines',
            'Valenzuela': 'Philippines',
            'Bacoor': 'Philippines',
            'General Santos': 'Philippines',
            'Las Pinas': 'Philippines',
            'Makati': 'Philippines',
            'Bacolod': 'Philippines',
            'Muntinlupa': 'Philippines',
            'San Jose del Monte': 'Philippines',
            'Iloilo City': 'Philippines',
            'Marikina': 'Philippines',
            'Pasay': 'Philippines',
            'Calamba': 'Philippines',
            'Mandaluyong': 'Philippines',
            'Singapore': 'Singapore',
            'Bangkok': 'Thailand',
            'Nonthaburi': 'Thailand',
            'Nakhon Ratchasima': 'Thailand',
            'Chiang Mai': 'Thailand',
            'Hat Yai': 'Thailand',
            'Udon Thani': 'Thailand',
            'Pak Kret': 'Thailand',
            'Khon Kaen': 'Thailand',
            'Nakhon Si Thammarat': 'Thailand',
            'Chon Buri': 'Thailand',
            'Rayong': 'Thailand',
            'Nakhon Pathom': 'Thailand',
            'Ubon Ratchathani': 'Thailand',
            'Surat Thani': 'Thailand',
            'Nakhon Sawan': 'Thailand',
            'Phuket': 'Thailand',
            'Hanoi': 'Vietnam',
            'Ho Chi Minh City': 'Vietnam',
            'Haiphong': 'Vietnam',
            'Can Tho': 'Vietnam',
            'Da Nang': 'Vietnam',
            'Bien Hoa': 'Vietnam',
            'Hue': 'Vietnam',
            'Nha Trang': 'Vietnam',
            'Buon Ma Thuot': 'Vietnam',
            'Phan Thiet': 'Vietnam',
            'Thai Nguyen': 'Vietnam',
            'Thai Binh': 'Vietnam',
            'Long Xuyen': 'Vietnam',
            'Nam Dinh': 'Vietnam',
            'Qui Nhon': 'Vietnam',
            'Vung Tau': 'Vietnam',
            'Vinh': 'Vietnam',
            'My Tho': 'Vietnam',
            'Rach Gia': 'Vietnam',
            'Cam Pha': 'Vietnam',

            // Western Asia/Middle East
            'Yerevan': 'Armenia',
            'Manama': 'Bahrain',
            'Nicosia': 'Cyprus',
            'Limassol': 'Cyprus',
            'Larnaca': 'Cyprus',
            'Tbilisi': 'Georgia',
            'Batumi': 'Georgia',
            'Tehran': 'Iran',
            'Mashhad': 'Iran',
            'Isfahan': 'Iran',
            'Karaj': 'Iran',
            'Shiraz': 'Iran',
            'Tabriz': 'Iran',
            'Ahvaz': 'Iran',
            'Qom': 'Iran',
            'Kermanshah': 'Iran',
            'Urmia': 'Iran',
            'Rasht': 'Iran',
            'Zahedan': 'Iran',
            'Hamadan': 'Iran',
            'Kerman': 'Iran',
            'Yazd': 'Iran',
            'Ardabil': 'Iran',
            'Bandar Abbas': 'Iran',
            'Arak': 'Iran',
            'Esfahak': 'Iran',
            'Baghdad': 'Iraq',
            'Basra': 'Iraq',
            'Mosul': 'Iraq',
            'Erbil': 'Iraq',
            'Sulaymaniyah': 'Iraq',
            'Najaf': 'Iraq',
            'Karbala': 'Iraq',
            'Nasiriyah': 'Iraq',
            'Amarah': 'Iraq',
            'Duhok': 'Iraq',
            'Jerusalem': 'Israel',
            'Tel Aviv': 'Israel',
            'Haifa': 'Israel',
            'Rishon LeZion': 'Israel',
            'Petah Tikva': 'Israel',
            'Ashdod': 'Israel',
            'Netanya': 'Israel',
            'Beer Sheva': 'Israel',
            'Bnei Brak': 'Israel',
            'Holon': 'Israel',
            'Ramat Gan': 'Israel',
            'Ashkelon': 'Israel',
            'Rehovot': 'Israel',
            'Bat Yam': 'Israel',
            'Bet Shemesh': 'Israel',
            'Kfar Saba': 'Israel',
            'Herzliya': 'Israel',
            'Hadera': 'Israel',
            'Modiin-Maccabim-Reut': 'Israel',
            'Nazareth': 'Israel',
            'Raanana': 'Israel',
            'Amman': 'Jordan',
            'Zarqa': 'Jordan',
            'Irbid': 'Jordan',
            'Russeifa': 'Jordan',
            'Al Quwaysimah': 'Jordan',
            'Kuwait City': 'Kuwait',
            'Hawalli': 'Kuwait',
            'Al Farwaniyah': 'Kuwait',
            'Beirut': 'Lebanon',
            'Tripoli': 'Lebanon',
            'Sidon': 'Lebanon',
            'Tyre': 'Lebanon',
            'Nabatieh': 'Lebanon',
            'Jounieh': 'Lebanon',
            'Zahle': 'Lebanon',
            'Baalbek': 'Lebanon',
            'Muscat': 'Oman',
            'Salalah': 'Oman',
            'Seeb': 'Oman',
            'Sohar': 'Oman',
            'Sur': 'Oman',
            'Ibri': 'Oman',
            'Saham': 'Oman',
            'Barka': 'Oman',
            'Rustaq': 'Oman',
            'Buraidah': 'Oman',
            'Doha': 'Qatar',
            'Al Rayyan': 'Qatar',
            'Umm Salal': 'Qatar',
            'Al Wakrah': 'Qatar',
            'Al Khor': 'Qatar',
            'Al-Shahaniya': 'Qatar',
            'Mesaieed': 'Qatar',
            'Dukhan': 'Qatar',
            'Riyadh': 'Saudi Arabia',
            'Jeddah': 'Saudi Arabia',
            'Mecca': 'Saudi Arabia',
            'Medina': 'Saudi Arabia',
            'Dammam': 'Saudi Arabia',
            'Khobar': 'Saudi Arabia',
            'Tabuk': 'Saudi Arabia',
            'Buraidah': 'Saudi Arabia',
            'Khamis Mushait': 'Saudi Arabia',
            'Hail': 'Saudi Arabia',
            'Al Mubarraz': 'Saudi Arabia',
            'Al-Ahsa': 'Saudi Arabia',
            'Hafar Al-Batin': 'Saudi Arabia',
            'Jubail': 'Saudi Arabia',
            'Dhahran': 'Saudi Arabia',
            'Jazan': 'Saudi Arabia',
            'Yanbu': 'Saudi Arabia',
            'Al Kharj': 'Saudi Arabia',
            'Abha': 'Saudi Arabia',
            'Damascus': 'Syria',
            'Aleppo': 'Syria',
            'Homs': 'Syria',
            'Latakia': 'Syria',
            'Hama': 'Syria',
            'Ar-Raqqah': 'Syria',
            'Deir ez-Zor': 'Syria',
            'Hasakah': 'Syria',
            'Qamishli': 'Syria',
            'Daraa': 'Syria',
            'Douma': 'Syria',
            'As-Suwayda': 'Syria',
            'Ankara': 'Turkey',
            'Istanbul': 'Turkey',
            'Izmir': 'Turkey',
            'Bursa': 'Turkey',
            'Adana': 'Turkey',
            'Gaziantep': 'Turkey',
            'Konya': 'Turkey',
            'Antalya': 'Turkey',
            'Kayseri': 'Turkey',
            'Mersin': 'Turkey',
            'Eskisehir': 'Turkey',
            'Diyarbakir': 'Turkey',
            'Samsun': 'Turkey',
            'Denizli': 'Turkey',
            'Adapazari': 'Turkey',
            'Malatya': 'Turkey',
            'Kahramanmaras': 'Turkey',
            'Erzurum': 'Turkey',
            'Van': 'Turkey',
            'Batman': 'Turkey',
            'Elazığ': 'Turkey',
            'Iğdır': 'Turkey',
            'Tarsus': 'Turkey',
            'Manisa': 'Turkey',
            'Sivas': 'Turkey',
            'Çorum': 'Turkey',
            'Balıkesir': 'Turkey',
            'Kırıkkale': 'Turkey',
            'Düzce': 'Turkey',
            'Osmaniye': 'Turkey',
            'Afyonkarahisar': 'Turkey',
            'Kütahya': 'Turkey',
            'Tekirdağ': 'Turkey',
            'Giresun': 'Turkey',
            'İnegöl': 'Turkey',
            'Ordu': 'Turkey',
            'Bandırma': 'Turkey',
            'Kızıltepe': 'Turkey',
            'Nazilli': 'Turkey',
            'Keşan': 'Turkey',
            'Ödemiş': 'Turkey',
            'Didim': 'Turkey',
            'Atakum': 'Turkey',
            'Halkalı': 'Turkey',
            'Şanlıurfa': 'Turkey',
            'Trabzon': 'Turkey',
            'Abu Dhabi': 'United Arab Emirates',
            'Dubai': 'United Arab Emirates',
            'Sharjah': 'United Arab Emirates',
            'Al Ain': 'United Arab Emirates',
            'Ajman': 'United Arab Emirates',
            'Ras Al Khaimah': 'United Arab Emirates',
            'Fujairah': 'United Arab Emirates',
            'Umm Al Quwain': 'United Arab Emirates',
            'Sanaa': 'Yemen',
            'Aden': 'Yemen',
            'Taiz': 'Yemen',
            'Al Hudaydah': 'Yemen',
            'Ibb': 'Yemen',
            'Dhamar': 'Yemen',
            'Al Mukalla': 'Yemen',
            'Hajjah': 'Yemen',

            // ========== EUROPE ==========
            // Western Europe
            'Vienna': 'Austria',
            'Graz': 'Austria',
            'Linz': 'Austria',
            'Salzburg': 'Austria',
            'Innsbruck': 'Austria',
            'Brussels': 'Belgium',
            'Antwerp': 'Belgium',
            'Ghent': 'Belgium',
            'Charleroi': 'Belgium',
            'Liège': 'Belgium',
            'Bruges': 'Belgium',
            'Namur': 'Belgium',
            'Leuven': 'Belgium',
            'Copenhagen': 'Denmark',
            'Aarhus': 'Denmark',
            'Odense': 'Denmark',
            'Aalborg': 'Denmark',
            'Esbjerg': 'Denmark',
            'Randers': 'Denmark',
            'Kolding': 'Denmark',
            'Horsens': 'Denmark',
            'Vejle': 'Denmark',
            'Roskilde': 'Denmark',
            'Helsinki': 'Finland',
            'Espoo': 'Finland',
            'Tampere': 'Finland',
            'Vantaa': 'Finland',
            'Oulu': 'Finland',
            'Turku': 'Finland',
            'Jyväskylä': 'Finland',
            'Lahti': 'Finland',
            'Kuopio': 'Finland',
            'Pori': 'Finland',
            'Paris': 'France',
            'Marseille': 'France',
            'Lyon': 'France',
            'Toulouse': 'France',
            'Nice': 'France',
            'Nantes': 'France',
            'Montpellier': 'France',
            'Strasbourg': 'France',
            'Bordeaux': 'France',
            'Lille': 'France',
            'Rennes': 'France',
            'Reims': 'France',
            'Le Havre': 'France',
            'Saint-Étienne': 'France',
            'Toulon': 'France',
            'Angers': 'France',
            'Grenoble': 'France',
            'Dijon': 'France',
            'Nîmes': 'France',
            'Aix-en-Provence': 'France',
            'Berlin': 'Germany',
            'Hamburg': 'Germany',
            'Munich': 'Germany',
            'Cologne': 'Germany',
            'Frankfurt': 'Germany',
            'Stuttgart': 'Germany',
            'Düsseldorf': 'Germany',
            'Leipzig': 'Germany',
            'Dortmund': 'Germany',
            'Essen': 'Germany',
            'Bremen': 'Germany',
            'Dresden': 'Germany',
            'Hanover': 'Germany',
            'Nuremberg': 'Germany',
            'Duisburg': 'Germany',
            'Bochum': 'Germany',
            'Wuppertal': 'Germany',
            'Bielefeld': 'Germany',
            'Bonn': 'Germany',
            'Münster': 'Germany',
            'Reykjavik': 'Iceland',
            'Akureyri': 'Iceland',
            'Reykjanesbær': 'Iceland',
            'Akranes': 'Iceland',
            'Dublin': 'Ireland',
            'Cork': 'Ireland',
            'Limerick': 'Ireland',
            'Galway': 'Ireland',
            'Waterford': 'Ireland',
            'Drogheda': 'Ireland',
            'Dundalk': 'Ireland',
            'Luxembourg': 'Luxembourg',
            'Esch-sur-Alzette': 'Luxembourg',
            'Differdange': 'Luxembourg',
            'Amsterdam': 'Netherlands',
            'Rotterdam': 'Netherlands',
            'The Hague': 'Netherlands',
            'Utrecht': 'Netherlands',
            'Eindhoven': 'Netherlands',
            'Tilburg': 'Netherlands',
            'Groningen': 'Netherlands',
            'Almere': 'Netherlands',
            'Breda': 'Netherlands',
            'Nijmegen': 'Netherlands',
            'Oslo': 'Norway',
            'Bergen': 'Norway',
            'Stavanger': 'Norway',
            'Trondheim': 'Norway',
            'Drammen': 'Norway',
            'Fredrikstad': 'Norway',
            'Kristiansand': 'Norway',
            'Sandnes': 'Norway',
            'Tromsø': 'Norway',
            'Sarpsborg': 'Norway',
            'Lisbon': 'Portugal',
            'Porto': 'Portugal',
            'Vila Nova de Gaia': 'Portugal',
            'Amadora': 'Portugal',
            'Braga': 'Portugal',
            'Funchal': 'Portugal',
            'Coimbra': 'Portugal',
            'Setúbal': 'Portugal',
            'Almada': 'Portugal',
            'Agualva-Cacém': 'Portugal',
            'Madrid': 'Spain',
            'Barcelona': 'Spain',
            'Valencia': 'Spain',
            'Seville': 'Spain',
            'Zaragoza': 'Spain',
            'Málaga': 'Spain',
            'Murcia': 'Spain',
            'Palma': 'Spain',
            'Las Palmas': 'Spain',
            'Bilbao': 'Spain',
            'Alicante': 'Spain',
            'Córdoba': 'Spain',
            'Valladolid': 'Spain',
            'Vigo': 'Spain',
            'Gijón': 'Spain',
            'Stockholm': 'Sweden',
            'Gothenburg': 'Sweden',
            'Malmö': 'Sweden',
            'Uppsala': 'Sweden',
            'Västerås': 'Sweden',
            'Örebro': 'Sweden',
            'Linköping': 'Sweden',
            'Helsingborg': 'Sweden',
            'Jönköping': 'Sweden',
            'Norrköping': 'Sweden',
            'Bern': 'Switzerland',
            'Zurich': 'Switzerland',
            'Geneva': 'Switzerland',
            'Basel': 'Switzerland',
            'Lausanne': 'Switzerland',
            'Winterthur': 'Switzerland',
            'Lucerne': 'Switzerland',
            'St. Gallen': 'Switzerland',
            'Lugano': 'Switzerland',
            'Biel': 'Switzerland',
            'London': 'United Kingdom',
            'Birmingham': 'United Kingdom',
            'Leeds': 'United Kingdom',
            'Glasgow': 'United Kingdom',
            'Sheffield': 'United Kingdom',
            'Bradford': 'United Kingdom',
            'Liverpool': 'United Kingdom',
            'Edinburgh': 'United Kingdom',
            'Manchester': 'United Kingdom',
            'Bristol': 'United Kingdom',
            'Wakefield': 'United Kingdom',
            'Cardiff': 'United Kingdom',
            'Coventry': 'United Kingdom',
            'Nottingham': 'United Kingdom',
            'Leicester': 'United Kingdom',
            'Sunderland': 'United Kingdom',
            'Belfast': 'United Kingdom',
            'Newcastle': 'United Kingdom',
            'Brighton': 'United Kingdom',
            'Hull': 'United Kingdom',
            'Plymouth': 'United Kingdom',
            'Stoke': 'United Kingdom',
            'Wolverhampton': 'United Kingdom',
            'Derby': 'United Kingdom',
            'Swansea': 'United Kingdom',
            'Southampton': 'United Kingdom',
            'Salford': 'United Kingdom',
            'Aberdeen': 'United Kingdom',
            'Westminster': 'United Kingdom',
            'Portsmouth': 'United Kingdom',
            'York': 'United Kingdom',
            'Peterborough': 'United Kingdom',
            'Dundee': 'United Kingdom',
            'Lancaster': 'United Kingdom',
            'Oxford': 'United Kingdom',
            'Newport': 'United Kingdom',
            'Preston': 'United Kingdom',
            'St Albans': 'United Kingdom',
            'Norwich': 'United Kingdom',
            'Chester': 'United Kingdom',
            'Cambridge': 'United Kingdom',
            'Salisbury': 'United Kingdom',
            'Exeter': 'United Kingdom',
            'Gloucester': 'United Kingdom',
            'Lisburn': 'United Kingdom',
            'Chichester': 'United Kingdom',
            'Winchester': 'United Kingdom',
            'Londonderry': 'United Kingdom',
            'Carlisle': 'United Kingdom',
            'Worcester': 'United Kingdom',
            'Bath': 'United Kingdom',
            'Durham': 'United Kingdom',
            'Lincoln': 'United Kingdom',
            'Hereford': 'United Kingdom',
            'Armagh': 'United Kingdom',
            'Inverness': 'United Kingdom',
            'Stirling': 'United Kingdom',
            'Canterbury': 'United Kingdom',
            'Lichfield': 'United Kingdom',
            'Newry': 'United Kingdom',
            'Ripon': 'United Kingdom',
            'Bangor': 'United Kingdom',
            'Truro': 'United Kingdom',
            'Ely': 'United Kingdom',
            'Wells': 'United Kingdom',
            'St Asaph': 'United Kingdom',
            'St Davids': 'United Kingdom',

            // Central Europe
            'Prague': 'Czech Republic',
            'Brno': 'Czech Republic',
            'Ostrava': 'Czech Republic',
            'Plzen': 'Czech Republic',
            'Liberec': 'Czech Republic',
            'Olomouc': 'Czech Republic',
            'Usti nad Labem': 'Czech Republic',
            'Hradec Kralove': 'Czech Republic',
            'Ceske Budejovice': 'Czech Republic',
            'Pardubice': 'Czech Republic',
            'Budapest': 'Hungary',
            'Debrecen': 'Hungary',
            'Szeged': 'Hungary',
            'Miskolc': 'Hungary',
            'Pecs': 'Hungary',
            'Gyor': 'Hungary',
            'Nyiregyhaza': 'Hungary',
            'Kecskemet': 'Hungary',
            'Szekesfehervar': 'Hungary',
            'Szombathely': 'Hungary',
            'Warsaw': 'Poland',
            'Krakow': 'Poland',
            'Lodz': 'Poland',
            'Wroclaw': 'Poland',
            'Poznan': 'Poland',
            'Gdansk': 'Poland',
            'Szczecin': 'Poland',
            'Bydgoszcz': 'Poland',
            'Lublin': 'Poland',
            'Katowice': 'Poland',
            'Bialystok': 'Poland',
            'Gdynia': 'Poland',
            'Czestochowa': 'Poland',
            'Radom': 'Poland',
            'Sosnowiec': 'Poland',
            'Torun': 'Poland',
            'Kielce': 'Poland',
            'Gliwice': 'Poland',
            'Zabrze': 'Poland',
            'Bytom': 'Poland',
            'Bratislava': 'Slovakia',
            'Kosice': 'Slovakia',
            'Presov': 'Slovakia',
            'Zilina': 'Slovakia',
            'Banska Bystrica': 'Slovakia',
            'Nitra': 'Slovakia',
            'Trnava': 'Slovakia',
            'Martin': 'Slovakia',
            'Trencin': 'Slovakia',
            'Poprad': 'Slovakia',
            'Ljubljana': 'Slovenia',
            'Maribor': 'Slovenia',
            'Celje': 'Slovenia',
            'Kranj': 'Slovenia',
            'Velenje': 'Slovenia',
            'Koper': 'Slovenia',
            'Novo Mesto': 'Slovenia',
            'Ptuj': 'Slovenia',
            'Trbovlje': 'Slovenia',
            'Kamnik': 'Slovenia',

            // Eastern Europe
            'Minsk': 'Belarus',
            'Gomel': 'Belarus',
            'Mogilev': 'Belarus',
            'Vitebsk': 'Belarus',
            'Grodno': 'Belarus',
            'Brest': 'Belarus',
            'Babruysk': 'Belarus',
            'Baranovichi': 'Belarus',
            'Borisov': 'Belarus',
            'Pinsk': 'Belarus',
            'Chisinau': 'Moldova',
            'Tiraspol': 'Moldova',
            'Balti': 'Moldova',
            'Bender': 'Moldova',
            'Rybnitsa': 'Moldova',
            'Cahul': 'Moldova',
            'Ungheni': 'Moldova',
            'Soroca': 'Moldova',
            'Orhei': 'Moldova',
            'Dubasari': 'Moldova',
            'Tallinn': 'Estonia',
            'Tartu': 'Estonia',
            'Riga': 'Latvia',
            'Daugavpils': 'Latvia',
            'Vilnius': 'Lithuania',
            'Kaunas': 'Lithuania',
            'Moscow': 'Russia',
            'Saint Petersburg': 'Russia',
            'Novosibirsk': 'Russia',
            'Yekaterinburg': 'Russia',
            'Nizhniy Novgorod': 'Russia',
            'Kazan': 'Russia',
            'Chelyabinsk': 'Russia',
            'Omsk': 'Russia',
            'Samara': 'Russia',
            'Rostov-on-Don': 'Russia',
            'Ufa': 'Russia',
            'Krasnoyarsk': 'Russia',
            'Voronezh': 'Russia',
            'Perm': 'Russia',
            'Volgograd': 'Russia',
            'Krasnodar': 'Russia',
            'Saratov': 'Russia',
            'Tyumen': 'Russia',
            'Tolyatti': 'Russia',
            'Izhevsk': 'Russia',
            'Barnaul': 'Russia',
            'Ulyanovsk': 'Russia',
            'Irkutsk': 'Russia',
            'Vladivostok': 'Russia',
            'Yaroslavl': 'Russia',
            'Habarovsk': 'Russia',
            'Makhachkala': 'Russia',
            'Tomsk': 'Russia',
            'Orenburg': 'Russia',
            'Novokuznetsk': 'Russia',
            'Kemerovo': 'Russia',
            'Ryazan': 'Russia',
            'Naberezhnye Chelny': 'Russia',
            'Astrakhan': 'Russia',
            'Penza': 'Russia',
            'Lipetsk': 'Russia',
            'Tula': 'Russia',
            'Kirov': 'Russia',
            'Cheboksary': 'Russia',
            'Kaliningrad': 'Russia',
            'Bryansk': 'Russia',
            'Kursk': 'Russia',
            'Ivanovo': 'Russia',
            'Magnitogorsk': 'Russia',
            'Tver': 'Russia',
            'Stavropol': 'Russia',
            'Nizhny Tagil': 'Russia',
            'Belgorod': 'Russia',
            'Arkhangelsk': 'Russia',
            'Vladimir': 'Russia',
            'Sochi': 'Russia',
            'Kurgan': 'Russia',
            'Smolensk': 'Russia',
            'Kaluga': 'Russia',
            'Chita': 'Russia',
            'Oryol': 'Russia',
            'Kyiv': 'Ukraine',
            'Kharkiv': 'Ukraine',
            'Odesa': 'Ukraine',
            'Dnipro': 'Ukraine',
            'Donetsk': 'Ukraine',
            'Zaporizhzhia': 'Ukraine',
            'Lviv': 'Ukraine',
            'Kryvyi Rih': 'Ukraine',
            'Mykolaiv': 'Ukraine',
            'Mariupol': 'Ukraine',
            'Luhansk': 'Ukraine',
            'Vinnytsia': 'Ukraine',
            'Makiivka': 'Ukraine',
            'Simferopol': 'Ukraine',
            'Sevastopol': 'Ukraine',
            'Kherson': 'Ukraine',
            'Poltava': 'Ukraine',
            'Chernihiv': 'Ukraine',
            'Cherkasy': 'Ukraine',
            'Zhytomyr': 'Ukraine',
            'Sumy': 'Ukraine',
            'Horlivka': 'Ukraine',
            'Rivne': 'Ukraine',
            'Kropyvnytskyi': 'Ukraine',
            'Kamianske': 'Ukraine',
            'Ternopil': 'Ukraine',
            'Kremenchuk': 'Ukraine',
            'Ivano-Frankivsk': 'Ukraine',
            'Lutsk': 'Ukraine',
            'Bila Tserkva': 'Ukraine',
            'Kramatorsk': 'Ukraine',
            'Melitopol': 'Ukraine',
            'Kerch': 'Ukraine',
            'Uzhgorod': 'Ukraine',
            'Sloviansk': 'Ukraine',
            'Berdiansk': 'Ukraine',
            'Alchevsk': 'Ukraine',
            'Pavlohrad': 'Ukraine',
            'Severodonetsk': 'Ukraine',
            'Yevpatoria': 'Ukraine',
            'Lysychansk': 'Ukraine',
            'Kamianets-Podilskyi': 'Ukraine',
            'Brovary': 'Ukraine',
            'Drohobych': 'Ukraine',
            'Chornomorsk': 'Ukraine',
            'Yalta': 'Ukraine',
            'Mukachevo': 'Ukraine',

            // Southern Europe
            'Tirana': 'Albania',
            'Durres': 'Albania',
            'Vlore': 'Albania',
            'Elbasan': 'Albania',
            'Shkoder': 'Albania',
            'Fier': 'Albania',
            'Korce': 'Albania',
            'Berat': 'Albania',
            'Lushnje': 'Albania',
            'Kavaje': 'Albania',
            'Sarajevo': 'Bosnia and Herzegovina',
            'Banja Luka': 'Bosnia and Herzegovina',
            'Tuzla': 'Bosnia and Herzegovina',
            'Zenica': 'Bosnia and Herzegovina',
            'Mostar': 'Bosnia and Herzegovina',
            'Bijeljina': 'Bosnia and Herzegovina',
            'Brčko': 'Bosnia and Herzegovina',
            'Prijedor': 'Bosnia and Herzegovina',
            'Trebinje': 'Bosnia and Herzegovina',
            'Doboj': 'Bosnia and Herzegovina',
            'Sofia': 'Bulgaria',
            'Plovdiv': 'Bulgaria',
            'Varna': 'Bulgaria',
            'Burgas': 'Bulgaria',
            'Ruse': 'Bulgaria',
            'Stara Zagora': 'Bulgaria',
            'Pleven': 'Bulgaria',
            'Sliven': 'Bulgaria',
            'Dobrich': 'Bulgaria',
            'Shumen': 'Bulgaria',
            'Zagreb': 'Croatia',
            'Split': 'Croatia',
            'Rijeka': 'Croatia',
            'Osijek': 'Croatia',
            'Zadar': 'Croatia',
            'Pula': 'Croatia',
            'Slavonski Brod': 'Croatia',
            'Karlovac': 'Croatia',
            'Varaždin': 'Croatia',
            'Šibenik': 'Croatia',
            'Athens': 'Greece',
            'Thessaloniki': 'Greece',
            'Patras': 'Greece',
            'Piraeus': 'Greece',
            'Larissa': 'Greece',
            'Heraklion': 'Greece',
            'Peristeri': 'Greece',
            'Kallithea': 'Greece',
            'Acharnes': 'Greece',
            'Kalamaria': 'Greece',
            'Rome': 'Italy',
            'Milan': 'Italy',
            'Naples': 'Italy',
            'Turin': 'Italy',
            'Palermo': 'Italy',
            'Genoa': 'Italy',
            'Bologna': 'Italy',
            'Florence': 'Italy',
            'Bari': 'Italy',
            'Catania': 'Italy',
            'Venice': 'Italy',
            'Verona': 'Italy',
            'Messina': 'Italy',
            'Padua': 'Italy',
            'Trieste': 'Italy',
            'Taranto': 'Italy',
            'Brescia': 'Italy',
            'Prato': 'Italy',
            'Reggio Calabria': 'Italy',
            'Modena': 'Italy',
            'Pristina': 'Kosovo',
            'Prizren': 'Kosovo',
            'Ferizaj': 'Kosovo',
            'Peja': 'Kosovo',
            'Gjakova': 'Kosovo',
            'Gjilan': 'Kosovo',
            'Mitrovica': 'Kosovo',
            'Vushtrri': 'Kosovo',
            'Podujeva': 'Kosovo',
            'Suhareka': 'Kosovo',
            'Valletta': 'Malta',
            'Birkirkara': 'Malta',
            'Mosta': 'Malta',
            'Qormi': 'Malta',
            'Zabbar': 'Malta',
            'Sliema': 'Malta',
            'San Pawl il-Baħar': 'Malta',
            'Naxxar': 'Malta',
            'Paola': 'Malta',
            'Tarxien': 'Malta',
            'Podgorica': 'Montenegro',
            'Nikšić': 'Montenegro',
            'Pljevlja': 'Montenegro',
            'Bijelo Polje': 'Montenegro',
            'Cetinje': 'Montenegro',
            'Bar': 'Montenegro',
            'Herceg Novi': 'Montenegro',
            'Berane': 'Montenegro',
            'Ulcinj': 'Montenegro',
            'Budva': 'Montenegro',
            'Skopje': 'North Macedonia',
            'Bitola': 'North Macedonia',
            'Kumanovo': 'North Macedonia',
            'Prilep': 'North Macedonia',
            'Tetovo': 'North Macedonia',
            'Veles': 'North Macedonia',
            'Štip': 'North Macedonia',
            'Ohrid': 'North Macedonia',
            'Gostivar': 'North Macedonia',
            'Strumica': 'North Macedonia',
            'Bucharest': 'Romania',
            'Cluj-Napoca': 'Romania',
            'Timisoara': 'Romania',
            'Iasi': 'Romania',
            'Constanta': 'Romania',
            'Craiova': 'Romania',
            'Brasov': 'Romania',
            'Galati': 'Romania',
            'Ploiesti': 'Romania',
            'Oradea': 'Romania',
            'Braila': 'Romania',
            'Arad': 'Romania',
            'Pitesti': 'Romania',
            'Sibiu': 'Romania',
            'Bacau': 'Romania',
            'Targu Mures': 'Romania',
            'Baia Mare': 'Romania',
            'Buzau': 'Romania',
            'Satu Mare': 'Romania',
            'Botosani': 'Romania',
            'Belgrade': 'Serbia',
            'Novi Sad': 'Serbia',
            'Nis': 'Serbia',
            'Kragujevac': 'Serbia',
            'Subotica': 'Serbia',
            'Zrenjanin': 'Serbia',
            'Pancevo': 'Serbia',
            'Cacak': 'Serbia',
            'Novi Pazar': 'Serbia',
            'Leskovac': 'Serbia',

            // ========== NORTH AMERICA ==========
            // Canada
            'Toronto': 'Canada',
            'Montreal': 'Canada',
            'Vancouver': 'Canada',
            'Calgary': 'Canada',
            'Edmonton': 'Canada',
            'Ottawa': 'Canada',
            'Mississauga': 'Canada',
            'Winnipeg': 'Canada',
            'Quebec City': 'Canada',
            'Hamilton': 'Canada',
            'Brampton': 'Canada',
            'Surrey': 'Canada',
            'Laval': 'Canada',
            'Halifax': 'Canada',
            'London': 'Canada',
            'Markham': 'Canada',
            'Vaughan': 'Canada',
            'Gatineau': 'Canada',
            'Saskatoon': 'Canada',
            'Longueuil': 'Canada',
            'Burnaby': 'Canada',
            'Regina': 'Canada',
            'Richmond': 'Canada',
            'Richmond Hill': 'Canada',
            'Oakville': 'Canada',
            'Burlington': 'Canada',
            'Sherbrooke': 'Canada',
            'Oshawa': 'Canada',
            'Saguenay': 'Canada',
            'Lévis': 'Canada',
            'Barrie': 'Canada',
            'Abbotsford': 'Canada',
            'Coquitlam': 'Canada',
            'Trois-Rivières': 'Canada',
            'St. Catharines': 'Canada',
            'Guelph': 'Canada',
            'Cambridge': 'Canada',
            'Whitby': 'Canada',
            'Kelowna': 'Canada',
            'Kingston': 'Canada',
            'Ajax': 'Canada',
            'Langley': 'Canada',
            'Saanich': 'Canada',
            'Milton': 'Canada',
            'St. Johns': 'Canada',

            // Mexico
            'Mexico City': 'Mexico',
            'Ecatepec de Morelos': 'Mexico',
            'Guadalajara': 'Mexico',
            'Puebla': 'Mexico',
            'Juarez': 'Mexico',
            'Tijuana': 'Mexico',
            'Leon': 'Mexico',
            'Zapopan': 'Mexico',
            'Monterrey': 'Mexico',
            'Nezahualcoyotl': 'Mexico',
            'Chihuahua': 'Mexico',
            'Naucalpan de Juarez': 'Mexico',
            'Merida': 'Mexico',
            'Alvaro Obregon': 'Mexico',
            'San Luis Potosi': 'Mexico',
            'Tlalnepantla de Baz': 'Mexico',
            'Aguascalientes': 'Mexico',
            'Morelia': 'Mexico',
            'Saltillo': 'Mexico',
            'Jaral del Progreso': 'Mexico',
            'Hermosillo': 'Mexico',
            'Mexicali': 'Mexico',
            'Culiacan': 'Mexico',
            'Guadalupe': 'Mexico',
            'Acapulco': 'Mexico',
            'Tlaquepaque': 'Mexico',
            'Cancun': 'Mexico',
            'Queretaro': 'Mexico',
            'Chimalhuacan': 'Mexico',
            'Torreon': 'Mexico',
            'Morelos': 'Mexico',
            'Reynosa': 'Mexico',
            'Tlalpan': 'Mexico',
            'Toluca': 'Mexico',
            'Cuautitlan Izcalli': 'Mexico',
            'Matamoros': 'Mexico',
            'Veracruz': 'Mexico',
            'Xalapa': 'Mexico',
            'Irapuato': 'Mexico',
            'Ciudad Juarez': 'Mexico',
            'Nuevo Laredo': 'Mexico',
            'Nogales': 'Mexico',
            'Cuernavaca': 'Mexico',

            // United States - Major Cities
            'New York': 'United States',
            'Los Angeles': 'United States',
            'Chicago': 'United States',
            'Houston': 'United States',
            'Phoenix': 'United States',
            'Philadelphia': 'United States',
            'San Antonio': 'United States',
            'San Diego': 'United States',
            'Dallas': 'United States',
            'San Jose': 'United States',
            'Austin': 'United States',
            'Jacksonville': 'United States',
            'Fort Worth': 'United States',
            'Columbus': 'United States',
            'Charlotte': 'United States',
            'San Francisco': 'United States',
            'Indianapolis': 'United States',
            'Seattle': 'United States',
            'Denver': 'United States',
            'Washington': 'United States',
            'Boston': 'United States',
            'El Paso': 'United States',
            'Nashville': 'United States',
            'Detroit': 'United States',
            'Oklahoma City': 'United States',
            'Portland': 'United States',
            'Las Vegas': 'United States',
            'Memphis': 'United States',
            'Louisville': 'United States',
            'Baltimore': 'United States',
            'Milwaukee': 'United States',
            'Albuquerque': 'United States',
            'Tucson': 'United States',
            'Fresno': 'United States',
            'Mesa': 'United States',
            'Sacramento': 'United States',
            'Atlanta': 'United States',
            'Kansas City': 'United States',
            'Colorado Springs': 'United States',
            'Miami': 'United States',
            'Raleigh': 'United States',
            'Omaha': 'United States',
            'Long Beach': 'United States',
            'Virginia Beach': 'United States',
            'Oakland': 'United States',
            'Minneapolis': 'United States',
            'Tulsa': 'United States',
            'Tampa': 'United States',
            'Arlington': 'United States',
            'New Orleans': 'United States',

            // ========== CENTRAL AMERICA & CARIBBEAN ==========
            'Bridgetown': 'Barbados',
            'Belize City': 'Belize',
            'Belmopan': 'Belize',
            'San Jose': 'Costa Rica',
            'Cartago': 'Costa Rica',
            'Puntarenas': 'Costa Rica',
            'Alajuela': 'Costa Rica',
            'Havana': 'Cuba',
            'Santiago de Cuba': 'Cuba',
            'Camaguey': 'Cuba',
            'Holguin': 'Cuba',
            'Guantanamo': 'Cuba',
            'Santa Clara': 'Cuba',
            'Las Tunas': 'Cuba',
            'Bayamo': 'Cuba',
            'Cienfuegos': 'Cuba',
            'Pinar del Rio': 'Cuba',
            'Santo Domingo': 'Dominican Republic',
            'Santiago': 'Dominican Republic',
            'San Cristobal': 'Dominican Republic',
            'San Francisco de Macoris': 'Dominican Republic',
            'Puerto Plata': 'Dominican Republic',
            'San Pedro de Macoris': 'Dominican Republic',
            'La Romana': 'Dominican Republic',
            'San Salvador': 'El Salvador',
            'Soyapango': 'El Salvador',
            'Santa Ana': 'El Salvador',
            'San Miguel': 'El Salvador',
            'Mejicanos': 'El Salvador',
            'Guatemala City': 'Guatemala',
            'Villa Nueva': 'Guatemala',
            'Petapa': 'Guatemala',
            'San Juan Sacatepequez': 'Guatemala',
            'Quetzaltenango': 'Guatemala',
            'Villa Canales': 'Guatemala',
            'Escuintla': 'Guatemala',
            'Chinautla': 'Guatemala',
            'Chimaltenango': 'Guatemala',
            'Huehuetenango': 'Guatemala',
            'Port-au-Prince': 'Haiti',
            'Carrefour': 'Haiti',
            'Delmas': 'Haiti',
            'Cap-Haitien': 'Haiti',
            'Petionville': 'Haiti',
            'Gonaives': 'Haiti',
            'Les Cayes': 'Haiti',
            'Croix-des-Bouquets': 'Haiti',
            'Leogane': 'Haiti',
            'Fort-de-France': 'Haiti',
            'Tegucigalpa': 'Honduras',
            'San Pedro Sula': 'Honduras',
            'Choloma': 'Honduras',
            'La Ceiba': 'Honduras',
            'El Progreso': 'Honduras',
            'Choluteca': 'Honduras',
            'Comayagua': 'Honduras',
            'Puerto Cortes': 'Honduras',
            'La Lima': 'Honduras',
            'Danli': 'Honduras',
            'Kingston': 'Jamaica',
            'Spanish Town': 'Jamaica',
            'Portmore': 'Jamaica',
            'Montego Bay': 'Jamaica',
            'May Pen': 'Jamaica',
            'Mandeville': 'Jamaica',
            'Old Harbour': 'Jamaica',
            'Savanna-la-Mar': 'Jamaica',
            'Linstead': 'Jamaica',
            'Half Way Tree': 'Jamaica',
            'Managua': 'Nicaragua',
            'Leon': 'Nicaragua',
            'Masaya': 'Nicaragua',
            'Matagalpa': 'Nicaragua',
            'Chinandega': 'Nicaragua',
            'Granada': 'Nicaragua',
            'Jinotega': 'Nicaragua',
            'Esteli': 'Nicaragua',
            'Nueva Guinea': 'Nicaragua',
            'Tipitapa': 'Nicaragua',
            'Panama City': 'Panama',
            'San Miguelito': 'Panama',
            'Tocumen': 'Panama',
            'David': 'Panama',
            'Arraijan': 'Panama',
            'La Chorrera': 'Panama',
            'Pacora': 'Panama',
            'Colon': 'Panama',
            'Los Santos': 'Panama',
            'Boquete': 'Panama',
            'Port of Spain': 'Trinidad and Tobago',
            'Chaguanas': 'Trinidad and Tobago',
            'San Fernando': 'Trinidad and Tobago',
            'Port Fortin': 'Trinidad and Tobago',
            'Arima': 'Trinidad and Tobago',
            'Point Lisas': 'Trinidad and Tobago',
            'Scarborough': 'Trinidad and Tobago',
            'Tunapuna': 'Trinidad and Tobago',
            'Penal': 'Trinidad and Tobago',
            'Couva': 'Trinidad and Tobago',

            // Additional Caribbean
            'Nassau': 'Bahamas',
            'Freeport': 'Bahamas',
            'West End': 'Bahamas',
            'Cooper\'s Town': 'Bahamas',
            'Marsh Harbour': 'Bahamas',
            'Nicholls Town': 'Bahamas',
            'High Rock': 'Bahamas',

            // ========== SOUTH AMERICA ==========
            'Buenos Aires': 'Argentina',
            'Cordoba': 'Argentina',
            'Rosario': 'Argentina',
            'Mendoza': 'Argentina',
            'Tucuman': 'Argentina',
            'La Plata': 'Argentina',
            'Mar del Plata': 'Argentina',
            'Salta': 'Argentina',
            'Santa Fe': 'Argentina',
            'San Juan': 'Argentina',
            'Resistencia': 'Argentina',
            'Santiago del Estero': 'Argentina',
            'Corrientes': 'Argentina',
            'Posadas': 'Argentina',
            'Neuquen': 'Argentina',
            'La Paz': 'Bolivia',
            'Santa Cruz de la Sierra': 'Bolivia',
            'Cochabamba': 'Bolivia',
            'Sucre': 'Bolivia',
            'Oruro': 'Bolivia',
            'Tarija': 'Bolivia',
            'Potosi': 'Bolivia',
            'Trinidad': 'Bolivia',
            'Montero': 'Bolivia',
            'Riberalta': 'Bolivia',
            'Sao Paulo': 'Brazil',
            'Rio de Janeiro': 'Brazil',
            'Salvador': 'Brazil',
            'Brasilia': 'Brazil',
            'Fortaleza': 'Brazil',
            'Belo Horizonte': 'Brazil',
            'Manaus': 'Brazil',
            'Curitiba': 'Brazil',
            'Recife': 'Brazil',
            'Goiania': 'Brazil',
            'Belem': 'Brazil',
            'Porto Alegre': 'Brazil',
            'Guarulhos': 'Brazil',
            'Campinas': 'Brazil',
            'Sao Luis': 'Brazil',
            'Sao Goncalo': 'Brazil',
            'Maceio': 'Brazil',
            'Duque de Caxias': 'Brazil',
            'Natal': 'Brazil',
            'Teresina': 'Brazil',
            'Campo Grande': 'Brazil',
            'Nova Iguacu': 'Brazil',
            'Sao Bernardo do Campo': 'Brazil',
            'Joao Pessoa': 'Brazil',
            'Santo Andre': 'Brazil',
            'Osasco': 'Brazil',
            'Jaboatao dos Guararapes': 'Brazil',
            'Sao Jose dos Campos': 'Brazil',
            'Ribeirao Preto': 'Brazil',
            'Uberlandia': 'Brazil',
            'Sorocaba': 'Brazil',
            'Contagem': 'Brazil',
            'Aracaju': 'Brazil',
            'Feira de Santana': 'Brazil',
            'Cuiaba': 'Brazil',
            'Joinville': 'Brazil',
            'Aparecida de Goiania': 'Brazil',
            'Londrina': 'Brazil',
            'Juiz de Fora': 'Brazil',
            'Ananindeua': 'Brazil',
            'Porto Velho': 'Brazil',
            'Serra': 'Brazil',
            'Niteroi': 'Brazil',
            'Caxias do Sul': 'Brazil',
            'Campos dos Goytacazes': 'Brazil',
            'Macapa': 'Brazil',
            'Vila Velha': 'Brazil',
            'Sao Joao de Meriti': 'Brazil',
            'Florianopolis': 'Brazil',
            'Santos': 'Brazil',
            'Cariacica': 'Brazil',
            'Maua': 'Brazil',
            'Carapicuiba': 'Brazil',
            'Olinda': 'Brazil',
            'Campina Grande': 'Brazil',
            'Sao Jose do Rio Preto': 'Brazil',
            'Caxias': 'Brazil',
            'Mogi das Cruzes': 'Brazil',
            'Diadema': 'Brazil',
            'Betim': 'Brazil',
            'Jundiai': 'Brazil',
            'Piracicaba': 'Brazil',
            'Bauru': 'Brazil',
            'Montes Claros': 'Brazil',
            'Santiago': 'Chile',
            'Antofagasta': 'Chile',
            'Vina del Mar': 'Chile',
            'Valparaiso': 'Chile',
            'Talcahuano': 'Chile',
            'San Bernardo': 'Chile',
            'Temuco': 'Chile',
            'Iquique': 'Chile',
            'Concepcion': 'Chile',
            'Rancagua': 'Chile',
            'Talca': 'Chile',
            'Arica': 'Chile',
            'Chillan': 'Chile',
            'Calama': 'Chile',
            'La Serena': 'Chile',
            'Copiapo': 'Chile',
            'Osorno': 'Chile',
            'Quillota': 'Chile',
            'Valdivia': 'Chile',
            'Punta Arenas': 'Chile',
            'Bogota': 'Colombia',
            'Medellin': 'Colombia',
            'Cali': 'Colombia',
            'Barranquilla': 'Colombia',
            'Cartagena': 'Colombia',
            'Cucuta': 'Colombia',
            'Bucaramanga': 'Colombia',
            'Pereira': 'Colombia',
            'Santa Marta': 'Colombia',
            'Ibague': 'Colombia',
            'Soledad': 'Colombia',
            'Pasto': 'Colombia',
            'Manizales': 'Colombia',
            'Neiva': 'Colombia',
            'Palmira': 'Colombia',
            'Villavicencio': 'Colombia',
            'Armenia': 'Colombia',
            'Sincelejo': 'Colombia',
            'Valledupar': 'Colombia',
            'Monteria': 'Colombia',
            'Itagui': 'Colombia',
            'Popayan': 'Colombia',
            'Buenaventura': 'Colombia',
            'Floridablanca': 'Colombia',
            'Maicao': 'Colombia',
            'Cartago': 'Colombia',
            'Bello': 'Colombia',
            'Tuluá': 'Colombia',
            'Barrancas': 'Colombia',
            'Envigado': 'Colombia',
            'Quito': 'Ecuador',
            'Guayaquil': 'Ecuador',
            'Cuenca': 'Ecuador',
            'Santo Domingo': 'Ecuador',
            'Machala': 'Ecuador',
            'Manta': 'Ecuador',
            'Portoviejo': 'Ecuador',
            'Duran': 'Ecuador',
            'Ambato': 'Ecuador',
            'Riobamba': 'Ecuador',
            'Loja': 'Ecuador',
            'Esmeraldas': 'Ecuador',
            'Ibarra': 'Ecuador',
            'Milagro': 'Ecuador',
            'Quevedo': 'Ecuador',
            'Latacunga': 'Ecuador',
            'Sangolqui': 'Ecuador',
            'Tulcan': 'Ecuador',
            'Babahoyo': 'Ecuador',
            'El Alto': 'Ecuador',
            'Georgetown': 'Guyana',
            'Linden': 'Guyana',
            'New Amsterdam': 'Guyana',
            'Bartica': 'Guyana',
            'Skeldon': 'Guyana',
            'Rose Hall': 'Guyana',
            'Mabaruma': 'Guyana',
            'Parika': 'Guyana',
            'Anna Regina': 'Guyana',
            'Lethem': 'Guyana',
            'Paramaribo': 'Suriname',
            'Lelydorp': 'Suriname',
            'Brokopondo': 'Suriname',
            'Nieuw Nickerie': 'Suriname',
            'Moengo': 'Suriname',
            'Marienburg': 'Suriname',
            'Groningen': 'Suriname',
            'Albina': 'Suriname',
            'Wageningen': 'Suriname',
            'Totness': 'Suriname',
            'Lima': 'Peru',
            'Arequipa': 'Peru',
            'Callao': 'Peru',
            'Trujillo': 'Peru',
            'Chiclayo': 'Peru',
            'Huancayo': 'Peru',
            'Piura': 'Peru',
            'Iquitos': 'Peru',
            'Cusco': 'Peru',
            'Chimbote': 'Peru',
            'Huanuco': 'Peru',
            'Tacna': 'Peru',
            'Juliaca': 'Peru',
            'Ica': 'Peru',
            'Sullana': 'Peru',
            'Ayacucho': 'Peru',
            'Chincha Alta': 'Peru',
            'Huaraz': 'Peru',
            'Pucallpa': 'Peru',
            'Cajamarca': 'Peru',
            'Paita': 'Peru',
            'Puno': 'Peru',
            'Tumbes': 'Peru',
            'Talara': 'Peru',
            'Jaen': 'Peru',
            'Ilo': 'Peru',
            'Moquegua': 'Peru',
            'Abancay': 'Peru',
            'Cerro de Pasco': 'Peru',
            'Montevideo': 'Uruguay',
            'Salto': 'Uruguay',
            'Ciudad de la Costa': 'Uruguay',
            'Paysandu': 'Uruguay',
            'Las Piedras': 'Uruguay',
            'Rivera': 'Uruguay',
            'Maldonado': 'Uruguay',
            'Tacuarembo': 'Uruguay',
            'Melo': 'Uruguay',
            'Mercedes': 'Uruguay',
            'Artigas': 'Uruguay',
            'Minas': 'Uruguay',
            'San Jose de Mayo': 'Uruguay',
            'Durazno': 'Uruguay',
            'Florida': 'Uruguay',
            'Barros Blancos': 'Uruguay',
            'San Carlos': 'Uruguay',
            'Pando': 'Uruguay',
            'Fray Bentos': 'Uruguay',
            'Trinidad': 'Uruguay',
            'Caracas': 'Venezuela',
            'Maracaibo': 'Venezuela',
            'Maracay': 'Venezuela',
            'Valencia': 'Venezuela',
            'Barquisimeto': 'Venezuela',
            'Ciudad Guayana': 'Venezuela',
            'Barcelona': 'Venezuela',
            'Maturin': 'Venezuela',
            'Ciudad Bolivar': 'Venezuela',
            'Cumana': 'Venezuela',
            'Merida': 'Venezuela',
            'Cabimas': 'Venezuela',
            'Turmero': 'Venezuela',
            'Barinas': 'Venezuela',
            'Punto Fijo': 'Venezuela',
            'Los Teques': 'Venezuela',
            'Acarigua': 'Venezuela',
            'Carora': 'Venezuela',
            'Valera': 'Venezuela',
            'San Cristobal': 'Venezuela',
            'Guarenas': 'Venezuela',
            'Coro': 'Venezuela',
            'San Fernando de Apure': 'Venezuela',
            'Porlamar': 'Venezuela',
            'La Guaira': 'Venezuela',
            'Guanare': 'Venezuela',
            'Puerto la Cruz': 'Venezuela',
            'Villa de Cura': 'Venezuela',
            'Maracay': 'Venezuela',
            'Puerto Cabello': 'Venezuela',

            // ========== OCEANIA ==========
            // Australia
            'Sydney': 'Australia',
            'Melbourne': 'Australia',
            'Brisbane': 'Australia',
            'Perth': 'Australia',
            'Adelaide': 'Australia',
            'Gold Coast': 'Australia',
            'Newcastle': 'Australia',
            'Canberra': 'Australia',
            'Central Coast': 'Australia',
            'Wollongong': 'Australia',
            'Logan City': 'Australia',
            'Geelong': 'Australia',
            'Hobart': 'Australia',
            'Townsville': 'Australia',
            'Cairns': 'Australia',
            'Darwin': 'Australia',
            'Toowoomba': 'Australia',
            'Ballarat': 'Australia',
            'Bendigo': 'Australia',
            'Albury': 'Australia',
            'Launceston': 'Australia',
            'Mackay': 'Australia',
            'Rockhampton': 'Australia',
            'Bunbury': 'Australia',
            'Bundaberg': 'Australia',
            'Coffs Harbour': 'Australia',
            'Wagga Wagga': 'Australia',
            'Hervey Bay': 'Australia',
            'Mildura': 'Australia',
            'Shepparton': 'Australia',
            'Port Macquarie': 'Australia',
            'Orange': 'Australia',
            'Tamworth': 'Australia',
            'Sunbury': 'Australia',
            'Dubbo': 'Australia',
            'Nowra': 'Australia',
            'Warrnambool': 'Australia',
            'Kalgoorlie': 'Australia',
            'Geraldton': 'Australia',
            'Alice Springs': 'Australia',
            'Devonport': 'Australia',
            'Traralgon': 'Australia',
            'Mount Gambier': 'Australia',
            'Whyalla': 'Australia',
            'Murray Bridge': 'Australia',
            'Broken Hill': 'Australia',
            'Port Lincoln': 'Australia',
            'Port Pirie': 'Australia',
            'Port Augusta': 'Australia',

            // New Zealand
            'Auckland': 'New Zealand',
            'Wellington': 'New Zealand',
            'Christchurch': 'New Zealand',
            'Hamilton': 'New Zealand',
            'Tauranga': 'New Zealand',
            'Napier-Hastings': 'New Zealand',
            'Dunedin': 'New Zealand',
            'Palmerston North': 'New Zealand',
            'Nelson': 'New Zealand',
            'Rotorua': 'New Zealand',
            'New Plymouth': 'New Zealand',
            'Whangarei': 'New Zealand',
            'Invercargill': 'New Zealand',
            'Whanganui': 'New Zealand',
            'Gisborne': 'New Zealand',
            'Timaru': 'New Zealand',
            'Masterton': 'New Zealand',
            'Levin': 'New Zealand',
            'Taupo': 'New Zealand',
            'Oamaru': 'New Zealand',

            // Pacific Islands
            'Suva': 'Fiji',
            'Nadi': 'Fiji',
            'Lautoka': 'Fiji',
            'Nausori': 'Fiji',
            'Ba': 'Fiji',
            'Sigatoka': 'Fiji',
            'Tavua': 'Fiji',
            'Rakiraki': 'Fiji',
            'Nasinu': 'Fiji',
            'Labasa': 'Fiji',
            'Tarawa': 'Kiribati',
            'Betio': 'Kiribati',
            'Bikenibeu': 'Kiribati',
            'Bairiki': 'Kiribati',
            'Majuro': 'Marshall Islands',
            'Ebeye': 'Marshall Islands',
            'Palikir': 'Federated States of Micronesia',
            'Weno': 'Federated States of Micronesia',
            'Yaren': 'Nauru',
            'Ngerulmud': 'Palau',
            'Koror': 'Palau',
            'Port Moresby': 'Papua New Guinea',
            'Lae': 'Papua New Guinea',
            'Mount Hagen': 'Papua New Guinea',
            'Popondetta': 'Papua New Guinea',
            'Madang': 'Papua New Guinea',
            'Wewak': 'Papua New Guinea',
            'Vanimo': 'Papua New Guinea',
            'Kimbe': 'Papua New Guinea',
            'Mendi': 'Papua New Guinea',
            'Kerema': 'Papua New Guinea',
            'Apia': 'Samoa',
            'Asau': 'Samoa',
            'Mulifanua': 'Samoa',
            'Leulumoega': 'Samoa',
            'Lufilufi': 'Samoa',
            'Falealupo': 'Samoa',
            'Samalaeulu': 'Samoa',
            'Salelavalu': 'Samoa',
            'Safotulafai': 'Samoa',
            'Fagamalo': 'Samoa',
            'Honiara': 'Solomon Islands',
            'Gizo': 'Solomon Islands',
            'Auki': 'Solomon Islands',
            'Kirakira': 'Solomon Islands',
            'Buala': 'Solomon Islands',
            'Tulagi': 'Solomon Islands',
            'Tigoa': 'Solomon Islands',
            'Lata': 'Solomon Islands',
            'Ringgi': 'Solomon Islands',
            'Taro Island': 'Solomon Islands',
            'Nuku\'alofa': 'Tonga',
            'Neiafu': 'Tonga',
            'Haveluloto': 'Tonga',
            'Vaini': 'Tonga',
            'Pangai': 'Tonga',
            'Ohonua': 'Tonga',
            'Pea': 'Tonga',
            'Tofoa': 'Tonga',
            'Kolonga': 'Tonga',
            'Mu\'a': 'Tonga',
            'Funafuti': 'Tuvalu',
            'Asau': 'Tuvalu',
            'Lolua': 'Tuvalu',
            'Savave': 'Tuvalu',
            'Tanrake': 'Tuvalu',
            'Toga': 'Tuvalu',
            'Kulia': 'Tuvalu',
            'Asau': 'Tuvalu',
            'Port Vila': 'Vanuatu',
            'Luganville': 'Vanuatu',
            'Norsup': 'Vanuatu',
            'Isangel': 'Vanuatu',
            'Sola': 'Vanuatu',
            'Lenakel': 'Vanuatu',
            'Lakatoro': 'Vanuatu',
            'Longana': 'Vanuatu',
            'Saratamata': 'Vanuatu',
            'Loltong': 'Vanuatu',

            // ========== COMMON NAME VARIATIONS ==========
            'Ho Chi Minh': 'Vietnam',
            'Saigon': 'Vietnam',
            'Leningrad': 'Russia',
            'St. Petersburg': 'Russia',
            'Bombay': 'India',
            'Calcutta': 'India',
            'Madras': 'India',
            'Peking': 'China',
            'Canton': 'China',
            'Rangoon': 'Myanmar',
            'Babylon': 'Iraq',
            'Constantinople': 'Turkey',
            'Stalingrad': 'Russia',
            'Volgograd': 'Russia',
            'Leninsk': 'Kazakhstan',
            'Almaty': 'Kazakhstan'
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
        
        // If no match found, log for debugging and return the location name as country (fallback)
        console.warn(`⚠️ Unknown location not mapped to country: "${cleanLocation}"`);
        return cleanLocation;
    }

    getCountryCode(country) {
        const countryCodeMap = {
            // Country to ISO 2-letter code mapping
            'Pakistan': 'PK', 'Qatar': 'QA', 'Albania': 'AL', 'Turkey': 'TR',
            'Germany': 'DE', 'Canada': 'CA', 'Philippines': 'PH', 'UAE': 'AE',
            'United Arab Emirates': 'AE', 'Iraq': 'IQ', 'Rwanda': 'RW',
            'United States': 'US', 'India': 'IN', 'Iran': 'IR', 'Afghanistan': 'AF',
            'Australia': 'AU', 'Austria': 'AT', 'Belgium': 'BE', 'Brazil': 'BR',
            'China': 'CN', 'Denmark': 'DK', 'Egypt': 'EG', 'France': 'FR',
            'Thailand': 'TH', 'Vietnam': 'VN', 'Indonesia': 'ID', 'Malaysia': 'MY',
            'South Korea': 'KR', 'Japan': 'JP', 'Kenya': 'KE', 'Syria': 'SY',
            'Kuwait': 'KW', 'Saudi Arabia': 'SA', 'Israel': 'IL', 'Italy': 'IT',
            'Spain': 'ES', 'Poland': 'PL', 'Russia': 'RU', 'Peru': 'PE',
            'Mexico': 'MX', 'Colombia': 'CO', 'Ireland': 'IE', 'Switzerland': 'CH',
            'United Kingdom': 'GB', 'New Zealand': 'NZ', 'Jordan': 'JO',
            'Kazakhstan': 'KZ', 'Netherlands': 'NL', 'Greece': 'GR', 'Serbia': 'RS',
            'Romania': 'RO', 'Hungary': 'HU', 'Argentina': 'AR', 'Venezuela': 'VE',
            'Morocco': 'MA', 'Bangladesh': 'BD', 'Finland': 'FI', 'Hong Kong': 'HK',
            'Uganda': 'UG', 'Nepal': 'NP', 'Jamaica': 'JM', 'Cyprus': 'CY',
            'Nigeria': 'NG', 'Bolivia': 'BO', 'Portugal': 'PT', 'Iceland': 'IS',
            'Chile': 'CL', 'Bulgaria': 'BG', 'Sweden': 'SE', 'Taiwan': 'TW',
            'Uzbekistan': 'UZ', 'Georgia': 'GE', 'Croatia': 'HR', 'South Africa': 'ZA',
            'Senegal': 'SN', 'Guatemala': 'GT', 'Cuba': 'CU', 'Bahamas': 'BS',
            'Panama': 'PA', 'Czech Republic': 'CZ', 'Ecuador': 'EC', 'Costa Rica': 'CR',
            'Estonia': 'EE', 'Latvia': 'LV', 'Lithuania': 'LT', 'Tunisia': 'TN',
            'Lebanon': 'LB', 'Mali': 'ML', 'Norway': 'NO', 'Azerbaijan': 'AZ',
            'Tajikistan': 'TJ', 'Ethiopia': 'ET', 'Ghana': 'GH', 'Tanzania': 'TZ',
            'Slovakia': 'SK', 'Ukraine': 'UA', 'Armenia': 'AM', 'Myanmar': 'MM',
            'Somalia': 'SO', 'Kyrgyzstan': 'KG', 'Albania': 'AL', 'Mauritania': 'MR',
            'Niger': 'NE', 'Republic of Congo': 'CG', 'Democratic Republic of Congo': 'CD',
            'Eritrea': 'ER', 'Haiti': 'HT', 'Kosovo': 'XK', 'Tonga': 'TO',
            'Botswana': 'BW', 'Zimbabwe': 'ZW', 'Sudan': 'SD', 'Gabon': 'GA',
            'Malawi': 'MW', 'Slovenia': 'SI', 'Togo': 'TG', 'Angola': 'AO',
            'Zambia': 'ZM', 'Bahrain': 'BH', 'Mozambique': 'MZ', 'Belarus': 'BY',
            'Liberia': 'LR', 'Uruguay': 'UY', 'Oman': 'OM', 'Chad': 'TD',
            'Burkina Faso': 'BF', 'Cambodia': 'KH', 'Mauritius': 'MU',
            'Trinidad and Tobago': 'TT', 'El Salvador': 'SV', 'Yemen': 'YE',
            'North Macedonia': 'MK', 'Fiji': 'FJ', 'Honduras': 'HN', 'Bhutan': 'BT',
            'Mongolia': 'MN', 'Malta': 'MT', 'Laos': 'LA', 'Namibia': 'NA',
            'Cameroon': 'CM', 'Sierra Leone': 'SL', 'Guyana': 'GY',
            'Ivory Coast': 'CI', 'Côte d\'Ivoire': 'CI', 'Djibouti': 'DJ',
            'Equatorial Guinea': 'GQ', 'Gambia': 'GM', 'Guinea': 'GN',
            'Guinea-Bissau': 'GW', 'Lesotho': 'LS', 'Madagascar': 'MG',
            'Sao Tome and Principe': 'ST', 'São Tomé and Príncipe': 'ST',
            'Seychelles': 'SC', 'Burundi': 'BI', 'Cape Verde': 'CV',
            'Central African Republic': 'CF', 'Comoros': 'KM', 'Eswatini': 'SZ',
            'Swaziland': 'SZ', 'Libya': 'LY', 'South Sudan': 'SS',
            'Belize': 'BZ', 'Nicaragua': 'NI', 'Barbados': 'BB',
            'Dominica': 'DM', 'Dominican Republic': 'DO', 'Grenada': 'GD',
            'Saint Lucia': 'LC', 'Saint Vincent and the Grenadines': 'VC',
            'Antigua and Barbuda': 'AG', 'Saint Kitts and Nevis': 'KN',
            'Suriname': 'SR', 'Paraguay': 'PY', 'French Guiana': 'GF',
            'Papua New Guinea': 'PG', 'Solomon Islands': 'SB', 'Vanuatu': 'VU',
            'Samoa': 'WS', 'Kiribati': 'KI', 'Tuvalu': 'TV', 'Nauru': 'NR',
            'Palau': 'PW', 'Marshall Islands': 'MH', 'Federated States of Micronesia': 'FM',
            'Brunei': 'BN', 'East Timor': 'TL', 'Timor-Leste': 'TL',
            'North Korea': 'KP', 'Turkmenistan': 'TM', 'Moldova': 'MD',
            'Andorra': 'AD', 'Liechtenstein': 'LI', 'Monaco': 'MC',
            'San Marino': 'SM', 'Vatican City': 'VA', 'Luxembourg': 'LU'
        };
        
        return countryCodeMap[country] || '??';
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
            'Cameroon': '🇨🇲',
            
            // Additional flags for new country mappings
            'Eritrea': '🇪🇷', 'Republic of Congo': '🇨🇬', 'Niger': '🇳🇪', 
            'Mauritania': '🇲🇷', 'Tonga': '🇹🇴', 'Haiti': '🇭🇹', 'Kosovo': '🇽🇰'
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
        document.getElementById('addStepBtn')?.addEventListener('click', () => this.addProcessingStep());
        
        // Floating action buttons
        document.getElementById('floatingSaveBtn')?.addEventListener('click', () => this.saveChanges());
        document.getElementById('floatingDiscardBtn')?.addEventListener('click', () => this.discardChanges());
        
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
            searchResults.innerHTML = filtered.map((country, index) => {
                const countryCode = this.getCountryCode(country.country);
                // Find the correct key - could be country name or location name
                const dataKey = Object.keys(this.countryData).find(key => 
                    this.countryData[key] === country
                );
                return `
                    <div class="search-result-item" onclick="adminPortal.selectCountryByKey('${dataKey}')">
                        <span class="search-result-flag">${countryCode}</span>
                        <div class="search-result-info">
                            <h4>${country.country}</h4>
                            <p>${country.location || country.embassy}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }

        searchResults.style.display = 'block';
    }

    showAllCountries() {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        const countries = Object.values(this.countryData).sort((a, b) => 
            a.country.localeCompare(b.country)
        );

        searchResults.innerHTML = countries.map((country, index) => {
            const countryCode = this.getCountryCode(country.country);
            // Find the correct key - could be country name or location name
            const dataKey = Object.keys(this.countryData).find(key => 
                this.countryData[key] === country
            );
            return `
                <div class="search-result-item" onclick="adminPortal.selectCountryByKey('${dataKey}')">
                    <span class="search-result-flag">${countryCode}</span>
                    <div class="search-result-info">
                        <h4>${country.country}</h4>
                        <p>${country.location || country.embassy}</p>
                    </div>
                </div>
            `;
        }).join('');

        searchResults.style.display = 'block';
    }

    hideSearchResults() {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
        }
    }

    selectCountryByKey(dataKey) {
        if (this.unsavedChanges) {
            if (!confirm('You have unsaved changes. Do you want to discard them?')) {
                return;
            }
        }

        this.currentCountryKey = dataKey;
        const data = this.countryData[dataKey];
        
        if (!data) {
            console.error('Country data not found for key:', dataKey);
            return;
        }

        // Update header - use country code instead of flag
        const countryCode = this.getCountryCode(data.country);
        document.getElementById('countryFlag').textContent = countryCode;
        document.getElementById('countryName').textContent = data.country;
        document.getElementById('embassyInfo').textContent = `${data.location || data.embassy || 'Unknown location'}`;

        // Initialize all form fields with default values if data is missing
        this.initializeFormDefaults();
        
        // Load visa information
        this.loadVisaData(data);
        this.loadTravelData(data);
        this.loadChangeHistory(data.country);

        // Show editor and switch to visa tab
        document.getElementById('editorSection').style.display = 'block';
        this.switchTab('visa');
        
        // Show floating action buttons
        document.getElementById('floatingActions').style.display = 'flex';

        // Clear search
        document.getElementById('countrySearch').value = '';
        this.hideSearchResults();

        this.unsavedChanges = false;
    }

    selectCountry(countryName) {
        // Legacy function - redirect to selectCountryByKey
        const dataKey = Object.keys(this.countryData).find(key => 
            this.countryData[key].country === countryName
        );
        if (dataKey) {
            this.selectCountryByKey(dataKey);
        }
    }

    initializeFormDefaults() {
        // Reset all form fields to default values
        // Visa Information
        document.getElementById('visaRequired').value = 'unknown';
        document.getElementById('visaType').value = '';
        document.getElementById('visaCost').value = '';
        document.getElementById('validity').value = '';
        document.getElementById('processingTime').value = '';
        document.getElementById('applicationMethod').value = 'embassy';
        document.getElementById('officialLink').value = '';
        document.getElementById('extensionPossible').value = 'unknown';
        document.getElementById('extensionDuration').value = '';
        document.getElementById('extensionCost').value = '';
        document.getElementById('sourceName').value = '';
        document.getElementById('sourceType').value = 'embassy';
        document.getElementById('lastUpdated').value = new Date().toISOString().split('T')[0];
        
        // Travel Information
        document.getElementById('directFlights').value = 'unknown';
        document.getElementById('airlines').value = '';
        document.getElementById('flightDuration').value = '';
        document.getElementById('mainAirport').value = '';
        document.getElementById('airportCode').value = '';
        document.getElementById('cityDistance').value = '';
        document.getElementById('safetyLevel').value = 'unknown';
        document.getElementById('travelNotes').value = '';
        
        // Clear processing steps
        const container = document.getElementById('processingStepsList');
        if (container) {
            container.innerHTML = '';
        }
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
        const saveBtn = document.getElementById('floatingSaveBtn');
        if (saveBtn) {
            saveBtn.innerHTML = '<span class="floating-icon">💾</span><span class="floating-text">Save*</span>';
        }
    }

    async saveChanges() {
        if (!this.currentCountryKey) return;

        const data = this.collectFormData();
        
        // Validate required fields
        if (!this.validateData(data)) {
            return;
        }

        // Get the current country name for history tracking
        const currentCountryName = this.countryData[this.currentCountryKey].country;

        // Update country data using the key
        this.countryData[this.currentCountryKey] = {
            ...this.countryData[this.currentCountryKey],
            ...data
        };

        // Record change in history with country name
        this.recordChange('update', `Updated ${currentCountryName} information`, this.getChangeSummary(data));

        // Save to localStorage (in production, this would be an API call)
        localStorage.setItem('adminCountryData', JSON.stringify(this.countryData));
        localStorage.setItem('adminChangeHistory', JSON.stringify(this.changeHistory));
        
        // Update database-specific storage for database view
        this.updateDatabaseStorage();

        // Reset unsaved changes
        this.unsavedChanges = false;
        const saveBtn = document.getElementById('floatingSaveBtn');
        if (saveBtn) {
            saveBtn.innerHTML = '<span class="floating-icon">💾</span><span class="floating-text">Save</span>';
        }

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
            this.selectCountryByKey(this.currentCountryKey);
        }
    }


    updateDatabaseStorage() {
        // Update database-specific storage entries for the database view
        // Convert admin country data to database format
        const visaData = [];
        const travelData = [];
        
        Object.values(this.countryData).forEach(country => {
            // Use location or embassy field (handles both SIV imports and manual entries)
            const locationName = country.location || country.embassy;
            if (locationName) {
                // Add to visa data
                visaData.push({
                    embassy: locationName,
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
                    embassy: locationName,
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
        console.log('Sample visa data:', visaData[0]);
        console.log('Sample travel data:', travelData[0]);
        
        // Also update the display pages directly
        // This ensures the visa and travel pages get the updated data
        if (visaData.length > 0) {
            // Store as adminVisaData for direct access by visa page
            localStorage.setItem('adminVisaData', JSON.stringify(visaData));
        }
        if (travelData.length > 0) {
            // Store as adminTravelData for direct access by travel page
            localStorage.setItem('adminTravelData', JSON.stringify(travelData));
        }
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
            country.location || country.embassy,
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

    clearAllData() {
        const confirmMsg = `⚠️ WARNING: This will clear visa and travel information.

This will remove:
• All country visa requirements data
• All travel information data
• Admin change history

This will KEEP:
• Your uploaded SIV issuance data
• File upload history

Continue?`;

        if (confirm(confirmMsg)) {
            // Only clear visa/travel related data, preserve SIV data
            localStorage.removeItem('adminCountryData');
            localStorage.removeItem('adminVisaData');
            localStorage.removeItem('adminTravelData');
            localStorage.removeItem('adminChangeHistory');
            localStorage.removeItem('databaseVisaData');
            localStorage.removeItem('databaseTravelData');
            
            // Keep these:
            // - sivImportData (your uploaded SIV data)
            // - fileUploads (upload history)
            // - importHistory (import records)
            
            // Reset only visa/travel data in memory
            this.countryData = {};
            this.changeHistory = [];
            
            // Reload countries from SIV data only
            this.loadCountryData();
            
            // Hide editor section and floating actions
            document.getElementById('editorSection').style.display = 'none';
            document.getElementById('floatingActions').style.display = 'none';
            
            // Clear search
            document.getElementById('countrySearch').value = '';
            this.hideSearchResults();
            
            // Show success notification
            this.showNotification('✅ Visa and travel data cleared! SIV data preserved.');
            
            // Soft reload to refresh the view
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
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
        btn.innerHTML = '<span class="btn-icon">📤</span>Hide Data Upload';
    }

    closeImportCenter() {
        const importSection = document.getElementById('importSection');
        importSection.style.display = 'none';
        
        // Reset button text
        const btn = document.getElementById('dataImportBtn');
        btn.innerHTML = '<span class="btn-icon">📤</span>SIV Data Upload';
        
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