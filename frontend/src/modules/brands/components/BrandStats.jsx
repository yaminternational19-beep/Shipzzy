import React from 'react';
import { Award, CheckCircle, XCircle, Package } from 'lucide-react';

const BrandStats = ({ statsData }) => {
    const stats = [
        {
            title: 'Total Brands',
            value: statsData?.totalBrands ?? 0,
            icon: Award,
            color: '#8b5cf6',
            bg: '#8b5cf615',
            subText: 'Across all categories'
        },
        {
            title: 'Active Brands',
            value: statsData?.activeBrands ?? 0,
            icon: CheckCircle,
            color: '#10b981',
            bg: '#10b98115',
            subText: 'Currently live on site'
        },
        {
            title: 'Inactive Brands',
            value: statsData?.inactiveBrands ?? 0,
            icon: XCircle,
            color: '#ef4444',
            bg: '#ef444415',
            subText: 'Currently disabled'
        },
        {
            title: 'Total Products',
            value: statsData?.totalProducts ?? 0,
            icon: Package,
            color: '#06b6d4',
            bg: '#06b6d415',
            subText: 'Products under brands'
        }
    ];

    return (
        <div className="vendor-brand-stats-grid">
            {stats.map((stat, i) => (
                <div key={i} className="vendor-stat-card">
                    <div className="vendor-stat-icon-box" style={{ background: stat.bg, color: stat.color }}>
                        <stat.icon size={24} />
                    </div>
                    <div className="vendor-stat-info">
                        <p>{stat.title}</p>
                        <div className="vendor-stat-value-row">
                            <h3>{stat.value}</h3>
                        </div>
                        <p>{stat.subText}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BrandStats;
