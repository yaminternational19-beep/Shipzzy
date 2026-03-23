import React, { useState } from 'react';
import {
    Award,
    Plus,
    Users,
    ShieldCheck,
    History
} from 'lucide-react';

import VendorStats from './components/VendorStats';
import VendorList from './components/VendorList';
import VendorForm from './components/VendorForm';
import VendorTiering from './components/VendorTiering';
import VendorKYC from './components/VendorKYC';
import VendorLogs from './components/VendorLogs';
import Toast from '../../components/common/Toast/Toast';

import './Vendors.css';

const VendorManagement = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [showForm, setShowForm] = useState(false);
    const [showTierModal, setShowTierModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(Date.now());
    const [editingVendor, setEditingVendor] = useState(null);
    const [vendorStats, setVendorStats] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleEditVendor = (vendor) => {
        setEditingVendor(vendor);
        setShowForm(true);
    };

    const handleSaveVendor = (data) => {
        setShowForm(false);
        setEditingVendor(null);
        setRefreshKey(Date.now()); // Trigger refresh
        const vendorName = data.businessName || 'Vendor';
        showToast(`${vendorName} ${editingVendor ? 'updated' : 'registered'} successfully!`, 'success');
    };

    const handleDeleteVendor = (vendor) => {
        showToast(`${vendor.business_name} has been deleted.`, 'success');
        setRefreshKey(Date.now()); // Also refresh on delete
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <VendorList
                        key={refreshKey}
                        onEdit={handleEditVendor}
                        onDelete={handleDeleteVendor}
                        showToast={showToast}
                        onTabChange={setActiveTab}
                        onStatsUpdate={setVendorStats}
                    />
                );
            case 'tiering':
                return (
                    <VendorTiering 
                        showExternalModal={showTierModal} 
                        onModalClose={() => setShowTierModal(false)} 
                    />
                );
            case 'kyc':
                return <VendorKYC showToast={showToast} />;
            case 'logs':
                return <VendorLogs showToast={showToast} />;
            default:
                return null;
        }
    };

    return (
        <div className="v-module management-module" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Toast Notification - Floating at Right Top */}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}

            {/* Page Header */}
            <div className="module-intro">
                <div className="intro-content">
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Vendor Management</h1>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>Manage platform partners, onboarding, and kyc verification</p>
                </div>
                {!showForm && (activeTab === 'overview' || activeTab === 'tiering') && (
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            if (activeTab === 'overview') {
                                setEditingVendor(null);
                                setShowForm(true);
                            } else {
                                setShowTierModal(true);
                            }
                        }}
                    >
                        <Plus size={18} /> {activeTab === 'overview' ? 'Add New Vendor' : 'Add New Tier'}
                    </button>
                )}
            </div>

            {!showForm && (
                <>
                    <VendorStats stats={vendorStats} />

                    {/* Tabs */}
                    <div className="tab-group-pills">
                        <button
                            className={activeTab === 'overview' ? 'active' : ''}
                            onClick={() => setActiveTab('overview')}
                        >
                            <Users size={16} /> Overview
                        </button>
                        <button
                            className={activeTab === 'kyc' ? 'active' : ''}
                            onClick={() => setActiveTab('kyc')}
                        >
                            <ShieldCheck size={16} /> KYC Verification
                        </button>
                        <button
                            className={activeTab === 'tiering' ? 'active' : ''}
                            onClick={() => setActiveTab('tiering')}
                        >
                            <Award size={16} /> Tier Management
                        </button>
                        <button
                            className={activeTab === 'logs' ? 'active' : ''}
                            onClick={() => setActiveTab('logs')}
                        >
                            <History size={16} /> Activity Logs
                        </button>
                    </div>
                </>
            )}


            <div className="content-container">
                {renderContent()}
            </div>

            {showForm && (
                <VendorForm
                    initialData={editingVendor}
                    onCancel={() => { setShowForm(false); setEditingVendor(null); }}
                    onSave={handleSaveVendor}
                />
            )}
        </div>
    );
};

export default VendorManagement;
