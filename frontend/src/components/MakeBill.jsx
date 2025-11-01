import React, { useState, useEffect, useRef } from "react";
import { getProducts, createBill, searchCustomers, getCustomers } from "../utils/api";
import html2canvas from "html2canvas";
import "./MakeBill.css";

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

function MakeBill({ user }) {
  const [products, setProducts] = useState([]);
  const [billData, setBillData] = useState({
    customerName: "",
    customerMobile: "",
    shipToAddress: "",
  });
  const [billItems, setBillItems] = useState([]);
  const [loadingCharge, setLoadingCharge] = useState(0);
  const [transportCharge, setTransportCharge] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [selectedMainProduct, setSelectedMainProduct] = useState("");
  const [selectedSubProducts, setSelectedSubProducts] = useState([]);
  const [mainProductQuantity, setMainProductQuantity] = useState("");
  const [mainProductPic, setMainProductPic] = useState("");
  const [mainProductPrice, setMainProductPrice] = useState("");
  const [availableSubProducts, setAvailableSubProducts] = useState([]);
  const [currentCalculationType, setCurrentCalculationType] = useState("weight");
  const [quantityMode, setQuantityMode] = useState("main"); // "main" or "individual"
  const [subProductQuantities, setSubProductQuantities] = useState({}); // {subProductName: quantity}
  const [subProductPics, setSubProductPics] = useState({}); // {subProductName: pic}
  const [subProductPrices, setSubProductPrices] = useState({}); // {subProductName: price}
  const [subProductSizes, setSubProductSizes] = useState({}); // {subProductName: size} for piece-based
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherSubProductName, setOtherSubProductName] = useState("");
  const [otherSubProductSize, setOtherSubProductSize] = useState("");
  const billRef = useRef();

  useEffect(() => {
    fetchProducts();
    fetchAllCustomers();
  }, []);

  // Manual calculate quantity for piece-based products
  const handleCalculateQuantity = () => {
    if (currentCalculationType === "piece" && mainProductPic && selectedSubProducts.length > 0) {
      let totalSize = 0;
      for (const subProdName of selectedSubProducts) {
        const subProd = availableSubProducts.find(sp => sp.name === subProdName);
        if (subProd && subProd.size) {
          totalSize += subProd.size * parseFloat(mainProductPic);
        }
      }
      setMainProductQuantity(totalSize.toString());
      alert(`Total calculated: ${totalSize} (${mainProductPic} pieces)`);
    } else {
      alert("Please select sub-products and enter number of pieces first!");
    }
  };

  const fetchAllCustomers = async () => {
    try {
      const response = await getCustomers();
      setAllCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleCustomerNameChange = (value) => {
    setBillData({ ...billData, customerName: value });
    
    if (value.trim().length > 0) {
      // Filter customers locally based on input
      const filtered = allCustomers.filter(customer =>
        customer.name.toLowerCase().includes(value.toLowerCase())
      );
      setCustomerSuggestions(filtered);
    } else {
      // Show all customers when input is empty
      setCustomerSuggestions(allCustomers);
    }
    setShowSuggestions(true);
  };

  const handleCustomerFieldClick = () => {
    // Show all customers when clicking on the field
    setCustomerSuggestions(allCustomers);
    setShowSuggestions(true);
  };

  const handleCustomerSelect = (customer) => {
    setBillData({
      ...billData,
      customerName: customer.name,
      customerMobile: customer.mobile || "",
      shipToAddress: customer.address || "",
    });
    setShowSuggestions(false);
    setCustomerSuggestions([]);
  };

  const handleMainProductChange = (mainProductName) => {
    setSelectedMainProduct(mainProductName);
    setSelectedSubProducts([]);
    setMainProductQuantity("");
    setMainProductPic("");
    setMainProductPrice("");
    setSubProductQuantities({});
    setSubProductPics({});
    setSubProductPrices({});
    setSubProductSizes({});
    setQuantityMode("main");
    
    // Find and set available sub-products
    const product = products.find(p => p.mainProduct === mainProductName);
    
    if (product) {
      setAvailableSubProducts(product.subProducts);
      const calcType = product.calculationType || "weight";
      setCurrentCalculationType(calcType);
    } else {
      setAvailableSubProducts([]);
      setCurrentCalculationType("weight");
    }
  };

  const handleSubProductToggle = (subProductName) => {
    setSelectedSubProducts(prev => {
      if (prev.includes(subProductName)) {
        // Remove if already selected
        return prev.filter(name => name !== subProductName);
      } else {
        // Add if not selected
        const newSubProducts = [...prev, subProductName];
        
        // Set default price and size for individual mode only
        const subProduct = availableSubProducts.find(sp => sp.name === subProductName);
        if (subProduct && quantityMode === "individual") {
          setSubProductPrices(prevPrices => ({
            ...prevPrices,
            [subProductName]: subProduct.price.toString()
          }));
          setSubProductSizes(prevSizes => ({
            ...prevSizes,
            [subProductName]: subProduct.size ? subProduct.size.toString() : ""
          }));
        }
        
        return newSubProducts;
      }
    });
  };

  const handleAddOtherSubProduct = () => {
    if (otherSubProductName.trim() !== "") {
      const customName = otherSubProductName.trim();
      
      // If piece-based, validate size is provided
      if (currentCalculationType === "piece" && (!otherSubProductSize || parseFloat(otherSubProductSize) <= 0)) {
        alert("Please enter a size for piece-based product!");
        return;
      }
      
      // Add to selected sub-products
      setSelectedSubProducts(prev => [...prev, customName]);
      
      // If piece-based, add the custom sub-product with size to availableSubProducts
      if (currentCalculationType === "piece" && otherSubProductSize) {
        setAvailableSubProducts(prev => [
          ...prev,
          {
            name: customName,
            size: parseFloat(otherSubProductSize),
            price: 0,
            _id: `custom_${Date.now()}` // Unique ID for custom product
          }
        ]);
      }
      
      // Reset form
      setOtherSubProductName("");
      setOtherSubProductSize("");
      setShowOtherInput(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedMainProduct) {
      alert("Please select a main product");
      return;
    }

    if (selectedSubProducts.length === 0) {
      alert("Please select at least one sub-product");
      return;
    }

    const selectedSubProductObjects = availableSubProducts.filter(sp => 
      selectedSubProducts.includes(sp.name)
    );

    if (quantityMode === "main") {
      // Main Product Quantity Mode
      const qty = parseFloat(mainProductQuantity);
      const pic = parseFloat(mainProductPic) || 0;
      const price = parseFloat(mainProductPrice);
      
      if (currentCalculationType === "weight") {
        // Weight-based: quantity × price
        if (!qty || qty <= 0) {
          alert("Please enter quantity (weight in KGs) for the main product");
          return;
        }
        if (!price || price <= 0) {
          alert("Price cannot be zero. Please check product pricing.");
          return;
        }

        const productName = `${selectedMainProduct}|${selectedSubProducts.join(', ')}`;
        const totalPrice = qty * price;
        
        setBillItems([...billItems, {
          productName,
          quantity: qty,
          pic: pic,
          price: price,
          totalPrice,
          itemCount: 1,
          calculationType: "weight",
          size: 0,
        }]);
      } else {
        // Piece-based: (pic × total_size) × price
        if (!pic || pic <= 0) {
          alert("Please enter number of pieces");
          return;
        }
        if (!price || price <= 0) {
          alert("Price cannot be zero. Please check product pricing.");
          return;
        }

        // Calculate total size from selected sub-products
        let totalSize = 0;
        for (const subProdName of selectedSubProducts) {
          const subProd = availableSubProducts.find(sp => sp.name === subProdName);
          if (subProd && subProd.size) {
            totalSize += subProd.size * pic; // Each sub-product contributes (its size × pic count)
          }
        }

        if (totalSize === 0) {
          alert("No sizes defined for selected sub-products. Please configure sizes in Products page.");
          return;
        }

        const productName = `${selectedMainProduct}|${selectedSubProducts.join(', ')}`;
        const totalPrice = totalSize * price;
        
        setBillItems([...billItems, {
          productName,
          quantity: totalSize, // Store total size as quantity for display
          pic: pic,
          price: price,
          totalPrice,
          itemCount: 1,
          calculationType: "piece",
          size: totalSize,
        }]);
      }
    } else {
      // Individual Sub Product Quantity Mode
      const newItems = [];
      
      for (const subProductName of selectedSubProducts) {
        const qty = parseFloat(subProductQuantities[subProductName]);
        const pic = parseFloat(subProductPics[subProductName]) || 0;
        const price = parseFloat(subProductPrices[subProductName]);
        
        if (currentCalculationType === "weight") {
          // Weight-based
          if (!qty || qty <= 0) {
            alert(`Please enter quantity (weight in KGs) for ${subProductName}`);
            return;
          }
          if (!price || price <= 0) {
            alert(`Please enter price for ${subProductName}`);
            return;
          }

          const totalPrice = qty * price;
          const productName = `${selectedMainProduct}|${subProductName}`;
          
          newItems.push({
            productName,
            quantity: qty,
            pic: pic,
            price: price,
            totalPrice,
            itemCount: 1,
            calculationType: "weight",
            size: 0,
          });
        } else {
          // Piece-based
          if (!pic || pic <= 0) {
            alert(`Please enter number of pieces for ${subProductName}`);
            return;
          }
          if (!price || price <= 0) {
            alert(`Please enter price for ${subProductName}`);
            return;
          }

          const subProd = availableSubProducts.find(sp => sp.name === subProductName);
          const size = subProd ? subProd.size : 0;
          
          if (!size) {
            alert(`Size not defined for ${subProductName}. Please configure in Products page.`);
            return;
          }

          const totalSize = pic * size;
          const totalPrice = totalSize * price;
          const productName = `${selectedMainProduct}|${subProductName}`;
          
          newItems.push({
            productName,
            quantity: totalSize,
            pic: pic,
            price: price,
            totalPrice,
            itemCount: 1,
            calculationType: "piece",
            size: totalSize,
          });
        }
      }

      setBillItems([...billItems, ...newItems]);
    }
    
    // Reset form
    setSelectedMainProduct("");
    setSelectedSubProducts([]);
    setMainProductQuantity("");
    setMainProductPic("");
    setMainProductPrice("");
    setSubProductQuantities({});
    setSubProductPics({});
    setSubProductPrices({});
    setSubProductSizes({});
    setQuantityMode("main");
    setAvailableSubProducts([]);
    setCurrentCalculationType("weight");
  };

  const handleRemoveItem = (index) => {
    const newItems = billItems.filter((_, i) => i !== index);
    setBillItems(newItems);
  };

  const calculateSubtotal = () => {
    return billItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateBeforeRoundOff = () => {
    const subtotal = calculateSubtotal();
    const loading = parseFloat(loadingCharge) || 0;
    const transport = parseFloat(transportCharge) || 0;
    return subtotal + loading + transport;
  };

  const calculateRoundOff = () => {
    const beforeRoundOff = calculateBeforeRoundOff();
    const rounded = Math.round(beforeRoundOff);
    return rounded - beforeRoundOff;
  };

  const calculateTotal = () => {
    const beforeRoundOff = calculateBeforeRoundOff();
    return Math.round(beforeRoundOff);
  };

  const saveBillToDatabase = async () => {
    if (billItems.length === 0) {
      alert("Please add at least one item to the bill");
      return null;
    }

    try {
      const billPayload = {
        customerName: billData.customerName,
        customerMobile: billData.customerMobile,
        shipToAddress: billData.shipToAddress,
        items: billItems,
        loadingCharge: parseFloat(loadingCharge) || 0,
        transportCharge: parseFloat(transportCharge) || 0,
        roundOff: calculateRoundOff(),
        totalAmount: calculateTotal(),
      };

      const response = await createBill(billPayload);
      return response.data;
    } catch (error) {
      console.error("Error creating bill:", error);
      alert("Failed to save bill");
      return null;
    }
  };

  const resetForm = () => {
    setBillData({
      customerName: "",
      customerMobile: "",
      shipToAddress: "",
    });
    setBillItems([]);
    setLoadingCharge(0);
    setTransportCharge(0);
  };

  const handleSave = async () => {
    const savedBill = await saveBillToDatabase();
    if (savedBill) {
      alert("Bill saved successfully!");
      resetForm();
    }
  };

  const handlePrintOnly = () => {
    if (billItems.length === 0) {
      alert("Please add at least one item to the bill");
      return;
    }
    window.print();
  };

  const handleSaveAndPrint = async () => {
    const savedBill = await saveBillToDatabase();
    if (savedBill) {
      alert("Bill saved successfully!");
      setTimeout(() => {
        window.print();
      }, 500);
      resetForm();
    }
  };

  const handleExportAsImage = async (shouldSave) => {
    if (billItems.length === 0) {
      alert("Please add at least one item to the bill");
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

      canvas.toBlob(
        (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          const fileName = billData.customerName
            ? `bill-${billData.customerName.replace(
                /\s+/g,
                "-"
              )}-${Date.now()}.jpeg`
            : `bill-${Date.now()}.jpeg`;
          link.download = fileName;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        },
        "image/jpeg",
        0.95
      );
    } catch (error) {
      console.error("Error exporting image:", error);
      alert("Failed to export image");
    }
  };

  const handleSaveAndExport = async () => {
    const savedBill = await saveBillToDatabase();
    if (savedBill) {
      alert("Bill saved successfully!");
      await handleExportAsImage(true);
      resetForm();
    }
  };

  const handleExportOnly = async () => {
    await handleExportAsImage(false);
  };

  return (
    <div className="make-bill-container">
      <h1>Create New Bill</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="bill-preview" ref={billRef}>
        {/* Cash Memo Header */}
        <div className="cash-memo-header">
          <div className="business-info-section">
            <h1 className="business-title">{user?.businessName || "BUSINESS NAME"}</h1>
            <p className="business-address">
              Business Address Line 1, City, State - Pincode
            </p>
            <p className="business-contact">
              Business Contact: {user?.email || "contact@business.com"} | Tel: +91 XXXXX XXXXX
            </p>
          </div>
          <h2 className="memo-title">CASH MEMO</h2>
        </div>

        {/* Customer Info Input - Compact Layout */}
        <div className="customer-input-section no-print" style={{ 
          padding: "15px", 
          background: "#f8f9fa", 
          marginBottom: "10px",
          borderRadius: "5px"
        }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>📋 Customer Details</h4>
          <div className="input-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr", gap: "10px" }}>
            <div className="input-group customer-autocomplete">
              <label style={{ fontSize: "13px", marginBottom: "3px" }}>Customer Name:</label>
              <input
                type="text"
                value={billData.customerName}
                onChange={(e) => handleCustomerNameChange(e.target.value)}
                onClick={handleCustomerFieldClick}
                onFocus={handleCustomerFieldClick}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                placeholder="Click to select or type to search..."
                autoComplete="off"
              />
              {showSuggestions && (
                <div className="customer-suggestions">
                  {customerSuggestions.length > 0 ? (
                    customerSuggestions.map((customer) => (
                      <div
                        key={customer._id}
                        className="suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCustomerSelect(customer);
                        }}
                      >
                        <div className="suggestion-name">{customer.name}</div>
                        {customer.mobile && (
                          <div className="suggestion-mobile">{customer.mobile}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="suggestion-item no-results">
                      No customers found
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="input-group">
              <label style={{ fontSize: "13px", marginBottom: "3px" }}>Mobile:</label>
              <input
                type="tel"
                value={billData.customerMobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    setBillData({ ...billData, customerMobile: value });
                  }
                }}
                placeholder="Mobile number"
                maxLength="10"
                style={{ padding: "6px", fontSize: "14px" }}
              />
            </div>
            <div className="input-group">
              <label style={{ fontSize: "13px", marginBottom: "3px" }}>Address:</label>
              <input
                type="text"
                value={billData.shipToAddress}
                onChange={(e) =>
                  setBillData({ ...billData, shipToAddress: e.target.value })
                }
                placeholder="Customer address"
                style={{ padding: "6px", fontSize: "14px" }}
              />
            </div>
          </div>
        </div>

        {/* Add Item Form - Compact Layout (No Print) */}
        <div className="add-item-section no-print" style={{
          padding: "15px",
          background: "#fff9e6",
          marginBottom: "10px",
          borderRadius: "5px"
        }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>🛒 Add Items to Bill</h4>
          
          {/* Step 1: Select Main Product - Compact */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", marginBottom: "5px", display: "block" }}>
              1️⃣ Main Product:
            </label>
            <select
              value={selectedMainProduct}
              onChange={(e) => handleMainProductChange(e.target.value)}
              style={{
                padding: "8px",
                width: "100%",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              <option value="">-- Select Main Product --</option>
              {products.map((product, index) => (
                <option key={index} value={product.mainProduct}>
                  {product.mainProduct}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Sub Products - Compact */}
          {selectedMainProduct && (
            <div style={{ 
              background: "white", 
              padding: "12px", 
              borderRadius: "5px",
              marginBottom: "12px",
              border: "1px solid #ddd"
            }}>
              <label style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", display: "block" }}>
                2️⃣ Select Sub Products:
              </label>
              
              {/* Sub Products Checkboxes - Compact Two Column Layout */}
              <div style={{ 
                background: "#f8f9fa", 
                padding: "10px", 
                borderRadius: "5px",
                border: "1px solid #28a745",
                marginBottom: "10px",
                maxHeight: "250px",
                overflowY: "auto"
              }}>
                {availableSubProducts.length === 0 ? (
                  <p style={{ color: "#666", textAlign: "center", margin: "10px 0" }}>
                    No sub-products available for this main product
                  </p>
                ) : (
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(2, 1fr)", 
                    gap: "10px" 
                  }}>
                  {availableSubProducts.map((subProduct, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        padding: "8px", 
                        background: selectedSubProducts.includes(subProduct.name) ? "#d4edda" : "white",
                        border: selectedSubProducts.includes(subProduct.name) ? "1px solid #28a745" : "1px solid #ddd",
                        borderRadius: "4px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                      onClick={() => handleSubProductToggle(subProduct.name)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubProducts.includes(subProduct.name)}
                        onChange={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        readOnly
                        style={{ 
                          width: "16px", 
                          height: "16px", 
                          cursor: "pointer",
                          accentColor: "#28a745",
                          pointerEvents: "none"
                        }}
                      />
                      <label style={{ 
                        flex: 1, 
                        cursor: "pointer", 
                        fontSize: "13px",
                        fontWeight: selectedSubProducts.includes(subProduct.name) ? "600" : "normal"
                      }}>
                        {subProduct.name}
                      </label>
                    </div>
                  ))}
                  </div>
                )}

                {/* Other Sub-Product Option - Compact */}
                <div 
                  style={{ 
                    padding: "8px", 
                    marginTop: "8px",
                    background: showOtherInput ? "#fff3cd" : "white",
                    border: showOtherInput ? "1px solid #ffc107" : "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => setShowOtherInput(!showOtherInput)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      checked={showOtherInput}
                      onChange={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      readOnly
                      style={{ 
                        width: "20px", 
                        height: "20px", 
                        cursor: "pointer",
                        accentColor: "#ffc107",
                        pointerEvents: "none"
                      }}
                    />
                    <label style={{ 
                      flex: 1, 
                      cursor: "pointer", 
                      fontSize: "15px",
                      fontWeight: showOtherInput ? "600" : "normal",
                      color: "#856404"
                    }}>
                      ➕ Other (Add custom sub-product)
                    </label>
                  </div>
                </div>

                {/* Other Sub-Product Input */}
                {showOtherInput && (
                  <div style={{ 
                    marginTop: "10px",
                    padding: "15px",
                    background: "#fff3cd",
                    border: "2px solid #ffc107",
                    borderRadius: "6px"
                  }}>
                    <label style={{ 
                      display: "block", 
                      marginBottom: "8px", 
                      fontSize: "14px", 
                      fontWeight: "600",
                      color: "#856404"
                    }}>
                      {currentCalculationType === "piece" 
                        ? "Add Custom Sub-Product (Piece-Based):" 
                        : "Enter Custom Sub-Product Name:"}
                    </label>
                    
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <input
                        type="text"
                        value={otherSubProductName}
                        onChange={(e) => setOtherSubProductName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && (currentCalculationType !== "piece" || otherSubProductSize)) {
                            handleAddOtherSubProduct();
                          }
                        }}
                        placeholder="e.g., Custom Product Name"
                        style={{
                          flex: currentCalculationType === "piece" ? "1 1 150px" : "1",
                          minWidth: "150px",
                          padding: "8px",
                          border: "1px solid #ffc107",
                          borderRadius: "4px",
                          fontSize: "14px"
                        }}
                      />
                      
                      {currentCalculationType === "piece" && (
                        <input
                          type="number"
                          value={otherSubProductSize}
                          onChange={(e) => setOtherSubProductSize(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && otherSubProductName) {
                              handleAddOtherSubProduct();
                            }
                          }}
                          placeholder="Size (e.g., 8, 10, 12)"
                          step="any"
                          min="0"
                          style={{
                            flex: "1 1 120px",
                            minWidth: "120px",
                            padding: "8px",
                            border: "1px solid #ffc107",
                            borderRadius: "4px",
                            fontSize: "14px"
                          }}
                        />
                      )}
                      
                      <button
                        onClick={handleAddOtherSubProduct}
                        style={{
                          padding: "8px 20px",
                          background: "#ffc107",
                          color: "#856404",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "14px",
                          whiteSpace: "nowrap"
                        }}
                      >
                        ➕ Add
                      </button>
                    </div>
                    
                    {currentCalculationType === "piece" && (
                      <div style={{ 
                        marginTop: "8px", 
                        fontSize: "12px", 
                        color: "#856404", 
                        fontStyle: "italic" 
                      }}>
                        💡 For piece-based products, both name and size are required
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Sub Products Summary - Compact */}
              {selectedSubProducts.length > 0 && (
                <>
                  <div style={{ 
                    background: "#d4edda", 
                    padding: "8px", 
                    borderRadius: "4px",
                    marginBottom: "10px",
                    border: "1px solid #28a745",
                    fontSize: "12px"
                  }}>
                    <strong style={{ color: "#155724" }}>
                      ✓ Selected: {selectedSubProducts.length} item(s)
                    </strong>
                    <div style={{ marginTop: "3px", fontSize: "11px", color: "#155724" }}>
                      {selectedSubProducts.join(', ')}
                    </div>
                  </div>

                  {/* Quantity Mode Selection - Compact */}
                  <div style={{ 
                    background: "#fff3cd", 
                    padding: "10px", 
                    borderRadius: "4px",
                    marginBottom: "10px",
                    border: "1px solid #ffc107"
                  }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", display: "block" }}>
                      3️⃣ Quantity Mode:
                    </label>
                    
                    <div style={{ display: "flex", gap: "20px" }}>
                      <label style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px", 
                        cursor: "pointer",
                        fontSize: "15px"
                      }}>
                        <input
                          type="radio"
                          name="quantityMode"
                          value="main"
                          checked={quantityMode === "main"}
                          onChange={(e) => setQuantityMode(e.target.value)}
                          style={{ width: "18px", height: "18px", cursor: "pointer" }}
                        />
                        <span>Main Product Quantity</span>
                      </label>

                      <label style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px", 
                        cursor: "pointer",
                        fontSize: "15px"
                      }}>
                        <input
                          type="radio"
                          name="quantityMode"
                          value="individual"
                          checked={quantityMode === "individual"}
                          onChange={(e) => setQuantityMode(e.target.value)}
                          style={{ width: "18px", height: "18px", cursor: "pointer" }}
                        />
                        <span>Individual Sub Product Quantities</span>
                      </label>
                    </div>
                  </div>

                  {/* Main Product Quantity Input */}
                  {quantityMode === "main" && (
                    <div style={{ 
                      border: "2px solid #4a90e2", 
                      padding: "15px", 
                      borderRadius: "8px",
                      background: "white",
                      marginBottom: "15px"
                    }}>
                      <label style={{ fontWeight: "bold", marginBottom: "8px", display: "block", color: "#4a90e2" }}>
                        4. Enter Quantity, Pic & Price:
                      </label>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#555" }}>
                            Pic (No. of Items) - Optional:
                          </label>
                          <input
                            type="number"
                            value={mainProductPic}
                            onChange={(e) => setMainProductPic(e.target.value)}
                            placeholder="No. of items (optional)"
                            step="any"
                            min="0"
                            style={{
                              padding: "10px",
                              width: "100%",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "16px",
                            }}
                          />
                          <small style={{ color: "#888", fontSize: "12px", marginTop: "3px", display: "block" }}>
                            Total packages/boxes (optional)
                          </small>
                        </div>
                        
                        <div>
                          <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#555" }}>
                            Quantity (Weight in KGs):
                          </label>
                          <input
                            type="number"
                            value={mainProductQuantity}
                            onChange={(e) => setMainProductQuantity(e.target.value)}
                            placeholder="Enter weight (KG)"
                            step="any"
                            min="0"
                            style={{
                              padding: "10px",
                              width: "100%",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "16px",
                            }}
                          />
                          <small style={{ color: "#888", fontSize: "12px", marginTop: "3px", display: "block" }}>
                            Weight in kilograms
                          </small>
                        </div>
                        
                        <div>
                          <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#555" }}>
                            Price per KG (₹):
                          </label>
                          <input
                            type="number"
                            value={mainProductPrice}
                            onChange={(e) => setMainProductPrice(e.target.value)}
                            placeholder="Price per KG"
                            step="any"
                            min="0"
                            style={{
                              padding: "10px",
                              width: "100%",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "16px",
                            }}
                          />
                        </div>
                      </div>
                      
                      <small style={{ color: "#6c757d", display: "block", marginTop: "5px" }}>
                        Quantity (KG), Pic (No. of items) and Price per KG apply to all selected sub-products
                      </small>
                      
                      {mainProductQuantity && mainProductPrice && (
                        <div style={{ 
                          marginTop: "15px", 
                          padding: "15px", 
                          background: "#e7f3ff", 
                          borderRadius: "8px",
                          border: "1px solid #4a90e2"
                        }}>
                          <h4 style={{ margin: "0 0 10px 0", color: "#4a90e2", fontSize: "15px" }}>
                            📦 Order Summary:
                          </h4>
                          
                          <div style={{ fontSize: "14px" }}>
                            <div style={{ marginBottom: "8px" }}>
                              <strong style={{ color: "#333" }}>Quantity (Weight):</strong> 
                              <span style={{ marginLeft: "8px", fontSize: "16px", color: "#4a90e2", fontWeight: "bold" }}>
                                {mainProductQuantity} KG
                              </span>
                            </div>
                            
                            {mainProductPic && (
                              <div style={{ marginBottom: "8px" }}>
                                <strong style={{ color: "#333" }}>Pic (No. of Items):</strong> 
                                <span style={{ marginLeft: "8px", fontSize: "16px", color: "#4a90e2", fontWeight: "bold" }}>
                                  {mainProductPic} items
                                </span>
                              </div>
                            )}
                            
                            <div style={{ marginBottom: "8px" }}>
                              <strong style={{ color: "#333" }}>Price per KG:</strong> 
                              <span style={{ marginLeft: "8px", color: "#555" }}>
                                ₹{parseFloat(mainProductPrice || 0).toFixed(2)}/KG
                              </span>
                            </div>
                            
                            <div style={{ 
                              marginTop: "10px", 
                              paddingTop: "10px", 
                              borderTop: "2px solid #4a90e2"
                            }}>
                              <strong style={{ color: "#333", fontSize: "15px" }}>Total Amount:</strong> 
                              <span style={{ 
                                marginLeft: "8px", 
                                fontSize: "18px", 
                                color: "#4a90e2", 
                                fontWeight: "bold" 
                              }}>
                                ₹{(parseFloat(mainProductQuantity || 0) * parseFloat(mainProductPrice || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Individual Sub Product Quantities */}
                  {quantityMode === "individual" && (
                    <div style={{ 
                      border: "2px solid #6f42c1", 
                      padding: "15px", 
                      borderRadius: "8px",
                      background: "white",
                      marginBottom: "15px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <label style={{ fontWeight: "bold", color: "#6f42c1", margin: 0 }}>
                          4. Enter Individual Quantities, Pic & Prices:
                        </label>
                        {currentCalculationType === "piece" && (
                          <span style={{ 
                            padding: "6px 12px", 
                            background: "#fff3cd", 
                            color: "#856404",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            border: "1px solid #ffc107"
                          }}>
                            📏 Piece-Based Product - Use 🧮 Calc button
                          </span>
                        )}
                      </div>

                      {/* Quick Price Apply Section */}
                      <div style={{ 
                        marginBottom: "20px",
                        padding: "15px",
                        background: "#fff9e6",
                        border: "2px solid #ffc107",
                        borderRadius: "6px"
                      }}>
                        <div style={{ fontWeight: "600", marginBottom: "10px", color: "#856404" }}>
                          ⚡ Quick Price Apply (Same price for all sub-products)
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", color: "#856404" }}>
                              Enter Price (₹):
                            </label>
                            <input
                              type="number"
                              id="bulkPriceInput"
                              placeholder="Enter price to apply to all"
                              step="any"
                              min="0"
                              style={{
                                padding: "10px",
                                width: "100%",
                                border: "2px solid #ffc107",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontWeight: "600"
                              }}
                            />
                          </div>
                          <button
                            onClick={() => {
                              const bulkPrice = document.getElementById('bulkPriceInput').value;
                              if (bulkPrice && bulkPrice > 0) {
                                const newPrices = {};
                                selectedSubProducts.forEach(name => {
                                  newPrices[name] = bulkPrice;
                                });
                                setSubProductPrices(newPrices);
                                document.getElementById('bulkPriceInput').value = '';
                              } else {
                                alert("Please enter a valid price");
                              }
                            }}
                            style={{
                              padding: "10px 24px",
                              background: "#ffc107",
                              color: "#856404",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "700",
                              fontSize: "14px",
                              whiteSpace: "nowrap",
                              transition: "all 0.3s"
                            }}
                            onMouseOver={(e) => e.target.style.background = "#ffb300"}
                            onMouseOut={(e) => e.target.style.background = "#ffc107"}
                          >
                            Apply to All
                          </button>
                        </div>
                        <div style={{ marginTop: "8px", fontSize: "12px", color: "#856404", fontStyle: "italic" }}>
                          💡 Tip: Use this to quickly set the same price for all {selectedSubProducts.length} sub-products
                        </div>
                      </div>

                      {selectedSubProducts.map((subProductName, idx) => {
                        const subProduct = availableSubProducts.find(sp => sp.name === subProductName);
                        const qty = subProductQuantities[subProductName] || "";
                        const pic = subProductPics[subProductName] || "";
                        const price = subProductPrices[subProductName] || "";
                        const total = parseFloat(qty || 0) * parseFloat(price || 0);
                        
                        return (
                          <div key={idx} style={{ 
                            marginBottom: "15px",
                            padding: "12px",
                            background: "#f8f9fa",
                            borderRadius: "6px",
                            border: "1px solid #ddd"
                          }}>
                            <label style={{ 
                              display: "block", 
                              marginBottom: "8px", 
                              fontWeight: "600",
                              color: "#333",
                              fontSize: "15px"
                            }}>
                              {subProductName}
                            </label>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                              <div>
                                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "#666" }}>
                                  {currentCalculationType === "piece" ? "Pic (No. of Pieces):" : "Pic (No. of Items) - Optional:"}
                                </label>
                                <div style={{ display: "flex", gap: "5px", alignItems: "flex-start" }}>
                                  <input
                                    type="number"
                                    value={pic}
                                    onChange={(e) => setSubProductPics({
                                      ...subProductPics,
                                      [subProductName]: e.target.value
                                    })}
                                    placeholder={currentCalculationType === "piece" ? "No. of pieces" : "No. of items (optional)"}
                                    step="any"
                                    min="0"
                                    style={{
                                      padding: "8px",
                                      width: "100%",
                                      border: "1px solid #ddd",
                                      borderRadius: "4px",
                                      fontSize: "14px",
                                    }}
                                  />
                                  {currentCalculationType === "piece" && subProduct && subProduct.size && (
                                    <button
                                      onClick={() => {
                                        const pieces = parseFloat(pic);
                                        if (pieces && pieces > 0 && subProduct.size) {
                                          const calculatedQty = pieces * subProduct.size;
                                          setSubProductQuantities({
                                            ...subProductQuantities,
                                            [subProductName]: calculatedQty.toString()
                                          });
                                          alert(`Total calculated: ${calculatedQty} (${pieces} × ${subProduct.size})`);
                                        } else {
                                          alert("Please enter number of pieces first!");
                                        }
                                      }}
                                      disabled={!pic || pic <= 0}
                                      style={{
                                        padding: "8px 12px",
                                        background: !pic || pic <= 0 ? "#ccc" : "#2196F3",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: !pic || pic <= 0 ? "not-allowed" : "pointer",
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        whiteSpace: "nowrap",
                                        minWidth: "60px"
                                      }}
                                      title="Calculate quantity"
                                    >
                                      🧮 Calc
                                    </button>
                                  )}
                                </div>
                                {currentCalculationType === "piece" && subProduct && subProduct.size && (
                                  <div style={{ fontSize: "11px", color: "#2196F3", marginTop: "4px", fontWeight: "600" }}>
                                    Size: {subProduct.size} {currentCalculationType === "piece" ? "ft" : ""}
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "#666" }}>
                                  {currentCalculationType === "piece" ? "Quantity (Total Feet):" : "Quantity (Weight in KGs):"}
                                </label>
                                <input
                                  type="number"
                                  value={qty}
                                  onChange={(e) => setSubProductQuantities({
                                    ...subProductQuantities,
                                    [subProductName]: e.target.value
                                  })}
                                  placeholder={currentCalculationType === "piece" ? "Total feet" : "Weight (KG)"}
                                  step="any"
                                  min="0"
                                  readOnly={currentCalculationType === "piece"}
                                  style={{
                                    padding: "8px",
                                    width: "100%",
                                    border: currentCalculationType === "piece" && qty ? "2px solid #28a745" : "1px solid #ddd",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    backgroundColor: currentCalculationType === "piece" && qty ? "#e8f5e9" : "white",
                                    fontWeight: currentCalculationType === "piece" && qty ? "bold" : "normal",
                                    color: currentCalculationType === "piece" && qty ? "#28a745" : "#000",
                                    cursor: currentCalculationType === "piece" ? "not-allowed" : "text"
                                  }}
                                  title={currentCalculationType === "piece" ? "Auto-calculated (click Calc button)" : "Enter quantity"}
                                />
                              </div>
                              
                              <div>
                                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "#666" }}>
                                  {currentCalculationType === "piece" ? "Price per Foot (₹):" : "Price per KG (₹):"}
                                </label>
                                <input
                                  type="number"
                                  value={price}
                                  onChange={(e) => setSubProductPrices({
                                    ...subProductPrices,
                                    [subProductName]: e.target.value
                                  })}
                                  placeholder={currentCalculationType === "piece" ? "Price per foot" : "Price per KG"}
                                  step="any"
                                  min="0"
                                  style={{
                                    padding: "8px",
                                    width: "100%",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                  }}
                                />
                              </div>
                            </div>
                            
                            {/* Preview Section */}
                            {qty && price && (
                              <div style={{ 
                                marginTop: "12px", 
                                padding: "12px", 
                                background: "#f0f4ff", 
                                borderRadius: "6px",
                                border: "1px solid #6f42c1"
                              }}>
                                <div style={{ fontSize: "13px" }}>
                                  {currentCalculationType === "piece" && pic && subProduct && subProduct.size && (
                                    <div style={{ marginBottom: "8px", padding: "8px", background: "#e8f5e9", borderRadius: "4px" }}>
                                      <strong style={{ color: "#28a745" }}>📏 Piece-Based Calculation:</strong>
                                      <div style={{ marginTop: "4px", color: "#555" }}>
                                        {pic} pieces × {subProduct.size} ft = <strong style={{ color: "#28a745" }}>{qty} feet</strong>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div style={{ marginBottom: "5px" }}>
                                    <strong style={{ color: "#333" }}>
                                      {currentCalculationType === "piece" ? "Quantity (Total Feet):" : "Quantity (Weight):"}
                                    </strong> 
                                    <span style={{ marginLeft: "6px", color: "#6f42c1", fontWeight: "600" }}>
                                      {qty} {currentCalculationType === "piece" ? "ft" : "KG"}
                                    </span>
                                  </div>
                                  
                                  {pic && (
                                    <div style={{ marginBottom: "5px" }}>
                                      <strong style={{ color: "#333" }}>
                                        {currentCalculationType === "piece" ? "Pic (No. of Pieces):" : "Pic (No. of Items):"}
                                      </strong> 
                                      <span style={{ marginLeft: "6px", color: "#6f42c1", fontWeight: "600" }}>
                                        {pic} {currentCalculationType === "piece" ? "pieces" : "items"}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div style={{ marginBottom: "5px" }}>
                                    <strong style={{ color: "#333" }}>
                                      {currentCalculationType === "piece" ? "Price per Foot:" : "Price per KG:"}
                                    </strong> 
                                    <span style={{ marginLeft: "6px", color: "#555" }}>
                                      ₹{parseFloat(price || 0).toFixed(2)}/{currentCalculationType === "piece" ? "ft" : "KG"}
                                    </span>
                                  </div>
                                  
                                  <div style={{ 
                                    marginTop: "8px", 
                                    paddingTop: "8px", 
                                    borderTop: "1px solid #6f42c1"
                                  }}>
                                    <strong style={{ color: "#333" }}>Subtotal:</strong> 
                                    <span style={{ 
                                      marginLeft: "6px", 
                                      fontSize: "15px", 
                                      color: "#6f42c1", 
                                      fontWeight: "bold" 
                                    }}>
                                      ₹{total.toFixed(2)}
                                    </span>
                                    {currentCalculationType === "piece" && (
                                      <span style={{ marginLeft: "8px", fontSize: "12px", color: "#555" }}>
                                        ({qty} × ₹{price})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={handleAddItem}
                className="btn btn-success"
                style={{ marginTop: "15px", width: "100%", padding: "12px", fontSize: "16px" }}
              >
                ➕ Add Item to Bill
              </button>
            </div>
          )}
        </div>

        {/* Additional Charges Input - Compact (No Print) */}
        <div className="charges-input-section no-print" style={{
          padding: "12px",
          background: "#f0f4ff",
          marginBottom: "10px",
          borderRadius: "5px"
        }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "14px" }}>💰 Additional Charges</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "12px", marginBottom: "3px", display: "block" }}>Loading:</label>
              <input
                type="number"
                value={loadingCharge}
                onChange={(e) => setLoadingCharge(e.target.value)}
                placeholder="Loading charge"
                step="any"
                min="0"
                style={{ padding: "6px", fontSize: "13px", width: "100%", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", marginBottom: "3px", display: "block" }}>Transport:</label>
              <input
                type="number"
                value={transportCharge}
                onChange={(e) => setTransportCharge(e.target.value)}
                placeholder="Transport charge"
                step="any"
                min="0"
                style={{ padding: "6px", fontSize: "13px", width: "100%", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>
          </div>
        </div>

        {/* Cash Memo Table - Editable Inline */}
        <table className="cash-memo-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th style={{ textAlign: 'center' }}>PIC</th>
              <th style={{ textAlign: 'center' }}>QUANTITY</th>
              <th style={{ textAlign: 'right' }}>PRICE</th>
              <th style={{ textAlign: 'right' }}>TOTAL</th>
              <th className="no-print">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {/* Add New Item Row - Always visible (No Print) */}
            <tr className="no-print" style={{ background: "#f0f9ff" }}>
              <td style={{ padding: "8px" }}>
                <select
                  value={selectedMainProduct}
                  onChange={(e) => handleMainProductChange(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #4a90e2",
                    borderRadius: "4px",
                    fontSize: "13px",
                    marginBottom: "5px"
                  }}
                >
                  <option value="">Select Product...</option>
                  {products.map((product, index) => (
                    <option key={index} value={product.mainProduct}>
                      {product.mainProduct}
                    </option>
                  ))}
                </select>
                
                {selectedMainProduct && availableSubProducts.length > 0 && (
                  <select
                    multiple
                    value={selectedSubProducts}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setSelectedSubProducts(selected);
                    }}
                    style={{
                      width: "100%",
                      padding: "6px",
                      border: "1px solid #28a745",
                      borderRadius: "4px",
                      fontSize: "12px",
                      minHeight: "80px"
                    }}
                  >
                    {availableSubProducts.map((subProduct, index) => (
                      <option key={index} value={subProduct.name}>
                        {subProduct.name}
                      </option>
                    ))}
                  </select>
                )}
                {selectedMainProduct && selectedSubProducts.length > 0 && (
                  <div style={{ fontSize: "11px", marginTop: "3px" }}>
                    <span style={{ color: "#28a745" }}>✓ {selectedSubProducts.length} selected</span>
                    {currentCalculationType === "piece" && (
                      <span style={{ color: "#ff6b6b", marginLeft: "8px", fontWeight: "bold" }}>
                        📏 Piece-based
                      </span>
                    )}
                  </div>
                )}
              </td>
              <td style={{ textAlign: 'center', padding: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", justifyContent: "center" }}>
                  <input
                    type="number"
                    value={mainProductPic}
                    onChange={(e) => setMainProductPic(e.target.value)}
                    placeholder="Pic"
                    min="0"
                    step="any"
                    style={{
                      width: "60px",
                      padding: "6px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "13px",
                      textAlign: "center"
                    }}
                  />
                  {currentCalculationType === "piece" && (
                    <button
                      onClick={handleCalculateQuantity}
                      disabled={!mainProductPic || selectedSubProducts.length === 0}
                      style={{
                        padding: "6px 10px",
                        background: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: !mainProductPic || selectedSubProducts.length === 0 ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                        opacity: !mainProductPic || selectedSubProducts.length === 0 ? 0.5 : 1,
                        whiteSpace: "nowrap"
                      }}
                      title="Calculate total quantity"
                    >
                      🧮 Calc
                    </button>
                  )}
                </div>
              </td>
              <td style={{ textAlign: 'center', padding: "8px" }}>
                <input
                  type="number"
                  value={mainProductQuantity}
                  onChange={(e) => setMainProductQuantity(e.target.value)}
                  placeholder={currentCalculationType === "weight" ? "Qty (KG)" : "Total Ft"}
                  min="0"
                  step="any"
                  readOnly={currentCalculationType === "piece"}
                  style={{
                    width: "70px",
                    padding: "6px",
                    border: currentCalculationType === "piece" && mainProductQuantity ? "2px solid #28a745" : "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "13px",
                    textAlign: "center",
                    backgroundColor: currentCalculationType === "piece" && mainProductQuantity ? "#e8f5e9" : "white",
                    fontWeight: currentCalculationType === "piece" && mainProductQuantity ? "bold" : "normal",
                    color: currentCalculationType === "piece" && mainProductQuantity ? "#28a745" : "#000",
                    cursor: currentCalculationType === "piece" ? "not-allowed" : "text"
                  }}
                  title={currentCalculationType === "piece" ? "Click 'Calc' button to calculate" : "Enter quantity"}
                />
              </td>
              <td style={{ textAlign: 'right', padding: "8px" }}>
                <input
                  type="number"
                  value={mainProductPrice}
                  onChange={(e) => setMainProductPrice(e.target.value)}
                  placeholder={currentCalculationType === "weight" ? "₹/KG" : "₹/Unit"}
                  min="0"
                  step="any"
                  style={{
                    width: "80px",
                    padding: "6px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "13px",
                    textAlign: "right"
                  }}
                />
              </td>
              <td style={{ textAlign: 'right', padding: "8px", fontWeight: "bold" }}>
                {(() => {
                  if (currentCalculationType === "weight") {
                    // Weight: quantity × price
                    if (mainProductQuantity && mainProductPrice) {
                      return `₹${(parseFloat(mainProductQuantity) * parseFloat(mainProductPrice)).toFixed(2)}`;
                    }
                  } else {
                    // Piece: (pic × total_size) × price
                    if (mainProductPic && mainProductPrice && selectedSubProducts.length > 0) {
                      let totalSize = 0;
                      for (const subProdName of selectedSubProducts) {
                        const subProd = availableSubProducts.find(sp => sp.name === subProdName);
                        if (subProd && subProd.size) {
                          totalSize += subProd.size * parseFloat(mainProductPic);
                        }
                      }
                      if (totalSize > 0) {
                        return `₹${(totalSize * parseFloat(mainProductPrice)).toFixed(2)}`;
                      }
                    }
                  }
                  return '₹0.00';
                })()}
              </td>
              <td className="no-print" style={{ textAlign: 'center', padding: "8px" }}>
                <button
                  onClick={handleAddItem}
                  disabled={
                    !selectedMainProduct || 
                    selectedSubProducts.length === 0 || 
                    !mainProductPrice ||
                    (currentCalculationType === "weight" && !mainProductQuantity) ||
                    (currentCalculationType === "piece" && !mainProductPic)
                  }
                  style={{
                    padding: "6px 12px",
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                >
                  Add
                </button>
              </td>
            </tr>
            
            {billItems.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                  👆 Use the row above to add items
                </td>
              </tr>
            ) : (
              billItems.map((item, index) => {
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
                    </td>
                    <td style={{ textAlign: 'center', padding: '5px' }}>
                      {item.pic > 0 ? item.pic : '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.calculationType === "piece" && item.pic > 0 ? (
                        <span title={`${item.pic} pieces × ${(item.size / item.pic).toFixed(0)} = ${item.quantity}`}>
                          {item.quantity}
                        </span>
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>₹{item.price.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {item.calculationType === "piece" ? (
                        <span title={`${item.quantity} × ₹${item.price.toFixed(2)} = ₹${item.totalPrice.toFixed(2)}`}>
                          ₹{item.totalPrice.toFixed(2)}
                        </span>
                      ) : (
                        `₹${item.totalPrice.toFixed(2)}`
                      )}
                    </td>
                    <td className="no-print">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="btn btn-danger btn-small"
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
              <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold", paddingRight: "10px" }}>SUBTOTAL:</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>₹{calculateSubtotal().toFixed(2)}</td>
              <td className="no-print"></td>
            </tr>
            <tr className="no-print">
              <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold", paddingRight: "10px" }}>
                LOADING:
              </td>
              <td style={{ textAlign: "right", padding: "8px" }}>
                <input
                  type="number"
                  value={loadingCharge}
                  onChange={(e) => setLoadingCharge(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="any"
                  style={{
                    width: "100px",
                    padding: "6px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "13px",
                    textAlign: "right",
                    fontWeight: "bold"
                  }}
                />
              </td>
              <td className="no-print"></td>
            </tr>
            <tr style={{ display: loadingCharge > 0 ? 'table-row' : 'none' }}>
              <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold", paddingRight: "10px" }}>LOADING:</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>₹{(parseFloat(loadingCharge) || 0).toFixed(2)}</td>
              <td className="no-print" style={{ display: 'none' }}></td>
            </tr>
            <tr className="no-print">
              <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold", paddingRight: "10px" }}>
                TRANSPORT:
              </td>
              <td style={{ textAlign: "right", padding: "8px" }}>
                <input
                  type="number"
                  value={transportCharge}
                  onChange={(e) => setTransportCharge(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="any"
                  style={{
                    width: "100px",
                    padding: "6px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "13px",
                    textAlign: "right",
                    fontWeight: "bold"
                  }}
                />
              </td>
              <td className="no-print"></td>
            </tr>
            <tr style={{ display: transportCharge > 0 ? 'table-row' : 'none' }}>
              <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold", paddingRight: "10px" }}>TRANSPORT:</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>₹{(parseFloat(transportCharge) || 0).toFixed(2)}</td>
              <td className="no-print" style={{ display: 'none' }}></td>
            </tr>
            <tr>
              <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold", paddingRight: "10px" }}>ROUND OFF:</td>
              <td style={{ textAlign: "right", fontWeight: "bold", color: calculateRoundOff() >= 0 ? "#28a745" : "#dc3545" }}>
                {calculateRoundOff() >= 0 ? "+" : ""}₹{calculateRoundOff().toFixed(2)}
              </td>
              <td className="no-print"></td>
            </tr>
          </tfoot>
        </table>

        {/* Cash Memo Footer */}
        <div className="cash-memo-footer">
          <div className="amount-in-words">
            <strong>AMOUNT IN WORDS:</strong> {numberToWords(Math.floor(calculateTotal()))} Rupees Only
          </div>
          <div className="grand-total">
            <strong>G. TOTAL: ₹{calculateTotal().toFixed(2)}</strong>
          </div>
        </div>

        <div className="bill-actions no-print">
          <button onClick={handleSave} className="btn btn-success">
            💾 Save
          </button>
          <button onClick={handleSaveAndPrint} className="btn btn-primary">
            💾🖨️ Save & Print
          </button>
          <button onClick={handleSaveAndExport} className="btn btn-info">
            💾📷 Save & Export (JPEG)
          </button>
          <button onClick={handlePrintOnly} className="btn btn-secondary">
            🖨️ Print Only
          </button>
          <button onClick={handleExportOnly} className="btn btn-warning">
            📷 Export Only (JPEG)
          </button>
        </div>
      </div>
    </div>
  );
}

export default MakeBill;
