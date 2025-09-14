class HTMLPageManager {
    constructor() {
        this.pages = this.loadPages();
        this.currentPage = null;
        this.initializeEventListeners();
        this.renderPageGrid();
    }

    initializeEventListeners() {
        // Upload area events
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));

        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Modal events
        const modal = document.getElementById('pageModal');
        const closeModal = document.getElementById('closeModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const deletePage = document.getElementById('deletePage');

        closeModal.addEventListener('click', () => this.closeModal());
        closeModalBtn.addEventListener('click', () => this.closeModal());
        deletePage.addEventListener('click', () => this.deleteCurrentPage());

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    async processFiles(files) {
        const htmlFiles = files.filter(file => 
            file.type === 'text/html' || 
            file.name.toLowerCase().endsWith('.html') || 
            file.name.toLowerCase().endsWith('.htm')
        );

        if (htmlFiles.length === 0) {
            this.showStatus('Bitte wählen Sie nur HTML-Dateien aus.', 'error');
            return;
        }

        this.showStatus('Dateien werden verarbeitet...', 'loading');

        try {
            for (const file of htmlFiles) {
                await this.uploadFile(file);
            }
            
            this.showStatus(
                `${htmlFiles.length} Datei(en) erfolgreich hochgeladen!`, 
                'success'
            );
            
            this.renderPageGrid();
            
            // Clear file input
            document.getElementById('fileInput').value = '';
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showStatus('Fehler beim Hochladen der Dateien.', 'error');
        }
    }

    async uploadFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const pageData = {
                        id: this.generateId(),
                        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                        filename: file.name,
                        content: content,
                        uploadDate: new Date().toISOString(),
                        size: file.size
                    };
                    
                    this.pages.push(pageData);
                    this.savePages();
                    resolve(pageData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
            reader.readAsText(file);
        });
    }

    showStatus(message, type) {
        const statusElement = document.getElementById('uploadStatus');
        statusElement.textContent = message;
        statusElement.className = `upload-status ${type}`;
        statusElement.style.display = 'block';

        if (type === 'loading') {
            statusElement.innerHTML = `<span class="loading"></span> ${message}`;
        }

        if (type !== 'loading') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }
    }

    renderPageGrid() {
        const pageGrid = document.getElementById('pageGrid');
        
        if (this.pages.length === 0) {
            pageGrid.innerHTML = `
                <div class="no-pages">
                    <p>Noch keine Seiten hochgeladen</p>
                </div>
            `;
            return;
        }

        pageGrid.innerHTML = this.pages.map(page => `
            <div class="page-card" onclick="pageManager.openPage('${page.id}')">
                <h3>${this.escapeHtml(page.name)}</h3>
                <p>Dateiname: ${this.escapeHtml(page.filename)}</p>
                <div class="page-meta">
                    <span>${this.formatFileSize(page.size)}</span>
                    <span>${this.formatDate(page.uploadDate)}</span>
                </div>
            </div>
        `).join('');
    }

    openPage(pageId) {
        const page = this.pages.find(p => p.id === pageId);
        if (!page) return;

        this.currentPage = page;
        
        // Create a blob URL for the HTML content
        const blob = new Blob([page.content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        document.getElementById('modalTitle').textContent = page.name;
        document.getElementById('pageFrame').src = url;
        document.getElementById('pageModal').style.display = 'block';
        
        // Clean up the blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    closeModal() {
        document.getElementById('pageModal').style.display = 'none';
        document.getElementById('pageFrame').src = '';
        this.currentPage = null;
    }

    deleteCurrentPage() {
        if (!this.currentPage) return;

        if (confirm(`Möchten Sie die Seite "${this.currentPage.name}" wirklich löschen?`)) {
            this.pages = this.pages.filter(p => p.id !== this.currentPage.id);
            this.savePages();
            this.renderPageGrid();
            this.closeModal();
            this.showStatus('Seite erfolgreich gelöscht.', 'success');
        }
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Storage methods
    loadPages() {
        try {
            const stored = localStorage.getItem('htmlPageManager_pages');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading pages:', error);
            return [];
        }
    }

    savePages() {
        try {
            localStorage.setItem('htmlPageManager_pages', JSON.stringify(this.pages));
        } catch (error) {
            console.error('Error saving pages:', error);
        }
    }
}

// Initialize the app
const pageManager = new HTMLPageManager();