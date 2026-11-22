import { useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  enrollStudentInCourse,
  getPublishedCourses,
  getPublishedCourse,
  getStudentLearning,
  getStudentLearningCourse,
  getStudentPathways,
  updateLessonProgress,
} from './services/authApi.js';

const nav = [
  { label: 'Overview', icon: 'âŒ‚' },
  { label: 'Explore courses', icon: 'âŒ•' },
  { label: 'My learning', icon: 'â–¤' },
  { label: 'My pathways', icon: 'â†—' },
  { label: 'Profile', icon: 'â—‰' },
];
const initials = name => (name || 'Student').trim().split(/\s+/).slice(0, 2).map(x => x[0]?.toUpperCase()).join('') || 'S';
const dateLabel = value => value ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : 'Recently published';

export default function Dashboard({ user, studentProfile, token }) {
  const [active, setActive] = useState('Overview');
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState([]);
  const [pathways, setPathways] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(token ? '' : 'Session token missing. Please sign in again.');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [learningDetail, setLearningDetail] = useState(null);
  const [learningDetailLoading, setLearningDetailLoading] = useState(false);
  const [learningError, setLearningError] = useState('');
  const [progressBusy, setProgressBusy] = useState('');

  const name = user?.name || 'Student';
  const avatar = initials(name);
  const profileComplete = Boolean(studentProfile?.educationLevel?.code && (studentProfile.educationLevel.category !== 'SCHOOL' || (studentProfile?.board?.code && studentProfile?.grade?.level)));

  async function refreshLearning() {
    const result = await getStudentLearning(token);
    setEnrollments(Array.isArray(result?.enrollments) ? result.enrollments : []);
  }

  useEffect(() => {
    let activeRequest = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [catalogue, savedPathways, learning] = await Promise.all([
          getPublishedCourses(token, page, 8),
          getStudentPathways(token),
          getStudentLearning(token),
        ]);
        if (!activeRequest) return;
        setCourses(Array.isArray(catalogue?.courses) ? catalogue.courses : []);
        setPagination(catalogue?.pagination || null);
        setPathways(Array.isArray(savedPathways?.pathways) ? savedPathways.pathways : []);
        setEnrollments(Array.isArray(learning?.enrollments) ? learning.enrollments : []);
      } catch (e) {
        if (activeRequest) setError(e.message || 'Unable to load PARTH learning data.');
      } finally {
        if (activeRequest) setLoading(false);
      }
    }
    if (token) load();
    return () => { activeRequest = false; };
  }, [token, page]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? courses.filter(c => [c.title, c.description, c.type].filter(Boolean).join(' ').toLowerCase().includes(q)) : courses;
  }, [courses, search]);
  const completedCourses = enrollments.filter(item => item.status === 'COMPLETED').length;
  const completedLessons = enrollments.reduce((sum, item) => sum + (item.progress?.completedLessons || 0), 0);

  async function showCourse(course) {
    setSelected(null);
    setDetailError('');
    setDetailLoading(true);
    setActive('Explore courses');
    try {
      const detail = await getPublishedCourse(token, course.id);
      setSelected(detail);
    } catch (e) {
      setSelected({ ...course, lessons: [] });
      setDetailError(e.message || 'Course details are unavailable.');
    } finally {
      setDetailLoading(false);
    }
  }

  async function enroll(courseId) {
    setActionLoading(true);
    setDetailError('');
    try {
      await enrollStudentInCourse(token, courseId);
      await refreshLearning();
      setSelected(null);
      setActive('My learning');
    } catch (e) {
      setDetailError(e.message || 'Unable to enroll in this course.');
    } finally {
      setActionLoading(false);
    }
  }

  async function openLearning(enrollment) {
    setLearningDetail(null);
    setLearningError('');
    setLearningDetailLoading(true);
    try {
      setLearningDetail(await getStudentLearningCourse(token, enrollment.id));
    } catch (e) {
      setLearningError(e.message || 'Unable to open this course.');
    } finally {
      setLearningDetailLoading(false);
    }
  }

  async function toggleLesson(lesson) {
    if (!learningDetail) return;
    const enrollmentId = learningDetail.enrollment.id;
    setProgressBusy(lesson.id);
    setLearningError('');
    try {
      await updateLessonProgress(token, enrollmentId, lesson.id, !lesson.isCompleted);
      const updated = await getStudentLearningCourse(token, enrollmentId);
      setLearningDetail(updated);
      await refreshLearning();
    } catch (e) {
      setLearningError(e.message || 'Unable to update lesson progress.');
    } finally {
      setProgressBusy('');
    }
  }

  function courseCards() {
    if (loading) return <div className="parth-state">Loading published coursesâ€¦</div>;
    if (!filtered.length) return <div className="parth-state">{search ? 'No published courses match your search.' : 'No courses have been published yet. Check back soon.'}</div>;
    return <>
      <div className="parth-course-grid">{filtered.map(course => <article className="parth-course-card" key={course.id}>
        <div className="parth-course-card-top"><span className={`parth-course-type ${course.type === 'FREE' ? 'free' : 'paid'}`}>{course.type === 'FREE' ? 'FREE' : 'PREMIUM'}</span><span className="parth-course-date">{dateLabel(course.publishedAt)}</span></div>
        <h3>{course.title}</h3><p>{course.description || 'A structured course published on PARTH.'}</p>
        <div className="parth-course-meta"><span>â–¤ {course?._count?.lessons || 0} lessons</span><span>âœ“ Published</span></div>
        <button className="parth-primary-button" onClick={() => showCourse(course)}>View course <span>â†’</span></button>
      </article>)}</div>
      {pagination?.totalPages > 1 && <div className="parth-pagination"><button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>â† Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button disabled={page >= pagination.totalPages} onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}>Next â†’</button></div>}
    </>;
  }

  return <main className="dashboard-shell parth-dashboard">
    <aside className="sidebar"><a href="#dashboard" className="dashboard-brand">PARTH<span>.</span></a><p className="sidebar-caption">LEARNING SPACE</p>
      <nav className="side-navigation" aria-label="Student navigation">{nav.map(item => <button key={item.label} className={`side-link ${active === item.label ? 'active' : ''}`} onClick={() => setActive(item.label)}><span className="side-icon">{item.icon}</span>{item.label}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-help"><span className="help-icon">?</span><div><strong>Need some help?</strong><p>PARTH learning space</p></div></div><div className="sidebar-user"><div className="avatar">{avatar}</div><div className="user-info"><strong>{name}</strong><span>{user?.email || user?.phone || 'Student account'}</span></div></div></div>
    </aside>
    <section className="dashboard-main"><header className="dashboard-topbar"><div className="breadcrumb">Workspace <span>/</span> {active}</div><div className="topbar-actions"><label className="dashboard-search"><span>âŒ•</span><input value={search} onChange={e => { setSearch(e.target.value); setActive('Explore courses'); }} placeholder="Search published coursesâ€¦" aria-label="Search published courses" /></label><div className="top-avatar">{avatar}</div></div></header>
      <div className="dashboard-content">{error && <div className="parth-alert" role="alert"><strong>Learning space could not fully load.</strong><span>{error}</span><button onClick={() => window.location.reload()}>Retry</button></div>}
        {active === 'Overview' && <>
          <section className="welcome-row"><div><p className="dashboard-eyebrow">YOUR LEARNING JOURNEY</p><h1>Welcome back, <span>{name.split(/\s+/)[0]}.</span></h1><p className="welcome-description">Discover quality learning resources and build your next pathway.</p></div><span className="parth-live-label"><i /> Live platform data</span></section>
          <section className="student-context"><div><span className="context-icon">â—‰</span><div><small>EDUCATION LEVEL</small><strong>{studentProfile?.educationLevel?.name || 'Not selected'}</strong></div></div><div><span className="context-icon">â–¤</span><div><small>BOARD / GRADE</small><strong>{studentProfile?.board?.name ? `${studentProfile.board.name} Â· ${studentProfile?.grade?.name || 'Grade not set'}` : 'Not set'}</strong></div></div><button onClick={() => setActive('Profile')}>View learning profile â†’</button></section>
          <section className="stats-grid"><article className="stat-card"><div className="stat-heading"><span>MY COURSES</span><span>â–¤</span></div><strong>{loading ? 'â€”' : enrollments.length}</strong><p>Courses you have enrolled in</p></article><article className="stat-card"><div className="stat-heading"><span>LESSONS COMPLETED</span><span>â—·</span></div><strong>{loading ? 'â€”' : completedLessons}</strong><p>Across your enrolled courses</p></article><article className="stat-card"><div className="stat-heading"><span>COURSES COMPLETED</span><span>âœ“</span></div><strong>{loading ? 'â€”' : completedCourses}</strong><p>Successfully completed courses</p></article><article className="stat-card highlight-stat"><div className="stat-heading"><span>PROFILE STATUS</span><span>âœ“</span></div><strong>{profileComplete ? 'Ready' : 'Setup'}</strong><p>{profileComplete ? 'Core education details saved' : 'Complete education details'}</p></article></section>
          <section className="parth-overview-columns"><article className="parth-panel"><div className="section-title-row"><div><p className="dashboard-eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2>Continue learning</h2></div><button className="text-link" onClick={() => setActive('My learning')}>My courses â†’</button></div>{enrollments.length ? <div className="parth-learning-list">{enrollments.slice(0, 3).map(item => <article className="parth-learning-card" key={item.id}><div><strong>{item.course.title}</strong><small>{item.progress.completedLessons} / {item.progress.totalLessons} lessons completed</small><div className="parth-progress-track"><span style={{ width: `${item.progress.percentage}%` }} /></div></div><button className="parth-secondary-button" onClick={() => openLearning(item)}>Continue â†’</button></article>)}</div> : <p className="parth-muted">You have not enrolled in a course yet. Explore the catalogue to get started.</p>}<button className="parth-secondary-button" onClick={() => setActive('Explore courses')}>Explore courses â†’</button></article><aside className="parth-panel parth-pathways-panel"><p className="dashboard-eyebrow">YOUR DIRECTION</p><h2>My pathways</h2>{pathways.length ? <div className="parth-pathway-list">{pathways.slice(0, 5).map(p => <div className="parth-pathway-item" key={p.id}><span>â†—</span><div><strong>{p.title}</strong><small>{p.type.replaceAll('_', ' ')}</small></div></div>)}</div> : <p className="parth-muted">Your saved education, exam and career pathways will appear here.</p>}<button className="parth-secondary-button" onClick={() => setActive('My pathways')}>Open pathways â†’</button></aside></section>
        </>}
        {active === 'Explore courses' && <section><div className="welcome-row"><div><p className="dashboard-eyebrow">LEARN SOMETHING NEW</p><h1>Course <span>catalogue.</span></h1><p className="welcome-description">Browse courses published and approved by PARTH.</p></div></div>{courseCards()}</section>}
        {active === 'My learning' && <section><div className="welcome-row"><div><p className="dashboard-eyebrow">YOUR ACTIVE LEARNING</p><h1>My <span>courses.</span></h1><p className="welcome-description">Your enrolled courses and real lesson completion progress.</p></div></div>{loading ? <div className="parth-state">Loading your learningâ€¦</div> : enrollments.length ? <div className="parth-course-grid">{enrollments.map(item => <article className="parth-course-card" key={item.id}><div className="parth-course-card-top"><span className={`parth-course-type ${item.status === 'COMPLETED' ? 'free' : 'paid'}`}>{item.status}</span><span className="parth-course-date">{dateLabel(item.enrolledAt)}</span></div><h3>{item.course.title}</h3><p>{item.course.description || 'Your enrolled PARTH course.'}</p><div className="parth-progress-track"><span style={{ width: `${item.progress.percentage}%` }} /></div><div className="parth-course-meta"><span>{item.progress.completedLessons}/{item.progress.totalLessons} lessons</span><strong>{item.progress.percentage}%</strong></div><button className="parth-primary-button" onClick={() => openLearning(item)}>Open learning <span>â†’</span></button></article>)}</div> : <div className="parth-state">You have not enrolled in any courses yet. Explore published courses to begin.</div>}</section>}
        {active === 'My pathways' && <section><div className="welcome-row"><div><p className="dashboard-eyebrow">YOUR GOALS & INTERESTS</p><h1>My <span>pathways.</span></h1><p className="welcome-description">Your saved learning, exam and career directions.</p></div></div>{loading ? <div className="parth-state">Loading pathwaysâ€¦</div> : pathways.length ? <div className="parth-course-grid">{pathways.map(p => <article className="parth-course-card" key={p.id}><span className="parth-course-type free">{p.type.replaceAll('_', ' ')}</span><h3>{p.title}</h3><p>{p.details?.description || 'A pathway saved to your PARTH student profile.'}</p><div className="parth-course-meta"><span>{p.countryCode}{p.stateCode ? ` Â· ${p.stateCode}` : ''}</span><span>{p.status}</span></div></article>)}</div> : <div className="parth-state">You have not saved any pathways yet.</div>}</section>}
        {active === 'Profile' && <section><div className="welcome-row"><div><p className="dashboard-eyebrow">YOUR ACCOUNT</p><h1>Learning <span>profile.</span></h1><p className="welcome-description">The student details currently saved in PARTH.</p></div></div><div className="parth-profile-card"><div className="parth-profile-avatar">{avatar}</div><div><h2>{name}</h2><p>{user?.email || user?.phone || 'Contact details not available'}</p></div></div><div className="parth-profile-grid"><div><small>Education level</small><strong>{studentProfile?.educationLevel?.name || 'Not selected'}</strong></div><div><small>Board</small><strong>{studentProfile?.board?.name || 'Not set'}</strong></div><div><small>Grade</small><strong>{studentProfile?.grade?.name || 'Not set'}</strong></div><div><small>Preferred language</small><strong>{studentProfile?.preferredLanguage || 'Not set'}</strong></div></div><p className="parth-muted">Your profile details can be updated from the student profile setup flow.</p></section>}
      </div>
    </section>
    {(detailLoading || selected) && <div className="parth-modal-backdrop" onClick={() => !detailLoading && setSelected(null)}><section className="parth-course-modal" role="dialog" aria-modal="true" aria-label="Course details" onClick={e => e.stopPropagation()}><button className="parth-modal-close" onClick={() => setSelected(null)} aria-label="Close">Ã—</button>{detailLoading ? <div className="parth-state">Loading course detailsâ€¦</div> : <><span className={`parth-course-type ${selected?.type === 'FREE' ? 'free' : 'paid'}`}>{selected?.type || 'COURSE'}</span><h2>{selected?.title}</h2><p>{selected?.description || 'No course description has been provided.'}</p>{detailError && <div className="parth-alert compact" role="alert">{detailError}</div>}<h3>Course outline</h3>{selected?.lessons?.length ? <ol className="parth-lesson-list">{selected.lessons.map(lesson => <li key={lesson.id}><span>{lesson.title}</span><small>{lesson.type}</small></li>)}</ol> : <p className="parth-muted">The lesson outline is not available for this course preview.</p>}{selected?.type === 'FREE' ? <button className="parth-primary-button" disabled={actionLoading} onClick={() => enroll(selected.id)}>{actionLoading ? 'Enrollingâ€¦' : 'Enroll in free course â†’'}</button> : <p className="parth-muted">Paid-course access is locked until verified payment is integrated. No payment has been taken.</p>}</>}</section></div>}
    {(learningDetailLoading || learningDetail) && <div className="parth-modal-backdrop" onClick={() => !learningDetailLoading && setLearningDetail(null)}><section className="parth-course-modal parth-learning-modal" role="dialog" aria-modal="true" aria-label="My course learning" onClick={e => e.stopPropagation()}><button className="parth-modal-close" onClick={() => setLearningDetail(null)} aria-label="Close">Ã—</button>{learningDetailLoading ? <div className="parth-state">Loading your courseâ€¦</div> : <><span className="parth-course-type free">MY LEARNING</span><h2>{learningDetail.course.title}</h2><p>{learningDetail.course.description}</p><div className="parth-learning-summary"><strong>{learningDetail.progress.percentage}% complete</strong><span>{learningDetail.progress.completedLessons} of {learningDetail.progress.totalLessons} lessons</span><div className="parth-progress-track"><span style={{ width: `${learningDetail.progress.percentage}%` }} /></div></div>{learningError && <div className="parth-alert compact" role="alert">{learningError}</div>}<h3>Lessons</h3>{learningDetail.course.lessons.length ? <ol className="parth-learning-lesson-list">{learningDetail.course.lessons.map(lesson => <li key={lesson.id}><div><strong>{lesson.title}</strong><small>{lesson.type}{lesson.durationSec ? ` Â· ${Math.ceil(lesson.durationSec / 60)} min` : ''}</small></div><button className={lesson.isCompleted ? 'parth-completed-button' : 'parth-secondary-button'} disabled={progressBusy === lesson.id} onClick={() => toggleLesson(lesson)}>{progressBusy === lesson.id ? 'Savingâ€¦' : lesson.isCompleted ? 'Completed âœ“' : 'Mark complete'}</button></li>)}</ol> : <p className="parth-muted">No approved lessons are available in this course yet.</p>}</>}</section></div>}
  </main>;
}

