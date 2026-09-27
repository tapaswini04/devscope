
import { useState } from "react";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [repoSearch, setRepoSearch] = useState("");
  const [language, setLanguage] = useState("All");

  async function searchGitHub(e) {
    e.preventDefault();

    // Accept either a username or a full GitHub profile URL
    const input = username.trim();
    const name = input
      .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
      .replace(/\/+$/, "")
      .split("/")[0];

    if (!name) {
      setError("Please enter a GitHub username or profile URL.");
      return;
    }

    setLoading(true);
    setError("");
    setProfile(null);
    setRepos([]);
    setRepoSearch("");
    setLanguage("All");

    try {
      const profileResponse = await fetch(
        `https://api.github.com/users/${encodeURIComponent(name)}`
      );

      if (profileResponse.status === 404) {
        throw new Error("GitHub username not found. Try another username.");
      }

      if (profileResponse.status === 403) {
        throw new Error(
          "GitHub API rate limit reached. Please try again later."
        );
      }

      if (!profileResponse.ok) {
        throw new Error("Unable to fetch profile. Please try again.");
      }

      const profileData = await profileResponse.json();

      const repoResponse = await fetch(
        `https://api.github.com/users/${encodeURIComponent(name)}/repos?per_page=100&sort=updated`
      );

      if (repoResponse.status === 403) {
        throw new Error(
          "GitHub API rate limit reached. Please try again later."
        );
      }

      if (!repoResponse.ok) {
        throw new Error("Unable to fetch repositories.");
      }

      const repoData = await repoResponse.json();

      setProfile(profileData);
      setRepos(repoData.filter((repo) => !repo.fork));
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const languages = [
    "All",
    ...new Set(repos.map((repo) => repo.language).filter(Boolean)),
  ].sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b)));

  const filteredRepos = repos.filter((repo) => {
    const matchesSearch = repo.name
      .toLowerCase()
      .includes(repoSearch.toLowerCase());

    const matchesLanguage =
      language === "All" || repo.language === language;

    return matchesSearch && matchesLanguage;
  });

  const totalStars = repos.reduce(
    (total, repo) => total + repo.stargazers_count,
    0
  );

  const languageStats = Object.entries(
    repos.reduce((stats, repo) => {
      if (repo.language) {
        stats[repo.language] = (stats[repo.language] || 0) + 1;
      }
      return stats;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="app">
      <header className="topbar">
        <a href="#" className="brand">
          <span className="brand-icon">⌘</span>
          DevScope<span className="brand-dot">.</span>
        </a>
        <span className="topbar-label">GITHUB ANALYTICS</span>
        <a
          className="github-link"
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </header>

      <main className="main-content">
        <section className="hero">
          <div className="eyebrow">
            <span className="status-dot" />
            DEVELOPER INSIGHTS, SIMPLIFIED
          </div>

          <h1>
            Explore your code.
            <br />
            <span>Understand your impact.</span>
          </h1>

          <p className="hero-description">
            Discover GitHub profiles, explore repositories, and
            understand a developer's open-source activity.
          </p>

          <form className="search-form" onSubmit={searchGitHub}>
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="Enter GitHub username or profile URL..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-label="GitHub username or profile URL"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Analyze profile →"}
            </button>
          </form>

          <p className="search-hint">
            Try a GitHub username (octocat) or profile URL
            (https://github.com/octocat).
          </p>
        </section>

        {error && (
          <div className="error-message" role="alert">
            <span>⚠</span> {error}
          </div>
        )}

        {loading && (
          <div className="loading-state" role="status">
            <div className="spinner" />
            <p>Fetching GitHub profile and repositories...</p>
          </div>
        )}

        {profile && !loading && (
          <section className="dashboard">
            <div className="section-heading">
              <div>
                <p className="section-label">ANALYSIS RESULTS</p>
                <h2>Developer overview</h2>
              </div>
              <span className="live-badge">
                <span className="status-dot" /> Live data
              </span>
            </div>

            <div className="profile-card">
              <div className="profile-main">
                <img
                  className="avatar"
                  src={profile.avatar_url}
                  alt={`${profile.login}'s GitHub avatar`}
                />

                <div className="profile-info">
                  <h2>{profile.name || profile.login}</h2>
                  <a
                    className="username"
                    href={profile.html_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{profile.login} ↗
                  </a>
                  <p className="bio">
                    {profile.bio || "This developer hasn't added a bio yet."}
                  </p>
                  <p className="location">
                    {profile.location ? `⌖ ${profile.location}` : ""}
                    {profile.company
                      ? `${profile.location ? " · " : ""}${profile.company}`
                      : ""}
                  </p>
                </div>
              </div>

              <a
                href={profile.html_url}
                target="_blank"
                rel="noreferrer"
                className="view-profile"
              >
                View profile ↗
              </a>
            </div>

            <div className="stats-grid">
              <StatCard
                label="Public repositories"
                value={profile.public_repos}
                icon="▤"
              />
              <StatCard
                label="Followers"
                value={profile.followers.toLocaleString()}
                icon="♧"
              />
              <StatCard
                label="Following"
                value={profile.following.toLocaleString()}
                icon="◎"
              />
              <StatCard
                label="Repository stars"
                value={totalStars.toLocaleString()}
                icon="☆"
              />
            </div>

            <div className="content-grid">
              <section className="panel languages-panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-label">TECH STACK</p>
                    <h3>Languages used</h3>
                  </div>
                  <span className="panel-icon">⌘</span>
                </div>

                {languageStats.length > 0 ? (
                  <div className="language-list">
                    {languageStats.slice(0, 6).map(([name, count]) => (
                      <div className="language-item" key={name}>
                        <div className="language-details">
                          <span>{name}</span>
                          <span>
                            {count} {count === 1 ? "repository" : "repositories"}
                          </span>
                        </div>
                        <div className="language-track">
                          <div
                            className="language-fill"
                            style={{
                              width: `${(count / repos.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">
                    No language data available for these repositories.
                  </p>
                )}

                <p className="panel-note">
                  Based on the primary language reported for each repository.
                </p>
              </section>

              <section className="panel repos-panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-label">OPEN SOURCE</p>
                    <h3>Repositories</h3>
                  </div>
                  <span className="repo-count">{repos.length} projects</span>
                </div>

                <input
                  className="repo-search"
                  type="search"
                  placeholder="Search repositories..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  aria-label="Search repositories"
                />

                <div className="filter-row">
                  <label htmlFor="language-filter">Language</label>
                  <select
                    id="language-filter"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="repo-list">
                  {filteredRepos.length > 0 ? (
                    filteredRepos.map((repo) => (
                      <article className="repo-item" key={repo.id}>
                        <div className="repo-title-row">
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="repo-name"
                          >
                            {repo.name} ↗
                          </a>
                          <span className="repo-stars">
                            ☆ {repo.stargazers_count}
                          </span>
                        </div>

                        <p className="repo-description">
                          {repo.description || "No description provided."}
                        </p>

                        <div className="repo-meta">
                          {repo.language && (
                            <span className="repo-language">
                              <span className="language-dot" />
                              {repo.language}
                            </span>
                          )}
                          <span>⑂ {repo.forks_count} forks</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="empty-message">
                      No repositories match your search or filter.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <p className="data-note">
              Data provided by the GitHub REST API. Private repositories
              are not included.
            </p>
          </section>
        )}

        {!profile && !loading && !error && (
          <section className="welcome-card">
            <div className="welcome-icon">⌘</div>
            <h3>Your next discovery starts here.</h3>
            <p>
              Search a GitHub username above to explore their profile,
              repositories, stars, and languages.
            </p>
          </section>
        )}

        <footer className="footer">
          <span>DevScope © 2026</span>
          <span>Built for developers, by developers.</span>
        </footer>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <p className="stat-value">{value}</p>
    </div>
  );
}

export default App;