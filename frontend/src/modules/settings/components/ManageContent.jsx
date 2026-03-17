import React, { useState } from 'react';
import { Edit2, X, Save, FileText, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';

const ManageContent = ({ onShowToast }) => {
    // Initial content
    const [formData, setFormData] = useState({
        aboutUs: 'Shipzzy is your reliable delivery partner ensuring fast and safe deliveries across the country.',
        termsConditions: 'By using this app, you agree to our standard terms and conditions. Delivery times are estimated.',
        privacyPolicy: 'We value your privacy. Your data is encrypted and never shared with third parties.',
        androidAppUrl: 'https://play.google.com/store/apps/details?id=com.shipzzy',
        iosAppUrl: 'https://apps.apple.com/us/app/shipzzy/id123456789',
        websiteUrl: 'https://www.shipzzy.com'
    });

    // Dynamic sections state
    const [sections, setSections] = useState([
        { key: 'aboutUs', title: 'About Us', type: 'textarea', icon: FileText, placeholder: 'Enter the About Us text...', deletable: false },
        { key: 'termsConditions', title: 'Terms and Conditions', type: 'textarea', icon: FileText, placeholder: 'Enter terms and conditions...', deletable: false },
        { key: 'privacyPolicy', title: 'Privacy Policy', type: 'textarea', icon: FileText, placeholder: 'Enter privacy policy...', deletable: false },
        { key: 'androidAppUrl', title: 'Android App URL', type: 'url', icon: LinkIcon, placeholder: 'https://play.google.com/...', deletable: false },
        { key: 'iosAppUrl', title: 'iOS App URL', type: 'url', icon: LinkIcon, placeholder: 'https://apps.apple.com/...', deletable: false },
        { key: 'websiteUrl', title: 'Website URL', type: 'url', icon: LinkIcon, placeholder: 'https://www.example.com', deletable: false },
    ]);

    const [activeSection, setActiveSection] = useState(sections[0]);
    const [editValue, setEditValue] = useState(formData[sections[0].key]);
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [newPageTitle, setNewPageTitle] = useState('');

    const handleTabClick = (section) => {
        setActiveSection(section);
        setEditValue(formData[section.key] || '');
    };

    const handleSave = () => {
        if (activeSection) {
            setFormData(prev => ({ ...prev, [activeSection.key]: editValue }));
            onShowToast(`${activeSection.title} updated successfully!`, 'success');
        }
    };

    const handleCreatePage = () => {
        if (!newPageTitle.trim()) {
            onShowToast('Please enter a page title', 'warning');
            return;
        }

        // CamelCase key generation for internal mapping
        const newKey = newPageTitle
            .toLowerCase()
            .split(' ')
            .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
            .join('');

        if (formData[newKey]) {
            onShowToast('A page with this name already exists', 'warning');
            return;
        }

        const newSection = {
            key: newKey,
            title: newPageTitle,
            type: 'textarea',
            icon: FileText,
            placeholder: `Enter ${newPageTitle} content...`,
            deletable: true
        };

        setSections(prev => [...prev, newSection]);
        setFormData(prev => ({ ...prev, [newKey]: '' }));
        
        onShowToast(`Page "${newPageTitle}" created`, 'success');
        setNewPageTitle('');
        setShowModal(false);
        
        // Switch to new page
        setActiveSection(newSection);
        setEditValue('');
    };

    const handleDeletePage = (e, targetSection) => {
        e.stopPropagation(); // Don't trigger tab click
        
        if (window.confirm(`Are you sure you want to delete the "${targetSection.title}" page?`)) {
            const updatedSections = sections.filter(s => s.key !== targetSection.key);
            setSections(updatedSections);
            
            // Clean up data
            const newFormData = { ...formData };
            delete newFormData[targetSection.key];
            setFormData(newFormData);

            // If we deleted the active section, move to first section
            if (activeSection.key === targetSection.key) {
                const firstSection = updatedSections[0];
                setActiveSection(firstSection);
                setEditValue(newFormData[firstSection.key] || '');
            }
            
            onShowToast(`Page "${targetSection.title}" deleted`, 'info');
        }
    };

    return (
        <div className="settings-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div className="tab-group-pills" style={{ margin: 0, flexWrap: 'wrap', width: 'fit-content', maxWidth: 'calc(100% - 160px)' }}>
                    {sections.map(section => {
                        const Icon = section.icon;
                        return (
                            <button 
                                key={section.key} 
                                className={activeSection.key === section.key ? 'active' : ''}
                                onClick={() => handleTabClick(section)}
                                style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', paddingRight: section.deletable ? '32px' : '12px', marginBottom: '4px' }}
                            >
                                <Icon size={14} />
                                {section.title}
                                {section.deletable && (
                                    <span 
                                        onClick={(e) => handleDeletePage(e, section)}
                                        style={{ position: 'absolute', right: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'color 0.2s' }}
                                        title="Delete Page"
                                        onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                                        onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
                                    >
                                        <Trash2 size={12} />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => setShowModal(true)}
                    style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                    <Plus size={16} /> Add Page
                </button>
            </div>

            {/* Modal Popup */}
            {showModal && (
                <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                    onClick={() => setShowModal(false)}
                >
                    <div 
                        style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px rgba(0,0,0,0.1)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Create New Content Page</h3>
                            <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20}/></button>
                        </div>
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>Page Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Help Center or Legal Notice"
                                value={newPageTitle}
                                onChange={(e) => setNewPageTitle(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                autoFocus
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => setShowModal(false)}
                                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleCreatePage}
                                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Create Page
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Inline Editor Area */}
            {activeSection && (
                <div style={{ marginTop: '24px', animation: 'fadeIn 0.3s ease' }}>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>
                            {activeSection.title}
                        </label>
                        {activeSection.type === 'textarea' ? (
                            <textarea 
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder={activeSection.placeholder}
                                style={{ 
                                    width: '100%', 
                                    minHeight: '250px', 
                                    padding: '16px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #cbd5e1', 
                                    resize: 'vertical', 
                                    fontFamily: 'inherit', 
                                    fontSize: '14px',
                                    lineHeight: '1.6'
                                }}
                            />
                        ) : (
                            <input 
                                type="url"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder={activeSection.placeholder}
                                style={{ 
                                    width: '100%', 
                                    padding: '12px 16px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #cbd5e1', 
                                    fontFamily: 'inherit', 
                                    fontSize: '14px'
                                }}
                            />
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <button 
                            className="btn btn-primary" 
                            onClick={handleSave}
                            style={{ padding: '8px 24px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageContent;
