import React, { useState, useMemo, useEffect } from 'react';
import { Clock, CheckCircle, MessageSquare, AlertTriangle, ChevronLeft, ChevronRight, Eye, Hash, Search, X, User, Square, CheckSquare, Calendar, Filter } from 'lucide-react';
import '../VendorSettings.css';

const QueryList = ({ queries = [] }) => {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8
  });

  // Filter queries based on status and search query
  const filteredQueries = useMemo(() => {
    let result = [...queries].reverse();
    
    // Status Filter
    if (filter !== 'All') {
      result = result.filter(q => q.status === filter);
    }

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(ticket => 
        ticket.id?.toLowerCase().includes(q) ||
        ticket.userName?.toLowerCase().includes(q) ||
        ticket.userId?.toLowerCase().includes(q) ||
        ticket.subject?.toLowerCase().includes(q) ||
        ticket.message?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [queries, filter, searchQuery]);

  // Paginate filtered results
  const paginatedQueries = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return filteredQueries.slice(start, end);
  }, [filteredQueries, pagination.page, pagination.limit]);

  const totalPages = Math.ceil(filteredQueries.length / pagination.limit);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filter, searchQuery]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Selection Logic (Matching TicketTable.jsx logic)
  const allSelectedInCurrentPage = paginatedQueries.length > 0 && paginatedQueries.every(q => selectedIds.includes(q.id));

  const handleSelectAll = () => {
    if (allSelectedInCurrentPage) {
      setSelectedIds(prev => prev.filter(id => !paginatedQueries.find(q => q.id === id)));
    } else {
      const currentIds = paginatedQueries.map(q => q.id);
      setSelectedIds(prev => [...new Set([...prev, ...currentIds])]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="vendor-support-container">
      {/* Table Controls (Search & Filter) */}
      <div className="v-table-controls support-controls">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Show</span>
              <select 
                value={pagination.limit}
                onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer', background: '#f8fafc' }}
              >
                {[8, 10, 20, 50].map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>entries</span>
            </div>

            <div className="search-wrapper">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Search Tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '220px' }}
              />
            </div>
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Filter size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ padding: '9px 12px 9px 36px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', color: '#1e293b' }}
              >
                <option value="All">All Status</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                    <input type="text" placeholder="dd-mm-yyyy" style={{ padding: '9px 12px 9px 36px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', width: '135px' }} />
                </div>
                <span style={{ color: '#cbd5e1' }}>—</span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                    <input type="text" placeholder="dd-mm-yyyy" style={{ padding: '9px 12px 9px 36px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', width: '135px' }} />
                </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
             {selectedIds.length > 0 && (
               <div style={{ fontSize: '13px', color: 'var(--primary-color)', fontWeight: 700 }}>
                 {selectedIds.length} items selected
               </div>
             )}
             <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-export" style={{ backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '9px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>Export PDF</button>
                <button className="btn-export" style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #dcfce7', padding: '9px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>Export Excel</button>
             </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="c-table-container" style={{ marginTop: '0' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="dashboard-table" style={{ minWidth: '1500px' }}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center', padding: '12px 10px' }}>
                  <div onClick={handleSelectAll} style={{ cursor: 'pointer', display: 'inline-flex' }}>
                    {allSelectedInCurrentPage ? (
                      <CheckSquare size={18} color="var(--primary-color)" />
                    ) : (
                      <Square size={18} color="#94a3b8" />
                    )}
                  </div>
                </th>
                <th style={{ width: '100px' }}>TICKET ID</th>
                <th style={{ width: '180px' }}>USER NAME / ID</th>
                <th style={{ width: '100px' }}>USER TYPE</th>
                <th style={{ width: '200px' }}>USER CONTACT</th>
                <th style={{ width: '180px' }}>RECIPIENT NAME</th>
                <th style={{ width: '200px' }}>RECIPIENT CONTACT</th>
                <th style={{ width: '220px' }}>SUBJECT</th>
                <th style={{ width: '280px' }}>MESSAGE</th>
                <th style={{ width: '110px' }}>STATUS</th>
                <th style={{ width: '140px' }}>DATE RAISED</th>
                <th style={{ width: '100px' }} className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedQueries.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ padding: '80px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <AlertTriangle size={36} color="#94a3b8" />
                      <div style={{ fontWeight: 700, color: '#475569' }}>No Tickets Found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedQueries.map((query) => {
                  const dateInfo = formatDate(query.created_at);
                  const isSelected = selectedIds.includes(query.id);
                  return (
                    <tr key={query.id} className={isSelected ? 'selected-row' : ''} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ textAlign: 'center', padding: '16px 10px' }}>
                        <div onClick={() => handleSelectOne(query.id)} style={{ cursor: 'pointer', display: 'inline-flex' }}>
                          {isSelected ? (
                            <CheckSquare size={18} color="var(--primary-color)" />
                          ) : (
                            <Square size={18} color="#cbd5e1" />
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '13px' }}>{query.id}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '14px' }}>{query.userName}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{query.userId}</div>
                      </td>
                      <td>
                        <span style={{ 
                            padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                            background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
                            textTransform: 'uppercase'
                        }}>
                            {query.userType}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '13px' }}>{query.userPhone}</div>
                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '1px' }}>{query.userEmail}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#334155', fontSize: '14px' }}>{query.recipientName}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '13px' }}>{query.recipientPhone}</div>
                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '1px' }}>{query.recipientEmail}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={query.subject}>
                          {query.subject}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#4b5563', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={query.message}>
                          {query.message}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${query.status === 'Closed' ? 'status-approved' : 'status-blocked'}`} style={{
                            padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                            backgroundColor: query.status === 'Closed' ? '#f0fdf4' : '#fff1f2',
                            color: query.status === 'Closed' ? '#16a34a' : '#e11d48',
                            border: `1px solid ${query.status === 'Closed' ? '#dcfce7' : '#fecdd3'}`
                        }}>
                          {query.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{dateInfo.date}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>{dateInfo.time}</div>
                      </td>
                      <td className="col-actions" style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => setSelectedTicket(query)}
                          className="btn-reply"
                          style={{ backgroundColor: '#6366f1', color: 'white', padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, margin: '0 auto' }}
                        >
                          <Eye size={16} /> View
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div className="c-pagination">
          <span className="c-pagination-info">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, filteredQueries.length)} of {filteredQueries.length} entries
          </span>
          <div className="c-pagination-btns">
            <button
              className="c-page-btn"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <div style={{ display: 'flex', gap: '6px', padding: '0 8px' }}>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                    className={`page-no-btn ${pagination.page === i + 1 ? 'active' : ''}`}
                  >
                    {i + 1}
                  </button>
                ))}
            </div>
            <button
              className="c-page-btn"
              disabled={pagination.page === totalPages || totalPages === 0}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="ticket-modal-overlay">
          <div className="ticket-modal-content">
            <div className="ticket-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Hash size={20} color="var(--primary-color)" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Ticket Details: {selectedTicket.id}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedTicket(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="ticket-modal-body">
               <div className="ticket-detail-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div className="ticket-detail-row">
                    <div className="ticket-detail-col ticket-detail-item">
                      <label>Recipient Department</label>
                      <div className="value">{selectedTicket.recipientName}</div>
                    </div>
                    <div className="ticket-detail-col ticket-detail-item">
                      <label>Date Raised</label>
                      <div className="value">{new Date(selectedTicket.created_at).toLocaleString()}</div>
                    </div>
                 </div>
                 
                 <div className="ticket-detail-item" style={{ marginTop: '16px' }}>
                    <label>Subject</label>
                    <div className="value" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{selectedTicket.subject}</div>
                 </div>

                 <div className="ticket-message-preview ticket-detail-item">
                    <label>Your Message</label>
                    <p>{selectedTicket.message}</p>
                 </div>

                 {selectedTicket.admin_reply && (
                   <div className="ticket-admin-reply">
                      <div className="reply-head">
                        <MessageSquare size={14} /> Official Response
                      </div>
                      <p>{selectedTicket.admin_reply}</p>
                   </div>
                 )}
               </div>
            </div>
            
            <div className="ticket-modal-footer">
               <button className="btn btn-secondary" onClick={() => setSelectedTicket(null)}>Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryList;
