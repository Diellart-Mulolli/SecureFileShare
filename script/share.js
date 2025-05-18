async function shareFile(tempDB, currentUser, selectedFile, selectedFilePermission) {
    console.log('Sharing file, fileId:', selectedFile);
    const recipientUsername = document.getElementById('shareUsername').value.trim();
    const permission = document.querySelector('input[name="sharePermission"]:checked').value;
    const statusElement = document.getElementById('shareStatus');
    if (!selectedFile) return;
    if (!recipientUsername) {
        statusElement.innerHTML = '<div class="alert alert-danger">Please enter a username</div>';
        console.log('Share failed: Missing username');
        return;
    }
    const recipient = tempDB.users.find(u => u.username === recipientUsername);
    if (!recipient) {
        statusElement.innerHTML = '<div class="alert alert-danger">User not found</div>';
        console.log('Share failed: User not found');
        return;
    }
    if (recipient.id === currentUser.id) {
        statusElement.innerHTML = '<div class="alert alert-danger">Cannot share with yourself</div>';
        console.log('Share failed: Cannot share with self');
        return;
    }
    if (tempDB.sharedFiles.some(sf => sf.fileId === selectedFile && sf.recipientId === recipient.id)) {
        statusElement.innerHTML = '<div class="alert alert-warning">File already shared with this user</div>';
        console.log('Share failed: Already shared');
        return;
    }
    if (selectedFilePermission === 'read' && permission === 'write') {
        statusElement.innerHTML = '<div class="alert alert-danger">Cannot grant read-write permission with read-only access</div>';
        console.log('Share failed: Cannot grant read-write with read-only access');
        return;
    }
    try {
        const fileRecord = tempDB.files.find(f => f.id === selectedFile);
        if (!fileRecord) {
            statusElement.innerHTML = '<div class="alert alert-danger">File not found</div>';
            console.log('Share failed: File not found');
            return;
        }
        const isOwner = fileRecord.ownerId === currentUser.id;
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
            const sharedFile = tempDB.sharedFiles.find(sf => 
                sf.fileId === selectedFile && sf.recipientId === currentUser.id
            );
            if (!sharedFile) {
                statusElement.innerHTML = '<div class="alert alert-danger">No permission to share this file</div>';
                console.log('Share failed: No share permission');
                return;
            }
            encryptedKey = sharedFile.encryptedKey;
        }
        const decryptedAesKey = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            new Uint8Array(encryptedKey)
        );
        const recipientPublicKey = await window.crypto.subtle.importKey(
            "jwk",
            recipient.publicKey,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["encrypt"]
        );
        const reencryptedAesKey = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            recipientPublicKey,
            decryptedAesKey
        );
        const shareRecord = {
            id: Date.now().toString(),
            fileId: selectedFile,
            recipientId: recipient.id,
            encryptedKey: Array.from(new Uint8Array(reencryptedAesKey)),
            permission: permission
        };
        tempDB.sharedFiles.push(shareRecord);
        statusElement.innerHTML = '<div class="alert alert-success">File shared successfully!</div>';
        console.log('File shared with:', recipientUsername, 'Permission:', permission);
        setTimeout(() => {
            bootstrap.Modal.getInstance(document.getElementById('shareModal')).hide();
            document.getElementById('shareUsername').value = '';
            statusElement.innerHTML = '';
            window.selectedFile = null;
            window.selectedFilePermission = null;
            loadFiles(tempDB, currentUser);
        }, 1500);
    } catch (error) {
        console.error("Sharing error:", error);
        statusElement.innerHTML = `<div class="alert alert-danger">Sharing failed: ${error.message}</div>`;
    }
}

export { shareFile };