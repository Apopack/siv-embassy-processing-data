let allData = {};
let embassyData = [];
let filteredData = [];
let currentDateRange = { startMonth: 1, startYear: 2025, endMonth: 5, endYear: 2025 };
let availableMonths = [];
let visibleMonths = [];

async function loadData() {
    try {
        // Check for imported data first (from admin panel)
        const importedData = localStorage.getItem('sivImportData');
        if (importedData) {
            try {
                allData = JSON.parse(importedData);
                console.log('Loading data from admin imports:', allData.embassies.length, 'embassies');
                
                // Set last updated to current time for imported data
                document.getElementById('lastUpdated').textContent = formatDate(new Date().toISOString());
                
                // Process and convert data to calendar format
                embassyData = processEmbassyData(allData.embassies);
                
                if (embassyData.length === 0) {
                    showEmptyState();
                    return;
                }
                
                // Determine available months
                availableMonths = getAvailableMonths();
                
                // Set default date range to January 2025 through latest available data
                setDefaultDateRange();
                
                // Calculate visible months based on current date range
                updateVisibleMonths();
                
                // Initial render
                filteredData = [...embassyData];
                renderTable();
                hideLoading();
                return;
            } catch (error) {
                console.error('Error parsing imported SIV data:', error);
            }
        }

        // Fallback to static JSON file if no imported data
        try {
            const response = await fetch('data/embassy-siv-data.json');
            allData = await response.json();
            
            document.getElementById('lastUpdated').textContent = formatDate(allData.lastUpdated);
            
            // Process and convert data to calendar format
            embassyData = processEmbassyData(allData.embassies);
            
            // Determine available months
            availableMonths = getAvailableMonths();
            
            // Set default date range to January 2025 through latest available data
            setDefaultDateRange();
            
            // Calculate visible months based on current date range
            updateVisibleMonths();
            
            // Initial render
            filteredData = [...embassyData];
            renderTable();
            hideLoading();
        } catch (fetchError) {
            console.log('No static data file found, showing empty state');
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showEmptyState();
    }
}

function showEmptyState() {
    const container = document.querySelector('.table-container');
    container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 60px 20px; color: #6B7280;">
            <div style="font-size: 64px; margin-bottom: 20px;">📊</div>
            <h3 style="color: #374151; margin-bottom: 10px;">No SIV Data Available</h3>
            <p style="margin-bottom: 20px;">Start by importing Excel files through the Admin Portal.</p>
            <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
                <h4 style="color: #374151; margin: 0 0 10px;">Getting Started:</h4>
                <ol style="color: #6B7280; margin: 0; padding-left: 20px;">
                    <li>Go to <strong>Admin Portal</strong> in the navigation</li>
                    <li>Click <strong>"Data Import Center"</strong></li>
                    <li>Upload your SIV Excel files</li>
                    <li>Data will automatically appear on this page</li>
                </ol>
            </div>
            <a href="admin.html" class="btn" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">Go to Admin Portal</a>
        </div>
    `;
}

function processEmbassyData(embassies) {
    const convertedEmbassies = embassies.map(embassy => {
        // Convert old format to new format if needed
        const convertedMonthlyData = {};
        
        // Handle both old fiscal year format and new calendar format
        Object.entries(embassy.monthlyData).forEach(([key, value]) => {
            if (key.includes('-')) {
                // Already in calendar format (YYYY-MM)
                convertedMonthlyData[key] = value;
            } else {
                // Convert from old fiscal year format
                const calendarDate = convertFiscalToCalendar(key);
                if (calendarDate) {
                    convertedMonthlyData[calendarDate] = value;
                }
            }
        });
        
        return {
            ...embassy,
            monthlyData: convertedMonthlyData
        };
    });
    
    // Calculate totals and sort
    return convertedEmbassies.map(embassy => {
        const total = calculateDateRangeTotal(embassy, currentDateRange);
        return { ...embassy, total, rangeTotal: total };
    }).sort((a, b) => b.rangeTotal - a.rangeTotal);
}

function convertFiscalToCalendar(fiscalMonth) {
    // Convert fiscal year month abbreviations to calendar dates
    const fiscalToCalendar = {
        'Oct': '2024-10',
        'Nov': '2024-11', 
        'Dec': '2024-12',
        'Jan': '2025-01',
        'Feb': '2025-02',
        'Mar': '2025-03',
        'Apr': '2025-04',
        'May': '2025-05',
        'Jun': '2025-06',
        'Jul': '2025-07',
        'Aug': '2025-08',
        'Sep': '2025-09'
    };
    
    return fiscalToCalendar[fiscalMonth];
}

function getAvailableMonths() {
    const monthsWithData = new Set();
    
    embassyData.forEach(embassy => {
        Object.entries(embassy.monthlyData).forEach(([monthKey, value]) => {
            if (value && value > 0) {
                monthsWithData.add(monthKey);
            }
        });
    });
    
    // Sort months chronologically
    return Array.from(monthsWithData).sort();
}

function setDefaultDateRange() {
    // Default to January 2025 through the latest available month
    const latestMonth = availableMonths[availableMonths.length - 1];
    if (latestMonth) {
        const [endYear, endMonth] = latestMonth.split('-').map(Number);
        currentDateRange = {
            startMonth: 1,
            startYear: 2025,
            endMonth: endMonth,
            endYear: endYear
        };
        
        // Update UI selectors
        document.getElementById('startMonth').value = '1';
        document.getElementById('startYear').value = '2025';
        document.getElementById('endMonth').value = endMonth.toString();
        document.getElementById('endYear').value = endYear.toString();
    }
}

function updateVisibleMonths() {
    const startDate = new Date(currentDateRange.startYear, currentDateRange.startMonth - 1);
    const endDate = new Date(currentDateRange.endYear, currentDateRange.endMonth - 1);
    
    visibleMonths = availableMonths.filter(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        const monthDate = new Date(year, month - 1);
        return monthDate >= startDate && monthDate <= endDate;
    }).sort();
    
    // Update the display
    updateDateRangeDisplay();
}

function updateDateRangeDisplay() {
    const startMonthName = getMonthName(currentDateRange.startMonth);
    const endMonthName = getMonthName(currentDateRange.endMonth);
    const displayText = `${startMonthName} ${currentDateRange.startYear} - ${endMonthName} ${currentDateRange.endYear}`;
    document.getElementById('currentDateRangeDisplay').textContent = displayText;
}

function getMonthName(monthNumber) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNumber - 1];
}

function calculateDateRangeTotal(embassy, dateRange) {
    let total = 0;
    const startDate = new Date(dateRange.startYear, dateRange.startMonth - 1);
    const endDate = new Date(dateRange.endYear, dateRange.endMonth - 1);
    
    Object.entries(embassy.monthlyData).forEach(([monthKey, value]) => {
        const [year, month] = monthKey.split('-').map(Number);
        const monthDate = new Date(year, month - 1);
        
        if (monthDate >= startDate && monthDate <= endDate) {
            total += value || 0;
        }
    });
    
    return total;
}

function renderTable() {
    updateTableHeaders();
    
    const tbody = document.getElementById('tableBody');
    const noResults = document.getElementById('noResults');
    
    tbody.innerHTML = '';
    
    if (filteredData.length === 0) {
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    filteredData.forEach((embassy, index) => {
        const row = createTableRow(embassy, index + 1);
        tbody.appendChild(row);
    });
}

function updateTableHeaders() {
    const thead = document.querySelector('#dataTable thead tr');
    
    let headerHTML = `
        <th>Rank</th>
        <th>Location/City</th>
        <th>Country</th>
    `;
    
    // Add columns for visible months only
    visibleMonths.forEach(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        const monthName = getMonthName(month);
        const shortDisplay = monthName.substring(0, 3) + " '" + year.toString().substring(2);
        
        headerHTML += `<th class="month-col" data-month="${monthKey}">${shortDisplay}</th>`;
    });
    
    // Add total column
    const totalColumnName = getTotalColumnName();
    headerHTML += `<th class="total-col">${totalColumnName}</th>`;
    
    thead.innerHTML = headerHTML;
}

function getTotalColumnName() {
    if (visibleMonths.length === 1) {
        const [year, month] = visibleMonths[0].split('-').map(Number);
        const monthName = getMonthName(month);
        return `${monthName} ${year}`;
    } else if (visibleMonths.length > 1) {
        const [startYear, startMonth] = visibleMonths[0].split('-').map(Number);
        const [endYear, endMonth] = visibleMonths[visibleMonths.length - 1].split('-').map(Number);
        const startMonthName = getMonthName(startMonth);
        const endMonthName = getMonthName(endMonth);
        
        if (startYear === endYear) {
            return `${startMonthName}-${endMonthName} ${startYear}`;
        } else {
            return `${startMonthName} ${startYear} - ${endMonthName} ${endYear}`;
        }
    }
    return 'Total';
}

function createTableRow(embassy, rank) {
    const row = document.createElement('tr');
    
    let monthCells = '';
    visibleMonths.forEach(monthKey => {
        const value = embassy.monthlyData[monthKey] || 0;
        monthCells += `<td class="month-col" data-month="${monthKey}">${value}</td>`;
    });
    
    row.innerHTML = `
        <td>${rank}</td>
        <td>${embassy.embassy}</td>
        <td><a href="visa-information.html?country=${encodeURIComponent(embassy.country)}" 
               style="color: var(--primary, #1a3a52); text-decoration: none; font-weight: 500;"
               title="View visa information for ${embassy.country}">${embassy.country}</a></td>
        ${monthCells}
        <td class="total-col">${embassy.rangeTotal}</td>
    `;
    
    return row;
}

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm === '') {
        filteredData = [...embassyData];
    } else {
        filteredData = embassyData.filter(embassy => 
            embassy.embassy.toLowerCase().includes(searchTerm) ||
            embassy.country.toLowerCase().includes(searchTerm)
        );
    }
    
    renderTable();
}

function toggleMobileMenu() {
    const sideNav = document.getElementById('sideNav');
    sideNav.classList.toggle('active');
}

function handleDateRangeChange() {
    const startMonth = parseInt(document.getElementById('startMonth').value);
    const startYear = parseInt(document.getElementById('startYear').value);
    const endMonth = parseInt(document.getElementById('endMonth').value);
    const endYear = parseInt(document.getElementById('endYear').value);
    
    // Validate date range
    const startDate = new Date(startYear, startMonth - 1);
    const endDate = new Date(endYear, endMonth - 1);
    
    if (startDate > endDate) {
        alert('Start date must be before or equal to end date.');
        return;
    }
    
    currentDateRange = { startMonth, startYear, endMonth, endYear };
    
    // Update visible months based on new range
    updateVisibleMonths();
    
    // Recalculate totals and re-sort
    embassyData = embassyData.map(embassy => {
        const rangeTotal = calculateDateRangeTotal(embassy, currentDateRange);
        return { ...embassy, rangeTotal };
    }).sort((a, b) => b.rangeTotal - a.rangeTotal);
    
    // Reapply search filter
    handleSearch();
}

function resetDateRange() {
    // Reset to current year (January through December of current year)
    const currentYear = new Date().getFullYear();
    currentDateRange = {
        startMonth: 1,
        startYear: currentYear,
        endMonth: 12,
        endYear: currentYear
    };
    
    // Update UI selectors
    document.getElementById('startMonth').value = '1';
    document.getElementById('startYear').value = currentYear.toString();
    document.getElementById('endMonth').value = '12';
    document.getElementById('endYear').value = currentYear.toString();
    
    handleDateRangeChange();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    handleSearch();
}

function downloadCSV() {
    const headers = ['Rank', 'Location/City', 'Country'];
    
    // Add visible month headers
    visibleMonths.forEach(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        const monthName = getMonthName(month);
        headers.push(`${monthName} ${year}`);
    });
    
    headers.push(getTotalColumnName());
    
    const rows = filteredData.map((embassy, index) => {
        const row = [index + 1, embassy.embassy, embassy.country];
        
        visibleMonths.forEach(monthKey => {
            row.push(embassy.monthlyData[monthKey] || 0);
        });
        
        row.push(embassy.rangeTotal);
        return row;
    });
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const startMonthName = getMonthName(currentDateRange.startMonth);
    const endMonthName = getMonthName(currentDateRange.endMonth);
    const filename = `siv_location_data_${startMonthName}${currentDateRange.startYear}_to_${endMonthName}${currentDateRange.endYear}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('dataTable').style.display = 'table';
}

function showError(message) {
    document.getElementById('loadingIndicator').textContent = message;
    document.getElementById('loadingIndicator').style.color = '#d32f2f';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('clearSearch').addEventListener('click', clearSearch);
    document.getElementById('applyDateRange').addEventListener('click', handleDateRangeChange);
    document.getElementById('resetDateRange').addEventListener('click', resetDateRange);
    document.getElementById('downloadCSV').addEventListener('click', downloadCSV);
    document.getElementById('mobileMenuToggle').addEventListener('click', toggleMobileMenu);
});