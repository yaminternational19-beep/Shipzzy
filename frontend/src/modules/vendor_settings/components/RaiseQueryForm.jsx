import React, { useState } from 'react';
import { Send, Users, User, Mail, Phone, ChevronRight } from 'lucide-react';
import '../VendorSettings.css';

const RaiseQueryForm = ({ onAddQuery }) => {
  const recipients = [
    { name: 'Admin Panel', email: 'admin@delivery.com', phone: '+91 33333 44444' },
    { name: 'Support Team A', email: 'support@delivery.com', phone: '+91 11111 22222' },
    { name: 'Finance Dept', email: 'finance@delivery.com', phone: '+91 55555 66666' },
    { name: 'Menu Management', email: 'menu@delivery.com', phone: '+91 77777 88888' },
    { name: 'Tech Support', email: 'tech@delivery.com', phone: '+91 99999 00000' },
    { name: 'Account Manager', email: 'am@delivery.com', phone: '+91 22222 33333' }
  ];

  const [formData, setFormData] = useState({
    recipientIndex: 0,
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);

  const vendorScenarios = [
    "Menu update taking too long",
    "Cannot accept orders",
    "App crashing on map screen",
    "Payment payout issue",
    "Account Verification Delay",
    "Missing Reward Points",
    "Product List Update",
    "Order Payment Issue",
    "Other Support Issue"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) return;

    setLoading(true);

    const selectedRecipient = recipients[formData.recipientIndex];

    // Simulate small delay for better UX
    setTimeout(() => {
      const newQuery = {
        id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        ...formData,
        // Current Vendor Metadata (System expected fields)
        userName: 'Burger King',
        userId: 'VND-301',
        userType: 'VENDOR',
        userPhone: '+91 12345 67890',
        userEmail: 'bk@vendor.com',
        // Recipient Metadata
        recipientName: selectedRecipient.name,
        recipientContact: `${selectedRecipient.phone} | ${selectedRecipient.email}`,
        status: 'Open',
        admin_reply: null,
        created_at: new Date().toISOString()
      };

      onAddQuery(newQuery);
      setFormData({
        recipientIndex: 0,
        subject: '',
        message: ''
      });
      setLoading(false);
    }, 500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="query-form-card">
      <div className="query-form-header">
        <h3>Raise a Support Ticket</h3>
        <p>Direct your query to the right department for faster resolution.</p>
      </div>

      <form onSubmit={handleSubmit} className="support-form">
        <div className="form-group">
          <label>Select Recipient Department</label>
          <div className="recipient-grid">
            {recipients.map((dept, index) => (
              <div 
                key={dept.name}
                onClick={() => setFormData(prev => ({ ...prev, recipientIndex: index }))}
                className={`recipient-item ${formData.recipientIndex === index ? 'active' : ''}`}
              >
                <span className="dept-name">
                  {dept.name}
                </span>
                <span className="dept-email">{dept.email}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Query Subject</label>
          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="support-select"
            required
          >
            <option value="" disabled>Select a scenario...</option>
            {vendorScenarios.map(scenario => (
              <option key={scenario} value={scenario}>{scenario}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Message Details</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Please describe your issue clearly..."
            rows="5"
            className="support-textarea"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !formData.subject}
          className="support-submit-btn"
        >
          {loading ? (
             'Sending Ticket...'
          ) : (
            <>
              Send Query to {recipients[formData.recipientIndex].name} <Send size={18} style={{ marginLeft: '8px' }} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default RaiseQueryForm;
