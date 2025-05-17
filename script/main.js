import * as auth from './auth.js';
import * as fileManager from './fileManager.js';
import * as share from './share.js';

document.addEventListener("DOMContentLoaded", () => {
    init();
});

function init() {
    // Attach listeners for login/register
    document.getElementById("loginForm").addEventListener("submit", (e) => auth.loginUser(e, tempDB, updateUI));
    document.getElementById("registerForm").addEventListener("submit", (e) => auth.registerUser(e, tempDB));
    document.getElementById("logoutBtn").addEventListener("click", () => auth.logout(updateUI));

    // ... Add other button listeners for share, create, edit, etc.
}
function updateUI() {
    const userSection = document.getElementById("userSection");
    const privateView = document.getElementById("privateView");
    const publicView = document.getElementById("publicView");

    if (auth.currentUser) {
        userSection.classList.remove("d-none");
        publicView.classList.add("d-none");
        privateView.classList.remove("d-none");
        // Load files etc.
    } else {
        userSection.classList.add("d-none");
        publicView.classList.remove("d-none");
        privateView.classList.add("d-none");
    }
}