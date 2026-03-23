import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

/**
 * Exports vendor data to a professional PDF report
 */
export const exportVendorsToPDF = (vendors) => {
    const doc = new jsPDF("landscape", "mm", "a4");

    // Header Styling
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text("Vendor KYC Report", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString();
    doc.text(`Generated on: ${dateStr} at ${timeStr}`, 14, 28);
    
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(14, 32, 283, 32);

    const tableColumn = [
        "ID", 
        "Business Name", 
        "Owner", 
        "Contact", 
        "Location", 
        "Bank Details", 
        "Commercials", 
        "KYC Status"
    ];

    const tableRows = [];

    vendors.forEach(v => {
        const contact = `${v.email}\n${v.country_code || ''} ${v.mobile || ''}`;
        const location = `${v.city}, ${v.state}\n${v.country} - ${v.pincode}`;
        const bank = `${v.bank_name || 'N/A'}\n${v.account_number || 'N/A'}\n${v.ifsc || ''}`;
        const commercials = `Tier: ${v.tier_name || 'Free'}\nComm: ${v.commission_percent || '0'}%\nTurnover: ${v.total_turnover || '0'}`;

        const vendorData = [
            v.vendor_code || "-",
            v.business_name || "-",
            v.owner_name || "-",
            contact,
            location,
            bank,
            commercials,
            (v.kyc_status || "Pending").toUpperCase()
        ];
        tableRows.push(vendorData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 38,
        theme: 'grid',
        styles: { 
            fontSize: 8, 
            cellPadding: 4,
            valign: 'middle',
            overflow: 'linebreak'
        },
        headStyles: { 
            fillColor: [79, 70, 229], // Indigo-600
            textColor: 255, 
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 20 }, // ID
            1: { cellWidth: 40 }, // Business Name
            2: { cellWidth: 30 }, // Owner
            3: { cellWidth: 40 }, // Contact
            4: { cellWidth: 40 }, // Location
            5: { cellWidth: 40 }, // Bank
            6: { cellWidth: 35 }, // Commercials
            7: { cellWidth: 25, halign: 'center' } // Status
        },
        alternateRowStyles: { 
            fillColor: [248, 250, 252] 
        },
        margin: { top: 35 }
    });

    // Add Footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }

    doc.save(`Vendor_KYC_Report_${new Date().getTime()}.pdf`);
};

/**
 * Exports vendor data to a detailed Excel spreadsheet
 */
export const exportVendorsToExcel = (vendors) => {
    const exportData = vendors.map(v => ({
        "Vendor ID": v.vendor_code || "-",
        "Business Name": v.business_name || "-",
        "Owner Name": v.owner_name || "-",
        "Email": v.email || "-",
        "Mobile": `${v.country_code || ''} ${v.mobile || ''}`,
        "Emergency Contact": `${v.emergency_country_code || ''} ${v.emergency_mobile || ''}`,
        "Tier": v.tier_name || "Standard",
        "Commission (%)": v.commission_percent || "0",
        "Total Turnover": v.total_turnover || "0",
        "Address": v.address || "-",
        "City": v.city || "-",
        "State": v.state || "-",
        "Country": v.country || "-",
        "Pincode": v.pincode || "-",
        "Bank Name": v.bank_name || "-",
        "Account Holder": v.account_name || "-",
        "Account Number": v.account_number || "-",
        "IFSC": v.ifsc || "-",
        "KYC Status": v.kyc_status || "Pending",
        "Joined Date": v.created_at ? new Date(v.created_at).toLocaleString() : "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    // Set Column Widths for readability
    const columnWidths = [
        { wch: 15 }, // ID
        { wch: 25 }, // Business Name
        { wch: 20 }, // Owner
        { wch: 30 }, // Email
        { wch: 20 }, // Mobile
        { wch: 20 }, // Emergency
        { wch: 15 }, // Tier
        { wch: 15 }, // Commission
        { wch: 20 }, // Turnover
        { wch: 40 }, // Address
        { wch: 15 }, // City
        { wch: 15 }, // State
        { wch: 15 }, // Country
        { wch: 15 }, // Pincode
        { wch: 20 }, // Bank Name
        { wch: 25 }, // Account Holder
        { wch: 25 }, // Account Number
        { wch: 15 }, // IFSC
        { wch: 15 }, // Status
        { wch: 25 }  // Date
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendor_Data");

    XLSX.writeFile(workbook, `Vendor_Report_${new Date().getTime()}.xlsx`);
};
