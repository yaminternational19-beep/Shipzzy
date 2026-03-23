import React, { useState, useEffect } from 'react';
import {
    Upload, X, Check, ArrowRight, ArrowLeft, Store,
    MapPin, CreditCard, FileText, Camera, User,
    Mail, Lock, Globe, Building2, FileCheck, Hash,
    Eye, EyeOff, Trash2, Award
} from 'lucide-react';
import { Country, State } from 'country-state-city';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { getCategoriesApi } from '../../../api/categories.api';
import { getTiersApi } from '../../../api/tier.api';
import { createVendorApi, updateVendorApi } from '../../../api/vendor.api';

const VendorForm = ({ onCancel, onSave, initialData }) => {
    // Helper to find file by type
    const getFileUrl = (type) => {
        if (!initialData?.files) return null;
        const file = initialData.files.find(f => f.file_type === type);
        return file ? file.file_url : null;
    };

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        businessName: initialData?.business_name || initialData?.businessName || '',
        category: initialData?.business_categories || initialData?.category || [], // multiple categories
        fullName: initialData?.owner_name || initialData?.fullName || '',
        email: initialData?.email || '',
        password: '', // Password usually blank on edit
        countryCode: initialData?.country_code || initialData?.countryCode || '+91',
        mobile: initialData?.mobile || '',
        emergencyCountryCode: initialData?.emergency_country_code || initialData?.emergencyCountryCode || '+91',
        emergencyMobile: initialData?.emergency_mobile || initialData?.emergencyMobile || '',
        profilePhoto: getFileUrl('profile_photo') || initialData?.profile_photo || initialData?.profilePhoto || null,
        photoFile: null,

        // Address
        address: initialData?.address || '',
        country: initialData?.country || 'India',
        countryIso: initialData?.country_iso || initialData?.countryIso || 'IN',
        state: initialData?.state || '',
        stateIso: initialData?.state_iso || initialData?.stateIso || '',
        city: initialData?.city || '',
        pincode: initialData?.pincode || '',
        latitude: initialData?.latitude || '',
        longitude: initialData?.longitude || '',

        // Personal IDs
        aadharNumber: initialData?.aadhar_number || initialData?.aadharNumber || '',
        aadharDoc: getFileUrl('aadhar_doc') || initialData?.aadharDoc || null,
        aadharDocFile: null,
        panNumber: initialData?.pan_number || initialData?.panNumber || '',
        panDoc: getFileUrl('pan_doc') || initialData?.panDoc || null,
        panDocFile: null,

        // Business IDs
        licenseNumber: initialData?.license_number || initialData?.licenseNumber || '',
        licenseDoc: getFileUrl('license_doc') || initialData?.licenseDoc || null,
        licenseDocFile: null,
        fassiCode: initialData?.fassi_code || initialData?.fassiCode || '',
        fassiDoc: getFileUrl('fassi_doc') || initialData?.fassiDoc || null,
        fassiDocFile: null,
        gstNumber: initialData?.gst_number || initialData?.gstNumber || '',
        gstDoc: getFileUrl('gst_doc') || initialData?.gstDoc || null,
        gstDocFile: null,

        // Bank Details
        bankName: initialData?.bank_name || initialData?.bankName || '',
        accountName: initialData?.account_name || initialData?.accountName || '',
        accountNumber: initialData?.account_number || initialData?.accountNumber || '',
        ifsc: initialData?.ifsc || '',

        // Tier & ID
        tier: initialData?.tier_id || initialData?.tier || '',
        vendorId: initialData?.vendor_code || initialData?.vendorId || '',
        expectedTurnover: initialData?.total_turnover || initialData?.turnover || ''
    });

    const [states, setStates] = useState([]);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [availableTiers, setAvailableTiers] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (formData.countryIso) {
            setStates(State.getStatesOfCountry(formData.countryIso));
        }
    }, [formData.countryIso]);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const response = await getCategoriesApi({ status: 'Active' });
                if (response.data.success) {
                    setAvailableCategories(response.data.data.records);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoadingCategories(false);
            }
        };

        const fetchTiers = async () => {
            try {
                const response = await getTiersApi({ is_active: true });
                if (response.data.success) {
                    const tiersData = response.data.data;
                    // API returns a direct array (not wrapped in .tiers/.records)
                    setAvailableTiers(Array.isArray(tiersData) ? tiersData : (tiersData.tiers || tiersData.records || []));
                }
            } catch (error) {
                console.error('Error fetching tiers:', error);
            }
        };

        fetchCategories();
        fetchTiers();
    }, []);

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({
                ...formData,
                profilePhoto: URL.createObjectURL(file),
                photoFile: file
            });
        }
    };

    const handleFileUpload = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({
                ...formData,
                [`${field}Doc`]: URL.createObjectURL(file),
                [`${field}DocFile`]: file
            });
        }
    };

    const clearFile = (field) => {
        setFormData({
            ...formData,
            [`${field}Doc`]: null,
            [`${field}DocFile`]: null
        });
    };

    const detectLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude.toString(),
                        longitude: position.coords.longitude.toString()
                    }));
                },
                (error) => {
                    alert("Error detecting location. Please allow location access.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };


    const toggleCategory = (cat) => {
        setFormData(prev => {
            const current = prev.category;
            if (current.includes(cat)) {
                return { ...prev, category: current.filter(c => c !== cat) };
            } else {
                return { ...prev, category: [...current, cat] };
            }
        });
    };

    const steps = [
        { id: 1, title: 'Basic Info', icon: Store },
        { id: 2, title: 'Location', icon: MapPin },
        { id: 3, title: 'Personal IDs', icon: FileCheck },
        { id: 4, title: 'Business IDs', icon: FileText },
        { id: 5, title: 'Bank Details', icon: CreditCard }
    ];

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="vendor-step-content">
                        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div className="profile-photo-upload" style={{ margin: 0, minWidth: '100px' }}>
                                {formData.profilePhoto ? (
                                    <img src={formData.profilePhoto} alt="Profile" className="preview-photo" />
                                ) : (
                                    <div className="photo-placeholder"><User size={40} /></div>
                                )}
                                <label className="upload-badge">
                                    <Camera size={16} />
                                    <input type="file" hidden onChange={handlePhotoUpload} accept="image/*" />
                                </label>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Business Name</label>
                                    <div className="input-with-icon">
                                        <Store size={18} className="field-icon" />
                                        <input
                                            type="text"
                                            value={formData.businessName}
                                            onChange={(e) => updateField('businessName', e.target.value)}
                                            placeholder="e.g. Spice Garden Restaurant"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Business Categories (Select multiple)</label>
                                    <div className="category-chips-container">
                                        {loadingCategories ? (
                                            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading categories...</p>
                                        ) : availableCategories.length > 0 ? (
                                            availableCategories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => toggleCategory(cat.name)}
                                                    className={`category-chip ${formData.category.includes(cat.name) ? 'active' : ''}`}
                                                >
                                                    {cat.name}
                                                </button>
                                            ))
                                        ) : (
                                            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No active categories found</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Vendor ID</label>
                                <div className="input-with-icon">
                                    <Hash size={18} className="field-icon" />
                                    <input
                                        type="text"
                                        value={formData.vendorId}
                                        readOnly
                                        style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                                        placeholder="Auto-generated ID"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Owner Full Name</label>
                                <div className="input-with-icon">
                                    <User size={18} className="field-icon" />
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => updateField('fullName', e.target.value)}
                                        placeholder="Legal name of owner"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <div className="input-with-icon">
                                    <Mail size={18} className="field-icon" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        placeholder="contact@business.com"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <div className="input-with-icon">
                                    <Lock size={18} className="field-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => updateField('password', e.target.value)}
                                        placeholder={initialData?.id ? "Leave blank to keep current" : "Min. 6 characters"}
                                        style={{ paddingRight: '40px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#94a3b8',
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '2px'
                                        }}
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Contact Number</label>
                                <PhoneInput
                                    country={'in'}
                                    value={formData.countryCode + formData.mobile}
                                    onChange={(value, data) => {
                                        const dialCode = `+${data.dialCode}`;
                                        const mobileNumber = value.startsWith(data.dialCode)
                                            ? value.slice(data.dialCode.length)
                                            : value;
                                        setFormData(prev => ({
                                            ...prev,
                                            countryCode: dialCode,
                                            mobile: mobileNumber
                                        }));
                                    }}
                                    enableSearch={true}
                                    containerStyle={{ width: '100%' }}
                                    inputStyle={{ width: '100%', height: '42px' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Emergency Contact</label>
                                <PhoneInput
                                    country={'in'}
                                    value={formData.emergencyCountryCode + formData.emergencyMobile}
                                    onChange={(value, data) => {
                                        const dialCode = `+${data.dialCode}`;
                                        const mobileNumber = value.startsWith(data.dialCode)
                                            ? value.slice(data.dialCode.length)
                                            : value;
                                        setFormData(prev => ({
                                            ...prev,
                                            emergencyCountryCode: dialCode,
                                            emergencyMobile: mobileNumber
                                        }));
                                    }}
                                    enableSearch={true}
                                    containerStyle={{ width: '100%' }}
                                    inputStyle={{ width: '100%', height: '42px' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Vendor Tier</label>
                                <div className="input-with-icon">
                                    <Award size={18} className="field-icon" />
                                    <select
                                        value={formData.tier}
                                        onChange={(e) => updateField('tier', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px 10px 40px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--border-color)',
                                            background: '#f8fafc',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        <option value="">Select a Tier</option>
                                        {availableTiers.length > 0 ? (
                                            availableTiers.map(tier => (
                                                <option key={tier.id} value={tier.id}>
                                                    {tier.tier_name}
                                                </option>
                                            ))
                                        ) : (
                                            <option disabled>Loading tiers...</option>
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Turnover</label>
                                <div className="input-with-icon">
                                    <CreditCard size={18} className="field-icon" />
                                    <input
                                        type="text"
                                        value={formData.expectedTurnover}
                                        onChange={(e) => updateField('expectedTurnover', e.target.value)}
                                        placeholder="e.g. ₹5,00,000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="vendor-step-content">
                        <div className="form-group">
                            <label>Door No / Building / Street Address</label>
                            <div className="input-with-icon">
                                <MapPin size={18} className="field-icon" />
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => updateField('address', e.target.value)}
                                    placeholder="Full street address"
                                />
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Country</label>
                                <div className="input-with-icon">
                                    <Globe size={18} className="field-icon" />
                                    <select
                                        value={formData.countryIso}
                                        onChange={(e) => {
                                            const selectedCountry = Country.getCountryByCode(e.target.value);
                                            setFormData({
                                                ...formData,
                                                countryIso: e.target.value,
                                                country: selectedCountry.name,
                                                state: '',
                                                stateIso: ''
                                            });
                                        }}
                                    >
                                        <option value="">Select Country</option>
                                        {Country.getAllCountries().map(c => (
                                            <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>State</label>
                                <select
                                    value={formData.stateIso}
                                    onChange={(e) => {
                                        const selectedState = states.find(s => s.isoCode === e.target.value);
                                        setFormData({
                                            ...formData,
                                            stateIso: e.target.value,
                                            state: selectedState ? selectedState.name : ''
                                        });
                                    }}
                                >
                                    <option value="">Select State</option>
                                    {states.map(s => (
                                        <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>City</label>
                                <div className="input-with-icon">
                                    <Building2 size={18} className="field-icon" />
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => updateField('city', e.target.value)}
                                        placeholder="City Name"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Pincode</label>
                                <div className="input-with-icon">
                                    <Hash size={18} className="field-icon" />
                                    <input
                                        type="text"
                                        value={formData.pincode}
                                        onChange={(e) => updateField('pincode', e.target.value)}
                                        placeholder="6-digit code"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Geo Location (Coordinates)</label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div className="input-with-icon" style={{ flex: 1 }}>
                                    <MapPin size={16} className="field-icon" />
                                    <input
                                        type="text"
                                        value={formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : ''}
                                        readOnly
                                        placeholder="Latitude / Longitude will appear here"
                                    />
                                    {formData.latitude && formData.longitude && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, latitude: '', longitude: '' }));
                                            }}
                                            style={{
                                                position: 'absolute',
                                                right: '10px',
                                                background: 'none',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                padding: '4px'
                                            }}
                                            title="Clear Location"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ whiteSpace: 'nowrap', height: '44px' }}
                                    onClick={detectLocation}
                                >
                                    Detect My Location
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="vendor-step-content">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Aadhar Number</label>
                                <div className="input-with-icon">
                                    <Hash size={18} className="field-icon" />
                                    <input
                                        type="text"
                                        value={formData.aadharNumber}
                                        onChange={(e) => updateField('aadharNumber', e.target.value)}
                                        placeholder="12 Digit Aadhar Number"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Aadhar Card (Document)</label>
                                <div className="doc-upload-container">
                                    <input type="file" id="aadharDoc" hidden onChange={(e) => handleFileUpload(e, 'aadhar')} accept="image/*,.pdf" />
                                    {formData.aadharDoc ? (
                                        <div className="doc-preview-wrapper" style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '10px',
                                            padding: '8px 12px',
                                            background: '#f8fafc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '12px',
                                            minHeight: '58px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                {(formData.aadharDocFile?.type.includes('image') || (typeof formData.aadharDoc === 'string' && /\.(jpg|jpeg|png|webp|svg)$/i.test(formData.aadharDoc))) ? (
                                                    <img src={formData.aadharDoc} alt="Aadhar" style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '42px', height: '42px', background: '#fee2e2', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <FileText size={20} color="#ef4444" />
                                                    </div>
                                                )}
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Aadhar Card</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button type="button" className="icon-btn-sm" onClick={() => window.open(formData.aadharDoc, '_blank')} title="View">
                                                    <Eye size={14} />
                                                </button>
                                                <label htmlFor="aadharDoc" className="icon-btn-sm" title="Replace" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Upload size={14} />
                                                </label>
                                                <button type="button" className="icon-btn-sm" style={{ color: '#ef4444' }} onClick={() => clearFile('aadhar')} title="Remove">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label htmlFor="aadharDoc" className="upload-label-compact" style={{
                                            border: '1px dashed #cbd5e1',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            cursor: 'pointer',
                                            background: '#f8fafc',
                                            minHeight: '58px',
                                            justifyContent: 'center'
                                        }}>
                                            <Upload size={18} color="#64748b" />
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Upload Aadhar Card</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>PAN Number</label>
                                <div className="input-with-icon">
                                    <Hash size={18} className="field-icon" />
                                    <input
                                        type="text"
                                        value={formData.panNumber}
                                        onChange={(e) => updateField('panNumber', e.target.value)}
                                        placeholder="10 Digit PAN Number"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>PAN Card (Document)</label>
                                <div className="doc-upload-container">
                                    <input type="file" id="panDoc" hidden onChange={(e) => handleFileUpload(e, 'pan')} accept="image/*,.pdf" />
                                    {formData.panDoc ? (
                                        <div className="doc-preview-wrapper" style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '10px',
                                            padding: '8px 12px',
                                            background: '#f8fafc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '12px',
                                            minHeight: '58px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                {(formData.panDocFile?.type.includes('image') || (typeof formData.panDoc === 'string' && /\.(jpg|jpeg|png|webp|svg)$/i.test(formData.panDoc))) ? (
                                                    <img src={formData.panDoc} alt="PAN" style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '42px', height: '42px', background: '#fee2e2', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <FileText size={20} color="#ef4444" />
                                                    </div>
                                                )}
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>PAN Card</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button type="button" className="icon-btn-sm" onClick={() => window.open(formData.panDoc, '_blank')} title="View">
                                                    <Eye size={14} />
                                                </button>
                                                <label htmlFor="panDoc" className="icon-btn-sm" title="Replace" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Upload size={14} />
                                                </label>
                                                <button type="button" className="icon-btn-sm" style={{ color: '#ef4444' }} onClick={() => clearFile('pan')} title="Remove">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label htmlFor="panDoc" className="upload-label-compact" style={{
                                            border: '1px dashed #cbd5e1',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            cursor: 'pointer',
                                            background: '#f8fafc',
                                            minHeight: '58px',
                                            justifyContent: 'center'
                                        }}>
                                            <Upload size={18} color="#64748b" />
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Upload PAN Card</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="vendor-step-content">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Trade License Number</label>
                                <input
                                    type="text"
                                    value={formData.licenseNumber}
                                    onChange={(e) => updateField('licenseNumber', e.target.value)}
                                    placeholder="Enter license ID"
                                />
                            </div>
                            <div className="form-group">
                                <label>Trade License Doc</label>
                                <div className="doc-upload-container">
                                    <input type="file" id="licenseDoc" hidden onChange={(e) => handleFileUpload(e, 'license')} accept="image/*,.pdf" />
                                    {formData.licenseDoc ? (
                                        <div className="doc-preview-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', minHeight: '58px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                {formData.licenseDocFile?.type.includes('image') ? (
                                                    <img src={formData.licenseDoc} alt="License" style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '42px', height: '42px', background: '#fee2e2', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <FileText size={20} color="#ef4444" />
                                                    </div>
                                                )}
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>License</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button type="button" className="icon-btn-sm" onClick={() => window.open(formData.licenseDoc, '_blank')}><Eye size={14} /></button>
                                                <label htmlFor="licenseDoc" className="icon-btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Upload size={14} /></label>
                                                <button type="button" className="icon-btn-sm" style={{ color: '#ef4444' }} onClick={() => clearFile('license')}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label htmlFor="licenseDoc" className="upload-label-compact" style={{ border: '1px dashed #cbd5e1', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#f8fafc', minHeight: '58px', justifyContent: 'center' }}>
                                            <Upload size={18} color="#64748b" />
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Upload License</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>FASSI Code</label>
                                <input
                                    type="text"
                                    value={formData.fassiCode}
                                    onChange={(e) => updateField('fassiCode', e.target.value)}
                                    placeholder="Enter FASSI code"
                                />
                            </div>
                            <div className="form-group">
                                <label>FASSI Document</label>
                                <div className="doc-upload-container">
                                    <input type="file" id="fassiDoc" hidden onChange={(e) => handleFileUpload(e, 'fassi')} accept="image/*,.pdf" />
                                    {formData.fassiDoc ? (
                                        <div className="doc-preview-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', minHeight: '58px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                {formData.fassiDocFile?.type.includes('image') ? (
                                                    <img src={formData.fassiDoc} alt="FASSI" style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '42px', height: '42px', background: '#fee2e2', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <FileText size={20} color="#ef4444" />
                                                    </div>
                                                )}
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>FASSI Doc</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button type="button" className="icon-btn-sm" onClick={() => window.open(formData.fassiDoc, '_blank')}><Eye size={14} /></button>
                                                <label htmlFor="fassiDoc" className="icon-btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Upload size={14} /></label>
                                                <button type="button" className="icon-btn-sm" style={{ color: '#ef4444' }} onClick={() => clearFile('fassi')}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label htmlFor="fassiDoc" className="upload-label-compact" style={{ border: '1px dashed #cbd5e1', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#f8fafc', minHeight: '58px', justifyContent: 'center' }}>
                                            <Upload size={18} color="#64748b" />
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Upload FASSI</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>GST Number</label>
                                <input
                                    type="text"
                                    value={formData.gstNumber}
                                    onChange={(e) => updateField('gstNumber', e.target.value)}
                                    placeholder="Enter GST number"
                                />
                            </div>
                            <div className="form-group">
                                <label>GST Certificate</label>
                                <div className="doc-upload-container">
                                    <input type="file" id="gstDoc" hidden onChange={(e) => handleFileUpload(e, 'gst')} accept="image/*,.pdf" />
                                    {formData.gstDoc ? (
                                        <div className="doc-preview-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', minHeight: '58px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                {formData.gstDocFile?.type.includes('image') ? (
                                                    <img src={formData.gstDoc} alt="GST" style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '42px', height: '42px', background: '#fee2e2', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <FileText size={20} color="#ef4444" />
                                                    </div>
                                                )}
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>GST Cert</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button type="button" className="icon-btn-sm" onClick={() => window.open(formData.gstDoc, '_blank')}><Eye size={14} /></button>
                                                <label htmlFor="gstDoc" className="icon-btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Upload size={14} /></label>
                                                <button type="button" className="icon-btn-sm" style={{ color: '#ef4444' }} onClick={() => clearFile('gst')}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label htmlFor="gstDoc" className="upload-label-compact" style={{ border: '1px dashed #cbd5e1', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#f8fafc', minHeight: '58px', justifyContent: 'center' }}>
                                            <Upload size={18} color="#64748b" />
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Upload GST</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="vendor-step-content">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Bank Name</label>
                                <input
                                    type="text"
                                    value={formData.bankName}
                                    onChange={(e) => updateField('bankName', e.target.value)}
                                    placeholder="e.g. HDFC Bank"
                                />
                            </div>
                            <div className="form-group">
                                <label>Account Holder Name</label>
                                <input
                                    type="text"
                                    value={formData.accountName}
                                    onChange={(e) => updateField('accountName', e.target.value)}
                                    placeholder="Name as per passbook"
                                />
                            </div>
                            <div className="form-group">
                                <label>Account Number</label>
                                <input
                                    type="text"
                                    value={formData.accountNumber}
                                    onChange={(e) => updateField('accountNumber', e.target.value)}
                                    placeholder="Enter account number"
                                />
                            </div>
                            <div className="form-group">
                                <label>IFSC Code</label>
                                <input
                                    type="text"
                                    value={formData.ifsc}
                                    onChange={(e) => updateField('ifsc', e.target.value)}
                                    placeholder="SBIN0001234"
                                />
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="card vendor-form-huge-standard" style={{ padding: 0 }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>{initialData?.id ? 'Edit Vendor' : 'Register New Vendor'}</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                            {initialData?.id ? 'Update existing vendor information' : 'Complete all steps to onboard the partner'}
                        </p>
                    </div>
                    <button className="icon-btn-sm" onClick={onCancel}><X size={20} /></button>
                </div>

                <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                    {steps.map((s) => (
                        <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: step >= s.id ? 1 : 0.4 }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: step > s.id ? '#10b981' : step === s.id ? '#6366f1' : '#cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                {step > s.id ? <Check size={16} /> : <s.icon size={16} />}
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{s.title}</span>
                        </div>
                    ))}
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {renderStep()}
                </div>

                <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => step > 1 && setStep(step - 1)}
                        disabled={step === 1}
                    >
                        <ArrowLeft size={16} /> Previous
                    </button>
                    {step < 5 ? (
                        <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
                            Next Step <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary"
                            disabled={submitting}
                            onClick={async () => {
                                setSubmitting(true);
                                try {
                                    const fd = new FormData();
                                    fd.append('business_name', formData.businessName);
                                    fd.append('owner_name', formData.fullName);
                                    fd.append('email', formData.email);
                                    fd.append('password', formData.password);
                                    fd.append('country_code', formData.countryCode);
                                    fd.append('mobile', formData.mobile);
                                    fd.append('emergency_country_code', formData.emergencyCountryCode || '');
                                    fd.append('emergency_mobile', formData.emergencyMobile || '');
                                    fd.append('business_categories', JSON.stringify(formData.category));
                                    fd.append('tier_id', formData.tier);
                                    fd.append('address', formData.address);
                                    fd.append('country', formData.country);
                                    fd.append('country_iso', formData.countryIso);
                                    fd.append('state', formData.state);
                                    fd.append('state_iso', formData.stateIso);
                                    fd.append('city', formData.city);
                                    fd.append('pincode', formData.pincode);
                                    fd.append('latitude', formData.latitude || '');
                                    fd.append('longitude', formData.longitude || '');
                                    fd.append('aadhar_number', formData.aadharNumber);
                                    fd.append('pan_number', formData.panNumber);
                                    fd.append('license_number', formData.licenseNumber || '');
                                    fd.append('fassi_code', formData.fassiCode || '');
                                    fd.append('gst_number', formData.gstNumber || '');
                                    fd.append('bank_name', formData.bankName);
                                    fd.append('account_name', formData.accountName);
                                    fd.append('account_number', formData.accountNumber);
                                    fd.append('ifsc', formData.ifsc);
                                    fd.append('total_turnover', formData.expectedTurnover || 0);
                                    if (formData.photoFile) fd.append('profile_photo', formData.photoFile);
                                    if (formData.aadharDocFile) fd.append('aadhar_doc', formData.aadharDocFile);
                                    if (formData.panDocFile) fd.append('pan_doc', formData.panDocFile);
                                    if (formData.licenseDocFile) fd.append('license_doc', formData.licenseDocFile);
                                    if (formData.fassiDocFile) fd.append('fassi_doc', formData.fassiDocFile);
                                    if (formData.gstDocFile) fd.append('gst_doc', formData.gstDocFile);

                                    if (initialData?.id) {
                                        await updateVendorApi(initialData.id, fd);
                                    } else {
                                        await createVendorApi(fd);
                                    }
                                    onSave?.(formData);
                                } catch (err) {
                                    alert(err?.response?.data?.message || 'Failed to save vendor. Please check all fields.');
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none' }}
                        >
                            {submitting ? 'Saving...' : initialData?.id ? 'Update Vendor' : 'Finish Registration'}
                            {!submitting && <Check size={16} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorForm;
