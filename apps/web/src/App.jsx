
import { useEffect, useState } from 'react';
import Auth from './Auth.jsx';
import Dashboard from './Dashboard.jsx';
import StudentProfileSetup from './StudentProfileSetup.jsx';

import {
  getCurrentUser,
  getStudentProfile,
} from './services/authApi.js';

function App() {
  const [user, setUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadStudentProfile(token, currentUser) {
    if (!(currentUser.roles || []).includes('STUDENT')) {
      setStudentProfile(null);
      return;
    }

    const result = await getStudentProfile(token);
    setStudentProfile(result.profile);
  }

  
useEffect(() => {
  async function restoreSession() {
    const token = sessionStorage.getItem('parth_access_token');

    if (!token) {
      setLoading(false);
      return;
    }

    // Step 1: Verify authentication separately
    let currentUser;

    try {
      const result = await getCurrentUser(token);
      currentUser = result.user;
      setUser(currentUser);
    } catch (error) {
      console.error('Authentication restore failed:', error);

      sessionStorage.removeItem('parth_access_token');
      setUser(null);
      setStudentProfile(null);
      setLoading(false);
      return;
    }

    // Step 2: Load student profile independently
      if ((currentUser.roles || []).includes('STUDENT')) {
        try {
          const profileResult = await getStudentProfile(token);
          setStudentProfile(profileResult.profile);
        } catch (error) {
          console.error('Student profile restore failed:', error);
          setStudentProfile(null);
        }
      }

      setLoading(false);
    }

    restoreSession();
  }, []);


  async function handleAuthenticated({ user: authenticatedUser, accessToken }) {
    sessionStorage.setItem('parth_access_token', accessToken);
    setLoading(true);
    setUser(authenticatedUser);

    try {
      await loadStudentProfile(accessToken, authenticatedUser);
    } catch (error) {
      console.error('Student profile loading error:', error);
      setStudentProfile(null);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('parth_access_token');
    setUser(null);
    setStudentProfile(null);
  }

  function handleProfileSaved(profile) {
    setStudentProfile(profile);
  }

  if (loading) {
    return <main className="auth-page">Loading PARTH...</main>;
  }

  if (!user) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  const roles = user.roles || [];
  const token = sessionStorage.getItem('parth_access_token');

  if (roles.includes('STUDENT')) {
    const isSchoolProfile =
    studentProfile?.educationLevel?.category === 'SCHOOL';

    const isProfileComplete =
      Boolean(studentProfile?.educationLevel?.code) &&
    (
      !isSchoolProfile ||
      Boolean(
      studentProfile?.board?.code &&
      studentProfile?.grade?.level
    )
  );

  if (!isProfileComplete) {      return (
        <StudentProfileSetup
          user={user}
          token={token}
          onSaved={handleProfileSaved}
        />
      );
    }

    return (
      <>
        <div className="demo-session-bar">
          <span>
            Signed in as <strong>{user.name}</strong> · {roles.join(', ')}
          </span>
          <button onClick={handleLogout}>Sign out →</button>
        </div>

        <Dashboard user={user} studentProfile={studentProfile} />
      </>
    );
  }

  return (
    <>
      <div className="demo-session-bar">
        <span>
          Signed in as <strong>{user.name}</strong> · {roles.join(', ')}
        </span>
        <button onClick={handleLogout}>Sign out →</button>
      </div>

      <main className="placeholder-view">
        <h1>Welcome to PARTH, {user.name}.</h1>
        <p>
          Your {roles.join(', ')} workspace will be available
          in the next development stage.
        </p>
        <button onClick={handleLogout}>Sign out</button>
      </main>
    </>
  );
}

export default App;
