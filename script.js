class HTMLPageManager {
    constructor() {
        this.pages = this.loadPages();
        this.currentPageId = null;
        this.initializeEventListeners();
        this.renderPages();
    }

    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const modal = document.getElementById('pageModal');
        const closeModal = document.getElementById('closeModal');
        const deletePageBtn = document.getElementById('deletePageBtn');
        const uiDefBtn = document.getElementById('uiDefBtn');
        const paletteLabBtn = document.getElementById('paletteLabBtn');

        // File input change
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('bg-secondary/20', 'border-secondary', 'scale-105');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('bg-secondary/20', 'border-secondary', 'scale-105');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('bg-secondary/20', 'border-secondary', 'scale-105');
            this.handleFileUpload(e.dataTransfer.files);
        });

        // Modal events
        closeModal.addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        deletePageBtn.addEventListener('click', () => this.deletePage());

        // UI Definition button
        if (uiDefBtn) {
            uiDefBtn.addEventListener('click', () => {
                window.location.href = 'ui-definition.html';
            });
        }

        // Palette Lab button
        if (paletteLabBtn) {
            paletteLabBtn.addEventListener('click', () => {
                window.location.href = 'palette-lab.html';
            });
        }

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    async handleFileUpload(files) {
        const htmlFiles = Array.from(files).filter(file => 
            file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm')
        );

        if (htmlFiles.length === 0) {
            this.showStatus('Bitte wählen Sie nur HTML-Dateien aus.', 'error');
            return;
        }

        const uploadStatus = document.getElementById('uploadStatus');
        uploadStatus.classList.remove('hidden');
        uploadStatus.className = 'mt-6 p-4 rounded-xl bg-info/10 border border-info/20 text-info';
        uploadStatus.innerHTML = '<div>Dateien werden hochgeladen...</div>';

        let successCount = 0;
        let errorCount = 0;

        for (const file of htmlFiles) {
            try {
                await this.processFile(file);
                successCount++;
            } catch (error) {
                console.error('Fehler beim Verarbeiten der Datei:', error);
                errorCount++;
            }
        }

        // Status anzeigen
        if (errorCount === 0) {
            this.showStatus(`${successCount} Datei(en) erfolgreich hochgeladen!`, 'success');
        } else {
            this.showStatus(`${successCount} erfolgreich, ${errorCount} fehlgeschlagen`, 'error');
        }

        // Pages neu rendern
        this.renderPages();
        
        // File input zurücksetzen
        document.getElementById('fileInput').value = '';
    }

    async processFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const content = e.target.result;
                const pageId = this.generateId();
                
                const pageData = {
                    id: pageId,
                    name: file.name,
                    content: content,
                    size: file.size,
                    uploadDate: new Date().toISOString(),
                    lastModified: file.lastModified
                };

                this.pages[pageId] = pageData;
                this.savePages();
                resolve(pageData);
            };

            reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
            reader.readAsText(file);
        });
    }

    renderPages() {
        const pagesGrid = document.getElementById('pagesGrid');
        const noPages = document.getElementById('noPages');
        
        const pageIds = Object.keys(this.pages);
        
        if (pageIds.length === 0) {
            noPages.style.display = 'block';
            return;
        }

        noPages.style.display = 'none';
        
        // Bestehende Page Cards entfernen (außer noPages)
        const existingCards = pagesGrid.querySelectorAll('.page-card');
        existingCards.forEach(card => card.remove());

        pageIds.forEach(pageId => {
            const page = this.pages[pageId];
            const card = this.createPageCard(page);
            pagesGrid.appendChild(card);
        });
    }

    createPageCard(page) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:-translate-y-2';
        card.onclick = () => this.openPage(page.id);

        const uploadDate = new Date(page.uploadDate).toLocaleDateString('de-DE');
        const fileSize = this.formatFileSize(page.size);

        card.innerHTML = `
            <h3 class="text-text-primary text-xl font-semibold mb-3 break-words">${page.name}</h3>
            <div class="flex justify-between items-center mb-4 text-sm text-text-secondary">
                <span>📅 ${uploadDate}</span>
                <span>📊 ${fileSize}</span>
            </div>
            <div class="w-full h-28 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center text-text-secondary text-sm">
                <span>HTML Seite - Klicken zum Öffnen</span>
            </div>
        `;

        return card;
    }

    openPage(pageId) {
        const page = this.pages[pageId];
        if (!page) return;

        this.currentPageId = pageId;
        
        const modal = document.getElementById('pageModal');
        const modalTitle = document.getElementById('modalTitle');
        const pageFrame = document.getElementById('pageFrame');

        modalTitle.textContent = page.name;
        
        // Blob URL für sicheres Laden der HTML-Seite erstellen
        const blob = new Blob([page.content], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        
        pageFrame.src = blobUrl;
        modal.classList.remove('hidden');

        // Cleanup der Blob URL nach dem Schließen
        pageFrame.onload = () => {
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        };
    }

    closeModal() {
        const modal = document.getElementById('pageModal');
        const pageFrame = document.getElementById('pageFrame');

        modal.classList.add('hidden');
        pageFrame.src = '';
        this.currentPageId = null;
    }

    deletePage() {
        if (!this.currentPageId) return;

        const page = this.pages[this.currentPageId];
        const confirmed = confirm(`Möchten Sie die Seite "${page.name}" wirklich löschen?`);
        
        if (confirmed) {
            delete this.pages[this.currentPageId];
            this.savePages();
            this.closeModal();
            this.renderPages();
            this.showStatus('Seite erfolgreich gelöscht!', 'success');
        }
    }

    showStatus(message, type) {
        const uploadStatus = document.getElementById('uploadStatus');
        uploadStatus.classList.remove('hidden');

        if (type === 'success') {
            uploadStatus.className = 'mt-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success';
        } else if (type === 'error') {
            uploadStatus.className = 'mt-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error';
        }

        uploadStatus.innerHTML = `<div>${message}</div>`;

        setTimeout(() => {
            uploadStatus.classList.add('hidden');
        }, 3000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    loadPages() {
        try {
            const saved = localStorage.getItem('htmlPageManager_pages');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Fehler beim Laden der Seiten:', error);
            return {};
        }
    }

    savePages() {
        try {
            localStorage.setItem('htmlPageManager_pages', JSON.stringify(this.pages));
        } catch (error) {
            console.error('Fehler beim Speichern der Seiten:', error);
        }
    }
}

// App initialisieren
document.addEventListener('DOMContentLoaded', () => {
    new HTMLPageManager();
});