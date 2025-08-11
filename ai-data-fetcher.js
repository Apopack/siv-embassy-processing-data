// AI Data Fetcher for Country Information
// This module handles OpenAI API integration for fetching comprehensive country data

class AIDataFetcher {
    constructor() {
        // OpenAI API configuration
        this.apiKey = localStorage.getItem('openai_api_key') || '';
        this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-4-turbo-preview';
        
        // Data structure for all fields
        this.fieldCategories = {
            visaPolicy: {
                title: 'Visa Policy',
                fields: {
                    visa_category: 'Visa category for Afghan nationals (visa-free, visa-on-arrival, e-visa, embassy-visa)',
                    entry_mode: 'Entry mode (land, air, sea, or combinations)',
                    visa_fee_single_usd: 'Single entry visa fee in USD',
                    visa_fee_multiple_usd: 'Multiple entry visa fee in USD',
                    visa_extension_allowed: 'Is visa extension allowed (yes/no)',
                    visa_extension_max_days: 'Maximum days for visa extension',
                    visa_extension_fee_usd: 'Visa extension fee in USD',
                    work_allowed_on_visa: 'Is work allowed on tourist visa (yes/no)',
                    visa_application_method: 'Application method (online, embassy, on-arrival)',
                    visa_application_url: 'Official visa application website URL'
                }
            },
            workRights: {
                title: 'Right to Work & Short-Term Work',
                fields: {
                    can_work_legally_on_arrival: 'Can Afghans work legally upon arrival (yes/no)',
                    conditions_to_work: 'Conditions required to work legally',
                    short_term_work_info: 'Information about short-term work opportunities'
                }
            },
            usEmbassy: {
                title: 'U.S. Embassy & SIV Medical Exam',
                fields: {
                    us_embassy_name: 'Full name of U.S. Embassy or Consulate',
                    us_embassy_address: 'Complete address of U.S. Embassy',
                    us_embassy_website_url: 'U.S. Embassy website URL',
                    us_embassy_iv_url: 'Immigrant visa section URL',
                    us_embassy_iv_email: 'Immigrant visa section email',
                    medical_exam_facility_name: 'Name of approved medical exam facility',
                    medical_exam_facility_address: 'Address of medical exam facility',
                    medical_exam_facility_phone: 'Phone number of medical facility',
                    medical_exam_facility_website: 'Medical facility website',
                    medical_exam_notes: 'Important notes about medical exams'
                }
            },
            safety: {
                title: 'Safety & Neighborhoods',
                fields: {
                    travel_advisory_level: 'U.S. State Department travel advisory level (1-4)',
                    travel_advisory_url: 'Link to official travel advisory',
                    hotspot_notes: 'Notes about areas to avoid or be cautious',
                    safer_neighborhoods: 'List of safer neighborhoods for visitors',
                    afghan_neighborhoods: 'Areas with Afghan communities'
                }
            },
            accommodation: {
                title: 'Accommodation',
                fields: {
                    hostel_price_min_usd: 'Minimum hostel price per night in USD',
                    hostel_price_max_usd: 'Maximum hostel price per night in USD',
                    budget_hotel_price_min_usd: 'Minimum budget hotel price per night in USD',
                    budget_hotel_price_max_usd: 'Maximum budget hotel price per night in USD',
                    furnished_rental_price_min_usd: 'Minimum monthly furnished rental in USD',
                    furnished_rental_price_max_usd: 'Maximum monthly furnished rental in USD'
                }
            },
            costOfLiving: {
                title: 'Cost of Living',
                fields: {
                    cost_single_person_usd: 'Monthly cost for single person in USD',
                    cost_family4_usd: 'Monthly cost for family of 4 in USD'
                }
            },
            travelRoutes: {
                title: 'Travel Routes & Flights',
                fields: {
                    origin_airport_code: 'Common origin airport codes (e.g., KBL, ISB)',
                    destination_airport_code: 'Destination airport code',
                    transit_points: 'Common transit points/cities',
                    transit_visa_notes: 'Notes about transit visa requirements',
                    flight_price_oneway_usd: 'Typical one-way flight price in USD',
                    flight_search_url: 'Recommended flight search URL'
                }
            }
        };
    }

    // Generate the prompt for OpenAI API
    generatePrompt(countries, category) {
        const currentDate = new Date().toISOString().split('T')[0];
        const fields = this.fieldCategories[category].fields;
        const fieldDescriptions = Object.entries(fields)
            .map(([key, description]) => `- ${key}: ${description}`)
            .join('\n');

        return `You are a travel and immigration expert providing accurate, up-to-date information for Afghan nationals (SIV applicants and holders) traveling to or residing in the following countries: ${countries.join(', ')}.

Current date: ${currentDate}

Please provide the following information for each country. For each piece of information, include a reliable source URL that can be verified. Focus on official government sources, embassy websites, and reputable travel resources.

Category: ${this.fieldCategories[category].title}

Fields to research:
${fieldDescriptions}

IMPORTANT INSTRUCTIONS:
1. Provide information specifically relevant to Afghan nationals
2. Include source URLs for each data point
3. Use "N/A" if information is not available
4. For prices, provide in USD
5. For URLs, provide complete, working links
6. Consider that these are SIV applicants who may be traveling for U.S. visa interviews

Please format your response as a JSON object with the following structure:
{
  "country_name": {
    "data": {
      "field_name": "value",
      ...
    },
    "sources": {
      "field_name": "source_url",
      ...
    },
    "last_updated": "${currentDate}",
    "confidence": "high|medium|low",
    "notes": "Any important additional context"
  }
}`;
    }

    // Call OpenAI API to fetch data
    async fetchCountryData(countries, categories = null) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const categoriesToFetch = categories || Object.keys(this.fieldCategories);
        const results = {};

        for (const category of categoriesToFetch) {
            try {
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
                                content: 'You are an expert in international travel, immigration, and visa policies with specific knowledge about requirements for Afghan nationals.'
                            },
                            {
                                role: 'user',
                                content: this.generatePrompt(countries, category)
                            }
                        ],
                        temperature: 0.3,
                        max_tokens: 4000,
                        response_format: { type: "json_object" }
                    })
                });

                if (!response.ok) {
                    throw new Error(`API request failed: ${response.statusText}`);
                }

                const data = await response.json();
                const content = JSON.parse(data.choices[0].message.content);
                
                // Merge results
                for (const country in content) {
                    if (!results[country]) {
                        results[country] = {
                            data: {},
                            sources: {},
                            last_updated: new Date().toISOString(),
                            ai_generated: true
                        };
                    }
                    
                    // Merge category data
                    Object.assign(results[country].data, content[country].data);
                    Object.assign(results[country].sources, content[country].sources);
                    
                    // Add category-specific metadata
                    if (!results[country].categories) {
                        results[country].categories = {};
                    }
                    results[country].categories[category] = {
                        confidence: content[country].confidence,
                        notes: content[country].notes,
                        fetched_at: new Date().toISOString()
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
                            errors: {}
                        };
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
            formatted[country] = {
                categories: {}
            };

            const countryData = data[country];
            
            // Group by category
            for (const category in this.fieldCategories) {
                formatted[country].categories[category] = {
                    title: this.fieldCategories[category].title,
                    fields: []
                };

                for (const field in this.fieldCategories[category].fields) {
                    const value = countryData.data[field];
                    const source = countryData.sources[field];
                    
                    formatted[country].categories[category].fields.push({
                        key: field,
                        label: this.fieldCategories[category].fields[field],
                        value: value || 'N/A',
                        source: source || null,
                        hasSource: !!source && source !== 'N/A'
                    });
                }
            }

            // Add metadata
            formatted[country].metadata = {
                lastUpdated: countryData.last_updated,
                aiGenerated: countryData.ai_generated,
                confidence: countryData.categories
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