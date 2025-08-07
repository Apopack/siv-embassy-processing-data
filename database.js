// Normalized Database Management System - Embassy-based tables

class DatabaseManager {
    constructor() {
        this.currentTable = 'visa';
        this.data = {
            visa: new Map(),
            travel: new Map(),
            siv: new Map(),
            history: [],
            users: new Map(),
            uploads: []
        };
        this.filteredData = [];
        this.selectedRecords = new Set();
        this.currentPage = 1;
        this.recordsPerPage = 50;
        this.sortField = null;
        this.sortDirection = 'asc';
        this.filters = {};
        
        this.init();
    }

    async init() {
        await this.loadAllData();
        this.setupEventListeners();
        this.renderCurrentTable();
    }

    async loadAllData() {
        // Load SIV issuances data first to get embassy list
        await this.loadSIVData();
        
        // Load visa information
        await this.loadVisaData();
        
        // Load travel information
        await this.loadTravelData();
        
        // Load change history
        this.loadChangeHistory();
        
        // Load user management data
        this.loadUserData();
        
        // Load file uploads data
        this.loadUploadsData();
    }

    async loadSIVData() {
        try {
            const response = await fetch('data/embassy-siv-data.json');
            const data = await response.json();
            
            data.embassies.forEach(embassy => {
                const months = Object.keys(embassy).filter(key => 
                    key.match(/^\d{4}-\d{2}$/) || key.includes('2024') || key.includes('2025')
                );
                
                const monthlyData = {};
                let total = 0;
                
                months.forEach(month => {
                    const value = parseInt(embassy[month]) || 0;
                    monthlyData[month] = value;
                    total += value;
                });
                
                this.data.siv.set(embassy.embassy, {
                    embassy: embassy.embassy,
                    country: embassy.country,
                    rank: embassy.rank || 0,
                    ...monthlyData,
                    total: total,
                    average: Math.round(total / months.length),
                    lastUpdated: new Date().toISOString().split('T')[0]
                });
            });
        } catch (error) {
            console.error('Error loading SIV data:', error);
        }
    }

    async loadVisaData() {
        // Sample visa data
        const visaData = [
            {
                embassy: "Islamabad",
                country: "Pakistan",
                visaRequired: "yes",
                visaType: "Visitor Visa (Tourist/Family Visit)",
                visaCost: "US$50–100",
                validity: "3 months (90 days)",
                processingTime: "3-5 business days",
                applicationMethod: "online",
                officialLink: "https://visa.nadra.gov.pk",
                extensionPossible: "yes",
                sourceName: "Pakistan Online Visa",
                lastUpdated: "2025-01-15"
            },
            {
                embassy: "Doha",
                country: "Qatar", 
                visaRequired: "yes",
                visaType: "Hayya Entry Permit",
                visaCost: "US$27",
                validity: "30 days",
                processingTime: "Same day",
                applicationMethod: "online",
                officialLink: "https://hayya.qa",
                extensionPossible: "no",
                sourceName: "Hayya Portal",
                lastUpdated: "2025-01-15"
            }
        ];

        // Initialize visa data for all embassies from SIV data
        this.data.siv.forEach((sivRecord, embassy) => {
            const existing = visaData.find(v => v.embassy === embassy);
            if (existing) {
                this.data.visa.set(embassy, existing);
            } else {
                this.data.visa.set(embassy, {
                    embassy: embassy,
                    country: sivRecord.country,
                    visaRequired: "",
                    visaType: "",
                    visaCost: "",
                    validity: "",
                    processingTime: "",
                    applicationMethod: "",
                    officialLink: "",
                    extensionPossible: "",
                    sourceName: "",
                    lastUpdated: new Date().toISOString().split('T')[0]
                });
            }
        });

        // Load any saved data
        const savedVisa = localStorage.getItem('databaseVisaData');
        if (savedVisa) {
            const parsedData = JSON.parse(savedVisa);
            parsedData.forEach(record => {
                this.data.visa.set(record.embassy, record);
            });
        }
    }

    async loadTravelData() {
        // Sample travel data
        const travelData = [
            {
                embassy: "Islamabad",
                country: "Pakistan",
                directFlights: "yes",
                airlines: "PIA, Turkish Airlines, Emirates",
                flightDuration: "8-12 hours",
                flightCost: "$400-800",
                mainAirport: "Islamabad International Airport",
                accommodationCost: "$20-50/night",
                dailyExpenses: "$15-30/day",
                medicalCost: "$100-200",
                safetyLevel: "caution",
                distanceFromAfghanistan: "500 km",
                lastUpdated: "2025-01-15"
            },
            {
                embassy: "Doha",
                country: "Qatar",
                directFlights: "yes",
                airlines: "Qatar Airways",
                flightDuration: "6-8 hours",
                flightCost: "$500-900",
                mainAirport: "Hamad International Airport",
                accommodationCost: "$80-150/night",
                dailyExpenses: "$50-100/day",
                medicalCost: "$150-300",
                safetyLevel: "safe",
                distanceFromAfghanistan: "800 km",
                lastUpdated: "2025-01-15"
            }
        ];

        // Initialize travel data for all embassies
        this.data.siv.forEach((sivRecord, embassy) => {
            const existing = travelData.find(t => t.embassy === embassy);
            if (existing) {
                this.data.travel.set(embassy, existing);
            } else {
                this.data.travel.set(embassy, {
                    embassy: embassy,
                    country: sivRecord.country,
                    directFlights: "",
                    airlines: "",
                    flightDuration: "",
                    flightCost: "",
                    mainAirport: "",
                    accommodationCost: "",
                    dailyExpenses: "",
                    medicalCost: "",
                    safetyLevel: "",
                    distanceFromAfghanistan: "",
                    lastUpdated: new Date().toISOString().split('T')[0]
                });
            }
        });

        // Load any saved data
        const savedTravel = localStorage.getItem('databaseTravelData');
        if (savedTravel) {
            const parsedData = JSON.parse(savedTravel);
            parsedData.forEach(record => {
                this.data.travel.set(record.embassy, record);
            });
        }
    }

    loadChangeHistory() {
        const saved = localStorage.getItem('databaseHistoryData');
        if (saved) {
            this.data.history = JSON.parse(saved);
        } else {
            // Sample history data
            this.data.history = [
                {
                    id: 1,
                    embassy: "Islamabad",
                    table: "visa",
                    action: "UPDATE",
                    field: "visaCost",
                    oldValue: "US$40-80",
                    newValue: "US$50-100",
                    user: "admin@example.com",
                    timestamp: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: 2,
                    embassy: "Doha", 
                    table: "travel",
                    action: "UPDATE",
                    field: "accommodationCost",
                    oldValue: "$70-130/night",
                    newValue: "$80-150/night",
                    user: "admin@example.com",
                    timestamp: new Date(Date.now() - 43200000).toISOString()
                }
            ];
        }
    }

    loadUserData() {
        const saved = localStorage.getItem('databaseUserData');
        if (saved) {
            const parsedData = JSON.parse(saved);
            parsedData.forEach(user => {
                this.data.users.set(user.id, user);
            });
        } else {
            // Sample user data
            const users = [
                {
                    id: 1,
                    username: "admin",
                    email: "admin@example.com",
                    role: "Administrator",
                    permissions: "Full Access",
                    status: "Active",
                    lastLogin: new Date(Date.now() - 3600000).toISOString(),
                    created: "2024-01-01"
                },
                {
                    id: 2,
                    username: "editor",
                    email: "editor@example.com", 
                    role: "Editor",
                    permissions: "Edit Visa & Travel Data",
                    status: "Active",
                    lastLogin: new Date(Date.now() - 7200000).toISOString(),
                    created: "2024-06-15"
                },
                {
                    id: 3,
                    username: "viewer",
                    email: "viewer@example.com",
                    role: "Viewer",
                    permissions: "View Only",
                    status: "Active",
                    lastLogin: new Date(Date.now() - 14400000).toISOString(),
                    created: "2024-12-01"
                }
            ];

            users.forEach(user => {
                this.data.users.set(user.id, user);
            });
        }
    }

    loadUploadsData() {
        const saved = localStorage.getItem('fileUploads');
        if (saved) {
            this.data.uploads = JSON.parse(saved);
        } else {
            // Sample uploads data
            this.data.uploads = [
                {
                    id: 1,
                    filename: 'siv-data-jan-2025.xlsx',
                    fileType: 'SIV Issuances',
                    fileSize: '245 KB',
                    status: 'success',
                    recordsProcessed: 45,
                    recordsUpdated: 43,
                    errors: 2,
                    uploadedBy: 'admin@example.com',
                    uploadDate: new Date(Date.now() - 86400000).toISOString(),
                    processingTime: '1.2s'
                },
                {
                    id: 2,
                    filename: 'embassy-monthly-dec-2024.xlsx',
                    fileType: 'SIV Issuances',
                    fileSize: '312 KB',
                    status: 'success',
                    recordsProcessed: 48,
                    recordsUpdated: 48,
                    errors: 0,
                    uploadedBy: 'admin@example.com',
                    uploadDate: new Date(Date.now() - 172800000).toISOString(),
                    processingTime: '2.1s'
                },
                {
                    id: 3,
                    filename: 'invalid-format.xlsx',
                    fileType: 'SIV Issuances',
                    fileSize: '156 KB',
                    status: 'error',
                    recordsProcessed: 0,
                    recordsUpdated: 0,
                    errors: 1,
                    uploadedBy: 'editor@example.com',
                    uploadDate: new Date(Date.now() - 259200000).toISOString(),
                    processingTime: '0.3s'
                }
            ];
        }
    }

    setupEventListeners() {
        // Mobile menu toggle
        document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
            document.getElementById('sideNav').classList.toggle('active');
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTable(btn.dataset.table);
            });
        });

        // Search
        document.getElementById('tableSearch').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Records per page
        document.getElementById('recordsPerPage').addEventListener('change', (e) => {
            this.recordsPerPage = e.target.value === 'all' ? 999999 : parseInt(e.target.value);
            this.currentPage = 1;
            this.renderCurrentTable();
        });

        // Header actions
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshAllData();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportCurrentTable();
        });

        document.getElementById('saveAllBtn').addEventListener('click', () => {
            this.saveAllData();
        });

        // Table actions
        document.getElementById('addRecordBtn').addEventListener('click', () => {
            this.showAddModal();
        });

        document.getElementById('filterBtn').addEventListener('click', () => {
            this.toggleFilterPanel();
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

        // Sort handlers will be added dynamically when tables are rendered
    }

    switchTable(tableName) {
        this.currentTable = tableName;
        this.selectedRecords.clear();
        this.currentPage = 1;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.table === tableName);
        });

        // Update table containers
        document.querySelectorAll('.table-container').forEach(container => {
            container.classList.toggle('active', container.id === `${tableName}Table`);
        });

        this.renderCurrentTable();
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.applyFilters();
            return;
        }

        const searchTerm = query.toLowerCase();
        let data = [];

        if (this.currentTable === 'history' || this.currentTable === 'uploads') {
            data = this.data[this.currentTable].filter(record =>
                Object.values(record).some(value =>
                    value && value.toString().toLowerCase().includes(searchTerm)
                )
            );
        } else {
            data = Array.from(this.data[this.currentTable].values()).filter(record =>
                Object.values(record).some(value =>
                    value && value.toString().toLowerCase().includes(searchTerm)
                )
            );
        }

        this.filteredData = data;
        this.currentPage = 1;
        this.renderCurrentTable();
    }

    applyFilters() {
        if (this.currentTable === 'history' || this.currentTable === 'uploads') {
            this.filteredData = [...this.data[this.currentTable]];
        } else {
            this.filteredData = Array.from(this.data[this.currentTable].values());
        }
        this.renderCurrentTable();
    }

    renderCurrentTable() {
        if (!this.filteredData.length) {
            this.applyFilters();
        }

        switch (this.currentTable) {
            case 'visa':
                this.renderVisaTable();
                break;
            case 'travel':
                this.renderTravelTable();
                break;
            case 'siv':
                this.renderSIVTable();
                break;
            case 'history':
                this.renderHistoryTable();
                break;
            case 'users':
                this.renderUsersTable();
                break;
            case 'uploads':
                this.renderUploadsTable();
                break;
        }

        this.updatePagination();
        this.updateBulkActions();
    }

    renderVisaTable() {
        const tbody = document.getElementById('visaTableBody');
        const startIndex = (this.currentPage - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        tbody.innerHTML = pageData.map(record => `
            <tr ${this.selectedRecords.has(record.embassy) ? 'class="selected"' : ''}>
                <td class="select-col">
                    <input type="checkbox" class="select-checkbox record-checkbox" 
                           data-id="${record.embassy}" 
                           ${this.selectedRecords.has(record.embassy) ? 'checked' : ''}>
                </td>
                <td class="embassy-col"><strong>${record.embassy}</strong></td>
                <td class="country-col">${record.country}</td>
                <td class="visa-required-col">
                    <span class="status-badge status-${record.visaRequired}">
                        ${record.visaRequired || 'Unknown'}
                    </span>
                </td>
                <td class="visa-type-col cell-truncate" title="${record.visaType || ''}">${record.visaType || '-'}</td>
                <td class="cost-col">${record.visaCost || '-'}</td>
                <td class="validity-col">${record.validity || '-'}</td>
                <td class="processing-time-col">${record.processingTime || '-'}</td>
                <td class="application-method-col">
                    <span class="status-badge method-${record.applicationMethod}">
                        ${record.applicationMethod || 'Unknown'}
                    </span>
                </td>
                <td class="official-link-col cell-truncate">
                    ${record.officialLink ? `<a href="${record.officialLink}" target="_blank" title="${record.officialLink}">Link</a>` : '-'}
                </td>
                <td class="extension-col">
                    <span class="status-badge status-${record.extensionPossible}">
                        ${record.extensionPossible || 'Unknown'}
                    </span>
                </td>
                <td class="source-col">${record.sourceName || '-'}</td>
                <td class="last-updated-col">${this.formatDate(record.lastUpdated)}</td>
                <td class="actions-col">
                    <button class="action-btn edit-btn" onclick="dbManager.editRecord('${record.embassy}')" title="Edit">
                        ✏️
                    </button>
                    <button class="action-btn delete-btn" onclick="dbManager.deleteRecord('${record.embassy}')" title="Delete">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');

        this.addCheckboxListeners();
    }

    renderTravelTable() {
        const tbody = document.getElementById('travelTableBody');
        const startIndex = (this.currentPage - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        tbody.innerHTML = pageData.map(record => `
            <tr ${this.selectedRecords.has(record.embassy) ? 'class="selected"' : ''}>
                <td class="select-col">
                    <input type="checkbox" class="select-checkbox record-checkbox" 
                           data-id="${record.embassy}" 
                           ${this.selectedRecords.has(record.embassy) ? 'checked' : ''}>
                </td>
                <td class="embassy-col"><strong>${record.embassy}</strong></td>
                <td class="country-col">${record.country}</td>
                <td class="direct-flights-col">
                    <span class="status-badge status-${record.directFlights}">
                        ${record.directFlights || 'Unknown'}
                    </span>
                </td>
                <td class="airlines-col cell-truncate" title="${record.airlines || ''}">${record.airlines || '-'}</td>
                <td class="flight-duration-col">${record.flightDuration || '-'}</td>
                <td class="flight-cost-col">${record.flightCost || '-'}</td>
                <td class="airport-col cell-truncate" title="${record.mainAirport || ''}">${record.mainAirport || '-'}</td>
                <td class="accommodation-cost-col">${record.accommodationCost || '-'}</td>
                <td class="daily-expenses-col">${record.dailyExpenses || '-'}</td>
                <td class="medical-cost-col">${record.medicalCost || '-'}</td>
                <td class="safety-level-col">
                    <span class="status-badge safety-${record.safetyLevel}">
                        ${record.safetyLevel || 'Unknown'}
                    </span>
                </td>
                <td class="distance-col">${record.distanceFromAfghanistan || '-'}</td>
                <td class="last-updated-col">${this.formatDate(record.lastUpdated)}</td>
                <td class="actions-col">
                    <button class="action-btn edit-btn" onclick="dbManager.editRecord('${record.embassy}')" title="Edit">
                        ✏️
                    </button>
                    <button class="action-btn delete-btn" onclick="dbManager.deleteRecord('${record.embassy}')" title="Delete">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');

        this.addCheckboxListeners();
    }

    renderSIVTable() {
        const tbody = document.getElementById('sivTableBody');
        const startIndex = (this.currentPage - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        tbody.innerHTML = pageData.map(record => {
            const months = ['2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05'];
            const monthCells = months.map(month => 
                `<td class="month-col cell-number">${record[month] || 0}</td>`
            ).join('');

            return `
                <tr ${this.selectedRecords.has(record.embassy) ? 'class="selected"' : ''}>
                    <td class="select-col">
                        <input type="checkbox" class="select-checkbox record-checkbox" 
                               data-id="${record.embassy}" 
                               ${this.selectedRecords.has(record.embassy) ? 'checked' : ''}>
                    </td>
                    <td class="embassy-col"><strong>${record.embassy}</strong></td>
                    <td class="country-col">${record.country}</td>
                    <td class="rank-col cell-number">${record.rank || '-'}</td>
                    ${monthCells}
                    <td class="total-col cell-number"><strong>${record.total || 0}</strong></td>
                    <td class="average-col cell-number">${record.average || 0}</td>
                    <td class="last-updated-col">${this.formatDate(record.lastUpdated)}</td>
                    <td class="actions-col">
                        <button class="action-btn edit-btn" onclick="dbManager.editRecord('${record.embassy}')" title="Edit">
                            ✏️
                        </button>
                        <button class="action-btn delete-btn" onclick="dbManager.deleteRecord('${record.embassy}')" title="Delete">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        this.addCheckboxListeners();
    }

    renderHistoryTable() {
        const tbody = document.getElementById('historyTableBody');
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
                <td class="id-col cell-number">${record.id}</td>
                <td class="embassy-col">${record.embassy}</td>
                <td class="table-col">
                    <span class="status-badge method-${record.table}">
                        ${record.table}
                    </span>
                </td>
                <td class="action-col">
                    <span class="status-badge ${record.action === 'CREATE' ? 'status-yes' : record.action === 'DELETE' ? 'status-no' : 'status-on-arrival'}">
                        ${record.action}
                    </span>
                </td>
                <td class="field-col">${record.field || '-'}</td>
                <td class="old-value-col cell-truncate" title="${record.oldValue || ''}">${record.oldValue || '-'}</td>
                <td class="new-value-col cell-truncate" title="${record.newValue || ''}">${record.newValue || '-'}</td>
                <td class="user-col">${record.user}</td>
                <td class="timestamp-col">${this.formatDateTime(record.timestamp)}</td>
                <td class="actions-col">
                    <button class="action-btn delete-btn" onclick="dbManager.deleteHistoryRecord(${record.id})" title="Delete">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');

        this.addCheckboxListeners();
    }

    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
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
                <td class="id-col cell-number">${record.id}</td>
                <td class="username-col"><strong>${record.username}</strong></td>
                <td class="email-col">${record.email}</td>
                <td class="role-col">
                    <span class="status-badge ${record.role === 'Administrator' ? 'status-no' : record.role === 'Editor' ? 'status-on-arrival' : 'status-yes'}">
                        ${record.role}
                    </span>
                </td>
                <td class="permissions-col cell-truncate" title="${record.permissions}">${record.permissions}</td>
                <td class="status-col">
                    <span class="status-badge status-${record.status.toLowerCase()}">
                        ${record.status}
                    </span>
                </td>
                <td class="last-login-col">${this.formatDateTime(record.lastLogin)}</td>
                <td class="created-col">${this.formatDate(record.created)}</td>
                <td class="actions-col">
                    <button class="action-btn edit-btn" onclick="dbManager.editRecord(${record.id})" title="Edit">
                        ✏️
                    </button>
                    <button class="action-btn delete-btn" onclick="dbManager.deleteRecord(${record.id})" title="Delete">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');

        this.addCheckboxListeners();
    }

    renderUploadsTable() {
        const tbody = document.getElementById('uploadsTableBody');
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
                <td class="id-col cell-number">${record.id}</td>
                <td class="filename-col cell-truncate" title="${record.filename}"><strong>${record.filename}</strong></td>
                <td class="filetype-col">${record.fileType}</td>
                <td class="filesize-col">${record.fileSize}</td>
                <td class="status-col">
                    <span class="status-badge status-${record.status}">
                        ${record.status.toUpperCase()}
                    </span>
                </td>
                <td class="records-processed-col cell-number">${record.recordsProcessed}</td>
                <td class="records-updated-col cell-number">${record.recordsUpdated}</td>
                <td class="errors-col cell-number">${record.errors}</td>
                <td class="user-col">${record.uploadedBy}</td>
                <td class="upload-date-col">${this.formatDateTime(record.uploadDate)}</td>
                <td class="processing-time-col">${record.processingTime}</td>
                <td class="actions-col">
                    <button class="action-btn edit-btn" onclick="dbManager.viewUploadDetails(${record.id})" title="View Details">
                        👁️
                    </button>
                    <button class="action-btn delete-btn" onclick="dbManager.deleteRecord(${record.id})" title="Delete">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');

        this.addCheckboxListeners();
    }

    addCheckboxListeners() {
        document.querySelectorAll('.record-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = this.currentTable === 'history' || this.currentTable === 'users' || this.currentTable === 'uploads' ? 
                    parseInt(e.target.dataset.id) : e.target.dataset.id;
                this.toggleRecordSelection(id, e.target.checked);
            });
        });
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
    }

    updatePagination() {
        const totalRecords = this.filteredData.length;
        const totalPages = Math.ceil(totalRecords / this.recordsPerPage);
        const startRecord = (this.currentPage - 1) * this.recordsPerPage + 1;
        const endRecord = Math.min(this.currentPage * this.recordsPerPage, totalRecords);

        document.getElementById('paginationInfo').textContent = 
            `Showing ${startRecord}-${endRecord} of ${totalRecords} records`;

        document.getElementById('firstPageBtn').disabled = this.currentPage === 1;
        document.getElementById('prevPageBtn').disabled = this.currentPage === 1;
        document.getElementById('nextPageBtn').disabled = this.currentPage === totalPages;
        document.getElementById('lastPageBtn').disabled = this.currentPage === totalPages;

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
            this.renderCurrentTable();
        }
    }

    editRecord(id) {
        // Implementation for edit functionality
        this.showNotification(`Edit functionality for ${this.currentTable} table - Coming soon!`);
    }

    deleteRecord(id) {
        if (confirm(`Are you sure you want to delete this ${this.currentTable} record?`)) {
            if (this.currentTable === 'history') {
                this.data.history = this.data.history.filter(r => r.id !== id);
            } else if (this.currentTable === 'users') {
                this.data.users.delete(id);
            } else if (this.currentTable === 'uploads') {
                this.data.uploads = this.data.uploads.filter(r => r.id !== id);
                localStorage.setItem('fileUploads', JSON.stringify(this.data.uploads));
            } else {
                this.data[this.currentTable].delete(id);
            }
            
            this.selectedRecords.delete(id);
            this.applyFilters();
            this.showNotification('Record deleted successfully!');
            this.addChangeHistory('DELETE', id, this.currentTable);
        }
    }

    deleteHistoryRecord(id) {
        this.deleteRecord(id);
    }

    addChangeHistory(action, recordId, table, field = null, oldValue = null, newValue = null) {
        const newId = Math.max(...this.data.history.map(h => h.id), 0) + 1;
        this.data.history.push({
            id: newId,
            embassy: recordId,
            table: table,
            action: action,
            field: field,
            oldValue: oldValue,
            newValue: newValue,
            user: 'admin@example.com', // In production, get from auth
            timestamp: new Date().toISOString()
        });
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

    formatDateTime(dateString) {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    showAddModal() {
        this.showNotification(`Add new ${this.currentTable} record - Coming soon!`);
    }

    showEditModal() {
        this.showNotification('Edit modal - Coming soon!');
    }

    hideModal() {
        document.getElementById('editModal').classList.remove('show');
    }

    saveRecord() {
        this.showNotification('Save functionality - Coming soon!');
    }

    toggleFilterPanel() {
        const panel = document.getElementById('filterPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    bulkEdit() {
        if (this.selectedRecords.size === 0) return;
        this.showNotification(`Bulk edit for ${this.selectedRecords.size} records - Coming soon!`);
    }

    bulkDelete() {
        if (this.selectedRecords.size === 0) return;
        if (confirm(`Are you sure you want to delete ${this.selectedRecords.size} selected records?`)) {
            this.selectedRecords.forEach(id => {
                if (this.currentTable === 'history') {
                    this.data.history = this.data.history.filter(r => r.id !== id);
                } else if (this.currentTable === 'users') {
                    this.data.users.delete(id);
                } else if (this.currentTable === 'uploads') {
                    this.data.uploads = this.data.uploads.filter(r => r.id !== id);
                } else {
                    this.data[this.currentTable].delete(id);
                }
            });
            
            this.selectedRecords.clear();
            this.applyFilters();
            this.showNotification('Selected records deleted successfully!');
        }
    }

    exportSelected() {
        if (this.selectedRecords.size === 0) return;
        this.showNotification(`Export ${this.selectedRecords.size} selected records - Coming soon!`);
    }

    exportCurrentTable() {
        this.showNotification(`Export ${this.currentTable} table data - Coming soon!`);
    }

    refreshAllData() {
        this.loadAllData().then(() => {
            this.renderCurrentTable();
            this.showNotification('All data refreshed successfully!');
        });
    }

    saveAllData() {
        // Save each table to localStorage
        localStorage.setItem('databaseVisaData', JSON.stringify(Array.from(this.data.visa.values())));
        localStorage.setItem('databaseTravelData', JSON.stringify(Array.from(this.data.travel.values())));
        localStorage.setItem('databaseSIVData', JSON.stringify(Array.from(this.data.siv.values())));
        localStorage.setItem('databaseHistoryData', JSON.stringify(this.data.history));
        localStorage.setItem('databaseUserData', JSON.stringify(Array.from(this.data.users.values())));
        localStorage.setItem('fileUploads', JSON.stringify(this.data.uploads));
        
        this.showNotification('All data saved successfully!');
    }

    viewUploadDetails(id) {
        const upload = this.data.uploads.find(u => u.id === id);
        if (upload) {
            const details = `
                Upload Details:
                
                File: ${upload.filename}
                Type: ${upload.fileType}
                Size: ${upload.fileSize}
                Status: ${upload.status.toUpperCase()}
                
                Processing Results:
                Records Processed: ${upload.recordsProcessed}
                Records Updated: ${upload.recordsUpdated}
                Errors: ${upload.errors}
                Processing Time: ${upload.processingTime}
                
                Upload Info:
                Uploaded By: ${upload.uploadedBy}
                Upload Date: ${this.formatDateTime(upload.uploadDate)}
                Upload ID: ${upload.id}
            `;
            alert(details);
        }
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

// Initialize database manager
const dbManager = new DatabaseManager();