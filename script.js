// script.js - মেইন ফাইল (এতে খুব কম পরিবর্তন করবো)
import "./features/header-footer.js";
import "./features/logo-watermark.js";
import "./features/preview.js";
// নতুন ফিচার যোগ করলে এখানে শুধু import লাইন যোগ করবো

let files = [];
let state = {};

// Global functions যাতে সব ফিচার অ্যাক্সেস করতে পারে
window.PDFMaster = {
    files: () => files,
    addFiles: (newFiles) => { files = newFiles; },
    getState: () => state,
    setState: (newState) => { state = {...state, ...newState}; },
    updateUI: () => renderOptions()
};

// Drop Zone + Basic
document.addEventListener('DOMContentLoaded', () => {
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

    document.getElementById('darkMode').addEventListener('change', e => {
        document.body.classList.toggle('dark', e.target.checked);
    });

    document.getElementById('resetBtn').addEventListener('click', () => location.reload());
});

function handleFiles(newFiles) {
    files = [...newFiles].filter(f => f.type === 'application/pdf');
    if (files.length > 0) {
        document.getElementById('processBtn').disabled = false;
        window.PDFMaster.updateUI();
    }
}

// Process Button (ফিচারগুলো এখানে লিসেন করে)
document.getElementById('processBtn').addEventListener('click', async () => {
    // প্রত্যেক ফিচার নিজের প্রসেস লজিক চালাবে
    console.log("Processing started with", files.length, "files");
});