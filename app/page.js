'use client'
import React, { useState, useEffect } from 'react';
import QRCode from "react-qr-code";

function Home() {
  const [records, setRecords] = useState([]);           // array of customer records
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Modal state - now used for QR popup
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Form modal state (unchanged)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('loyaltyRecords');
    if (saved) setRecords(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (records.length > 0) {
      sessionStorage.setItem('loyaltyRecords', JSON.stringify(records));
    }
  }, [records]);

  // ─── Form Modal Handlers ────────────────────────────────────────────────
  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setIsFormModalOpen(true);
  };

  const openEditModal = (record) => {
    setName(record.name);
    setMobile(record.mobile);
    setPrice(""); 
    setEditingId(record.id);
    setModalMode('edit');
    setIsFormModalOpen(true);
  };

  const resetForm = () => {
    setName("");
    setMobile("");
    setPrice("");
    setEditingId(null);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    resetForm();
  };

  // ─── QR Modal Handlers ──────────────────────────────────────────────────
  const openQrModal = (record) => {
    setSelectedRecord(record);
    setIsQrModalOpen(true);
  };

  const closeQrModal = () => {
    setIsQrModalOpen(false);
    setSelectedRecord(null);
  };

  // ─── Other Handlers (unchanged) ─────────────────────────────────────────
  const handleNameChange = (e) => {
    const val = e.target.value;
    if (/^[\p{L}\s'-]*$/u.test(val) || val === "") setName(val);
  };

  const handleMobileChange = (e) => {
    const val = e.target.value;
    if (/^[+]?[0-9]*$/.test(val)) setMobile(val);
  };

  const handlePriceChange = (e) => {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) setPrice(val);
  };

  const calculatePoints = (priceStr) => {
    const num = Number(priceStr);
    return isNaN(num) || num <= 0 ? 0 : Math.floor(num / 10);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName   = name.trim();
    const trimmedMobile = mobile.trim();
    const trimmedPrice  = price.trim();

    if (!trimmedName || !trimmedMobile || !trimmedPrice) {
      alert("Please fill in all fields!");
      return;
    }

    if (!/^((\+92|0092|92|0)[0-9]{10})$/.test(trimmedMobile)) {
      alert("Invalid Pakistani mobile number (e.g. +923001234567)");
      return;
    }

    const priceNum = Number(trimmedPrice);
    if (priceNum <= 0) {
      alert("Price must be greater than 0");
      return;
    }

    const newPoints = calculatePoints(trimmedPrice);
    const now = new Date().toLocaleString('en-PK');

    const existing = records.find(r => r.mobile === trimmedMobile);

    if (existing) {
      const updatedRecords = records.map(r => {
        if (r.mobile === trimmedMobile) {
          return {
            ...r,
            totalPoints: r.totalPoints + newPoints,
            lastTransaction: {
              price: trimmedPrice,
              pointsAdded: newPoints,
              date: now
            },
            name: r.name || trimmedName,
          };
        }
        return r;
      });

      setRecords(updatedRecords);
      alert(`Added ${newPoints} points! New total: ${existing.totalPoints + newPoints}`);
    } else {
      const newRecord = {
        id: Date.now().toString(),
        name: trimmedName,
        mobile: trimmedMobile,
        totalPoints: newPoints,
        lastTransaction: {
          price: trimmedPrice,
          pointsAdded: newPoints,
          date: now
        },
        createdAt: now,
      };
      setRecords(prev => [newRecord, ...prev]);
      alert(`New customer! ${newPoints} points added.`);
    }

    closeFormModal();
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this customer record?")) return;
    setRecords(prev => prev.filter(r => r.id !== id));
    if (selectedRecord?.id === id) closeQrModal();
  };

  const qrValue = selectedRecord
    ? `Name: ${selectedRecord.name}\nMobile: ${selectedRecord.mobile}\nTotal Points: ${selectedRecord.totalPoints}\nLast purchase: ${selectedRecord.lastTransaction?.price || '—'} PKR (+${selectedRecord.lastTransaction?.pointsAdded || 0} pts)`
    : "";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
            Loyalty QR Generator (Points by Mobile)
          </h1>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg shadow transition"
          >
            + New Transaction
          </button>
        </div>

        {records.length > 0 ? (
          <div className="bg-white shadow rounded-xl overflow-hidden mb-8">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Customers & Points ({records.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Transaction</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((rec) => (
                    <tr key={rec.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rec.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rec.mobile}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">{rec.totalPoints}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {rec.lastTransaction ? (
                          <>
                            {rec.lastTransaction.price} PKR (+{rec.lastTransaction.pointsAdded} pts)<br />
                            <span className="text-xs text-gray-500">{rec.lastTransaction.date}</span>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          className="text-green-600 hover:text-green-800 mr-4"
                          onClick={() => openQrModal(rec)}
                        >
                          Generate QR Code
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(rec); }}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                        >
                          Add Transaction
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(rec.id); }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow">
            No customers yet. Start by adding a transaction.
          </div>
        )}

        {/* ─── QR CODE POP-UP MODAL ─────────────────────────────────────────── */}
        {isQrModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
              <button
                onClick={closeQrModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-xl font-bold text-gray-800 mb-5 text-center">
                {selectedRecord.name}
              </h3>

              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-xl shadow-md">
                  <QRCode 
                    value={qrValue} 
                    size={220} 
                    level="Q" 
                  />
                </div>
              </div>

              <div className="space-y-3 text-center text-black">
                <div className=''>
                  <span className="text-sm text-gray-600">Mobile:</span><br/>
                  <strong>{selectedRecord.mobile}</strong>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Total Points:</span><br/>
                  <strong className="text-xl text-green-700">{selectedRecord.totalPoints}</strong>
                </div>
                {selectedRecord.lastTransaction && (
                  <div className="text-sm text-gray-600 mt-4">
                    Last purchase: {selectedRecord.lastTransaction.price} PKR
                    <br/>
                    (+{selectedRecord.lastTransaction.pointsAdded} points)
                    <br/>
                    <span className="text-xs">{selectedRecord.lastTransaction.date}</span>
                  </div>
                )}
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={closeQrModal}
                  className="text-gray-600 hover:text-gray-800 underline text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── FORM MODAL (unchanged) ───────────────────────────────────────── */}
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 bg-opacity-40">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 relative">
              <button
                onClick={closeFormModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {modalMode === 'edit' ? 'Add New Transaction' : 'New Customer Transaction'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5 text-black">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="Customer name"
                    className="w-full px-4 py-2 placeholder:text-gray-300 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={handleMobileChange}
                    maxLength={13}
                    placeholder="+923xxxxxxxxx"
                    className="w-full px-4 py-2 placeholder:text-gray-300 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Amount (PKR)</label>
                  <input
                    type="text"
                    value={price}
                    onChange={handlePriceChange}
                    placeholder="1500 or 1500.50"
                    className="w-full px-4 py-2 placeholder:text-gray-300 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">10 PKR = 1 point</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {modalMode === 'edit' ? 'Add Points' : 'Save & Generate QR'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;