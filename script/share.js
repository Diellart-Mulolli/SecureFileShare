const recipient = tempDB.users.find(u => u.username === recipientUsername);
if (!recipient) return Callback("Perdoruesi nuk u gjet");

const file = tempDB.files.find(f => f.id === selectedFile && f.ownerId === currentUser.id);
if (!file) return callback("Skedari nuk ekziston ose nuk është i juaji");

const privateKey = await window.crypto.subtle.importKey("jwk", currentUser.privateKey, {
    name: "RSA-OAEP", hash: "SHA-256"
}, true, ["decrypt"]);

const decryptedAesKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    new Uint8Array(file.encryptedKey)
);

const recipientKey = await window.crypto.subtle.importKey("jwk", recipient.publicKey, {
    name: "RSA-OAEP", hash: "SHA-256"
}, true, ["encrypt"]);

const reEncryptedKey = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, recipientKey, decryptedAesKey);

tempDB.sharedFiles.push({
    id: Date.now().toString(),
    fileId: selectedFile,
    recipientId: recipient.id,
    encryptedKey: Array.from(new Uint8Array(reEncryptedKey)),
    permission: permission
});

callback(null);




