async function openFileForEditing(tempDB, currentUser, fileId) {
    console.log('Opening file for editing, fileId:', fileId);
    const fileRecord = tempDB.files.find(f => f.id === fileId);
    if (!fileRecord || fileRecord.isImage) {
        alert('File not found or not editable');
        console.log('Edit failed: File not found or is image');
        return;
    }
    const isOwner = fileRecord.ownerId === currentUser.id;
    const sharedFile = tempDB.sharedFiles.find(sf => 
        sf.fileId === fileId && 
        sf.recipientId === currentUser.id
    );
    if (!isOwner && (!sharedFile || sharedFile.permission !== 'write')) {
        alert('You do not have permission to edit this file');
        console.log('Edit failed: No write permission');
        return;
    }
    try {
        const privateKey = await window.crypto.subtle.importKey(
            "jwk",
            currentUser.privateKey,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["decrypt"]
        );
        let encryptedKey;
        if (isOwner) {
            encryptedKey = fileRecord.encryptedKey;
        } else {
            encryptedKey = sharedFile.encryptedKey;
        }
        const decryptedAesKey = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            new Uint8Array(encryptedKey)
        );
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            decryptedAesKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["decrypt"]
        );
        const decryptedData = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(fileRecord.iv) },
            aesKey,
            new Uint8Array(fileRecord.encryptedData)
        );
        const decoder = new TextDecoder();
        const textContent = decoder.decode(decryptedData);
        document.getElementById('editorTitle').textContent = fileRecord.name;
        document.getElementById('fileContent').value = textContent;
        window.currentlyEditingFileId = fileId;
        document.getElementById('editorContainer').classList.remove('d-none');
        document.getElementById('editorContainer').scrollIntoView({ behavior: 'smooth' });
        console.log('File opened for editing:', fileRecord.name);
    } catch (error) {
        console.error("File opening error:", error);
        alert("Failed to open file: " + error.message);
    }
}

async function viewTextFile(tempDB, currentUser, fileId) {
    console.log('Viewing text file, fileId:', fileId);
    const fileRecord = tempDB.files.find(f => f.id === fileId);
    if (!fileRecord || fileRecord.isImage) {
        alert('File not found or not viewable');
        console.log('View failed: File not found or is image');
        return;
    }
    if (fileRecord.ownerId !== currentUser.id && 
        !tempDB.sharedFiles.some(sf => sf.fileId === fileId && sf.recipientId === currentUser.id)) {
        alert('You do not have permission to view this file');
        console.log('View failed: No view permission');
        return;
    }
    try {
        const privateKey = await window.crypto.subtle.importKey(
            "jwk",
            currentUser.privateKey,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["decrypt"]
        );
        let encryptedKey;
        if (fileRecord.ownerId === currentUser.id) {
            encryptedKey = fileRecord.encryptedKey;
        } else {
            const sharedFile = tempDB.sharedFiles.find(sf => sf.fileId === fileId && sf.recipientId === currentUser.id);
            if (!sharedFile) {
                throw new Error('No permission to access this file');
            }
            encryptedKey = sharedFile.encryptedKey;
        }
        const decryptedAesKey = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            new Uint8Array(encryptedKey)
        );
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            decryptedAesKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["decrypt"]
        );
        const decryptedData = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(fileRecord.iv) },
            aesKey,
            new Uint8Array(fileRecord.encryptedData)
        );
        const decoder = new TextDecoder();
        const textContent = decoder.decode(decryptedData);
        document.getElementById('textViewModalTitle').textContent = fileRecord.name;
        document.getElementById('textViewContent').textContent = textContent;
        const textViewModal = new bootstrap.Modal(document.getElementById('textViewModal'));
        textViewModal.show();
        console.log('Text file viewed:', fileRecord.name);
    } catch (error) {
        console.error("Text view error:", error);
        alert("Failed to view text file: " + error.message);
    }
}

async function viewImageFile(tempDB, currentUser, fileId) {
    console.log('Viewing image file, fileId:', fileId);
    const fileRecord = tempDB.files.find(f => f.id === fileId);
    if (!fileRecord || !fileRecord.isImage) {
        alert('Image not found');
        console.log('View failed: Image not found');
        return;
    }
    if (fileRecord.ownerId !== currentUser.id && 
        !tempDB.sharedFiles.some(sf => sf.fileId === fileId && sf.recipientId === currentUser.id)) {
        alert('You do not have permission to view this image');
        console.log('View failed: No view permission');
        return;
    }
    try {
        const privateKey = await window.crypto.subtle.importKey(
            "jwk",
            currentUser.privateKey,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["decrypt"]
        );
        let encryptedKey;
        if (fileRecord.ownerId === currentUser.id) {
            encryptedKey = fileRecord.encryptedKey;
        } else {
            const sharedFile = tempDB.sharedFiles.find(sf => sf.fileId === fileId && sf.recipientId === currentUser.id);
            if (!sharedFile) {
                throw new Error('No permission to access this file');
            }
            encryptedKey = sharedFile.encryptedKey;
        }
        const decryptedAesKey = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            new Uint8Array(encryptedKey)
        );
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            decryptedAesKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["decrypt"]
        );
        const decryptedData = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(fileRecord.iv) },
            aesKey,
            new Uint8Array(fileRecord.encryptedData)
        );
        const blob = new Blob([decryptedData], { type: fileRecord.type });
        const url = URL.createObjectURL(blob);
        document.getElementById('imageViewModalTitle').textContent = fileRecord.name;
        document.getElementById('modalImageView').src = url;
        const imageViewModal = new bootstrap.Modal(document.getElementById('imageViewModal'));
        imageViewModal.show();
        console.log('Image file viewed:', fileRecord.name);
        const cleanup = () => {
            URL.revokeObjectURL(url);
            document.getElementById('modalImageView').src = '';
            document.getElementById('imageViewModal').removeEventListener('hidden.bs.modal', cleanup);
        };
        document.getElementById('imageViewModal').addEventListener('hidden.bs.modal', cleanup);
    } catch (error) {
        console.error("Image view error:", error);
        alert("Failed to view image: " + error.message);
    }
}

async function saveFile(tempDB, currentUser, currentlyEditingFileId, fileContent) {
    console.log('Saving file, fileId:', currentlyEditingFileId);
    if (!currentlyEditingFileId) return;
    const fileRecord = tempDB.files.find(f => f.id === currentlyEditingFileId);
    if (!fileRecord) {
        alert('File not found');
        console.log('Save failed: File not found');
        return;
    }
    const isOwner = fileRecord.ownerId === currentUser.id;
    const sharedFile = tempDB.sharedFiles.find(sf => 
        sf.fileId === fileRecord.id && sf.recipientId === currentUser.id
    );
    if (!isOwner && (!sharedFile || sharedFile.permission !== 'write')) {
        alert('You do not have permission to edit this file');
        console.log('Save failed: No write permission');
        return;
    }
    const newContent = fileContent.value;
    if (newContent === '') {
        alert('Content cannot be empty');
        console.log('Save failed: Empty content');
        return;
    }
    try {
        const privateKey = await window.crypto.subtle.importKey(
            "jwk",
            currentUser.privateKey,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["decrypt"]
        );
        let encryptedKey;
        if (isOwner) {
            encryptedKey = fileRecord.encryptedKey;
        } else {
            encryptedKey = sharedFile.encryptedKey;
        }
        const decryptedAesKey = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            new Uint8Array(encryptedKey)
        );
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            decryptedAesKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt"]
        );
        const { iv, encryptedData } = await encryptText(newContent, aesKey);
        fileRecord.encryptedData = Array.from(encryptedData);
        fileRecord.iv = iv;
        fileRecord.size = newContent.length;
        fileRecord.updatedAt = new Date().toISOString();
        alert('File saved successfully!');
        console.log('File saved:', fileRecord.name);
        loadFiles(tempDB, currentUser);
    } catch (error) {
        console.error("File save error:", error);
        alert("Failed to save file: " + error.message);
    }
}

export { openFileForEditing, viewTextFile, viewImageFile, saveFile };