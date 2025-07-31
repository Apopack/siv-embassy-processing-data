let allData = {};
let embassyData = [];
let filteredData = [];
let currentDateRange = { startMonth: 1, startYear: 2025, endMonth: 5, endYear: 2025 };
let availableMonths = [];
let visibleMonths = [];

async function loadData() {
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
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load embassy data. Please try again later.');
    }
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
        <th>Embassy/City</th>
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
        <td>${embassy.country}</td>
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

function handleMonthFilter() {
    const selectedMonth = document.getElementById('monthFilter').value;
    
    // Clear all month highlights
    document.querySelectorAll('.month-col').forEach(cell => {
        cell.classList.remove('highlighted-column');
    });
    
    // Highlight selected month if visible
    if (selectedMonth) {
        const currentYear = new Date().getFullYear();
        const monthKey = `${currentYear}-${selectedMonth.padStart(2, '0')}`;
        
        // Try current year and nearby years
        for (let year = currentYear - 2; year <= currentYear + 2; year++) {
            const testKey = `${year}-${selectedMonth.padStart(2, '0')}`;
            if (visibleMonths.includes(testKey)) {
                document.querySelectorAll(`[data-month="${testKey}"]`).forEach(cell => {
                    cell.classList.add('highlighted-column');
                });
            }
        }
    }
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
    // Reset to January 2025 through latest available data
    setDefaultDateRange();
    handleDateRangeChange();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    handleSearch();
}

function downloadCSV() {
    const headers = ['Rank', 'Embassy/City', 'Country'];
    
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
    const filename = `siv_embassy_data_${startMonthName}${currentDateRange.startYear}_to_${endMonthName}${currentDateRange.endYear}_${new Date().toISOString().split('T')[0]}.csv`;
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
    document.getElementById('monthFilter').addEventListener('change', handleMonthFilter);
    document.getElementById('applyDateRange').addEventListener('click', handleDateRangeChange);
    document.getElementById('resetDateRange').addEventListener('click', resetDateRange);
    document.getElementById('downloadCSV').addEventListener('click', downloadCSV);
});