// DOM Elements
const providerSelectionPage = document.getElementById("provider-selection");
const signingInPage = document.getElementById("signing-in");
const credentialsInputPage = document.getElementById("credentials-input");

const backToProvidersBtn = document.getElementById("back-to-providers");
const credentialsForm = document.getElementById("credentials-form");
const signingInProviderSpan = document.getElementById("signing-in-provider");
const credentialsTitle = document.getElementById("credentials-title");
const loginErrorDiv = document.getElementById("login-error");

let selectedProvider = null;

// Page display helper (FIXED: uses .active class)
function showPage(page) {
  [providerSelectionPage, signingInPage, credentialsInputPage].forEach(p => {
    if (p) p.classList.remove("active");
  });
  if (page) page.classList.add("active");
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Initially show provider selection page
  showPage(providerSelectionPage);
});

// Provider buttons
document.querySelectorAll('.provider-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedProvider = btn.getAttribute('data-provider');
    if (!selectedProvider) return;

    // Update UI for signing in
    if (signingInProviderSpan) signingInProviderSpan.textContent = selectedProvider;
    showPage(signingInPage);

    // Simulate delay then go to credentials input
    setTimeout(() => {
      if (credentialsTitle) credentialsTitle.textContent = `Sign in with ${selectedProvider}`;
      showPage(credentialsInputPage);
    }, 1000);
  });
});

// Navigation buttons
if (backToProvidersBtn) {
  backToProvidersBtn.addEventListener("click", () => {
    if (credentialsForm) credentialsForm.reset();
    if (loginErrorDiv) {
      loginErrorDiv.style.display = "none";
      loginErrorDiv.textContent = "";
    }
    showPage(providerSelectionPage);
  });
}

// Handle credentials form submit
if (credentialsForm) {
  credentialsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (loginErrorDiv) {
      loginErrorDiv.style.display = "none";
      loginErrorDiv.textContent = "";
    }

    const formData = new FormData(credentialsForm);
    const email = formData.get("email")?.trim().toLowerCase();
    const password = formData.get("password")?.trim();

    if (!email || !password || !selectedProvider) {
      if (loginErrorDiv) {
        loginErrorDiv.textContent = "Please fill in all fields.";
        loginErrorDiv.style.display = "block";
      } else {
        alert("Please fill in all fields.");
      }
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, provider: selectedProvider })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed.");
      }

      // Redirect to dashboard
      window.location.href = "/dashboard.html";
    } catch (err) {
      if (loginErrorDiv) {
        loginErrorDiv.textContent = err.message;
        loginErrorDiv.style.display = "block";
      } else {
        alert(err.message);
      }
    }
  });
}

export {};