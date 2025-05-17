const recipient = tempDB.users.find(u => u.username === recipientUsername);
if (!recipient) return Callback("Perdoruesi nuk u gjet");

const file = tempDB.files.find(f => f.id === selectedFile && f.ownerId === currentUser.id);
if (!file) return callback("Skedari nuk ekziston ose nuk është i juaji");

const privateKey = await window.crypto.subtle.importKey("jwk", currentUser.privateKey, {
    name: "RSA-OAEP", hash: "SHA-256"
}, true, ["decrypt"]);
