let logoBytes = null;
let logoType = null;

export function initLogoWatermark() {
    const parent = document.getElementById('dynamic-features');
    
    const section = document.createElement('section');
    section.className = 'panel-section';
    section.innerHTML = `
        <h3>🛡️ লোগো ও ওয়াটারমার্ক (Logo & Watermark)</h3>
        <div class="form-group">
            <label for="logo-input">লোগো আপলোড (PNG/JPG):</label>
            <input type="file" id="logo-input" class="form-control" accept="image/png, image/jpeg">
        </div>
        <div class="form-group">
            <label for="logo-placement">প্লেসমেন্ট (Placement):</label>
            <select id="logo-placement" class="form-control">
                <option value="header">হেডার ডানপাশে (Header Right)</option>
                <option value="footer">ফুটার ডানপাশে (Footer Right)</option>
                <option value="watermark" selected>ওয়াটারমার্ক (Center Watermark)</option>
            </select>
        </div>
        <div class="form-group">
            <label for="logo-size">লোগো সাইজ (Size: <span id="val-size">150</span>px):</label>
            <input type="range" id="logo-size" min="30" max="400" value="150" class="form-control">
        </div>
        <div class="form-group">
            <label for="logo-opacity">স্বচ্ছতা (Opacity: <span id="val-opacity">0.3</span>):</label>
            <input type="range" id="logo-opacity" min="0.1" max="1.0" step="0.05" value="0.3" class="form-control">
        </div>
    `;
    
    parent.appendChild(section);

    // Event Bindings
    const logoInput = document.getElementById('logo-input');
    const sizeSlider = document.getElementById('logo-size');
    const opacitySlider = document.getElementById('logo-opacity');

    logoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            logoType = file.type;
            logoBytes = new Uint8Array(await file.arrayBuffer());
        }
    });

    sizeSlider.addEventListener('input', (e) => {
        document.getElementById('val-size').innerText = e.target.value;
    });

    opacitySlider.addEventListener('input', (e) => {
        document.getElementById('val-opacity').innerText = e.target.value;
    });

    window.addEventListener('app-reset', () => {
        logoInput.value = '';
        sizeSlider.value = '150';
        opacitySlider.value = '0.3';
        document.getElementById('val-size').innerText = '150';
        document.getElementById('val-opacity').innerText = '0.3';
        logoBytes = null;
        logoType = null;
    });
}

export function getLogoWatermarkData() {
    return {
        logoBytes: logoBytes,
        logoType: logoType,
        placement: document.getElementById('logo-placement')?.value || 'watermark',
        logoSize: parseInt(document.getElementById('logo-size')?.value || '150', 10),
        opacity: parseFloat(document.getElementById('logo-opacity')?.value || '0.3')
    };
}
