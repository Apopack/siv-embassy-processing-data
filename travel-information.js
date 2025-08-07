// Travel Information Application

class TravelInformationApp {
    constructor() {
        this.travelData = [];
        this.filteredData = [];
        this.comparisonDestinations = [];
        this.maxComparisons = 5;
        this.currentSort = 'country';
        
        this.init();
    }

    async init() {
        await this.loadTravelData();
        this.setupEventListeners();
        this.renderTravelCards();
    }

    async loadTravelData() {
        // Check for travel data from admin panel first
        const adminData = localStorage.getItem('databaseTravelData');
        if (adminData) {
            try {
                const data = JSON.parse(adminData);
                this.travelData = Array.from(data.values ? data.values() : data);
                console.log('Loading travel data from admin portal:', this.travelData.length, 'destinations');
                this.filteredData = [...this.travelData];
                
                if (this.travelData.length === 0) {
                    this.showEmptyState();
                    return;
                }
                return;
            } catch (error) {
                console.error('Error parsing admin travel data:', error);
            }
        }

        // No static travel data - will show empty state until admin adds data
        this.travelData = [];
        
        this.filteredData = [...this.travelData];
    }

    showEmptyState() {
        const grid = document.getElementById('travelGrid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="travel-empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #6B7280;">
                <div style="font-size: 64px; margin-bottom: 20px;">✈️</div>
                <h3 style="color: #374151; margin-bottom: 10px;">No Travel Information Available</h3>
                <p style="margin-bottom: 20px;">Travel information will appear here once added through the Admin Portal.</p>
                <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px auto; text-align: left; max-width: 600px;">
                    <h4 style="color: #374151; margin: 0 0 10px;">How to Add Travel Information:</h4>
                    <ol style="color: #6B7280; margin: 0; padding-left: 20px;">
                        <li>Go to <strong>Admin Portal</strong> in the navigation</li>
                        <li>Search for a country using the search box</li>
                        <li>Select a country and fill in travel costs and details</li>
                        <li>Save the information</li>
                        <li>Data will automatically appear on this page</li>
                    </ol>
                </div>
                <a href="admin.html" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-right: 12px;">Go to Admin Portal</a>
                <button onclick="location.reload()" style="display: inline-block; background: #6B7280; color: white; padding: 12px 24px; border-radius: 6px; border: none; font-weight: 500; cursor: pointer;">Refresh Page</button>
            </div>
        `;
    }

    setupEventListeners() {
        // Mobile menu toggle
        document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
            document.getElementById('sideNav').classList.toggle('active');
        });

        // Search functionality
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Sort functionality
        document.getElementById('sortSelect')?.addEventListener('change', (e) => {
            this.handleSort(e.target.value);
        });

        // Comparison button
        document.getElementById('compareBtn')?.addEventListener('click', () => {
            this.openComparisonPanel();
        });

        // Calculator button
        document.getElementById('calculatorBtn')?.addEventListener('click', () => {
            this.openCalculator();
        });

        // Add destination button
        document.getElementById('addDestinationBtn')?.addEventListener('click', () => {
            this.openDestinationSelection();
        });

        // Comparison search
        document.getElementById('comparisonSearch')?.addEventListener('input', (e) => {
            this.filterDestinationSelection(e.target.value);
        });

        // Close modals with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeComparisonPanel();
                this.closeDestinationSelection();
                this.closeCalculator();
            }
        });
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredData = [...this.travelData];
        } else {
            this.filteredData = this.travelData.filter(travel => 
                travel.country.toLowerCase().includes(searchTerm) ||
                travel.city.toLowerCase().includes(searchTerm)
            );
        }
        
        this.applySort();
        this.renderTravelCards();
    }

    handleSort(sortType) {
        this.currentSort = sortType;
        this.applySort();
        this.renderTravelCards();
    }

    applySort() {
        switch (this.currentSort) {
            case 'cost-low':
                this.filteredData.sort((a, b) => this.getTotalCost(a, 'mid') - this.getTotalCost(b, 'mid'));
                break;
            case 'cost-high':
                this.filteredData.sort((a, b) => this.getTotalCost(b, 'mid') - this.getTotalCost(a, 'mid'));
                break;
            case 'distance':
                this.filteredData.sort((a, b) => a.distanceValue - b.distanceValue);
                break;
            default:
                this.filteredData.sort((a, b) => a.country.localeCompare(b.country));
        }
    }

    getTotalCost(travel, accommodationType = 'mid') {
        // Calculate 7-day total cost
        const accommodation = parseInt(travel.accommodation[accommodationType].split('-')[1].replace('$', ''));
        const dailyFood = travel.dailyFoodValue;
        const transport = travel.transportValue;
        const flight = travel.flightCostValue;
        const medical = travel.medicalExamValue;
        
        return flight + medical + (accommodation + dailyFood + transport) * 7;
    }

    renderTravelCards() {
        const grid = document.getElementById('travelGrid');
        
        if (this.filteredData.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--gray-500);">
                    <p style="font-size: 16px;">No travel information found matching your criteria.</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.filteredData.map(travel => {
            const totalCost = this.getTotalCost(travel);
            
            return `
                <div class="travel-card">
                    <div class="travel-card-header">
                        <h3 class="destination-name">${travel.city}</h3>
                        <p class="destination-country">${travel.country}</p>
                        <div class="destination-flag">${travel.flag}</div>
                    </div>
                    
                    <div class="travel-card-body">
                        <div class="cost-summary">
                            <div class="cost-item">
                                <span class="cost-label">Flight (round trip)</span>
                                <span class="cost-value">${travel.flightCost}</span>
                            </div>
                            <div class="cost-item">
                                <span class="cost-label">Accommodation (per night)</span>
                                <span class="cost-value">${travel.accommodation.mid}</span>
                            </div>
                            <div class="cost-item">
                                <span class="cost-label">Daily expenses</span>
                                <span class="cost-value">$${travel.dailyFoodValue + travel.transportValue}</span>
                            </div>
                            <div class="cost-item">
                                <span class="cost-label">Medical exam</span>
                                <span class="cost-value">$${travel.medicalExamValue}</span>
                            </div>
                            <div class="cost-item">
                                <span class="cost-label">Total (7 days)</span>
                                <span class="cost-value total-cost">$${totalCost.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div class="travel-details">
                            <div class="detail-item">
                                <span class="detail-icon">📍</span>
                                <span class="detail-text">${travel.distance} from Kabul</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-icon">💱</span>
                                <span class="detail-text">${travel.currency} currency</span>
                            </div>
                        </div>
                        
                        <div class="travel-actions">
                            <button class="travel-action-btn" onclick="travelApp.addToComparison('${travel.country}')">
                                Compare
                            </button>
                            <button class="travel-action-btn primary" onclick="travelApp.openCalculatorFor('${travel.country}')">
                                Calculate Cost
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Comparison functionality
    openComparisonPanel() {
        const panel = document.getElementById('comparisonPanel');
        const btn = document.getElementById('compareBtn');
        
        panel.classList.add('active');
        btn.classList.add('active');
        
        this.updateComparisonView();
    }

    closeComparisonPanel() {
        const panel = document.getElementById('comparisonPanel');
        const btn = document.getElementById('compareBtn');
        
        panel.classList.remove('active');
        btn.classList.remove('active');
    }

    openDestinationSelection() {
        if (this.comparisonDestinations.length >= this.maxComparisons) {
            alert(`You can only compare up to ${this.maxComparisons} destinations at once.`);
            return;
        }
        
        const modal = document.getElementById('destinationSelectionModal');
        modal.classList.add('active');
        this.renderDestinationSelectionList();
    }

    closeDestinationSelection() {
        const modal = document.getElementById('destinationSelectionModal');
        modal.classList.remove('active');
    }

    renderDestinationSelectionList(filter = '') {
        const list = document.getElementById('destinationSelectionList');
        const destinations = filter 
            ? this.travelData.filter(t => 
                t.country.toLowerCase().includes(filter.toLowerCase()) ||
                t.city.toLowerCase().includes(filter.toLowerCase())
              )
            : this.travelData;
        
        list.innerHTML = destinations.map(travel => {
            const isSelected = this.comparisonDestinations.some(d => d.country === travel.country);
            const totalCost = this.getTotalCost(travel);
            
            return `
                <div class="destination-selection-item ${isSelected ? 'selected' : ''}" 
                     ${!isSelected ? `onclick="travelApp.addToComparison('${travel.country}')"` : ''}>
                    <span style="font-size: 24px;">${travel.flag}</span>
                    <div>
                        <h4 style="margin: 0 0 4px; font-size: 15px;">${travel.country}</h4>
                        <p style="margin: 0; font-size: 13px; color: var(--gray-600);">${travel.city} • $${totalCost.toLocaleString()} (7 days)</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    filterDestinationSelection(query) {
        this.renderDestinationSelectionList(query);
    }

    addToComparison(countryName) {
        const travel = this.travelData.find(t => t.country === countryName);
        if (!travel || this.comparisonDestinations.length >= this.maxComparisons) return;
        
        if (!this.comparisonDestinations.some(d => d.country === countryName)) {
            this.comparisonDestinations.push(travel);
            this.closeDestinationSelection();
            this.updateComparisonView();
        }
    }

    removeFromComparison(countryName) {
        this.comparisonDestinations = this.comparisonDestinations.filter(d => d.country !== countryName);
        this.updateComparisonView();
    }

    updateComparisonView() {
        this.renderSelectedDestinations();
        this.renderComparisonTable();
    }

    renderSelectedDestinations() {
        const container = document.getElementById('selectedDestinations');
        
        container.innerHTML = this.comparisonDestinations.map(travel => `
            <div class="destination-chip">
                <span>${travel.flag}</span>
                <span>${travel.country}</span>
                <button class="remove-chip" onclick="travelApp.removeFromComparison('${travel.country}')">&times;</button>
            </div>
        `).join('');
        
        // Show/hide add button
        const addBtn = document.getElementById('addDestinationBtn');
        if (addBtn) {
            addBtn.style.display = this.comparisonDestinations.length >= this.maxComparisons ? 'none' : 'flex';
        }
    }

    renderComparisonTable() {
        const content = document.getElementById('comparisonContent');
        
        if (this.comparisonDestinations.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 64px; color: var(--gray-500);">
                    <p style="font-size: 16px; margin-bottom: 8px;">No destinations selected for comparison</p>
                    <p style="font-size: 14px;">Click "Add Destination" to get started</p>
                </div>
            `;
            return;
        }
        
        const metrics = [
            { key: 'flight', label: 'Flight Cost' },
            { key: 'accommodation', label: 'Accommodation (per night)' },
            { key: 'dailyExpenses', label: 'Daily Expenses' },
            { key: 'medicalExam', label: 'Medical Exam' },
            { key: 'distance', label: 'Distance from Kabul' },
            { key: 'totalCost', label: 'Total Cost (7 days)' }
        ];
        
        content.innerHTML = `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        ${this.comparisonDestinations.map(travel => `
                            <th style="text-align: center;">
                                <div>${travel.flag}</div>
                                <div style="font-weight: 700; margin-top: 8px;">${travel.country}</div>
                                <div style="font-size: 12px; color: var(--gray-600);">${travel.city}</div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${metrics.map(metric => `
                        <tr>
                            <td class="metric-label">${metric.label}</td>
                            ${this.comparisonDestinations.map(travel => `
                                <td style="text-align: center;">${this.getMetricValue(travel, metric.key)}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    getMetricValue(travel, key) {
        switch(key) {
            case 'flight':
                return travel.flightCost;
            case 'accommodation':
                return travel.accommodation.mid;
            case 'dailyExpenses':
                return `$${travel.dailyFoodValue + travel.transportValue}`;
            case 'medicalExam':
                return `$${travel.medicalExamValue}`;
            case 'distance':
                return travel.distance;
            case 'totalCost':
                return `$${this.getTotalCost(travel).toLocaleString()}`;
            default:
                return 'N/A';
        }
    }

    // Calculator functionality
    openCalculator() {
        const modal = document.getElementById('calculatorModal');
        modal.classList.add('active');
        this.populateCalculatorDestinations();
    }

    openCalculatorFor(countryName) {
        this.openCalculator();
        setTimeout(() => {
            document.getElementById('calcDestination').value = countryName;
        }, 100);
    }

    closeCalculator() {
        const modal = document.getElementById('calculatorModal');
        modal.classList.remove('active');
        document.getElementById('calculatorResult').classList.remove('active');
    }

    populateCalculatorDestinations() {
        const select = document.getElementById('calcDestination');
        select.innerHTML = '<option value="">Select destination...</option>' +
            this.travelData.map(travel => 
                `<option value="${travel.country}">${travel.country} (${travel.city})</option>`
            ).join('');
    }

    calculateCost() {
        const destination = document.getElementById('calcDestination').value;
        const travelers = parseInt(document.getElementById('calcTravelers').value) || 1;
        const days = parseInt(document.getElementById('calcDays').value) || 7;
        const accommodationType = document.getElementById('calcAccommodation').value;
        
        if (!destination) {
            alert('Please select a destination');
            return;
        }
        
        const travel = this.travelData.find(t => t.country === destination);
        if (!travel) return;
        
        // Calculate costs
        const flightCost = travel.flightCostValue * travelers;
        const accommodationCost = parseInt(travel.accommodation[accommodationType].split('-')[1].replace('$', '')) * days;
        const foodCost = travel.dailyFoodValue * days * travelers;
        const transportCost = travel.transportValue * days * travelers;
        const medicalCost = travel.medicalExamValue * travelers;
        
        const totalCost = flightCost + accommodationCost + foodCost + transportCost + medicalCost;
        
        // Display results
        const resultDiv = document.getElementById('calculatorResult');
        resultDiv.innerHTML = `
            <div class="result-header">${travel.country} - ${travel.city}</div>
            <div class="result-breakdown">
                <div class="result-item">
                    <span>Flight costs (${travelers} traveler${travelers > 1 ? 's' : ''})</span>
                    <span>$${flightCost.toLocaleString()}</span>
                </div>
                <div class="result-item">
                    <span>Accommodation (${days} nights, ${accommodationType})</span>
                    <span>$${accommodationCost.toLocaleString()}</span>
                </div>
                <div class="result-item">
                    <span>Food (${days} days × ${travelers} person${travelers > 1 ? 's' : ''})</span>
                    <span>$${foodCost.toLocaleString()}</span>
                </div>
                <div class="result-item">
                    <span>Local transport (${days} days × ${travelers} person${travelers > 1 ? 's' : ''})</span>
                    <span>$${transportCost.toLocaleString()}</span>
                </div>
                <div class="result-item">
                    <span>Medical exams (${travelers} person${travelers > 1 ? 's' : ''})</span>
                    <span>$${medicalCost.toLocaleString()}</span>
                </div>
                <div class="result-item result-total">
                    <span><strong>Total Estimated Cost</strong></span>
                    <span><strong>$${totalCost.toLocaleString()}</strong></span>
                </div>
            </div>
            <p style="font-size: 13px; color: var(--gray-600); margin-top: 16px;">
                * Costs are estimates and may vary based on season, booking timing, and personal preferences.
            </p>
        `;
        resultDiv.classList.add('active');
    }
}

// Initialize app
const travelApp = new TravelInformationApp();