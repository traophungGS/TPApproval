// Configuration
const API_URL = 'http://localhost:3001';
const DISCORD_SERVER_INVITE = 'https://discord.gg/fnDYaTEzSt';

// Security token for the voting link (shared secret)
const VALID_TOKEN = 'trao_phung_voting_2026_secure';

// Poll definitions - 5 options format that reset daily
const POLLS_CONFIG = [
    {
        id: 'ortho_general_secretary',
        title: 'Ortho as General Secretary',
        question: 'How do you rate Ortho as General Secretary?',
        options: ['Excellent', 'Approve', 'Not sure', 'Disapprove', 'Disappointed']
    },
    {
        id: 'ortho_semblae',
        title: 'Ortho as Semblae representative',
        question: 'How do you rate Ortho as Semblae representative?',
        options: ['Excellent', 'Approve', 'Not sure', 'Disapprove', 'Disappointed']
    },
    {
        id: 'easternfed_president',
        title: 'Easternfed as Eastern Federation president',
        question: 'How do you rate Easternfed as Eastern Federation president?',
        options: ['Excellent', 'Approve', 'Not sure', 'Disapprove', 'Disappointed']
    }
];

// Emoji mapping for options
const OPTION_EMOJIS = {
    'Excellent': '⭐',
    'Approve': '👍',
    'Not sure': '😐',
    'Disapprove': '👎',
    'Disappointed': '😞'
};

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const tabContents = document.querySelectorAll('.tab-content');
const pollsContainer = document.getElementById('pollsContainer');
const statsContent = document.getElementById('statsContent');
const pollDate = document.getElementById('pollDate');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const filterBtn = document.getElementById('filterBtn');
const pollSelect = document.getElementById('pollSelect');
const statsChart = document.getElementById('statsChart');

let referralCode = null;
let userIP = null;
let isValidReferral = false;
let userVotedPolls = {}; // Track which polls user has voted on today
let pollHistory = {}; // Store historical data by date and option

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkReferralSource();
    if (isValidReferral) {
        loadUserIP();
        setupEventListeners();
        initializeHistoricalData();
        loadPolls();
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

                <a href="${DISCORD_SERVER_INVITE}" style="background-color: #5865f2; color: white; padding: 1rem 2rem; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600;">
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
        
        // Load which polls this IP has voted on today
        loadUserVoteStatus();
    } catch (err) {
        console.error('Error getting IP:', err);
        // Fallback: use a hash of user agent if IP fetch fails
        userIP = 'local_' + btoa(navigator.userAgent).substring(0, 10);
        console.log('⚠️ Using fallback IP:', userIP);
        loadUserVoteStatus();
    }
}

// Load which polls the user has already voted on
function loadUserVoteStatus() {
    const today = new Date().toISOString().split('T')[0];
    const storedStatus = localStorage.getItem(`votedPolls_${userIP}_${today}`);
    
    if (storedStatus) {
        userVotedPolls = JSON.parse(storedStatus);
    } else {
        userVotedPolls = {};
        POLLS_CONFIG.forEach(poll => {
            userVotedPolls[poll.id] = false;
        });
    }
}

// Save user vote status
function saveUserVoteStatus() {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`votedPolls_${userIP}_${today}`, JSON.stringify(userVotedPolls));
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
    } else if (tabName === 'polls') {
        loadPolls();
    }
}

// Initialize historical data in localStorage
function initializeHistoricalData() {
    const storedData = localStorage.getItem('pollHistory');
    
    if (!storedData) {
        // Initialize with empty data
        pollHistory = {};
        POLLS_CONFIG.forEach(poll => {
            pollHistory[poll.id] = {};
        });
    } else {
        pollHistory = JSON.parse(storedData);
    }
    
    // Ensure all polls exist in history
    POLLS_CONFIG.forEach(poll => {
        if (!pollHistory[poll.id]) {
            pollHistory[poll.id] = {};
        }
    });
}

// Poll Functions - Load all three polls
function loadPolls() {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    pollDate.textContent = today;

    pollsContainer.innerHTML = '';

    POLLS_CONFIG.forEach(pollConfig => {
        const pollCard = createPollCard(pollConfig);
        pollsContainer.appendChild(pollCard);
    });
}

function createPollCard(pollConfig) {
    const card = document.createElement('div');
    card.className = 'poll-card';
    
    // Get today's vote counts for this poll
    const today = new Date().toISOString().split('T')[0];
    const todayVotes = pollHistory[pollConfig.id][today] || {};
    
    // Count total votes
    const total = Object.values(todayVotes).reduce((a, b) => a + b, 0);
    const getPercentage = (count) => (total > 0 ? ((count / total) * 100).toFixed(1) : 0);

    // Check if user has voted on this poll
    const hasVoted = userVotedPolls[pollConfig.id];

    let optionsHTML = '<div class="vote-options">';
    pollConfig.options.forEach(option => {
        const emoji = OPTION_EMOJIS[option] || '•';
        const count = todayVotes[option] || 0;
        optionsHTML += `
            <button class="vote-btn ${hasVoted ? 'disabled' : ''}" data-vote="${option}" data-poll="${pollConfig.id}" ${hasVoted ? 'disabled' : ''}>
                <span>${emoji} ${option}</span>
                <span class="vote-count">${count}</span>
            </button>
        `;
    });
    optionsHTML += '</div>';

    let statsHTML = '<div class="poll-stats">';
    pollConfig.options.forEach(option => {
        const percentage = getPercentage(todayVotes[option] || 0);
        statsHTML += `
            <div class="stat-item">
                <div class="stat-label">${option}</div>
                <div class="stat-value">${percentage}%</div>
            </div>
        `;
    });
    statsHTML += '</div>';

    const voteStatusHTML = hasVoted ? '<div style="margin-top: 1rem; padding: 0.75rem; background-color: #57f287; color: #000; border-radius: 6px; text-align: center; font-weight: 600;">✅ You voted today</div>' : '';

    card.innerHTML = `
        <div class="card-title">${pollConfig.title}</div>
        <div class="poll-question">${pollConfig.question}</div>
        ${optionsHTML}
        ${statsHTML}
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #202225; text-align: center; color: #99aab5; font-size: 0.85rem;">
            Total Votes: ${total}
        </div>
        ${voteStatusHTML}
    `;

    // Add event listeners to vote buttons
    card.querySelectorAll('.vote-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            castVote(btn.dataset.vote, btn.dataset.poll, pollConfig);
        });
    });

    return card;
}

function castVote(option, pollId, pollConfig) {
    if (!userIP) {
        alert('Unable to verify your IP address. Please refresh and try again.');
        return;
    }

    // Check if user has already voted on this poll today
    if (userVotedPolls[pollId]) {
        alert('❌ You have already voted on this poll today. Try again tomorrow!');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Initialize today's data if not exists
    if (!pollHistory[pollId][today]) {
        pollHistory[pollId][today] = {};
    }

    // Initialize all options if not exists
    pollConfig.options.forEach(opt => {
        if (!pollHistory[pollId][today][opt]) {
            pollHistory[pollId][today][opt] = 0;
        }
    });

    // Increment the vote count for this option
    pollHistory[pollId][today][option]++;

    // Save history
    localStorage.setItem('pollHistory', JSON.stringify(pollHistory));

    // Mark that this user has voted on this poll
    userVotedPolls[pollId] = true;
    saveUserVoteStatus();

    // Check if this is the first vote of the day across all polls
    const hasVotedAnyPoll = Object.values(userVotedPolls).some(voted => voted === true);
    const justVotedFirstTime = Object.values(userVotedPolls).filter(voted => voted === true).length === 1;

    // Increment streak on first vote of the day
    if (justVotedFirstTime && streakSystem) {
        const incremented = streakSystem.incrementStreak();
        if (incremented) {
            streakSystem.updateStreakDisplay();
            console.log('✅ Streak incremented! Current streak:', streakSystem.getStreak());
        }
    }

    // Update poll display
    loadPolls();
    
    console.log(`✅ Your vote for "${option}" on "${pollConfig.title}" has been recorded!`);
}

// Statistics Functions
function setDateInputDefaults() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    endDate.value = today.toISOString().split('T')[0];
    startDate.value = thirtyDaysAgo.toISOString().split('T')[0];
}

function loadStatistics() {
    const selectedPoll = pollSelect.value;
    const start = startDate.value;
    const end = endDate.value;

    if (!selectedPoll) {
        alert('Please select a poll');
        return;
    }

    if (!start || !end) {
        alert('Please select both start and end dates');
        return;
    }

    if (new Date(start) > new Date(end)) {
        alert('Start date must be before end date');
        return;
    }

    // Get historical data for the selected poll and date range
    const pollData = pollHistory[selectedPoll] || {};
    const chartData = generateChartData(selectedPoll, pollData, start, end);
    
    if (chartData.datasets[0].data.length === 0) {
        statsContent.innerHTML = '<div style="text-align: center; color: #99aab5; padding: 2rem;">No data available for selected date range</div>';
        if (statsChart.chart) {
            statsChart.chart.destroy();
        }
        statsChart.style.display = 'none';
        return;
    }
    
    renderChart(chartData);
    renderStatisticsTable(chartData);
}

function generateChartData(pollId, pollData, startDateStr, endDateStr) {
    const pollConfig = POLLS_CONFIG.find(p => p.id === pollId);
    const options = pollConfig?.options || [];
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    const dates = [];
    const datasets = options.map(option => ({
        label: option,
        data: [],
        emoji: OPTION_EMOJIS[option],
        borderColor: getColorForOption(option),
        backgroundColor: getColorForOption(option, true),
        tension: 0.1,
        fill: false
    }));

    // Generate data for each day in range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dates.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

        options.forEach((option, idx) => {
            const dayData = pollData[dateStr] || {};
            const count = dayData[option] || 0;
            datasets[idx].data.push(count);
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return { dates, datasets };
}

function getColorForOption(option, transparent = false) {
    const colors = {
        'Excellent': '#57f287',
        'Approve': '#5865f2',
        'Not sure': '#faa61a',
        'Disapprove': '#ed4245',
        'Disappointed': '#9c27b0'
    };
    
    const color = colors[option] || '#99aab5';
    return transparent ? color + '33' : color;
}

function renderChart(chartData) {
    if (statsChart.chart) {
        statsChart.chart.destroy();
    }

    statsChart.style.display = 'block';

    const ctx = statsChart.getContext('2d');
    statsChart.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.dates,
            datasets: chartData.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#dcddde',
                        padding: 15
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#b5bac1'
                    },
                    grid: {
                        color: '#202225'
                    }
                },
                x: {
                    ticks: {
                        color: '#b5bac1'
                    },
                    grid: {
                        color: '#202225'
                    }
                }
            }
        }
    });
}

function renderStatisticsTable(chartData) {
    let html = '<div style="margin-top: 2rem;"><h3 style="color: #5865f2; margin-bottom: 1rem;">Vote Counts by Date</h3><div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse; color: #dcddde;">';
    
    html += '<tr style="background-color: #2c2f33; border-bottom: 2px solid #202225;">';
    html += '<th style="padding: 0.75rem; text-align: left;">Date</th>';
    chartData.datasets.forEach(ds => {
        html += `<th style="padding: 0.75rem; text-align: center;">${ds.emoji} ${ds.label}</th>`;
    });
    html += '</tr>';

    chartData.dates.forEach((date, idx) => {
        html += `<tr style="border-bottom: 1px solid #202225;">`;
        html += `<td style="padding: 0.75rem;">${date}</td>`;
        chartData.datasets.forEach(ds => {
            html += `<td style="padding: 0.75rem; text-align: center; color: ${ds.borderColor}; font-weight: 600;">${ds.data[idx]}</td>`;
        });
        html += '</tr>';
    });

    html += '</table></div></div>';
    statsContent.innerHTML = html;
}

// Auto-refresh poll every 30 seconds
setInterval(() => {
    if (document.querySelector('.tab-content.active')?.id === 'pollsTab') {
        loadPolls();
    }
}, 30000);
