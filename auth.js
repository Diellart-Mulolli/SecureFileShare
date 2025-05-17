export let currentUser = null;

export async function generateKeyPair() {
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
    return {
        publicKey: await window.crypto.subtle.exportKey("jwk", keyPair.publicKey),
        privateKey: await window.crypto.subtle.exportKey("jwk", keyPair.privateKey)
    };
}
export async function registerUser(e, tempDB) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();

    if (!username || !password || username.length < 4 || password.length < 6) {
        alert("Fushat janë të zbrazëta ose nuk përmbushin kriteret");
        return;
    }

    if (tempDB.users.some(u => u.username === username)) {
        alert("Emri i përdoruesit ekziston");
        return;
    }
}