// Streak System - Tracks consecutive days of voting
class StreakSystem {
    constructor() {
        this.STORAGE_KEY = 'votingStreak';
        this.LAST_VOTE_KEY = 'lastVoteDate';
        this.init();
    }

    init() {
        this.loadStreak();
        this.checkStreakContinuity();
        this.updateStreakDisplay();
    }

    loadStreak() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        this.currentStreak = stored ? parseInt(stored, 10) : 0;
    }

    saveStreak() {
        localStorage.setItem(this.STORAGE_KEY, this.currentStreak.toString());
    }

    getLastVoteDate() {
        const stored = localStorage.getItem(this.LAST_VOTE_KEY);
        return stored ? new Date(stored) : null;
    }

    saveLastVoteDate() {
        localStorage.setItem(this.LAST_VOTE_KEY, new Date().toISOString());
    }

    checkStreakContinuity() {
        const today = new Date().toDateString();
        const lastVote = this.getLastVoteDate();

        if (!lastVote) {
            // First vote ever
            return;
        }

        const lastVoteDate = lastVote.toDateString();

        if (lastVoteDate === today) {
            // Already voted today, streak continues
            return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();

        if (lastVoteDate === yesterdayString) {
            // Voted yesterday, streak continues
            return;
        }

        // Streak is broken
        this.currentStreak = 0;
        this.saveStreak();
    }

    incrementStreak() {
        const today = new Date().toDateString();
        const lastVote = this.getLastVoteDate();

        if (lastVote && lastVote.toDateString() === today) {
            // Already voted today, don't increment again
            return false;
        }

        this.currentStreak++;
        this.saveStreak();
        this.saveLastVoteDate();
        return true;
    }

    getStreak() {
        return this.currentStreak;
    }

    updateStreakDisplay() {
        const streakBadge = document.getElementById('streakBadge');
        if (streakBadge) {
            const streak = this.getStreak();
            streakBadge.textContent = `🔥 Streak: ${streak}`;
            streakBadge.title = `${streak} consecutive days of voting`;
        }
    }

    resetDisplay() {
        this.loadStreak();
        this.updateStreakDisplay();
    }
}

// Initialize streak system globally
const streakSystem = new StreakSystem();
