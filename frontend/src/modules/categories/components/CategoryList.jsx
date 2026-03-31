import React, { useState } from 'react';
import {
    Search, Filter, ChevronLeft, ChevronRight,
    CheckSquare, Square
} from 'lucide-react';
import ActionButtons from '../../../components/common/ActionButtons';
import ExportActions from '../../../components/common/ExportActions';
import { exportCategoriesToPDF, exportCategoriesToExcel } from '../services/export.service';

const CategoryList = ({ categories = [], pagination = null, loading = false, onEdit, onDelete, onToggleStatus, onRefresh, showToast }) => {
    const [selectedRows, setSelectedRows] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const toggleSelectAll = () => {
        if (selectedRows.length === categories.length && categories.length > 0) {
            setSelectedRows([]);
        } else {
            setSelectedRows(categories.map(c => c.id));
        }
    };

    const toggleSelectRow = (id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const handlePageChange = (newPage) => {
        onRefresh({ page: newPage, search: searchQuery, status: statusFilter === 'All' ? '' : statusFilter });
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        onRefresh({ page: 1, search: value, status: statusFilter === 'All' ? '' : statusFilter });
    };

    const handleStatusFilter = (e) => {
        const value = e.target.value;
        setStatusFilter(value);
        onRefresh({ page: 1, search: searchQuery, status: value === 'All' ? '' : value });
    };

    const handleExportDownload = (type) => {
        const selectedData = categories.filter(cat => selectedRows.includes(cat.id));

        if (selectedData.length === 0) {
            showToast('Please select at least one record to export', 'warning');
            return;
        }

        try {
            if (type === 'pdf') {
                exportCategoriesToPDF(selectedData);
                showToast(`Exported ${selectedData.length} records as PDF successfully!`, 'success');
            } else if (type === 'excel') {
                exportCategoriesToExcel(selectedData);
                showToast(`Exported ${selectedData.length} records as Excel successfully!`, 'success');
            }
        } catch (error) {
            console.error('Export Error:', error);
            showToast('Failed to generate export file. Please try again.', 'error');
        }
    };

    return (
        <>
            {/* Controls Bar */}
            <div className="vendor-cat-table-controls">
                <div className="vendor-cat-controls-left">
                    <div className="vendor-cat-search-box">
                        <Search className="search-icon" size={16} />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="vendor-cat-filter-select vendor-cat-w-160">
                        <Filter size={15} className="field-icon" />
                        <select value={statusFilter} onChange={handleStatusFilter}>
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <ExportActions
                    selectedCount={selectedRows.length}
                    onExport={showToast}
                    onDownload={handleExportDownload}
                />
            </div>

            {/* Bulk Selection Bar */}
            {selectedRows.length > 0 && (
                <div className="vendor-cat-bulk-bar">
                    <span>{selectedRows.length} items selected</span>
                    <button onClick={() => setSelectedRows([])}>Clear</button>
                </div>
            )}

            {/* Table */}
            <table className="vendor-category-table dashboard-table">
                <thead>
                    <tr>
                        <th className="vendor-cat-col-checkbox">
                            <div onClick={toggleSelectAll} className="vendor-cat-clickable-cell">
                                {selectedRows.length === categories.length && categories.length > 0
                                    ? <CheckSquare size={17} color="var(--primary-color)" />
                                    : <Square size={17} color="#94a3b8" />
                                }
                            </div>
                        </th>
                        <th className="vendor-cat-col-logo">ICON</th>
                        <th>CATEGORY ID</th>
                        <th>NAME</th>
                        <th>DESCRIPTION</th>
                        <th className="vendor-cat-subcat-count">SUB-CATEGORIES</th>
                        <th>STATUS</th>
                        <th className="vendor-cat-col-actions">ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={8} className="vendor-cat-empty-state">Loading...</td></tr>
                    ) : categories.length === 0 ? (
                        <tr><td colSpan={8} className="vendor-cat-empty-state">No data found.</td></tr>
                    ) : (
                        categories.map((cat) => (
                            <tr key={cat.id} className={selectedRows.includes(cat.id) ? 'selected-row' : ''}>
                                <td>
                                    <div onClick={() => toggleSelectRow(cat.id)} className="vendor-cat-clickable-cell">
                                        {selectedRows.includes(cat.id) ? <CheckSquare size={17} color="var(--primary-color)" /> : <Square size={17} color="#94a3b8" />}
                                    </div>
                                </td>
                                <td>
                                    <div className="vendor-cat-icon-box">
                                        {cat.icon ? <img src={cat.icon} alt="" className="vendor-cat-icon-img" /> : '📁'}
                                    </div>
                                </td>
                                <td><span className="cat-id-badge">{cat.category_code || cat.id}</span></td>
                                <td><span className="vendor-cat-name-text">{cat.name}</span></td>
                                <td className="vendor-cat-description-text">
                                    {cat.description || '-'}
                                </td>
                                <td className="vendor-cat-subcat-count">{cat.subCategoryCount || 0}</td>
                                <td><span className={`badge ${cat.status === 'Active' ? 'success' : 'error'}`}>{cat.status}</span></td>
                                <td className="vendor-cat-actions-cell">
                                    <ActionButtons
                                        onEdit={() => onEdit?.(cat)}
                                        onDelete={() => onDelete?.(cat)}
                                        onToggleStatus={() => onToggleStatus?.(cat)}
                                        isActive={cat.status === 'Active'}
                                    />
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {pagination && (
                <div className="vendor-cat-pagination">
                    <span className="vendor-cat-pagination-info">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalRecords)} of {pagination.totalRecords}
                    </span>
                    <div className="vendor-cat-pagination-btns">
                        <button className="vendor-cat-page-btn" disabled={!pagination.hasPrevPage} onClick={() => handlePageChange(pagination.page - 1)}>
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <button className="vendor-cat-page-btn" disabled={!pagination.hasNextPage} onClick={() => handlePageChange(pagination.page + 1)}>
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default CategoryList;
