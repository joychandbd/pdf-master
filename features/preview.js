export let uploadedFiles = [];

export async function renderPreviews(files) {
    const previewContainer = document.getElementById('preview-container');
    const previewGrid = document.getElementById('preview-grid');
    
    previewContainer.classList.remove('hidden');
    
    for(const file of files) {
        uploadedFiles.push(file);
        
        // Wrap preview card elements
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'preview-item';
        
        const canvas = document.createElement('canvas');
        const fileNameElement = document.createElement('p');
        fileNameElement.innerText = file.name;
        fileNameElement.title = file.name;
        
        itemWrapper.appendChild(canvas);
        itemWrapper.appendChild(fileNameElement);
        previewGrid.appendChild(itemWrapper);

        try {
            // Read and pass to PDFJS engine
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            // Extract page 1
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.3 }); // Small thumbnail factor
            
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

        } catch (error) {
            console.error("Error creating preview thumbnail for: ", file.name, error);
            // Render basic fallback icon placeholder in canvas if broken
            const ctx = canvas.getContext('2d');
            canvas.width = 100; canvas.height = 130;
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(0, 0, 100, 130);
            ctx.fillStyle = '#ffffff';
            ctx.fillText('PDF Error', 25, 65);
        }
    }
}

export function clearPreviews() {
    uploadedFiles = [];
    const previewGrid = document.getElementById('preview-grid');
    if (previewGrid) previewGrid.innerHTML = '';
    document.getElementById('preview-container').classList.add('hidden');
}
