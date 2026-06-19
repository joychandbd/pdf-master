import { initHeaderFooter, getHeaderFooterData } from './features/header-footer.js';
import { initLogoWatermark, getLogoWatermarkData } from './features/logo-watermark.js';
import { renderPreviews, clearPreviews, uploadedFiles } from './features/preview.js';

document.addEventListener('DOMContentLoaded', () => {
    // App Engine States
    initTheme();
    initHeaderFooter();
    initLogoWatermark();
    setupDragAndDrop();

    // DOM bindings
    const btnProcess = document.getElementById('btn-process');
    const btnReset = document.getElementById('btn-reset');
    const fileInput = document.getElementById('file-input');

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    btnProcess.addEventListener('click', processPDFs);
    btnReset.addEventListener('click', resetApp);
});

function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    toggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        document.body.classList.toggle('dark-theme');
    });
}

function setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    
    dropZone.addEventListener('click', () => document.getElementById('file-input').click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });
}

function handleFiles(files) {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf');
    if(pdfFiles.length === 0) return;

    renderPreviews(pdfFiles);
    document.getElementById('btn-process').disabled = false;
}

async function processPDFs() {
    const statusContainer = document.getElementById('status-container');
    const progressBar = document.getElementById('progress-bar');
    const statusMessage = document.getElementById('status-message');
    
    statusContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    
    const paperSize = document.getElementById('paper-size').value;
    const orientation = document.querySelector('input[name="orientation"]:checked').value;
    
    const hfData = getHeaderFooterData();
    const lwData = getLogoWatermarkData();

    // Map Dimensions in Points (72 points = 1 inch)
    const sizes = {
        A4: [595.28, 841.89],
        A3: [841.89, 1190.55],
        A5: [419.53, 595.28],
        Letter: [612, 792],
        Legal: [612, 1008]
    };

    let targetDim = sizes[paperSize];
    if (orientation === 'landscape') {
        targetDim = [targetDim[1], targetDim[0]];
    }

    try {
        for (let i = 0; i < uploadedFiles.length; i++) {
            statusMessage.innerText = `প্রসেসিং ফাইল ${i+1}/${uploadedFiles.length}...`;
            progressBar.style.width = `${((i) / uploadedFiles.length) * 100}%`;

            const file = uploadedFiles[i];
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const outputDoc = await PDFLib.PDFDocument.create();

            // Load embeddable fonts if necessary (Standard Fonts Used for speed & offline)
            const helveticaFont = await outputDoc.embedFont(PDFLib.StandardFonts.Helvetica);

            // Handle Logo Embedding
            let embeddedLogo = null;
            if (lwData.logoBytes) {
                embeddedLogo = lwData.logoType === 'image/png' 
                    ? await outputDoc.embedPng(lwData.logoBytes)
                    : await outputDoc.embedJpg(lwData.logoBytes);
            }

            const pages = pdfDoc.getPages();
            const totalPages = pages.length;

            for (let p = 0; p < totalPages; p++) {
                const [copiedPage] = await outputDoc.copyPages(pdfDoc, [p]);
                const { width: origWidth, height: origHeight } = copiedPage.getSize();
                
                // Add page and scale it to targeted size
                const newPage = outputDoc.addPage(targetDim);
                const scaleX = targetDim[0] / origWidth;
                const scaleY = targetDim[1] / origHeight;
                const scale = Math.min(scaleX, scaleY);
                
                // Centered placement
                const xOffset = (targetDim[0] - origWidth * scale) / 2;
                const yOffset = (targetDim[1] - origHeight * scale) / 2;

                newPage.drawPage(copiedPage, {
                    x: xOffset, y: yOffset,
                    xScale: scale, yScale: scale
                });

                // Apply Header Text
                if (hfData.headerText) {
                    newPage.drawText(hfData.headerText, {
                        x: 30, y: targetDim[1] - 30,
                        size: 10, font: helveticaFont, color: PDFLib.rgb(0.5, 0.5, 0.5)
                    });
                }

                // Apply Footer Text
                if (hfData.footerText) {
                    const resolvedFooter = hfData.footerText
                        .replace('{page}', p + 1)
                        .replace('{total}', totalPages);
                    newPage.drawText(resolvedFooter, {
                        x: 30, y: 20,
                        size: 10, font: helveticaFont, color: PDFLib.rgb(0.5, 0.5, 0.5)
                    });
                }

                // Apply Logo & Watermarks
                if (embeddedLogo) {
                    const lSize = lwData.logoSize;
                    const dims = embeddedLogo.scaleToFit(lSize, lSize);

                    if (lwData.placement === 'header') {
                        newPage.drawImage(embeddedLogo, { x: targetDim[0] - dims.width - 30, y: targetDim[1] - dims.height - 20, width: dims.width, height: dims.height });
                    } else if (lwData.placement === 'footer') {
                        newPage.drawImage(embeddedLogo, { x: targetDim[0] - dims.width - 30, y: 15, width: dims.width, height: dims.height });
                    } else if (lwData.placement === 'watermark') {
                        newPage.drawImage(embeddedLogo, {
                            x: (targetDim[0]/2) - (dims.width/2),
                            y: (targetDim[1]/2) - (dims.height/2),
                            width: dims.width, height: dims.height,
                            opacity: lwData.opacity
                        });
                    }
                }
            }

            // Save and Trigger auto-download
            const finalPdfBytes = await outputDoc.save();
            const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `processed_${file.name}`;
            link.click();
        }

        progressBar.style.width = '100%';
        statusMessage.innerText = '✅ সব ফাইল প্রসেস সম্পন্ন হয়েছে!';
    } catch (err) {
        console.error(err);
        statusMessage.innerText = '❌ প্রসেস করতে ত্রুটি হয়েছে।';
    }
}

function resetApp() {
    clearPreviews();
    document.getElementById('status-container').classList.add('hidden');
    document.getElementById('btn-process').disabled = true;
    document.getElementById('file-input').value = '';
    
    // Dispatch local events to submodules to reset themselves
    window.dispatchEvent(new Event('app-reset'));
}

// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker Registered Successfully'))
            .catch(err => console.log('Service Worker Registration Failed', err));
    });
        }
                                
