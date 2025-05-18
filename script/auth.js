import { generateKeyPair } from './fileManager.js';
import { updateUI } from './main.js';

async function registerUser(e) {
    e.preventDefault();
    console.log('Register form submitted');
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const tempDB = window.tempDB;

    if (!username || !password) {
        alert('Please fill all fields');
        console.log('Registration failed: Missing fields');
        return;
    }

    if (username.length < 4) {
        alert('Username must be at least 4 characters');
        console.log('Registration failed: Username too short');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        console.log('Registration failed: Password too short');
        return;
    }

    if (tempDB.users.some(u => u.username === username)) {
        alert('Username already exists');
        console.log('Registration failed: Username exists');
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
        alert('Registration successful! Please login.');
        console.log('User registered:', username);
        bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
        document.getElementById('registerForm').reset();
    } catch (error) {
        alert('Registration failed: ' + error.message);
        console.error('Registration error:', error);
    }
}

function loginUser(e) {
    e.preventDefault();
    console.log('Login form submitted');
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const tempDB = window.tempDB;

    if (!username || !password) {
        alert('Please fill all fields');
        console.log('Login failed: Missing fields');
        return;
    }

    const user = tempDB.users.find(u => u.username === username && u.password === password);
    if (user) {
        window.currentUser = user;
        console.log('Login successful:', username);
        console.log('Public Key:');
        console.table(user.publicKey);
        console.log('Private Key:');
        console.table(user.privateKey);
        updateUI();
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        document.getElementById('loginForm').reset();
    } else {
        alert('Invalid username or password');
        console.log('Login failed: Invalid credentials');
    }
}

export { registerUser, loginUser };