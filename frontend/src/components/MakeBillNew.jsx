import React, { useState, useEffect, useRef } from "react";
import { getProducts, createBill, getCustomers } from "../utils/api";
import html2canvas from "html2canvas";
import "./MakeBill.css";

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

function MakeBillNew({ user }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [billData, setBillData] = useState({
    customerName: "",
    customerMobile: "",
    shipToAddress: "",
  });
  const [billItems, setBillItems] = useState([]);
  const [loadingCharge, setLoadingCharge] = useState(0);
  const [transportCharge, setTransportCharge] = useState(0);
  const [manualRoundOff, setManualRoundOff] = useState(null);
  const [isManualRoundOff, setIsManualRoundOff] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [isBillSaved, setIsBillSaved] = useState(false);
  
  const [showCalculationTypePopup, setShowCalculationTypePopup] = useState(false);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [showSubProductPopup, setShowSubProductPopup] = useState(false);
  const [showQuantityModePopup, setShowQuantityModePopup] = useState(false);
  const [showQuantityInputPopup, setShowQuantityInputPopup] = useState(false);
  
  const [selectedCalculationType, setSelectedCalculationType] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSubProducts, setSelectedSubProducts] = useState([]);
  const [quantityMode, setQuantityMode] = useState("");
  const [useSamePriceForAll, setUseSamePriceForAll] = useState(false);
  const [commonPrice, setCommonPrice] = useState("");
  const [quantityData, setQuantityData] = useState({});
  const [manualSubProductName, setManualSubProductName] = useState("");
  const [manualSubProductPrice, setManualSubProductPrice] = useState("");
  const [manualSubProductSize, setManualSubProductSize] = useState("");
  const [manualSubProductPieces, setManualSubProductPieces] = useState("");
  
  const billRef = useRef();

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      console.log('Fetched products:', response.data.length, 'products');
      console.log('Sample product structure:', response.data[0]);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await getCustomers();
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleCustomerNameChange = (value) => {
    setBillData({ ...billData, customerName: value });
    if (value.trim()) {
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(value.toLowerCase())
      );
      setCustomerSuggestions(filtered);
      setShowCustomerSuggestions(filtered.length > 0);
    } else {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
    }
  };

  const selectCustomer = (customer) => {
    setBillData({
      ...billData,
      customerName: customer.name,
      customerMobile: customer.mobile || "",
      shipToAddress: customer.address || "",
    });
    setShowCustomerSuggestions(false);
  };

  const openAddProductFlow = () => {
    setShowCalculationTypePopup(true);
  };

  const selectCalculationType = (type) => {
    setSelectedCalculationType(type);
    console.log('All products:', products.map(p => ({
      name: p.mainProduct,
      calculationType: p.calculationType,
      hasField: 'calculationType' in p
    })));
    
    const filtered = products.filter(p => {
      const productType = p.calculationType || 'weight';
      return productType === type;
    });
    
    console.log(`Filtered ${type} products:`, filtered.map(p => p.mainProduct));
    
    setFilteredProducts(filtered);
    setShowCalculationTypePopup(false);
    setShowProductPopup(true);
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setShowProductPopup(false);
    
    if (!product.subProducts || product.subProducts.length === 0) {
      setSelectedSubProducts([]);
      setQuantityMode("main");
      setQuantityData({
        main: {
          pic: "",
          quantity: "",
          price: "",
        }
      });
      setShowQuantityInputPopup(true);
    } else {
      setShowSubProductPopup(true);
    }
  };

  const handleSubProductToggle = (subProduct) => {
    setSelectedSubProducts(prev => {
      const exists = prev.find(sp => sp._id === subProduct._id);
      if (exists) {
        return prev.filter(sp => sp._id !== subProduct._id);
      } else {
        return [...prev, subProduct];
      }
    });
  };

  const addManualSubProduct = () => {
    if (!manualSubProductName.trim()) {
      alert("Please enter sub-product name");
      return;
    }
    if (selectedCalculationType === "piece") {
      if (!manualSubProductSize) {
        alert("Please enter size for piece-based product");
        return;
      }
      if (!manualSubProductPieces) {
        alert("Please enter number of pieces");
        return;
      }
    }

    const size = selectedCalculationType === "piece" ? parseFloat(manualSubProductSize) : 0;
    const pieces = selectedCalculationType === "piece" ? parseFloat(manualSubProductPieces) : 0;
    const totalFeet = size * pieces;

    const newSubProduct = {
      _id: `manual-${Date.now()}`,
      name: manualSubProductName,
      price: 0,
      size: size,
      manualPieces: pieces,
      manualTotalFeet: totalFeet,
    };

    setSelectedSubProducts(prev => [...prev, newSubProduct]);
    
    if (selectedCalculationType === "piece") {
      setQuantityData(prev => ({
        ...prev,
        [newSubProduct._id]: {
          pic: pieces,
          quantity: totalFeet,
          price: ""
        }
      }));
    } else {
      setQuantityData(prev => ({
        ...prev,
        [newSubProduct._id]: {
          pic: "",
          quantity: "",
          price: ""
        }
      }));
    }
    
    setManualSubProductName("");
    setManualSubProductSize("");
    setManualSubProductPieces("");
    
    alert("Manual sub-product added! You can enter the price in the next step.");
  };

  const confirmSubProducts = () => {
    if (selectedSubProducts.length === 0) {
      alert("Please select at least one sub-product or add manually");
      return;
    }
    setShowSubProductPopup(false);
    setShowQuantityModePopup(true);
  };

  const selectQuantityMode = (mode) => {
    setQuantityMode(mode);
    setShowQuantityModePopup(false);
    
    if (mode === "individual") {
      const initialData = {};
      selectedSubProducts.forEach(sp => {
        initialData[sp._id] = {
          pic: "",
          quantity: "",
          price: sp.price || "",
          size: sp.size || 0,
        };
      });
      setQuantityData(initialData);
    } else {
      setQuantityData({
        main: {
          pic: "",
          quantity: "",
          price: "",
        }
      });
    }
    
    setShowQuantityInputPopup(true);
  };

  const handleQuantityInputChange = (key, field, value) => {
    setQuantityData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      }
    }));
  };

  const calculatePieceQuantity = (key) => {
    const data = quantityData[key];
    if (data.pic && data.size) {
      const totalFeet = parseFloat(data.pic) * parseFloat(data.size);
      setQuantityData(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          quantity: totalFeet.toString(),
        }
      }));
    }
  };

  const addItemToBill = () => {
    if (quantityMode === "individual") {
      const newItems = selectedSubProducts.map(sp => {
        const data = quantityData[sp._id];
        const qty = parseFloat(data.quantity) || 0;
        const price = parseFloat(data.price) || 0;
        const pic = parseFloat(data.pic) || 0;
        
        return {
          productName: `${selectedProduct.mainProduct} | ${sp.name}`,
          quantity: qty,
          pic: pic,
          price: price,
          totalPrice: qty * price,
          calculationType: selectedCalculationType,
          size: data.size || 0,
        };
      });
      
      setBillItems([...billItems, ...newItems]);
    } else {
      const data = quantityData.main;
      const qty = parseFloat(data.quantity) || 0;
      const price = parseFloat(data.price) || 0;
      const pic = parseFloat(data.pic) || 0;
      
      const subProductNames = selectedSubProducts.length > 0 
        ? selectedSubProducts.map(sp => sp.name).join(", ")
        : "";
      
      const item = {
        productName: subProductNames 
          ? `${selectedProduct.mainProduct} | ${subProductNames}`
          : selectedProduct.mainProduct,
        quantity: qty,
        pic: pic,
        price: price,
        totalPrice: qty * price,
        calculationType: selectedCalculationType,
        size: 0,
      };
      
      setBillItems([...billItems, item]);
    }
    
    resetPopupFlow();
  };

  const resetPopupFlow = () => {
    setShowCalculationTypePopup(false);
    setShowProductPopup(false);
    setShowSubProductPopup(false);
    setShowQuantityModePopup(false);
    setShowQuantityInputPopup(false);
    setSelectedCalculationType("");
    setFilteredProducts([]);
    setSelectedProduct(null);
    setSelectedSubProducts([]);
    setQuantityMode("");
    setQuantityData({});
  };

  const removeItem = (index) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const loading = parseFloat(loadingCharge) || 0;
    const transport = parseFloat(transportCharge) || 0;
    const beforeRoundOff = subtotal + loading + transport;
    
    let roundOff, roundedTotal;
    if (isManualRoundOff && manualRoundOff !== null) {
      roundOff = parseFloat(manualRoundOff) || 0;
      roundedTotal = beforeRoundOff + roundOff;
    } else {
      roundedTotal = Math.round(beforeRoundOff);
      roundOff = roundedTotal - beforeRoundOff;
    }
    
    return { subtotal, loading, transport, roundOff, roundedTotal };
  };

  const handleSaveBill = async () => {
    if (billItems.length === 0) {
      alert("Please add at least one item to the bill");
      return;
    }

    // Validate mobile number if provided
    if (billData.customerMobile && billData.customerMobile.length !== 10) {
      alert("Mobile number must be exactly 10 digits");
      return;
    }

    const totals = calculateTotals();
    
    try {
      const billPayload = {
        customerName: billData.customerName,
        customerMobile: billData.customerMobile,
        shipToAddress: billData.shipToAddress,
        items: billItems,
        loadingCharge: totals.loading,
        transportCharge: totals.transport,
        roundOff: totals.roundOff,
        totalAmount: totals.roundedTotal,
      };

      await createBill(billPayload);
      alert("Bill created successfully!");
      setIsBillSaved(true); // Mark bill as saved to hide customer info from export
      
      // Don't reset immediately - let user export/print the saved bill first
      // They can manually refresh or create a new bill
    } catch (error) {
      console.error("Error creating bill:", error);
      alert("Failed to create bill");
    }
  };

  const handleExportAsImage = async () => {
    if (billItems.length === 0) {
      alert("Please add at least one item to the bill before exporting");
      return;
    }

    if (!billRef.current) return;

    try {
      const canvas = await html2canvas(billRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `bill-${Date.now()}.jpeg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, "image/jpeg");
    } catch (error) {
      console.error("Error exporting image:", error);
      alert("Failed to export image");
    }
  };

  const handlePrint = () => {
    if (billItems.length === 0) {
      alert("Please add at least one item to the bill before printing");
      return;
    }
    window.print();
  };

  const totals = calculateTotals();

  return (
    <div className="make-bill-container">
      <h1>Create New Bill</h1>

      {/* Bill Preview - THIS GETS EXPORTED/PRINTED */}
      <div className="invoice-container" ref={billRef}>
        {/* Business Header */}
        <div className="cash-memo-header">
          <div className="business-info-section">
            <h1 className="business-title">{user?.businessName || "STORE"}</h1>
            <p className="business-contact">
              {user?.address || "123,punagam,surat"}
            </p>
            <p className="business-contact">
              Business Contact: {user?.email || "omdesai101@gmail.com"} | Tel: {user?.phone || "88995534566"}
            </p>
            <p className="business-contact" style={{ fontSize: "14px", marginTop: "5px" }}>
              Bill #: BILL-{Date.now()}-{Math.floor(Math.random() * 10000)}
            </p>
            <p className="business-contact" style={{ fontSize: "14px" }}>
              Date: {new Date().toLocaleDateString('en-GB')}
            </p>
            <h2 className="memo-title">CASH MEMO</h2>
          </div>
        </div>

        {/* Customer Info Input Section - INSIDE Bill Memo - Only show when NOT saved */}
        {!isBillSaved && (
          <div style={{ padding: "15px", background: "#f8f9fa", marginBottom: "15px", border: "1px solid #ddd", borderRadius: "4px" }}>
            <div style={{ marginBottom: "10px", position: "relative" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>
                Customer Name: <span style={{ color: "#999", fontSize: "11px" }}>(Optional)</span>
              </label>
              <input
                type="text"
                value={billData.customerName}
                onChange={(e) => handleCustomerNameChange(e.target.value)}
                onFocus={() => {
                  // Show all customers when clicking on the field
                  if (customers.length > 0) {
                    setCustomerSuggestions(customers);
                    setShowCustomerSuggestions(true);
                  }
                }}
                onClick={() => {
                  // Also show on click
                  if (customers.length > 0) {
                    setCustomerSuggestions(customers);
                    setShowCustomerSuggestions(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                placeholder="Enter customer name"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
              {showCustomerSuggestions && customerSuggestions.length > 0 && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 1000,
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}>
                  {customerSuggestions.map((customer, idx) => (
                    <div
                      key={idx}
                      onMouseDown={() => selectCustomer(customer)}
                      style={{
                        padding: "10px",
                        cursor: "pointer",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                      onMouseEnter={(e) => e.target.style.background = "#f0f0f0"}
                      onMouseLeave={(e) => e.target.style.background = "white"}
                    >
                      <div style={{ fontWeight: "bold" }}>{customer.name}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {customer.mobile} - {customer.address}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>
                Mobile Number: <span style={{ color: "#999", fontSize: "11px" }}>(Optional)</span>
              </label>
              <input
                type="tel"
                value={billData.customerMobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    setBillData({ ...billData, customerMobile: value });
                  }
                }}
                placeholder="Enter 10-digit mobile number"
                maxLength="10"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
              {billData.customerMobile && billData.customerMobile.length !== 10 && (
                <span style={{ color: "#dc3545", fontSize: "11px" }}>
                  Must be 10 digits
                </span>
              )}
            </div>

            <div style={{ marginBottom: "0" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>
                Address: <span style={{ color: "#999", fontSize: "11px" }}>(Optional)</span>
              </label>
              <textarea
                value={billData.shipToAddress}
                onChange={(e) => setBillData({ ...billData, shipToAddress: e.target.value })}
                placeholder="Enter address"
                rows="2"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>
        )}

        {/* Customer Info Display Section - Show with labels when saved */}
        {isBillSaved && (billData.customerName || billData.customerMobile || billData.shipToAddress) && (
          <div style={{ padding: "15px", background: "#fff", marginBottom: "15px", border: "2px solid #007bff", borderRadius: "4px" }}>
            <h4 style={{ marginTop: "0", marginBottom: "12px", color: "#007bff", fontSize: "15px" }}>Customer Information</h4>
            {billData.customerName && (
              <div style={{ marginBottom: "8px" }}>
                <strong style={{ fontSize: "13px", color: "#333" }}>Name:</strong>{" "}
                <span style={{ fontSize: "13px", color: "#666" }}>{billData.customerName}</span>
              </div>
            )}
            {billData.customerMobile && (
              <div style={{ marginBottom: "8px" }}>
                <strong style={{ fontSize: "13px", color: "#333" }}>Mobile:</strong>{" "}
                <span style={{ fontSize: "13px", color: "#666" }}>{billData.customerMobile}</span>
              </div>
            )}
            {billData.shipToAddress && (
              <div style={{ marginBottom: "0" }}>
                <strong style={{ fontSize: "13px", color: "#333" }}>Address:</strong>{" "}
                <span style={{ fontSize: "13px", color: "#666" }}>{billData.shipToAddress}</span>
              </div>
            )}
          </div>
        )}

        {/* Products Section */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3>Products</h3>
            <button
              onClick={openAddProductFlow}
              style={{
                padding: "10px 20px",
                background: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              ➕ Add Product
            </button>
          </div>

          <table className="cash-memo-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th style={{ textAlign: "center" }}>PIC</th>
                <th style={{ textAlign: "center" }}>QUANTITY</th>
                <th style={{ textAlign: "right" }}>PRICE</th>
                <th style={{ textAlign: "right" }}>TOTAL</th>
                <th style={{ textAlign: "center" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {billItems.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                    No items added yet. Click "Add Product" to start
                  </td>
                </tr>
              ) : (
                billItems.map((item, idx) => {
                  // Split product name to show main product and sub-products separately
                  const [mainProduct, ...subProducts] = item.productName.split(" | ");
                  
                  return (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: "bold", marginBottom: subProducts.length > 0 ? "4px" : "0" }}>
                          {mainProduct}
                        </div>
                        {subProducts.length > 0 && (
                          <div style={{ fontSize: "12px", color: "#666", paddingLeft: "8px" }}>
                            • {subProducts.join(" | ")}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>{item.pic > 0 ? item.pic : "-"}</td>
                      <td style={{ textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>₹{item.price.toFixed(2)}</td>
                      <td style={{ textAlign: "right" }}>₹{item.totalPrice.toFixed(2)}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => removeItem(idx)}
                          style={{
                            padding: "4px 8px",
                            background: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold" }}>SUBTOTAL:</td>
                <td colSpan="2" style={{ textAlign: "right", fontWeight: "bold" }}>₹{totals.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold" }}>
                  LOADING:
                  <input
                    type="number"
                    value={loadingCharge}
                    onChange={(e) => setLoadingCharge(e.target.value)}
                    step="0.01"
                    min="0"
                    style={{
                      width: "100px",
                      marginLeft: "10px",
                      padding: "4px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </td>
                <td colSpan="2" style={{ textAlign: "right", fontWeight: "bold" }}>₹{totals.loading.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold" }}>
                  TRANSPORT:
                  <input
                    type="number"
                    value={transportCharge}
                    onChange={(e) => setTransportCharge(e.target.value)}
                    step="0.01"
                    min="0"
                    style={{
                      width: "100px",
                      marginLeft: "10px",
                      padding: "4px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </td>
                <td colSpan="2" style={{ textAlign: "right", fontWeight: "bold" }}>₹{totals.transport.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold" }}>
                  ROUND OFF:
                  <button
                    onClick={() => {
                      setIsManualRoundOff(!isManualRoundOff);
                      if (!isManualRoundOff) {
                        // When switching to manual, set current auto value
                        setManualRoundOff(totals.roundOff.toFixed(2));
                      } else {
                        // When switching back to auto, clear manual value
                        setManualRoundOff(null);
                      }
                    }}
                    style={{
                      marginLeft: "10px",
                      padding: "4px 8px",
                      background: isManualRoundOff ? "#ffc107" : "#e9ecef",
                      color: isManualRoundOff ? "#000" : "#666",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                    title={isManualRoundOff ? "Switch to Auto" : "Switch to Manual"}
                  >
                    {isManualRoundOff ? "✏️ Manual" : "🔄 Auto"}
                  </button>
                </td>
                <td colSpan="2" style={{ textAlign: "right", fontWeight: "bold" }}>
                  {isManualRoundOff ? (
                    <input
                      type="number"
                      value={manualRoundOff || ""}
                      onChange={(e) => setManualRoundOff(e.target.value)}
                      step="0.01"
                      style={{
                        width: "100px",
                        padding: "4px",
                        border: "2px solid #ffc107",
                        borderRadius: "4px",
                        textAlign: "right",
                        fontWeight: "bold",
                        background: "#fff9e6",
                      }}
                      placeholder="0.00"
                    />
                  ) : (
                    <span style={{ color: totals.roundOff >= 0 ? "#28a745" : "#dc3545" }}>
                      {totals.roundOff >= 0 ? "+" : ""}₹{totals.roundOff.toFixed(2)}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="cash-memo-footer">
          <div className="amount-in-words">
            <strong>AMOUNT IN WORDS:</strong> {numberToWords(Math.floor(totals.roundedTotal))} Rupees Only
          </div>
          <div className="grand-total">
            <strong>G. TOTAL: ₹{totals.roundedTotal.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="no-print" style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
        {isBillSaved ? (
          <button
            onClick={() => {
              // Reset for new bill
              setBillData({ customerName: "", customerMobile: "", shipToAddress: "" });
              setBillItems([]);
              setLoadingCharge(0);
              setTransportCharge(0);
              setManualRoundOff(null);
              setIsManualRoundOff(false);
              setIsBillSaved(false);
            }}
            style={{
              padding: "12px 30px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            📝 Create New Bill
          </button>
        ) : (
          <button
            onClick={handleSaveBill}
            style={{
              padding: "12px 30px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            💾 Save Bill
          </button>
        )}
        <button
          onClick={handleExportAsImage}
          style={{
            padding: "12px 30px",
            background: "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          📸 Export as Image
        </button>
        <button
          onClick={handlePrint}
          style={{
            padding: "12px 30px",
            background: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          🖨️ Print
        </button>
      </div>

      {/* Popup 1: Calculation Type Selection */}
      {showCalculationTypePopup && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000,
        }}>
          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "8px",
            maxWidth: "500px",
            width: "90%",
          }}>
            <h2>Select Calculation Type</h2>
            <div style={{ display: "flex", gap: "20px", marginTop: "30px" }}>
              <button
                onClick={() => selectCalculationType("piece")}
                style={{
                  flex: 1,
                  padding: "40px 20px",
                  background: "#fff3cd",
                  border: "2px solid #ffc107",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#856404",
                }}
              >
                📏 Piece Based (Roofing Sheets)
              </button>
              <button
                onClick={() => selectCalculationType("weight")}
                style={{
                  flex: 1,
                  padding: "40px 20px",
                  background: "#d1ecf1",
                  border: "2px solid #17a2b8",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#0c5460",
                }}
              >
                ⚖️ Weight Based(Pipe and etc.)
              </button>
            </div>
            <button
              onClick={resetPopupFlow}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Popup 2: Product Selection */}
      {showProductPopup && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000,
        }}>
          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "8px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
          }}>
            <h2>Select Product ({selectedCalculationType === "piece" ? "Piece Based" : "Weight Based"})</h2>
            <div style={{ marginTop: "20px", display: "grid", gap: "15px" }}>
              {filteredProducts.length === 0 ? (
                <p style={{ textAlign: "center", color: "#999", padding: "40px" }}>
                  No {selectedCalculationType}-based products found
                </p>
              ) : (
                filteredProducts.map(product => (
                  <button
                    key={product._id}
                    onClick={() => selectProduct(product)}
                    style={{
                      padding: "20px",
                      background: "#f8f9fa",
                      border: "2px solid #007bff",
                      borderRadius: "8px",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    {product.mainProduct}
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "5px", fontWeight: "normal" }}>
                      {product.subProducts.length} sub-products available
                    </div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => {
                setShowProductPopup(false);
                setShowCalculationTypePopup(true);
              }}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Popup 3: Sub-Product Selection */}
      {showSubProductPopup && selectedProduct && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000,
        }}>
          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "8px",
            maxWidth: "900px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
          }}>
            <h2>Select Sub-Products</h2>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              Product: <strong>{selectedProduct.mainProduct}</strong>
            </p>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(3, 1fr)", 
              gap: "15px" 
            }}>
              {selectedProduct.subProducts.map(subProduct => (
                <div
                  key={subProduct._id}
                  onClick={() => handleSubProductToggle(subProduct)}
                  style={{
                    padding: "12px",
                    background: selectedSubProducts.find(sp => sp._id === subProduct._id) ? "#d4edda" : "#f8f9fa",
                    border: selectedSubProducts.find(sp => sp._id === subProduct._id) ? "2px solid #28a745" : "2px solid #ddd",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    minHeight: "80px",
                  }}
                >
                  {selectedSubProducts.find(sp => sp._id === subProduct._id) && (
                    <span style={{ 
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      color: "#28a745", 
                      fontSize: "20px",
                      fontWeight: "bold"
                    }}>✓</span>
                  )}
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "5px" }}>
                      {subProduct.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#666" }}>
                      {selectedCalculationType === "piece" && (
                        <div>Size: {subProduct.size} ft</div>
                      )}
                      <div>Price: ₹{subProduct.price.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Manual Sub-Product Entry */}
            <div style={{ 
              marginTop: "25px", 
              padding: "15px", 
              background: "#fff9e6", 
              border: "2px dashed #ffc107",
              borderRadius: "8px" 
            }}>
              <h3 style={{ marginBottom: "15px", fontSize: "16px", color: "#856404" }}>
                ➕ Add Custom Sub-Product
              </h3>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: selectedCalculationType === "piece" ? "repeat(3, 1fr)" : "1fr", 
                gap: "10px", 
                marginBottom: "10px" 
              }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={manualSubProductName}
                    onChange={(e) => setManualSubProductName(e.target.value)}
                    placeholder="Sub-product name"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "13px",
                    }}
                  />
                </div>
                {selectedCalculationType === "piece" && (
                  <>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                        Size (ft) *
                      </label>
                      <input
                        type="number"
                        value={manualSubProductSize}
                        onChange={(e) => setManualSubProductSize(e.target.value)}
                        placeholder="Size in feet"
                        step="any"
                        min="0"
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "13px",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                        Pieces *
                      </label>
                      <input
                        type="number"
                        value={manualSubProductPieces}
                        onChange={(e) => setManualSubProductPieces(e.target.value)}
                        placeholder="Number of pieces"
                        step="1"
                        min="0"
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "13px",
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
              
              {/* Show Total Feet Calculation for Piece-Based */}
              {selectedCalculationType === "piece" && manualSubProductSize && manualSubProductPieces && (
                <div style={{ 
                  padding: "10px", 
                  background: "#e7f3ff", 
                  borderRadius: "4px", 
                  marginBottom: "10px",
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: "#0056b3"
                }}>
                  📐 Total Feet: {(parseFloat(manualSubProductSize) * parseFloat(manualSubProductPieces)).toFixed(2)} ft
                </div>
              )}
              
              <button
                onClick={addManualSubProduct}
                style={{
                  padding: "8px 20px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "bold",
                }}
              >
                ➕ Add to Selection
              </button>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  setShowSubProductPopup(false);
                  setShowProductPopup(true);
                  setSelectedSubProducts([]);
                }}
                style={{
                  flex: 1,
                  padding: "10px 20px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
              <button
                onClick={confirmSubProducts}
                style={{
                  flex: 1,
                  padding: "10px 20px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup 4: Quantity Mode Selection */}
      {showQuantityModePopup && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000,
        }}>
          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "8px",
            maxWidth: "500px",
            width: "90%",
          }}>
            <h2>Select Quantity Mode</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "30px" }}>
              <button
                onClick={() => selectQuantityMode("main")}
                style={{
                  padding: "30px 20px",
                  background: "#e7f3ff",
                  border: "2px solid #007bff",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#0056b3",
                }}
              >
                📦 Main Product Quantity
                <div style={{ fontSize: "12px", fontWeight: "normal", marginTop: "5px", color: "#666" }}>
                  Enter single quantity for all selected sub-products
                </div>
              </button>
              <button
                onClick={() => selectQuantityMode("individual")}
                style={{
                  padding: "30px 20px",
                  background: "#f3e5ff",
                  border: "2px solid #6f42c1",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#6f42c1",
                }}
              >
                📋 Individual Sub-Product Quantities
                <div style={{ fontSize: "12px", fontWeight: "normal", marginTop: "5px", color: "#666" }}>
                  Enter separate quantities for each sub-product
                </div>
              </button>
            </div>
            <button
              onClick={() => {
                setShowQuantityModePopup(false);
                setShowSubProductPopup(true);
              }}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Popup 5: Quantity Input */}
      {showQuantityInputPopup && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000,
        }}>
          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "8px",
            maxWidth: "700px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
          }}>
            <h2>Enter Quantities</h2>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              Product: <strong>{selectedProduct.mainProduct}</strong> |{" "}
              Mode: <strong>{quantityMode === "main" ? "Main Product" : "Individual"}</strong>
            </p>

            {quantityMode === "individual" ? (
              <>
                {/* Same Price for All Option - Helper Tool */}
                <div style={{
                  padding: "15px",
                  background: "#e7f3ff",
                  border: "2px solid #007bff",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#0056b3" }}>
                    ⚡ Quick Fill - Same Price for All
                  </h4>
                  <p style={{ fontSize: "12px", color: "#666", margin: "0 0 10px 0" }}>
                    Enter a price below to apply it to all sub-products at once. You can still edit individual prices afterwards.
                  </p>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                        {selectedCalculationType === "piece" ? "Price per Foot:" : "Price per KG:"}
                      </label>
                      <input
                        type="number"
                        value={commonPrice}
                        onChange={(e) => setCommonPrice(e.target.value)}
                        placeholder="Enter price"
                        step="0.01"
                        min="0"
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "2px solid #007bff",
                          borderRadius: "4px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!commonPrice) {
                          alert("Please enter a price first");
                          return;
                        }
                        // Apply to all sub-products
                        const updatedData = { ...quantityData };
                        selectedSubProducts.forEach(sp => {
                          updatedData[sp._id] = {
                            ...updatedData[sp._id],
                            price: commonPrice,
                          };
                        });
                        setQuantityData(updatedData);
                        alert("Price applied to all sub-products!");
                      }}
                      style={{
                        padding: "10px 20px",
                        background: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "13px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Apply to All
                    </button>
                  </div>
                </div>

                {/* Sub-Products Grid - 3 Columns */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "15px",
                }}>
                  {selectedSubProducts.map(sp => (
                    <div key={sp._id} style={{
                      padding: "15px",
                      background: "#f8f9fa",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                    }}>
                      <h4 style={{ marginBottom: "10px", fontSize: "14px" }}>{sp.name}</h4>
                      
                      {selectedCalculationType === "piece" && (
                        <div style={{ marginBottom: "10px" }}>
                          <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                            No. Pieces:
                          </label>
                          <div style={{ display: "flex", gap: "5px" }}>
                            <input
                              type="number"
                              value={quantityData[sp._id]?.pic || ""}
                              onChange={(e) => handleQuantityInputChange(sp._id, "pic", e.target.value)}
                              placeholder="0"
                              step="any"
                              min="0"
                              style={{
                                flex: 1,
                                padding: "6px",
                                border: "2px solid #007bff",
                                borderRadius: "4px",
                                fontSize: "13px",
                              }}
                            />
                            <button
                              onClick={() => calculatePieceQuantity(sp._id)}
                              style={{
                                padding: "6px 10px",
                                background: "#2196F3",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "11px",
                                fontWeight: "bold",
                              }}
                            >
                              🧮
                            </button>
                          </div>
                          <div style={{ fontSize: "10px", color: "#2196F3", marginTop: "2px" }}>
                            Size: {sp.size} ft
                          </div>
                        </div>
                      )}
                      
                      {selectedCalculationType === "weight" && (
                        <div style={{ marginBottom: "10px" }}>
                          <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                            Pic (Optional):
                          </label>
                          <input
                            type="number"
                            value={quantityData[sp._id]?.pic || ""}
                            onChange={(e) => handleQuantityInputChange(sp._id, "pic", e.target.value)}
                            placeholder="0"
                            step="any"
                            min="0"
                            style={{
                              width: "100%",
                              padding: "6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "13px",
                            }}
                          />
                        </div>
                      )}
                      
                      <div style={{ marginBottom: "10px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                          {selectedCalculationType === "piece" ? "Total Feet:" : "Quantity (KG):"}
                        </label>
                        <input
                          type="number"
                          value={quantityData[sp._id]?.quantity || ""}
                          onChange={(e) => handleQuantityInputChange(sp._id, "quantity", e.target.value)}
                          placeholder="0"
                          step="any"
                          min="0"
                          readOnly={selectedCalculationType === "piece"}
                          style={{
                            width: "100%",
                            padding: "6px",
                            border: selectedCalculationType === "piece" ? "2px solid #28a745" : "2px solid #007bff",
                            borderRadius: "4px",
                            fontSize: "13px",
                            background: selectedCalculationType === "piece" ? "#e8f5e9" : "white",
                            cursor: selectedCalculationType === "piece" ? "not-allowed" : "text",
                          }}
                        />
                      </div>
                      
                      <div style={{ marginBottom: "10px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
                          {selectedCalculationType === "piece" ? "Price/Foot:" : "Price/KG:"} 
                          <span style={{ color: "#dc3545" }}>*</span>
                        </label>
                        <input
                          type="number"
                          value={quantityData[sp._id]?.price || ""}
                          onChange={(e) => handleQuantityInputChange(sp._id, "price", e.target.value)}
                          placeholder="Enter price here"
                          step="0.01"
                          min="0"
                          style={{
                            width: "100%",
                            padding: "6px",
                            border: "2px solid #28a745",
                            borderRadius: "4px",
                            fontSize: "13px",
                            background: "#ffffff",
                            cursor: "pointer",
                          }}
                        />
                      </div>
                      
                      <div style={{ padding: "8px", background: "#e7f3ff", borderRadius: "4px", fontSize: "12px" }}>
                        <strong>Total:</strong> ₹
                        {((parseFloat(quantityData[sp._id]?.quantity) || 0) * (parseFloat(quantityData[sp._id]?.price) || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{
                padding: "20px",
                background: "#f8f9fa",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}>
                <h4 style={{ marginBottom: "15px" }}>
                  All Sub-Products: {selectedSubProducts.map(sp => sp.name).join(", ")}
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: selectedCalculationType === "piece" ? "1fr 1fr 1fr" : "1fr 1fr", gap: "15px" }}>
                  {selectedCalculationType === "weight" && (
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "bold" }}>
                        Pic (Optional):
                      </label>
                      <input
                        type="number"
                        value={quantityData.main?.pic || ""}
                        onChange={(e) => handleQuantityInputChange("main", "pic", e.target.value)}
                        placeholder="0"
                        step="any"
                        min="0"
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  )}
                  
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "bold" }}>
                      {selectedCalculationType === "piece" ? "Quantity (Total Feet):" : "Quantity (KG):"}
                    </label>
                    <input
                      type="number"
                      value={quantityData.main?.quantity || ""}
                      onChange={(e) => handleQuantityInputChange("main", "quantity", e.target.value)}
                      placeholder="0"
                      step="any"
                      min="0"
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "2px solid #007bff",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: "bold" }}>
                      {selectedCalculationType === "piece" ? "Price per Foot:" : "Price per KG:"}
                    </label>
                    <input
                      type="number"
                      value={quantityData.main?.price || ""}
                      onChange={(e) => handleQuantityInputChange("main", "price", e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "2px solid #28a745",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: "15px", padding: "15px", background: "#e7f3ff", borderRadius: "4px", fontSize: "18px" }}>
                  <strong>Total:</strong> ₹
                  {((parseFloat(quantityData.main?.quantity) || 0) * (parseFloat(quantityData.main?.price) || 0)).toFixed(2)}
                </div>
              </div>
            )}

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  setShowQuantityInputPopup(false);
                  setShowQuantityModePopup(true);
                }}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
              <button
                onClick={addItemToBill}
                style={{
                  flex: 2,
                  padding: "12px 20px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                ✓ Add to Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MakeBillNew;
