// Netlify Function to securely handle OpenAI API calls
// This keeps the API key secure on the server side

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight' }),
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get the OpenAI API key from environment variables
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey || openaiApiKey === 'YOUR_OPENAI_API_KEY_HERE') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          error: 'API_KEY_NOT_CONFIGURED',
          message: 'OpenAI API key not configured. Using fallback information.' 
        }),
      };
    }

    // Parse the request body
    const { embassy, country } = JSON.parse(event.body);
    
    if (!embassy || !country) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Embassy and country are required' }),
      };
    }

    // Create the prompt for OpenAI
    const prompt = `Please provide comprehensive information for Afghan SIV applicants about ${embassy}, ${country}. Return the information as a JSON object with the following structure:

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

    // Make the API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert on immigration procedures and embassy information. Provide accurate, helpful information for SIV applicants. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Try to parse the JSON response
    let embassyInfo;
    try {
      embassyInfo = JSON.parse(content);
    } catch (parseError) {
      // If JSON parsing fails, extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        embassyInfo = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse OpenAI response as JSON');
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: embassyInfo
      }),
    };

  } catch (error) {
    console.error('Error in embassy-info function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'FUNCTION_ERROR',
        message: 'Error processing request. Using fallback information.',
        details: error.message
      }),
    };
  }
};