'use client'
import React, { useState, useEffect } from 'react';
import QRCode from "react-qr-code";

export default function LoyaltyApp() {
  const [role, setRole] = useState('admin');
  const [records, setRecords] = useState([]);

  // Transaction modal (Add / Subtract)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [modalCustomer, setModalCustomer] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'subtract'
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState("");

  // QR pop-up modal
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCustomer, setQrCustomer] = useState(null);

  // User view state
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

  const calculatePoints = (val) => Math.floor(Number(val) / 10);

  const resetTransactionForm = () => {
    setName(""); setMobile(""); setAmount("");
    setModalCustomer(null); setModalMode('add');
  };

  const openTransactionModal = (customer = null, mode = 'add') => {
    setModalMode(mode);
    if (customer) {
      setName(customer.name);
      setMobile(customer.mobile);
      setAmount("");
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
    const trimmedAmount = amount.trim();

    if (!trimmedMobile || !trimmedAmount) return alert("Mobile and amount required");

    if (!/^((\+92|0092|92|0)[0-9]{10})$/.test(trimmedMobile)) {
      return alert("Invalid mobile number");
    }

    const amt = Number(trimmedAmount);
    if (amt <= 0) return alert("Amount must be > 0");

    const pointsChange = calculatePoints(amt);
    const now = new Date().toLocaleString('en-PK');
    const signedChange = modalMode === 'add' ? pointsChange : -pointsChange;

    let updatedRecords;

    if (modalCustomer) {
      const newTotal = modalCustomer.totalPoints + signedChange;
      if (newTotal < 0) return alert("Cannot go below 0 points!");

      updatedRecords = records.map(r =>
        r.mobile === trimmedMobile
          ? {
              ...r,
              totalPoints: newTotal,
              lastTransaction: { price: trimmedAmount, pointsAdded: signedChange, date: now }
            }
          : r
      );
    } else {
      if (modalMode === 'subtract') return alert("Subtract only for existing customers");
      if (!trimmedName) return alert("Name required for new customer");
      const newRec = {
        id: Date.now().toString(),
        name: trimmedName,
        mobile: trimmedMobile,
        totalPoints: pointsChange,
        lastTransaction: { price: trimmedAmount, pointsAdded: pointsChange, date: now },
        createdAt: now,
      };
      updatedRecords = [newRec, ...records];
    }

    setRecords(updatedRecords);
    closeTransactionModal();
  };

  // User view
  const handleUserCheck = (e) => {
    e.preventDefault();
    setUserError("");
    setUserRecord(null);
    const trimmed = userMobileInput.trim();
    if (!trimmed) return setUserError("Enter mobile number");
    const found = records.find(r => r.mobile === trimmed);
    found ? setUserRecord(found) : setUserError("No record found");
  };

  const userQrValue = userRecord
    ? `Name: ${userRecord.name}\nMobile: ${userRecord.mobile}\nTotal Points: ${userRecord.totalPoints}\nLast: ${userRecord.lastTransaction?.price || '—'} PKR (${userRecord.lastTransaction?.pointsAdded >= 0 ? '+' : ''}${userRecord.lastTransaction?.pointsAdded || 0})`
    : "";

  const adminQrValue = (rec) =>
    `Name: ${rec.name}\nMobile: ${rec.mobile}\nTotal Points: ${rec.totalPoints}\nLast: ${rec.lastTransaction?.price || '—'} PKR (${rec.lastTransaction?.pointsAdded >= 0 ? '+' : ''}${rec.lastTransaction?.pointsAdded || 0})`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Role switcher */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Loyalty Points App</h1>
          <div className="flex gap-3">
            <button onClick={() => setRole('admin')} className={`px-4 py-1.5 rounded text-sm font-medium transition ${role === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              Admin View
            </button>
            <button onClick={() => setRole('user')} className={`px-4 py-1.5 rounded text-sm font-medium transition ${role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              User View
            </button>
          </div>
        </div>
      </div>

      {/* USER VIEW */}
      {role === 'user' && (
        <div className="max-w-md mx-auto mt-4 px-5">
          {!userRecord ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-black">
              <h2 className="text-2xl font-bold text-center mb-6">Your Loyalty Points</h2>
              <form onSubmit={handleUserCheck} className="space-y-5">
                <input type="tel" value={userMobileInput} onChange={e => setUserMobileInput(e.target.value)} placeholder="+923xxxxxxxxx" maxLength={13} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                {userError && <p className="text-red-600 text-sm text-center">{userError}</p>}
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium">Show My QR & Points</button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl text-gray-600 p-8 text-center">
              <h3 className="text-xl font-bold mb-2">{userRecord.name}</h3>
              <p className="mb-6">{userRecord.mobile}</p>
              <div className="inline-block bg-white p-6 rounded-xl shadow-lg mb-6">
                <QRCode value={userQrValue} size={220} level="Q" />
              </div>
              <div className="text-5xl font-extrabold text-green-600 mb-2">{userRecord.totalPoints}</div>
              <p className="text-sm text-gray-500">points</p>
              {userRecord.lastTransaction && (
                <div className="mt-6 text-sm text-gray-600">
                  Last: {userRecord.lastTransaction.price} PKR<br />
                  ({userRecord.lastTransaction.pointsAdded >= 0 ? '+' : ''}{userRecord.lastTransaction.pointsAdded} pts)<br />
                  <span className="text-xs opacity-70">{userRecord.lastTransaction.date}</span>
                </div>
              )}
              <button onClick={() => { setUserRecord(null); setUserMobileInput(""); }} className="mt-8 text-blue-600 underline text-sm">Check another number</button>
            </div>
          )}
        </div>
      )}

      {/* ADMIN VIEW – QR button only */}
      {role === 'admin' && (
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <button onClick={() => openTransactionModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg shadow transition">
              + New Customer / Transaction
            </button>
          </div>

          {records.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow text-center text-gray-500">No records</div>
          ) : (
            <div className="bg-white shadow-xl rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Mobile</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Points</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Last Transaction</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-black">
                    {records.map(rec => (
                      <tr key={rec.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{rec.name}</td>
                        <td className="px-6 py-4">{rec.mobile}</td>
                        <td className="px-6 py-4 font-bold text-green-700">{rec.totalPoints}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {rec.lastTransaction ? `${rec.lastTransaction.price} PKR (${rec.lastTransaction.pointsAdded >= 0 ? '+' : ''}${rec.lastTransaction.pointsAdded} pts)` : '—'}
                        </td>
                        <td className="px-6 py-4 text-center space-x-3">
                          <button onClick={() => openTransactionModal(rec, 'add')} className="text-xs bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded">Add</button>
                          <button onClick={() => openTransactionModal(rec, 'subtract')} className="text-xs bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded">Subtract</button>
                          <button onClick={() => openQrModal(rec)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded">QR Code</button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 relative">
            <button onClick={closeTransactionModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {modalCustomer ? `${modalMode === 'add' ? 'Add' : 'Subtract'} Points – ${modalCustomer.name}` : "New Customer / Transaction"}
            </h3>

            <form onSubmit={handleSubmitTransaction} className="space-y-5 text-black">
              {!modalCustomer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Customer name" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+923xxxxxxxxx" maxLength={13} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required disabled={!!modalCustomer} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
                <input type="text" value={amount} onChange={e => { const v = e.target.value; if (/^\d*\.?\d{0,2}$/.test(v)) setAmount(v); }} placeholder="1500" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                <p className="mt-1 text-xs text-gray-500">10 PKR = 1 point</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeTransactionModal} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
                <button type="submit" className={`px-6 py-2 text-white rounded-lg ${modalMode === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {modalMode === 'add' ? 'Add Points' : 'Subtract Points'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR CODE POP-UP MODAL */}
      {isQrModalOpen && qrCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative text-center">
            <button onClick={closeQrModal} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">{qrCustomer.name}</h3>
            <p className="text-gray-600 mb-6">{qrCustomer.mobile}</p>

            <div className="inline-block bg-white p-5 rounded-2xl shadow-md mb-8 border border-gray-100">
              <QRCode value={adminQrValue(qrCustomer)} size={260} level="Q" />
            </div>

            <div className="text-4xl font-bold text-green-600 mb-1">{qrCustomer.totalPoints}</div>
            <p className="text-sm text-gray-500">points</p>

            {qrCustomer.lastTransaction && (
              <div className="mt-6 text-sm text-gray-600">
                Last: {qrCustomer.lastTransaction.price} PKR<br />
                ({qrCustomer.lastTransaction.pointsAdded >= 0 ? '+' : ''}{qrCustomer.lastTransaction.pointsAdded} pts)<br />
                <span className="text-xs opacity-70">{qrCustomer.lastTransaction.date}</span>
              </div>
            )}

            <button onClick={closeQrModal} className="mt-8 text-blue-600 hover:text-blue-800 underline text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}