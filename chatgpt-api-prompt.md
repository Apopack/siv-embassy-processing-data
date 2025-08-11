# ChatGPT API Prompt Template for SIV Country Information

## System Prompt
You are an expert travel and immigration consultant specializing in information for Afghan nationals, particularly SIV (Special Immigrant Visa) applicants and holders. You provide accurate, up-to-date, and verifiable information with official sources.

## Main Prompt Template

```
Research and provide comprehensive information for Afghan nationals (SIV applicants/holders) traveling to or residing in [COUNTRY_NAME].

Current Date: [CURRENT_DATE]

Please provide the following information with verifiable sources:

## 1. VISA POLICY
- visa_category: Type of visa required (visa-free/visa-on-arrival/e-visa/embassy-visa)
- entry_mode: Allowed entry modes (land/air/sea)
- visa_fee_single_usd: Single entry visa fee in USD
- visa_fee_multiple_usd: Multiple entry visa fee in USD
- visa_extension_allowed: Can the visa be extended? (yes/no)
- visa_extension_max_days: Maximum extension period in days
- visa_extension_fee_usd: Extension fee in USD
- work_allowed_on_visa: Is work allowed on tourist visa? (yes/no)
- visa_application_method: How to apply (online/embassy/on-arrival)
- visa_application_url: Official visa application website

## 2. WORK RIGHTS & SHORT-TERM WORK
- can_work_legally_on_arrival: Can Afghans work legally upon arrival? (yes/no)
- conditions_to_work: What conditions must be met to work legally?
- short_term_work_info: Information about short-term work opportunities

## 3. U.S. EMBASSY & SIV MEDICAL EXAM
- us_embassy_name: Full name of U.S. Embassy/Consulate
- us_embassy_address: Complete street address
- us_embassy_website_url: Embassy website URL
- us_embassy_iv_url: Immigrant visa section URL
- us_embassy_iv_email: Immigrant visa contact email
- medical_exam_facility_name: Approved panel physician/clinic name
- medical_exam_facility_address: Medical facility address
- medical_exam_facility_phone: Contact phone number
- medical_exam_facility_website: Facility website
- medical_exam_notes: Important notes about medical exams

## 4. SAFETY & NEIGHBORHOODS
- travel_advisory_level: U.S. State Dept level (1-4)
- travel_advisory_url: Link to travel advisory
- hotspot_notes: Areas to avoid or exercise caution
- safer_neighborhoods: List of safer areas for visitors
- afghan_neighborhoods: Areas with Afghan communities

## 5. ACCOMMODATION
- hostel_price_min_usd: Minimum hostel price per night
- hostel_price_max_usd: Maximum hostel price per night
- budget_hotel_price_min_usd: Minimum budget hotel per night
- budget_hotel_price_max_usd: Maximum budget hotel per night
- furnished_rental_price_min_usd: Minimum monthly furnished rental
- furnished_rental_price_max_usd: Maximum monthly furnished rental

## 6. COST OF LIVING
- cost_single_person_usd: Monthly cost for single person
- cost_family4_usd: Monthly cost for family of 4

## 7. TRAVEL ROUTES & FLIGHTS
- origin_airport_code: Common origin airports (KBL, ISB, etc.)
- destination_airport_code: Destination airport code
- transit_points: Common transit cities
- transit_visa_notes: Transit visa requirements
- flight_price_oneway_usd: Typical one-way fare
- flight_search_url: Recommended booking site

IMPORTANT REQUIREMENTS:
1. Provide specific information for AFGHAN NATIONALS
2. Include a verifiable source URL for EACH data point
3. Use "N/A" if information is unavailable
4. Prices should be in USD
5. URLs must be complete and working
6. Consider SIV applicants traveling for U.S. visa interviews
7. Provide confidence level (high/medium/low) for each section

Format your response as JSON:
{
  "country": "[COUNTRY_NAME]",
  "data": {
    "field_name": "value",
    ...
  },
  "sources": {
    "field_name": "source_url",
    ...
  },
  "metadata": {
    "last_updated": "[CURRENT_DATE]",
    "confidence_levels": {
      "visa_policy": "high/medium/low",
      "work_rights": "high/medium/low",
      ...
    }
  },
  "notes": "Any critical information or warnings"
}
```

## Example API Call (JavaScript)

```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
            {
                role: 'system',
                content: 'You are an expert travel and immigration consultant...'
            },
            {
                role: 'user',
                content: promptTemplate.replace('[COUNTRY_NAME]', country)
            }
        ],
        temperature: 0.3,  // Lower temperature for factual accuracy
        max_tokens: 4000,
        response_format: { type: "json_object" }
    })
});
```

## Key Considerations for the AI:

1. **Afghan-Specific Information**: Always consider the specific situation of Afghan nationals who may face different visa requirements than other nationalities.

2. **SIV Context**: Remember these are SIV applicants who:
   - May be traveling for U.S. visa interviews
   - Need temporary accommodation while waiting
   - May need to work to support themselves
   - Have families with them

3. **Source Reliability Priority**:
   - Official government websites (.gov)
   - Embassy websites
   - UN/IOM reports
   - Reputable news sources
   - Travel forums (lower priority)

4. **Data Freshness**: Always check for the most recent information, especially post-2021 Taliban takeover changes.

5. **Safety Considerations**: Be extra careful with safety information, considering the vulnerable status of SIV applicants.

## Validation Checklist:

- [ ] All URLs are complete and start with https:// or http://
- [ ] Numeric values are positive numbers
- [ ] Yes/no fields contain only "yes", "no", or "N/A"
- [ ] Airport codes are valid IATA codes
- [ ] Travel advisory levels are between 1-4
- [ ] All required fields have values (even if "N/A")
- [ ] Sources are from reputable domains
- [ ] Information is current (within last 6 months ideally)