const { PDFDocument, degrees, rgb } = PDFLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let files = [], logoFile = null;

const paperSizes = {
    a4: {w:595.276, h:841.89},
    a3: {w:841.89, h:1190.55},
    a5: {w:419.528, h:595.276},
    letter: {w:612, h:792},
    legal: {w:612, h:1008}
};

// Dark Mode
document.getElementById('darkMode').addEventListener('change', e => {
    document.body.classList.toggle('dark', e.target.checked);
});

// Logo Upload
document.getElementById('logoInput').addEventListener('change', e => {
    logoFile = e.target.files[0];
    if (logoFile) {
        const url = URL.createObjectURL(logoFile);
        document.getElementById('logoPreview').innerHTML = `<img src="${url}" style="max-height:85px; border-radius:6px;">`;
    }
});

// Slider values
document.getElementById('logoSize').addEventListener('input', e => {
    document.getElementById('logoSizeVal').textContent = e.target.value + '%';
});
document.getElementById('wmOpacity').addEventListener('input', e => {
    document.getElementById('wmOpacityVal').textContent = e.target.value + '%';
});

// Drag & Drop
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', e => handleFiles(e.target.files));

function handleFiles(newFiles) {
    files = [...newFiles].filter(f => f.type === 'application/pdf');
    if (files.length > 0) {
        document.getElementById('processBtn').disabled = false;
        generateThumbnails();
    }
}

async function generateThumbnails() {
    const previewDiv = document.getElementById('preview');
    previewDiv.innerHTML = '';
    for (let file of files) {
        try {
            const url = URL.createObjectURL(file);
            const pdf = await pdfjsLib.getDocument(url).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({scale: 0.75});
            const canvas = document.createElement('canvas');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({canvasContext: canvas.getContext('2d'), viewport}).promise;
            canvas.className = 'thumb';
            previewDiv.appendChild(canvas);
        } catch(e) {}
    }
}

// Main Process
document.getElementById('processBtn').addEventListener('click', async () => {
    if (!files.length) return;
    const btn = document.getElementById('processBtn');
    btn.disabled = true;
    const status = document.getElementById('status');
    const prog = document.getElementById('progressBar');

    status.textContent = 'প্রসেসিং চলছে... অনুগ্রহ করে অপেক্ষা করুন';
    prog.style.width = '0%';

    try {
        const newPdf = await PDFDocument.create();
        let logoEmbedded = null;
        if (logoFile) {
            const logoBytes = await logoFile.arrayBuffer();
            try { logoEmbedded = await newPdf.embedPng(logoBytes); }
            catch { logoEmbedded = await newPdf.embedJpg(logoBytes); }
        }

        for (let i = 0; i < files.length; i++) {
            const bytes = await files[i].arrayBuffer();
            const srcDoc = await PDFDocument.load(bytes);
            const srcPages = srcDoc.getPages();

            const sizeKey = document.getElementById('paperSize').value;
            let {w, h} = paperSizes[sizeKey];
            if (document.querySelector('input[name="orient"]:checked').value === 'landscape') [w, h] = [h, w];

            const headerText = document.getElementById('headerText').value.trim();
            const footerText = document.getElementById('footerText').value.trim();
            const logoPos = document.getElementById('logoPosition').value;
            const logoPercent = parseFloat(document.getElementById('logoSize').value) / 100;
            const opacity = parseFloat(document.getElementById('wmOpacity').value) / 100;

            for (let j = 0; j < srcPages.length; j++) {
                const embedded = await newPdf.embedPage(srcPages[j]);
                const newPage = newPdf.addPage([w, h]);
                const {width: ow, height: oh} = srcPages[j].getSize();

                const scale = Math.min((w - 60)/ow, (h - 100)/oh);
                const sw = ow * scale, sh = oh * scale;
                newPage.drawPage(embedded, {x: (w - sw)/2, y: (h - sh)/2 + 20, width: sw, height: sh});

                if (headerText) newPage.drawText(headerText, {x: 50, y: h - 45, size: 16, color: rgb(0, 0, 0)});
                if (footerText) {
                    const finalFooter = footerText.replace('{page}', j+1).replace('{total}', srcPages.length);
                    newPage.drawText(finalFooter, {x: 50, y: 35, size: 12, color: rgb(0.4, 0.4, 0.4)});
                }

                if (logoEmbedded) {
                    const logoW = w * logoPercent;
                    const logoH = logoW * (logoEmbedded.height / logoEmbedded.width);
                    let x = 50, y = h - 75;

                    if (logoPos === 'footer') y = 55;
                    if (logoPos === 'watermark') {
                        x = (w - logoW) / 2;
                        y = (h - logoH) / 2;
                        newPage.drawImage(logoEmbedded, {x, y, width: logoW, height: logoH, opacity: opacity, rotate: degrees(35)});
                    } else {
                        newPage.drawImage(logoEmbedded, {x, y, width: logoW, height: logoH});
                    }
                }
            }
            prog.style.width = `${Math.round(((i+1)/files.length)*100)}%`;
        }

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.getElementById('downloadLink');
        link.href = url;
        link.download = `PDF_Master_Processed_${new Date().toISOString().slice(0,10)}.pdf`;
        link.style.display = 'block';

        status.innerHTML = `✅ সম্পন্ন! ${files.length}টি ফাইল প্রসেস হয়েছে।`;
    } catch (err) {
        status.textContent = `❌ এরর: ${err.message}`;
    } finally {
        btn.disabled = false;
    }
});

document.getElementById('resetBtn').addEventListener('click', () => location.reload());