import Bill from "../models/Bill.js";

export const createBill = async (req, res) => {
  try {
    const {
      customerName,
      customerMobile,
      shipToAddress,
      items,
      totalAmount,
      loadingCharge,
      transportCharge,
      roundOff,
    } = req.body;

    const billCount = await Bill.countDocuments({ userId: req.user.id });
    const billNumber = `BILL-${Date.now()}-${billCount + 1}`;

    const bill = new Bill({
      userId: req.user.id,
      billNumber,
      customerName,
      customerMobile,
      shipToAddress,
      items,
      loadingCharge: loadingCharge || 0,
      transportCharge: transportCharge || 0,
      roundOff: roundOff || 0,
      totalAmount,
    });

    await bill.save();
    res.json(bill);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getBills = async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(bills);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (bill.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(bill);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateBill = async (req, res) => {
  try {
    const {
      customerName,
      customerMobile,
      shipToAddress,
      items,
      totalAmount,
      loadingCharge,
      transportCharge,
      roundOff,
    } = req.body;

    let bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (bill.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    bill.customerName = customerName;
    bill.customerMobile = customerMobile;
    bill.shipToAddress = shipToAddress;
    bill.items = items;
    bill.loadingCharge = loadingCharge || 0;
    bill.transportCharge = transportCharge || 0;
    bill.roundOff = roundOff || 0;
    bill.totalAmount = totalAmount;

    await bill.save();
    res.json(bill);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (bill.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: "Bill removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};
