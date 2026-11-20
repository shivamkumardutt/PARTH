
import { useState } from 'react';
import './App.css';

const courses = [
  { id: 1, subject: 'Mathematics', chapter: 'Relations and Functions', progress: 72, lessons: '12 of 16 lessons', icon: '∑', color: 'sage' },
  { id: 2, subject: 'Physics', chapter: 'Electrostatics', progress: 45, lessons: '9 of 20 lessons', icon: '◉', color: 'blue' },
  { id: 3, subject: 'Chemistry', chapter: 'Solutions', progress: 30, lessons: '6 of 20 lessons', icon: '⚗', color: 'sand' },
];

const activities = [
  { day: 'Mon', value: 2 },
  { day: 'Tue', value: 4 },
  { day: 'Wed', value: 3 },
  { day: 'Thu', value: 5 },
  { day: 'Fri', value: 2 },
  { day: 'Sat', value: 4 },
  { day: 'Sun', value: 1 },
];

const initialTasks = [
  { id: 1, title: 'Complete Mathematics revision', time: 'Today · 5:00 PM', done: false },
  { id: 2, title: 'Physics practice questions', time: 'Today · 7:00 PM', done: false },
  { id: 3, title: 'Review Chemistry notes', time: 'Tomorrow · 10:00 AM', done: true },
];

const navigation = [
  { label: 'Overview', icon: '⌂' },
  { label: 'My learning', icon: '◧' },
  { label: 'Explore courses', icon: '⌕' },
  { label: 'Practice & quizzes', icon: '✳' },
  { label: 'Study planner', icon: '▦' },
];

function Dashboard({ user }) {
  const [activeNav, setActiveNav] = useState('Overview');
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  const completedTasks = tasks.filter(task => task.done).length;
  const firstName = user?.name?.split(' ')[0] || 'Student';
  const avatar = user?.name?.charAt(0).toUpperCase() || 'S';

  function toggleTask(id) {
    setTasks(current =>
      current.map(task =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }

  const filteredCourses = courses.filter(course =>
    `${course.subject} ${course.chapter}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <a href="#dashboard" className="dashboard-brand">
          PARTH<span>.</span>
        </a>

        <p className="sidebar-caption">LEARNING SPACE</p>

        <nav className="side-navigation">
          {navigation.map(item => (
            <button
              key={item.label}
              className={`side-link ${activeNav === item.label ? 'active' : ''}`}
              onClick={() => setActiveNav(item.label)}
            >
              <span className="side-icon">{item.icon}</span>
              {item.label}
              {item.label === 'Practice & quizzes' && (
                <span className="nav-new">NEW</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon">?</span>
            <div>
              <strong>Need some help?</strong>
              <p>Visit our help centre</p>
            </div>
          </div>

          <button
            className="side-link settings-link"
            onClick={() => setActiveNav('Settings')}
          >
            <span className="side-icon">⚙</span>
            Settings
          </button>

          <div className="sidebar-user">
            <div className="avatar">{avatar}</div>
            <div className="user-info">
              <strong>{user?.name || 'Student'}</strong>
              <span>{user?.email || 'No email available'}</span>
            </div>
            <button
              className="user-menu"
              onClick={() => setShowProfile(!showProfile)}
            >
              ···
            </button>
          </div>

          {showProfile && (
            <div className="profile-popover">
              <strong>{user?.name || 'Student account'}</strong>
              <span>{user?.email || 'No email available'}</span>
              <span>{(user?.roles || []).join(', ')}</span>
              <button onClick={() => setActiveNav('Profile')}>
                View profile
              </button>
              <button onClick={() => setActiveNav('Settings')}>
                Account settings
              </button>
            </div>
          )}
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> {activeNav}
          </div>

          <div className="topbar-actions">
            <label className="dashboard-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search anything..."
              />
              <kbd>⌘ K</kbd>
            </label>

            <button className="notification-button" aria-label="Notifications">
              ♧<i />
            </button>

            <button
              className="top-avatar"
              onClick={() => setShowProfile(!showProfile)}
            >
              {avatar}
            </button>
          </div>
        </header>

        {activeNav === 'Overview' ? (
          <div className="dashboard-content">
            <section className="welcome-row">
              <div>
                <p className="dashboard-eyebrow">
                  YOUR LEARNING JOURNEY CONTINUES
                </p>
                <h1>
                  Good morning, <span>{firstName}.</span>
                </h1>
                <p className="welcome-description">
                  A little progress each day adds up to remarkable results.
                </p>
              </div>

              <button className="date-selector">
                ◷ &nbsp; Academic year 2026–27 &nbsp;⌄
              </button>
            </section>

            <section className="student-context">
              <div>
                <span className="context-icon">⌂</span>
                <div>
                  <small>ACCOUNT ROLE</small>
                  <strong>{(user?.roles || []).join(', ')}</strong>
                </div>
              </div>

              <div>
                <span className="context-icon">◧</span>
                <div>
                  <small>ACCOUNT EMAIL</small>
                  <strong>{user?.email || 'Not available'}</strong>
                </div>
              </div>

              <div>
                <span className="context-icon">◉</span>
                <div>
                  <small>LEARNING STREAK</small>
                  <strong>7 days</strong>
                </div>
              </div>

              <button onClick={() => setActiveNav('Settings')}>
                Edit learning profile →
              </button>
            </section>

            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-heading">
                  <span>COURSES IN PROGRESS</span>
                  <span>◧</span>
                </div>
                <strong>06</strong>
                <p>Across 4 subjects</p>
              </article>

              <article className="stat-card">
                <div className="stat-heading">
                  <span>LEARNING HOURS</span>
                  <span>◷</span>
                </div>
                <strong>24.5 <small>hrs</small></strong>
                <p>This month</p>
              </article>

              <article className="stat-card">
                <div className="stat-heading">
                  <span>LESSONS COMPLETED</span>
                  <span>✓</span>
                </div>
                <strong>38</strong>
                <p>Keep up the momentum</p>
              </article>

              <article className="stat-card highlight-stat">
                <div className="stat-heading">
                  <span>OVERALL PROGRESS</span>
                  <span>↗</span>
                </div>
                <strong>64<small>%</small></strong>
                <div className="mini-progress"><span /></div>
                <p>Your learning journey</p>
              </article>
            </section>

            <section className="learning-layout">
              <div className="primary-column">
                <div className="section-title-row">
                  <div>
                    <p className="dashboard-eyebrow">
                      PICK UP WHERE YOU LEFT OFF
                    </p>
                    <h2>Continue learning</h2>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => setActiveNav('My learning')}
                  >
                    View all courses →
                  </button>
                </div>

                <article className="continue-card">
                  <div className="continue-art">
                    <span className="art-label">YOUR NEXT LESSON</span>
                    <span className="math-symbol">∑</span>
                    <span className="art-equation">f : A → B</span>
                  </div>

                  <div className="continue-details">
                    <span className="course-category">
                      MATHEMATICS · CLASS 12
                    </span>
                    <h3>Relations and Functions</h3>
                    <p>Chapter 1 · Introduction to relations</p>

                    <div className="course-progress-label">
                      <span>Chapter progress</span>
                      <strong>72%</strong>
                    </div>

                    <div className="progress-track">
                      <span style={{ width: '72%' }} />
                    </div>

                    <button
                      className="continue-button"
                      onClick={() => setActiveNav('My learning')}
                    >
                      Continue lesson <span>→</span>
                    </button>
                  </div>
                </article>

                <div className="section-title-row courses-title">
                  <div>
                    <p className="dashboard-eyebrow">
                      YOUR PERSONAL LIBRARY
                    </p>
                    <h2>My courses</h2>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => setActiveNav('Explore courses')}
                  >
                    Explore courses →
                  </button>
                </div>

                <div className="course-list">
                  {filteredCourses.map(course => (
                    <article className="course-row" key={course.id}>
                      <div className={`course-icon ${course.color}`}>
                        {course.icon}
                      </div>

                      <div className="course-row-info">
                        <strong>{course.subject}</strong>
                        <span>{course.chapter}</span>
                        <div className="course-row-progress">
                          <span style={{ width: `${course.progress}%` }} />
                        </div>
                      </div>

                      <div className="course-row-meta">
                        <strong>{course.progress}%</strong>
                        <span>{course.lessons}</span>
                      </div>

                      <button
                        className="course-arrow"
                        onClick={() => setActiveNav('My learning')}
                      >
                        →
                      </button>
                    </article>
                  ))}

                  {filteredCourses.length === 0 && (
                    <p className="empty-search">
                      No matching courses found.
                    </p>
                  )}
                </div>
              </div>

              <aside className="right-column">
                <article className="activity-card">
                  <div className="widget-heading">
                    <div>
                      <p className="dashboard-eyebrow">YOUR CONSISTENCY</p>
                      <h3>Study activity</h3>
                    </div>
                    <button aria-label="Activity options">···</button>
                  </div>

                  <div className="activity-total">
                    <strong>21.5</strong>
                    <span>hours this week</span>
                  </div>

                  <div className="activity-chart">
                    {activities.map(item => (
                      <div className="activity-day" key={item.day}>
                        <div className="activity-bar-area">
                          <span style={{ height: `${item.value * 17}%` }} />
                        </div>
                        <small>{item.day}</small>
                      </div>
                    ))}
                  </div>

                  <p className="activity-note">
                    <span>↗</span> Keep building your daily habit.
                  </p>
                </article>

                <article className="tasks-card">
                  <div className="widget-heading">
                    <div>
                      <p className="dashboard-eyebrow">STAY ON TRACK</p>
                      <h3>Today's focus</h3>
                    </div>
                    <span className="task-count">
                      {completedTasks}/{tasks.length}
                    </span>
                  </div>

                  <div className="task-progress">
                    <span
                      style={{
                        width: `${completedTasks / tasks.length * 100}%`,
                      }}
                    />
                  </div>

                  <div className="task-list">
                    {tasks.map(task => (
                      <label
                        className={`task-item ${task.done ? 'task-done' : ''}`}
                        key={task.id}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTask(task.id)}
                        />
                        <span className="custom-check">
                          {task.done ? '✓' : ''}
                        </span>
                        <span className="task-text">
                          <strong>{task.title}</strong>
                          <small>{task.time}</small>
                        </span>
                      </label>
                    ))}
                  </div>

                  <button
                    className="task-footer"
                    onClick={() => setActiveNav('Study planner')}
                  >
                    Open study planner →
                  </button>
                </article>

                <article className="goal-card">
                  <div className="goal-icon">✳</div>
                  <p className="dashboard-eyebrow">DAILY STUDY GOAL</p>
                  <h3>You're making<br />good progress.</h3>
                  <p>
                    Complete your daily goal and make today count.
                  </p>
                  <div className="goal-progress"><span /></div>
                  <div className="goal-bottom">
                    <strong>1.3 / 2 hours</strong>
                    <span>65%</span>
                  </div>
                </article>
              </aside>
            </section>

            <footer className="dashboard-footer">
              <span>PARTH. · LEARN. EXPLORE. CREATE. ACHIEVE.</span>
              <span>Made for curious minds.</span>
            </footer>
          </div>
        ) : (
          <div className="placeholder-view">
            <span className="dashboard-eyebrow">
              PARTH LEARNING SPACE
            </span>
            <h1>{activeNav}</h1>
            <p>
              This section is part of the PARTH development roadmap.
              Its full functionality will be added in the next development stages.
            </p>
            <button
              className="continue-button"
              onClick={() => setActiveNav('Overview')}
            >
              Back to overview <span>→</span>
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default Dashboard;
