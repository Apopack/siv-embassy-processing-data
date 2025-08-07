// Database View JavaScript - ServiceNow Native View Style

class DatabaseView {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.selectedRecords = new Set();
        this.currentPage = 1;
        this.recordsPerPage = 50;
        this.sortField = null;
        this.sortDirection = 'asc';
        this.filters = {};
        this.editingRecord = null;
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.applyFilters();
        this.renderTable();
    }

    async loadData() {
        // Load sample data and any saved data from localStorage
        const sampleData = [
            {
                id: 1,
                country: "Pakistan",
                flag: "🇵🇰",
                embassy: "Islamabad",
                visaRequired: "yes",
                visaType: "Visitor Visa (Tourist/Family Visit)",
                visaCost: "US$50–100",
                validity: "3 months (90 days)",
                processingTime: "3-5 business days",
                applicationMethod: "online",
                officialLink: "https://visa.nadra.gov.pk",
                extensionPossible: "yes",
                extensionDuration: "Up to additional 90 days",
                extensionCost: "Varies (portal fee; approx US$20)",
                sourceName: "Pakistan Online Visa",
                sourceType: "government",
                lastUpdated: "2025-01-15",
                directFlights: "yes",
                airlines: "PIA, Turkish Airlines, Emirates",
                flightDuration: "8-12 hours",
                mainAirport: "Islamabad International Airport",
                airportCode: "ISB",
                cityDistance: "25km",
                safetyLevel: "caution",
                travelNotes: "Check current security advisories. Visa required for all Afghan nationals."
            },
            {
                id: 2,
                country: "Qatar",
                flag: "🇶🇦",
                embassy: "Doha",
                visaRequired: "yes",
                visaType: "Hayya Entry Permit",
                visaCost: "US$27",
                validity: "30 days",
                processingTime: "Same day",
                applicationMethod: "online",
                officialLink: "https://hayya.qa",
                extensionPossible: "no",
                extensionDuration: "",
                extensionCost: "",
                sourceName: "Hayya Portal",
                sourceType: "government",
                lastUpdated: "2025-01-15",
                directFlights: "yes",
                airlines: "Qatar Airways",
                flightDuration: "6-8 hours",
                mainAirport: "Hamad International Airport",
                airportCode: "DOH",
                cityDistance: "15km",
                safetyLevel: "safe",
                travelNotes: "Modern facilities. Entry permit required."
            }
        ];

        // Load additional countries from SIV data
        try {
            const response = await fetch('data/embassy-siv-data.json');
            const sivData = await response.json();
            
            sivData.embassies.forEach((embassy, index) => {
                if (!sampleData.find(d => d.country === embassy.country)) {
                    sampleData.push({
                        id: sampleData.length + 1,
                        country: embassy.country,
                        flag: this.getCountryFlag(embassy.country),
                        embassy: embassy.embassy,
                        visaRequired: "unknown",
                        visaType: "",
                        visaCost: "",
                        validity: "",
                        processingTime: "",
                        applicationMethod: "embassy",
                        officialLink: "",
                        extensionPossible: "unknown",
                        extensionDuration: "",
                        extensionCost: "",
                        sourceName: "",
                        sourceType: "embassy",
                        lastUpdated: new Date().toISOString().split('T')[0],
                        directFlights: "",
                        airlines: "",
                        flightDuration: "",
                        mainAirport: "",
                        airportCode: "",
                        cityDistance: "",
                        safetyLevel: "",
                        travelNotes: ""
                    });
                }
            });
        } catch (error) {
            console.error('Error loading SIV data:', error);
        }

        // Load any saved data from localStorage
        const savedData = localStorage.getItem('databaseViewData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Merge saved data with sample data
            parsedData.forEach(saved => {
                const existingIndex = sampleData.findIndex(d => d.id === saved.id);
                if (existingIndex !== -1) {
                    sampleData[existingIndex] = saved;
                } else {
                    sampleData.push(saved);
                }
            });
        }

        this.data = sampleData;
        this.filteredData = [...this.data];
    }

    getCountryFlag(country) {
        const flagMap = {
            'Pakistan': '🇵🇰', 'Qatar': '🇶🇦', 'Albania': '🇦🇱', 'Turkey': '🇹🇷',
            'Germany': '🇩🇪', 'Canada': '🇨🇦', 'Philippines': '🇵🇭', 'UAE': '🇦🇪',
            'Iraq': '🇮🇶', 'Rwanda': '🇷🇼', 'United Arab Emirates': '🇦🇪',
            'United States': '🇺🇸', 'India': '🇮🇳', 'Iran': '🇮🇷', 'Afghanistan': '🇦🇫',
            'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Belgium': '🇧🇪', 'Brazil': '🇧🇷',
            'China': '🇨🇳', 'Denmark': '🇩🇰', 'Egypt': '🇪🇬', 'France': '🇫🇷'
        };
        return flagMap[country] || '🏳️';
    }

    setupEventListeners() {
        // Mobile menu toggle
        document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
            document.getElementById('sideNav').classList.toggle('active');
        });

        // Search
        document.getElementById('databaseSearch').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Records per page
        document.getElementById('recordsPerPage').addEventListener('change', (e) => {
            this.recordsPerPage = e.target.value === 'all' ? 999999 : parseInt(e.target.value);
            this.currentPage = 1;
            this.renderTable();
        });

        // Filter panel toggle
        document.getElementById('filterBtn').addEventListener('click', () => {
            this.toggleFilterPanel();
        });

        document.getElementById('closeFilterBtn').addEventListener('click', () => {
            this.hideFilterPanel();
        });

        // Filter controls
        document.getElementById('applyFiltersBtn').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            this.clearFilters();
        });

        // Header actions
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshData();
        });

        document.getElementById('addRecordBtn').addEventListener('click', () => {
            this.showAddModal();
        });

        document.getElementById('saveAllBtn').addEventListener('click', () => {
            this.saveAllData();
        });

        // Select all checkbox
        document.getElementById('selectAll').addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        // Bulk actions
        document.getElementById('bulkEditBtn').addEventListener('click', () => {
            this.bulkEdit();
        });

        document.getElementById('bulkDeleteBtn').addEventListener('click', () => {
            this.bulkDelete();
        });

        document.getElementById('exportSelectedBtn').addEventListener('click', () => {
            this.exportSelected();
        });

        // Modal controls
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('saveEditBtn').addEventListener('click', () => {
            this.saveRecord();
        });

        // Sortable headers
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                this.handleSort(header.dataset.field);
            });
        });

        // Pagination controls
        document.getElementById('firstPageBtn').addEventListener('click', () => {
            this.goToPage(1);
        });

        document.getElementById('prevPageBtn').addEventListener('click', () => {
            this.goToPage(this.currentPage - 1);
        });

        document.getElementById('nextPageBtn').addEventListener('click', () => {
            this.goToPage(this.currentPage + 1);
        });

        document.getElementById('lastPageBtn').addEventListener('click', () => {
            const totalPages = Math.ceil(this.filteredData.length / this.recordsPerPage);
            this.goToPage(totalPages);
        });
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.filteredData = [...this.data];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredData = this.data.filter(record => 
                Object.values(record).some(value => 
                    value && value.toString().toLowerCase().includes(searchTerm)
                )
            );
        }
        this.currentPage = 1;
        this.renderTable();
    }

    toggleFilterPanel() {
        const panel = document.getElementById('filterPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    hideFilterPanel() {
        document.getElementById('filterPanel').style.display = 'none';
    }

    applyFilters() {
        this.filters = {
            visaRequired: document.getElementById('filterVisaRequired').value,
            applicationMethod: document.getElementById('filterApplicationMethod').value,
            safetyLevel: document.getElementById('filterSafetyLevel').value
        };

        this.filteredData = this.data.filter(record => {
            return Object.entries(this.filters).every(([field, value]) => {
                return !value || record[field] === value;
            });
        });

        this.currentPage = 1;
        this.renderTable();
        this.hideFilterPanel();
    }

    clearFilters() {
        document.getElementById('filterVisaRequired').value = '';
        document.getElementById('filterApplicationMethod').value = '';
        document.getElementById('filterSafetyLevel').value = '';
        this.filters = {};
        this.filteredData = [...this.data];
        this.currentPage = 1;
        this.renderTable();
    }

    handleSort(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }

        this.filteredData.sort((a, b) => {
            let aVal = a[field] || '';
            let bVal = b[field] || '';

            if (field === 'lastUpdated') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            if (this.sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        // Update sort indicators
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sorted-asc', 'sorted-desc');
            if (header.dataset.field === field) {
                header.classList.add(`sorted-${this.sortDirection}`);
            }
        });

        this.renderTable();
    }

    renderTable() {
        const tbody = document.getElementById('databaseTableBody');
        const startIndex = (this.currentPage - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        tbody.innerHTML = pageData.map(record => `
            <tr ${this.selectedRecords.has(record.id) ? 'class="selected"' : ''}>
                <td class="select-col">
                    <input type="checkbox" class="select-checkbox record-checkbox" 
                           data-id="${record.id}" 
                           ${this.selectedRecords.has(record.id) ? 'checked' : ''}>
                </td>
                <td class="country-col">${record.country}</td>
                <td class="flag-col">${record.flag}</td>
                <td class="embassy-col">${record.embassy}</td>
                <td class="visa-required-col">
                    <span class="status-badge status-${record.visaRequired}">
                        ${record.visaRequired || 'Unknown'}
                    </span>
                </td>
                <td class="visa-type-col" title="${record.visaType}">${this.truncateText(record.visaType, 30)}</td>
                <td class="cost-col">${record.visaCost}</td>
                <td class="validity-col">${record.validity}</td>
                <td class="processing-time-col">${record.processingTime}</td>
                <td class="application-method-col">
                    <span class="status-badge method-${record.applicationMethod}">
                        ${record.applicationMethod || 'Unknown'}
                    </span>
                </td>
                <td class="safety-level-col">
                    <span class="status-badge safety-${record.safetyLevel}">
                        ${record.safetyLevel || 'Unknown'}
                    </span>
                </td>
                <td class="last-updated-col">${this.formatDate(record.lastUpdated)}</td>
                <td class="actions-col">
                    <button class="action-btn edit-btn" onclick="databaseView.editRecord(${record.id})" title="Edit">
                        ✏️
                    </button>
                    <button class="action-btn delete-btn" onclick="databaseView.deleteRecord(${record.id})" title="Delete">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');

        // Add event listeners to checkboxes
        document.querySelectorAll('.record-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleRecordSelection(parseInt(e.target.dataset.id), e.target.checked);
            });
        });

        this.updatePagination();
        this.updateBulkActions();
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    toggleSelectAll(checked) {
        const startIndex = (this.currentPage - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        pageData.forEach(record => {
            if (checked) {
                this.selectedRecords.add(record.id);
            } else {
                this.selectedRecords.delete(record.id);
            }
        });

        this.renderTable();
    }

    toggleRecordSelection(id, checked) {
        if (checked) {
            this.selectedRecords.add(id);
        } else {
            this.selectedRecords.delete(id);
        }

        this.updateBulkActions();
    }

    updateBulkActions() {
        const panel = document.getElementById('bulkActionsPanel');
        const text = document.getElementById('bulkActionsText');
        const count = this.selectedRecords.size;

        if (count > 0) {
            text.textContent = `${count} record${count === 1 ? '' : 's'} selected`;
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }

        // Update select all checkbox
        const selectAll = document.getElementById('selectAll');
        const startIndex = (this.currentPage - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);
        const selectedInPage = pageData.filter(record => this.selectedRecords.has(record.id)).length;

        selectAll.checked = selectedInPage === pageData.length && pageData.length > 0;
        selectAll.indeterminate = selectedInPage > 0 && selectedInPage < pageData.length;
    }

    updatePagination() {
        const totalRecords = this.filteredData.length;
        const totalPages = Math.ceil(totalRecords / this.recordsPerPage);
        const startRecord = (this.currentPage - 1) * this.recordsPerPage + 1;
        const endRecord = Math.min(this.currentPage * this.recordsPerPage, totalRecords);

        // Update pagination info
        document.getElementById('paginationInfo').textContent = 
            `Showing ${startRecord}-${endRecord} of ${totalRecords} records`;

        // Update pagination buttons
        document.getElementById('firstPageBtn').disabled = this.currentPage === 1;
        document.getElementById('prevPageBtn').disabled = this.currentPage === 1;
        document.getElementById('nextPageBtn').disabled = this.currentPage === totalPages;
        document.getElementById('lastPageBtn').disabled = this.currentPage === totalPages;

        // Update page numbers
        const pagesContainer = document.getElementById('paginationPages');
        pagesContainer.innerHTML = '';

        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => this.goToPage(i);
            pagesContainer.appendChild(pageBtn);
        }
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredData.length / this.recordsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderTable();
        }
    }

    editRecord(id) {
        const record = this.data.find(r => r.id === id);
        if (!record) return;

        this.editingRecord = record;
        this.showEditModal(record);
    }

    showEditModal(record) {
        const modal = document.getElementById('editModal');
        const title = document.getElementById('modalTitle');
        const body = document.getElementById('modalBody');

        title.textContent = `Edit ${record.country} Record`;

        body.innerHTML = `
            <div class="modal-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Country</label>
                        <input type="text" id="editCountry" class="form-control" value="${record.country}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Embassy</label>
                        <input type="text" id="editEmbassy" class="form-control" value="${record.embassy}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Visa Required</label>
                        <select id="editVisaRequired" class="form-control">
                            <option value="">-- Select --</option>
                            <option value="yes" ${record.visaRequired === 'yes' ? 'selected' : ''}>Yes</option>
                            <option value="no" ${record.visaRequired === 'no' ? 'selected' : ''}>No</option>
                            <option value="on-arrival" ${record.visaRequired === 'on-arrival' ? 'selected' : ''}>Visa on Arrival</option>
                            <option value="unknown" ${record.visaRequired === 'unknown' ? 'selected' : ''}>Unknown</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Application Method</label>
                        <select id="editApplicationMethod" class="form-control">
                            <option value="">-- Select --</option>
                            <option value="online" ${record.applicationMethod === 'online' ? 'selected' : ''}>Online</option>
                            <option value="embassy" ${record.applicationMethod === 'embassy' ? 'selected' : ''}>Embassy</option>
                            <option value="both" ${record.applicationMethod === 'both' ? 'selected' : ''}>Both</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Visa Type</label>
                        <input type="text" id="editVisaType" class="form-control" value="${record.visaType || ''}">
                    </div>
                    <div class="form-group">
                        <label>Cost</label>
                        <input type="text" id="editVisaCost" class="form-control" value="${record.visaCost || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Validity</label>
                        <input type="text" id="editValidity" class="form-control" value="${record.validity || ''}">
                    </div>
                    <div class="form-group">
                        <label>Processing Time</label>
                        <input type="text" id="editProcessingTime" class="form-control" value="${record.processingTime || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Safety Level</label>
                        <select id="editSafetyLevel" class="form-control">
                            <option value="">-- Select --</option>
                            <option value="safe" ${record.safetyLevel === 'safe' ? 'selected' : ''}>Safe</option>
                            <option value="caution" ${record.safetyLevel === 'caution' ? 'selected' : ''}>Exercise Caution</option>
                            <option value="warning" ${record.safetyLevel === 'warning' ? 'selected' : ''}>Travel Warning</option>
                            <option value="donottravel" ${record.safetyLevel === 'donottravel' ? 'selected' : ''}>Do Not Travel</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Official Link</label>
                        <input type="url" id="editOfficialLink" class="form-control" value="${record.officialLink || ''}">
                    </div>
                </div>
                <div class="form-group full-width">
                    <label>Travel Notes</label>
                    <textarea id="editTravelNotes" class="form-control" rows="3">${record.travelNotes || ''}</textarea>
                </div>
            </div>
        `;

        modal.classList.add('show');
    }

    showAddModal() {
        this.editingRecord = null;
        const modal = document.getElementById('editModal');
        const title = document.getElementById('modalTitle');
        const body = document.getElementById('modalBody');

        title.textContent = 'Add New Record';

        body.innerHTML = `
            <div class="modal-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Country *</label>
                        <input type="text" id="editCountry" class="form-control" placeholder="Enter country name">
                    </div>
                    <div class="form-group">
                        <label>Embassy *</label>
                        <input type="text" id="editEmbassy" class="form-control" placeholder="Enter embassy location">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Visa Required</label>
                        <select id="editVisaRequired" class="form-control">
                            <option value="">-- Select --</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="on-arrival">Visa on Arrival</option>
                            <option value="unknown">Unknown</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Application Method</label>
                        <select id="editApplicationMethod" class="form-control">
                            <option value="">-- Select --</option>
                            <option value="online">Online</option>
                            <option value="embassy">Embassy</option>
                            <option value="both">Both</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Visa Type</label>
                        <input type="text" id="editVisaType" class="form-control" placeholder="e.g., Tourist Visa">
                    </div>
                    <div class="form-group">
                        <label>Cost</label>
                        <input type="text" id="editVisaCost" class="form-control" placeholder="e.g., US$50">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Validity</label>
                        <input type="text" id="editValidity" class="form-control" placeholder="e.g., 30 days">
                    </div>
                    <div class="form-group">
                        <label>Processing Time</label>
                        <input type="text" id="editProcessingTime" class="form-control" placeholder="e.g., 3-5 days">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Safety Level</label>
                        <select id="editSafetyLevel" class="form-control">
                            <option value="">-- Select --</option>
                            <option value="safe">Safe</option>
                            <option value="caution">Exercise Caution</option>
                            <option value="warning">Travel Warning</option>
                            <option value="donottravel">Do Not Travel</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Official Link</label>
                        <input type="url" id="editOfficialLink" class="form-control" placeholder="https://...">
                    </div>
                </div>
                <div class="form-group full-width">
                    <label>Travel Notes</label>
                    <textarea id="editTravelNotes" class="form-control" rows="3" placeholder="Enter travel notes and recommendations..."></textarea>
                </div>
            </div>
        `;

        modal.classList.add('show');
    }

    saveRecord() {
        const country = document.getElementById('editCountry').value.trim();
        const embassy = document.getElementById('editEmbassy').value.trim();

        if (!country || !embassy) {
            alert('Country and Embassy are required fields.');
            return;
        }

        const formData = {
            country: country,
            embassy: embassy,
            visaRequired: document.getElementById('editVisaRequired').value,
            applicationMethod: document.getElementById('editApplicationMethod').value,
            visaType: document.getElementById('editVisaType').value,
            visaCost: document.getElementById('editVisaCost').value,
            validity: document.getElementById('editValidity').value,
            processingTime: document.getElementById('editProcessingTime').value,
            safetyLevel: document.getElementById('editSafetyLevel').value,
            officialLink: document.getElementById('editOfficialLink').value,
            travelNotes: document.getElementById('editTravelNotes').value,
            lastUpdated: new Date().toISOString().split('T')[0]
        };

        if (this.editingRecord) {
            // Update existing record
            const index = this.data.findIndex(r => r.id === this.editingRecord.id);
            if (index !== -1) {
                this.data[index] = { ...this.data[index], ...formData };
            }
        } else {
            // Add new record
            const newRecord = {
                id: Math.max(...this.data.map(r => r.id)) + 1,
                flag: this.getCountryFlag(country),
                ...formData,
                // Set default values for missing fields
                extensionPossible: "unknown",
                extensionDuration: "",
                extensionCost: "",
                sourceName: "",
                sourceType: "embassy",
                directFlights: "",
                airlines: "",
                flightDuration: "",
                mainAirport: "",
                airportCode: "",
                cityDistance: ""
            };
            this.data.push(newRecord);
        }

        this.applyFilters();
        this.renderTable();
        this.hideModal();
        this.showNotification(this.editingRecord ? 'Record updated successfully!' : 'Record added successfully!');
    }

    deleteRecord(id) {
        const record = this.data.find(r => r.id === id);
        if (!record) return;

        if (confirm(`Are you sure you want to delete the record for ${record.country}?`)) {
            this.data = this.data.filter(r => r.id !== id);
            this.selectedRecords.delete(id);
            this.applyFilters();
            this.renderTable();
            this.showNotification('Record deleted successfully!');
        }
    }

    bulkEdit() {
        if (this.selectedRecords.size === 0) return;
        
        // For simplicity, just show a notification
        this.showNotification(`Bulk edit for ${this.selectedRecords.size} records - Feature coming soon!`);
    }

    bulkDelete() {
        if (this.selectedRecords.size === 0) return;

        if (confirm(`Are you sure you want to delete ${this.selectedRecords.size} selected records?`)) {
            this.data = this.data.filter(r => !this.selectedRecords.has(r.id));
            this.selectedRecords.clear();
            this.applyFilters();
            this.renderTable();
            this.showNotification('Selected records deleted successfully!');
        }
    }

    exportSelected() {
        if (this.selectedRecords.size === 0) return;

        const selectedData = this.data.filter(r => this.selectedRecords.has(r.id));
        const csv = this.convertToCSV(selectedData);
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `selected-records-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showNotification('Selected records exported successfully!');
    }

    convertToCSV(data) {
        const headers = [
            'Country', 'Embassy', 'Visa Required', 'Visa Type', 'Cost', 'Validity',
            'Processing Time', 'Application Method', 'Official Link', 'Safety Level',
            'Travel Notes', 'Last Updated'
        ];

        const rows = data.map(record => [
            record.country,
            record.embassy,
            record.visaRequired,
            record.visaType,
            record.visaCost,
            record.validity,
            record.processingTime,
            record.applicationMethod,
            record.officialLink,
            record.safetyLevel,
            record.travelNotes,
            record.lastUpdated
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');
    }

    hideModal() {
        document.getElementById('editModal').classList.remove('show');
        this.editingRecord = null;
    }

    refreshData() {
        this.loadData().then(() => {
            this.applyFilters();
            this.renderTable();
            this.showNotification('Data refreshed successfully!');
        });
    }

    saveAllData() {
        localStorage.setItem('databaseViewData', JSON.stringify(this.data));
        this.showNotification('All data saved successfully!');
    }

    showNotification(message) {
        const toast = document.getElementById('notificationToast');
        toast.querySelector('.notification-message').textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize database view
const databaseView = new DatabaseView();