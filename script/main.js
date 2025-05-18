import { loginUser, registerUser } from './auth.js';
import { handleFileCreation, loadFiles } from './fileManager.js';
import { openFileForEditing, viewTextFile, viewImageFile, saveFile } from './fileEditor.js';
import { shareFile } from './share.js';

const tempDB = {
    users: [],
    files: [],
    sharedFiles: []
};

let currentUser = null;
let selectedFile = null;
let selectedFilePermission = null;
let currentlyEditingFileId = null;
let selectedFileForUpload = null;
let selectedTextFileContent = null;
let isImageUpload = false;

// Expose variables to window for cross-module access
window.tempDB = tempDB;
window.currentUser = currentUser;
window.selectedFile = selectedFile;
window.selectedFilePermission = selectedFilePermission;
window.currentlyEditingFileId = currentlyEditingFileId;
window.selectedFileForUpload = selectedFileForUpload;
window.selectedTextFileContent = selectedTextFileContent;
window.isImageUpload = isImageUpload;

const userSection = document.getElementById('userSection');
const usernameDisplay = document.getElementById('usernameDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const publicView = document.getElementById('publicView');
const privateView = document.getElementById('privateView');
const fileList = document.getElementById('fileList');
const sharedFileList = document.getElementById('sharedFileList');
const editorContainer = document.getElementById('editorContainer');
const editorTitle = document.getElementById('editorTitle');
const fileContent = document.getElementById('fileContent');
const saveBtn = document.getElementById('saveBtn');
const closeEditorBtn = document.getElementById('closeEditorBtn');
const imageDropZone = document.getElementById('imageDropZone');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imageFileName = document.getElementById('imageFileName');
const textDropZone = document.getElementById('textDropZone');
const textInput = document.getElementById('textInput');
const textPreview = document.getElementById('textPreview');
const textPreviewContainer = document.getElementById('textPreviewContainer');
const textFileName = document.getElementById('textFileName');
const imageViewModalElement = document.getElementById('imageViewModal');
const imageViewModal = new bootstrap.Modal(imageViewModalElement);
const modalImageView = document.getElementById('modalImageView');
const imageViewModalTitle = document.getElementById('imageViewModalTitle');
const textViewModalElement = document.getElementById('textViewModal');
const textViewModal = new bootstrap.Modal(textViewModalElement);
const textViewContent = document.getElementById('textViewContent');
const textViewModalTitle = document.getElementById('textViewModalTitle');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const shareModalElement = document.getElementById('shareModal');
const readWritePermissionInput = document.getElementById('readWritePermission');
const keysModalElement = document.getElementById('keysModal');
const publicKeyDisplay = document.getElementById('publicKeyDisplay');
const privateKeyDisplay = document.getElementById('privateKeyDisplay');
const copyPublicKeyBtn = document.getElementById('copyPublicKeyBtn');
const copyPrivateKeyBtn = document.getElementById('copyPrivateKeyBtn');

function updateUI() {
    console.log('Updating UI, currentUser:', window.currentUser);
    if (window.currentUser) {
        userSection.classList.remove('d-none');
        usernameDisplay.textContent = window.currentUser.username;
        publicView.classList.add('d-none');
        privateView.classList.remove('d-none');
        loadFiles(tempDB, window.currentUser);
    } else {
        userSection.classList.add('d-none');
        publicView.classList.remove('d-none');
        privateView.classList.add('d-none');
        editorContainer.classList.add('d-none');
    }
}

function handleImageSelect(file) {
    if (!file.type.match('image.*')) {
        alert('Please select an image file (JPG, PNG, GIF)');
        console.log('Image select failed: Invalid file type');
        return;
    }
    window.selectedFileForUpload = file;
    window.isImageUpload = true;
    imageFileName.value = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreviewContainer.classList.remove('d-none');
    };
    reader.readAsDataURL(file);
    console.log('Image selected:', file.name);
}

function handleTextFileSelect(file) {
    if (!file.name.endsWith('.txt')) {
        alert('Please select a .txt file');
        console.log('Text file select failed: Invalid file type');
        return;
    }
    window.selectedFileForUpload = file;
    window.selectedTextFileContent = null;
    textFileName.value = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
        window.selectedTextFileContent = e.target.result;
        textPreview.textContent = window.selectedTextFileContent;
        textPreviewContainer.classList.remove('d-none');
        console.log('Text file selected:', file.name);
    };
    reader.onerror = (e) => {
        console.error('Error reading text file:', e);
        alert('Failed to read text file');
    };
    reader.readAsText(file);
}

function closeEditor() {
    console.log('Closing editor');
    editorContainer.classList.add('d-none');
    window.currentlyEditingFileId = null;
    fileContent.value = '';
}

function init() {
    console.log('Initializing app...');
    updateUI();
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            console.log('Login form submit event triggered');
            loginUser(e);
        });
    } else {
        console.error('Login form not found');
    }
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            console.log('Register form submit event triggered');
            registerUser(e);
        });
    } else {
        console.error('Register form not found');
    }
    logoutBtn.addEventListener('click', () => {
        console.log('Logging out user:', window.currentUser?.username);
        window.currentUser = null;
        updateUI();
    });
    saveBtn.addEventListener('click', () => saveFile(tempDB, window.currentUser, window.currentlyEditingFileId, fileContent));
    closeEditorBtn.addEventListener('click', closeEditor);
    document.getElementById('createFileBtn').addEventListener('click', () => handleFileCreation(tempDB, window.currentUser, window.isImageUpload, window.selectedFileForUpload, window.selectedTextFileContent));
    document.getElementById('shareBtn').addEventListener('click', () => shareFile(tempDB, window.currentUser, window.selectedFile, window.selectedFilePermission));
    imageDropZone.addEventListener('click', () => imageInput.click());
    imageDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageDropZone.classList.add('dragover');
    });
    imageDropZone.addEventListener('dragleave', () => {
        imageDropZone.classList.remove('dragover');
    });
    imageDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        imageDropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleImageSelect(e.dataTransfer.files[0]);
        }
    });
    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleImageSelect(e.target.files[0]);
        }
    });
    textDropZone.addEventListener('click', () => textInput.click());
    textDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        textDropZone.classList.add('dragover');
    });
    textDropZone.addEventListener('dragleave', () => {
        textDropZone.classList.remove('dragover');
    });
    textDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        textDropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleTextFileSelect(e.dataTransfer.files[0]);
        }
    });
    textInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleTextFileSelect(e.target.files[0]);
        }
    });
    shareModalElement.addEventListener('show.bs.modal', () => {
        if (window.selectedFilePermission === 'read') {
            readWritePermissionInput.disabled = true;
            readWritePermissionInput.checked = false;
            document.getElementById('readOnlyPermission').checked = true;
            console.log('Share modal: Read-write permission disabled for read-only access');
        } else {
            readWritePermissionInput.disabled = false;
            console.log('Share modal: Full permissions available');
        }
    });
    keysModalElement.addEventListener('show.bs.modal', () => {
        if (window.currentUser) {
            publicKeyDisplay.textContent = JSON.stringify(window.currentUser.publicKey, null, 2);
            privateKeyDisplay.textContent = JSON.stringify(window.currentUser.privateKey, null, 2);
        }
    });
    copyPublicKeyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(publicKeyDisplay.textContent)
            .then(() => alert('Public key copied to clipboard!'))
            .catch(err => {
                console.error('Failed to copy public key:', err);
                alert('Failed to copy public key.');
            });
    });
    copyPrivateKeyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(privateKeyDisplay.textContent)
            .then(() => alert('Private key copied to clipboard! Keep it secure.'))
            .catch(err => {
                console.error('Failed to copy private key:', err);
                alert('Failed to copy private key.');
            });
    });
}

document.addEventListener('DOMContentLoaded', init);

export { tempDB, updateUI };