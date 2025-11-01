import React, { useState, useEffect, useRef } from "react";
import { getBills, deleteBill, updateBill } from "../utils/api";
import html2canvas from "html2canvas";
import "./BillsList.css";

// Convert number to words
function numberToWords(num) {
  if (num === 0) return "Zero";
  
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  
  function convertLessThanThousand(n) {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "");
  }
  
  if (num < 1000) return convertLessThanThousand(num);
  if (num < 100000) {
    return convertLessThanThousand(Math.floor(num / 1000)) + " Thousand" + 
           (num % 1000 !== 0 ? " " + convertLessThanThousand(num % 1000) : "");
  }
  if (num < 10000000) {
    return convertLessThanThousand(Math.floor(num / 100000)) + " Lakh" + 
           (num % 100000 !== 0 ? " " + numberToWords(num % 100000) : "");
  }
  return convertLessThanThousand(Math.floor(num / 10000000)) + " Crore" + 
         (num % 10000000 !== 0 ? " " + numberToWords(num % 10000000) : "");
}

function BillsList() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedBill, setEditedBill] = useState(null);
  const [user, setUser] = useState(null);
  const invoiceRef = useRef();

  useEffect(() => {
    fetchBills();
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const fetchBills = async () => {
    try {
      const response = await getBills();
      setBills(response.data);
    } catch (error) {
      console.error("Error fetching bills:", error);
      setError("Failed to fetch bills");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this bill?")) {
      try {
        await deleteBill(id);
        fetchBills();
      } catch (error) {
        console.error("Error deleting bill:", error);
        setError("Failed to delete bill");
      }
    }
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setEditMode(false);
  };

  const handleEditBill = (bill) => {
    setSelectedBill(bill);
    setEditedBill({ ...bill });
    setEditMode(true);
  };

  const handleUpdateBill = async () => {
    try {
      // Recalculate total with updated charges
      const subtotal = editedBill.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const loading = parseFloat(editedBill.loadingCharge) || 0;
      const transport = parseFloat(editedBill.transportCharge) || 0;
      const beforeRoundOff = subtotal + loading + transport;
      const roundedTotal = Math.round(beforeRoundOff);
      const roundOff = roundedTotal - beforeRoundOff;

      await updateBill(editedBill._id, {
        customerName: editedBill.customerName,
        customerMobile: editedBill.customerMobile,
        shipToAddress: editedBill.shipToAddress,
        picture: editedBill.picture || "",
        items: editedBill.items,
        loadingCharge: loading,
        transportCharge: transport,
        roundOff: roundOff,
        totalAmount: roundedTotal,
      });
      alert("Bill updated successfully!");
      setEditMode(false);
      fetchBills();
      setSelectedBill(null);
    } catch (error) {
      console.error("Error updating bill:", error);
      alert("Failed to update bill");
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedBill(null);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...editedBill.items];
    updatedItems[index][field] = field === 'productName' ? value : parseFloat(value) || 0;
    
    // Recalculate total price for the item
    if (field === 'quantity' || field === 'price' || field === 'pic') {
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].price;
    }
    
    setEditedBill({
      ...editedBill,
      items: updatedItems,
    });
  };

  const handleAddItem = () => {
    setEditedBill({
      ...editedBill,
      items: [
        ...editedBill.items,
        {
          productName: "",
          pic: 0,
          quantity: 0,
          price: 0,
          totalPrice: 0,
          calculationType: "weight",
          size: 0,
        },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    const updatedItems = editedBill.items.filter((_, i) => i !== index);
    setEditedBill({
      ...editedBill,
      items: updatedItems,
    });
  };

  const handlePrintOnly = () => {
    window.print();
  };

  const handleSaveAndPrint = () => {
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleExportAsImage = async (saveToDb = false) => {
    if (!invoiceRef.current) return;

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      canvas.toBlob(
        (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = `invoice-${selectedBill.billNumber}.jpeg`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);

          if (saveToDb) {
            alert("Bill saved and exported successfully!");
          }
        },
        "image/jpeg",
        0.95
      );
    } catch (error) {
      console.error("Error exporting image:", error);
      alert("Failed to export image");
    }
  };

  const handleSaveAndExport = () => {
    handleExportAsImage(true);
  };

  const handleExportOnly = () => {
    handleExportAsImage(false);
  };

  if (loading) {
    return <div className="loading">Loading bills...</div>;
  }

  return (
    <div className="bills-list-container">
      {!selectedBill ? (
        <>
          <h1>Bills History</h1>
          {error && <div className="error-message">{error}</div>}

          {bills.length === 0 ? (
            <div className="no-bills">
              <p>No bills created yet. Create your first bill!</p>
            </div>
          ) : (
            <div className="bills-grid">
              {bills.map((bill) => (
                <div key={bill._id} className="bill-card">
                  <div className="bill-card-header">
                    <h3>
                      {bill.customerName 
                        ? bill.customerName 
                        : bill.shipToAddress 
                        ? bill.shipToAddress 
                        : bill.customerMobile 
                        ? bill.customerMobile 
                        : `Bill #${bill.billNumber}`}
                    </h3>
                    <span className="bill-date">
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="bill-card-body">
                    <p>
                      <strong>Bill No:</strong> #{bill.billNumber}
                    </p>
                    {bill.customerName && (
                      <p>
                        <strong>Customer:</strong> {bill.customerName}
                      </p>
                    )}
                    {bill.shipToAddress && (
                      <p>
                        <strong>Address:</strong> {bill.shipToAddress}
                      </p>
                    )}
                    {bill.customerMobile && (
                      <p>
                        <strong>Mobile:</strong> {bill.customerMobile}
                      </p>
                    )}
                    <p>
                      <strong>Items:</strong> {bill.items.length}
                    </p>
                    <p className="bill-total">
                      <strong>Total:</strong> ₹{bill.totalAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="bill-card-actions">
                    <button
                      onClick={() => handleViewBill(bill)}
                      className="btn btn-primary btn-small"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditBill(bill)}
                      className="btn btn-info btn-small"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(bill._id)}
                      className="btn btn-danger btn-small"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="bill-detail-view">
          <div className="bill-detail-header no-print">
            <button
              onClick={() => setSelectedBill(null)}
              className="btn btn-secondary"
            >
              ← Back to List
            </button>
            {editMode ? (
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleUpdateBill} className="btn btn-success">
                  💾 Update Bill
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditMode(true);
                  setEditedBill({ ...selectedBill });
                }}
                className="btn btn-info"
              >
                ✏️ Edit Bill
              </button>
            )}
          </div>

          {/* Cash Memo Design */}
          <div className="invoice-container" ref={invoiceRef}>
            {/* Cash Memo Header */}
            <div className="cash-memo-header">
              <div className="business-info-section">
                <h1 className="business-title">{user?.businessName || "BUSINESS NAME"}</h1>
                <p className="business-address">
                  {selectedBill.shipToAddress || "Business Address Line 1"}
                </p>
                <p className="business-contact">
                  Business Contact: {user?.email || "contact@business.com"} | Tel: {selectedBill.customerMobile || "XXX XXX XXXX"}
                </p>
                <p className="memo-number">Bill #: {selectedBill.billNumber}</p>
                <p className="memo-date">Date: {new Date(selectedBill.createdAt).toLocaleDateString()}</p>
              </div>
              <h2 className="memo-title">CASH MEMO</h2>
            </div>

            {/* Customer Information Display - Always show with labels */}
            {!editMode && (selectedBill.customerName || selectedBill.customerMobile || selectedBill.shipToAddress) && (
              <div style={{ padding: "15px", background: "#fff", marginBottom: "15px", border: "2px solid #007bff", borderRadius: "4px" }}>
                <h4 style={{ marginTop: "0", marginBottom: "12px", color: "#007bff", fontSize: "15px" }}>Customer Information</h4>
                {selectedBill.customerName && (
                  <div style={{ marginBottom: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "#333" }}>Name:</strong>{" "}
                    <span style={{ fontSize: "13px", color: "#666" }}>{selectedBill.customerName}</span>
                  </div>
                )}
                {selectedBill.customerMobile && (
                  <div style={{ marginBottom: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "#333" }}>Mobile:</strong>{" "}
                    <span style={{ fontSize: "13px", color: "#666" }}>{selectedBill.customerMobile}</span>
                  </div>
                )}
                {selectedBill.shipToAddress && (
                  <div style={{ marginBottom: "0" }}>
                    <strong style={{ fontSize: "13px", color: "#333" }}>Address:</strong>{" "}
                    <span style={{ fontSize: "13px", color: "#666" }}>{selectedBill.shipToAddress}</span>
                  </div>
                )}
              </div>
            )}

            {/* Customer Edit Section (Only in Edit Mode) */}
            {editMode && (
              <div className="customer-edit-section no-print">
                <div style={{ 
                  backgroundColor: "#d1ecf1", 
                  border: "1px solid #0c5460", 
                  padding: "10px", 
                  borderRadius: "4px", 
                  marginBottom: "15px",
                  color: "#0c5460"
                }}>
                  ✏️ <strong>Edit Mode:</strong> You can modify all bill information including customer details, products, quantities, prices, and charges.
                </div>
                
                <h3>📝 Edit Customer Info</h3>
                <input
                  type="text"
                  value={editedBill.customerName}
                  onChange={(e) =>
                    setEditedBill({
                      ...editedBill,
                      customerName: e.target.value,
                    })
                  }
                  placeholder="Customer Name"
                  style={{
                    marginBottom: "10px",
                    padding: "8px",
                    width: "100%",
                    border: "2px solid #007bff",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
                <input
                  type="text"
                  value={editedBill.customerMobile}
                  onChange={(e) =>
                    setEditedBill({
                      ...editedBill,
                      customerMobile: e.target.value,
                    })
                  }
                  placeholder="Mobile Number"
                  style={{
                    marginBottom: "10px",
                    padding: "8px",
                    width: "100%",
                    border: "2px solid #007bff",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
                <textarea
                  value={editedBill.shipToAddress}
                  onChange={(e) =>
                    setEditedBill({
                      ...editedBill,
                      shipToAddress: e.target.value,
                    })
                  }
                  placeholder="Ship To Address"
                  rows="3"
                  style={{
                    padding: "8px",
                    width: "100%",
                    border: "2px solid #007bff",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
                
                <h3 style={{ marginTop: "20px" }}>💰 Edit Additional Charges</h3>
                <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                  <div style={{ width: "50%" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>
                      Loading Charge (₹)
                    </label>
                    <input
                      type="number"
                      value={editedBill.loadingCharge || 0}
                      onChange={(e) =>
                        setEditedBill({
                          ...editedBill,
                          loadingCharge: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      style={{
                        padding: "8px",
                        width: "100%",
                        border: "2px solid #28a745",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div style={{ width: "50%" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>
                      Transport Charge (₹)
                    </label>
                    <input
                      type="number"
                      value={editedBill.transportCharge || 0}
                      onChange={(e) =>
                        setEditedBill({
                          ...editedBill,
                          transportCharge: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      style={{
                        padding: "8px",
                        width: "100%",
                        border: "2px solid #28a745",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cash Memo Table */}
            {editMode && (
              <div className="no-print" style={{
                backgroundColor: "#d4edda",
                border: "2px solid #28a745",
                padding: "10px",
                borderRadius: "4px",
                marginBottom: "10px",
                textAlign: "center",
                color: "#155724"
              }}>
                ✏️ <strong>Edit Products Below</strong> - Click on fields to modify items, quantities, and prices
              </div>
            )}
            <table className="cash-memo-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th style={{ textAlign: 'center' }}>PIC</th>
                  <th style={{ textAlign: 'center' }}>QUANTITY</th>
                  <th style={{ textAlign: 'right' }}>PRICE</th>
                  <th style={{ textAlign: 'right' }}>TOTAL</th>
                  {editMode && <th className="no-print">ACTION</th>}
                </tr>
              </thead>
              <tbody>
                {(editMode ? editedBill.items : selectedBill.items).map((item, index) => {
                  // Split product name: "MainProduct|SubProduct1, SubProduct2"
                  let mainProductName = item.productName;
                  let subProductsList = [];
                  
                  if (item.productName.includes('|')) {
                    const parts = item.productName.split('|');
                    mainProductName = parts[0];
                    subProductsList = parts[1].split(', ').map(s => s.trim());
                  }
                  
                  return (
                    <tr key={index}>
                      <td>
                        {editMode ? (
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                            placeholder="Product Name"
                            className="no-print"
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '2px solid #007bff',
                              borderRadius: '4px',
                              fontSize: '14px',
                            }}
                          />
                        ) : (
                          <div>
                            <div style={{ 
                              fontWeight: 'bold', 
                              color: '#000', 
                              fontSize: '14px',
                              marginBottom: subProductsList.length > 0 ? '5px' : '0'
                            }}>
                              {mainProductName}
                            </div>
                            {subProductsList.length > 0 && (
                              <div style={{ 
                                color: '#666', 
                                fontSize: '13px',
                                paddingLeft: '10px'
                              }}>
                                {subProductsList.map((subProd, idx) => (
                                  <div key={idx} style={{ marginBottom: '2px' }}>
                                    • {subProd}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '5px' }}>
                        {editMode ? (
                          <input
                            type="number"
                            value={item.pic || 0}
                            onChange={(e) => handleItemChange(index, 'pic', e.target.value)}
                            placeholder="0"
                            className="no-print"
                            style={{
                              width: '80px',
                              padding: '6px',
                              border: '2px solid #007bff',
                              borderRadius: '4px',
                              textAlign: 'center',
                            }}
                          />
                        ) : (
                          item.pic > 0 ? item.pic : '-'
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {editMode ? (
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            placeholder="0"
                            className="no-print"
                            step="0.01"
                            style={{
                              width: '100px',
                              padding: '6px',
                              border: '2px solid #007bff',
                              borderRadius: '4px',
                              textAlign: 'center',
                            }}
                          />
                        ) : (
                          item.calculationType === "piece" && item.pic > 0 ? (
                            <span title={`${item.pic} pieces × ${(item.size / item.pic).toFixed(0)} = ${item.quantity}`}>
                              {item.quantity}
                            </span>
                          ) : (
                            item.quantity
                          )
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {editMode ? (
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            placeholder="0.00"
                            className="no-print"
                            step="0.01"
                            style={{
                              width: '100px',
                              padding: '6px',
                              border: '2px solid #007bff',
                              borderRadius: '4px',
                              textAlign: 'right',
                            }}
                          />
                        ) : (
                          `₹${item.price.toFixed(2)}`
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {item.calculationType === "piece" && !editMode ? (
                          <span title={`${item.quantity} × ₹${item.price.toFixed(2)} = ₹${item.totalPrice.toFixed(2)}`}>
                            ₹{item.totalPrice.toFixed(2)}
                          </span>
                        ) : (
                          `₹${item.totalPrice.toFixed(2)}`
                        )}
                      </td>
                      {editMode && (
                        <td className="no-print" style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="btn btn-danger btn-small"
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                            }}
                          >
                            🗑️ Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={editMode ? "5" : "4"} style={{ textAlign: "right", fontWeight: "bold", paddingRight: "10px" }}>SUBTOTAL:</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    ₹{((editMode ? editedBill : selectedBill).items.reduce((sum, item) => sum + item.totalPrice, 0)).toFixed(2)}
                  </td>
                  {editMode && <td className="no-print"></td>}
                </tr>
                <tr>
                  <td colSpan={editMode ? "5" : "4"} style={{ textAlign: "right", fontWeight: "bold", paddingRight: "10px" }}>LOADING:</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    ₹{((editMode ? editedBill : selectedBill).loadingCharge || 0).toFixed(2)}
                  </td>
                  {editMode && <td className="no-print"></td>}
                </tr>
                <tr>
                  <td colSpan={editMode ? "5" : "4"} style={{ textAlign: "right", fontWeight: "bold", paddingRight: "10px" }}>TRANSPORT:</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    ₹{((editMode ? editedBill : selectedBill).transportCharge || 0).toFixed(2)}
                  </td>
                  {editMode && <td className="no-print"></td>}
                </tr>
                <tr>
                  <td colSpan={editMode ? "5" : "4"} style={{ textAlign: "right", fontWeight: "bold", paddingRight: "10px" }}>ROUND OFF:</td>
                  <td style={{ textAlign: "right", fontWeight: "bold", color: ((editMode ? editedBill : selectedBill).roundOff || 0) >= 0 ? "#28a745" : "#dc3545" }}>
                    {((editMode ? editedBill : selectedBill).roundOff || 0) >= 0 ? "+" : ""}₹{((editMode ? editedBill : selectedBill).roundOff || 0).toFixed(2)}
                  </td>
                  {editMode && <td className="no-print"></td>}
                </tr>
              </tfoot>
            </table>

            {/* Add Item Button in Edit Mode */}
            {editMode && (
              <div className="no-print" style={{ marginTop: '15px', marginBottom: '15px' }}>
                <button
                  onClick={handleAddItem}
                  className="btn btn-success"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                  }}
                >
                  ➕ Add New Item
                </button>
              </div>
            )}

            {/* Cash Memo Footer */}
            <div className="cash-memo-footer">
              <div className="amount-in-words">
                <strong>AMOUNT IN WORDS:</strong> {numberToWords(Math.floor((editMode ? editedBill : selectedBill).totalAmount))} Rupees Only
              </div>
              <div className="grand-total">
                <strong>G. TOTAL: ₹{((editMode ? editedBill : selectedBill).totalAmount).toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="invoice-actions no-print">
            <button onClick={handleSaveAndPrint} className="btn btn-primary">
              🖨️ Print
            </button>
            <button onClick={handleSaveAndExport} className="btn btn-info">
              📷 Export as JPEG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillsList;
