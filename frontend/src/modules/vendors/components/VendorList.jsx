import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, CheckSquare, Square, Filter, RefreshCw } from 'lucide-react';
import ExportActions from '../../../components/common/ExportActions';
import ActionButtons from '../../../components/common/ActionButtons';
import { getVendorsApi, updateVendorStatusApi } from '../../../api/vendor.api';
import { exportVendorsToPDF, exportVendorsToExcel } from '../services/export.service';

const VendorList = ({ onEdit, onDelete, showToast, onTabChange, onStatsUpdate }) => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRows, setSelectedRows] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [kycFilter, setKycFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0, limit: 10 });
    const navigate = useNavigate();

    const fetchVendors = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (statusFilter) params.status = statusFilter;
            if (kycFilter) params.kyc_status = kycFilter;
            if (searchQuery) params.search = searchQuery;

            const res = await getVendorsApi(params);
            const { records, pagination: pg, stats } = res.data.data;
            setVendors(records);
            setPagination({
                currentPage: pg.page,
                totalPages: pg.totalPages,
                totalRecords: pg.totalRecords,
                limit: pg.limit
            });
            if (onStatsUpdate) onStatsUpdate(stats);
        } catch (err) {
            showToast?.('Failed to load vendors', 'error');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, kycFilter, searchQuery]);

    useEffect(() => {
        const debounce = setTimeout(() => fetchVendors(1), 350);
        return () => clearTimeout(debounce);
    }, [fetchVendors]);

    const handleStatusToggle = async (vendor) => {
        const newStatus = vendor.status === 'Active' ? 'Inactive' : 'Active';
        try {
            await updateVendorStatusApi(vendor.id, newStatus);
            showToast?.(`${vendor.business_name} set to ${newStatus}`, 'success');
            fetchVendors(pagination.currentPage);
        } catch {
            showToast?.('Failed to update status', 'error');
        }
    };

    const toggleSelectAll = () => {
        setSelectedRows(selectedRows.length === vendors.length ? [] : vendors.map(v => v.id));
    };

    const toggleSelectRow = (id) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    const handleExportDownload = (type) => {
        const selectedVendors = vendors.filter(v => selectedRows.includes(v.id));
        if (selectedVendors.length === 0) {
            showToast?.('Please select vendors to export', 'warning');
            return;
        }

        if (type === 'pdf') {
            exportVendorsToPDF(selectedVendors);
        } else {
            exportVendorsToExcel(selectedVendors);
        }
    };

    const KYC_BADGE = {
        Pending: { cls: 'status-pending', label: 'PENDING' },
        Approved: { cls: 'status-live', label: 'APPROVED' },
        Rejected: { cls: 'status-blocked', label: 'REJECTED' },
    };

    return (
        <div className="c-table-container">
            {/* Filter Bar */}
            <div className="v-table-controls">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="c-search">
                        <Search className="search-icon" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, code, email, mobile..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="input-with-icon" style={{ width: '160px' }}>
                        <Filter size={15} className="field-icon" />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="input-with-icon" style={{ width: '160px' }}>
                        <Filter size={15} className="field-icon" />
                        <select value={kycFilter} onChange={(e) => setKycFilter(e.target.value)}>
                            <option value="">All KYC</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <button
                        className="btn btn-secondary"
                        style={{ height: '38px', padding: '0 12px' }}
                        onClick={() => fetchVendors(pagination.currentPage)}
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>

                <div className="filter-controls">
                    <ExportActions 
                        selectedCount={selectedRows.length} 
                        onExport={(msg, t) => showToast?.(msg, t)} 
                        onDownload={handleExportDownload}
                    />
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <div onClick={toggleSelectAll} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {vendors.length > 0 && selectedRows.length === vendors.length
                                        ? <CheckSquare size={17} color="var(--primary-color)" />
                                        : <Square size={17} color="#94a3b8" />}
                                </div>
                            </th>
                            <th style={{ textAlign: 'center' }}>Image</th>
                            <th style={{ textAlign: 'center' }}>Vendor ID</th>
                            <th style={{ textAlign: 'center' }}>Business Name</th>
                            <th style={{ textAlign: 'center' }}>Vendor Name</th>
                            <th style={{ textAlign: 'center' }}>Vendor Details</th>
                            <th style={{ textAlign: 'center' }}>Address</th>
                            <th style={{ textAlign: 'center' }}>Comm / Trnvr</th>
                            <th style={{ textAlign: 'center' }}>Tier</th>
                            <th style={{ textAlign: 'center' }}>KYC</th>
                            <th style={{ textAlign: 'center' }}>Status</th>
                            <th className="col-actions" style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="12" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                                    Loading vendors...
                                </td>
                            </tr>
                        ) : vendors.length === 0 ? (
                            <tr>
                                <td colSpan="12" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                                    No vendors found
                                </td>
                            </tr>
                        ) : vendors.map((vendor) => (
                            <tr key={vendor.id} style={{ background: selectedRows.includes(vendor.id) ? '#f8fafc' : 'white' }}>
                                <td style={{ textAlign: 'center' }}>
                                    <div onClick={() => toggleSelectRow(vendor.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {selectedRows.includes(vendor.id)
                                            ? <CheckSquare size={17} color="var(--primary-color)" />
                                            : <Square size={17} color="#94a3b8" />}
                                    </div>
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #e2e8f0', margin: '0 auto' }}>
                                        <img
                                            src={
                                                vendor.profile_photo
                                                    ? vendor.profile_photo
                                                    : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(vendor.business_name)}&backgroundColor=6366f1`
                                            }
                                            alt={vendor.business_name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.onerror = null; // prevent infinite loop
                                                e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(vendor.business_name)}&backgroundColor=6366f1`;
                                            }}
                                        />
                                    </div>
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                    <span style={{ fontWeight: 700, color: '#4f46e5', fontSize: '13px' }}>
                                        {vendor.vendor_code}
                                    </span>
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                    <span style={{ fontWeight: 600, color: '#111827', fontSize: '14px', display: 'block' }}>
                                        {vendor.business_name}
                                    </span>
                                    {/* Business Category Chips */}
                                    {(() => {
                                        let cats = vendor.business_categories;
                                        if (typeof cats === 'string') {
                                            try { cats = JSON.parse(cats); } catch { cats = [cats]; }
                                        }
                                        if (!Array.isArray(cats) || cats.length === 0) return null;
                                        const CHIP_COLORS = [
                                            { bg: '#ede9fe', color: '#7c3aed' },
                                            { bg: '#dbeafe', color: '#1d4ed8' },
                                            { bg: '#d1fae5', color: '#065f46' },
                                            { bg: '#fef3c7', color: '#92400e' },
                                            { bg: '#fce7f3', color: '#9d174d' },
                                            { bg: '#e0f2fe', color: '#0369a1' },
                                        ];
                                        return (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '5px', justifyContent: 'center' }}>
                                                {cats.map((cat, i) => {
                                                    const c = CHIP_COLORS[i % CHIP_COLORS.length];
                                                    return (
                                                        <span key={i} style={{
                                                            background: c.bg,
                                                            color: c.color,
                                                            fontSize: '10px',
                                                            fontWeight: 700,
                                                            padding: '2px 7px',
                                                            borderRadius: '20px',
                                                            letterSpacing: '0.02em',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {cat}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                    {/* Owner Name */}
                                    <span style={{ fontWeight: 700, color: '#111827', fontSize: '13px', display: 'block' }}>
                                        {vendor.owner_name}
                                    </span>
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                    {/* Phone with country code */}
                                    <span style={{ fontWeight: 700, color: '#374151', fontSize: '12px', display: 'block', marginTop: '3px' }}>
                                        {vendor.country_code} {vendor.mobile}
                                    </span>
                                    {/* Email - light color */}
                                    <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                                        {vendor.email}
                                    </span>
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block' }}>
                                        {vendor.city}, {vendor.state}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
                                        {vendor.country}
                                    </span>
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
                                            {vendor.commission_percent}%
                                        </span>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#4f46e5' }}>
                                            ₹{parseFloat(vendor.total_turnover || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                    <span className="status-badge" style={{ background: '#eef2ff', color: '#4f46e5', fontWeight: 700, fontSize: '11px', margin: '0 auto' }}>
                                        {vendor.tier_name || 'N/A'}
                                    </span>
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                    <span className={`status-badge ${KYC_BADGE[vendor.kyc_status]?.cls || 'status-pending'}`} style={{ margin: '0 auto' }}>
                                        {KYC_BADGE[vendor.kyc_status]?.label || vendor.kyc_status}
                                    </span>
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                    <span className={`status-badge ${vendor.status === 'Active' ? 'status-live' : 'status-blocked'}`} style={{ margin: '0 auto' }}>
                                        {vendor.status === 'Active' ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </td>

                                <td className="col-actions" style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <ActionButtons
                                            onView={() => navigate(`/vendors/${vendor.id}`, { state: { vendor } })}
                                            onEdit={() => onEdit?.(vendor)}
                                            onDelete={() => onDelete?.(vendor)}
                                            onPermissions={() => onTabChange?.('kyc')}
                                            onToggleStatus={() => handleStatusToggle(vendor)}
                                            isActive={vendor.status === 'Active'}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="c-pagination" style={{ borderTop: '1px solid var(--border-color)' }}>
                <span className="c-pagination-info">
                    Showing {vendors.length} of {pagination.totalRecords} vendors
                    &nbsp;|&nbsp; Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <div className="c-pagination-btns">
                    <button
                        className="c-page-btn"
                        disabled={pagination.currentPage <= 1 || loading}
                        onClick={() => fetchVendors(pagination.currentPage - 1)}
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <button
                        className="c-page-btn"
                        disabled={pagination.currentPage >= pagination.totalPages || loading}
                        onClick={() => fetchVendors(pagination.currentPage + 1)}
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VendorList;
