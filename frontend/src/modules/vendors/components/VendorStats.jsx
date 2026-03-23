import React from 'react';
import { Users, TrendingUp, FileText, ShieldCheck } from 'lucide-react';

const VendorStats = ({ stats }) => {
    const totalVendors = stats?.totalVendors ?? 0;
    const activeVendors = stats?.activeVendors ?? 0;
    const inactiveVendors = stats?.inactiveVendors ?? 0;
    const kycPending = stats?.kycStats?.pending ?? 0;
    const kycApproved = stats?.kycStats?.approved ?? 0;

    const kycRate = totalVendors > 0
        ? Math.round((kycApproved / totalVendors) * 100)
        : 0;

    const statCards = [
        {
            title: 'Total Vendors',
            value: totalVendors,
            trend: `+${activeVendors} active`,
            icon: Users,
            color: '#6366f1',
            subText: `${inactiveVendors} inactive`
        },
        {
            title: 'Active Vendors',
            value: activeVendors,
            trend: totalVendors > 0 ? `${Math.round((activeVendors / totalVendors) * 100)}%` : '0%',
            icon: TrendingUp,
            color: '#10b981',
            subText: 'Of total vendors'
        },
        {
            title: 'KYC Pending',
            value: kycPending,
            trend: kycPending > 0 ? `${kycPending} waiting` : 'All clear',
            icon: FileText,
            color: '#f59e0b',
            subText: 'Awaiting review'
        },
        {
            title: 'KYC Approved',
            value: `${kycRate}%`,
            trend: `${kycApproved} verified`,
            icon: ShieldCheck,
            color: '#06b6d4',
            subText: 'Verification rate'
        }
    ];

    return (
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {statCards.map((stat, idx) => {
                const Icon = stat.icon;
                const isPositive = !stat.trend.startsWith('-');
                return (
                    <div key={idx} className="stat-card" style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                    }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '14px',
                            background: `${stat.color}15`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: stat.color
                        }}>
                            <Icon size={28} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>{stat.title}</span>
                                <span style={{
                                    fontSize: '0.75rem', fontWeight: 700,
                                    color: isPositive ? '#10b981' : '#ef4444',
                                    background: isPositive ? '#ecfdf5' : '#fef2f2',
                                    padding: '2px 6px', borderRadius: '6px'
                                }}>
                                    {stat.trend}
                                </span>
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{stat.subText}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default VendorStats;
