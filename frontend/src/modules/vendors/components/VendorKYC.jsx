import React, { useState } from 'react';
import {
    FileText,
    CheckCircle,
    XCircle,
    Eye,
    ShieldCheck,
    Download,
    AlertCircle,
    Search,
    User,
    MapPin,
    CreditCard,
    Loader,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { getVendorsApi, updateVendorKycStatusApi } from '../../../api/vendor.api';
import { useCallback, useEffect } from 'react';

const VendorKYC = ({ showToast }) => {
    const [kycRequests, setKycRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Accordion State
    const [openSections, setOpenSections] = useState({
        business: true,
        commercial: true,
        location: true,
        bank: true,
        docs: true
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const fetchKycRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getVendorsApi({ fetchAll: true });
            if (res.data.success) {
                setKycRequests(res.data.data.records);
                // Also update selected request if it exists to keep it in sync
                if (selectedRequest) {
                    const updated = res.data.data.records.find(r => r.id === selectedRequest.id);
                    if (updated) setSelectedRequest(updated);
                }
            }
        } catch (err) {
            showToast?.('Failed to load KYC requests', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedRequest, showToast]);

    useEffect(() => {
        fetchKycRequests();
    }, []);

    const filteredRequests = React.useMemo(() => {
        return kycRequests.filter(req => {
            const matchesSearch =
                (req.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (req.vendor_code || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'All' || req.kyc_status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [kycRequests, searchQuery, statusFilter]);

    const handleApprove = async (id) => {
        try {
            const res = await updateVendorKycStatusApi(id, { kyc_status: 'Approved' });
            if (res.data.success) {
                showToast(`KYC for ${selectedRequest.business_name} approved successfully!`, 'success');
                fetchKycRequests();
            }
        } catch (err) {
            showToast?.('Failed to approve KYC', 'error');
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Enter rejection reason:');
        if (reason) {
            try {
                const res = await updateVendorKycStatusApi(id, { 
                    kyc_status: 'Rejected', 
                    kyc_reject_reason: reason 
                });
                if (res.data.success) {
                    showToast(`KYC for ${selectedRequest.business_name} rejected.`, 'error');
                    fetchKycRequests();
                }
            } catch (err) {
                showToast?.('Failed to reject KYC', 'error');
            }
        }
    };

    const statusStyle = {
        Pending: { bg: '#fffbeb', color: '#b45309', label: 'PENDING' },
        Approved: { bg: '#f0fdf4', color: '#16a34a', label: 'APPROVED' },
        Rejected: { bg: '#fef2f2', color: '#dc2626', label: 'REJECTED' },
    };

    const pendingCount = kycRequests.filter(r => r.status === 'Pending').length;

    return (
        <div className="kyc-container">
            <div className="kyc-verification-grid">

                {/* ── LEFT PANEL ── */}
                <div className="kyc-list-card">
                    {/* Card Header */}
                    <div style={{ padding: '20px 20px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>Verification Requests</h3>
                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>{kycRequests.length} total applications</p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
                            <div className="filter-search" style={{ flex: '1 1 120px' }}>
                                <Search className="search-icon" size={14} />
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ height: '34px', fontSize: '12px' }}
                                />
                            </div>
                            <select
                                className="filter-select"
                                style={{ width: '90px', fontSize: '11px', height: '34px', padding: '0 8px', flexShrink: 0 }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {/* Request List */}
                    <div className="kyc-list-scroll">
                        {loading && kycRequests.length === 0 ? (
                            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                                <Loader className="spin" size={32} style={{ marginBottom: '12px' }} />
                                <p style={{ fontSize: '13px', margin: 0 }}>Fetching requests...</p>
                            </div>
                        ) : filteredRequests.length > 0 ? filteredRequests.map((request) => {
                            const currentStatus = request.kyc_status || 'Pending';
                            const s = statusStyle[currentStatus] || {};
                            return (
                                <div
                                    key={request.id}
                                    className={`kyc-list-item ${selectedRequest?.id === request.id ? 'active' : ''}`}
                                    onClick={() => setSelectedRequest(request)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {/* Avatar */}
                                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: '1.5px solid #e2e8f0' }}>
                                            <img
                                                src={request.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.business_name}`}
                                                alt={request.business_name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {request.business_name}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                                {request.vendor_code} · {new Date(request.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <span className={`status-badge ${currentStatus === 'Approved' ? 'status-approved' :
                                            currentStatus === 'Rejected' ? 'status-blocked' :
                                                'status-pending'
                                            }`} style={{ fontSize: '9px', padding: '2px 8px', flexShrink: 0, minWidth: '65px', textAlign: 'center' }}>
                                            {currentStatus.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                                <AlertCircle size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                                <p style={{ fontSize: '13px', margin: 0 }}>No matching requests found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="kyc-details-panel">
                    {selectedRequest ? (
                        <div className="kyc-details-card">
                            {/* Details Header */}
                            <div className="kyc-details-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', overflow: 'hidden', border: '2px solid #e2e8f0', flexShrink: 0 }}>
                                        <img
                                            src={selectedRequest.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedRequest.business_name}`}
                                            alt={selectedRequest.business_name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>
                                            {selectedRequest.business_name}
                                        </h3>
                                        <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                                            <span>ID: {selectedRequest.vendor_code}</span>
                                            <span>·</span>
                                            <span>Tier: {selectedRequest.tier_name || 'Standard'}</span>
                                            <span>·</span>
                                            <span>Joined: {new Date(selectedRequest.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <span style={{
                                        background: statusStyle[selectedRequest.kyc_status]?.bg || '#f1f5f9',
                                        color: statusStyle[selectedRequest.kyc_status]?.color || '#475569',
                                        padding: '6px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '12px'
                                    }}>
                                        {(selectedRequest.kyc_status || 'Pending').toUpperCase()}
                                    </span>
                                </div>
                                {/* Business Categories Chips */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px', paddingLeft: '68px' }}>
                                    {(() => {
                                        let cats = selectedRequest.business_categories;
                                        if (typeof cats === 'string') {
                                            try { cats = JSON.parse(cats); } catch { cats = [cats]; }
                                        }
                                        if (!Array.isArray(cats)) return null;
                                        return cats.map((cat, i) => (
                                            <span key={i} style={{
                                                background: '#f1f5f9',
                                                color: '#475569',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                letterSpacing: '0.02em'
                                            }}>
                                                {cat.toUpperCase()}
                                            </span>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Details Body */}
                            <div className="kyc-details-body">

                                {/* Section: Business & Contact */}
                                <div className="kyc-section">
                                    <h4 className="kyc-section-header" onClick={() => toggleSection('business')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>
                                            <User size={15} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle', color: '#6366f1' }} />
                                            Business & Contact Information
                                        </span>
                                        {openSections.business ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </h4>
                                    {openSections.business && (
                                        <div className="kyc-info-grid">
                                            {[
                                                { label: 'Business Name', value: selectedRequest.business_name },
                                                { label: 'Owner Name', value: selectedRequest.owner_name },
                                                { label: 'Email Address', value: selectedRequest.email },
                                                { label: 'Contact Number', value: `${selectedRequest.country_code || ''} ${selectedRequest.mobile || ''}` },
                                                { label: 'Emergency Number', value: `${selectedRequest.emergency_country_code || ''} ${selectedRequest.emergency_mobile || ''}` },
                                            ].map((item, i) => (
                                                <div key={i} className="kyc-info-item">
                                                    <label>{item.label}</label>
                                                    <div className="kyc-info-value">{item.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Section: Commercial Details */}
                                <div className="kyc-section">
                                    <h4 className="kyc-section-header" onClick={() => toggleSection('commercial')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>
                                            <AlertCircle size={15} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle', color: '#6366f1' }} />
                                            Commercial & Tier Details
                                        </span>
                                        {openSections.commercial ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </h4>
                                    {openSections.commercial && (
                                        <div className="kyc-info-grid">
                                            {[
                                                { label: 'Current Tier', value: selectedRequest.tier_name || 'Standard' },
                                                { label: 'Commission Rate', value: `${selectedRequest.commission_percent || '0.00'}%` },
                                                { label: 'Total Turnover (₹)', value: selectedRequest.total_turnover || '0.00' },
                                                { label: 'Account Created', value: new Date(selectedRequest.created_at).toLocaleDateString() },
                                            ].map((item, i) => (
                                                <div key={i} className="kyc-info-item">
                                                    <label>{item.label}</label>
                                                    <div className="kyc-info-value" style={{ color: item.label.includes('Turnover') ? '#10b981' : '#1e293b', fontWeight: 800 }}>
                                                        {item.value || 'N/A'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Section: Location */}
                                <div className="kyc-section">
                                    <h4 className="kyc-section-header" onClick={() => toggleSection('location')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>
                                            <MapPin size={15} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle', color: '#6366f1' }} />
                                            Location Details
                                        </span>
                                        {openSections.location ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </h4>
                                    {openSections.location && (
                                        <div className="kyc-info-grid">
                                            <div className="kyc-info-item span-2">
                                                <label>Street Address</label>
                                                <div className="kyc-info-value">{selectedRequest.address}</div>
                                            </div>
                                            <div className="kyc-info-item">
                                                <label>City / State</label>
                                                <div className="kyc-info-value">{selectedRequest.city}, {selectedRequest.state}</div>
                                            </div>
                                            <div className="kyc-info-item">
                                                <label>Country / Pincode</label>
                                                <div className="kyc-info-value">{selectedRequest.country} — {selectedRequest.pincode}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section: Bank */}
                                <div className="kyc-section">
                                    <h4 className="kyc-section-header" onClick={() => toggleSection('bank')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>
                                            <CreditCard size={15} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle', color: '#6366f1' }} />
                                            Bank Information
                                        </span>
                                        {openSections.bank ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </h4>
                                    {openSections.bank && (
                                        <div className="kyc-info-grid">
                                            {[
                                                { label: 'Bank Name', value: selectedRequest.bank_name },
                                                { label: 'Account Holder', value: selectedRequest.account_name },
                                                { label: 'Account Number', value: selectedRequest.account_number },
                                                { label: 'IFSC Code', value: selectedRequest.ifsc },
                                            ].map((item, i) => (
                                                <div key={i} className="kyc-info-item">
                                                    <label>{item.label}</label>
                                                    <div className="kyc-info-value">{item.value || 'N/A'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Section: Documents */}
                                <div className="kyc-section">
                                    <h4 className="kyc-section-header" onClick={() => toggleSection('docs')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>
                                            <FileText size={15} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle', color: '#6366f1' }} />
                                            Submitted Documents
                                        </span>
                                        {openSections.docs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </h4>
                                    {openSections.docs && (
                                        <div className="kyc-docs-list">
                                            {(selectedRequest.files || []).map((doc, idx) => {
                                                return (
                                                    <div key={idx} className="doc-card">
                                                        <div className="doc-info">
                                                            <div className="doc-icon-box">
                                                                <FileText size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="doc-type">{doc.file_type.replace('_', ' ').toUpperCase()}</div>
                                                                <div className="doc-meta">ID: {selectedRequest.aadhar_number || selectedRequest.pan_number || 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div className="doc-actions">
                                                                <button className="icon-btn-sm" title="View Document" onClick={() => window.open(doc.file_url, '_blank')}>
                                                                    <Eye size={15} />
                                                                </button>
                                                                <button
                                                                    className="icon-btn-sm"
                                                                    title="Download Document"
                                                                    onClick={async () => {
                                                                        try {
                                                                            const response = await fetch(doc.file_url);
                                                                            const blob = await response.blob();
                                                                            const url = window.URL.createObjectURL(blob);
                                                                            const link = document.createElement('a');
                                                                            link.href = url;
                                                                            const filename = doc.file_url.split('/').pop() || `${doc.file_type}.dat`;
                                                                            link.setAttribute('download', filename);
                                                                            document.body.appendChild(link);
                                                                            link.click();
                                                                            link.remove();
                                                                        } catch (err) {
                                                                            showToast?.('Download failed. Opening in new tab instead.', 'info');
                                                                            window.open(doc.file_url, '_blank');
                                                                        }
                                                                    }}
                                                                >
                                                                    <Download size={15} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {(!selectedRequest.files || selectedRequest.files.length === 0) && (
                                                <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No documents uploaded yet.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Rejection Notice */}
                                    {selectedRequest.kyc_reject_reason && openSections.docs && (
                                        <div className="rejection-notice">
                                            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <div>
                                                <div className="rejection-title">Current/Previous Rejection Reason</div>
                                                <div className="rejection-text">{selectedRequest.kyc_reject_reason}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions - Always Allow Changes */}
                            <div className="kyc-footer">
                                <button className="kyc-btn-approve" onClick={() => handleApprove(selectedRequest.id)}>
                                    <CheckCircle size={17} /> {selectedRequest.kyc_status === 'Approved' ? 'Re-Approve' : 'Approve KYC'}
                                </button>
                                <button className="kyc-btn-reject" onClick={() => handleReject(selectedRequest.id)}>
                                    <XCircle size={17} /> {selectedRequest.kyc_status === 'Rejected' ? 'Update Rejection' : 'Reject'}
                                </button>
                            </div>

                            {selectedRequest.kyc_status !== 'Pending' && selectedRequest.kyc_status && (
                                <div className={`kyc-status-banner ${selectedRequest.kyc_status === 'Approved' ? 'banner-approved' : 'banner-rejected'}`}>
                                    {selectedRequest.kyc_status === 'Approved'
                                        ? <ShieldCheck size={20} />
                                        : <XCircle size={20} />}
                                    This verification is currently {selectedRequest.kyc_status}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="kyc-empty-state">
                            <div className="kyc-empty-icon">
                                <ShieldCheck size={36} />
                            </div>
                            <h3 style={{ margin: '0 0 8px', fontWeight: 800, color: '#1e293b' }}>Select a Request</h3>
                            <p style={{ maxWidth: '280px', lineHeight: 1.6, margin: 0, fontSize: '14px' }}>
                                Select a vendor from the list to review their KYC documents and verify registration.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorKYC;
