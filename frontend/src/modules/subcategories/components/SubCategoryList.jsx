import React, { useState } from 'react';
import {
    Search, Filter, ListTree,
    CheckSquare, Square, ChevronLeft, ChevronRight, Layers
} from 'lucide-react';
import ActionButtons from '../../../components/common/ActionButtons';
import ExportActions from '../../../components/common/ExportActions';
import { exportSubCategoriesToPDF, exportSubCategoriesToExcel } from '../services/export.service';

const SubCategoryList = ({ subcategories = [], parentCategories = [], loading = false, pagination = null, onRefresh, onEdit, onDelete, onToggleStatus, showToast }) => {
    const [selectedRows, setSelectedRows] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const getCountByCategory = (catId) =>
        subcategories.filter(sc => sc.categoryId === catId).length;

    const getCategoryName = (catId) => {
        const cat = parentCategories.find(c => c.id === catId);
        return cat ? cat.name : "Unknown Category";
    };

    const toggleSelectAll = () => {
        if (selectedRows.length === subcategories.length && subcategories.length > 0) {
            setSelectedRows([]);
        } else {
            setSelectedRows(subcategories.map(item => item.id));
        }
    };

    const toggleSelectRow = (id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const handlePageChange = (newPage) => {
        onRefresh({ page: newPage, search: searchQuery, status: statusFilter === 'All' ? '' : statusFilter, categoryId: categoryFilter === 'All' ? '' : categoryFilter });
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        onRefresh({ page: 1, search: value, status: statusFilter === 'All' ? '' : statusFilter, categoryId: categoryFilter === 'All' ? '' : categoryFilter });
    };

    const handleStatusFilter = (e) => {
        const value = e.target.value;
        setStatusFilter(value);
        onRefresh({ page: 1, search: searchQuery, status: value === 'All' ? '' : value, categoryId: categoryFilter === 'All' ? '' : categoryFilter });
    };

    const handleCategoryFilter = (e) => {
        const value = e.target.value;
        setCategoryFilter(value);
        onRefresh({ page: 1, search: searchQuery, status: statusFilter === 'All' ? '' : statusFilter, categoryId: value === 'All' ? '' : value });
    };

    const handleExportDownload = (type) => {
        const selectedData = subcategories.filter(sc => selectedRows.includes(sc.id));

        if (selectedData.length === 0) {
            showToast('Please select at least one record to export', 'warning');
            return;
        }

        try {
            if (type === 'pdf') {
                exportSubCategoriesToPDF(selectedData, parentCategories);
                showToast(`Exported ${selectedData.length} records as PDF successfully!`, 'success');
            } else if (type === 'excel') {
                exportSubCategoriesToExcel(selectedData, parentCategories);
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
            <div className="vendor-sc-table-controls">
                <div className="vendor-sc-controls-left">

                    {/* Search */}
                    <div className="vendor-sc-search-box">
                        <Search className="search-icon" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="vendor-sc-filter-select vendor-sc-w-190">
                        <Layers size={15} className="field-icon" />
                        <select
                            value={categoryFilter}
                            onChange={handleCategoryFilter}
                        >
                            <option value="All">All Categories</option>
                            {parentCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name} ({getCountByCategory(cat.id)})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="vendor-sc-filter-select vendor-sc-w-150">
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
                <div className="vendor-sc-bulk-bar">
                    <span>
                        {selectedRows.length} {selectedRows.length === 1 ? 'item' : 'items'} selected
                    </span>
                    <button onClick={() => setSelectedRows([])}>Clear Selection</button>
                </div>
            )}

            {/* ── Table ── */}
            <table className="vendor-sc-table dashboard-table">
                <thead>
                    <tr>
                        <th className="vendor-sc-col-checkbox">
                            <div
                                onClick={toggleSelectAll}
                                className="vendor-sc-clickable-cell"
                            >
                                {selectedRows.length === subcategories.length && subcategories.length > 0
                                    ? <CheckSquare size={17} color="var(--primary-color)" />
                                    : <Square size={17} color="#94a3b8" />
                                }
                            </div>
                        </th>
                        <th className="vendor-sc-col-logo">ICON</th>
                        <th>CATEGORY ID</th>
                        <th>CATEGORY NAME</th>
                        <th>SUB-CATEGORY ID</th>
                        <th>SUB-CATEGORY NAME</th>
                        <th>ITEMS / PRODUCTS</th>
                        <th>STATUS</th>
                        <th className="vendor-sc-col-actions">ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {subcategories.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="vendor-sc-empty-state">
                                No sub-categories found.
                            </td>
                        </tr>
                    ) : (
                        subcategories.map((item) => (
                            <tr
                                key={item.id}
                                className={selectedRows.includes(item.id) ? 'selected-row' : ''}
                            >
                                {/* Checkbox */}
                                <td>
                                    <div
                                        onClick={() => toggleSelectRow(item.id)}
                                        className="vendor-sc-clickable-cell"
                                    >
                                        {selectedRows.includes(item.id)
                                            ? <CheckSquare size={17} color="var(--primary-color)" />
                                            : <Square size={17} color="#94a3b8" />
                                        }
                                    </div>
                                </td>

                                {/* Icon */}
                                <td>
                                    <div className="vendor-sc-icon-box">
                                        {item.icon ? (
                                            <img src={item.icon} alt="" className="vendor-sc-icon-img" />
                                        ) : (
                                            '📁'
                                        )}
                                    </div>
                                </td>

                                {/* Cat ID */}
                                <td>
                                    <span className="vendor-sc-id-badge">{item.category_code || item.categoryId || '-'}</span>
                                </td>

                                {/* Category Name */}
                                <td>
                                    <span className="vendor-sc-cat-name">
                                        {item.category}
                                    </span>
                                </td>

                                {/* Sub ID */}
                                <td>
                                    <span className="vendor-sc-id-badge">{item.subcategory_code || item.id}</span>
                                </td>

                                {/* Sub Category Name */}
                                <td>
                                    <span className="vendor-sc-name-text">
                                        {item.name}
                                    </span>
                                </td>

                                {/* Items / Products */}
                                <td>
                                    <div className="vendor-sc-desc-container">
                                        <ListTree size={14} />
                                        {item.description || '-'}
                                    </div>
                                </td>

                                {/* Status */}
                                <td>
                                    <span className={`badge ${item.status === 'Active' ? 'success' : 'error'}`}>
                                        {item.status}
                                    </span>
                                </td>

                                {/* Actions — shared ActionButtons component */}
                                <td className="vendor-sc-actions-cell">
                                    <ActionButtons
                                        onEdit={() => onEdit?.(item)}
                                        onToggleStatus={() => onToggleStatus(item)}
                                        onDelete={() => onDelete?.(item)}
                                        isActive={item.status === 'Active'}
                                    />
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {pagination && (
                <div className="vendor-sc-pagination">
                    <span className="vendor-sc-pagination-info">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalRecords)} of {pagination.totalRecords} items
                    </span>
                    <div className="vendor-sc-pagination-btns">
                        <button
                            className="vendor-sc-page-btn"
                            disabled={!pagination.hasPrevPage}
                            onClick={() => handlePageChange(pagination.page - 1)}
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <button
                            className="vendor-sc-page-btn"
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

export default SubCategoryList;
