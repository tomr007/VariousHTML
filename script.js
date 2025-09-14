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

        // File input change
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });

        // Modal events
        closeModal.addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        deletePageBtn.addEventListener('click', () => this.deletePage());

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
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
        uploadStatus.style.display = 'block';
        uploadStatus.className = 'upload-status';
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
        card.className = 'page-card';
        card.onclick = () => this.openPage(page.id);

        const uploadDate = new Date(page.uploadDate).toLocaleDateString('de-DE');
        const fileSize = this.formatFileSize(page.size);

        card.innerHTML = `
            <h3>${page.name}</h3>
            <div class="page-info">
                <span>📅 ${uploadDate}</span>
                <span>📊 ${fileSize}</span>
            </div>
            <div class="page-preview">
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
        modal.style.display = 'block';

        // Cleanup der Blob URL nach dem Schließen
        pageFrame.onload = () => {
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        };
    }

    closeModal() {
        const modal = document.getElementById('pageModal');
        const pageFrame = document.getElementById('pageFrame');
        
        modal.style.display = 'none';
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
        uploadStatus.style.display = 'block';
        uploadStatus.className = `upload-status ${type}`;
        uploadStatus.innerHTML = `<div>${message}</div>`;

        setTimeout(() => {
            uploadStatus.style.display = 'none';
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
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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