export function initHeaderFooter() {
    const parent = document.getElementById('dynamic-features');
    
    const section = document.createElement('section');
    section.className = 'panel-section';
    section.innerHTML = `
        <h3>✍️ হেডার ও ফুটার (Header / Footer)</h3>
        <div class="form-group">
            <label for="txt-header">হেডার টেক্সট (Header Text):</label>
            <input type="text" id="txt-header" class="form-control" placeholder="Company Confidential">
        </div>
        <div class="form-group">
            <label for="txt-footer">ফুটার টেক্সট (Footer Text):</label>
            <input type="text" id="txt-footer" class="form-control" value="Page {page} of {total}" placeholder="Page {page} of {total}">
            <small style="font-size:0.75rem; color:var(--text-secondary)">{page} এবং {total} ডাইনামিকলি কাজ করবে</small>
        </div>
    `;
    
    parent.appendChild(section);

    window.addEventListener('app-reset', () => {
        document.getElementById('txt-header').value = '';
        document.getElementById('txt-footer').value = 'Page {page} of {total}';
    });
}

export function getHeaderFooterData() {
    return {
        headerText: document.getElementById('txt-header')?.value || '',
        footerText: document.getElementById('txt-footer')?.value || ''
    };
}
