// Database Reset Script - Clear all data and start fresh
// This script should be run in the browser console or executed programmatically

function resetDatabase() {
    console.log('🔄 Resetting database to clean state...');
    
    // Clear all localStorage data
    const keysToRemove = [
        // SIV Data
        'sivImportData',
        'databaseSIVData',
        
        // Visa Data
        'adminCountryData',
        'databaseVisaData',
        
        // Travel Data  
        'databaseTravelData',
        
        // Import History
        'fileUploads',
        'adminChangeHistory',
        'databaseHistoryData',
        
        // User Data
        'databaseUserData'
    ];
    
    keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`✅ Cleared: ${key}`);
        }
    });
    
    // Initialize empty structures for immediate use
    const emptyStructures = {
        'sivImportData': JSON.stringify({ embassies: [] }),
        'adminCountryData': JSON.stringify({}),
        'fileUploads': JSON.stringify([]),
        'adminChangeHistory': JSON.stringify([]),
        'databaseHistoryData': JSON.stringify([]),
        'databaseUserData': JSON.stringify([
            {
                id: 1,
                username: "admin",
                email: "admin@example.com",
                role: "Administrator", 
                permissions: "Full Access",
                status: "Active",
                lastLogin: new Date().toISOString(),
                created: new Date().toISOString().split('T')[0]
            }
        ])
    };
    
    Object.entries(emptyStructures).forEach(([key, value]) => {
        localStorage.setItem(key, value);
        console.log(`🆕 Initialized: ${key}`);
    });
    
    console.log('✨ Database reset complete! Reload the page to see clean state.');
    console.log('📋 Next steps:');
    console.log('   1. Upload SIV Excel files via Admin Panel > Data Import Center');
    console.log('   2. Add visa information via Admin Panel country search');
    console.log('   3. Add travel information via Admin Portal country editor');
    console.log('   4. View consolidated data in Database View');
    
    return {
        status: 'success',
        message: 'Database reset to clean state',
        timestamp: new Date().toISOString()
    };
}

// Auto-execute if running in browser console
if (typeof window !== 'undefined') {
    console.log('🚀 Database Reset Script Loaded');
    console.log('💡 Call resetDatabase() to clear all data and start fresh');
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { resetDatabase };
}