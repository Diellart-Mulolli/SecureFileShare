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
    try {
        const { publicKey, privateKey } = await generateKeyPair();
        const user = {
            id: Date.now().toString(),
            username,
            password,
            publicKey,
            privateKey
        };
        tempDB.users.push(user);
        alert("Regjistrimi u krye me sukses");
        bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
        document.getElementById('registerForm').reset();
    } catch (err) {
        console.error("Gabim gjatë regjistrimit:", err);
        alert("Regjistrimi dështoi");
    }
}
export function loginUser(e, tempDB, updateUI) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const user = tempDB.users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = user;
        updateUI();
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        document.getElementById('loginForm').reset();
    } else {
        alert("Kredenciale të pavlefshme");
    }
}