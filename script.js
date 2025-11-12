class GitHubPortfolio {
    constructor() {
        this.orgName = 'github'; // Change this to your organization name
        this.repos = [];
        this.filteredRepos = [];
        this.languages = new Set();
        
        this.init();
    }

    async init() {
        await this.loadOrganizationInfo();
        await this.loadRepositories();
        this.setupEventListeners();
    }

    async fetchFromGitHub(endpoint) {
        try {
            const response = await fetch(`https://api.github.com/${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching from GitHub:', error);
            this.showError();
            throw error;
        }
    }

    async loadOrganizationInfo() {
        try {
            const orgData = await this.fetchFromGitHub(`orgs/${this.orgName}`);
            
            document.getElementById('org-name').textContent = orgData.name || orgData.login;
            document.getElementById('org-avatar').src = orgData.avatar_url;
            document.getElementById('org-description').textContent = orgData.description || '';
            document.getElementById('repo-count').textContent = `${orgData.public_repos} Repositories`;
            document.getElementById('member-count').textContent = `${orgData.public_members || 0} Members`;
            
        } catch (error) {
            this.showError();
        }
    }

    async loadRepositories() {
        try {
            this.repos = await this.fetchFromGitHub(`orgs/${this.orgName}/repos?sort=updated&per_page=100`);
            this.processRepositories();
            this.renderRepositories();
            this.hideLoading();
        } catch (error) {
            this.showError();
        }
    }

    processRepositories() {
        this.repos.forEach(repo => {
            if (repo.language) {
                this.languages.add(repo.language);
            }
        });

        this.populateLanguageFilter();
        this.filteredRepos = [...this.repos];
    }

    populateLanguageFilter() {
        const languageFilter = document.getElementById('language-filter');
        languageFilter.innerHTML = '<option value="all">All Languages</option>';
        
        this.languages.forEach(language => {
            const option = document.createElement('option');
            option.value = language;
            option.textContent = language;
            languageFilter.appendChild(option);
        });
    }

    renderRepositories() {
        const grid = document.getElementById('repos-grid');
        
        if (this.filteredRepos.length === 0) {
            grid.innerHTML = `
                <div class="no-repos" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: white;">
                    <i class="fas fa-search" style="font-size: 3em; margin-bottom: 20px;"></i>
                    <h3>No repositories found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.filteredRepos.map(repo => `
            <a href="${repo.html_url}" target="_blank" class="repo-card">
                <div class="repo-header">
                    <div class="repo-name">${repo.name}</div>
                    <div class="repo-stats">
                        <span class="repo-stat">
                            <i class="fas fa-star"></i>
                            ${repo.stargazers_count}
                        </span>
                        <span class="repo-stat">
                            <i class="fas fa-code-branch"></i>
                            ${repo.forks_count}
                        </span>
                    </div>
                </div>
                <p class="repo-description">${repo.description || 'No description provided'}</p>
                <div class="repo-meta">
                    ${repo.language ? `
                        <div class="repo-language">
                            <span class="language-color" style="background-color: ${this.getLanguageColor(repo.language)}"></span>
                            ${repo.language}
                        </div>
                    ` : ''}
                    <div class="repo-stat">
                        <i class="fas fa-calendar"></i>
                        Updated ${this.formatDate(repo.updated_at)}
                    </div>
                </div>
                ${repo.topics && repo.topics.length > 0 ? `
                    <div class="repo-topics">
                        ${repo.topics.slice(0, 3).map(topic => `
                            <span class="topic">${topic}</span>
                        `).join('')}
                        ${repo.topics.length > 3 ? `<span class="topic">+${repo.topics.length - 3}</span>` : ''}
                    </div>
                ` : ''}
            </a>
        `).join('');
    }

    getLanguageColor(language) {
        const colors = {
            JavaScript: '#f1e05a',
            Python: '#3572A5',
            Java: '#b07219',
            TypeScript: '#2b7489',
            'C++': '#f34b7d',
            PHP: '#4F5D95',
            Ruby: '#701516',
            Go: '#00ADD8',
            Rust: '#dea584',
            CSS: '#563d7c',
            HTML: '#e34c26',
            Swift: '#ffac45',
            Kotlin: '#F18E33',
            'C#': '#178600',
            Shell: '#89e051'
        };
        return colors[language] || '#6c757d';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'today';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    }

    filterRepositories() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const languageFilter = document.getElementById('language-filter').value;
        
        this.filteredRepos = this.repos.filter(repo => {
            const matchesSearch = repo.name.toLowerCase().includes(searchTerm) ||
                                (repo.description && repo.description.toLowerCase().includes(searchTerm));
            
            const matchesLanguage = languageFilter === 'all' || repo.language === languageFilter;
            
            return matchesSearch && matchesLanguage;
        });
        
        this.renderRepositories();
    }

    setupEventListeners() {
        // Search input
        document.getElementById('search-input').addEventListener('input', () => {
            this.filterRepositories();
        });

        // Language filter
        document.getElementById('language-filter').addEventListener('change', () => {
            this.filterRepositories();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const filter = e.target.dataset.filter;
                const languageFilter = document.getElementById('language-filter');
                
                if (filter === 'language') {
                    languageFilter.style.display = 'block';
                } else {
                    languageFilter.style.display = 'none';
                    languageFilter.value = 'all';
                    this.filterRepositories();
                }
            });
        });
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showError() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error-message').style.display = 'block';
    }
}

// Initialize the portfolio when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GitHubPortfolio();
});
