class PaletteLab {
    constructor() {
        this.palettes = this.loadPalettes();
        this.currentPaletteA = localStorage.getItem('paletteLab.activeA') || '';
        this.currentPaletteB = localStorage.getItem('paletteLab.activeB') || '';
        this.currentDemo = localStorage.getItem('paletteLab.demo') || 'dashboard';
        this.compareMode = localStorage.getItem('paletteLab.compareMode') === 'true';
        this.wcagPanelVisible = localStorage.getItem('paletteLab.wcagVisible') !== 'false'; // Default to visible
        this.currentRenameId = null;

        this.initializeEventListeners();
        this.loadDefaultPalettes();
        this.renderPalettes();
        this.updateDemoSelection();
        this.updateCompareMode();
        this.updateWcagPanel();
        this.applyCurrentPalette();
        this.updateContrastResults();
    }

    loadPalettes() {
        try {
            return JSON.parse(localStorage.getItem('paletteLab.palettes') || '{}');
        } catch (error) {
            console.error('Error loading palettes:', error);
            return {};
        }
    }

    savePalettes() {
        localStorage.setItem('paletteLab.palettes', JSON.stringify(this.palettes));
    }

    initializeEventListeners() {
        // Import buttons
        document.getElementById('importBtn').addEventListener('click', () => {
            this.showCreatePaletteModal();
        });

        document.getElementById('importFromTextBtn').addEventListener('click', () => {
            this.showJsonImportModal();
        });

        // Search
        document.getElementById('paletteSearch').addEventListener('input', (e) => {
            this.filterPalettes(e.target.value);
        });

        // Demo selection
        document.getElementById('demoSelect').addEventListener('change', (e) => {
            this.currentDemo = e.target.value;
            localStorage.setItem('paletteLab.demo', this.currentDemo);
            this.updateDemoFrames();
        });

        // Compare mode
        document.getElementById('compareMode').addEventListener('change', (e) => {
            this.compareMode = e.target.checked;
            localStorage.setItem('paletteLab.compareMode', this.compareMode);
            this.updateCompareMode();
        });

        // Palette selectors
        document.getElementById('paletteA').addEventListener('change', (e) => {
            this.currentPaletteA = e.target.value;
            localStorage.setItem('paletteLab.activeA', this.currentPaletteA);
            this.applyPaletteToFrame('A');
            this.updateContrastResults();
        });

        document.getElementById('paletteB').addEventListener('change', (e) => {
            this.currentPaletteB = e.target.value;
            localStorage.setItem('paletteLab.activeB', this.currentPaletteB);
            this.applyPaletteToFrame('B');
            this.updateContrastResults();
        });

        // Copy link
        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            this.copyComparisonLink();
        });

        // WCAG Panel Toggle
        document.getElementById('wcagToggleBtn').addEventListener('click', () => {
            this.toggleWcagPanel();
        });

        // Modal events
        document.getElementById('cancelRename').addEventListener('click', () => {
            this.hideRenameModal();
        });

        document.getElementById('confirmRename').addEventListener('click', () => {
            this.confirmRename();
        });

        document.getElementById('closeError').addEventListener('click', () => {
            this.hideErrorModal();
        });

        // JSON Import Modal
        document.getElementById('cancelJsonImport').addEventListener('click', () => {
            this.hideJsonImportModal();
        });

        document.getElementById('confirmJsonImport').addEventListener('click', () => {
            this.handleJsonImport();
        });

        // Create Palette Modal
        document.getElementById('cancelCreatePalette').addEventListener('click', () => {
            this.hideCreatePaletteModal();
        });

        document.getElementById('confirmCreatePalette').addEventListener('click', () => {
            this.handleCreatePalette();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideRenameModal();
                this.hideErrorModal();
                this.hideJsonImportModal();
                this.hideCreatePaletteModal();
            }
        });
    }

    showJsonImportModal() {
        document.getElementById('paletteNameInput').value = '';
        document.getElementById('jsonTextArea').value = '';
        document.getElementById('jsonImportModal').classList.remove('hidden');
        document.getElementById('paletteNameInput').focus();
    }

    hideJsonImportModal() {
        document.getElementById('jsonImportModal').classList.add('hidden');
    }

    handleJsonImport() {
        const name = document.getElementById('paletteNameInput').value.trim();
        const jsonText = document.getElementById('jsonTextArea').value.trim();

        if (!name) {
            this.showError('Fehler beim Import', 'Bitte geben Sie einen Namen für die Palette ein.');
            return;
        }

        if (!jsonText) {
            this.showError('Fehler beim Import', 'Bitte fügen Sie JSON-Daten ein.');
            return;
        }

        try {
            const data = this.parseInput(jsonText);
            const palette = this.validatePalette(data);
            const uniqueName = this.generateUniqueName(name);

            this.palettes[uniqueName] = palette;
            this.savePalettes();
            this.renderPalettes();
            this.updatePaletteSelectors();
            this.hideJsonImportModal();

            // Auto-apply the new palette
            this.applyPalette(uniqueName);
        } catch (error) {
            this.showError('Fehler beim Import', error.message);
        }
    }

    showCreatePaletteModal() {
        this.generateColorInputs();
        document.getElementById('newPaletteNameInput').value = '';
        document.getElementById('createPaletteModal').classList.remove('hidden');
        document.getElementById('newPaletteNameInput').focus();
    }

    hideCreatePaletteModal() {
        document.getElementById('createPaletteModal').classList.add('hidden');
    }

    generateColorInputs() {
        const container = document.getElementById('colorInputs');
        const colorKeys = [
            { key: 'primary', label: 'Primary', default: '#667eea' },
            { key: 'primaryLight', label: 'Primary Light', default: '#8b9cff' },
            { key: 'primaryDark', label: 'Primary Dark', default: '#4f63d2' },
            { key: 'secondary', label: 'Secondary', default: '#764ba2' },
            { key: 'secondaryLight', label: 'Secondary Light', default: '#9d6cc8' },
            { key: 'secondaryDark', label: 'Secondary Dark', default: '#5a3a7d' },
            { key: 'accent', label: 'Accent', default: '#10b981' },
            { key: 'success', label: 'Success', default: '#059669' },
            { key: 'warning', label: 'Warning', default: '#f59e0b' },
            { key: 'error', label: 'Error', default: '#dc2626' },
            { key: 'info', label: 'Info', default: '#0ea5e9' },
            { key: 'background', label: 'Background', default: '#f8fafc' },
            { key: 'surface', label: 'Surface', default: '#ffffff' },
            { key: 'elevatedSurface', label: 'Elevated Surface', default: '#ffffff' },
            { key: 'textPrimary', label: 'Text Primary', default: '#1e293b' },
            { key: 'textSecondary', label: 'Text Secondary', default: '#64748b' },
            { key: 'textDisabled', label: 'Text Disabled', default: '#94a3b8' },
            { key: 'link', label: 'Link', default: '#667eea' },
            { key: 'gray50', label: 'Gray 50', default: '#f9fafb' },
            { key: 'gray100', label: 'Gray 100', default: '#f3f4f6' },
            { key: 'gray200', label: 'Gray 200', default: '#e5e7eb' },
            { key: 'gray300', label: 'Gray 300', default: '#d1d5db' },
            { key: 'gray400', label: 'Gray 400', default: '#9ca3af' },
            { key: 'gray500', label: 'Gray 500', default: '#6b7280' },
            { key: 'gray600', label: 'Gray 600', default: '#4b5563' },
            { key: 'gray700', label: 'Gray 700', default: '#374151' },
            { key: 'gray800', label: 'Gray 800', default: '#1f2937' },
            { key: 'gray900', label: 'Gray 900', default: '#111827' }
        ];

        container.innerHTML = '';

        colorKeys.forEach(({ key, label, default: defaultValue }) => {
            const div = document.createElement('div');
            div.className = 'flex flex-col space-y-1';
            div.innerHTML = `
                <label class="text-sm font-medium text-gray-700">${label}</label>
                <div class="flex items-center space-x-2">
                    <input type="color" id="color-${key}" value="${defaultValue}" class="w-12 h-8 rounded border border-gray-300">
                    <input type="text" id="text-${key}" value="${defaultValue}" class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono">
                </div>
            `;
            container.appendChild(div);

            // Sync color picker and text input
            const colorInput = div.querySelector(`#color-${key}`);
            const textInput = div.querySelector(`#text-${key}`);

            colorInput.addEventListener('change', () => {
                textInput.value = colorInput.value;
            });

            textInput.addEventListener('input', () => {
                if (this.isValidColor(textInput.value)) {
                    colorInput.value = textInput.value;
                }
            });
        });
    }

    handleCreatePalette() {
        const name = document.getElementById('newPaletteNameInput').value.trim();

        if (!name) {
            this.showError('Fehler beim Erstellen', 'Bitte geben Sie einen Namen für die Palette ein.');
            return;
        }

        const palette = {};
        const requiredKeys = [
            'primary', 'primaryLight', 'primaryDark',
            'secondary', 'secondaryLight', 'secondaryDark',
            'accent', 'success', 'warning', 'error', 'info',
            'background', 'surface', 'elevatedSurface',
            'textPrimary', 'textSecondary', 'textDisabled',
            'link',
            'gray50', 'gray100', 'gray200', 'gray300',
            'gray400', 'gray500', 'gray600', 'gray700', 'gray800', 'gray900'
        ];

        try {
            requiredKeys.forEach(key => {
                const textInput = document.getElementById(`text-${key}`);
                const value = textInput.value.trim();

                if (!this.isValidColor(value)) {
                    throw new Error(`Ungültige Farbe für ${key}: ${value}`);
                }

                palette[key] = value;
            });

            const uniqueName = this.generateUniqueName(name);
            this.palettes[uniqueName] = palette;
            this.savePalettes();
            this.renderPalettes();
            this.updatePaletteSelectors();
            this.hideCreatePaletteModal();

            // Auto-apply the new palette
            this.applyPalette(uniqueName);
        } catch (error) {
            this.showError('Fehler beim Erstellen', error.message);
        }
    }

    parseInput(inputText) {
        // Try to parse as regular JSON first
        try {
            return JSON.parse(inputText);
        } catch (jsonError) {
            // If JSON parsing fails, try to parse as JavaScript const object
            try {
                return this.parseJavaScriptObject(inputText);
            } catch (jsError) {
                // If both fail, throw a more helpful error
                throw new Error('Ungültiges Format. Bitte verwenden Sie entweder JSON oder JavaScript const Syntax.\n\nJSON Fehler: ' + jsonError.message + '\nJavaScript Fehler: ' + jsError.message);
            }
        }
    }

    parseJavaScriptObject(inputText) {
        let cleanedText = inputText.trim();

        // Remove 'const' declaration and variable name
        cleanedText = cleanedText.replace(/^const\s+\w+\s*=\s*/, '');
        
        // Remove trailing semicolon
        cleanedText = cleanedText.replace(/;?\s*$/, '');

        // Convert JavaScript object syntax to JSON
        // Handle unquoted keys by wrapping them in quotes
        cleanedText = cleanedText.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

        try {
            return JSON.parse(cleanedText);
        } catch (error) {
            throw new Error('Ungültiges JavaScript Object Format: ' + error.message);
        }
    }

    validatePalette(data) {
        const requiredKeys = [
            'primary', 'primaryLight', 'primaryDark',
            'secondary', 'secondaryLight', 'secondaryDark',
            'accent', 'success', 'warning', 'error', 'info',
            'background', 'surface', 'elevatedSurface',
            'textPrimary', 'textSecondary', 'textDisabled',
            'link',
            'gray50', 'gray100', 'gray200', 'gray300',
            'gray400', 'gray500', 'gray600', 'gray700', 'gray800', 'gray900'
        ];

        const missing = [];
        const invalid = [];

        for (const key of requiredKeys) {
            if (!(key in data)) {
                missing.push(key);
            } else if (!this.isValidColor(data[key])) {
                invalid.push(key);
            }
        }

        if (missing.length > 0 || invalid.length > 0) {
            let errorMsg = '';
            if (missing.length > 0) {
                errorMsg += `Fehlende Schlüssel: ${missing.join(', ')}\n`;
            }
            if (invalid.length > 0) {
                errorMsg += `Ungültige Farben: ${invalid.join(', ')}`;
            }
            throw new Error(errorMsg);
        }

        return data;
    }

    isValidColor(color) {
        if (typeof color !== 'string') return false;

        // Check hex colors
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) return true;

        // Check named colors and other CSS colors
        const testElement = document.createElement('div');
        testElement.style.color = color;
        return testElement.style.color !== '';
    }

    generateUniqueName(baseName) {
        if (!this.palettes[baseName]) return baseName;

        let counter = 1;
        while (this.palettes[`${baseName}-${counter}`]) {
            counter++;
        }
        return `${baseName}-${counter}`;
    }

    loadDefaultPalettes() {
        // Only load if no palettes exist
        if (Object.keys(this.palettes).length === 0) {
            this.palettes = {
                'New Work Blue': {
                    primary: '#667eea',
                    primaryLight: '#8b9cff',
                    primaryDark: '#4f63d2',
                    secondary: '#764ba2',
                    secondaryLight: '#9d6cc8',
                    secondaryDark: '#5a3a7d',
                    accent: '#10b981',
                    success: '#059669',
                    warning: '#f59e0b',
                    error: '#dc2626',
                    info: '#0ea5e9',
                    background: '#f8fafc',
                    surface: '#ffffff',
                    elevatedSurface: '#ffffff',
                    textPrimary: '#1e293b',
                    textSecondary: '#64748b',
                    textDisabled: '#94a3b8',
                    link: '#667eea',
                    gray50: '#f9fafb',
                    gray100: '#f3f4f6',
                    gray200: '#e5e7eb',
                    gray300: '#d1d5db',
                    gray400: '#9ca3af',
                    gray500: '#6b7280',
                    gray600: '#4b5563',
                    gray700: '#374151',
                    gray800: '#1f2937',
                    gray900: '#111827'
                },
                'Calm Green': {
                    primary: '#059669',
                    primaryLight: '#34d399',
                    primaryDark: '#047857',
                    secondary: '#0d9488',
                    secondaryLight: '#5eead4',
                    secondaryDark: '#0f766e',
                    accent: '#f59e0b',
                    success: '#059669',
                    warning: '#f59e0b',
                    error: '#dc2626',
                    info: '#0ea5e9',
                    background: '#f0fdf4',
                    surface: '#ffffff',
                    elevatedSurface: '#f7fee7',
                    textPrimary: '#1e293b',
                    textSecondary: '#64748b',
                    textDisabled: '#94a3b8',
                    link: '#059669',
                    gray50: '#f9fafb',
                    gray100: '#f3f4f6',
                    gray200: '#e5e7eb',
                    gray300: '#d1d5db',
                    gray400: '#9ca3af',
                    gray500: '#6b7280',
                    gray600: '#4b5563',
                    gray700: '#374151',
                    gray800: '#1f2937',
                    gray900: '#111827'
                },
                'Vivid Coral': {
                    primary: '#f43f5e',
                    primaryLight: '#fb7185',
                    primaryDark: '#e11d48',
                    secondary: '#ec4899',
                    secondaryLight: '#f472b6',
                    secondaryDark: '#db2777',
                    accent: '#8b5cf6',
                    success: '#059669',
                    warning: '#f59e0b',
                    error: '#dc2626',
                    info: '#0ea5e9',
                    background: '#fef2f2',
                    surface: '#ffffff',
                    elevatedSurface: '#fff1f2',
                    textPrimary: '#1e293b',
                    textSecondary: '#64748b',
                    textDisabled: '#94a3b8',
                    link: '#f43f5e',
                    gray50: '#f9fafb',
                    gray100: '#f3f4f6',
                    gray200: '#e5e7eb',
                    gray300: '#d1d5db',
                    gray400: '#9ca3af',
                    gray500: '#6b7280',
                    gray600: '#4b5563',
                    gray700: '#374151',
                    gray800: '#1f2937',
                    gray900: '#111827'
                }
            };
            this.savePalettes();
        }
    }

    renderPalettes() {
        const container = document.getElementById('paletteList');
        container.innerHTML = '';

        for (const [name, palette] of Object.entries(this.palettes)) {
            const paletteEl = this.createPaletteElement(name, palette);
            container.appendChild(paletteEl);
        }

        this.updatePaletteSelectors();
    }

    createPaletteElement(name, palette) {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow';

        div.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                    <div class="w-4 h-4 rounded" style="background-color: ${palette.primary}"></div>
                    <span class="font-medium text-sm">${name}</span>
                </div>
                <div class="flex items-center space-x-1">
                    <button class="apply-btn text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary-dark" data-name="${name}">
                        Anwenden
                    </button>
                    <div class="relative">
                        <button class="menu-btn text-gray-400 hover:text-gray-600 p-1" data-name="${name}">⋮</button>
                        <div class="menu-dropdown hidden absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 text-xs">
                            <button class="compare-btn block w-full text-left px-3 py-2 hover:bg-gray-100" data-name="${name}">Vergleichen</button>
                            <button class="rename-btn block w-full text-left px-3 py-2 hover:bg-gray-100" data-name="${name}">Umbenennen</button>
                            <button class="duplicate-btn block w-full text-left px-3 py-2 hover:bg-gray-100" data-name="${name}">Duplizieren</button>
                            <button class="export-btn block w-full text-left px-3 py-2 hover:bg-gray-100" data-name="${name}">Exportieren</button>
                            <button class="delete-btn block w-full text-left px-3 py-2 hover:bg-gray-100 text-error" data-name="${name}">Löschen</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex space-x-1">
                <div class="w-3 h-3 rounded" style="background-color: ${palette.secondary}"></div>
                <div class="w-3 h-3 rounded" style="background-color: ${palette.accent}"></div>
                <div class="w-3 h-3 rounded" style="background-color: ${palette.success}"></div>
                <div class="w-3 h-3 rounded" style="background-color: ${palette.warning}"></div>
                <div class="w-3 h-3 rounded" style="background-color: ${palette.error}"></div>
            </div>
        `;

        // Event listeners
        div.querySelector('.apply-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.applyPalette(name);
        });

        div.querySelector('.menu-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu(e.target);
        });

        div.querySelector('.compare-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.startComparison(name);
            this.closeAllMenus();
        });

        div.querySelector('.rename-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showRenameModal(name);
            this.closeAllMenus();
        });

        div.querySelector('.duplicate-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.duplicatePalette(name);
            this.closeAllMenus();
        });

        div.querySelector('.export-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.exportPalette(name);
            this.closeAllMenus();
        });

        div.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Palette "${name}" wirklich löschen?`)) {
                this.deletePalette(name);
            }
            this.closeAllMenus();
        });

        return div;
    }

    toggleMenu(button) {
        this.closeAllMenus();
        const menu = button.nextElementSibling;
        menu.classList.toggle('hidden');
    }

    closeAllMenus() {
        document.querySelectorAll('.menu-dropdown').forEach(menu => {
            menu.classList.add('hidden');
        });
    }

    applyPalette(name) {
        this.currentPaletteA = name;
        localStorage.setItem('paletteLab.activeA', name);

        if (!this.compareMode) {
            this.applyPaletteToDocument(this.palettes[name]);
            // Apply palette to single demo frame when not in comparison mode
            this.applyPaletteToSingleFrame(name);
        }

        this.applyPaletteToFrame('A');
        this.updateContrastResults();

        // Update selector
        document.getElementById('paletteA').value = name;
    }

    startComparison(name) {
        if (!this.compareMode) {
            document.getElementById('compareMode').checked = true;
            this.compareMode = true;
            localStorage.setItem('paletteLab.compareMode', 'true');
            this.updateCompareMode();
        }

        if (!this.currentPaletteA) {
            this.currentPaletteA = name;
            localStorage.setItem('paletteLab.activeA', name);
            document.getElementById('paletteA').value = name;
            this.applyPaletteToFrame('A');
        } else if (!this.currentPaletteB) {
            this.currentPaletteB = name;
            localStorage.setItem('paletteLab.activeB', name);
            document.getElementById('paletteB').value = name;
            this.applyPaletteToFrame('B');
        } else {
            this.currentPaletteB = name;
            localStorage.setItem('paletteLab.activeB', name);
            document.getElementById('paletteB').value = name;
            this.applyPaletteToFrame('B');
        }

        this.updateContrastResults();
    }

    showRenameModal(name) {
        this.currentRenameId = name;
        document.getElementById('renameInput').value = name;
        document.getElementById('renameModal').classList.remove('hidden');
        document.getElementById('renameInput').focus();
        document.getElementById('renameInput').select();
    }

    hideRenameModal() {
        document.getElementById('renameModal').classList.add('hidden');
        this.currentRenameId = null;
    }

    confirmRename() {
        const newName = document.getElementById('renameInput').value.trim();
        if (!newName || newName === this.currentRenameId) {
            this.hideRenameModal();
            return;
        }

        if (this.palettes[newName]) {
            alert('Eine Palette mit diesem Namen existiert bereits.');
            return;
        }

        // Rename palette
        this.palettes[newName] = this.palettes[this.currentRenameId];
        delete this.palettes[this.currentRenameId];

        // Update active palette references
        if (this.currentPaletteA === this.currentRenameId) {
            this.currentPaletteA = newName;
            localStorage.setItem('paletteLab.activeA', newName);
        }
        if (this.currentPaletteB === this.currentRenameId) {
            this.currentPaletteB = newName;
            localStorage.setItem('paletteLab.activeB', newName);
        }

        this.savePalettes();
        this.renderPalettes();
        this.hideRenameModal();
    }

    duplicatePalette(name) {
        const newName = this.generateUniqueName(`${name} Kopie`);
        this.palettes[newName] = { ...this.palettes[name] };
        this.savePalettes();
        this.renderPalettes();
    }

    exportPalette(name) {
        const palette = this.palettes[name];
        const dataStr = JSON.stringify(palette, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${name}.json`;
        link.click();
    }

    deletePalette(name) {
        delete this.palettes[name];

        // Clear active references
        if (this.currentPaletteA === name) {
            this.currentPaletteA = '';
            localStorage.setItem('paletteLab.activeA', '');
        }
        if (this.currentPaletteB === name) {
            this.currentPaletteB = '';
            localStorage.setItem('paletteLab.activeB', '');
        }

        this.savePalettes();
        this.renderPalettes();
        this.updateContrastResults();
    }

    filterPalettes(searchTerm) {
        const paletteElements = document.querySelectorAll('#paletteList > div');
        paletteElements.forEach(el => {
            const name = el.querySelector('.font-medium').textContent.toLowerCase();
            if (name.includes(searchTerm.toLowerCase())) {
                el.style.display = 'block';
            } else {
                el.style.display = 'none';
            }
        });
    }

    updateDemoSelection() {
        document.getElementById('demoSelect').value = this.currentDemo;
        this.updateDemoFrames();
    }

    updateCompareMode() {
        document.getElementById('compareMode').checked = this.compareMode;

        if (this.compareMode) {
            document.getElementById('singleDemo').classList.add('hidden');
            document.getElementById('compareDemo').classList.remove('hidden');
            document.getElementById('compareControls').classList.remove('hidden');
        } else {
            document.getElementById('singleDemo').classList.remove('hidden');
            document.getElementById('compareDemo').classList.add('hidden');
            document.getElementById('compareControls').classList.add('hidden');
        }

        this.updateDemoFrames();
        this.setupScrollSync();
        
        // Reapply current palette when switching modes
        this.applyCurrentPalette();
    }

    updateDemoFrames() {
        const demoUrl = `demos/${this.currentDemo}.html`;

        if (this.compareMode) {
            document.getElementById('demoFrameA').src = demoUrl;
            document.getElementById('demoFrameB').src = demoUrl;
        } else {
            document.getElementById('demoFrame').src = demoUrl;
        }
    }

    setupScrollSync() {
        if (!this.compareMode) return;

        const frameA = document.getElementById('demoFrameA');
        const frameB = document.getElementById('demoFrameB');

        let syncing = false;

        const syncScroll = (source, target) => {
            if (syncing) return;
            syncing = true;

            try {
                const sourceDoc = source.contentDocument;
                const targetDoc = target.contentDocument;

                if (sourceDoc && targetDoc) {
                    targetDoc.documentElement.scrollTop = sourceDoc.documentElement.scrollTop;
                    targetDoc.documentElement.scrollLeft = sourceDoc.documentElement.scrollLeft;
                }
            } catch (e) {
                // Ignore cross-origin errors
            }

            setTimeout(() => { syncing = false; }, 10);
        };

        frameA.onload = () => {
            try {
                frameA.contentWindow.addEventListener('scroll', () => syncScroll(frameA, frameB));
            } catch (e) {
                // Ignore cross-origin errors
            }
        };

        frameB.onload = () => {
            try {
                frameB.contentWindow.addEventListener('scroll', () => syncScroll(frameB, frameA));
            } catch (e) {
                // Ignore cross-origin errors
            }
        };
    }

    updatePaletteSelectors() {
        const selectA = document.getElementById('paletteA');
        const selectB = document.getElementById('paletteB');

        // Clear current options (except first)
        selectA.innerHTML = '<option value="">Palette A wählen</option>';
        selectB.innerHTML = '<option value="">Palette B wählen</option>';

        // Add palette options
        for (const name of Object.keys(this.palettes)) {
            const optionA = new Option(name, name);
            const optionB = new Option(name, name);
            selectA.appendChild(optionA);
            selectB.appendChild(optionB);
        }

        // Set current values
        selectA.value = this.currentPaletteA;
        selectB.value = this.currentPaletteB;
    }

    applyCurrentPalette() {
        if (this.currentPaletteA && this.palettes[this.currentPaletteA]) {
            this.applyPaletteToDocument(this.palettes[this.currentPaletteA]);
            
            if (!this.compareMode) {
                // Apply palette to single demo frame when not in comparison mode
                this.applyPaletteToSingleFrame(this.currentPaletteA);
            }
        }
    }

    applyPaletteToDocument(palette) {
        let styleEl = document.getElementById('active-palette');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'active-palette';
            document.head.appendChild(styleEl);
        }

        const cssVars = this.generateCSSVariables(palette);
        styleEl.textContent = `:root { ${cssVars} }`;
    }

    applyPaletteToFrame(frame) {
        const paletteName = frame === 'A' ? this.currentPaletteA : this.currentPaletteB;
        if (!paletteName || !this.palettes[paletteName]) return;

        const palette = this.palettes[paletteName];
        const frameEl = document.getElementById(`demoFrame${frame}`);

        frameEl.onload = () => {
            try {
                const frameDoc = frameEl.contentDocument;
                if (!frameDoc) return;

                let styleEl = frameDoc.getElementById('active-palette');
                if (!styleEl) {
                    styleEl = frameDoc.createElement('style');
                    styleEl.id = 'active-palette';
                    frameDoc.head.appendChild(styleEl);
                }

                const cssVars = this.generateCSSVariables(palette);
                styleEl.textContent = `:root { ${cssVars} }`;
            } catch (e) {
                console.warn('Could not apply palette to frame:', e);
            }
        };

        // Trigger reload if already loaded
        if (frameEl.src) {
            frameEl.src = frameEl.src;
        }
    }

    applyPaletteToSingleFrame(paletteName) {
        if (!paletteName || !this.palettes[paletteName]) return;

        const palette = this.palettes[paletteName];
        const frameEl = document.getElementById('demoFrame');

        frameEl.onload = () => {
            try {
                const frameDoc = frameEl.contentDocument;
                if (!frameDoc) return;

                let styleEl = frameDoc.getElementById('active-palette');
                if (!styleEl) {
                    styleEl = frameDoc.createElement('style');
                    styleEl.id = 'active-palette';
                    frameDoc.head.appendChild(styleEl);
                }

                const cssVars = this.generateCSSVariables(palette);
                styleEl.textContent = `:root { ${cssVars} }`;
            } catch (e) {
                console.warn('Could not apply palette to single demo frame:', e);
            }
        };

        // Trigger reload if already loaded
        if (frameEl.src) {
            frameEl.src = frameEl.src;
        }
    }

    generateCSSVariables(palette) {
        return `
            --color-primary: ${palette.primary};
            --color-primary-light: ${palette.primaryLight};
            --color-primary-dark: ${palette.primaryDark};
            --color-secondary: ${palette.secondary};
            --color-secondary-light: ${palette.secondaryLight};
            --color-secondary-dark: ${palette.secondaryDark};
            --color-accent: ${palette.accent};
            --color-success: ${palette.success};
            --color-warning: ${palette.warning};
            --color-error: ${palette.error};
            --color-info: ${palette.info};
            --color-bg: ${palette.background};
            --color-surface: ${palette.surface};
            --color-elevated: ${palette.elevatedSurface};
            --color-text: ${palette.textPrimary};
            --color-text-2: ${palette.textSecondary};
            --color-text-disabled: ${palette.textDisabled};
            --color-link: ${palette.link};
            --gray-50: ${palette.gray50};
            --gray-100: ${palette.gray100};
            --gray-200: ${palette.gray200};
            --gray-300: ${palette.gray300};
            --gray-400: ${palette.gray400};
            --gray-500: ${palette.gray500};
            --gray-600: ${palette.gray600};
            --gray-700: ${palette.gray700};
            --gray-800: ${palette.gray800};
            --gray-900: ${palette.gray900};
        `.replace(/\s+/g, ' ').trim();
    }

    copyComparisonLink() {
        const url = new URL(window.location);
        url.searchParams.set('demo', this.currentDemo);
        if (this.currentPaletteA) url.searchParams.set('left', this.currentPaletteA);
        if (this.currentPaletteB) url.searchParams.set('right', this.currentPaletteB);

        navigator.clipboard.writeText(url.toString()).then(() => {
            alert('Link in Zwischenablage kopiert!');
        }).catch(() => {
            prompt('Link kopieren:', url.toString());
        });
    }

    updateContrastResults() {
        const container = document.getElementById('contrastResults');
        container.innerHTML = '';

        const palette = this.palettes[this.currentPaletteA];
        if (!palette) {
            container.innerHTML = '<p class="text-sm text-text-secondary">Keine Palette ausgewählt</p>';
            return;
        }

        const checks = [
            { name: 'Text Primary auf Background', fg: palette.textPrimary, bg: palette.background },
            { name: 'Text Primary auf Surface', fg: palette.textPrimary, bg: palette.surface },
            { name: 'Text Primary auf Elevated', fg: palette.textPrimary, bg: palette.elevatedSurface },
            { name: 'Text Secondary auf Background', fg: palette.textSecondary, bg: palette.background },
            { name: 'Link auf Background', fg: palette.link, bg: palette.background },
            { name: 'Primary Button (weiß)', fg: '#ffffff', bg: palette.primary },
            { name: 'Primary Button (text)', fg: palette.textPrimary, bg: palette.primary },
            { name: 'Secondary Button (weiß)', fg: '#ffffff', bg: palette.secondary },
            { name: 'Secondary Button (text)', fg: palette.textPrimary, bg: palette.secondary },
            { name: 'Accent Button (weiß)', fg: '#ffffff', bg: palette.accent },
            { name: 'Accent Button (text)', fg: palette.textPrimary, bg: palette.accent }
        ];

        checks.forEach(check => {
            const ratio = this.getContrastRatio(check.fg, check.bg);
            const status = this.getContrastStatus(ratio);

            const div = document.createElement('div');
            div.className = `p-2 rounded text-xs border-l-4 ${this.getStatusColor(status)}`;
            div.innerHTML = `
                <div class="font-medium">${check.name}</div>
                <div class="text-xs opacity-75">Kontrast: ${ratio.toFixed(2)}:1 (${status})</div>
            `;
            container.appendChild(div);
        });
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    getContrastRatio(fg, bg) {
        const fgRgb = this.hexToRgb(fg);
        const bgRgb = this.hexToRgb(bg);

        if (!fgRgb || !bgRgb) return 1;

        const fgLum = this.getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
        const bgLum = this.getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

        const lighter = Math.max(fgLum, bgLum);
        const darker = Math.min(fgLum, bgLum);

        return (lighter + 0.05) / (darker + 0.05);
    }

    getContrastStatus(ratio) {
        if (ratio >= 7) return 'AAA';
        if (ratio >= 4.5) return 'AA';
        if (ratio >= 3) return 'AA Large';
        return 'Fail';
    }

    getStatusColor(status) {
        switch (status) {
            case 'AAA': return 'border-success bg-success/10';
            case 'AA': return 'border-success bg-success/10';
            case 'AA Large': return 'border-warning bg-warning/10';
            default: return 'border-error bg-error/10';
        }
    }

    toggleWcagPanel() {
        this.wcagPanelVisible = !this.wcagPanelVisible;
        localStorage.setItem('paletteLab.wcagVisible', this.wcagPanelVisible);
        this.updateWcagPanel();
    }

    updateWcagPanel() {
        const panel = document.getElementById('contrastPanel');
        const toggleBtn = document.getElementById('wcagToggleBtn');
        
        if (this.wcagPanelVisible) {
            panel.classList.remove('hidden');
            toggleBtn.classList.add('bg-primary', 'text-white');
            toggleBtn.classList.remove('bg-white', 'border-gray-300');
            toggleBtn.title = 'WCAG Kontrast-Check ausblenden';
        } else {
            panel.classList.add('hidden');
            toggleBtn.classList.remove('bg-primary', 'text-white');
            toggleBtn.classList.add('bg-white', 'border-gray-300');
            toggleBtn.title = 'WCAG Kontrast-Check einblenden';
        }
    }

    showError(title, message) {
        document.getElementById('errorContent').innerHTML = `
            <h4 class="font-medium mb-2">${title}</h4>
            <pre class="bg-gray-100 p-2 rounded text-xs overflow-auto">${message}</pre>
        `;
        document.getElementById('errorModal').classList.remove('hidden');
    }

    hideErrorModal() {
        document.getElementById('errorModal').classList.add('hidden');
    }
}

// Close menus when clicking outside
document.addEventListener('click', () => {
    if (window.paletteLab) {
        window.paletteLab.closeAllMenus();
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.paletteLab = new PaletteLab();

    // Handle URL parameters
    const params = new URLSearchParams(window.location.search);
    if (params.has('demo')) {
        window.paletteLab.currentDemo = params.get('demo');
        localStorage.setItem('paletteLab.demo', window.paletteLab.currentDemo);
        window.paletteLab.updateDemoSelection();
    }
    if (params.has('left')) {
        window.paletteLab.currentPaletteA = params.get('left');
        localStorage.setItem('paletteLab.activeA', window.paletteLab.currentPaletteA);
    }
    if (params.has('right')) {
        window.paletteLab.currentPaletteB = params.get('right');
        localStorage.setItem('paletteLab.activeB', window.paletteLab.currentPaletteB);
        window.paletteLab.compareMode = true;
        localStorage.setItem('paletteLab.compareMode', 'true');
    }

    if (params.has('left') || params.has('right')) {
        window.paletteLab.updateCompareMode();
        window.paletteLab.updatePaletteSelectors();
    }
});