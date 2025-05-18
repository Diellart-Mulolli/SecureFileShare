import { updateUI } from './main.js';
import { openFileForEditing, viewTextFile, viewImageFile } from './fileEditor.js';

async function generateKeyPair() {
    try {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                hash: "SHA-256"
            },
            true,
            ["encrypt", "decrypt"]
        );
        const publicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
        const privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
        return { publicKey, privateKey };
    } catch (error) {
        console.error("Key generation error:", error);
        throw new Error("Failed to generate encryption keys");
    }
}

async function generateAesKey() {
    return await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

async function encryptText(text, aesKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text);
    const encryptedData = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        encodedText
    );
    return {
        iv: Array.from(iv),
        encryptedData: new Uint8Array(encryptedData)
    };
}

async function encryptFile(file, aesKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const fileData = await readFileAsArrayBuffer(file);
    const encryptedData = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        fileData
    );
    return {
        iv: Array.from(iv),
        encryptedData: new Uint8Array(encryptedData)
    };
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

async function createTextFile(tempDB, currentUser, fileName, content) {
    try {
        console.log('Creating text file:', fileName);
        const aesKey = await generateAesKey();
        const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const { iv, encryptedData } = await encryptText(content, aesKey);
        const publicKey = await window.crypto.subtle.importKey(
            "jwk",
            currentUser.publicKey,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["encrypt"]
        );
        const encryptedAesKey = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            exportedAesKey
        );
        const fileRecord = {
            id: Date.now().toString(),
            name: fileName,
            size: content.length,
            type: 'text/plain',
            ownerId: currentUser.id,
            iv: iv,
            encryptedData: Array.from(encryptedData),
            encryptedKey: Array.from(new Uint8Array(encryptedAesKey)),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isImage: false
        };
        tempDB.files.push(fileRecord);
        console.log('Text file created:', fileName);
        bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();
        document.getElementById('fileName').value = '';
        document.getElementById('fileText').value = '';
        document.getElementById('textInput').value = '';
        document.getElementById('textPreview').textContent = '';
        document.getElementById('textPreviewContainer').classList.add('d-none');
        document.getElementById('textFileName').value = '';
        document.getElementById('imageInput').value = '';
        document.getElementById('imagePreview').src = '';
        document.getElementById('imagePreviewContainer').classList.add('d-none');
        document.getElementById('imageFileName').value = '';
        window.selectedFileForUpload = null;
        window.selectedTextFileContent = null;
        window.isImageUpload = false;
        loadFiles(tempDB, currentUser);
    } catch (error) {
        console.error("File creation error:", error);
        alert("Failed to create file: " + error.message);
    }
}

async function createImageFile(tempDB, currentUser, fileName, imageFile) {
    try {
        console.log('Creating image file:', fileName);
        const aesKey = await generateAesKey();
        const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const { iv, encryptedData } = await encryptFile(imageFile, aesKey);
        const publicKey = await window.crypto.subtle.importKey(
            "jwk",
            currentUser.publicKey,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["encrypt"]
        );
        const encryptedAesKey = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            exportedAesKey
        );
        const fileRecord = {
            id: Date.now().toString(),
            name: fileName,
            size: imageFile.size,
            type: imageFile.type,
            ownerId: currentUser.id,
            iv: iv,
            encryptedData: Array.from(encryptedData),
            encryptedKey: Array.from(new Uint8Array(encryptedAesKey)),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isImage: true
        };
        tempDB.files.push(fileRecord);
        console.log('Image file created:', fileName);
        bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();
        document.getElementById('fileName').value = '';
        document.getElementById('fileText').value = '';
        document.getElementById('textInput').value = '';
        document.getElementById('textPreview').textContent = '';
        document.getElementById('textPreviewContainer').classList.add('d-none');
        document.getElementById('textFileName').value = '';
        document.getElementById('imageInput').value = '';
        document.getElementById('imagePreview').src = '';
        document.getElementById('imagePreviewContainer').classList.add('d-none');
        document.getElementById('imageFileName').value = '';
        window.selectedFileForUpload = null;
        window.selectedTextFileContent = null;
        window.isImageUpload = false;
        loadFiles(tempDB, currentUser);
    } catch (error) {
        console.error("Image upload error:", error);
        alert("Failed to upload image: " + error.message);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function loadFiles(tempDB, currentUser) {
    console.log('Loading files for user:', currentUser?.id);
    const userFiles = tempDB.files.filter(f => f.ownerId === currentUser.id);
    renderFiles(tempDB, userFiles, document.getElementById('fileList'), true, currentUser);
    const sharedFiles = tempDB.sharedFiles
        .filter(sf => sf.recipientId === currentUser.id)
        .map(sf => {
            const file = tempDB.files.find(f => f.id === sf.fileId);
            return file ? {...file, permission: sf.permission} : null;
        })
        .filter(f => f);
    renderFiles(tempDB, sharedFiles, document.getElementById('sharedFileList'), false, currentUser);
}

function renderFiles(tempDB, files, container, isOwner, currentUser) {
    console.log('Rendering files, count:', files.length, 'isOwner:', isOwner);
    container.innerHTML = '';
    if (files.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-folder-x file-icon"></i>
                <p class="text-muted">No files found</p>
            </div>
        `;
        return;
    }
    files.forEach(file => {
        const fileCard = document.createElement('div');
        fileCard.className = 'col-md-4 mb-4';
        const isShared = file.ownerId !== currentUser.id;
        const sharedInfo = isShared ? tempDB.sharedFiles.find(sf => 
            sf.fileId === file.id && 
            sf.recipientId === currentUser.id
        ) : null;
        const permissionBadge = isShared ? 
            `<span class="badge ${file.permission === 'write' ? 'read-write-badge bg-success' : 'read-only-badge bg-secondary'} permission-badge">
                ${file.permission === 'write' ? 'Read-Write' : 'Read-Only'}
            </span>` : '';
        const shareButton = (isOwner || (isShared && sharedInfo)) ? `
            <button class="btn btn-sm btn-outline-secondary share-btn" data-id="${file.id}" data-permission="${isShared ? sharedInfo.permission : 'owner'}" title="${isShared && sharedInfo.permission === 'read' ? 'Can only share with read-only access' : ''}">
                <i class="bi bi-share"></i> Share
            </button>
        ` : '';
        if (file.isImage) {
            fileCard.innerHTML = `
                <div class="card file-card h-100">
                    <div class="card-body text-center">
                        <div class="image-thumbnail-container">
                            <i class="bi bi-image file-icon"></i>
                        </div>
                        <h5 class="card-title mt-2">${file.name}</h5>
                        <p class="card-text text-muted">
                            ${formatFileSize(file.size)}<br>
                            ${isShared ? 
                                `Shared by: ${tempDB.users.find(u => u.id === file.ownerId)?.username || 'Unknown'}<br>` : 
                                `Last updated: ${new Date(file.updatedAt).toLocaleString()}<br>`
                            }
                            ${permissionBadge}
                        </p>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-sm btn-outline-primary view-btn" data-id="${file.id}">
                            <i class="bi bi-eye"></i> View
                        </button>
                        ${shareButton}
                    </div>
                </div>
            `;
        } else {
            fileCard.innerHTML = `
                <div class="card file-card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-file-earmark-text file-icon"></i>
                        <h5 class="card-title">${file.name}</h5>
                        <p class="card-text text-muted">
                            ${formatFileSize(file.size)}<br>
                            ${isShared ? 
                                `Shared by: ${tempDB.users.find(u => u.id === file.ownerId)?.username || 'Unknown'}<br>` : 
                                `Last updated: ${new Date(file.updatedAt).toLocaleString()}<br>`
                            }
                            ${permissionBadge}
                        </p>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${file.id}" 
                            ${isShared && file.permission !== 'write' ? 'disabled title="Read-only access"' : ''}>
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-primary view-text-btn" data-id="${file.id}">
                            <i class="bi bi-eye"></i> View
                        </button>
                        ${shareButton}
                    </div>
                </div>
            `;
        }
        container.appendChild(fileCard);
    });
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Edit button clicked, fileId:', btn.dataset.id);
            openFileForEditing(tempDB, currentUser, btn.dataset.id);
        });
    });
    container.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('View image button clicked, fileId:', btn.dataset.id);
            viewImageFile(tempDB, currentUser, btn.dataset.id);
        });
    });
    container.querySelectorAll('.view-text-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('View text button clicked, fileId:', btn.dataset.id);
            viewTextFile(tempDB, currentUser, btn.dataset.id);
        });
    });
    container.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.selectedFile = btn.dataset.id;
            window.selectedFilePermission = btn.dataset.permission;
            console.log('Share button clicked, fileId:', window.selectedFile, 'permission:', window.selectedFilePermission);
            const shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
            shareModal.show();
        });
    });
}

async function handleFileCreation(tempDB, currentUser, isImageUpload, selectedFileForUpload, selectedTextFileContent) {
    console.log('Handling file creation');
    const activeTab = document.querySelector('#uploadTabs .nav-link.active').getAttribute('data-bs-target');
    if (activeTab === '#writeTextTab') {
        const fileName = document.getElementById('fileName').value.trim();
        const fileText = document.getElementById('fileText').value;
        if (!fileName) {
            alert('Please enter a file name');
            console.log('File creation failed: Missing file name');
            return;
        }
        const finalFileName = fileName.endsWith('.txt') ? fileName : fileName + '.txt';
        await createTextFile(tempDB, currentUser, finalFileName, fileText);
    } else if (activeTab === '#uploadTextTab') {
        if (!selectedFileForUpload || selectedTextFileContent === null) {
            alert('Please select a text file');
            console.log('File creation failed: No text file selected');
            return;
        }
        const fileName = document.getElementById('textFileName').value.trim();
        if (!fileName) {
            alert('Please enter a file name');
            console.log('File creation failed: Missing file name');
            return;
        }
        const finalFileName = fileName.endsWith('.txt') ? fileName : fileName + '.txt';
        await createTextFile(tempDB, currentUser, finalFileName, selectedTextFileContent);
    } else if (activeTab === '#imageTab') {
        if (!selectedFileForUpload) {
            alert('Please select an image file');
            console.log('File creation failed: No image selected');
            return;
        }
        const fileName = document.getElementById('imageFileName').value.trim();
        if (!fileName) {
            alert('Please enter a file name');
            console.log('File creation failed: Missing image file name');
            return;
        }
        const finalFileName = fileName.includes('.') ? fileName : fileName + '.' + selectedFileForUpload.type.split('/')[1];
        await createImageFile(tempDB, currentUser, finalFileName, selectedFileForUpload);
    }
}

export { generateKeyPair, generateAesKey, encryptText, encryptFile, readFileAsArrayBuffer, createTextFile, createImageFile, formatFileSize, loadFiles, handleFileCreation };