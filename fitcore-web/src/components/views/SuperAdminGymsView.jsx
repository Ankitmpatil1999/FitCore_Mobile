import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import CustomSelect from '../common/CustomSelect.jsx';
import {
  StarIcon,
  UsersIcon,
  BuildingIcon,
  LocationPinIcon,
  BoltIcon,
  ShieldCheckIcon,
  EditIcon,
  TrashIcon,
  SettingsIcon,
  CheckCircleIcon,
  SearchIcon,
  AlertTriangleIcon,
  PlusIcon
} from '../common/Icons';

export default function SuperAdminGymsView({ gyms = [], setGyms, members = [], onRefresh, onInspectGym }) {
  // Dynamic API Configuration (Loaded directly from Database)
  const [packagesList, setPackagesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [activityTypesList, setActivityTypesList] = useState([]);
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);

  // Super Admin SaaS Pricing Editor Modal State
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingPackages, setEditingPackages] = useState([]);
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedGym, setSelectedGym] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Validation & Toast Feedback
  const [validationErrors, setValidationErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [toastNotification, setToastNotification] = useState(null);

  // Wizard Step 1: Gym Profile & Pan-India Location
  const [gymName, setGymName] = useState('');
  const [selectedActivities, setSelectedActivities] = useState(['Gym / Fitness']);
  const [customTags, setCustomTags] = useState([]);
  const [showCustomActivity, setShowCustomActivity] = useState(false);
  const [customActivityInput, setCustomActivityInput] = useState('');
  const [gymCity, setGymCity] = useState('Nagpur');
  const [gymState, setGymState] = useState('Maharashtra');
  const [gymAddress, setGymAddress] = useState('');
  const [gymPincode, setGymPincode] = useState('');
  const [gymPhone, setGymPhone] = useState('');
  const [gymEmail, setGymEmail] = useState('');
  const [gymGst, setGymGst] = useState('');

  // Editing Gym State
  const [editingGym, setEditingGym] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editValidationErrors, setEditValidationErrors] = useState({});

  // Wizard Step 2: Capacity & Amenities
  const [gymCapacity, setGymCapacity] = useState(250);
  const [gymFloorArea, setGymFloorArea] = useState('4,500');
  const [selectedAmenities, setSelectedAmenities] = useState([
    'NFC Smart Turnstiles', 'Heavy Olympic Strength Zone', 'Cardio Cinema Theatre', 'High-Speed Gym WiFi'
  ]);

  // Wizard Step 3: Subscription Package & Permissions
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [customPlanAmount, setCustomPlanAmount] = useState(34999);
  const [customBillingCycle, setCustomBillingCycle] = useState('yearly');
  const [customPaymentNotes, setCustomPaymentNotes] = useState('Standard platform onboarding fee');
  const [permissions, setPermissions] = useState({
    canRegisterMembers: true,
    canUseTurnstiles: true,
    canAccessStore: true,
    canManageTrainers: true,
    canBroadcastAlerts: true,
    canViewBiometrics: true
  });

  // Wizard Step 4: Franchise Owner Portal Account
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('FitCore@' + Math.floor(1000 + Math.random() * 9000));

  // Dynamic Config Fetch via Backend API
  const fetchApiConfig = async () => {
    try {
      const token = localStorage.getItem('fitcore_token');
      const response = await fetch(API_ENDPOINTS.ADMIN_CONFIG, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        if (data.data.packages) {
          setPackagesList(data.data.packages);
          setEditingPackages(data.data.packages);
        }
        if (data.data.cities) setCitiesList(data.data.cities);
        if (data.data.activityTypes) setActivityTypesList(data.data.activityTypes);
        if (data.data.amenities) setAmenitiesList(data.data.amenities);
        if (data.data.permissionsList) setPermissionsList(data.data.permissionsList);
      }
    } catch (err) {
      console.error('API config fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchApiConfig();
  }, []);

  const handleSaveSaaSPricing = async (e) => {
    e.preventDefault();
    setIsSavingPricing(true);
    try {
      const token = localStorage.getItem('fitcore_token');
      const res = await fetch(API_ENDPOINTS.ADMIN_CONFIG, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ packages: editingPackages })
      });
      const data = await res.json();
      setIsSavingPricing(false);
      if (res.ok && data.success) {
        setPackagesList(data.data.packages || editingPackages);
        showToast('SaaS Subscription pricing updated in Database successfully! ✓', 'success');
        setShowPricingModal(false);
        if (typeof onRefresh === 'function') onRefresh();
      } else {
        showToast(data.error || 'Failed to update SaaS pricing in database.', 'error');
      }
    } catch (err) {
      setIsSavingPricing(false);
      showToast('Network error updating SaaS pricing.', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 4000);
  };

  const toggleActivity = (activity) => {
    setSelectedActivities(prev => 
      prev.includes(activity)
        ? (prev.length > 1 ? prev.filter(a => a !== activity) : prev)
        : [...prev, activity]
    );
  };

  const handleAddCustomTag = (e) => {
    if (e) e.preventDefault();
    const trimmed = customActivityInput.trim();
    if (!trimmed) return;
    if (!selectedActivities.includes(trimmed)) {
      setSelectedActivities(prev => [...prev, trimmed]);
    }
    if (!customTags.includes(trimmed)) {
      setCustomTags(prev => [...prev, trimmed]);
    }
    setCustomActivityInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setSelectedActivities(prev => prev.filter(t => t !== tagToRemove));
    setCustomTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const toggleAmenity = (label) => {
    setSelectedAmenities(prev => 
      prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
    );
  };

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Client-Side Step Validators
  const validateStep1 = () => {
    const errors = {};
    if (!gymName || !gymName.trim()) errors.gymName = 'Franchise club name is required.';
    const cleanPhone = String(gymPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.gymPhone = 'Valid 10-digit official contact number is required.';
    }
    if (!gymAddress || !gymAddress.trim()) {
      errors.gymAddress = 'Branch area & street address is required.';
    }
    if (gymEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gymEmail.trim())) {
      errors.gymEmail = 'Please provide a valid email address.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep4 = () => {
    const errors = {};
    if (!ownerName || !ownerName.trim()) errors.ownerName = 'Owner full name is required.';
    const cleanOwnerPhone = String(ownerPhone || '').replace(/\D/g, '');
    if (!cleanOwnerPhone || cleanOwnerPhone.length < 10) {
      errors.ownerPhone = 'Valid 10-digit mobile number required for portal login.';
    }
    if (ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim())) {
      errors.ownerEmail = 'Please enter a valid owner email address.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setServerError('');
    if (wizardStep === 1) {
      if (!validateStep1()) return;
    }
    setWizardStep(prev => prev + 1);
  };

  const handleStatusChange = async (gymId, newStatus) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN_GYMS}/${gymId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fitcore_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast(`Franchise status updated to ${newStatus.toUpperCase()} ✓`, 'success');
        if (typeof onRefresh === 'function') onRefresh();
        if (selectedGym && (selectedGym.id === gymId || selectedGym._id === gymId)) {
          setSelectedGym(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        showToast(data.error || 'Failed to update franchise status.', 'error');
      }
    } catch (err) {
      showToast('Network error connecting to backend API.', 'error');
    }
  };

  const openEditModal = (gym) => {
    const rawCategories = gym.category ? gym.category.split(',').map(s => s.trim()) : ['Gym / Fitness'];
    setEditingGym(gym);
    setEditValidationErrors({});
    setEditFormData({
      name: gym.name || '',
      city: gym.city || 'Nagpur',
      address: gym.address || '',
      phone: gym.phone || '',
      email: gym.email || '',
      activities: rawCategories,
      capacity: gym.capacity || 250,
      plan: gym.plan || 'pro',
      status: gym.status || 'approved'
    });
  };

  const handleSaveEditGym = async (e) => {
    e.preventDefault();
    if (!editingGym) return;

    // Validate Edit Form
    const errors = {};
    if (!editFormData.name?.trim()) errors.name = 'Club name is required.';
    const cleanPhone = String(editFormData.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) errors.phone = 'Valid 10-digit phone is required.';
    if (!editFormData.address?.trim()) errors.address = 'Branch address is required.';
    if (editFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email.trim())) {
      errors.email = 'Valid email is required.';
    }

    if (Object.keys(errors).length > 0) {
      setEditValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const gymId = editingGym.id || editingGym._id;
      const response = await fetch(`${API_ENDPOINTS.ADMIN_GYMS}/${gymId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fitcore_token')}`
        },
        body: JSON.stringify({
          name: editFormData.name,
          city: editFormData.city,
          address: editFormData.address,
          phone: editFormData.phone,
          email: editFormData.email,
          category: editFormData.activities.join(', '),
          capacity: Number(editFormData.capacity),
          plan: editFormData.plan,
          status: editFormData.status
        })
      });
      const data = await response.json();
      setIsSubmitting(false);

      if (response.ok && data.success) {
        showToast(`Franchise "${editFormData.name}" updated successfully!`, 'success');
        setEditingGym(null);
        if (selectedGym && (selectedGym.id === gymId || selectedGym._id === gymId)) {
          setSelectedGym(data.data || { ...selectedGym, ...editFormData, category: editFormData.activities.join(', ') });
        }
        if (typeof onRefresh === 'function') onRefresh();
      } else {
        showToast(data.error || 'Failed to update franchise.', 'error');
        if (data.validationErrors) setEditValidationErrors(data.validationErrors);
      }
    } catch (err) {
      setIsSubmitting(false);
      showToast('Error saving updates to backend.', 'error');
    }
  };

  const handleDeleteGym = async (gymId, gymName) => {
    if (!window.confirm(`Are you sure you want to permanently delete franchise "${gymName}"?`)) {
      return;
    }
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN_GYMS}/${gymId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('fitcore_token')}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast(`Franchise "${gymName}" deleted successfully.`, 'success');
        if (selectedGym && (selectedGym.id === gymId || selectedGym._id === gymId)) {
          setSelectedGym(null);
        }
        if (typeof onRefresh === 'function') onRefresh();
      } else {
        showToast(data.error || 'Failed to delete franchise.', 'error');
      }
    } catch (err) {
      showToast('Network error connecting to backend API.', 'error');
    }
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validateStep4()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: gymName.trim(),
        address: gymAddress.trim() || `${gymCity} Main Branch`,
        city: gymCity,
        state: gymState,
        pincode: gymPincode || '440001',
        phone: gymPhone.trim(),
        email: gymEmail ? gymEmail.trim() : '',
        gstNumber: gymGst || '',
        category: selectedActivities.join(', '),
        capacity: Number(gymCapacity) || 250,
        floorArea: gymFloorArea,
        amenities: selectedAmenities,
        plan: selectedPlan,
        subscriptionAmount: Number(customPlanAmount) || 34999,
        billingCycle: customBillingCycle || 'yearly',
        subscriptionNotes: customPaymentNotes || '',
        permissions: permissions,
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerEmail: ownerEmail ? ownerEmail.trim() : '',
        password: ownerPassword
      };

      const response = await fetch(API_ENDPOINTS.ADMIN_GYMS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fitcore_token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setIsSubmitting(false);

      if (response.ok && data.success) {
        showToast(`Franchise "${gymName}" activated successfully!`, 'success');
        setCreatedCredentials(data.credentials || {
          loginId: ownerPhone,
          email: ownerEmail || '',
          password: ownerPassword,
          role: 'gym_owner',
          gymName: gymName
        });
        if (typeof onRefresh === 'function') onRefresh();
      } else {
        setServerError(data.error || 'Failed to register gym franchise.');
        if (data.validationErrors) {
          setValidationErrors(data.validationErrors);
        }
      }
    } catch (err) {
      setIsSubmitting(false);
      setServerError('Connection refused. Please ensure backend server is online on port 7000.');
    }
  };

  const copyCredentialsToClipboard = () => {
    if (!createdCredentials) return;
    const text = `FitCore Gym Admin Credentials:\nFranchise: ${createdCredentials.gymName}\nLogin Mobile / ID: ${createdCredentials.loginId}\nPassword: ${createdCredentials.password}\nPortal URL: http://localhost:5173`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const resetWizard = () => {
    setShowAddWizard(false);
    setWizardStep(1);
    setCreatedCredentials(null);
    setGymName('');
    setGymAddress('');
    setGymPhone('');
    setGymEmail('');
    setOwnerName('');
    setOwnerPhone('');
    setOwnerEmail('');
    setOwnerPassword('FitCore@' + Math.floor(1000 + Math.random() * 9000));
  };

  // Filter gyms across Pan-India
  const filteredGyms = gyms.filter(gym => {
    const matchesSearch = (gym.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (gym.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (gym.phone || '').includes(searchTerm);
    const matchesCity = selectedCity === 'all' || (gym.city || '').toLowerCase() === selectedCity.toLowerCase();
    const matchesStatus = selectedStatus === 'all' || (gym.status || 'approved') === selectedStatus;
    return matchesSearch && matchesCity && matchesStatus;
  });

  // Pagination computations
  const totalItems = filteredGyms.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedGyms = filteredGyms.slice(startIndex, startIndex + pageSize);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="adm-view-container">
      {/* Toast Notification Popup */}
      {toastNotification && (
        <div className={`adm-toast-banner ${toastNotification.type}`}>
          <span className="toast-icon">{toastNotification.type === 'success' ? '✓' : '⚠️'}</span>
          <span className="toast-text">{toastNotification.message}</span>
          <button className="toast-close" onClick={() => setToastNotification(null)}>✕</button>
        </div>
      )}

      {/* Franchise Network Stats Summary Strip */}
      <div className="franchise-summary-strip" style={{ marginTop: '6px' }}>
        <div className="summary-pill-card">
          <span className="summary-pill-icon">
            <BuildingIcon size={18} color="#4f46e5" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">{gyms.length} Clubs</span>
            <span className="summary-pill-lbl">Total Registered</span>
          </div>
        </div>
        <div className="summary-pill-card">
          <span className="summary-pill-icon success">
            <CheckCircleIcon size={18} color="#10b981" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">{gyms.filter(g => (g.status || 'approved') === 'approved').length} Active</span>
            <span className="summary-pill-lbl">Live Turnstiles</span>
          </div>
        </div>
        <div className="summary-pill-card">
          <span className="summary-pill-icon members">
            <UsersIcon size={18} color="#06b6d4" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">{members.length} Members</span>
            <span className="summary-pill-lbl">Enrolled Athletes</span>
          </div>
        </div>
        <div className="summary-pill-card">
          <span className="summary-pill-icon verified">
            <ShieldCheckIcon size={18} color="#f59e0b" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">100% Verified</span>
            <span className="summary-pill-lbl">Platform Compliance</span>
          </div>
        </div>
      </div>

      {/* Pan-India Search, City Filters Bar & Onboard Button */}
      <div className="adm-search-filter-row glass-panel">
        <div className="search-input-wrap">
          <span className="search-icon">
            <SearchIcon size={15} color="#94a3b8" />
          </span>
          <input
            type="text"
            className="adm-input-field search"
            placeholder="Search franchise name, city, address, or phone..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {/* Dynamic City Filter */}
        <CustomSelect
          value={selectedCity}
          onChange={(newVal) => { setSelectedCity(newVal); setCurrentPage(1); }}
          icon={LocationPinIcon}
          options={[
            { value: 'all', label: `All Indian Cities (${gyms.length} Clubs)` },
            ...citiesList.map(c => ({ value: c, label: c }))
          ]}
          style={{ minWidth: '210px' }}
        />

        {/* Status Filter */}
        <CustomSelect
          value={selectedStatus}
          onChange={(newVal) => { setSelectedStatus(newVal); setCurrentPage(1); }}
          icon={BoltIcon}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'approved', label: 'Active & Online', icon: <span style={{ color: '#10b981', fontSize: '12px' }}>●</span> },
            { value: 'pending', label: 'Pending Review', icon: <span style={{ color: '#f59e0b', fontSize: '12px' }}>●</span> },
            { value: 'suspended', label: 'Suspended', icon: <span style={{ color: '#ef4444', fontSize: '12px' }}>●</span> }
          ]}
          style={{ minWidth: '175px' }}
        />

        {/* Manage SaaS Pricing & Tiers Action Button */}
        <button 
          className="wizard-back-btn" 
          style={{ whiteSpace: 'nowrap', padding: '10px 16px', borderRadius: '14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.85)', borderColor: '#cbd5e1' }}
          onClick={() => {
            setEditingPackages(JSON.parse(JSON.stringify(packagesList)));
            setShowPricingModal(true);
          }}
          title="Super Admin: Edit monthly / yearly SaaS subscription amount charged to gyms"
        >
          <SettingsIcon size={14} color="#475569" />
          <span>SaaS Pricing & Plans</span>
        </button>

        {/* Onboard New Franchise Action Button */}
        <button 
          className="hub-btn-glow" 
          style={{ whiteSpace: 'nowrap', padding: '10px 18px', borderRadius: '14px', fontSize: '13px' }}
          onClick={() => { setShowAddWizard(true); setWizardStep(1); setServerError(''); setValidationErrors({}); }}
        >
          <span>+ Onboard Franchise</span>
        </button>
      </div>

      {/* Gyms Table Card Panel */}
      <div className="adm-card-panel glass-card franchise-table-panel">
        <div className="adm-table-wrap">
          <table className="adm-table modern-franchise-table">
            <thead>
              <tr>
                <th>Franchise Club</th>
                <th>Location / Branch</th>
                <th>Offerings & Activities</th>
                <th>Members</th>
                <th>Plan Tier</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGyms.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty-row">
                    <div className="empty-state-box">
                      <span className="empty-state-icon">
                        <BuildingIcon size={38} color="#94a3b8" />
                      </span>
                      <h4>No Franchises Found</h4>
                      <p>No gym clubs match your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedGyms.map((gym) => {
                  const gymMembersCount = members.filter(m => m.gymId === gym.id || m.gymId === gym._id).length;
                  const activitiesList = gym.category ? gym.category.split(',').map(s => s.trim()).filter(Boolean) : ['Gym / Fitness'];
                  const gymId = gym.id || gym._id;
                  return (
                    <tr key={gymId} className="gym-table-row">
                      <td>
                        <div className="gym-brand-cell">
                          <div className="gym-avatar-badge luxury-glow-avatar">
                            {(gym.name || 'FC').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="gym-brand-info">
                            <div className="gym-brand-name">{gym.name}</div>
                            <span className="gym-rating-tag">
                              <StarIcon size={12} color="#b45309" /> {gym.rating ? gym.rating.toFixed(1) : '4.8'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="gym-location-box">
                          <span className="gym-city-text">
                            <LocationPinIcon size={13} color="#ef4444" /> {gym.city || 'India'}
                          </span>
                          <span className="gym-address-sub">{gym.address || 'Main Branch'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-activity-chips">
                          {activitiesList.slice(0, 2).map((act, idx) => (
                            <span key={idx} className="table-act-pill">
                              {act}
                            </span>
                          ))}
                          {activitiesList.length > 2 && (
                            <span className="table-act-pill more-pill">+{activitiesList.length - 2} more</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="gym-member-cell">
                          <span className="gym-member-count">
                            <UsersIcon size={14} color="#4f46e5" /> {gymMembersCount}
                          </span>
                          <span className="gym-member-sub">enrolled athletes</span>
                        </div>
                      </td>
                      <td>
                        <span className={`plan-badge luxury-plan-badge ${gym.plan === 'starter' ? 'starter' : gym.plan === 'enterprise' ? 'enterprise' : 'pro'}`}>
                          {gym.plan === 'enterprise' ? 'ENTERPRISE' : gym.plan === 'starter' ? 'STARTER' : 'PRO STUDIO'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-tag luxury-status-tag ${gym.status || 'approved'}`}>
                          <span className="status-dot-pulse" />
                          {gym.status === 'approved' ? 'Active' : (gym.status || 'Active')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-wrap">
                          <button 
                            className="table-action-btn view-btn"
                            title="Inspect Details"
                            onClick={() => setSelectedGym(gym)}
                          >
                            <SettingsIcon size={13} color="currentColor" /> Inspect
                          </button>
                          <button 
                            className="table-action-btn edit-btn"
                            title="Edit Franchise"
                            onClick={() => openEditModal(gym)}
                          >
                            <EditIcon size={13} color="currentColor" /> Edit
                          </button>
                          {gym.status === 'pending' && (
                            <button
                              className="table-action-btn approve-btn"
                              onClick={() => handleStatusChange(gymId, 'approved')}
                            >
                              <CheckCircleIcon size={13} color="currentColor" /> Approve
                            </button>
                          )}
                          {gym.status === 'approved' && (
                            <button
                              className="table-action-btn suspend-btn"
                              onClick={() => handleStatusChange(gymId, 'suspended')}
                            >
                              <BoltIcon size={13} color="currentColor" /> Suspend
                            </button>
                          )}
                          {gym.status === 'suspended' && (
                            <button
                              className="table-action-btn approve-btn"
                              onClick={() => handleStatusChange(gymId, 'approved')}
                            >
                              <BoltIcon size={13} color="currentColor" /> Reactivate
                            </button>
                          )}
                          <button 
                            className="table-action-btn delete-btn"
                            title="Delete Franchise"
                            onClick={() => handleDeleteGym(gymId, gym.name)}
                          >
                            <TrashIcon size={14} color="#dc2626" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modern Luxury Pagination Bar */}
        <div className="table-pagination-footer">
          <div className="pagination-info">
            <span>
              Showing <strong>{totalItems > 0 ? startIndex + 1 : 0}</strong> to <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> of <strong>{totalItems}</strong> franchises
            </span>
            <span className="pagination-divider">·</span>
            <span>Page <strong>{validCurrentPage}</strong> of <strong>{totalPages}</strong></span>
          </div>

          <div className="pagination-controls">
            {/* Page Size Selector */}
            <div className="page-size-selector">
              <span className="page-size-label">Rows per page:</span>
              <select 
                value={pageSize} 
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="page-size-select"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Previous Button */}
            <button 
              className="page-nav-btn prev-btn" 
              disabled={validCurrentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              ‹ Previous
            </button>

            {/* Page Numbers */}
            <div className="page-numbers-list">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  className={`page-num-btn ${validCurrentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button 
              className="page-nav-btn next-btn" 
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              Next ›
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4-STEP PAN-INDIA ONBOARDING WIZARD MODAL
          ========================================================================= */}
      {showAddWizard && (
        <div className="wizard-modal-overlay">
          <div className="wizard-modal-card glass-card">
            {/* Modal Header */}
            <div className="wizard-header">
              <div className="wizard-title-wrap">
                <span className="wizard-step-badge">STEP {wizardStep} OF 4</span>
                <h2 className="wizard-title">
                  {wizardStep === 1 && 'Franchise Profile & Pan-India Location'}
                  {wizardStep === 2 && 'Studio Capacity & Floor Amenities'}
                  {wizardStep === 3 && 'Subscription Package & Permissions'}
                  {wizardStep === 4 && 'Owner Credentials & Activation'}
                </h2>
              </div>
              <button className="wizard-close-btn" onClick={resetWizard}>✕</button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="wizard-stepper-bar">
              {[
                { num: 1, label: 'Identity' },
                { num: 2, label: 'Capacity' },
                { num: 3, label: 'Permissions' },
                { num: 4, label: 'Credentials' }
              ].map(s => (
                <div key={s.num} className={`step-item ${wizardStep >= s.num ? 'active' : ''}`}>
                  <div className="step-circle">{s.num}</div>
                  <span className="step-label">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Wizard Body Content */}
            {!createdCredentials ? (
              <form onSubmit={wizardStep === 4 ? handleCompleteRegistration : handleNextStep}>
                {/* Server Error Alert Banner */}
                {serverError && (
                  <div className="adm-form-alert-banner">
                    <span className="alert-icon">
                      <AlertTriangleIcon size={14} color="#ef4444" />
                    </span>
                    <span className="alert-text">{serverError}</span>
                  </div>
                )}

                {/* STEP 1: Gym Identity & Location */}
                {wizardStep === 1 && (
                  <div className="wizard-step-content">
                    <div className="wizard-form-grid">
                      <div className="form-group full-width">
                        <label className="form-label">Franchise Club Name *</label>
                        <input 
                          type="text" 
                          className={`form-input ${validationErrors.gymName || validationErrors.name ? 'has-error' : ''}`}
                          placeholder="e.g. Ayushi Gym Club" 
                          value={gymName} 
                          onChange={(e) => { setGymName(e.target.value); setValidationErrors(prev => ({ ...prev, gymName: null, name: null })); }} 
                          required 
                        />
                        {(validationErrors.gymName || validationErrors.name) && (
                          <span className="field-error-msg">⚠️ {validationErrors.gymName || validationErrors.name}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">City *</label>
                        <select 
                          className="form-input" 
                          value={gymCity} 
                          onChange={(e) => setGymCity(e.target.value)} 
                          required
                        >
                          {citiesList.map((c, i) => (
                            <option key={i} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group full-width">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label className="form-label">Activities & Offerings * (Multi-Select)</label>
                          <span style={{ fontSize: '11.5px', color: 'var(--indigo-primary)', fontWeight: '700' }}>
                            {selectedActivities.length} Selected
                          </span>
                        </div>
                        <div className="activity-chips-grid">
                          {activityTypesList.map(act => {
                            const isSelected = selectedActivities.includes(act.label);
                            return (
                              <button
                                key={act.id}
                                type="button"
                                className={`activity-chip-btn ${isSelected ? 'active' : ''}`}
                                onClick={() => toggleActivity(act.label)}
                              >
                                <span className="chip-icon">{act.icon}</span>
                                <span className="chip-label">{act.label}</span>
                                <span className="chip-check">{isSelected ? '✓' : '+'}</span>
                              </button>
                            );
                          })}

                          {/* Custom Added Tags */}
                          {customTags.map((tag, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="activity-chip-btn custom-tag-active active"
                              onClick={() => handleRemoveTag(tag)}
                              title="Click to remove custom activity"
                            >
                              <span className="chip-icon">✨</span>
                              <span className="chip-label">{tag}</span>
                              <span className="chip-delete-x" title="Delete tag">✕</span>
                            </button>
                          ))}

                          <button
                            type="button"
                            className={`activity-chip-btn other-chip ${showCustomActivity ? 'active' : ''}`}
                            onClick={() => setShowCustomActivity(!showCustomActivity)}
                          >
                            <span className="chip-icon"><PlusIcon size={12} color="currentColor" /></span>
                            <span className="chip-label">Other Activity</span>
                            <span className="chip-check">{showCustomActivity ? '▼' : '+'}</span>
                          </button>
                        </div>

                        {showCustomActivity && (
                          <div className="custom-activity-input-box">
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                className="form-input custom-input"
                                placeholder="Type custom activity (e.g. Pilates, Martial Arts, Aerobics...)"
                                value={customActivityInput}
                                onChange={(e) => setCustomActivityInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTag(); } }}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="hub-btn-glow"
                                style={{ padding: '0 18px', whiteSpace: 'nowrap', borderRadius: '12px', fontSize: '13px' }}
                                onClick={handleAddCustomTag}
                              >
                                + Add Tag
                              </button>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--adm-text-sub)', marginTop: '4px', display: 'block' }}>
                              Press <strong>Enter</strong> or click <strong>+ Add Tag</strong> to add your custom activity.
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="form-group full-width">
                        <label className="form-label">Branch Area & Street Address *</label>
                        <input 
                          type="text" 
                          className={`form-input ${validationErrors.gymAddress || validationErrors.address ? 'has-error' : ''}`}
                          placeholder="e.g. Plot 88, Naik Nagar, Manewada Ring Road" 
                          value={gymAddress} 
                          onChange={(e) => { setGymAddress(e.target.value); setValidationErrors(prev => ({ ...prev, gymAddress: null, address: null })); }} 
                          required
                        />
                        {(validationErrors.gymAddress || validationErrors.address) && (
                          <span className="field-error-msg">⚠️ {validationErrors.gymAddress || validationErrors.address}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label className="form-label">Official Phone *</label>
                          <span style={{ fontSize: '11px', color: gymPhone.length === 10 ? '#10b981' : '#64748b', fontWeight: '700' }}>
                            {gymPhone.length}/10 Digits
                          </span>
                        </div>
                        <input 
                          type="tel" 
                          inputMode="numeric"
                          maxLength={10}
                          pattern="[0-9]{10}"
                          className={`form-input ${validationErrors.gymPhone || validationErrors.phone ? 'has-error' : ''}`}
                          placeholder="e.g. 9876543210 (10 Digits Only)" 
                          value={gymPhone} 
                          onChange={(e) => { 
                            const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setGymPhone(onlyNumbers); 
                            setValidationErrors(prev => ({ ...prev, gymPhone: null, phone: null })); 
                          }} 
                          required 
                        />
                        {(validationErrors.gymPhone || validationErrors.phone) && (
                          <span className="field-error-msg">⚠️ {validationErrors.gymPhone || validationErrors.phone}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Support Email (Optional)</label>
                        <input 
                          type="email" 
                          className={`form-input ${validationErrors.gymEmail || validationErrors.email ? 'has-error' : ''}`}
                          placeholder="e.g. contact@ayushigym.com" 
                          value={gymEmail} 
                          onChange={(e) => { setGymEmail(e.target.value); setValidationErrors(prev => ({ ...prev, gymEmail: null, email: null })); }} 
                        />
                        {(validationErrors.gymEmail || validationErrors.email) && (
                          <span className="field-error-msg">⚠️ {validationErrors.gymEmail || validationErrors.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Studio Capacity & Amenities */}
                {wizardStep === 2 && (
                  <div className="wizard-step-content">
                    <div className="wizard-form-grid">
                      <div className="form-group">
                        <label className="form-label">Max Turnstile Floor Capacity ({gymCapacity} Members)</label>
                        <input 
                          type="range" 
                          min="50" 
                          max="1000" 
                          step="25" 
                          className="form-range" 
                          value={gymCapacity} 
                          onChange={(e) => setGymCapacity(e.target.value)} 
                        />
                        <div className="range-hints">
                          <span>50 (Boutique)</span>
                          <span>250 (Standard)</span>
                          <span>1000+ (Megaclub)</span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Floor Area (Sq. Ft.)</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. 5,000 sq ft" 
                          value={gymFloorArea} 
                          onChange={(e) => setGymFloorArea(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="amenities-selection-box">
                      <label className="form-label">Select Club Amenities & Facilities</label>
                      <div className="amenities-pill-grid">
                        {amenitiesList.map(a => (
                          <div 
                            key={a.id} 
                            className={`amenity-chip ${selectedAmenities.includes(a.label) ? 'selected' : ''}`}
                            onClick={() => toggleAmenity(a.label)}
                          >
                            <span className="amenity-icon">{a.icon}</span>
                            <span className="amenity-name">{a.label}</span>
                            <span className="amenity-check">{selectedAmenities.includes(a.label) ? '✓' : '+'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Subscription Packages & Permissions */}
                {wizardStep === 3 && (
                  <div className="wizard-step-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label className="form-label" style={{ margin: 0 }}>Choose Franchise Subscription Package</label>
                      <span style={{ fontSize: '12px', color: '#4f46e5', fontWeight: '600' }}>
                        Selected: {packagesList.find(p => p.id === selectedPlan)?.name || 'Custom Plan'} (₹{Number(customPlanAmount || 0).toLocaleString()} / {customBillingCycle})
                      </span>
                    </div>

                    <div className="package-cards-grid">
                      {packagesList.map(pkg => (
                        <div 
                          key={pkg.id} 
                          className={`package-card ${selectedPlan === pkg.id ? 'active-pkg' : ''}`}
                          onClick={() => {
                            setSelectedPlan(pkg.id);
                            if (pkg.amount) setCustomPlanAmount(pkg.amount);
                            if (pkg.billingCycle) setCustomBillingCycle(pkg.billingCycle);
                          }}
                        >
                          {pkg.recommended && <div className="pkg-rec-pill">RECOMMENDED</div>}
                          <h4 className="pkg-name">{pkg.name}</h4>
                          <div className="pkg-price">{pkg.price || `₹${(pkg.amount || 0).toLocaleString()}`}</div>
                          <span className="pkg-cap">Cap: {pkg.capacity}</span>
                          <ul className="pkg-features-list">
                            {(pkg.features || []).map((f, i) => (
                              <li key={i}>✓ {f}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* Custom Super Admin Pricing & Billing Cycle Controls */}
                    <div className="amenities-selection-box" style={{ marginTop: '18px', background: 'rgba(248, 250, 252, 0.85)', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ display: 'inline-flex', padding: '4px', background: '#e0e7ff', borderRadius: '8px', color: '#4f46e5' }}>
                          <CreditCardIcon size={16} color="#4f46e5" />
                        </span>
                        <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>
                          Franchise SaaS Fee & Billing Duration (Super Admin Override)
                        </h4>
                      </div>

                      <div className="wizard-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>Amount to Charge (₹ INR) *</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="e.g. 34999 or 2999" 
                            value={customPlanAmount} 
                            onChange={(e) => setCustomPlanAmount(Number(e.target.value))}
                            required 
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>Billing Cycle Duration *</label>
                          <select 
                            className="form-input"
                            value={customBillingCycle}
                            onChange={(e) => setCustomBillingCycle(e.target.value)}
                          >
                            <option value="monthly">Monthly (Billed Every Month)</option>
                            <option value="quarterly">Quarterly (3 Months)</option>
                            <option value="half_yearly">Half-Yearly (6 Months)</option>
                            <option value="yearly">Yearly (Annual License)</option>
                          </select>
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label" style={{ fontSize: '12px' }}>Billing Description / Custom Notes</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Special inaugural branch discount applied" 
                            value={customPaymentNotes} 
                            onChange={(e) => setCustomPaymentNotes(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="permissions-toggle-box">
                      <label className="form-label">Dynamic Feature Permissions Matrix</label>
                      <div className="permissions-grid">
                        {permissionsList.map(perm => (
                          <div key={perm.key} className="permission-toggle-item">
                            <div className="perm-info">
                              <span className="perm-title">{perm.label}</span>
                              <span className="perm-desc">{perm.desc}</span>
                            </div>
                            <label className="switch-toggle">
                              <input 
                                type="checkbox" 
                                checked={permissions[perm.key]} 
                                onChange={() => togglePermission(perm.key)} 
                              />
                              <span className="slider round" />
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Owner Credentials & Direct Activation */}
                {wizardStep === 4 && (
                  <div className="wizard-step-content">
                    <div className="owner-credentials-preview glass-panel">
                      <div className="cred-preview-header">
                        <span className="cred-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <StarIcon size={16} color="#f59e0b" />
                        </span>
                        <div>
                          <h4 className="cred-heading">Gym Admin / Owner Account</h4>
                          <p className="cred-sub">Login credentials will be generated directly for the franchise manager</p>
                        </div>
                      </div>

                      <div className="wizard-form-grid">
                        <div className="form-group">
                          <label className="form-label">Owner Full Name *</label>
                          <input 
                            type="text" 
                            className={`form-input ${validationErrors.ownerName ? 'has-error' : ''}`}
                            placeholder="e.g. Ramesh Sharma" 
                            value={ownerName} 
                            onChange={(e) => { setOwnerName(e.target.value); setValidationErrors(prev => ({ ...prev, ownerName: null })); }} 
                            required 
                          />
                          {validationErrors.ownerName && (
                            <span className="field-error-msg">⚠️ {validationErrors.ownerName}</span>
                          )}
                        </div>

                        <div className="form-group">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="form-label">Owner Mobile (Login ID) *</label>
                            <span style={{ fontSize: '11px', color: ownerPhone.length === 10 ? '#10b981' : '#64748b', fontWeight: '700' }}>
                              {ownerPhone.length}/10 Digits
                            </span>
                          </div>
                          <input 
                            type="tel" 
                            inputMode="numeric"
                            maxLength={10}
                            pattern="[0-9]{10}"
                            className={`form-input ${validationErrors.ownerPhone ? 'has-error' : ''}`}
                            placeholder="e.g. 9876543210 (10 Digits Only)" 
                            value={ownerPhone} 
                            onChange={(e) => { 
                              const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setOwnerPhone(onlyNumbers); 
                              setValidationErrors(prev => ({ ...prev, ownerPhone: null })); 
                            }} 
                            required 
                          />
                          {validationErrors.ownerPhone && (
                            <span className="field-error-msg">⚠️ {validationErrors.ownerPhone}</span>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Owner Email</label>
                          <input 
                            type="email" 
                            className={`form-input ${validationErrors.ownerEmail ? 'has-error' : ''}`}
                            placeholder="owner@gym.com" 
                            value={ownerEmail} 
                            onChange={(e) => { setOwnerEmail(e.target.value); setValidationErrors(prev => ({ ...prev, ownerEmail: null })); }} 
                          />
                          {validationErrors.ownerEmail && (
                            <span className="field-error-msg">⚠️ {validationErrors.ownerEmail}</span>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Initial Password</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={ownerPassword} 
                            onChange={(e) => setOwnerPassword(e.target.value)} 
                            required 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Summary Card */}
                    <div className="onboarding-summary-card">
                      <div className="summary-col">
                        <span className="sum-label">Franchise Name</span>
                        <span className="sum-val">{gymName || 'Not Specified'}</span>
                      </div>
                      <div className="summary-col">
                        <span className="sum-label">Location</span>
                        <span className="sum-val">{gymCity}, {gymState}</span>
                      </div>
                      <div className="summary-col">
                        <span className="sum-label">Plan Tier</span>
                        <span className="sum-val">{selectedPlan.toUpperCase()} (₹{selectedPlan === 'starter' ? '14,999' : selectedPlan === 'pro' ? '34,999' : '69,999'})</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wizard Footer Navigation */}
                <div className="wizard-footer">
                  {wizardStep > 1 && (
                    <button 
                      type="button" 
                      className="wizard-back-btn" 
                      onClick={() => setWizardStep(prev => prev - 1)}
                    >
                      ← Back
                    </button>
                  )}
                  {wizardStep < 4 ? (
                    <button 
                      type="submit" 
                      className="hub-btn-glow wizard-next-btn"
                    >
                      Next Step →
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      className="hub-btn-glow wizard-submit-btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Activating Franchise...' : 'Complete Registration & Activate Franchise'}
                    </button>
                  )}
                </div>
              </form>
            ) : (
              /* Success Voucher Modal */
              <div className="credentials-success-screen">
                <div className="success-icon-animated">✓</div>
                <h3 className="success-title">Franchise Activated Successfully!</h3>
                <p className="success-subtitle">The gym owner account has been provisioned on the Pan-India network.</p>

                {/* Metallic Voucher Card */}
                <div className="metallic-voucher-card glass-panel">
                  <div className="voucher-top">
                    <span className="voucher-brand">FITCORE INDIA VIP PARTNER</span>
                    <span className="voucher-plan">{selectedPlan.toUpperCase()} TIER</span>
                  </div>
                  <h4 className="voucher-gym-name">{createdCredentials.gymName}</h4>
                  
                  <div className="voucher-details-grid">
                    <div className="voucher-row">
                      <span className="voucher-lbl">LOGIN IDENTIFIER (PHONE):</span>
                      <strong className="voucher-val">{createdCredentials.loginId}</strong>
                    </div>
                    <div className="voucher-row">
                      <span className="voucher-lbl">INITIAL PASSWORD:</span>
                      <strong className="voucher-val">{createdCredentials.password}</strong>
                    </div>
                    {createdCredentials.email && (
                      <div className="voucher-row">
                        <span className="voucher-lbl">REGISTERED EMAIL:</span>
                        <strong className="voucher-val">{createdCredentials.email}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="voucher-actions-row">
                  <button className="hub-btn-glow copy-creds-btn" onClick={copyCredentialsToClipboard}>
                    {copied ? '✓ Credentials Copied!' : 'Copy All Credentials'}
                  </button>
                  <button className="wizard-back-btn" onClick={resetWizard}>
                    Done & Return to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



      {/* =========================================================================
          EDIT FRANCHISE MODAL
          ========================================================================= */}
      {editingGym && (
        <div className="wizard-modal-overlay" onClick={() => setEditingGym(null)}>
          <div className="wizard-modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="wizard-header">
              <div className="wizard-title-wrap">
                <span className="wizard-step-badge">EDIT FRANCHISE</span>
                <h2 className="wizard-title">Update {editFormData.name}</h2>
              </div>
              <button className="wizard-close-btn" onClick={() => setEditingGym(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditGym}>
              <div className="wizard-step-content">
                <div className="wizard-form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Franchise Club Name *</label>
                    <input
                      type="text"
                      className={`form-input ${editValidationErrors.name ? 'has-error' : ''}`}
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      required
                    />
                    {editValidationErrors.name && (
                      <span className="field-error-msg">⚠️ {editValidationErrors.name}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <select
                      className="form-input"
                      value={editFormData.city || 'Nagpur'}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      required
                    >
                      {citiesList.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Franchise Status *</label>
                    <select
                      className="form-input"
                      value={editFormData.status || 'approved'}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    >
                      <option value="approved">✓ Active / Approved</option>
                      <option value="pending">⏳ Pending Verification</option>
                      <option value="suspended">⚠️ Suspended</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Branch Address *</label>
                    <input
                      type="text"
                      className={`form-input ${editValidationErrors.address ? 'has-error' : ''}`}
                      value={editFormData.address || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      required
                    />
                    {editValidationErrors.address && (
                      <span className="field-error-msg">⚠️ {editValidationErrors.address}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">Contact Phone *</label>
                      <span style={{ fontSize: '11px', color: (editFormData.phone || '').length === 10 ? '#10b981' : '#64748b', fontWeight: '700' }}>
                        {(editFormData.phone || '').length}/10 Digits
                      </span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      className={`form-input ${editValidationErrors.phone ? 'has-error' : ''}`}
                      placeholder="e.g. 9876543210 (10 Digits Only)"
                      value={editFormData.phone || ''}
                      onChange={(e) => {
                        const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setEditFormData({ ...editFormData, phone: onlyNumbers });
                        setEditValidationErrors(prev => ({ ...prev, phone: null }));
                      }}
                      required
                    />
                    {editValidationErrors.phone && (
                      <span className="field-error-msg">⚠️ {editValidationErrors.phone}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Support Email</label>
                    <input
                      type="email"
                      className={`form-input ${editValidationErrors.email ? 'has-error' : ''}`}
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                    {editValidationErrors.email && (
                      <span className="field-error-msg">⚠️ {editValidationErrors.email}</span>
                    )}
                  </div>

                  {/* Activities Multi-Select in Edit */}
                  <div className="form-group full-width">
                    <label className="form-label">Activities & Offerings (Dynamic Multi-Select)</label>
                    <div className="activity-chips-grid">
                      {activityTypesList.map(act => {
                        const isSelected = editFormData.activities?.includes(act.label);
                        return (
                          <button
                            key={act.id}
                            type="button"
                            className={`activity-chip-btn ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              const current = editFormData.activities || [];
                              const next = current.includes(act.label)
                                ? current.filter(a => a !== act.label)
                                : [...current, act.label];
                              setEditFormData({ ...editFormData, activities: next });
                            }}
                          >
                            <span className="chip-icon">{act.icon}</span>
                            <span className="chip-label">{act.label}</span>
                            <span className="chip-check">{isSelected ? '✓' : '+'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subscription Plan Tier</label>
                    <select
                      className="form-input"
                      value={editFormData.plan || 'pro'}
                      onChange={(e) => setEditFormData({ ...editFormData, plan: e.target.value })}
                    >
                      {packagesList.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Floor Turnstile Capacity</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editFormData.capacity || 250}
                      onChange={(e) => setEditFormData({ ...editFormData, capacity: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="wizard-footer">
                <button type="button" className="wizard-back-btn" onClick={() => setEditingGym(null)}>
                  Cancel
                </button>
                <button type="submit" className="hub-btn-glow" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving Updates...' : 'Save Changes ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          FRANCHISE PROFILE & UPLOADED KYC INSPECTION MODAL DRAWER
          ========================================================================= */}
      {selectedGym && (
        <div className="adm-drawer-overlay" onClick={() => setSelectedGym(null)}>
          <div className="franchise-inspect-modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Head */}
            <div className="inspect-modal-header">
              <div className="inspect-header-left">
                <div className="inspect-avatar-box">
                  {(selectedGym.name || 'FC').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="inspect-badge-row">
                    <span className={`plan-badge luxury-plan-badge ${selectedGym.plan === 'enterprise' ? 'enterprise' : selectedGym.plan === 'starter' ? 'starter' : 'pro'}`}>
                      {selectedGym.plan ? selectedGym.plan.toUpperCase() : 'PRO STUDIO'}
                    </span>
                    <span className="hero-rating-badge">
                      <StarIcon size={12} color="#f59e0b" /> {selectedGym.rating ? selectedGym.rating.toFixed(1) : '4.8'}
                    </span>
                    <span className="hero-verified-badge">
                      <CheckCircleIcon size={12} color="#10b981" /> Verified Club
                    </span>
                  </div>
                  <h2 className="inspect-gym-title">{selectedGym.name}</h2>
                  <p className="inspect-gym-loc">
                    <LocationPinIcon size={13} color="#ef4444" /> {selectedGym.address ? `${selectedGym.address}, ` : ''}{selectedGym.city || 'India'} {selectedGym.pincode ? `- ${selectedGym.pincode}` : ''}
                  </p>
                </div>
              </div>
              <button className="wizard-close-btn" onClick={() => setSelectedGym(null)}>✕</button>
            </div>

            {/* Modal Body */}
            <div className="inspect-modal-body">
              {/* Quick KPI Strip */}
              <div className="inspect-kpi-grid">
                <div className="hero-kpi-box">
                  <span className="kpi-icon-wrap indigo">
                    <UsersIcon size={16} color="#4f46e5" />
                  </span>
                  <div className="kpi-text-col">
                    <span className="kpi-val">{members.filter(m => (m.gymId === selectedGym.id || m.gymId === selectedGym._id)).length}</span>
                    <span className="kpi-lbl">Enrolled Athletes</span>
                  </div>
                </div>
                <div className="hero-kpi-box">
                  <span className="kpi-icon-wrap cyan">
                    <BoltIcon size={16} color="#06b6d4" />
                  </span>
                  <div className="kpi-text-col">
                    <span className="kpi-val">{selectedGym.capacity || 250} Spots</span>
                    <span className="kpi-lbl">Turnstile Limit</span>
                  </div>
                </div>
                <div className="hero-kpi-box">
                  <span className="kpi-icon-wrap amber">
                    <ShieldCheckIcon size={16} color="#d97706" />
                  </span>
                  <div className="kpi-text-col">
                    <span className="kpi-val">{selectedGym.ownerName || selectedGym.owner?.name || 'Franchise Director'}</span>
                    <span className="kpi-lbl">Franchise Owner</span>
                  </div>
                </div>
              </div>

              {/* 2-Column Info Grid */}
              <div className="inspect-info-columns">
                {/* Column 1: Identity & Credentials */}
                <div className="inspect-col-card">
                  <h4 className="inspect-section-title">Owner & Club Contact</h4>
                  <div className="info-kv-list">
                    <div className="info-kv-row">
                      <span className="info-k">Director Name</span>
                      <span className="info-v highlight">{selectedGym.ownerName || selectedGym.owner?.name || '-'}</span>
                    </div>
                    <div className="info-kv-row">
                      <span className="info-k">Owner Direct Phone</span>
                      <span className="info-v">{selectedGym.ownerPhone || selectedGym.owner?.phone || selectedGym.phone || '-'}</span>
                    </div>
                    <div className="info-kv-row">
                      <span className="info-k">Owner Direct Email</span>
                      <span className="info-v">{selectedGym.ownerEmail || selectedGym.owner?.email || selectedGym.email || '-'}</span>
                    </div>
                    <div className="info-kv-row">
                      <span className="info-k">Official Desk Line</span>
                      <span className="info-v">{selectedGym.phone || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Uploaded KYC & Legal Certificates */}
                <div className="inspect-col-card">
                  <h4 className="inspect-section-title">Uploaded KYC & Licenses</h4>
                  <div className="info-kv-list">
                    <div className="info-kv-row">
                      <span className="info-k">Shop Act License</span>
                      <span className="info-v" style={{ color: selectedGym.shopActLicense ? '#0284c7' : '#94a3b8' }}>
                        {selectedGym.shopActLicense || 'Not Uploaded'}
                      </span>
                    </div>
                    <div className="info-kv-row">
                      <span className="info-k">Owner Aadhaar Proof</span>
                      <span className="info-v" style={{ color: selectedGym.aadhaarNumber ? '#0284c7' : '#94a3b8' }}>
                        {selectedGym.aadhaarNumber ? `XXXX XXXX ${selectedGym.aadhaarNumber.slice(-4)}` : 'Not Uploaded'}
                      </span>
                    </div>
                    <div className="info-kv-row">
                      <span className="info-k">GST Identification</span>
                      <span className="info-v" style={{ fontFamily: 'monospace', color: selectedGym.gstNumber ? '#1e293b' : '#94a3b8' }}>
                        {selectedGym.gstNumber || 'Not Registered'}
                      </span>
                    </div>
                    <div className="info-kv-row">
                      <span className="info-k">Turnstile Bank Payout</span>
                      <span className="info-v" style={{ color: (selectedGym.bankAccount || selectedGym.upiId) ? '#1e293b' : '#94a3b8' }}>
                        {selectedGym.bankAccount ? `Bank Account (${selectedGym.bankAccount.slice(-4)})` : (selectedGym.upiId || 'Not Configured')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Studio Activities & Amenities */}
              <div className="inspect-chips-card">
                <h4 className="inspect-section-title" style={{ marginBottom: '8px' }}>Programs & Facilities Offered</h4>
                <div className="chips-collection-wrap">
                  {(selectedGym.category ? selectedGym.category.split(',') : []).map((c, i) => (
                    <span key={i} className="luxury-detail-pill">{c.trim()}</span>
                  ))}
                  {(Array.isArray(selectedGym.amenities) ? selectedGym.amenities : []).map((a, i) => (
                    <span key={i} className="luxury-detail-pill" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}>
                      ✓ {a}
                    </span>
                  ))}
                  {(!selectedGym.category && (!selectedGym.amenities || selectedGym.amenities.length === 0)) && (
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>No specific facilities configured</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="inspect-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                className="table-action-btn delete-btn"
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  const gId = selectedGym.id || selectedGym._id;
                  const gName = selectedGym.name;
                  setSelectedGym(null);
                  handleDeleteGym(gId, gName);
                }}
              >
                <TrashIcon size={14} color="#ef4444" /> Delete Franchise
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="hub-btn-glow" 
                  onClick={() => {
                    const g = selectedGym;
                    setSelectedGym(null);
                    openEditModal(g);
                  }}
                >
                  <EditIcon size={14} color="#ffffff" /> Edit Franchise
                </button>
                <button className="wizard-back-btn" onClick={() => setSelectedGym(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Super Admin SaaS Subscription Pricing & Tiers Management Modal */}
      {showPricingModal && (
        <div className="modal-backdrop-luxury">
          <div className="luxury-wizard-box" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="wizard-modal-header">
              <div className="wizard-title-group">
                <span className="step-count-pill" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
                  Super Admin Console
                </span>
                <h3 className="wizard-headline">Manage SaaS Franchise Subscription Pricing</h3>
                <p className="wizard-sub-info">
                  Configure the monthly/yearly platform fee charged to gyms and franchises stored directly in MongoDB.
                </p>
              </div>
              <button className="wizard-close-btn" onClick={() => setShowPricingModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveSaaSPricing} className="wizard-form-flow" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {editingPackages.map((pkg, idx) => (
                  <div key={pkg.id || idx} className="luxury-plan-card selected" style={{ padding: '18px', cursor: 'default' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className="plan-badge-pill" style={{ textTransform: 'uppercase' }}>{pkg.badge || pkg.id}</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Tier #{idx + 1}</span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Tier / Package Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={pkg.name} 
                        onChange={(e) => {
                          const updated = [...editingPackages];
                          updated[idx].name = e.target.value;
                          setEditingPackages(updated);
                        }}
                        required 
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Price Display Tag</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. ₹34,999 / yr or ₹2,999 / mo"
                        value={pkg.price} 
                        onChange={(e) => {
                          const updated = [...editingPackages];
                          updated[idx].price = e.target.value;
                          setEditingPackages(updated);
                        }}
                        required 
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Amount (₹ Numeric)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="e.g. 34999"
                        value={pkg.amount || ''} 
                        onChange={(e) => {
                          const updated = [...editingPackages];
                          updated[idx].amount = Number(e.target.value);
                          setEditingPackages(updated);
                        }}
                        required 
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Billing Cycle</label>
                      <select 
                        className="form-input"
                        value={pkg.billingCycle || 'yearly'}
                        onChange={(e) => {
                          const updated = [...editingPackages];
                          updated[idx].billingCycle = e.target.value;
                          setEditingPackages(updated);
                        }}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly (3 Months)</option>
                        <option value="yearly">Yearly (Annual)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '12px' }}>Turnstile Capacity Limit</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. 600 Members or Unlimited"
                        value={pkg.capacity} 
                        onChange={(e) => {
                          const updated = [...editingPackages];
                          updated[idx].capacity = e.target.value;
                          setEditingPackages(updated);
                        }}
                        required 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="wizard-nav-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="wizard-back-btn" onClick={() => setShowPricingModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="hub-btn-glow" disabled={isSavingPricing}>
                  {isSavingPricing ? 'Saving to Database...' : 'Save SaaS Pricing to Database ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
