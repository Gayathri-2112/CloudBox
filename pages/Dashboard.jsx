import { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [profilePic, setProfilePic] = useState(
    localStorage.getItem("profilePic") || null
  );

  const calculateAge = (dob) => {
    if (!dob) return "Not set";

    const birth = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  useEffect(() => {
    const email = localStorage.getItem("email");
    const token = localStorage.getItem("token");

    axios
      .get(`http://localhost:8080/api/user/profile?email=${email}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setUser(res.data))
      .catch((err) => console.log(err));
  }, []);

  const handleUpdate = () => {
    const email = localStorage.getItem("email");
    const token = localStorage.getItem("token");

    axios
      .put(
        `http://localhost:8080/api/user/profile?email=${email}`,
        user,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        alert("Profile updated");
        setEditMode(false);
      })
      .catch((err) => console.log(err));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setProfilePic(reader.result);
        localStorage.setItem("profilePic", reader.result);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = () => {
    if (!window.confirm("Remove profile picture?")) return;
    setProfilePic(null);
    localStorage.removeItem("profilePic");
  };

  const handleDeleteAccount = () => {
    if (!window.confirm("Delete your account permanently?")) return;

    const email = localStorage.getItem("email");
    const token = localStorage.getItem("token");

    axios
      .delete(`http://localhost:8080/api/user/delete?email=${email}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        localStorage.clear();
        window.location.href = "/login";
      })
      .catch((err) => console.log(err));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (!user) return <p>Loading...</p>;

  return (
    <>
      {/* 🔥 SMALL PROFESSIONAL LOGOUT BUTTON */}
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>

      <div className="profile-container">
        <div className="profile-left">
          <img
            src={
              profilePic
                ? profilePic
                : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt="profile"
            className="profile-img"
          />

          <p>{profilePic ? "Profile Image" : "No Profile"}</p>

          {editMode && (
            <input type="file" accept="image/*" onChange={handleImageChange} />
          )}

          {profilePic && (
            <button className="small-btn" onClick={handleDeleteImage}>
              Remove
            </button>
          )}
        </div>

        <div className="profile-right">
          <h2>My Profile</h2>

          {!editMode ? (
            <>
              <p><b>First Name:</b> {user.firstName}</p>
              <p><b>Last Name:</b> {user.lastName}</p>
              <p><b>Email:</b> {user.email}</p>
              <p><b>Gender:</b> {user.gender}</p>
              <p><b>Age:</b> {calculateAge(user.dob)}</p>
              <p><b>Location:</b> {user.location}</p>

              <button onClick={() => setEditMode(true)}>
                ✏️ Edit Profile
              </button>

              <button className="danger-btn" onClick={handleDeleteAccount}>
                Delete Account
              </button>
            </>
          ) : (
            <>
              <input
                value={user.firstName}
                onChange={(e) =>
                  setUser({ ...user, firstName: e.target.value })
                }
              />

              <input
                value={user.lastName}
                onChange={(e) =>
                  setUser({ ...user, lastName: e.target.value })
                }
              />

              <input
                value={user.gender}
                onChange={(e) =>
                  setUser({ ...user, gender: e.target.value })
                }
              />

              <input
                type="date"
                value={user.dob || ""}
                onChange={(e) =>
                  setUser({ ...user, dob: e.target.value })
                }
              />

              <input
                value={user.location}
                onChange={(e) =>
                  setUser({ ...user, location: e.target.value })
                }
              />

              <button onClick={handleUpdate}>Save</button>
              <button onClick={() => setEditMode(false)}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;