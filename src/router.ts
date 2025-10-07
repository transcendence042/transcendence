// Simple SPA Router for dynamic view loading
// Usage: router.navigate('/profile')

interface Route {
  path: string;
  view: () => void;
}

const routes: Route[] = [
  { path: '/', view: showHome },
  { path: '/login', view: showLogin },
  { path: '/register', view: showRegister },
  { path: '/profile', view: showProfile },
  { path: '/friends', view: showFriends },
  // Add more routes as needed
];

function router() {
  window.addEventListener('popstate', () => {
    renderRoute(window.location.pathname);
  });
}

function navigate(path: string) {
  window.history.pushState({}, '', path);
  renderRoute(path);
}

function renderRoute(path: string) {
  const route = routes.find(r => r.path === path);
  if (route) {
    route.view();
  } else {
    showNotFound();
  }
}

function showHome() {
  document.getElementById('app')!.innerHTML = '<h1>Home</h1>';
}
function showLogin() {
  // Render login form
  document.getElementById('app')!.innerHTML = '<div id="loginForm">Login Form Here</div>';
}
function showRegister() {
  document.getElementById('app')!.innerHTML = '<div id="registerForm">Register Form Here</div>';
}
function showProfile() {
  document.getElementById('app')!.innerHTML = '<div id="profile">Profile View Here</div>';
}
function showFriends() {
  document.getElementById('app')!.innerHTML = '<div id="friends">Friends View Here</div>';
}
function showNotFound() {
  document.getElementById('app')!.innerHTML = '<h1>404 - Not Found</h1>';
}

// Expose router functions globally
(window as any).router = { navigate };

// Initialize router on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  router();
  renderRoute(window.location.pathname);
});
