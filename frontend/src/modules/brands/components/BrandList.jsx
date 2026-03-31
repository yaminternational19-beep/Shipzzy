import React, { useState } from 'react';
import {
    Search, Filter, ListTree,
    CheckSquare, Square, ChevronLeft, ChevronRight, Layers
} from 'lucide-react';
import ActionButtons from '../../../components/common/ActionButtons';
import ExportActions from '../../../components/common/ExportActions';
import { exportBrandsToPDF, exportBrandsToExcel } from '../services/export.service';

const BrandList = ({
    brands = [],
    categories = [],
    subCategories = [],
    pagination = null,
    loading = false,
    onEdit,
    onDelete,
    onToggleStatus,
    onRefresh,
    showToast
}) => {
    const [selectedRows, setSelectedRows] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [subCategoryFilter, setSubCategoryFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // ── Helpers ──────────────────────────────────────────────────
    // Use == (loose) because API returns numeric IDs but select stores strings
    // eslint-disable-next-line eqeqeq
    const getCategoryName = (catId) => {
        // eslint-disable-next-line eqeqeq
        const cat = categories.find(c => c.id == catId);
        return cat ? cat.name : catId || '-';
    };

    const getSubCategoryName = (scId) => {
        // eslint-disable-next-line eqeqeq
        const sc = subCategories.find(s => s.id == scId);
        return sc ? sc.name : scId || '-';
    };

    // Sub-categories filtered by selected category — use == to handle number vs string
    const filteredSubCatOptions = subCategories.filter(sc =>
        // eslint-disable-next-line eqeqeq
        categoryFilter === 'All' || sc.categoryId == categoryFilter
    );

    // ── Selection ─────────────────────────────────────────────────
    const toggleSelectAll = () => {
        if (selectedRows.length === brands.length && brands.length > 0) {
            setSelectedRows([]);
        } else {
            setSelectedRows(brands.map(b => b.id));
        }
    };

    const toggleSelectRow = (id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    // ── API-driven handlers  ───────────────────────────────────────
    const handlePageChange = (newPage) => {
        onRefresh({
            page: newPage,
            search: searchQuery,
            status: statusFilter === 'All' ? '' : statusFilter,
            categoryId: categoryFilter === 'All' ? '' : categoryFilter,
            subCategoryId: subCategoryFilter === 'All' ? '' : subCategoryFilter
        });
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        onRefresh({
            page: 1,
            search: value,
            status: statusFilter === 'All' ? '' : statusFilter,
            categoryId: categoryFilter === 'All' ? '' : categoryFilter,
            subCategoryId: subCategoryFilter === 'All' ? '' : subCategoryFilter
        });
    };

    const handleStatusFilter = (e) => {
        const value = e.target.value;
        setStatusFilter(value);
        onRefresh({
            page: 1,
            search: searchQuery,
            status: value === 'All' ? '' : value,
            categoryId: categoryFilter === 'All' ? '' : categoryFilter,
            subCategoryId: subCategoryFilter === 'All' ? '' : subCategoryFilter
        });
    };

    const handleCategoryFilter = (e) => {
        const value = e.target.value;
        setCategoryFilter(value);
        setSubCategoryFilter('All');
        onRefresh({
            page: 1,
            search: searchQuery,
            status: statusFilter === 'All' ? '' : statusFilter,
            categoryId: value === 'All' ? '' : value,
            subCategoryId: ''
        });
    };

    const handleSubCategoryFilter = (e) => {
        const value = e.target.value;
        setSubCategoryFilter(value);
        onRefresh({
            page: 1,
            search: searchQuery,
            status: statusFilter === 'All' ? '' : statusFilter,
            categoryId: categoryFilter === 'All' ? '' : categoryFilter,
            subCategoryId: value === 'All' ? '' : value
        });
    };

    // ── Export ────────────────────────────────────────────────────
    const handleExportDownload = (type) => {
        const selectedData = brands.filter(b => selectedRows.includes(b.id));

        if (selectedData.length === 0) {
            showToast('Please select at least one record to export', 'warning');
            return;
        }

        try {
            if (type === 'pdf') {
                exportBrandsToPDF(selectedData);
                showToast(`Exported ${selectedData.length} records as PDF successfully!`, 'success');
            } else if (type === 'excel') {
                exportBrandsToExcel(selectedData);
                showToast(`Exported ${selectedData.length} records as Excel successfully!`, 'success');
            }
        } catch (error) {
            console.error('Export Error:', error);
            showToast('Failed to generate export file. Please try again.', 'error');
        }
    };

    return (
        <>

            {/* ── Controls Bar ── */}
            <div className="vendor-table-controls">
                <div className="vendor-controls-left">
                    <div className="vendor-search-box">
                        <Search className="search-icon" size={16} />
                        <input
                            type="text"
                            placeholder="Search by brand name or ID..."
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="vendor-filter-select vendor-w-190">
                        <Layers size={15} className="field-icon" />
                        <select
                            value={categoryFilter}
                            onChange={handleCategoryFilter}
                        >
                            <option value="All">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="vendor-filter-select vendor-w-190">
                        <ListTree size={15} className="field-icon" />
                        <select
                            value={subCategoryFilter}
                            onChange={handleSubCategoryFilter}
                            disabled={categoryFilter === 'All'}
                        >
                            <option value="All">All Sub-Categories</option>
                            {filteredSubCatOptions.map(sc => (
                                <option key={sc.id} value={sc.id}>{sc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="vendor-filter-select vendor-w-150">
                        <Filter size={15} className="field-icon" />
                        <select
                            value={statusFilter}
                            onChange={handleStatusFilter}
                        >
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

            {/* ── Bulk Selection Bar ── */}
            {selectedRows.length > 0 && (
                <div className="vendor-bulk-bar">
                    <span>
                        {selectedRows.length} {selectedRows.length === 1 ? 'brand' : 'brands'} selected
                    </span>
                    <button onClick={() => setSelectedRows([])}>Clear Selection</button>
                </div>
            )}

            {/* ── Table ── */}
            <table className="vendor-brand-table dashboard-table">
                <thead>
                    <tr>
                        <th className="vendor-col-checkbox">
                            <div onClick={toggleSelectAll} className="vendor-clickable-cell">
                                {selectedRows.length === brands.length && brands.length > 0
                                    ? <CheckSquare size={17} color="var(--primary-color)" />
                                    : <Square size={17} color="#94a3b8" />
                                }
                            </div>
                        </th>
                        <th className="vendor-col-logo">Logo</th>
                        <th>Brand ID</th>
                        <th>Brand Name</th>
                        <th>Category</th>
                        <th>Sub Category</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th className="vendor-col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={9} className="vendor-empty-state">
                                Loading...
                            </td>
                        </tr>
                    ) : brands.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="vendor-empty-state">
                                No brands found.
                            </td>
                        </tr>
                    ) : (
                        brands.map((item) => (
                            <tr
                                key={item.id}
                                className={selectedRows.includes(item.id) ? 'selected-row' : ''}
                            >
                                {/* Checkbox */}
                                <td>
                                    <div
                                        onClick={() => toggleSelectRow(item.id)}
                                        className="vendor-clickable-cell"
                                    >
                                        {selectedRows.includes(item.id)
                                            ? <CheckSquare size={17} color="var(--primary-color)" />
                                            : <Square size={17} color="#94a3b8" />
                                        }
                                    </div>
                                </td>

                                {/* Logo */}
                                <td>
                                    <div className="vendor-logo-box">
                                        {item.logo
                                            ? <img src={item.logo} alt="" className="vendor-logo-img" />
                                            : '🏷️'
                                        }
                                    </div>
                                </td>

                                {/* Brand ID */}
                                <td>
                                    <span className="cat-id-badge">{item.brand_code || item.id}</span>
                                </td>

                                {/* Brand Name */}
                                <td>
                                    <span className="vendor-brand-badge">
                                        {item.name}
                                    </span>
                                </td>

                                {/* Category */}
                                <td>
                                    <span className="vendor-category-badge">
                                        {item.category || getCategoryName(item.categoryId)}
                                    </span>
                                </td>

                                {/* Sub Category */}
                                <td>
                                    <span className="vendor-subcategory-badge">
                                        {item.subCategory || getSubCategoryName(item.subCategoryId) || '-'}
                                    </span>
                                </td>

                                {/* Description */}
                                <td>
                                    <div className="vendor-description-text">
                                        {item.description || '-'}
                                    </div>
                                </td>

                                {/* Status */}
                                <td>
                                    <span className={`badge ${item.status === 'Active' ? 'success' : 'error'}`}>
                                        {item.status}
                                    </span>
                                </td>

                                {/* Actions */}
                                <td>
                                    <ActionButtons
                                        onEdit={() => onEdit?.(item)}
                                        onToggleStatus={() => onToggleStatus?.(item)}
                                        onDelete={() => onDelete?.(item)}
                                        isActive={item.status === 'Active'}
                                    />
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* ── Pagination ── */}
            {pagination && (
                <div className="vendor-pagination">
                    <span className="vendor-pagination-info">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.totalRecords)} of{' '}
                        {pagination.totalRecords} brands
                    </span>
                    <div className="vendor-pagination-btns">
                        <button
                            className="vendor-page-btn"
                            disabled={!pagination.hasPrevPage}
                            onClick={() => handlePageChange(pagination.page - 1)}
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <button
                            className="vendor-page-btn"
                            disabled={!pagination.hasNextPage}
                            onClick={() => handlePageChange(pagination.page + 1)}
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

        </>
    );
};

export default BrandList;
