// ===== CONFIG =====
// After deploying to Vercel, this is set automatically.
// During local development, change to 'http://localhost:3000'
const API_BASE = '';  // empty = same origin (works on Vercel)

// ===== Global State =====
let currentUser = null;
let allHostels   = [];   // full list from MongoDB
let filteredHostels = [];

// ===== Helpers =====
async function apiFetch(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  return res.json();
}

function showToast(msg, isError = false) {
  // Remove existing toast
  const old = document.getElementById('acadia-toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'acadia-toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:2rem; left:50%; transform:translateX(-50%);
    background:${isError ? '#e53e3e' : '#38a169'}; color:#fff;
    padding:1rem 2rem; border-radius:8px; font-size:1rem;
    box-shadow:0 4px 20px rgba(0,0,0,0.2); z-index:9999;
    animation: fadeIn 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ===== Mobile Menu Toggle =====
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuToggle && mobileMenu) {
  mobileMenuToggle.addEventListener('click', () => mobileMenu.classList.toggle('active'));
  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.remove('active'));
  });
}

// ===========================
// ===== STUDENT PORTAL ======
// ===========================
if (window.location.pathname.includes('student.html')) {
  initStudentPortal();
}

function initStudentPortal() {
  const authTabs        = document.querySelectorAll('.auth-tab');
  const loginForm       = document.getElementById('loginForm');
  const registerForm    = document.getElementById('registerForm');
  const authSection     = document.getElementById('authSection');
  const studentDashboard = document.getElementById('studentDashboard');
  const hostelDetail    = document.getElementById('hostelDetail');
  const studentLogoutBtn = document.getElementById('studentLogoutBtn');

  // Check if already logged in (session)
  const savedUser = sessionStorage.getItem('currentStudent');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showStudentDashboard();
  }

  // ── Auth Tabs ──
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (targetTab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
      } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
      }
    });
  });

  // ── Student Register ──
  const studentRegisterForm = document.getElementById('studentRegisterForm');
  if (studentRegisterForm) {
    studentRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name            = document.getElementById('registerName').value.trim();
      const email           = document.getElementById('registerEmail').value.trim();
      const password        = document.getElementById('registerPassword').value;
      const confirmPassword = document.getElementById('registerConfirmPassword').value;

      if (password !== confirmPassword) return showToast('Passwords do not match!', true);
      if (password.length < 6)          return showToast('Password must be at least 6 characters!', true);

      const btn = studentRegisterForm.querySelector('button[type="submit"]');
      btn.textContent = 'Registering...';
      btn.disabled = true;

      const result = await apiFetch('/api/auth?action=register', {
        method: 'POST',
        body: { name, email, password, role: 'student' }
      });

      btn.textContent = 'Register';
      btn.disabled = false;

      if (!result.success) return showToast(result.error || 'Registration failed', true);

      currentUser = result.data;
      sessionStorage.setItem('currentStudent', JSON.stringify(currentUser));
      showToast('Registration successful! Welcome to Acadia!');
      showStudentDashboard();
    });
  }

  // ── Student Login ──
  const studentLoginForm = document.getElementById('studentLoginForm');
  if (studentLoginForm) {
    studentLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      const btn = studentLoginForm.querySelector('button[type="submit"]');
      btn.textContent = 'Logging in...';
      btn.disabled = true;

      const result = await apiFetch('/api/auth?action=login', {
        method: 'POST',
        body: { email, password, role: 'student' }
      });

      btn.textContent = 'Login';
      btn.disabled = false;

      if (!result.success) return showToast(result.error || 'Login failed', true);

      currentUser = result.data;
      sessionStorage.setItem('currentStudent', JSON.stringify(currentUser));
      showToast(`Welcome back, ${currentUser.name}!`);
      showStudentDashboard();
    });
  }

  // ── Logout ──
  if (studentLogoutBtn) {
    studentLogoutBtn.addEventListener('click', () => {
      currentUser = null;
      sessionStorage.removeItem('currentStudent');
      location.reload();
    });
  }

  // ── Show Dashboard ──
  function showStudentDashboard() {
    if (authSection)      authSection.style.display = 'none';
    if (studentDashboard) studentDashboard.style.display = 'block';
    if (studentLogoutBtn) studentLogoutBtn.style.display = 'block';
    loadAndRenderHostels();
    initializeFilters();
  }

  // ── Load hostels from MongoDB ──
  async function loadAndRenderHostels(queryParams = '') {
    const hostelListings = document.getElementById('hostelListings');
    if (!hostelListings) return;

    hostelListings.innerHTML = '<p style="text-align:center;color:var(--text-secondary);font-size:1.1rem;">Loading hostels...</p>';

    const result = await apiFetch('/api/hostels' + (queryParams ? '?' + queryParams : ''));

    if (!result.success) {
      hostelListings.innerHTML = '<p style="text-align:center;color:red;">Failed to load hostels. Please try again.</p>';
      return;
    }

    allHostels      = result.data;
    filteredHostels = [...allHostels];
    renderHostelListings();
  }

  function renderHostelListings() {
    const hostelListings = document.getElementById('hostelListings');
    if (!hostelListings) return;

    if (filteredHostels.length === 0) {
      hostelListings.innerHTML = '<p style="text-align:center;color:var(--text-secondary);font-size:1.1rem;">No hostels found matching your criteria.</p>';
      return;
    }

    hostelListings.innerHTML = filteredHostels.map((hostel, index) => `
      <div class="hostel-card" data-id="${hostel._id}" style="animation-delay:${index * 0.1}s">
        <div class="hostel-image">${hostel.name.charAt(0)}</div>
        <div class="hostel-content">
          <div class="hostel-header">
            <h3 class="hostel-name">${hostel.name}</h3>
            <div class="hostel-price">₹${hostel.price}<small>/mo</small></div>
          </div>
          <span class="hostel-type">${hostel.type.toUpperCase()}</span>
          <p class="hostel-description">${hostel.description}</p>
          <div class="hostel-amenities">
            ${hostel.amenities.slice(0, 4).map(a => `<span class="amenity-tag">${a}</span>`).join('')}
            ${hostel.amenities.length > 4 ? `<span class="amenity-tag">+${hostel.amenities.length - 4} more</span>` : ''}
          </div>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.5rem;">
            📍 ${hostel.location} &nbsp;|&nbsp; Listed by ${hostel.ownerName}
          </p>
          <button class="btn btn-primary btn-full view-details-btn" data-id="${hostel._id}" style="margin-top:1rem;">View Details</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showHostelDetails(btn.dataset.id);
      });
    });
  }

  async function showHostelDetails(hostelId) {
    const studentDashboard = document.getElementById('studentDashboard');
    const hostelDetailSection = document.getElementById('hostelDetail');
    const detailContent = document.getElementById('detailContent');

    if (!detailContent) return;

    // Try from already-loaded data first
    let hostel = allHostels.find(h => h._id === hostelId);
    if (!hostel) {
      const result = await apiFetch(`/api/hostel/${hostelId}`);
      if (!result.success) return showToast('Could not load hostel details', true);
      hostel = result.data;
    }

    detailContent.innerHTML = `
      <div class="detail-header">
        <h1 class="detail-title">${hostel.name}</h1>
        <div class="detail-meta">
          <span class="meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${hostel.location}
          </span>
          <span class="hostel-type">${hostel.type.toUpperCase()}</span>
        </div>
        <div class="detail-price">₹${hostel.price}/month</div>
      </div>

      <div class="detail-section">
        <h3>About This Hostel</h3>
        <p>${hostel.description}</p>
      </div>

      <div class="detail-section">
        <h3>Amenities</h3>
        <div class="amenities-list">
          ${hostel.amenities.map(a => `
            <div class="amenity-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>${a}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="detail-section">
        <h3>Additional Information</h3>
        <div class="amenities-list">
          <div class="amenity-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
            <span>Food: ${hostel.food === 'yes' ? 'Available' : 'Not Available'}</span>
          </div>
          <div class="amenity-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>In-Time: ${hostel.inTime === 'flexible' ? 'Flexible' : hostel.inTime.toUpperCase()}</span>
          </div>
        </div>
      </div>

      ${hostel.rules && hostel.rules.length > 0 ? `
        <div class="detail-section">
          <h3>Rules & Regulations</h3>
          <ul class="rules-list">
            ${hostel.rules.map(rule => `<li>${rule}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="detail-section">
        <h3>Contact Owner</h3>
        <div style="background:var(--bg-light,#f8f9fa);padding:1.5rem;border-radius:12px;">
          <p><strong>Name:</strong> ${hostel.ownerName}</p>
          <p style="margin-top:0.5rem;"><strong>Email:</strong> <a href="mailto:${hostel.ownerEmail}">${hostel.ownerEmail}</a></p>
          ${hostel.ownerPhone ? `<p style="margin-top:0.5rem;"><strong>Phone:</strong> <a href="tel:${hostel.ownerPhone}">${hostel.ownerPhone}</a></p>` : ''}
        </div>
      </div>

      <div class="detail-section">
        <h3>Location</h3>
        <div class="map-placeholder" style="height:200px;background:#e2e8f0;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;">
          <p style="color:#4a5568;">📍 ${hostel.location}</p>
          <a href="https://www.google.com/maps/search/${encodeURIComponent(hostel.location + ' Bidholi Dehradun')}" 
             target="_blank" class="btn btn-secondary">Open in Google Maps</a>
        </div>
      </div>
    `;

    if (studentDashboard)   studentDashboard.style.display = 'none';
    if (hostelDetailSection) hostelDetailSection.style.display = 'block';

    // Back button
    const backBtn = document.getElementById('backToListings');
    if (backBtn) {
      backBtn.onclick = () => {
        hostelDetailSection.style.display = 'none';
        studentDashboard.style.display = 'block';
      };
    }
  }

  // ── Filters ──
  function initializeFilters() {
    const searchBtn       = document.getElementById('searchBtn');
    const searchInput     = document.getElementById('searchInput');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');

    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', applySearch);
      searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') applySearch(); });
    }
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyFilters);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);
  }

  function applySearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredHostels = allHostels.filter(h =>
      h.name.toLowerCase().includes(searchTerm) ||
      h.location.toLowerCase().includes(searchTerm) ||
      h.description.toLowerCase().includes(searchTerm)
    );
    renderHostelListings();
  }

  function applyFilters() {
    const minBudget        = parseInt(document.getElementById('minBudget').value) || 0;
    const maxBudget        = parseInt(document.getElementById('maxBudget').value) || Infinity;
    const hostelType       = document.getElementById('hostelType').value;
    const foodAvailability = document.getElementById('foodAvailability').value;
    const inTime           = document.getElementById('inTime').value;
    const selectedAmenities = Array.from(document.querySelectorAll('.amenity-checkbox:checked')).map(cb => cb.value);

    filteredHostels = allHostels.filter(h => {
      const priceMatch     = h.price >= minBudget && h.price <= maxBudget;
      const typeMatch      = !hostelType || h.type === hostelType;
      const foodMatch      = !foodAvailability || h.food === foodAvailability;
      const timeMatch      = !inTime || h.inTime === inTime;
      const amenitiesMatch = selectedAmenities.length === 0 ||
        selectedAmenities.every(a => h.amenities.some(ha => ha.toLowerCase() === a.toLowerCase()));

      return priceMatch && typeMatch && foodMatch && timeMatch && amenitiesMatch;
    });

    renderHostelListings();
  }

  function resetFilters() {
    document.getElementById('minBudget').value = '';
    document.getElementById('maxBudget').value = '';
    document.getElementById('hostelType').value = '';
    document.getElementById('foodAvailability').value = '';
    document.getElementById('inTime').value = '';
    document.querySelectorAll('.amenity-checkbox').forEach(cb => cb.checked = false);
    filteredHostels = [...allHostels];
    renderHostelListings();
  }
}

// ==========================
// ===== OWNER PORTAL =======
// ==========================
if (window.location.pathname.includes('owner.html')) {
  initOwnerPortal();
}

function initOwnerPortal() {
  const authTabs         = document.querySelectorAll('.auth-tab');
  const ownerLoginForm   = document.getElementById('ownerLoginForm');
  const ownerRegisterForm = document.getElementById('ownerRegisterForm');
  const ownerAuthSection = document.getElementById('ownerAuthSection');
  const ownerDashboard   = document.getElementById('ownerDashboard');
  const addListingSection = document.getElementById('addListingSection');
  const ownerLogoutBtn   = document.getElementById('ownerLogoutBtn');

  // Check if already logged in
  const savedOwner = sessionStorage.getItem('currentOwner');
  if (savedOwner) {
    currentUser = JSON.parse(savedOwner);
    showOwnerDashboard();
  }

  // ── Auth Tabs ──
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (targetTab === 'owner-login') {
        ownerLoginForm.classList.add('active');
        ownerRegisterForm.classList.remove('active');
      } else {
        ownerRegisterForm.classList.add('active');
        ownerLoginForm.classList.remove('active');
      }
    });
  });

  // ── Owner Register ──
  const ownerRegisterFormSubmit = document.getElementById('ownerRegisterFormSubmit');
  if (ownerRegisterFormSubmit) {
    ownerRegisterFormSubmit.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name            = document.getElementById('ownerRegisterName').value.trim();
      const email           = document.getElementById('ownerRegisterEmail').value.trim();
      const phone           = document.getElementById('ownerRegisterPhone').value.trim();
      const password        = document.getElementById('ownerRegisterPassword').value;
      const confirmPassword = document.getElementById('ownerRegisterConfirmPassword').value;

      if (password !== confirmPassword) return showToast('Passwords do not match!', true);
      if (password.length < 6)          return showToast('Password must be at least 6 characters!', true);

      const btn = ownerRegisterFormSubmit.querySelector('button[type="submit"]');
      btn.textContent = 'Registering...';
      btn.disabled = true;

      const result = await apiFetch('/api/auth?action=register', {
        method: 'POST',
        body: { name, email, password, phone, role: 'owner' }
      });

      btn.textContent = 'Register';
      btn.disabled = false;

      if (!result.success) return showToast(result.error || 'Registration failed', true);

      currentUser = result.data;
      sessionStorage.setItem('currentOwner', JSON.stringify(currentUser));
      showToast('Registration successful! Welcome to Acadia!');
      showOwnerDashboard();
    });
  }

  // ── Owner Login ──
  const ownerLoginFormSubmit = document.getElementById('ownerLoginFormSubmit');
  if (ownerLoginFormSubmit) {
    ownerLoginFormSubmit.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = document.getElementById('ownerLoginEmail').value.trim();
      const password = document.getElementById('ownerLoginPassword').value;

      const btn = ownerLoginFormSubmit.querySelector('button[type="submit"]');
      btn.textContent = 'Logging in...';
      btn.disabled = true;

      const result = await apiFetch('/api/auth?action=login', {
        method: 'POST',
        body: { email, password, role: 'owner' }
      });

      btn.textContent = 'Login';
      btn.disabled = false;

      if (!result.success) return showToast(result.error || 'Login failed', true);

      currentUser = result.data;
      sessionStorage.setItem('currentOwner', JSON.stringify(currentUser));
      showToast(`Welcome back, ${currentUser.name}!`);
      showOwnerDashboard();
    });
  }

  // ── Logout ──
  if (ownerLogoutBtn) {
    ownerLogoutBtn.addEventListener('click', () => {
      currentUser = null;
      sessionStorage.removeItem('currentOwner');
      location.reload();
    });
  }

  // ── Show Dashboard ──
  function showOwnerDashboard() {
    if (ownerAuthSection) ownerAuthSection.style.display = 'none';
    if (ownerDashboard)   ownerDashboard.style.display = 'block';
    if (ownerLogoutBtn)   ownerLogoutBtn.style.display = 'block';
    renderOwnerListings();
  }

  // ── Load & Render Owner's Listings ──
  async function renderOwnerListings() {
    const ownerListingsGrid = document.getElementById('ownerListingsGrid');
    if (!ownerListingsGrid || !currentUser) return;

    ownerListingsGrid.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">Loading your listings...</p>';

    const result = await apiFetch('/api/hostels');

    if (!result.success) {
      ownerListingsGrid.innerHTML = '<p style="text-align:center;color:red;">Failed to load listings.</p>';
      return;
    }

    // Show only THIS owner's listings
    const myListings = result.data.filter(h => h.ownerEmail === currentUser.email);

    if (myListings.length === 0) {
      ownerListingsGrid.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">No listings yet. Click "Add New Hostel" to create your first listing.</p>';
      return;
    }

    ownerListingsGrid.innerHTML = myListings.map(listing => `
      <div class="owner-listing-card">
        <div class="listing-card-header">
          <div>
            <h3>${listing.name}</h3>
            <span class="hostel-type">${listing.type.toUpperCase()}</span>
          </div>
          <div class="listing-card-actions">
            <button class="icon-btn edit-listing-btn" data-id="${listing._id}" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="icon-btn delete-listing-btn" data-id="${listing._id}" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="hostel-price">₹${listing.price}<small>/month</small></div>
        <p style="color:var(--text-secondary);margin:1rem 0;">${listing.location}</p>
        <p style="color:var(--text-secondary);">${listing.description}</p>
        <div class="hostel-amenities" style="margin-top:1rem;">
          ${listing.amenities.slice(0, 3).map(a => `<span class="amenity-tag">${a}</span>`).join('')}
          ${listing.amenities.length > 3 ? `<span class="amenity-tag">+${listing.amenities.length - 3}</span>` : ''}
        </div>
      </div>
    `).join('');

    // Edit buttons
    document.querySelectorAll('.edit-listing-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const listing = myListings.find(l => l._id === btn.dataset.id);
        if (listing) editListing(listing);
      });
    });

    // Delete buttons
    document.querySelectorAll('.delete-listing-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteListing(btn.dataset.id));
    });
  }

  // ── Show Add Form ──
  const showAddListingFormBtn = document.getElementById('showAddListingForm');
  if (showAddListingFormBtn) {
    showAddListingFormBtn.addEventListener('click', () => {
      document.getElementById('listingFormTitle').textContent = 'Add New Hostel';
      document.getElementById('addListingForm').reset();
      document.getElementById('editListingId').value = '';
      if (ownerDashboard)    ownerDashboard.style.display = 'none';
      if (addListingSection) addListingSection.style.display = 'block';
    });
  }

  // ── Back / Cancel ──
  const backToDashboardBtn = document.getElementById('backToDashboard');
  if (backToDashboardBtn) {
    backToDashboardBtn.addEventListener('click', () => {
      if (addListingSection) addListingSection.style.display = 'none';
      if (ownerDashboard)    ownerDashboard.style.display = 'block';
    });
  }
  const cancelListingBtn = document.getElementById('cancelListing');
  if (cancelListingBtn) {
    cancelListingBtn.addEventListener('click', () => {
      if (addListingSection) addListingSection.style.display = 'none';
      if (ownerDashboard)    ownerDashboard.style.display = 'block';
    });
  }

  // ── Add / Edit Listing Submit ──
  const addListingForm = document.getElementById('addListingForm');
  if (addListingForm) {
    addListingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const editId      = document.getElementById('editListingId').value;
      const name        = document.getElementById('hostelName').value.trim();
      const price       = document.getElementById('hostelPrice').value;
      const type        = document.getElementById('hostelTypeSelect').value;
      const location    = document.getElementById('hostelLocation').value.trim();
      const description = document.getElementById('hostelDescription').value.trim();
      const amenities   = Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(cb => cb.value);
      const food        = document.getElementById('foodAvailabilitySelect').value;
      const inTime      = document.getElementById('inTimeSelect').value;
      const rulesRaw    = document.getElementById('hostelRules').value;
      const rules       = rulesRaw ? rulesRaw.split('\n').filter(r => r.trim()) : [];

      const payload = {
        name, price, type, location, description, amenities, food, inTime, rules,
        ownerEmail: currentUser.email,
        ownerName:  currentUser.name,
        ownerPhone: currentUser.phone || ''
      };

      const btn = addListingForm.querySelector('button[type="submit"]');
      btn.textContent = editId ? 'Saving...' : 'Adding...';
      btn.disabled = true;

      let result;
      if (editId) {
        result = await apiFetch(`/api/hostel/${editId}`, { method: 'PUT', body: { ...payload, ownerEmail: currentUser.email } });
      } else {
        result = await apiFetch('/api/hostels', { method: 'POST', body: payload });
      }

      btn.textContent = 'Save Listing';
      btn.disabled = false;

      if (!result.success) return showToast(result.error || 'Failed to save listing', true);

      showToast(editId ? 'Listing updated successfully!' : 'Listing added successfully!');
      addListingForm.reset();
      if (addListingSection) addListingSection.style.display = 'none';
      if (ownerDashboard)    ownerDashboard.style.display = 'block';
      renderOwnerListings();
    });
  }

  function editListing(listing) {
    document.getElementById('listingFormTitle').textContent = 'Edit Hostel';
    document.getElementById('editListingId').value = listing._id;
    document.getElementById('hostelName').value = listing.name;
    document.getElementById('hostelPrice').value = listing.price;
    document.getElementById('hostelTypeSelect').value = listing.type;
    document.getElementById('hostelLocation').value = listing.location;
    document.getElementById('hostelDescription').value = listing.description;
    document.getElementById('foodAvailabilitySelect').value = listing.food;
    document.getElementById('inTimeSelect').value = listing.inTime;
    document.getElementById('hostelRules').value = listing.rules.join('\n');

    document.querySelectorAll('input[name="amenities"]').forEach(cb => {
      cb.checked = listing.amenities.includes(cb.value);
    });

    if (ownerDashboard)    ownerDashboard.style.display = 'none';
    if (addListingSection) addListingSection.style.display = 'block';
  }

  async function deleteListing(listingId) {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    const result = await apiFetch(`/api/hostel/${listingId}`, {
      method: 'DELETE',
      body: { ownerEmail: currentUser.email }
    });

    if (!result.success) return showToast(result.error || 'Failed to delete listing', true);

    showToast('Listing deleted successfully!');
    renderOwnerListings();
  }
}
