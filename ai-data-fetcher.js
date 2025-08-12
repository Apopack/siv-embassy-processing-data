// AI Data Fetcher for Country Information
// This module handles OpenAI API integration for fetching comprehensive country data

class AIDataFetcher {
    constructor() {
        // OpenAI API configuration
        this.apiKey = localStorage.getItem('openai_api_key') || '';
        this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-4-turbo-preview';
        
        // Category titles for display purposes
        this.categoryTitles = {
            visa_policy: 'Visa Policy',
            work_rights: 'Work Rights & Short-Term Work',
            embassy: 'U.S. Embassy & SIV Medical Exam',
            safety: 'Safety & Neighborhoods',
            accommodation: 'Accommodation',
            cost_of_living: 'Cost of Living',
            travel: 'Travel Routes & Flights'
        };
    }

    // JSON Schemas for each category
    getSchemas() {
        return {
            visa_policy: {
                "type": "object",
                "additionalProperties": false,
                "patternProperties": {
                    "^[A-Z]{2}$": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "country_name": { "type": "string" },
                            "city_name": { "type": "string" },
                            "category": { "const": "visa_policy" },
                            "data": {
                                "type": "object",
                                "additionalProperties": false,
                                "properties": {
                                    "visa_category": { "type": "string", "enum": ["visa_free","visa_on_arrival","e_visa","embassy_visa"] },
                                    "entry_mode": { "type": "array", "items": { "type": "string", "enum": ["air","land","sea"] } },
                                    "visa_fee_single_usd": { "type": ["number","null"] },
                                    "visa_fee_multiple_usd": { "type": ["number","null"] },
                                    "visa_extension_allowed": { "type": ["boolean","null"] },
                                    "visa_extension_max_days": { "type": ["integer","null"] },
                                    "visa_extension_fee_usd": { "type": ["number","null"] },
                                    "work_allowed_on_visa": { "type": ["boolean","null"] },
                                    "visa_application_method": { "type": "array", "items": { "type": "string", "enum": ["online","embassy","on_arrival"] } },
                                    "visa_application_url": { "type": ["string","null"], "pattern": "^https?://" }
                                },
                                "required": ["visa_category","entry_mode","visa_application_method"]
                            },
                            "sources": {
                                "type": "object",
                                "additionalProperties": {
                                    "type": "array",
                                    "items": { "type": "string", "pattern": "^https?://" }
                                }
                            },
                            "last_updated": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
                            "notes": { "type": "array", "items": { "type": "string" } }
                        },
                        "required": ["country_name","city_name","category","data","sources","last_updated","notes"]
                    }
                }
            },
            work_rights: {
                "type": "object",
                "additionalProperties": false,
                "patternProperties": {
                    "^[A-Z]{2}$": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "country_name": { "type": "string" },
                            "city_name": { "type": "string" },
                            "category": { "const": "work_rights" },
                            "data": {
                                "type": "object",
                                "additionalProperties": false,
                                "properties": {
                                    "can_work_legally_on_arrival": { "type": ["boolean","null"] },
                                    "conditions_to_work": { "type": ["string","null"] },
                                    "short_term_work_info": { "type": ["string","null"] }
                                }
                            },
                            "sources": {
                                "type": "object",
                                "additionalProperties": {
                                    "type": "array",
                                    "items": { "type": "string", "pattern": "^https?://" }
                                }
                            },
                            "last_updated": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
                            "notes": { "type": "array", "items": { "type": "string" } }
                        },
                        "required": ["country_name","city_name","category","data","sources","last_updated","notes"]
                    }
                }
            },
            embassy: {
                "type": "object",
                "additionalProperties": false,
                "patternProperties": {
                    "^[A-Z]{2}$": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "country_name": { "type": "string" },
                            "city_name": { "type": "string" },
                            "category": { "const": "embassy" },
                            "data": {
                                "type": "object",
                                "additionalProperties": false,
                                "properties": {
                                    "us_embassy_name": { "type": ["string","null"] },
                                    "us_embassy_address": { "type": ["string","null"] },
                                    "us_embassy_website_url": { "type": ["string","null"], "pattern": "^https?://" },
                                    "us_embassy_iv_url": { "type": ["string","null"], "pattern": "^https?://" },
                                    "us_embassy_iv_email": { "type": ["string","null"] },
                                    "medical_exam_facility_name": { "type": ["string","null"] },
                                    "medical_exam_facility_address": { "type": ["string","null"] },
                                    "medical_exam_facility_phone": { "type": ["string","null"] },
                                    "medical_exam_facility_website": { "type": ["string","null"], "pattern": "^https?://" },
                                    "medical_exam_notes": { "type": ["string","null"] }
                                }
                            },
                            "sources": {
                                "type": "object",
                                "additionalProperties": {
                                    "type": "array",
                                    "items": { "type": "string", "pattern": "^https?://" }
                                }
                            },
                            "last_updated": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
                            "notes": { "type": "array", "items": { "type": "string" } }
                        },
                        "required": ["country_name","city_name","category","data","sources","last_updated","notes"]
                    }
                }
            },
            safety: {
                "type": "object",
                "additionalProperties": false,
                "patternProperties": {
                    "^[A-Z]{2}$": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "country_name": { "type": "string" },
                            "city_name": { "type": "string" },
                            "category": { "const": "safety" },
                            "data": {
                                "type": "object",
                                "additionalProperties": false,
                                "properties": {
                                    "travel_advisory_level": { "type": ["string","null"] },
                                    "travel_advisory_url": { "type": ["string","null"], "pattern": "^https?://" },
                                    "hotspot_notes": { "type": ["string","null"] },
                                    "safer_neighborhoods": { "type": ["string","null"] },
                                    "afghan_neighborhoods": { "type": ["string","null"] }
                                }
                            },
                            "sources": {
                                "type": "object",
                                "additionalProperties": {
                                    "type": "array",
                                    "items": { "type": "string", "pattern": "^https?://" }
                                }
                            },
                            "last_updated": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
                            "notes": { "type": "array", "items": { "type": "string" } }
                        },
                        "required": ["country_name","city_name","category","data","sources","last_updated","notes"]
                    }
                }
            },
            accommodation: {
                "type": "object",
                "additionalProperties": false,
                "patternProperties": {
                    "^[A-Z]{2}$": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "country_name": { "type": "string" },
                            "city_name": { "type": "string" },
                            "category": { "const": "accommodation" },
                            "data": {
                                "type": "object",
                                "additionalProperties": false,
                                "properties": {
                                    "hostel_price_min_usd": { "type": ["number","null"] },
                                    "hostel_price_max_usd": { "type": ["number","null"] },
                                    "budget_hotel_price_min_usd": { "type": ["number","null"] },
                                    "budget_hotel_price_max_usd": { "type": ["number","null"] },
                                    "furnished_rental_price_min_usd": { "type": ["number","null"] },
                                    "furnished_rental_price_max_usd": { "type": ["number","null"] }
                                }
                            },
                            "sources": {
                                "type": "object",
                                "additionalProperties": {
                                    "type": "array",
                                    "items": { "type": "string", "pattern": "^https?://" }
                                }
                            },
                            "last_updated": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
                            "notes": { "type": "array", "items": { "type": "string" } }
                        },
                        "required": ["country_name","city_name","category","data","sources","last_updated","notes"]
                    }
                }
            },
            cost_of_living: {
                "type": "object",
                "additionalProperties": false,
                "patternProperties": {
                    "^[A-Z]{2}$": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "country_name": { "type": "string" },
                            "city_name": { "type": "string" },
                            "category": { "const": "cost_of_living" },
                            "data": {
                                "type": "object",
                                "additionalProperties": false,
                                "properties": {
                                    "cost_single_person_usd": { "type": ["number","null"] },
                                    "cost_family4_usd": { "type": ["number","null"] }
                                }
                            },
                            "sources": {
                                "type": "object",
                                "additionalProperties": {
                                    "type": "array",
                                    "items": { "type": "string", "pattern": "^https?://" }
                                }
                            },
                            "last_updated": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
                            "notes": { "type": "array", "items": { "type": "string" } }
                        },
                        "required": ["country_name","city_name","category","data","sources","last_updated","notes"]
                    }
                }
            },
            travel: {
                "type": "object",
                "additionalProperties": false,
                "patternProperties": {
                    "^[A-Z]{2}$": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "country_name": { "type": "string" },
                            "city_name": { "type": "string" },
                            "category": { "const": "travel" },
                            "data": {
                                "type": "object",
                                "additionalProperties": false,
                                "properties": {
                                    "origin_airport_code": { "type": ["string","null"] },
                                    "destination_airport_code": { "type": ["string","null"] },
                                    "transit_points": { "type": ["array","null"], "items": { "type": "string" } },
                                    "transit_visa_notes": { "type": ["string","null"] },
                                    "flight_price_oneway_usd": { "type": ["number","null"] },
                                    "flight_search_url": { "type": ["string","null"], "pattern": "^https?://" }
                                }
                            },
                            "sources": {
                                "type": "object",
                                "additionalProperties": {
                                    "type": "array",
                                    "items": { "type": "string", "pattern": "^https?://" }
                                }
                            },
                            "last_updated": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
                            "notes": { "type": "array", "items": { "type": "string" } }
                        },
                        "required": ["country_name","city_name","category","data","sources","last_updated","notes"]
                    }
                }
            }
        };
    }

    // Generate the improved prompt for OpenAI API
    generatePrompt(countries, category) {
        const currentDate = new Date().toISOString().split('T')[0];
        const schemas = this.getSchemas();
        
        // Convert countries to ISO2 format for the prompt
        const countriesJson = JSON.stringify(countries.map(country => ({
            iso2: this.getCountryISO2(country),
            name: country
        })));

        const systemPrompt = `You are a fact-extraction agent. Output only valid minified JSON that conforms exactly to the provided JSON schema. Do not include any text outside the JSON. Prefer official sources. If a field cannot be verified from at least one reputable URL, return null for that field and explain why in notes. Normalize currency to USD. Dates must be YYYY-MM-DD.`;

        const userPrompt = `Current date: ${currentDate}

Audience: Afghan SIV applicants and holders evaluating third-country locations.

Countries to process (by ISO2 and name): ${countriesJson}
Category to extract: ${category}

Sourcing rules:

Prioritize official/primary domains (allowlist examples):

Immigration/permits: *.gov.rw, irembo.gov.rw, migration.gov.rw

U.S. Embassy/State: *.usembassy.gov, state.gov

Safety: state.gov, gov.uk (FCDO), canada.ca

Costs/booking (fallbacks): numbeo.com, booking.com, hostelworld.com, skyscanner.com

Each field in data must have at least one source URL in sources[field_name].

If Afghan nationality has special treatment vs. "all nationalities," capture the Afghan-specific rule; otherwise return the general rule and add a note.

Output requirements:

Output a single JSON object keyed by ISO2 (upper-case).

For any unknown/unverifiable value, set the value to null (not "N/A") and explain in notes.

Use enums exactly as specified in the schema.

Use arrays where the schema requires arrays.

No markdown, no commentary—JSON only.

JSON SCHEMA:
${JSON.stringify(schemas[category], null, 2)}

Return JSON for the requested ${category} category only.`;

        return { systemPrompt, userPrompt };
    }

    // Helper function to get ISO2 code from country name
    getCountryISO2(countryName) {
        const countryMap = {
            'Rwanda': 'RW',
            'Uganda': 'UG',
            'Kenya': 'KE',
            'Turkey': 'TR',
            'Pakistan': 'PK',
            'India': 'IN',
            'United Arab Emirates': 'AE',
            'Qatar': 'QA',
            'Germany': 'DE',
            'France': 'FR',
            'United Kingdom': 'GB',
            'Canada': 'CA',
            'Australia': 'AU'
        };
        return countryMap[countryName] || 'XX'; // Default fallback
    }

    // Call OpenAI API to fetch data using improved prompt
    async fetchCountryData(countries, categories = null) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        // Use the new category names directly
        const availableCategories = ['visa_policy', 'work_rights', 'embassy', 'safety', 'accommodation', 'cost_of_living', 'travel'];
        const categoriesToFetch = categories || availableCategories;
        const results = {};

        for (const category of categoriesToFetch) {
            try {
                const prompts = this.generatePrompt(countries, category);
                
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [
                            {
                                role: 'system',
                                content: prompts.systemPrompt
                            },
                            {
                                role: 'user',
                                content: prompts.userPrompt
                            }
                        ],
                        temperature: 0.1, // Lower for more deterministic results
                        top_p: 0.1,      // More focused responses
                        max_tokens: 4000,
                        response_format: { type: "json_object" }
                    })
                });

                if (!response.ok) {
                    throw new Error(`API request failed: ${response.statusText}`);
                }

                const data = await response.json();
                const content = JSON.parse(data.choices[0].message.content);
                
                // Process the new structured response format
                for (const iso2 in content) {
                    const countryData = content[iso2];
                    const countryName = countryData.country_name;
                    
                    if (!results[countryName]) {
                        results[countryName] = {
                            data: {},
                            sources: {},
                            notes: [],
                            last_updated: new Date().toISOString().split('T')[0],
                            ai_generated: true,
                            categories: {}
                        };
                    }
                    
                    // Merge category data - flatten the data structure to match existing field names
                    Object.assign(results[countryName].data, countryData.data);
                    
                    // Merge sources - convert array format to single URL for compatibility
                    for (const field in countryData.sources) {
                        if (Array.isArray(countryData.sources[field]) && countryData.sources[field].length > 0) {
                            results[countryName].sources[field] = countryData.sources[field][0]; // Use first URL
                        }
                    }
                    
                    // Add notes
                    if (Array.isArray(countryData.notes)) {
                        results[countryName].notes = results[countryName].notes.concat(countryData.notes);
                    }
                    
                    // Add category-specific metadata
                    results[countryName].categories[category] = {
                        fetched_at: new Date().toISOString(),
                        city: countryData.city_name || 'Unknown'
                    };
                }

                // Add delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`Error fetching ${category} data:`, error);
                
                // Add error information to results
                for (const country of countries) {
                    if (!results[country]) {
                        results[country] = {
                            data: {},
                            sources: {},
                            errors: {},
                            notes: []
                        };
                    }
                    if (!results[country].errors) {
                        results[country].errors = {};
                    }
                    results[country].errors[category] = error.message;
                }
            }
        }

        return results;
    }

    // Validate fetched data
    validateData(data) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        for (const country in data) {
            const countryData = data[country];
            
            // Check for required fields
            const requiredFields = ['visa_category', 'visa_fee_single_usd', 'us_embassy_name'];
            for (const field of requiredFields) {
                if (!countryData.data[field] || countryData.data[field] === 'N/A') {
                    validation.warnings.push(`${country}: Missing required field '${field}'`);
                }
            }

            // Validate URLs
            const urlFields = ['visa_application_url', 'us_embassy_website_url', 'travel_advisory_url'];
            for (const field of urlFields) {
                if (countryData.data[field] && countryData.data[field] !== 'N/A') {
                    try {
                        new URL(countryData.data[field]);
                    } catch (e) {
                        validation.errors.push(`${country}: Invalid URL in field '${field}'`);
                        validation.isValid = false;
                    }
                }
            }

            // Validate numeric fields
            const numericFields = [
                'visa_fee_single_usd', 'visa_fee_multiple_usd', 'visa_extension_fee_usd',
                'hostel_price_min_usd', 'hostel_price_max_usd', 'cost_single_person_usd'
            ];
            for (const field of numericFields) {
                if (countryData.data[field] && countryData.data[field] !== 'N/A') {
                    const value = parseFloat(countryData.data[field]);
                    if (isNaN(value) || value < 0) {
                        validation.errors.push(`${country}: Invalid numeric value in field '${field}'`);
                        validation.isValid = false;
                    }
                }
            }
        }

        return validation;
    }

    // Format data for display
    formatForDisplay(data) {
        const formatted = {};
        
        for (const country in data) {
            const countryData = data[country];
            formatted[country] = {
                data: countryData.data || {},
                sources: countryData.sources || {},
                notes: countryData.notes || [],
                categories: countryData.categories || {},
                metadata: {
                    lastUpdated: countryData.last_updated,
                    aiGenerated: countryData.ai_generated || false
                }
            };
        }

        return formatted;
    }

    // Save configuration
    saveAPIKey(apiKey) {
        localStorage.setItem('openai_api_key', apiKey);
        this.apiKey = apiKey;
    }

    // Check if API is configured
    isConfigured() {
        return !!this.apiKey;
    }
}

// Export for use in admin panel
window.AIDataFetcher = AIDataFetcher;