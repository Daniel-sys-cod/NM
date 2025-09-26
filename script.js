// =============================
// 🔹 Sign Up Handling
// =============================
document.getElementById("signupForm")?.addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim().toLowerCase();
  const password = document.getElementById("signupPassword").value;

  if (!name || !email || !password) {
    alert("Please fill all fields ❗");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];
  if (users.some(u => u.email === email)) {
    alert("Email already registered ❗");
    return;
  }

  users.push({ name, email, password });
  localStorage.setItem("users", JSON.stringify(users));
  alert("Account created successfully ✔️");
  window.location.href = "index.html"; // redirect to sign-in page
});

// =============================
// 🔹 Sign In Handling
// =============================
document.getElementById("signinForm")?.addEventListener("submit", function(e) {
  e.preventDefault();
  const email = document.getElementById("signinEmail").value.trim().toLowerCase();
  const password = document.getElementById("signinPassword").value;

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    alert("Invalid credentials ❗");
    return;
  }

  localStorage.setItem("loggedInUser", JSON.stringify(user));
  alert("Signed in successfully ✔️");
  window.location.href = "home.html";
});

// =============================
// 🔹 Discount Codes System (updated to match admin UI)
// =============================

const ADMIN_PASSWORD = "NM";

function getDiscountCodes() {
  let discountCodes = JSON.parse(localStorage.getItem("discountCodes")) || {};
  if (Array.isArray(discountCodes)) {
    const obj = {};
    discountCodes.forEach(d => obj[d.code.toLowerCase()] = { value: d.value, type: d.type, used: !!d.used });
    discountCodes = obj;
    localStorage.setItem("discountCodes", JSON.stringify(discountCodes));
  }
  return discountCodes;
}

// add / update a code programmatically (admin-dashboard calls addDiscountCodeAdmin)
function saveDiscountCode(code, value, type, markUsed = false) {
  const codes = getDiscountCodes();
  codes[code.toLowerCase()] = { value: Number(value), type, used: !!markUsed };
  localStorage.setItem("discountCodes", JSON.stringify(codes));
}

function applyDiscount(basePrice, code, options = {}) {
  if (!code) return { finalPrice: basePrice };
  const normalized = code.trim().toLowerCase();
  const discountCodes = getDiscountCodes();
  const info = discountCodes[normalized];

  // special reserved code behavior (example): shinliana26 allowed except for pass packages
  if (normalized === "shinliana26") {
    // If caller provided isPass flag, let caller decide; otherwise apply generic 5%
    if (options.isPass) return { finalPrice: basePrice, message: "Code not valid for Pass packages" };
    return { finalPrice: Math.round(basePrice * 0.95) };
  }

  if (info) {
    if (info.type === "once" && info.used) return { finalPrice: basePrice, message: "Code already used" };
    const finalPrice = Math.round(basePrice * (1 - info.value / 100));
    // mark used only when explicitly requested by caller (e.g. on successful submit)
    if (info.type === "once" && options.markUsed) {
      info.used = true;
      discountCodes[normalized] = info;
      localStorage.setItem("discountCodes", JSON.stringify(discountCodes));
    }
    return { finalPrice };
  }

  return { finalPrice: basePrice };
}

// =============================
// 🔹 Diamond Selection & Discount
// =============================
const diamondBoxes = document.querySelectorAll(".diamond-box");
const selectedInfoBox = document.getElementById("selectedInfo");
const selectedDiamondText = document.getElementById("selectedDiamondText");
const priceBox = document.getElementById("priceBox");
const discountInput = document.getElementById("discountCode");
const discountPriceText = document.getElementById("discountPrice");
const paymentSelectInfo = document.getElementById("paymentSelectInfo");
const paymentDetails = document.getElementById("paymentDetails");

diamondBoxes.forEach(box => {
  box.addEventListener("click", () => {
    diamondBoxes.forEach(b => b.classList.remove("selected"));
    box.classList.add("selected");
    document.getElementById("diamondAmount").value = box.dataset.price;
    document.getElementById("diamondText").value = box.dataset.text;
    priceBox.innerText = `Price: ${box.dataset.price} MMK`;
    selectedInfoBox.style.display = "block";
    selectedDiamondText.innerText = `Diamond: ${box.dataset.text}`;
    if(discountInput) discountInput.value = "";
    if(discountPriceText) discountPriceText.style.display = "none";
  });
});

discountInput?.addEventListener("input", () => {
  const basePrice = Number(document.getElementById("diamondAmount").value) || 0;
  const code = discountInput.value.trim();
  const { finalPrice, message } = applyDiscount(basePrice, code);

  if(message) {
    discountPriceText.style.display = "none";
    priceBox.innerText = `Price: ${basePrice} MMK (${message})`;
  } else if(finalPrice !== basePrice) {
    discountPriceText.innerText = `Discounted Price: ${finalPrice} MMK`;
    discountPriceText.style.display = "block";
    priceBox.innerText = `Price: ${finalPrice} MMK`;
  } else {
    discountPriceText.style.display = "none";
    priceBox.innerText = `Price: ${basePrice} MMK`;
  }
});

// =============================
// 🔹 Payment Info Update
// =============================
function updatePaymentDetails(method) {
  if(!paymentDetails) return;
  const infoMap = {
    WavePay: { name: "Nay Win Hein", phone: "09984198837", img: "wavepay.png" },
    KPay: { name: "U Nay Lin Aung", phone: "09251581780", img: "kpay.png" }
  };
  const info = infoMap[method];
  if(info) {
    paymentDetails.innerHTML = `<img src="${info.img}" alt="${method} Logo"><br>👤 ${info.name}<br>📞 ${info.phone}`;
    paymentDetails.style.display = "block";
  } else {
    paymentDetails.style.display = "none";
  }
}
paymentSelectInfo?.addEventListener("change", () => updatePaymentDetails(paymentSelectInfo.value));
updatePaymentDetails(paymentSelectInfo?.value);

// =============================
// 🔹 Handle Purchase Form
// =============================
document.getElementById("purchaseForm")?.addEventListener("submit", function(event) {
  event.preventDefault();
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if(!user) { alert("Please sign in first."); return; }

  const file = document.getElementById("screenshot").files[0];
  if(!file) { alert("Please upload a payment screenshot."); return; }

  const reader = new FileReader();
  reader.onload = function(e) {
    const screenshotData = e.target.result;
    const basePrice = Number(document.getElementById("diamondAmount").value) || 0;
    const code = discountInput?.value.trim().toLowerCase();
    const { finalPrice } = applyDiscount(basePrice, code);

    const order = {
      userId: document.getElementById("userId").value,
      zoneId: document.getElementById("zoneId").value,
      ign: document.getElementById("ign").value,
      accountName: document.getElementById("accountName").value,
      diamondPackage: document.getElementById("diamondText").value,
      price: finalPrice,
      originalPrice: basePrice,
      paymentMethod: paymentSelectInfo?.value,
      date: new Date().toLocaleString(),
      screenshot: screenshotData,
      customerEmail: user.email,
      status: "Pending"
    };

    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));

    alert("✅ Order submitted successfully! Double-check your payment details.");
    window.location.href = "dashboard.html";
  };
  reader.readAsDataURL(file);
});

// =============================
// 🔹 Orders Display
// =============================
function displayOrders() {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const adminTbody = document.getElementById("ordersTableBody");
  if(adminTbody) {
    adminTbody.innerHTML = "";
    orders.forEach(order => {
      const priceText = order.originalPrice !== order.price
        ? `${order.price} MMK (Original: ${order.originalPrice} MMK)`
        : `${order.price} MMK`;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${order.userId}</td>
        <td>${order.zoneId}</td>
        <td>${order.ign || "-"}</td>
        <td>${order.accountName}</td>
        <td>${order.diamondPackage}</td>
        <td>${priceText}</td>
        <td>${order.date}</td>
        <td><img src="${order.screenshot}" alt="screenshot" width="80"></td>
        <td>${order.customerEmail}</td>
        <td style="font-weight:bold; color:${order.status === "Completed" ? "lime" : "orange"};">
          ${order.status}
        </td>`;
      adminTbody.appendChild(row);
    });
  }

  const userTbody = document.getElementById("myOrdersTableBody");
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if(user && userTbody) {
    userTbody.innerHTML = "";
    orders.filter(o => o.customerEmail === user.email).forEach(order => {
      const priceText = order.originalPrice !== order.price
        ? `${order.price} MMK (Original: ${order.originalPrice} MMK)`
        : `${order.price} MMK`;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${order.zoneId}</td>
        <td>${order.ign || "-"}</td>
        <td>${order.accountName}</td>
        <td>${order.diamondPackage}</td>
        <td>${priceText}</td>
        <td>${order.date}</td>
        <td><img src="${order.screenshot}" alt="screenshot" width="80"></td>
        <td style="font-weight:bold; color:${order.status === "Completed" ? "lime" : "orange"};">
          ${order.status}
        </td>`;
      userTbody.appendChild(row);
    });
  }
}
displayOrders();
