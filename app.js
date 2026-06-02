// Configuration
const API_URL = 'http://localhost:3001';
const DISCORD_SERVER_INVITE = 'https://discord.gg/fnDYaTEzSt';

// Security token for the voting link (shared secret)
const VALID_TOKEN = 'trao_phung_voting_2026_secure';

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const tabContents = document.querySelectorAll('.tab-content');
const pollContent = document.getElementById('pollContent');
const statsContent = document.getElementById('statsContent');
const archiveContent = document.getElementById('archiveContent');
const pollDate = document.getElementById('pollDate');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const filterBtn = document.getElementById('filterBtn');

let referralCode = null;
let userIP = null;
let isValidReferral = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkReferralSource();
    if (isValidReferral) {
        loadUserIP();
        setupEventListeners();
        loadPoll();
        setDateInputDefaults();
    }
});

// Verify access using token from URL
function checkReferralSource() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    console.log('Token received:', token);
    console.log('Expected token:', VALID_TOKEN);
    
    // Check if they have the correct security token
    if (token && token === VALID_TOKEN) {
        isValidReferral = true;
        console.log('✅ Valid security token detected - Access granted!');
        // Store token in session to prevent token reuse attacks
        sessionStorage.setItem('votingToken', token);
        sessionStorage.setItem('accessTime', new Date().getTime());
        return true;
    }

    // Check if already has valid session token
    const sessionToken = sessionStorage.getItem('votingToken');
    if (sessionToken && sessionToken === VALID_TOKEN) {
        const accessTime = parseInt(sessionStorage.getItem('accessTime'));
        // Token valid for 24 hours
        if (new Date().getTime() - accessTime < 24 * 60 * 60 * 1000) {
            isValidReferral = true;
            console.log('✅ Valid session token detected - Access granted!');
            return true;
        }
    }

    // Access denied - show instructions
    showAccessDeniedScreen();
    return false;
}

function showAccessDeniedScreen() {
    document.body.innerHTML = `
        <div style="background-color: #36393f; color: #dcddde; font-family: 'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
            <div style="max-width: 600px; background-color: #2c2f33; padding: 3rem; border-radius: 12px; border: 2px solid #ed4245; text-align: center;">
                <h1 style="color: #ed4245; margin-bottom: 1rem; font-size: 2rem;">❌ Invalid Access</h1>
                
                <p style="color: #b5bac1; font-size: 1.1rem; margin-bottom: 1.5rem; line-height: 1.6;">
                    This voting website can <strong>only be accessed through the official voting link posted in our Discord server</strong>.
                </p>

                <div style="background-color: #1e2124; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; text-align: left;">
                    <p style="color: #99aab5; margin-bottom: 0.5rem;">📝 <strong>How to access:</strong></p>
                    <ol style="color: #b5bac1; margin-left: 1.5rem; margin-top: 0.5rem;">
                        <li style="margin-bottom: 0.5rem;">Go to your Discord server</li>
                        <li style="margin-bottom: 0.5rem;">Find the voting announcement message</li>
                        <li style="margin-bottom: 0.5rem;">Click the voting link in that message</li>
                        <li>You'll have full access to vote</li>
                    </ol>
                </div>

                <a href="${DISCORD_SERVER_INVITE}" style="background-color: #5865f2; color: white; padding: 1rem 2rem; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 1rem; transition: background-color 0.3s ease; cursor: pointer;" onmouseover="this.style.backgroundColor='#4752c4'" onmouseout="this.style.backgroundColor='#5865f2'">
                    Go to Discord Server
                </a>

                <p style="color: #72767d; font-size: 0.9rem; margin-top: 2rem;">
                    This security measure ensures only authorized members can vote.
                </p>
            </div>
        </div>
    `;
    document.body.style.margin = '0';
    document.body.style.padding = '0';
}

// Get user's public IP address
async function loadUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userIP = data.ip;
        console.log('✅ User IP detected:', userIP);
    } catch (err) {
        console.error('Error getting IP:', err);
        // Fallback: use a hash of user agent if IP fetch fails
        userIP = 'local_' + btoa(navigator.userAgent).substring(0, 10);
        console.log('⚠️ Using fallback IP:', userIP);
    }
}

// Event Listeners
function setupEventListeners() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.dataset.tab;
            switchTab(tabName);
        });
    });

    filterBtn.addEventListener('click', loadStatistics);
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
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #202225; text-align: center; color: #99aab5; font-size: 0.85rem;">
            Total Votes: ${total}
        </div>
    `;

    // Add event listeners to vote buttons
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            castVote(btn.dataset.vote, poll.id);
        });
    });
}

function castVote(vote, pollId) {
    if (!userIP) {
        alert('Unable to verify your IP address. Please refresh and try again.');
        return;
    }

    fetch(`${API_URL}/polls/vote`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': userIP,
        },
        body: JSON.stringify({ 
            vote,
            ipAddress: userIP
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadPoll();
                alert('✅ Your vote has been recorded!');
            } else if (data.error) {
                alert('❌ Error: ' + data.error);
            }
        })
        .catch(err => {
            console.error('Error casting vote:', err);
            alert('Failed to cast vote');
        });
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
    if (document.querySelector('.tab-content.active')?.id === 'pollsTab') {
        loadPoll();
    }
}, 30000);
