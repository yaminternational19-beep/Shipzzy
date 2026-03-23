import React, { useState, useEffect } from 'react';
import { Award, Star, Zap, Shield, Check, Info, X, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import Toast from '../../../components/common/Toast/Toast';
import { getTiersApi, updateTierApi, createTierApi, deleteTierApi } from '../../../api/tier.api.js';

const iconMap = {
    'platinum': Zap,
    'gold': Award,
    'silver': Shield,
    'bronze': Star
};

const VendorTiering = ({ showExternalModal, onModalClose }) => {
    const [tiers, setTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTier, setEditingTier] = useState(null);
    const [formData, setFormData] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        fetchTiers();
    }, []);

    // Synchronize with external modal trigger from parent (VendorsPage header)
    useEffect(() => {
        if (showExternalModal) {
            handleAddTier();
        }
    }, [showExternalModal]);

    const fetchTiers = async () => {
        try {
            setLoading(true);
            const response = await getTiersApi();
            if (response.data.success) {
                // Map backend data to frontend structure
                const mappedTiers = response.data.data.map(tier => ({
                    id: tier.id,
                    tier_key: tier.tier_key,
                    name: tier.tier_name,
                    icon: iconMap[tier.tier_key] || Star,
                    color: tier.color_code || '#475569',
                    badge: tier.badge_color || '#f1f5f9',
                    threshold: tier.threshold_text || 'No threshold set',
                    benefits: Array.isArray(tier.features) ? tier.features : JSON.parse(tier.features || '[]'),
                    count: 0,
                    ...tier
                }));
                setTiers(mappedTiers);
            }
        } catch (error) {
            console.error("Failed to fetch tiers:", error);
            setToast({ show: true, message: 'Failed to load tiers', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddTier = () => {
        setEditingTier(null);
        setFormData({
            tier_key: '',
            name: '',
            tier_order: tiers.length + 1,
            threshold: '',
            min_turnover: 0,
            commission_percent: 0,
            payment_cycle: 'Monthly',
            priority_listing: false,
            color: '#4f46e5',
            badge: '#e0e7ff',
            benefits: ['Standard support', 'Regular commission (20%)']
        });
        setIsModalOpen(true);
    };

    const handleEdit = (tier) => {
        setEditingTier(tier.id);
        setFormData({ ...tier });
        setIsModalOpen(true);
    };

    const handleDelete = async (tier) => {
        if (!window.confirm(`Are you sure you want to delete the ${tier.name}? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await deleteTierApi(tier.id);
            if (response.data.success) {
                setToast({ show: true, message: `${tier.name} deleted successfully!`, type: 'success' });
                fetchTiers();
            }
        } catch (error) {
            console.error("Failed to delete tier:", error);
            setToast({ show: true, message: 'Failed to delete tier', type: 'error' });
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        if (onModalClose) onModalClose();
    };

    const handleSave = async () => {
        if (!formData.name) {
            setToast({ show: true, message: 'Tier name is required', type: 'error' });
            return;
        }

        try {
            const payload = {
                tier_key: formData.tier_key || formData.name.toLowerCase().replace(/\s+/g, '_'),
                tier_name: formData.name,
                tier_order: Number(formData.tier_order) || 0,
                threshold_text: formData.threshold,
                min_turnover: Number(formData.min_turnover) || 0,
                commission_percent: Number(formData.commission_percent) || 0,
                payment_cycle: formData.payment_cycle,
                priority_listing: Boolean(formData.priority_listing),
                color_code: formData.color,
                badge_color: formData.badge,
                features: formData.benefits
            };

            let response;
            if (editingTier) {
                response = await updateTierApi(editingTier, payload);
            } else {
                response = await createTierApi(payload);
            }

            if (response.data.success) {
                setToast({ 
                    show: true, 
                    message: `${formData.name} ${editingTier ? 'updated' : 'created'} successfully!`, 
                    type: 'success' 
                });
                handleCloseModal();
                setEditingTier(null);
                fetchTiers();
            }
        } catch (error) {
            console.error("Failed to save tier:", error);
            const errorMsg = error.response?.data?.message || 'Failed to save tier';
            setToast({ show: true, message: errorMsg, type: 'error' });
        }
    };

    const handleBenefitChange = (index, value) => {
        const newBenefits = [...formData.benefits];
        newBenefits[index] = value;
        setFormData({ ...formData, benefits: newBenefits });
    };

    const addBenefit = () => {
        setFormData({ ...formData, benefits: [...formData.benefits, 'New Benefit'] });
    };

    const removeBenefit = (index) => {
        const newBenefits = formData.benefits.filter((_, i) => i !== index);
        setFormData({ ...formData, benefits: newBenefits });
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <Loader2 className="animate-spin" size={48} color="#4f46e5" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="tier-grid">
                {tiers.map((tier) => (
                    <div key={tier.id} className={`tier-card ${tier.tier_key}`}>
                        {/* Delete Button */}
                        <button 
                            className="icon-btn" 
                            style={{ position: 'absolute', top: '16px', right: '16px', color: '#ef4444', border: 'none', background: 'transparent' }}
                            onClick={() => handleDelete(tier)}
                        >
                            <Trash2 size={18} />
                        </button>

                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: tier.badge,
                            color: tier.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <tier.icon size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', margin: '0 0 20px 0', color: tier.color }}>{tier.name}</h2>

                        <div style={{ marginTop: '24px', textAlign: 'left', background: 'rgba(255,255,255,0.5)', padding: '20px', borderRadius: '12px', minHeight: '180px' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Info size={14} /> ELIGIBILITY: {tier.threshold}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {tier.benefits.map((benefit, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Check size={12} />
                                        </div>
                                        {benefit}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '24px', background: tier.color, border: 'none', justifyContent: 'center' }}
                            onClick={() => handleEdit(tier)}
                        >
                            Manage Tier Settings
                        </button>
                    </div>
                ))}
            </div>


            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '500px', padding: '0', overflow: 'hidden' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>{editingTier ? `Edit ${formData.name}` : 'Add New Tier'}</h3>
                            <button className="icon-btn-sm" onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="form-group">
                                <label>Tier Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Platinum, Gold..."
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            
                            {!editingTier && (
                                <div className="form-group">
                                    <label>Unique Tier Key</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. platinum_level"
                                        value={formData.tier_key}
                                        onChange={(e) => setFormData({ ...formData, tier_key: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Eligibility Threshold</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Turnover > $10k / Month"
                                    value={formData.threshold}
                                    onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label>Brand Color</label>
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        style={{ height: '40px', padding: '4px' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Badge Color</label>
                                    <input
                                        type="color"
                                        value={formData.badge}
                                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                        style={{ height: '40px', padding: '4px' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    Benefits
                                    <button
                                        className="icon-btn-plain"
                                        onClick={addBenefit}
                                        style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 600 }}
                                    >
                                        + Add Benefit
                                    </button>
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {formData.benefits.map((benefit, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="text"
                                                value={benefit}
                                                onChange={(e) => handleBenefitChange(i, e.target.value)}
                                            />
                                            <button
                                                className="icon-btn"
                                                style={{ color: '#ef4444' }}
                                                onClick={() => removeBenefit(i)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                <Save size={16} /> {editingTier ? 'Save Changes' : 'Create Tier'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
};

export default VendorTiering;
