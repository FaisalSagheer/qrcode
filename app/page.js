'use client'
import React, { useState } from 'react';
import QRCode from "react-qr-code";

function Home() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [price, setPrice] = useState("");

  const [generated, setGenerated] = useState(false);

  // ─── Input Handlers with Regex Filtering ────────────────────────────────

  const handleNameChange = (e) => {
    // Allow letters, spaces, hyphens, apostrophes (common in names)
    const value = e.target.value;
    if (/^[\p{L}\s'-]*$/u.test(value) || value === "") {
      setName(value);
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value;
    // Allow: +, digits only — typical Pakistani mobile patterns
    if (/^[+]?[0-9]*$/.test(value)) {
      setMobile(value);
    }
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    // Allow digits and at most one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setPrice(value);
    }
  };

  const qrValue = `Name: ${name.trim()}\nMobile: ${mobile.trim()}\nPrice: ${price.trim()} PKR`;

  const handleGenerate = () => {
    const trimmedName   = name.trim();
    const trimmedMobile = mobile.trim();
    const trimmedPrice  = price.trim();

    if (!trimmedName || !trimmedMobile || !trimmedPrice) {
      alert("Please fill in all fields!");
      return;
    }

    // Optional: extra mobile validation (Pakistan common formats)
    if (!/^((\+92|0092|92|0)[0-9]{10})$/.test(trimmedMobile)) {
      alert("Please enter a valid Pakistani mobile number (e.g. +923001234567 or 03001234567)");
      return;
    }

    // Optional: price should be > 0
    if (Number(trimmedPrice) <= 0) {
      alert("Price should be greater than 0");
      return;
    }

    setGenerated(true);
  };

  const handleBack = () => {
    setGenerated(false);
  };

  // ─── INPUT SCREEN ───────────────────────────────────────────────────────
  if (!generated) {
    return (
      <div
        style={{
          padding: 24,
          margin: "0 auto",
          maxWidth: 420,
          fontFamily: "system-ui, sans-serif",
        }}
        className="mt-40!"
      >
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>
          QR Code Generator
        </h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
            Name
          </label>
          <input
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={handleNameChange}
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
            Mobile Number
          </label>
          <input
            type="tel"           // better mobile keyboard on phones
            placeholder="+923001234567"
            maxLength={13}       // +92 + 10 digits = 13
            value={mobile}
            onChange={handleMobileChange}
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          />
          <small style={{ color: "#666", display: "block", marginTop: 4 }}>
            e.g. +923001234567 or 03001234567
          </small>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
            Price (PKR)
          </label>
          <input
            type="text"          // using text + regex → better control than type="number"
            placeholder="1500 or 1500.50"
            value={price}
            onChange={handlePriceChange}
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          />
        </div>

        <button
          onClick={handleGenerate}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Generate QR Code
        </button>
      </div>
    );
  }

  // ─── QR SCREEN ──────────────────────────────────────────────────────────
  return (
    <div
      style={{
        padding: 24,
        maxWidth: 420,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <div
        style={{
          height: "auto",
          margin: "0 auto",
          maxWidth: 260,
          width: "100%",
          background: "#fff",
          padding: 20,
          borderRadius: 16,
          boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
        }}
        className="mt-30!"
      >
        <QRCode
          size={256}
          style={{
            height: "auto",
            maxWidth: "100%",
            width: "100%",
          }}
          value={qrValue}
          level="Q"
        />
      </div>

      <p
        style={{
          color: "#444",          // changed from white → better visibility
          fontSize: 15,
          margin: "20px 0",
        }}
      >
        Scan to view details
      </p>

      <button
        onClick={handleBack}
        style={{
          background: "transparent",
          border: "none",
          color: "#2563eb",
          fontSize: 15,
          textDecoration: "underline",
          cursor: "pointer",
          padding: 0,
        }}
      >
        ← Back to edit
      </button>
    </div>
  );
}

export default Home;