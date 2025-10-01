// Investment Management System
class InvestmentManager {
    constructor() {
        this.investments = this.loadInvestments();
        this.divestments = this.loadDivestments();
        this.dividends = this.loadDividends();
        this.charts = {};
        this.init();
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.updateDashboard();
        this.renderInvestments();
        this.initCharts();
        this.setDefaultDate();
        this.showWelcomeMessage();
        this.populateInvestmentSelect();
        this.renderDivestments();
        this.populateDividendInvestmentSelect();
        this.renderDividends();
        this.updateDividendStats();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Investment mode selector
        document.querySelectorAll('.mode-tab').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchInvestmentMode(e.target.dataset.mode));
        });

        // Real-time calculation for existing investment mode
        document.getElementById('currentValue').addEventListener('input', () => this.calculateOriginalAmount());
        document.getElementById('performancePercent').addEventListener('input', () => this.calculateOriginalAmount());

        // Add investment form
        document.getElementById('addInvestmentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addInvestment();
        });

        // Update investment form
        document.getElementById('updateInvestmentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateInvestment();
        });

        // Filter investments
        document.getElementById('typeFilter').addEventListener('change', (e) => {
            this.filterInvestments(e.target.value);
        });

        // Tax calculator
        document.getElementById('calculateTaxes').addEventListener('click', () => {
            this.calculateTaxes();
        });

        // Divestment form
        document.getElementById('divestmentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateDivestment();
        });

        document.getElementById('selectInvestment').addEventListener('change', (e) => {
            this.showInvestmentSummary(e.target.value);
        });

        document.getElementById('divestmentType').addEventListener('change', (e) => {
            this.togglePartialAmountField(e.target.value);
        });

        document.getElementById('confirmDivestment').addEventListener('click', () => {
            this.confirmDivestment();
        });

        document.getElementById('cancelDivestment').addEventListener('click', () => {
            this.cancelDivestment();
        });

        // Dividend form
        document.getElementById('dividendForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addDividend();
        });

        // Dividend filters
        document.getElementById('dividendYearFilter').addEventListener('change', () => {
            this.filterDividends();
        });

        document.getElementById('dividendInvestmentFilter').addEventListener('change', () => {
            this.filterDividends();
        });

        // Modal handlers
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelUpdate').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('updateModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    // Set default date to today
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('investmentDate').value = today;
        document.getElementById('updateDate').value = today;
        
        // Set divestment date if element exists
        const divestmentDateElement = document.getElementById('divestmentDate');
        if (divestmentDateElement) {
            divestmentDateElement.value = today;
        }
        
        // Set dividend date if element exists
        const dividendDateElement = document.getElementById('dividendDate');
        if (dividendDateElement) {
            dividendDateElement.value = today;
        }
    }

    // Switch between tabs
    switchTab(tabName) {
        // Remove active class from all tabs and panes
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

        // Add active class to selected tab and pane
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');

        // Switch between tabs
        if (tabName === 'charts') {
            setTimeout(() => this.updateCharts(), 100);
        } else if (tabName === 'divestments') {
            this.populateInvestmentSelect();
            this.renderDivestments();
            this.resetDivestmentForm();
        } else if (tabName === 'dividends') {
            this.populateDividendInvestmentSelect();
            this.renderDividends();
            this.updateDividendStats();
            this.populateDividendFilters();
        }
    }

    // Add new investment
    addInvestment() {
        const mode = document.querySelector('.mode-tab.active').dataset.mode;
        let formData;

        if (mode === 'new') {
            // Standard new investment
            formData = {
                id: Date.now(),
                name: document.getElementById('investmentName').value.trim(),
                type: document.getElementById('investmentType').value,
                amount: parseFloat(document.getElementById('investmentAmount').value),
                quantity: parseFloat(document.getElementById('investmentQuantity').value) || null,
                date: document.getElementById('investmentDate').value,
                notes: document.getElementById('investmentNotes').value.trim(),
                currentValue: parseFloat(document.getElementById('investmentAmount').value),
                updates: []
            };
        } else {
            // Existing investment with current value and performance
            const currentValue = parseFloat(document.getElementById('currentValue').value);
            const performancePercent = parseFloat(document.getElementById('performancePercent').value);
            const originalAmount = currentValue / (1 + performancePercent / 100);

            formData = {
                id: Date.now(),
                name: document.getElementById('investmentName').value.trim(),
                type: document.getElementById('investmentType').value,
                amount: originalAmount,
                quantity: parseFloat(document.getElementById('existingQuantity').value) || null,
                date: document.getElementById('investmentDate').value,
                notes: document.getElementById('investmentNotes').value.trim(),
                currentValue: currentValue,
                updates: [{
                    date: new Date().toISOString().split('T')[0],
                    value: currentValue,
                    timestamp: Date.now(),
                    note: `Valore iniziale inserito (${performancePercent > 0 ? '+' : ''}${performancePercent.toFixed(2)}% dal acquisto)`
                }],
                isExistingInvestment: true,
                initialPerformance: performancePercent
            };
        }

        // Validate data
        const errors = this.validateInvestmentData(formData, mode);
        if (errors.length > 0) {
            this.showNotification(errors.join('. '), 'error');
            return;
        }

        this.investments.push(formData);
        this.saveInvestments();
        this.updateDashboard();
        this.renderInvestments();
        this.updateCharts();

        // Reset form
        this.clearInvestmentForm();
        document.getElementById('addInvestmentForm').reset();
        this.setDefaultDate();
        
        // Reset to new investment mode
        this.switchInvestmentMode('new');

        // Show success message
        if (mode === 'existing') {
            this.showNotification(`Investimento esistente aggiunto! Importo originale calcolato: €${formData.amount.toFixed(2)}`, 'success');
        } else {
            this.showNotification('Investimento aggiunto con successo!', 'success');
        }

        // Switch to investments tab
        this.switchTab('investments');
    }

    // Show investment summary when selected
    showInvestmentSummary(investmentId) {
        const summaryDiv = document.getElementById('investmentSummary');
        
        if (!investmentId) {
            summaryDiv.style.display = 'none';
            return;
        }

        const investment = this.investments.find(inv => inv.id == investmentId);
        if (investment) {
            const gainLoss = investment.currentValue - investment.amount;
            
            document.getElementById('summaryOriginalAmount').textContent = `€${investment.amount.toFixed(2)}`;
            document.getElementById('summaryCurrentValue').textContent = `€${investment.currentValue.toFixed(2)}`;
            
            const gainLossElement = document.getElementById('summaryGainLoss');
            gainLossElement.textContent = `€${gainLoss.toFixed(2)}`;
            gainLossElement.className = gainLoss >= 0 ? 'positive' : 'negative';
            
            summaryDiv.style.display = 'block';
        }
    }

    // Toggle partial amount field
    togglePartialAmountField(type) {
        const partialGroup = document.getElementById('partialAmountGroup');
        const amountInput = document.getElementById('divestmentAmount');
        
        if (type === 'partial') {
            partialGroup.style.display = 'block';
            amountInput.required = true;
        } else {
            partialGroup.style.display = 'none';
            amountInput.required = false;
            amountInput.value = '';
        }
    }

    // Calculate divestment
    calculateDivestment() {
        const investmentId = document.getElementById('selectInvestment').value;
        const divestmentType = document.getElementById('divestmentType').value;
        const divestmentDate = document.getElementById('divestmentDate').value;
        
        if (!investmentId || !divestmentType || !divestmentDate) {
            this.showNotification('Compila tutti i campi richiesti', 'error');
            return;
        }

        const investment = this.investments.find(inv => inv.id == investmentId);
        if (!investment) {
            this.showNotification('Investimento non trovato', 'error');
            return;
        }

        let divestedAmount, divestedCost;
        
        if (divestmentType === 'total') {
            // Total divestment
            divestedAmount = investment.currentValue;
            divestedCost = investment.amount;
        } else {
            // Partial divestment
            const partialAmount = parseFloat(document.getElementById('divestmentAmount').value);
            if (!partialAmount || partialAmount <= 0) {
                this.showNotification('Inserisci un importo valido per il disinvestimento parziale', 'error');
                return;
            }
            
            if (partialAmount > investment.currentValue) {
                this.showNotification('L\'importo del disinvestimento non può essere maggiore del valore attuale', 'error');
                return;
            }
            
            const percentage = partialAmount / investment.currentValue;
            divestedAmount = partialAmount;
            divestedCost = investment.amount * percentage;
        }

        // Calculate taxes
        const grossGain = divestedAmount - divestedCost;
        const taxes = grossGain > 0 ? grossGain * 0.26 : 0; // 26% on gains only
        const netGain = grossGain - taxes;
        const totalCash = divestedAmount - taxes;

        // Store calculation for confirmation
        this.pendingDivestment = {
            investmentId: parseInt(investmentId),
            investment: investment,
            type: divestmentType,
            date: divestmentDate,
            divestedAmount: divestedAmount,
            divestedCost: divestedCost,
            grossGain: grossGain,
            taxes: taxes,
            netGain: netGain,
            totalCash: totalCash
        };

        // Show results
        this.displayDivestmentResults();
    }

    // Display divestment results
    displayDivestmentResults() {
        const pending = this.pendingDivestment;
        
        document.getElementById('resultDivestedAmount').textContent = `€${pending.divestedAmount.toFixed(2)}`;
        document.getElementById('resultOriginalCost').textContent = `€${pending.divestedCost.toFixed(2)}`;
        document.getElementById('resultGrossGain').textContent = `€${pending.grossGain.toFixed(2)}`;
        document.getElementById('resultTaxes').textContent = `€${pending.taxes.toFixed(2)}`;
        document.getElementById('resultNetGain').textContent = `€${pending.netGain.toFixed(2)}`;
        document.getElementById('resultTotalCash').textContent = `€${pending.totalCash.toFixed(2)}`;

        // Color coding
        const grossGainElement = document.getElementById('resultGrossGain');
        const netGainElement = document.getElementById('resultNetGain');
        
        grossGainElement.style.color = pending.grossGain >= 0 ? '#27ae60' : '#e74c3c';
        netGainElement.style.color = pending.netGain >= 0 ? '#27ae60' : '#e74c3c';

        document.getElementById('divestmentResults').style.display = 'block';
        
        // Scroll to results
        document.getElementById('divestmentResults').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }

    // Confirm divestment
    confirmDivestment() {
        if (!this.pendingDivestment) {
            this.showNotification('Nessun disinvestimento da confermare', 'error');
            return;
        }

        const pending = this.pendingDivestment;
        
        // Create divestment record
        const divestmentRecord = {
            id: Date.now(),
            investmentId: pending.investmentId,
            investmentName: pending.investment.name,
            type: pending.type,
            date: pending.date,
            divestedAmount: pending.divestedAmount,
            divestedCost: pending.divestedCost,
            grossGain: pending.grossGain,
            taxes: pending.taxes,
            netGain: pending.netGain,
            totalCash: pending.totalCash,
            timestamp: Date.now()
        };

        // Add to divestments array
        this.divestments.push(divestmentRecord);

        // Update investment
        const investment = this.investments.find(inv => inv.id === pending.investmentId);
        if (pending.type === 'total') {
            // Remove investment completely
            this.investments = this.investments.filter(inv => inv.id !== pending.investmentId);
        } else {
            // Update investment for partial divestment
            const percentage = pending.divestedAmount / investment.currentValue;
            investment.amount -= pending.divestedCost;
            investment.currentValue -= pending.divestedAmount;
            
            // Adjust quantity if present
            if (investment.quantity) {
                investment.quantity *= (1 - percentage);
            }

            // Add update record
            investment.updates.push({
                date: pending.date,
                value: investment.currentValue,
                timestamp: Date.now(),
                note: `Disinvestimento parziale: -€${pending.divestedAmount.toFixed(2)}`
            });
        }

        // Save data
        this.saveInvestments();
        this.saveDivestments();

        // Update UI
        this.updateDashboard();
        this.renderInvestments();
        this.updateCharts();
        this.populateInvestmentSelect();
        this.renderDivestments();

        // Clear form and results
        this.resetDivestmentForm();

        this.showNotification(`Disinvestimento registrato con successo! Incasso netto: €${pending.totalCash.toFixed(2)}`, 'success');
    }

    // Cancel divestment
    cancelDivestment() {
        this.pendingDivestment = null;
        document.getElementById('divestmentResults').style.display = 'none';
    }

    // Reset divestment form
    resetDivestmentForm() {
        document.getElementById('divestmentForm').reset();
        document.getElementById('investmentSummary').style.display = 'none';
        document.getElementById('divestmentResults').style.display = 'none';
        document.getElementById('partialAmountGroup').style.display = 'none';
        this.pendingDivestment = null;
        
        // Set default date
        document.getElementById('divestmentDate').value = new Date().toISOString().split('T')[0];
    }

    // Populate investment select dropdown
    populateInvestmentSelect() {
        const select = document.getElementById('selectInvestment');
        const currentValue = select.value;
        
        // Clear options except the first one
        select.innerHTML = '<option value="">Scegli un investimento</option>';
        
        // Add current investments
        this.investments.forEach(investment => {
            const option = document.createElement('option');
            option.value = investment.id;
            option.textContent = `${investment.name} (€${investment.currentValue.toFixed(2)})`;
            select.appendChild(option);
        });
        
        // Restore selection if it still exists
        if (currentValue && this.investments.find(inv => inv.id == currentValue)) {
            select.value = currentValue;
        }
    }

    // Render divestments history
    renderDivestments() {
        const container = document.getElementById('divestmentsList');
        
        if (this.divestments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h4>Nessun disinvestimento registrato</h4>
                </div>
            `;
            return;
        }

        // Sort by date (most recent first)
        const sortedDivestments = [...this.divestments].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        container.innerHTML = sortedDivestments.map(divestment => `
            <div class="divestment-card">
                <div class="divestment-header">
                    <div>
                        <div class="divestment-name">${divestment.investmentName}</div>
                        <span class="divestment-type">${divestment.type === 'total' ? 'Totale' : 'Parziale'}</span>
                    </div>
                    <div class="divestment-header-right">
                        <div class="divestment-date">${this.formatDate(divestment.date)}</div>
                        <button class="btn-icon btn-delete" onclick="app.deleteDivestment(${divestment.id})" title="Elimina disinvestimento">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="divestment-details">
                    <div class="detail-item">
                        <span class="detail-label">Importo Disinvestito</span>
                        <span class="detail-value">€${divestment.divestedAmount.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Costo Originale</span>
                        <span class="detail-value">€${divestment.divestedCost.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Guadagno Lordo</span>
                        <span class="detail-value ${divestment.grossGain >= 0 ? 'positive' : 'negative'}">
                            €${divestment.grossGain.toFixed(2)}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Tasse Pagate</span>
                        <span class="detail-value">€${divestment.taxes.toFixed(2)}</span>
                    </div>
                </div>
                <div class="divestment-summary">
                    <div class="summary-label">Incasso Netto</div>
                    <div class="summary-value ${divestment.netGain >= 0 ? 'positive' : 'negative'}">
                        €${divestment.totalCash.toFixed(2)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Delete divestment from history
    deleteDivestment(divestmentId) {
        // Check if there's a pending divestment calculation
        if (this.pendingDivestment) {
            this.showNotification('Completa o annulla il disinvestimento in corso prima di eliminare dalla storia', 'error');
            return;
        }

        const divestment = this.divestments.find(div => div.id === divestmentId);
        
        if (!divestment) {
            this.showNotification('Disinvestimento non trovato', 'error');
            return;
        }

        // Create detailed confirmation message
        const confirmMessage = 
            `🗑️ ELIMINAZIONE DISINVESTIMENTO\n\n` +
            `📊 Investimento: ${divestment.investmentName}\n` +
            `📅 Data: ${this.formatDate(divestment.date)}\n` +
            `💰 Importo: €${divestment.divestedAmount.toFixed(2)}\n` +
            `📈 Tipo: ${divestment.type === 'total' ? 'Totale' : 'Parziale'}\n` +
            `💵 Incasso netto: €${divestment.totalCash.toFixed(2)}\n\n` +
            `⚠️ ATTENZIONE:\n` +
            `• Questa operazione elimina solo il record dallo storico\n` +
            `• NON ripristina l'investimento originale\n` +
            `• I calcoli del patrimonio verranno aggiornati\n\n` +
            `Continuare con l'eliminazione?`;

        if (confirm(confirmMessage)) {
            // Remove divestment from array
            this.divestments = this.divestments.filter(div => div.id !== divestmentId);
            
            // Save to localStorage
            this.saveDivestments();
            
            // Update UI
            this.updateDashboard();
            this.renderDivestments();
            
            // Show success with details
            this.showNotification(
                `Disinvestimento eliminato: ${divestment.investmentName} (€${divestment.divestedAmount.toFixed(2)})`, 
                'success'
            );
        }
    }

    // Switch investment input mode
    switchInvestmentMode(mode) {
        // Update tab appearance
        document.querySelectorAll('.mode-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

        // Show/hide relevant sections
        const newMode = document.getElementById('newInvestmentMode');
        const existingMode = document.getElementById('existingInvestmentMode');

        if (mode === 'new') {
            newMode.style.display = 'block';
            existingMode.style.display = 'none';
            // Make original amount field required
            document.getElementById('investmentAmount').required = true;
            // Remove required from existing mode fields
            document.getElementById('currentValue').required = false;
            document.getElementById('performancePercent').required = false;
        } else {
            newMode.style.display = 'none';
            existingMode.style.display = 'block';
            // Remove required from new mode field
            document.getElementById('investmentAmount').required = false;
            // Make existing mode fields required
            document.getElementById('currentValue').required = true;
            document.getElementById('performancePercent').required = true;
        }

        // Clear form and recalculate
        this.clearInvestmentForm();
        this.calculateOriginalAmount();
    }

    // Calculate original amount from current value and performance
    calculateOriginalAmount() {
        const currentValue = parseFloat(document.getElementById('currentValue').value) || 0;
        const performancePercent = parseFloat(document.getElementById('performancePercent').value) || 0;

        if (currentValue > 0 && performancePercent !== 0) {
            // Formula: originalAmount = currentValue / (1 + performancePercent/100)
            const originalAmount = currentValue / (1 + performancePercent / 100);
            const calculatedElement = document.getElementById('calculatedOriginalAmount');
            
            calculatedElement.textContent = `€${originalAmount.toFixed(2)}`;
            
            // Add visual feedback based on performance
            calculatedElement.className = 'calculated-value';
            if (performancePercent > 0) {
                calculatedElement.classList.add('positive');
            } else if (performancePercent < 0) {
                calculatedElement.classList.add('negative');
            }
        } else {
            document.getElementById('calculatedOriginalAmount').textContent = '€0.00';
            document.getElementById('calculatedOriginalAmount').className = 'calculated-value';
        }
    }

    // Clear investment form
    clearInvestmentForm() {
        // Clear all form fields except date
        document.getElementById('investmentName').value = '';
        document.getElementById('investmentType').value = '';
        document.getElementById('investmentAmount').value = '';
        document.getElementById('investmentQuantity').value = '';
        document.getElementById('investmentNotes').value = '';
        document.getElementById('currentValue').value = '';
        document.getElementById('performancePercent').value = '';
        document.getElementById('existingQuantity').value = '';
        document.getElementById('calculatedOriginalAmount').textContent = '€0.00';
        document.getElementById('calculatedOriginalAmount').className = 'calculated-value';
    }

    // Update existing investment
    updateInvestment() {
        const id = parseInt(document.getElementById('updateInvestmentId').value);
        const currentValue = parseFloat(document.getElementById('updateCurrentValue').value);
        const updateDate = document.getElementById('updateDate').value;

        const investment = this.investments.find(inv => inv.id === id);
        if (investment) {
            investment.currentValue = currentValue;
            investment.updates.push({
                date: updateDate,
                value: currentValue,
                timestamp: Date.now()
            });

            this.saveInvestments();
            this.updateDashboard();
            this.renderInvestments();
            this.updateCharts();
            this.closeModal();

            this.showNotification('Investimento aggiornato con successo!', 'success');
        }
    }

    // Delete investment
    deleteInvestment(id) {
        if (confirm('Sei sicuro di voler eliminare questo investimento?')) {
            this.investments = this.investments.filter(inv => inv.id !== id);
            this.saveInvestments();
            this.updateDashboard();
            this.renderInvestments();
            this.updateCharts();

            this.showNotification('Investimento eliminato con successo!', 'success');
        }
    }

    // Open update modal
    openUpdateModal(id) {
        const investment = this.investments.find(inv => inv.id === id);
        if (investment) {
            document.getElementById('updateInvestmentId').value = id;
            document.getElementById('updateCurrentValue').value = investment.currentValue;
            document.getElementById('updateDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('updateModal').style.display = 'block';
        }
    }

    // Close modal
    closeModal() {
        document.getElementById('updateModal').style.display = 'none';
    }

    // Filter investments by type
    filterInvestments(type) {
        const filteredInvestments = type ? 
            this.investments.filter(inv => inv.type === type) : 
            this.investments;
        this.renderInvestments(filteredInvestments);
    }

    // Render investments list
    renderInvestments(investmentsToRender = this.investments) {
        const container = document.getElementById('investmentsList');
        
        if (investmentsToRender.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <h3>Nessun investimento trovato</h3>
                    <p>Inizia aggiungendo il tuo primo investimento!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = investmentsToRender.map(investment => {
            const gainLoss = investment.currentValue - investment.amount;
            const gainLossPercent = ((gainLoss / investment.amount) * 100).toFixed(2);
            const performanceClass = gainLoss > 0 ? 'positive' : gainLoss < 0 ? 'negative' : 'neutral';

            return `
                <div class="investment-card">
                    <div class="investment-header">
                        <div>
                            <div class="investment-name">
                                ${investment.name}
                                ${investment.isExistingInvestment ? '<span class="existing-badge" title="Investimento esistente">📈</span>' : ''}
                            </div>
                            <span class="investment-type">${this.getTypeLabel(investment.type)}</span>
                        </div>
                        <div class="investment-actions">
                            <button class="btn-icon btn-update" onclick="app.openUpdateModal(${investment.id})" title="Aggiorna valore">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-delete" onclick="app.deleteInvestment(${investment.id})" title="Elimina">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="investment-details">
                        <div class="detail-item">
                            <span class="detail-label">Investito</span>
                            <span class="detail-value">€${investment.amount.toFixed(2)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Valore Attuale</span>
                            <span class="detail-value">€${investment.currentValue.toFixed(2)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Data Acquisto</span>
                            <span class="detail-value">${this.formatDate(investment.date)}</span>
                        </div>
                        ${investment.quantity ? `
                        <div class="detail-item">
                            <span class="detail-label">Quantità</span>
                            <span class="detail-value">${investment.quantity}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="investment-performance">
                        <div class="performance-label">Performance</div>
                        <div class="performance-value ${performanceClass}">
                            €${gainLoss.toFixed(2)} (${gainLossPercent}%)
                        </div>
                    </div>
                    ${investment.notes ? `
                    <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem; color: #666;">
                        <strong>Note:</strong> ${investment.notes}
                    </div>
                    ` : ''}
                    ${investment.isExistingInvestment ? `
                    <div style="margin-top: 10px; padding: 8px; background: rgba(102, 126, 234, 0.1); border-radius: 8px; font-size: 0.8rem; color: #667eea;">
                        <i class="fas fa-info-circle"></i> <strong>Investimento esistente</strong> - Performance iniziale: ${investment.initialPerformance > 0 ? '+' : ''}${investment.initialPerformance.toFixed(2)}%
                    </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    // Update dashboard statistics
    updateDashboard() {
        const totalInvested = this.investments.reduce((sum, inv) => sum + inv.amount, 0);
        const totalPortfolio = this.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
        const totalGainLoss = totalPortfolio - totalInvested;
        const totalReturn = totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100) : 0;

        // Calculate total cash from divestments
        const totalCashFromSales = this.divestments.reduce((sum, div) => sum + div.totalCash, 0);
        const totalDivestedCost = this.divestments.reduce((sum, div) => sum + div.divestedCost, 0);
        const realizedGains = this.divestments.reduce((sum, div) => sum + div.netGain, 0);

        // Calculate total dividends received
        const totalDividendsReceived = this.dividends.reduce((sum, div) => sum + div.netAmount, 0);

        // Total patrimony includes current portfolio + cash from sales + dividends received
        const totalPatrimony = totalPortfolio + totalCashFromSales + totalDividendsReceived;
        const totalOriginalInvestment = totalInvested + totalDivestedCost;
        const totalRealizedAndUnrealizedGains = totalGainLoss + realizedGains + totalDividendsReceived;

        document.getElementById('totalInvested').textContent = `€${totalInvested.toFixed(2)}`;
        document.getElementById('totalPortfolio').textContent = `€${totalPatrimony.toFixed(2)}`;
        
        const gainLossElement = document.getElementById('totalGainLoss');
        gainLossElement.textContent = `€${totalRealizedAndUnrealizedGains.toFixed(2)}`;
        gainLossElement.className = `stat-value ${totalRealizedAndUnrealizedGains >= 0 ? 'positive' : 'negative'}`;
        
        const totalReturnCalculated = totalOriginalInvestment > 0 ? 
            ((totalRealizedAndUnrealizedGains / totalOriginalInvestment) * 100) : 0;
        
        const returnElement = document.getElementById('totalReturn');
        returnElement.textContent = `${totalReturnCalculated.toFixed(2)}%`;
        returnElement.className = `stat-value ${totalReturnCalculated >= 0 ? 'positive' : 'negative'}`;
    }

    // Initialize charts
    initCharts() {
        // Type distribution chart
        const typeCtx = document.getElementById('typeChart').getContext('2d');
        this.charts.type = new Chart(typeCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#f5576c',
                        '#4facfe',
                        '#00f2fe'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: €${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Performance chart
        const performanceCtx = document.getElementById('performanceChart').getContext('2d');
        this.charts.performance = new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Valore Portfolio (€)',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '€' + value.toFixed(0);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Valore: €${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });

        this.updateCharts();
    }

    // Update charts with current data
    updateCharts() {
        if (!this.charts.type || !this.charts.performance) return;

        // Update type distribution chart
        const typeData = {};
        this.investments.forEach(inv => {
            const type = this.getTypeLabel(inv.type);
            typeData[type] = (typeData[type] || 0) + inv.currentValue;
        });

        this.charts.type.data.labels = Object.keys(typeData);
        this.charts.type.data.datasets[0].data = Object.values(typeData);
        this.charts.type.update();

        // Update performance chart (simplified version showing current snapshot)
        const dates = [];
        const values = [];
        
        // Create a timeline based on investment dates and updates
        const timeline = new Map();
        
        this.investments.forEach(inv => {
            // Add initial investment
            const investDate = new Date(inv.date).getTime();
            if (!timeline.has(investDate)) {
                timeline.set(investDate, 0);
            }
            timeline.set(investDate, timeline.get(investDate) + inv.amount);
            
            // Add updates
            inv.updates.forEach(update => {
                const updateDate = new Date(update.date).getTime();
                // For simplicity, we'll just show current total value
                timeline.set(updateDate, this.investments.reduce((sum, i) => sum + i.currentValue, 0));
            });
        });

        // If no updates, show at least initial and current
        if (timeline.size === 0 && this.investments.length > 0) {
            const now = Date.now();
            const totalInvested = this.investments.reduce((sum, inv) => sum + inv.amount, 0);
            const totalCurrent = this.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
            
            timeline.set(now - 86400000, totalInvested); // Yesterday
            timeline.set(now, totalCurrent); // Today
        }

        const sortedTimeline = Array.from(timeline.entries()).sort((a, b) => a[0] - b[0]);
        
        this.charts.performance.data.labels = sortedTimeline.map(([date]) => 
            new Date(date).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })
        );
        this.charts.performance.data.datasets[0].data = sortedTimeline.map(([, value]) => value);
        this.charts.performance.update();
    }

    // Calculate taxes for divestment
    calculateTaxes() {
        const buyPrice = parseFloat(document.getElementById('buyPrice').value) || 0;
        const sellPrice = parseFloat(document.getElementById('sellPrice').value) || 0;
        const quantity = parseFloat(document.getElementById('quantity').value) || 0;
        const taxRate = parseFloat(document.getElementById('taxRate').value) || 26;

        if (buyPrice <= 0 || sellPrice <= 0 || quantity <= 0) {
            this.showNotification('Inserisci tutti i valori richiesti', 'error');
            return;
        }

        const totalBuy = buyPrice * quantity;
        const totalSell = sellPrice * quantity;
        const grossGain = totalSell - totalBuy;
        
        // Only apply taxes on gains
        const taxes = grossGain > 0 ? (grossGain * taxRate / 100) : 0;
        const netGain = grossGain - taxes;

        // Update results
        document.getElementById('grossGain').textContent = `€${grossGain.toFixed(2)}`;
        document.getElementById('taxes').textContent = `€${taxes.toFixed(2)}`;
        document.getElementById('netGain').textContent = `€${netGain.toFixed(2)}`;

        // Show results
        document.getElementById('taxResults').style.display = 'block';

        // Color coding
        const grossGainElement = document.getElementById('grossGain');
        const netGainElement = document.getElementById('netGain');
        
        grossGainElement.style.color = grossGain >= 0 ? '#27ae60' : '#e74c3c';
        netGainElement.style.color = netGain >= 0 ? '#27ae60' : '#e74c3c';
    }

    // Utility function to get type label
    getTypeLabel(type) {
        const labels = {
            'fondo': 'Fondo',
            'azione': 'Azione',
            'azione-dividendi': 'Azione 💰',
            'etf': 'ETF',
            'etf-dividendi': 'ETF 💰',
            'obbligazione': 'Obbligazione',
            'reit': 'REIT 💰'
        };
        return labels[type] || type;
    }

    // Check if investment type supports dividends
    isDividendInvestment(type) {
        return ['azione-dividendi', 'etf-dividendi', 'reit'].includes(type);
    }

    // Format date for display
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('it-IT');
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add styles if not already present
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 10px;
                    color: white;
                    font-weight: 600;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    animation: slideInRight 0.3s ease;
                }
                .notification-success { background: #27ae60; }
                .notification-error { background: #e74c3c; }
                .notification-info { background: #3498db; }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Data persistence methods
    saveInvestments() {
        localStorage.setItem('myinvestments_data', JSON.stringify(this.investments));
    }

    loadInvestments() {
        const saved = localStorage.getItem('myinvestments_data');
        return saved ? JSON.parse(saved) : [];
    }

    saveDivestments() {
        localStorage.setItem('myinvestments_divestments', JSON.stringify(this.divestments));
    }

    loadDivestments() {
        const saved = localStorage.getItem('myinvestments_divestments');
        return saved ? JSON.parse(saved) : [];
    }

    // Export data to JSON file
    exportData() {
        const data = {
            investments: this.investments,
            divestments: this.divestments,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `myinvestments_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Dati esportati con successo!', 'success');
    }

    // Add keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N for new investment
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.switchTab('add');
                document.getElementById('investmentName').focus();
            }
            
            // Ctrl/Cmd + E for export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.exportData();
            }
            
            // Escape to close modal
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // Add data validation
    validateInvestmentData(data, mode = 'new') {
        const errors = [];
        
        if (!data.name || data.name.trim().length < 2) {
            errors.push('Il nome deve essere di almeno 2 caratteri');
        }
        
        if (!data.type) {
            errors.push('Seleziona un tipo di investimento');
        }
        
        if (!data.date) {
            errors.push('Seleziona una data di acquisto');
        }
        
        if (mode === 'new') {
            if (!data.amount || data.amount <= 0) {
                errors.push('L\'importo deve essere maggiore di zero');
            }
        } else {
            // Existing investment mode
            const currentValue = parseFloat(document.getElementById('currentValue').value);
            const performancePercent = parseFloat(document.getElementById('performancePercent').value);
            
            if (!currentValue || currentValue <= 0) {
                errors.push('Il valore attuale deve essere maggiore di zero');
            }
            
            if (performancePercent === null || performancePercent === undefined || isNaN(performancePercent)) {
                errors.push('Inserisci la percentuale di variazione');
            }
            
            if (Math.abs(performancePercent) > 1000) {
                errors.push('La percentuale di variazione sembra troppo alta (max ±1000%)');
            }
        }
        
        if (data.quantity !== null && data.quantity <= 0) {
            errors.push('La quantità deve essere maggiore di zero');
        }
        
        return errors;
    }

    // Import data from JSON file
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.investments && Array.isArray(data.investments)) {
                    this.investments = data.investments;
                    this.saveInvestments();
                }
                if (data.divestments && Array.isArray(data.divestments)) {
                    this.divestments = data.divestments;
                    this.saveDivestments();
                }
                
                this.updateDashboard();
                this.renderInvestments();
                this.updateCharts();
                
                this.showNotification('Dati importati con successo!', 'success');
            } catch (error) {
                this.showNotification('Errore nell\'importazione dei dati', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Show welcome message for first-time users
    showWelcomeMessage() {
        if (this.investments.length === 0 && !localStorage.getItem('myinvestments_welcomed')) {
            setTimeout(() => {
                this.showNotification('Benvenuto in MyInvestments! Inizia aggiungendo il tuo primo investimento.', 'info');
                localStorage.setItem('myinvestments_welcomed', 'true');
            }, 1000);
        }
    }

    // DIVIDEND MANAGEMENT FUNCTIONS

    // Add new dividend
    addDividend() {
        const investmentId = parseInt(document.getElementById('selectDividendInvestment').value);
        const dividendDate = document.getElementById('dividendDate').value;
        const dividendAmount = parseFloat(document.getElementById('dividendAmount').value);
        const dividendTaxes = parseFloat(document.getElementById('dividendTaxes').value) || 0;
        const dividendNotes = document.getElementById('dividendNotes').value.trim();

        // Validation
        if (!investmentId || !dividendDate || !dividendAmount || dividendAmount <= 0) {
            this.showNotification('Compila tutti i campi richiesti con valori validi', 'error');
            return;
        }

        if (dividendTaxes < 0) {
            this.showNotification('Le tasse non possono essere negative', 'error');
            return;
        }

        if (dividendTaxes >= dividendAmount) {
            this.showNotification('Le tasse non possono essere maggiori o uguali al dividendo', 'error');
            return;
        }

        const investment = this.investments.find(inv => inv.id === investmentId);
        if (!investment) {
            this.showNotification('Investimento non trovato', 'error');
            return;
        }

        // Create dividend record
        const dividend = {
            id: Date.now(),
            investmentId: investmentId,
            investmentName: investment.name,
            date: dividendDate,
            grossAmount: dividendAmount,
            taxesWithheld: dividendTaxes,
            netAmount: dividendAmount - dividendTaxes,
            notes: dividendNotes,
            timestamp: Date.now()
        };

        // Add to dividends array
        this.dividends.push(dividend);
        this.saveDividends();

        // Update UI
        this.updateDividendStats();
        this.renderDividends();
        this.populateDividendFilters();

        // Reset form
        document.getElementById('dividendForm').reset();
        this.setDefaultDate();

        this.showNotification(`Dividendo registrato: €${dividend.netAmount.toFixed(2)} netti da ${investment.name}`, 'success');
    }

    // Delete dividend
    deleteDividend(dividendId) {
        const dividend = this.dividends.find(div => div.id === dividendId);
        
        if (!dividend) {
            this.showNotification('Dividendo non trovato', 'error');
            return;
        }

        const confirmMessage = 
            `🗑️ ELIMINAZIONE DIVIDENDO\n\n` +
            `📊 Investimento: ${dividend.investmentName}\n` +
            `📅 Data: ${this.formatDate(dividend.date)}\n` +
            `💰 Importo Lordo: €${dividend.grossAmount.toFixed(2)}\n` +
            `💵 Importo Netto: €${dividend.netAmount.toFixed(2)}\n\n` +
            `Continuare con l'eliminazione?`;

        if (confirm(confirmMessage)) {
            this.dividends = this.dividends.filter(div => div.id !== dividendId);
            this.saveDividends();
            
            this.updateDividendStats();
            this.renderDividends();
            this.populateDividendFilters();
            
            this.showNotification(`Dividendo eliminato: ${dividend.investmentName}`, 'success');
        }
    }

    // Populate dividend investment select
    populateDividendInvestmentSelect() {
        const select = document.getElementById('selectDividendInvestment');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">Scegli un investimento con dividendi</option>';
        
        // Filter investments that support dividends
        const dividendInvestments = this.investments.filter(inv => this.isDividendInvestment(inv.type));
        
        dividendInvestments.forEach(investment => {
            const option = document.createElement('option');
            option.value = investment.id;
            option.textContent = `${investment.name} (${this.getTypeLabel(investment.type)})`;
            select.appendChild(option);
        });
        
        if (currentValue && dividendInvestments.find(inv => inv.id == currentValue)) {
            select.value = currentValue;
        }
    }

    // Update dividend statistics
    updateDividendStats() {
        const totalGross = this.dividends.reduce((sum, div) => sum + div.grossAmount, 0);
        const totalNet = this.dividends.reduce((sum, div) => sum + div.netAmount, 0);
        const totalTaxes = this.dividends.reduce((sum, div) => sum + div.taxesWithheld, 0);
        
        // Calculate average yield
        let averageYield = 0;
        const dividendInvestments = this.investments.filter(inv => this.isDividendInvestment(inv.type));
        
        if (dividendInvestments.length > 0) {
            const totalInvestedInDividendStocks = dividendInvestments.reduce((sum, inv) => sum + inv.amount, 0);
            if (totalInvestedInDividendStocks > 0) {
                averageYield = (totalGross / totalInvestedInDividendStocks) * 100;
            }
        }

        document.getElementById('totalDividends').textContent = `€${totalGross.toFixed(2)}`;
        document.getElementById('netDividends').textContent = `€${totalNet.toFixed(2)}`;
        document.getElementById('dividendTaxesPaid').textContent = `€${totalTaxes.toFixed(2)}`;
        document.getElementById('averageYield').textContent = `${averageYield.toFixed(2)}%`;
    }

    // Populate dividend filters
    populateDividendFilters() {
        // Year filter
        const yearFilter = document.getElementById('dividendYearFilter');
        const currentYear = yearFilter.value;
        yearFilter.innerHTML = '<option value="">Tutti gli anni</option>';
        
        const years = [...new Set(this.dividends.map(div => new Date(div.date).getFullYear()))].sort((a, b) => b - a);
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });
        
        if (currentYear && years.includes(parseInt(currentYear))) {
            yearFilter.value = currentYear;
        }

        // Investment filter
        const investmentFilter = document.getElementById('dividendInvestmentFilter');
        const currentInvestment = investmentFilter.value;
        investmentFilter.innerHTML = '<option value="">Tutti gli investimenti</option>';
        
        const investmentNames = [...new Set(this.dividends.map(div => div.investmentName))].sort();
        investmentNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            investmentFilter.appendChild(option);
        });
        
        if (currentInvestment && investmentNames.includes(currentInvestment)) {
            investmentFilter.value = currentInvestment;
        }
    }

    // Filter dividends
    filterDividends() {
        const yearFilter = document.getElementById('dividendYearFilter').value;
        const investmentFilter = document.getElementById('dividendInvestmentFilter').value;
        
        let filteredDividends = this.dividends;
        
        if (yearFilter) {
            filteredDividends = filteredDividends.filter(div => 
                new Date(div.date).getFullYear() == yearFilter
            );
        }
        
        if (investmentFilter) {
            filteredDividends = filteredDividends.filter(div => 
                div.investmentName === investmentFilter
            );
        }
        
        this.renderDividends(filteredDividends);
    }

    // Render dividends list
    renderDividends(dividendsToRender = this.dividends) {
        const container = document.getElementById('dividendsList');
        
        if (dividendsToRender.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-coins"></i>
                    <h4>Nessun dividendo trovato</h4>
                    <p>Registra il tuo primo dividendo!</p>
                </div>
            `;
            return;
        }

        // Sort by date (most recent first)
        const sortedDividends = [...dividendsToRender].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        container.innerHTML = sortedDividends.map(dividend => `
            <div class="dividend-card">
                <div class="dividend-header">
                    <div>
                        <div class="dividend-name">${dividend.investmentName}</div>
                    </div>
                    <div class="dividend-header-right">
                        <div class="dividend-date">${this.formatDate(dividend.date)}</div>
                        <button class="btn-icon btn-delete" onclick="app.deleteDividend(${dividend.id})" title="Elimina dividendo">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="dividend-details">
                    <div class="detail-item">
                        <span class="detail-label">Dividendo Lordo</span>
                        <span class="detail-value">€${dividend.grossAmount.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Tasse Trattenute</span>
                        <span class="detail-value">€${dividend.taxesWithheld.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Dividendo Netto</span>
                        <span class="detail-value positive">€${dividend.netAmount.toFixed(2)}</span>
                    </div>
                </div>
                ${dividend.notes ? `
                <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem; color: #666;">
                    <strong>Note:</strong> ${dividend.notes}
                </div>
                ` : ''}
            </div>
        `).join('');
    }

    // Data persistence for dividends
    saveDividends() {
        localStorage.setItem('myinvestments_dividends', JSON.stringify(this.dividends));
    }

    loadDividends() {
        const saved = localStorage.getItem('myinvestments_dividends');
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new InvestmentManager();
});
