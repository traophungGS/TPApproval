// Configuration
const API_URL = 'http://localhost:3001';
const DISCORD_CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID';
const REDIRECT_URI = encodeURIComponent('http://localhost:3001/auth/discord/callback');

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const tabContents = document.querySelectorAll('.tab-content');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const username = document.getElementById('username');
const userAvatar = document.getElementById('userAvatar');
const loginModal = document.getElementById('loginModal');
const discordLoginBtn = document.getElementById('discordLoginBtn');
const closeBtn = document.querySelector('.close');
const pollContent = document.getElementById('pollContent');
const statsContent = document.getElementById('statsContent');
const archiveContent = document.getElementById('archiveContent');
const pollDate = document.getElementById('pollDate');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const filterBtn = document.getElementById('filterBtn');

let currentUser = null;
let currentToken = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
    loadPoll();
    setDateInputDefaults();
});

// Event Listeners
function setupEventListeners() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.dataset.tab;
            switchTab(tabName);
        });
    });

    loginBtn.addEventListener('click', showLoginModal);
    logoutBtn.addEventListener('click', logout);
    discordLoginBtn.addEventListener('click', loginWithDiscord);
    closeBtn.addEventListener('click', closeLoginModal);
    filterBtn.addEventListener('click', loadStatistics);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            closeLoginModal();
        }
    });
}

// Authentication
function checkAuthStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        currentToken = token;
        localStorage.setItem('authToken', token);
        verifyToken(token);
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        const savedToken = localStorage.getItem('authToken');
        if (savedToken) {
            currentToken = savedToken;
            verifyToken(savedToken);
        }
    }
}

function verifyToken(token) {
    fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.valid) {
                currentUser = data.user;
                updateUserUI();
            } else {
                localStorage.removeItem('authToken');
                currentToken = null;
                currentUser = null;
                updateUserUI();
            }
        })
        .catch(err => {
            console.error('Token verification failed:', err);
            localStorage.removeItem('authToken');
            currentToken = null;
            currentUser = null;
            updateUserUI();
        });
}

function updateUserUI() {
    if (currentUser) {
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        username.textContent = currentUser.username;
        // Try to get user avatar, fallback to default
        userAvatar.src = `https://ui-avatars.com/api/?name=${currentUser.username}&background=5865f2&color=fff`;
    } else {
        loginBtn.style.display = 'block';
        userInfo.style.display = 'none';
    }
}

function loginWithDiscord() {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify`;
    window.location.href = discordAuthUrl;
}

function logout() {
    localStorage.removeItem('authToken');
    currentToken = null;
    currentUser = null;
    updateUserUI();
    loadPoll();
    closeLoginModal();
}

function showLoginModal() {
    loginModal.style.display = 'flex';
}

function closeLoginModal() {
    loginModal.style.display = 'none';
}

// Tab Switching
function switchTab(tabName) {
    // Update nav links
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.tab === tabName) {
            link.classList.add('active');
        }
    });

    // Update tab content
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');

    // Load data for tab
    if (tabName === 'stats') {
        loadStatistics();
    } else if (tabName === 'archive') {
        loadArchive();
    } else if (tabName === 'polls') {
        loadPoll();
    }
}

// Poll Functions
function loadPoll() {
    fetch(`${API_URL}/polls/current`)
        .then(res => res.json())
        .then(data => {
            renderPoll(data);
            if (currentUser) {
                loadUserVote();
            }
        })
        .catch(err => console.error('Error loading poll:', err));
}

function renderPoll(poll) {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    pollDate.textContent = today;

    const approve = poll.votes.approve || 0;
    const disapprove = poll.votes.disapprove || 0;
    const neutral = poll.votes.neutral || 0;
    const total = poll.total || 0;

    const getPercentage = (count) => (total > 0 ? ((count / total) * 100).toFixed(1) : 0);

    pollContent.innerHTML = `
        <div class="poll-question">What's your approval rating today?</div>
        <div class="vote-options">
            <button class="vote-btn" data-vote="approve">
                <span>👍 Approve</span>
                <span class="vote-count">${approve}</span>
            </button>
            <button class="vote-btn" data-vote="disapprove">
                <span>👎 Disapprove</span>
                <span class="vote-count">${disapprove}</span>
            </button>
            <button class="vote-btn" data-vote="neutral">
                <span>😐 Neutral</span>
                <span class="vote-count">${neutral}</span>
            </button>
        </div>
        <div class="poll-stats">
            <div class="stat-item">
                <div class="stat-label">Approve</div>
                <div class="stat-value">${getPercentage(approve)}%</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Disapprove</div>
                <div class="stat-value">${getPercentage(disapprove)}%</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Neutral</div>
                <div class="stat-value">${getPercentage(neutral)}%</div>
            </div>
        </div>
    `;

    // Add event listeners to vote buttons
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!currentUser) {
                showLoginModal();
                return;
            }
            castVote(btn.dataset.vote, poll.id);
        });
    });
}

function castVote(vote, pollId) {
    fetch(`${API_URL}/polls/vote`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ vote }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadPoll();
            }
        })
        .catch(err => console.error('Error casting vote:', err));
}

function loadUserVote() {
    fetch(`${API_URL}/polls/my-vote`, {
        headers: {
            'Authorization': `Bearer ${currentToken}`,
        },
    })
        .then(res => res.json())
        .then(data => {
            if (data.vote) {
                const voteBtn = document.querySelector(`[data-vote="${data.vote}"]`);
                if (voteBtn) {
                    voteBtn.classList.add('selected');
                }
            }
        })
        .catch(err => console.error('Error loading user vote:', err));
}

// Statistics Functions
function setDateInputDefaults() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    endDate.value = today.toISOString().split('T')[0];
    startDate.value = thirtyDaysAgo.toISOString().split('T')[0];
}

function loadStatistics() {
    const start = startDate.value;
    const end = endDate.value;

    if (!start || !end) {
        alert('Please select both start and end dates');
        return;
    }

    fetch(`${API_URL}/stats/range?startDate=${start}&endDate=${end}`)
        .then(res => res.json())
        .then(data => {
            renderStatistics(data);
        })
        .catch(err => console.error('Error loading statistics:', err));
}

function renderStatistics(polls) {
    if (polls.length === 0) {
        statsContent.innerHTML = '<div class="no-results">No data available for selected date range</div>';
        return;
    }

    statsContent.innerHTML = polls.map(poll => createStatCard(poll)).join('');
}

function createStatCard(poll) {
    const approve = poll.votes.approve || 0;
    const disapprove = poll.votes.disapprove || 0;
    const neutral = poll.votes.neutral || 0;
    const total = poll.total || 0;

    const getPercentage = (count) => (total > 0 ? ((count / total) * 100).toFixed(1) : 0);
    const approvePercent = getPercentage(approve);
    const disapprovePercent = getPercentage(disapprove);
    const neutralPercent = getPercentage(neutral);

    const date = new Date(poll.date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return `
        <div class="stat-card">
            <div class="card-date">${date}</div>
            <div class="card-title">Approval Rating</div>
            <div class="chart-container">
                <div class="chart-bar">
                    <div class="chart-label">Approve</div>
                    <div class="chart-track">
                        <div class="chart-fill approve" style="width: ${approvePercent}%">${approvePercent}%</div>
                    </div>
                </div>
                <div class="chart-bar">
                    <div class="chart-label">Disapprove</div>
                    <div class="chart-track">
                        <div class="chart-fill disapprove" style="width: ${disapprovePercent}%">${disapprovePercent}%</div>
                    </div>
                </div>
                <div class="chart-bar">
                    <div class="chart-label">Neutral</div>
                    <div class="chart-track">
                        <div class="chart-fill neutral" style="width: ${neutralPercent}%">${neutralPercent}%</div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <div class="footer-stat">
                    <div class="footer-stat-label">Approve</div>
                    <div class="footer-stat-value">${approve}</div>
                </div>
                <div class="footer-stat">
                    <div class="footer-stat-label">Disapprove</div>
                    <div class="footer-stat-value">${disapprove}</div>
                </div>
                <div class="footer-stat">
                    <div class="footer-stat-label">Neutral</div>
                    <div class="footer-stat-value">${neutral}</div>
                </div>
            </div>
        </div>
    `;
}

// Archive Functions
function loadArchive() {
    fetch(`${API_URL}/stats/archived`)
        .then(res => res.json())
        .then(data => {
            renderArchive(data);
        })
        .catch(err => console.error('Error loading archive:', err));
}

function renderArchive(polls) {
    if (polls.length === 0) {
        archiveContent.innerHTML = '<div class="no-results">No archived polls yet</div>';
        return;
    }

    archiveContent.innerHTML = polls.map(poll => createStatCard(poll)).join('');
}

// Auto-refresh poll every 30 seconds
setInterval(() => {
    if (document.querySelector('.tab-content.active').id === 'pollsTab') {
        loadPoll();
    }
}, 30000);
