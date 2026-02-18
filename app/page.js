'use client'
import React, { useState, useEffect } from 'react';
import QRCode from "react-qr-code";

export default function LoyaltyApp() {
  const [role, setRole] = useState('admin');
  const [records, setRecords] = useState([]);

  // Transaction modal
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [modalCustomer, setModalCustomer] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'redeem'
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [inputValue, setInputValue] = useState(""); // PKR for add, points for redeem

  // QR modal
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCustomer, setQrCustomer] = useState(null);

  // User view
  const [userMobileInput, setUserMobileInput] = useState("");
  const [userRecord, setUserRecord] = useState(null);
  const [userError, setUserError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem('loyaltyRecords');
    if (saved) setRecords(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (records.length > 0) {
      sessionStorage.setItem('loyaltyRecords', JSON.stringify(records));
    }
  }, [records]);

  const pointsPer10PKR = 1;
  const calculatePointsFromAmount = (amt) => Math.floor(Number(amt) / 10);

  const resetTransactionForm = () => {
    setName(""); setMobile(""); setInputValue("");
    setModalCustomer(null); setModalMode('add');
  };

  const openTransactionModal = (customer = null, mode = 'add') => {
    setModalMode(mode);
    if (customer) {
      setName(customer.name);
      setMobile(customer.mobile);
      setInputValue("");
      setModalCustomer(customer);
    } else {
      resetTransactionForm();
    }
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    resetTransactionForm();
  };

  const openQrModal = (customer) => {
    setQrCustomer(customer);
    setIsQrModalOpen(true);
  };

  const closeQrModal = () => {
    setIsQrModalOpen(false);
    setQrCustomer(null);
  };

  const handleSubmitTransaction = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedMobile = mobile.trim();
    const trimmedInput = inputValue.trim();

    if (!trimmedMobile || !trimmedInput) {
      return alert("Mobile and value required");
    }

    if (!/^((\+92|0092|92|0)[0-9]{10})$/.test(trimmedMobile)) {
      return alert("Invalid Pakistani mobile number (e.g. +923001234567)");
    }

    const valueNum = Number(trimmedInput);
    if (valueNum <= 0 || !Number.isInteger(valueNum)) {
      return alert("Please enter a positive whole number");
    }

    const now = new Date().toLocaleString('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    let pointsChange;
    let transactionDesc;

    if (modalMode === 'add') {
      pointsChange = calculatePointsFromAmount(valueNum);
      transactionDesc = `${valueNum} PKR → +${pointsChange} pts`;
    } else {
      // redeem
      pointsChange = valueNum;
      if (modalCustomer && modalCustomer.totalPoints < pointsChange) {
        return alert(`Customer only has ${modalCustomer.totalPoints} points available`);
      }
      transactionDesc = `Redeemed ${pointsChange} pts`;
    }

    const signedChange = modalMode === 'add' ? pointsChange : -pointsChange;

    let updatedRecords;

    if (modalCustomer) {
      const newTotal = modalCustomer.totalPoints + signedChange;
      if (newTotal < 0) return alert("Cannot go below 0 points");

      updatedRecords = records.map(r =>
        r.mobile === trimmedMobile
          ? {
              ...r,
              totalPoints: newTotal,
              lastTransaction: {
                desc: transactionDesc,
                points: signedChange,
                date: now
              }
            }
          : r
      );
    } else {
      if (modalMode === 'redeem') return alert("Cannot redeem for new customers");
      if (!trimmedName) return alert("Name required for new customer");

      const newRec = {
        id: Date.now().toString(),
        name: trimmedName,
        mobile: trimmedMobile,
        totalPoints: pointsChange,
        lastTransaction: {
          desc: `${valueNum} PKR → +${pointsChange} pts`,
          points: pointsChange,
          date: now
        },
        createdAt: now,
      };
      updatedRecords = [newRec, ...records];
    }

    setRecords(updatedRecords);
    closeTransactionModal();
  };

  // User view - check points
  const handleUserCheck = (e) => {
    e.preventDefault();
    setUserError("");
    setUserRecord(null);
    const trimmed = userMobileInput.trim();
    if (!trimmed) return setUserError("Please enter mobile number");
    const found = records.find(r => r.mobile === trimmed);
    found ? setUserRecord(found) : setUserError("No record found for this number");
  };

  const qrContent = (rec) =>
    `Name: ${rec.name}\nMobile: ${rec.mobile}\nPoints: ${rec.totalPoints}\nLast: ${rec.lastTransaction?.desc || 'None'}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Role Switch */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Loyalty Points</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setRole('admin')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                role === 'admin' ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setRole('user')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                role === 'user' ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Customer View
            </button>
          </div>
        </div>
      </div>

      {/* USER VIEW */}
      {role === 'user' && (
        <div className="max-w-md mx-auto px-5 text-black pt-4">
          {!userRecord ? (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Check Your Points</h2>
              <form onSubmit={handleUserCheck} className="space-y-4">
                <input
                  type="tel"
                  value={userMobileInput}
                  onChange={e => setUserMobileInput(e.target.value)}
                  placeholder="+923001234567"
                  maxLength={13}
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {userError && <p className="text-red-600 text-sm text-center font-medium">{userError}</p>}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition shadow-md"
                >
                  Show My Points & QR
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl p-4 text-center">
              <h3 className="text-2xl font-bold text-gray-800 ">{userRecord.name}</h3>
              <p className="text-gray-600 mb-6">{userRecord.mobile}</p>

              <div className="inline-block bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
                <QRCode value={qrContent(userRecord)} size={240} level="Q" />
              </div>

              <div className="text-6xl font-extrabold text-green-600">{userRecord.totalPoints}</div>
              <p className="text-lg text-gray-500 mb-6">points</p>

              {userRecord.lastTransaction && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                  <div className="font-medium">Last transaction:</div>
                  {userRecord.lastTransaction.desc}<br />
                  <span className="text-xs opacity-70">{userRecord.lastTransaction.date}</span>
                </div>
              )}

              <button
                onClick={() => { setUserRecord(null); setUserMobileInput(""); }}
                className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm font-medium"
              >
                Check another number
              </button>
            </div>
          )}
        </div>
      )}

      {/* ADMIN VIEW */}
      {role === 'admin' && (
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={() => openTransactionModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow transition font-medium"
            >
              + New Transaction
            </button>
          </div>

          {records.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow text-center text-gray-500 text-lg">
              No customers yet
            </div>
          ) : (
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mobile</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Points</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Transaction</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {records.map(rec => (
                      <tr key={rec.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-900">{rec.name}</td>
                        <td className="px-6 py-4 text-gray-600">{rec.mobile}</td>
                        <td className="px-6 py-4 font-bold text-green-700">{rec.totalPoints}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {rec.lastTransaction ? rec.lastTransaction.desc : '—'}
                          <div className="text-xs text-gray-500 mt-0.5">{rec.lastTransaction?.date}</div>
                        </td>
                        <td className="px-6 py-4 text-center space-x-2">
                          <button
                            onClick={() => openTransactionModal(rec, 'add')}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => openTransactionModal(rec, 'redeem')}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                          >
                            Redeem
                          </button>
                          <button
                            onClick={() => openQrModal(rec)}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                          >
                            QR
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRANSACTION MODAL */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 relative">
            <button
              onClick={closeTransactionModal}
              className="absolute top-5 right-5 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-7">
              {modalCustomer
                ? `${modalMode === 'add' ? 'Add Points' : 'Redeem Points'} – ${modalCustomer.name}`
                : "New Customer – Add Points"}
            </h3>

            <form onSubmit={handleSubmitTransaction} className="space-y-6 text-black">
              {!modalCustomer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="+923xxxxxxxxx"
                  maxLength={13}
                  disabled={!!modalCustomer}
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {modalMode === 'add' ? "Purchase Amount (PKR)" : "Points to Redeem"}
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => {
                    const v = e.target.value;
                    if (/^\d*$/.test(v)) setInputValue(v); // only integers
                  }}
                  placeholder={modalMode === 'add' ? "1500" : "100"}
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  required
                />
                {modalMode === 'add' ? (
                  <p className="mt-2 text-sm text-gray-500">10 PKR = 1 point</p>
                ) : (
                  modalCustomer && (
                    <p className="mt-2 text-sm text-gray-600">
                      Available: <strong>{modalCustomer.totalPoints} points</strong>
                    </p>
                  )
                )}
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={closeTransactionModal}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-8 py-3 text-white rounded-xl font-medium shadow transition ${
                    modalMode === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {modalMode === 'add' ? 'Add Points' : 'Redeem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {isQrModalOpen && qrCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative text-center">
            <button
              onClick={closeQrModal}
              className="absolute top-6 right-6 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">{qrCustomer.name}</h3>
            <p className="text-gray-600 mb-6">{qrCustomer.mobile}</p>

            <div className="inline-block bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
              <QRCode value={qrContent(qrCustomer)} size={260} level="Q" />
            </div>

            <div className="text-6xl font-extrabold text-green-600 mb-2">{qrCustomer.totalPoints}</div>
            <p className="text-lg text-gray-500 mb-6">points</p>

            {qrCustomer.lastTransaction && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                <div className="font-medium">Last transaction:</div>
                {qrCustomer.lastTransaction.desc}<br />
                <span className="text-xs opacity-75 mt-1 block">{qrCustomer.lastTransaction.date}</span>
              </div>
            )}

            <button
              onClick={closeQrModal}
              className="mt-8 text-blue-600 hover:text-blue-800 font-medium underline text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}