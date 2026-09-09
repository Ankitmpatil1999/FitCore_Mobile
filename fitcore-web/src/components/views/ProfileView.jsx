import React, { useState } from 'react';

export default function ProfileView({ ownerProfile, setOwnerProfile }) {
  const [name, setName] = useState(ownerProfile.name);
  const [phone, setPhone] = useState(ownerProfile.phone);
  const [role, setRole] = useState(ownerProfile.role);
  const [email, setEmail] = useState(ownerProfile.email);
  const [address, setAddress] = useState(ownerProfile.address);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setOwnerProfile({
      name: name.trim(),
      phone: phone.trim(),
      role: role.trim(),
      email: email.trim(),
      address: address.trim()
    });

    alert('Owner profile details updated successfully!');
  };

  return (
    <div className="view-container">
      <header className="view-header">
        <div>
          <h2>Owner Management Profile</h2>
          <p className="gym-tagline">Manage director profile accounts, contacts, and personal addresses</p>
        </div>
      </header>

      <div style={{ maxWidth: '600px', width: '100%' }}>
        <div className="content-card">
          <h4>Owner Details Information</h4>
          <form onSubmit={handleSaveProfile} className="modal-form" style={{ marginTop: '20px' }}>
            <label>Full Manager Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

            <label>Authentication Mobile Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />

            <label>Office Role Designation</label>
            <input type="text" value={role} onChange={(e) => setRole(e.target.value)} required />

            <label>Support Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

            <label>Registered Address</label>
            <textarea placeholder="e.g. Registered gym branch street address" style={{ height: '70px' }} value={address} onChange={(e) => setAddress(e.target.value)} />

            <button type="submit" className="primary-action-btn" style={{ width: '100%', paddingVertical: '12px' }}>
              Save Profile Details
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
