import React from 'react';
import { Search, MapPin, ChevronLeft, ChevronRight, X, Square, CheckSquare } from 'lucide-react';
import ActionButtons from '../../../components/common/ActionButtons';
import ExportActions from '../../../components/common/ExportActions';

const CustomerList = ({
    customers,
    totalCount,
    filters,
    setFilters,
    pagination,
    setPagination,
    locationData,
    selectedCustomerIds,
    setSelectedCustomerIds,
    onView,
    onEdit,
    onBlock,
    onActivate,
    onTerminate,
    showToast
}) => {
    const { currentPage, itemsPerPage } = pagination;
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };

        if (key === 'country') {
            newFilters.state = 'All';
            newFilters.city = 'All';
        } else if (key === 'state') {
            newFilters.city = 'All';
        }

        setFilters(newFilters);
    };

    // const resetFilters = () => {
    //     setFilters({
    //         search: '',
    //         status: 'All',
    //         country: 'All',
    //         state: 'All',
    //         city: 'All'
    //     });
    //     showToast('Filters cleared', 'info');
    // };

    const toggleSelectAll = () => {
        if (selectedCustomerIds.length === customers.length && customers.length > 0) {
            setSelectedCustomerIds([]);
        } else {
            setSelectedCustomerIds(customers.map(c => c.id));
        }
    };

    const toggleSelectRow = (id) => {
        if (selectedCustomerIds.includes(id)) {
            setSelectedCustomerIds(selectedCustomerIds.filter(item => item !== id));
        } else {
            setSelectedCustomerIds([...selectedCustomerIds, id]);
        }
    };

    const countries = Object.keys(locationData);
    const states = filters.country !== 'All' ? Object.keys(locationData[filters.country]) : [];
    const cities = (filters.country !== 'All' && filters.state !== 'All') ? locationData[filters.country][filters.state] : [];

    return (
        <div className="cust-table-section">
            {/* ── Controls Bar ── */}
            <div className="cust-table-controls">
                <div className="cust-controls-left">
                    <div className="cust-search">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or customer ID..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>

                    <div className="cust-filters">
                        <select
                            className="cust-filter-select"
                            value={filters.country}
                            onChange={(e) => handleFilterChange('country', e.target.value)}
                        >
                            <option value="All">All Countries</option>
                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <select
                            className="cust-filter-select"
                            disabled={filters.country === 'All'}
                            value={filters.state}
                            onChange={(e) => handleFilterChange('state', e.target.value)}
                        >
                            <option value="All">States</option>
                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <select
                            className="cust-filter-select"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Blocked">Blocked</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Terminated">Terminated</option>
                        </select>
                    </div>
                </div>

                <ExportActions
                    selectedCount={selectedCustomerIds.length}
                    onExport={(format) => showToast(`Exporting as ${format}...`)}
                />
            </div>

            {/* ── Bulk Selection Bar ── */}
            {selectedCustomerIds.length > 0 && (
                <div className="cust-bulk-bar">
                    <span>{selectedCustomerIds.length} {selectedCustomerIds.length === 1 ? 'customer' : 'customers'} selected</span>
                    <button onClick={() => setSelectedCustomerIds([])}>Clear Selection</button>
                </div>
            )}

            {/* ── Table ── */}
            <div className="cust-table-wrapper">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th className="cust-col-checkbox">
                                <div onClick={toggleSelectAll} className="cust-clickable-cell">
                                    {selectedCustomerIds.length === customers.length && customers.length > 0
                                        ? <CheckSquare size={17} color="var(--primary-color)" />
                                        : <Square size={17} color="#94a3b8" />
                                    }
                                </div>
                            </th>
                            <th className="cust-col-profile">PROFILE</th>
                            <th>CUSTOMER ID</th>
                            <th>NAME</th>
                            <th>CONTACT</th>
                            <th>LOCATION</th>
                            <th>ORDERS</th>
                            <th>JOINED</th>
                            <th>STATUS</th>
                            <th className="cust-col-actions">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="cust-empty-state">
                                    No customers found matching your filters.
                                </td>
                            </tr>
                        ) : (
                            customers.map((customer) => (
                                <tr key={customer.id} className={selectedCustomerIds.includes(customer.id) ? 'selected-row' : ''}>
                                    <td>
                                        <div onClick={() => toggleSelectRow(customer.id)} className="cust-clickable-cell">
                                            {selectedCustomerIds.includes(customer.id)
                                                ? <CheckSquare size={17} color="var(--primary-color)" />
                                                : <Square size={17} color="#94a3b8" />
                                            }
                                        </div>
                                    </td>
                                    <td>
                                        <div className="profile-initials">
                                            {customer.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                    </td>
                                    <td><span className="cust-id-badge">{customer.id}</span></td>
                                    <td><span className="cust-name-text">{customer.name}</span></td>
                                    <td>
                                        <div className="cust-contact-primary">{customer.email}</div>
                                        <div className="cust-contact-secondary">{customer.phone}</div>
                                    </td>
                                    <td>
                                        <div className="cust-location-box">
                                            <MapPin size={12} /> {customer.city}, {customer.country}
                                        </div>
                                    </td>
                                    <td className="cust-orders-count">{customer.totalOrders}</td>
                                    <td className="cust-joined-date">{customer.joined}</td>
                                    <td>
                                        <span className={`badge ${customer.status === 'Active' ? 'success' : customer.status === 'Terminated' ? 'error' : 'warning'}`}>
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td className="cust-actions-cell">
                                        <ActionButtons
                                            onView={() => onView(customer)}
                                            onEdit={() => onEdit(customer)}
                                            onToggleStatus={customer.status === 'Active' ? () => onBlock(customer.id) : () => onActivate(customer.id)}
                                            onDelete={() => onTerminate(customer.id)}
                                            isActive={customer.status === 'Active'}
                                            type="customer"
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Pagination ── */}
            <div className="cust-pagination">
                <span className="cust-pagination-info">
                    Showing <strong>{Math.min(itemsPerPage * (currentPage - 1) + 1, totalCount)}</strong> to <strong>{Math.min(itemsPerPage * currentPage, totalCount)}</strong> of <strong>{totalCount}</strong> customers
                </span>
                <div className="cust-pagination-btns">
                    <button
                        className="cust-page-btn"
                        disabled={currentPage === 1}
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => setPagination(prev => ({ ...prev, currentPage: i + 1 }))}
                            className={`cust-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        className="cust-page-btn"
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerList;
