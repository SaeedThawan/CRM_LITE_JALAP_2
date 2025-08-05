// ✅ رابط تطبيق Google Apps Script المنشور
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxcuDHoAseJaZY48OwtBciwDKG0tzN5cTlcQRPMqSg9hZNEuwPU4esWJ0UnfgZ-WrP2Gw/exec';

// 🔽 تعريف المتغيرات العامة
let productsData = [], inventoryProductsData = [], salesRepresentatives = [], customersMain = [], visitOutcomes = [], visitPurposes = [], visitTypes = [];

// 🔽 عناصر DOM
const visitForm = document.getElementById('visitForm');
const entryUserNameInput = document.getElementById('entryUserName');
const salesRepNameSelect = document.getElementById('salesRepName');
const customerNameInput = document.getElementById('customerName');
const customerListDatalist = document.getElementById('customerList');
const visitTypeSelect = document.getElementById('visitType');
const visitPurposeSelect = document.getElementById('visitPurpose');
const visitOutcomeSelect = document.getElementById('visitOutcome');
const customerTypeSelect = document.getElementById('customerType');
const notesTextarea = document.getElementById('notes');
const inventoryNotesTextarea = document.getElementById('inventoryNotes');
const productCategoriesDiv = document.getElementById('productCategories');
const productsDisplayDiv = document.getElementById('productsDisplay');
const inventorySectionDiv = document.getElementById('inventorySection');
const inventoryListDatalist = document.getElementById('inventoryList');
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');
const addInventoryItemBtn = document.getElementById('addInventoryItem');
const normalVisitRelatedFieldsDiv = document.getElementById('normalVisitRelatedFields');
const normalProductSectionDiv = document.getElementById('normalProductSection');
const submitBtn = document.getElementById('submitBtn');
const loadingSpinner = document.getElementById('loadingSpinner');

// ✅ SweetAlert رسائل التنبيه
function showSuccessMessage() {
  Swal.fire({ title: '✅ تم الإرسال!', text: 'تم إرسال النموذج بنجاح.', icon: 'success', confirmButtonText: 'ممتاز' });
}
function showErrorMessage(message) {
  Swal.fire({ title: '❌ فشل الإرسال', text: message || 'حدث خطأ أثناء إرسال النموذج.', icon: 'error', confirmButtonText: 'موافق' });
}
function showWarningMessage(message) {
  Swal.fire({ title: '⚠️ تنبيه', text: message, icon: 'warning', confirmButtonText: 'موافق' });
}

// ✅ أدوات التاريخ والمعرّفات
function generateUniqueID(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
function formatDate(date) {
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}
function formatTime(date) {
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
function formatTimestamp(date) {
  return date.toLocaleString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ✅ تحميل بيانات JSON
async function fetchJsonData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`خطأ في تحميل ${url}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ ${url}:`, error);
    showErrorMessage(`فشل تحميل البيانات من ${url}`);
    return [];
  }
}

async function loadAllData() {
  [
    productsData,
    inventoryProductsData,
    salesRepresentatives,
    customersMain,
    visitOutcomes,
    visitPurposes,
    visitTypes
  ] = await Promise.all([
    fetchJsonData('products.json'),
    fetchJsonData('inventory_products.json'),
    fetchJsonData('sales_representatives.json'),
    fetchJsonData('customers_main.json'),
    fetchJsonData('visit_outcomes.json'),
    fetchJsonData('visit_purposes.json'),
    fetchJsonData('visit_types.json')
  ]);

  populateSelect(salesRepNameSelect, salesRepresentatives, 'Sales_Rep_Name_AR', 'Sales_Rep_Name_AR');
  populateCustomerDatalist();
  populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR', 'Visit_Type_Name_AR');
  populateSelect(visitPurposeSelect, visitPurposes);
  populateSelect(visitOutcomeSelect, visitOutcomes);
  setupProductCategories();
  populateInventoryDatalist();
}

// ✅ تعبئة القوائم
function populateSelect(select, list, valueKey, textKey) {
  while (select.children.length > 1) select.removeChild(select.lastChild);
  list.forEach(item => {
    const option = document.createElement('option');
    option.value = item[valueKey] || item;
    option.textContent = item[textKey] || item;
    select.appendChild(option);
  });
}
function populateCustomerDatalist() {
  customerListDatalist.innerHTML = '';
  customersMain.forEach(c => {
    const option = document.createElement('option');
    option.value = c.Customer_Name_AR;
    customerListDatalist.appendChild(option);
  });
}
function populateInventoryDatalist() {
  inventoryListDatalist.innerHTML = '';
  inventoryProductsData.forEach(product => {
    const option = document.createElement('option');
    option.value = product.Product_Name_AR;
    for (const key in product) {
      const camelKey = key.replace(/_(\w)/g, (_, c) => c.toUpperCase());
      option.dataset[camelKey] = product[key];
    }
    inventoryListDatalist.appendChild(option);
  });
}

// ✅ عرض المنتجات حسب الفئة
let productCategories = {};
function setupProductCategories() {
  productCategoriesDiv.innerHTML = '';
  productCategories = {};
  productsData.forEach(p => {
    if (!productCategories[p.Category]) productCategories[p.Category] = [];
    productCategories[p.Category].push(p);
  });
  for (const category in productCategories) {
    const div = document.createElement('div');
    div.className = 'flex items-center';
    div.innerHTML = `
      <input type="checkbox" id="cat-${category}" value="${category}" class="h-5 w-5 cursor-pointer">
      <label for="cat-${category}" class="ml-2">${category}</label>
    `;
    productCategoriesDiv.appendChild(div);
    div.querySelector('input').addEventListener('change', e => toggleProductsDisplay(category, e.target.checked));
  }
}
function toggleProductsDisplay(category, show) {
  const products = productCategories[category];
  if (!products) return;
  if (show) {
    products.forEach(product => {
      const uniqueId = generateUniqueID('status');
      const div = document.createElement('div');
      div.className = 'product-item border p-3 rounded flex justify-between';
      div.setAttribute('data-category', category);
      div.innerHTML = `
        <label>${product.Product_Name_AR}</label>
        <div class="radio-group flex space-x-4 space-x-reverse">
          <label><input type="radio" name="status-${uniqueId}" value="متوفر"> <span>متوفر</span></label>
          <label><input type="radio" name="status-${uniqueId}" value="غير متوفر"> <span>غير متوفر</span></label>
        </div>
      `;
      productsDisplayDiv.appendChild(div);
    });
  } else {
    productsDisplayDiv.querySelectorAll(`[data-category="${category}"]`).forEach(el => el.remove());
  }
}
// ✅ رابط تطبيق Google Apps Script المنشور
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxcuDHoAseJaZY48OwtBciwDKG0tzN5cTlcQRPMqSg9hZNEuwPU4esWJ0UnfgZ-WrP2Gw/exec';

// 🔽 تعريف المتغيرات العامة
let productsData = [], inventoryProductsData = [], salesRepresentatives = [], customersMain = [], visitOutcomes = [], visitPurposes = [], visitTypes = [];

// 🔽 عناصر DOM
const visitForm = document.getElementById('visitForm');
const entryUserNameInput = document.getElementById('entryUserName');
const salesRepNameSelect = document.getElementById('salesRepName');
const customerNameInput = document.getElementById('customerName');
const customerListDatalist = document.getElementById('customerList');
const visitTypeSelect = document.getElementById('visitType');
const visitPurposeSelect = document.getElementById('visitPurpose');
const visitOutcomeSelect = document.getElementById('visitOutcome');
const customerTypeSelect = document.getElementById('customerType');
const notesTextarea = document.getElementById('notes');
const inventoryNotesTextarea = document.getElementById('inventoryNotes');
const productCategoriesDiv = document.getElementById('productCategories');
const productsDisplayDiv = document.getElementById('productsDisplay');
const inventorySectionDiv = document.getElementById('inventorySection');
const inventoryListDatalist = document.getElementById('inventoryList');
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');
const addInventoryItemBtn = document.getElementById('addInventoryItem');
const normalVisitRelatedFieldsDiv = document.getElementById('normalVisitRelatedFields');
const normalProductSectionDiv = document.getElementById('normalProductSection');
const submitBtn = document.getElementById('submitBtn');
const loadingSpinner = document.getElementById('loadingSpinner');

// ✅ SweetAlert رسائل التنبيه
function showSuccessMessage() {
  Swal.fire({ title: '✅ تم الإرسال!', text: 'تم إرسال النموذج بنجاح.', icon: 'success', confirmButtonText: 'ممتاز' });
}
function showErrorMessage(message) {
  Swal.fire({ title: '❌ فشل الإرسال', text: message || 'حدث خطأ أثناء إرسال النموذج.', icon: 'error', confirmButtonText: 'موافق' });
}
function showWarningMessage(message) {
  Swal.fire({ title: '⚠️ تنبيه', text: message, icon: 'warning', confirmButtonText: 'موافق' });
}

// ✅ أدوات التاريخ والمعرّفات
function generateUniqueID(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
function formatDate(date) {
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}
function formatTime(date) {
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
function formatTimestamp(date) {
  return date.toLocaleString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ✅ تحميل بيانات JSON
async function fetchJsonData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`خطأ في تحميل ${url}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ ${url}:`, error);
    showErrorMessage(`فشل تحميل البيانات من ${url}`);
    return [];
  }
}

async function loadAllData() {
  [
    productsData,
    inventoryProductsData,
    salesRepresentatives,
    customersMain,
    visitOutcomes,
    visitPurposes,
    visitTypes
  ] = await Promise.all([
    fetchJsonData('products.json'),
    fetchJsonData('inventory_products.json'),
    fetchJsonData('sales_representatives.json'),
    fetchJsonData('customers_main.json'),
    fetchJsonData('visit_outcomes.json'),
    fetchJsonData('visit_purposes.json'),
    fetchJsonData('visit_types.json')
  ]);

  populateSelect(salesRepNameSelect, salesRepresentatives, 'Sales_Rep_Name_AR', 'Sales_Rep_Name_AR');
  populateCustomerDatalist();
  populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR', 'Visit_Type_Name_AR');
  populateSelect(visitPurposeSelect, visitPurposes);
  populateSelect(visitOutcomeSelect, visitOutcomes);
  setupProductCategories();
  populateInventoryDatalist();
}

// ✅ تعبئة القوائم
function populateSelect(select, list, valueKey, textKey) {
  while (select.children.length > 1) select.removeChild(select.lastChild);
  list.forEach(item => {
    const option = document.createElement('option');
    option.value = item[valueKey] || item;
    option.textContent = item[textKey] || item;
    select.appendChild(option);
  });
}
function populateCustomerDatalist() {
  customerListDatalist.innerHTML = '';
  customersMain.forEach(c => {
    const option = document.createElement('option');
    option.value = c.Customer_Name_AR;
    customerListDatalist.appendChild(option);
  });
}
function populateInventoryDatalist() {
  inventoryListDatalist.innerHTML = '';
  inventoryProductsData.forEach(product => {
    const option = document.createElement('option');
    option.value = product.Product_Name_AR;
    for (const key in product) {
      const camelKey = key.replace(/_(\w)/g, (_, c) => c.toUpperCase());
      option.dataset[camelKey] = product[key];
    }
    inventoryListDatalist.appendChild(option);
  });
}

// ✅ عرض المنتجات حسب الفئة
let productCategories = {};
function setupProductCategories() {
  productCategoriesDiv.innerHTML = '';
  productCategories = {};
  productsData.forEach(p => {
    if (!productCategories[p.Category]) productCategories[p.Category] = [];
    productCategories[p.Category].push(p);
  });
  for (const category in productCategories) {
    const div = document.createElement('div');
    div.className = 'flex items-center';
    div.innerHTML = `
      <input type="checkbox" id="cat-${category}" value="${category}" class="h-5 w-5 cursor-pointer">
      <label for="cat-${category}" class="ml-2">${category}</label>
    `;
    productCategoriesDiv.appendChild(div);
    div.querySelector('input').addEventListener('change', e => toggleProductsDisplay(category, e.target.checked));
  }
}
function toggleProductsDisplay(category, show) {
  const products = productCategories[category];
  if (!products) return;
  if (show) {
    products.forEach(product => {
      const uniqueId = generateUniqueID('status');
      const div = document.createElement('div');
      div.className = 'product-item border p-3 rounded flex justify-between';
      div.setAttribute('data-category', category);
      div.innerHTML = `
        <label>${product.Product_Name_AR}</label>
        <div class="radio-group flex space-x-4 space-x-reverse">
          <label><input type="radio" name="status-${uniqueId}" value="متوفر"> <span>متوفر</span></label>
          <label><input type="radio" name="status-${uniqueId}" value="غير متوفر"> <span>غير متوفر</span></label>
        </div>
      `;
      productsDisplayDiv.appendChild(div);
    });
  } else {
    productsDisplayDiv.querySelectorAll(`[data-category="${category}"]`).forEach(el => el.remove());
  }
}
