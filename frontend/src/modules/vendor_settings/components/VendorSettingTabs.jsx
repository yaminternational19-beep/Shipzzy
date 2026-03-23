import React from 'react';
import { PlusCircle, History, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VendorSettingTabs = ({ activeTab }) => {
    const navigate = useNavigate();
    
    const tabs = [
        { 
            id: 'raise-query', 
            label: 'Raise New Query', 
            icon: <PlusCircle size={16} />, 
            path: '/vendor/help-support/raise-query' 
        },
        { 
            id: 'history', 
            label: 'Ticket History', 
            icon: <History size={16} />, 
            path: '/vendor/help-support/history' 
        },
        { 
            id: 'faq', 
            label: 'Common FAQs', 
            icon: <HelpCircle size={16} />, 
            path: '/vendor/help-support/faq' 
        },
    ];

    return (
        <div className="tab-group-pills">
            {tabs.map(tab => (
                <button 
                    key={tab.id}
                    className={activeTab === tab.id ? 'active' : ''}
                    onClick={() => navigate(tab.path)}
                >
                    {tab.icon}
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

export default VendorSettingTabs;
