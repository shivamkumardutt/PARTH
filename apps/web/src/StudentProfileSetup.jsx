
import { useEffect, useMemo, useState } from 'react';

import {
  getStudentProfile,
  getStudentOptions,
  updateStudentProfile,
} from './services/authApi.js';

import './StudentProfileSetup.css';

export default function StudentProfileSetup({ user, token, onSaved }) {
  const [educationLevels, setEducationLevels] = useState([]);
  const [boards, setBoards] = useState([]);

  const [educationLevelCode, setEducationLevelCode] = useState('');
  const [boardCode, setBoardCode] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');

  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedEducationLevel = useMemo(
    () => educationLevels.find(
      level => level.code === educationLevelCode
    ),
    [educationLevels, educationLevelCode]
  );

  const isSchoolEducation =
    selectedEducationLevel?.category === 'SCHOOL';

  const selectedBoard = useMemo(
    () => boards.find(board => board.code === boardCode),
    [boards, boardCode]
  );

  useEffect(() => {
    async function loadProfileData() {
      try {
        setError('');

        const [optionsResult, profileResult] = await Promise.all([
          getStudentOptions(token),
          getStudentProfile(token),
        ]);

        const profile = profileResult.profile;

        setEducationLevels(optionsResult.educationLevels || []);
        setBoards(optionsResult.boards || []);

        setEducationLevelCode(
          profile?.educationLevel?.code || ''
        );

        setBoardCode(profile?.board?.code || '');

        setGradeLevel(
          profile?.grade?.level
            ? String(profile.grade.level)
            : ''
        );

        setPreferredLanguage(
          profile?.preferredLanguage || 'en'
        );

        if (profile?.dateOfBirth) {
          setDateOfBirth(profile.dateOfBirth.slice(0, 10));
        }
      } catch (err) {
        setError(err.message || 'Unable to load your profile.');
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [token]);

  function handleEducationLevelChange(event) {
    setEducationLevelCode(event.target.value);

    // Reset school-specific selections.
    setBoardCode('');
    setGradeLevel('');
  }

  function handleBoardChange(event) {
    setBoardCode(event.target.value);
    setGradeLevel('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!educationLevelCode) {
      setError('Please select your education level.');
      return;
    }

    if (
      isSchoolEducation &&
      (!boardCode || !gradeLevel)
    ) {
      setError('Please select your education board and class.');
      return;
    }

    setSaving(true);

    try {
      const profileData = {
        educationLevelCode,
        preferredLanguage,
        dateOfBirth: dateOfBirth || null,
      };

      if (isSchoolEducation) {
        profileData.boardCode = boardCode;
        profileData.gradeLevel = Number(gradeLevel);
      }

      const result = await updateStudentProfile(
        token,
        profileData
      );

      onSaved(result.profile);
    } catch (err) {
      setError(err.message || 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="profile-setup-page">
        <p>Preparing your PARTH learning space...</p>
      </main>
    );
  }

  return (
    <main className="profile-setup-page">
      <section className="profile-setup-card">

        <a href="/" className="profile-setup-brand">
          PARTH<span>.</span>
        </a>

        <p className="profile-setup-kicker">
          YOUR LEARNING JOURNEY STARTS HERE
        </p>

        <h1>Let's personalise your learning.</h1>

        <p className="profile-setup-description">
          Hi {user?.name?.split(' ')[0] || 'Student'},
          tell us about your education so PARTH can
          organise your learning experience.
        </p>

        <form
          onSubmit={handleSubmit}
          className="profile-setup-form"
        >

          {/* Education Level */}

          <div className="profile-field">
            <label htmlFor="education-level">
              Education Level
            </label>

            <select
              id="education-level"
              value={educationLevelCode}
              onChange={handleEducationLevelChange}
              required
            >
              <option value="">
                Select your education level
              </option>

              {educationLevels.map(level => (
                <option key={level.id} value={level.code}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>

          {/* School-specific fields */}

          {isSchoolEducation && (
            <>
              <div className="profile-field">
                <label htmlFor="education-board">
                  Education Board
                </label>

                <select
                  id="education-board"
                  value={boardCode}
                  onChange={handleBoardChange}
                  required
                >
                  <option value="">
                    Select your board
                  </option>

                  {boards.map(board => (
                    <option
                      key={board.id}
                      value={board.code}
                    >
                      {board.name} ({board.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="profile-field">
                <label htmlFor="student-grade">
                  Your Class
                </label>

                <select
                  id="student-grade"
                  value={gradeLevel}
                  onChange={event =>
                    setGradeLevel(event.target.value)
                  }
                  disabled={!selectedBoard}
                  required
                >
                  <option value="">
                    Select your class
                  </option>

                  {selectedBoard?.grades.map(grade => (
                    <option
                      key={grade.id}
                      value={grade.level}
                    >
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Language */}

          <div className="profile-field">
            <label htmlFor="preferred-language">
              Preferred Language
            </label>

            <select
              id="preferred-language"
              value={preferredLanguage}
              onChange={event =>
                setPreferredLanguage(event.target.value)
              }
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="pa">Punjabi</option>
            </select>
          </div>

          {/* Date of Birth */}

          <div className="profile-field">
            <label htmlFor="date-of-birth">
              Date of Birth <span>(optional)</span>
            </label>

            <input
              id="date-of-birth"
              type="date"
              value={dateOfBirth}
              onChange={event =>
                setDateOfBirth(event.target.value)
              }
            />
          </div>

          {error && (
            <p
              className="profile-form-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="profile-save-button"
            disabled={saving || educationLevels.length === 0}
          >
            {saving
              ? 'Saving your profile...'
              : 'Save and continue'}

            {!saving && <span>→</span>}
          </button>

        </form>

        <p className="profile-setup-footer">
          Your information helps PARTH personalise your learning.
        </p>

      </section>
    </main>
  );
}
