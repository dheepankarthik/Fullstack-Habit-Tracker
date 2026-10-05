import { useState, useEffect } from 'react';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/habits`;

function HabitTracker({ user, token, onLogout }) {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');

  // All requests to the API now include the JWT
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetch(API, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => {
        setHabits(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load habits');
        setLoading(false);
      });
  }, []);

  async function addHabit(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    const res = await fetch(API, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      setError('Could not add habit');
      return;
    }
    const created = await res.json();
    setHabits([...habits, created]);
    setNewName('');
  }

  async function toggleHabit(id) {
    const res = await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: authHeaders,
    });
    if (!res.ok) return;
    const updated = await res.json();
    setHabits(habits.map((h) => (h.id === id ? updated : h)));
  }

  async function deleteHabit(id) {
    const res = await fetch(`${API}/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok) return;
    setHabits(habits.filter((h) => h.id !== id));
  }

  if (loading) return <div className="app"><p>Loading habits...</p></div>;
  if (error) return <div className="app"><p className="error">{error}</p></div>;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Habit Tracker</h1>
          <p className="user-line">
            Logged in as <strong>{user.email}</strong>
          </p>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          Log out
        </button>
      </header>

      <form className="add-form" onSubmit={addHabit}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a new habit..."
        />
        <button type="submit">Add</button>
      </form>

      <ul className="habit-list">
        {habits.map((habit) => (
          <li key={habit.id} className={habit.done ? 'habit done' : 'habit'}>
            <span className="habit-name" onClick={() => toggleHabit(habit.id)}>
              {habit.name}
            </span>
            <button
              className="delete-btn"
              onClick={() => deleteHabit(habit.id)}
              aria-label="Delete habit"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HabitTracker;