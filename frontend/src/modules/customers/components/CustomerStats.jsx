import React from 'react';
import { Users, UserPlus, UserCheck, UserX, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const CustomerStats = ({ stats }) => {
    const statCards = [
        {
            title: 'Total Customers',
            value: stats.total,
            trend: '+5%',
            icon: Users,
            class: 'primary',
            subText: 'Overall user base'
        },
        {
            title: 'Active Members',
            value: stats.active,
            trend: '+12%',
            icon: UserCheck,
            class: 'success',
            subText: 'Verified accounts'
        },
        {
            title: 'New Onboarded',
            value: stats.new,
            trend: '+2',
            icon: UserPlus,
            class: 'warning',
            subText: 'Last 7 days'
        },
        {
            title: 'Requires Attention',
            value: stats.inactive,
            trend: '-1',
            icon: UserX,
            class: 'error',
            subText: 'Blocked/Inactive'
        }
    ];

    return (
        <div className="customer-stats-panel">
            {statCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <div key={idx} className="stat-cust-card">
                        <div className={`stat-cust-icon ${card.class}`}>
                            <Icon size={24} />
                        </div>
                        <div className="stat-cust-info">
                            <p>{card.title}</p>
                            <div className="cust-stat-value-row">
                                <h3>{card.value}</h3>
                                {card.trend && (
                                    <span className={`cust-stat-trend ${card.trend.startsWith('+') ? 'success' : 'error'}`}>
                                        {card.trend}
                                        {card.trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    </span>
                                )}
                            </div>
                            <p className="stat-cust-subtext">{card.subText}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CustomerStats;
