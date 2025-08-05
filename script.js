// ✅ رابط تطبيق Google Apps Script المنشور
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxcuDHoAseJaZY48OwtBciwDKG0tzN5cTlcQRPMqSg9hZNEuwPU4esWJ0UnfgZ-WrP2Gw/exec';

// 🔽 تعريف المتغيرات العامة للبيانات
let productsData = [], inventoryProductsData = [], salesRepresentatives = [], customersMain = [], visitOutcomes = [], visitPurposes = [], visitTypes = [];

// 🔽 عناصر DOM (Document Object Model) المستخدمة
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

// ✅ رسائل التنبيه باستخدام مكتبة SweetAlert2
function showSuccessMessage() {
    Swal.fire({ title: '✅ تم الإرسال!', text: 'تم إرسال النموذج بنجاح.', icon: 'success', confirmButtonText: 'ممتاز' });
}
function showErrorMessage(message) {
    Swal.fire({ title: '❌ فشل الإرسال', text: message || 'حدث خطأ أثناء إرسال النموذج.', icon: 'error', confirmButtonText: 'موافق' });
}
function showWarningMessage(message) {
    Swal.fire({ title: '⚠️ تنبيه', text: message, icon: 'warning', confirmButtonText: 'موافق' });
}

// ✅ وظائف مساعدة لتوليد معرفات وتنسيق التواريخ
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

// ✅ دالة لجلب البيانات من ملفات JSON بشكل غير متزامن
async function fetchJsonData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`خطأ في تحميل البيانات من ${url}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ فشل تحميل ${url}:`, error);
        showErrorMessage(`فشل تحميل البيانات الأساسية من ${url}. يرجى التحقق من الملف والمحاولة مرة أخرى.`);
        return [];
    }
}

// ✅ دالة رئيسية لتحميل جميع البيانات عند بدء التشغيل
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

// ✅ وظائف لتعبئة القوائم المنسدلة والداتاليستات
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

// ✅ إدارة المنتجات للزيارات العادية
let productCategories = {};
function setupProductCategories() {
    productCategoriesDiv.innerHTML = '';
    productCategories = {};
    productsData.forEach(p => {
        if (!productCategories[p.Category]) {
            productCategories[p.Category] = [];
        }
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
        const fragment = document.createDocumentFragment();
        products.forEach(product => {
            const uniqueId = generateUniqueID('status');
            const div = document.createElement('div');
            div.className = 'product-item border p-3 rounded flex justify-between';
            div.setAttribute('data-category', category);
            div.innerHTML = `
                <label>${product.Product_Name_AR}</label>
                <div class="radio-group flex space-x-4 space-x-reverse">
                    <label><input type="radio" name="status-${uniqueId}" value="متوفر" required> <span>متوفر</span></label>
                    <label><input type="radio" name="status-${uniqueId}" value="غير متوفر" required> <span>غير متوفر</span></label>
                </div>
            `;
            fragment.appendChild(div);
        });
        productsDisplayDiv.appendChild(fragment);
    } else {
        productsDisplayDiv.querySelectorAll(`[data-category="${category}"]`).forEach(el => el.remove());
    }
}

// ✅ وظائف إدارة عناصر الجرد
function addInventoryItem() {
    const template = `
        <div class="inventory-item border p-4 rounded relative bg-white">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label>المنتج</label><input type="text" name="Inventory_Product_Name_AR" list="inventoryList" placeholder="اسم المنتج" required></div>
                <div><label>الكمية</label><input type="number" name="Inventory_Quantity" min="0" placeholder="الكمية" required></div>
                <div><label>تاريخ الانتهاء</label><input type="date" name="Expiration_Date" required></div>
                <div><label>الوحدة</label>
                    <select name="Unit_Label" required>
                        <option value="">اختر الوحدة</option>
                        <option value="علبة">علبة</option>
                        <option value="شد">شد</option>
                        <option value="باكت">باكت</option>
                    </select>
                </div>
            </div>
            <button type="button" class="removeInventoryItem absolute top-2 left-2 text-red-600 text-sm">❌ حذف</button>
        </div>
    `;
    const item = document.createRange().createContextualFragment(template);
    inventoryItemsContainer.appendChild(item);
}

function addInitialInventoryItem() {
    inventoryItemsContainer.innerHTML = '';
    addInventoryItem();
}

// ✅ دالة رئيسية للتحقق من البيانات وإرسالها
async function handleSubmit(event) {
    event.preventDefault();
    submitBtn.disabled = true;
    loadingSpinner.classList.remove('hidden');

    const now = new Date();
    const selectedVisitType = visitTypeSelect.value;
    let payload = {};

    if (!entryUserNameInput.value || !salesRepNameSelect.value || !customerNameInput.value || !selectedVisitType) {
        showWarningMessage('يرجى تعبئة جميع الحقول الأساسية (اسم الموظف، المندوب، العميل، ونوع الزيارة).');
        submitBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
        return;
    }

    if (selectedVisitType === 'جرد استثنائي') {
        const collectedInventoryData = [];
        const inventoryItems = inventoryItemsContainer.querySelectorAll('.inventory-item');
        let hasValidItem = false;

        try {
            inventoryItems.forEach(div => {
                const productName = div.querySelector('[name="Inventory_Product_Name_AR"]')?.value || '';
                const quantity = div.querySelector('[name="Inventory_Quantity"]')?.value || '';
                const unitLabel = div.querySelector('[name="Unit_Label"]')?.value || '';
                const expirationDate = div.querySelector('[name="Expiration_Date"]')?.value || '';

                if (!productName && !quantity && !unitLabel && !expirationDate) return;

                if (!productName || !quantity || !unitLabel || !expirationDate) {
                    showWarningMessage('يرجى تعبئة جميع حقول الجرد لكل منتج. إذا لم تكن بحاجة للسطر، يمكنك حذفه.');
                    throw new Error('Invalid inventory data');
                }
                
                hasValidItem = true;

                const selectedOption = inventoryListDatalist.querySelector(`option[value="${productName}"]`);
                const productDetails = selectedOption ? selectedOption.dataset : {};

                collectedInventoryData.push({
                    Inventory_ID: generateUniqueID('INV'),
                    Timestamp: formatTimestamp(now),
                    Entry_User_Name: entryUserNameInput.value,
                    Sales_Rep_Name_AR: salesRepNameSelect.value,
                    Customer_Name_AR: customerNameInput.value,
                    Customer_Code: customersMain.find(c => c.Customer_Name_AR === customerNameInput.value)?.Customer_Code || '',
                    Product_Name_AR: productName,
                    Product_Code: productDetails.productCode || '',
                    Category: productDetails.category || '',
                    Package_Type: productDetails.packageType || '',
                    Unit_Size: productDetails.unitSize || '',
                    Quantity: quantity,
                    Expiration_Date: expirationDate,
                    Unit_Label: unitLabel,
                    Notes: inventoryNotesTextarea.value || ''
                });
            });
        } catch (e) {
            submitBtn.disabled = false;
            loadingSpinner.classList.add('hidden');
            return;
        }
        
        if (!hasValidItem) {
            showWarningMessage('يجب إدخال بيانات منتج واحد على الأقل في قسم الجرد.');
            submitBtn.disabled = false;
            loadingSpinner.classList.add('hidden');
            return;
        }

        payload = {
            sheetName: 'Inventory_Logs',
            data: collectedInventoryData
        };
    } else {
        if (!visitPurposeSelect.value || !visitOutcomeSelect.value || !customerTypeSelect.value) {
            showWarningMessage('يرجى تعبئة حقول الغرض والنتيجة ونوع العميل.');
            submitBtn.disabled = false;
            loadingSpinner.classList.add('hidden');
            return;
        }
        
        const available = [], unavailable = [];
        let allProductsChecked = true;
        const productsDivs = productsDisplayDiv.querySelectorAll('.product-item');
        if(productsDivs.length > 0) {
            productsDivs.forEach(div => {
                const name = div.querySelector('label').textContent;
                const selected = div.querySelector('input[type="radio"]:checked');
                if (selected) {
                    (selected.value === 'متوفر' ? available : unavailable).push(name);
                } else {
                    allProductsChecked = false;
                }
            });
        }
        
        if (!allProductsChecked) {
            showWarningMessage('يرجى تحديد حالة جميع المنتجات المحددة.');
            submitBtn.disabled = false;
            loadingSpinner.classList.add('hidden');
            return;
        }

        const dataToSubmit = {
            Visit_ID: generateUniqueID('VISIT'),
            Customer_Name_AR: customerNameInput.value,
            Customer_Code: customersMain.find(c => c.Customer_Name_AR === customerNameInput.value)?.Customer_Code || '',
            Sales_Rep_Name_AR: salesRepNameSelect.value,
            Visit_Date: formatDate(now),
            Visit_Time: formatTime(now),
            Visit_Purpose: visitPurposeSelect.value,
            Visit_Outcome: visitOutcomeSelect.value,
            Visit_Type_Name_AR: selectedVisitType,
            Entry_User_Name: entryUserNameInput.value,
            Timestamp: formatTimestamp(now),
            Customer_Type: customerTypeSelect.value,
            Notes: notesTextarea.value || '',
            Available_Products_Names: available.join(', '),
            Unavailable_Products_Names: unavailable.join(', ')
        };

        payload = {
            sheetName: 'Visit_Logs',
            data: [dataToSubmit]
        };
    }

    try {
        console.log("📤 Sending payload:", payload);
        const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`فشل إرسال البيانات. (${response.statusText})`);
        }

        const result = await response.json();

        if (result.success) {
            showSuccessMessage();
            visitForm.reset();
            resetFormState();
        } else {
            throw new Error(result.error || 'فشل الخادم في معالجة الطلب.');
        }

    } catch (error) {
        console.error("❌ فشل الإرسال:", error);
        showErrorMessage('حدث خطأ أثناء إرسال البيانات: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
    }
}

function toggleVisitSections(type) {
    if (type === 'جرد استثنائي') {
        normalVisitRelatedFieldsDiv.classList.add('hidden');
        normalProductSectionDiv.classList.add('hidden');
        inventorySectionDiv.classList.remove('hidden');
    } else {
        normalVisitRelatedFieldsDiv.classList.remove('hidden');
        normalProductSectionDiv.classList.remove('hidden');
        inventorySectionDiv.classList.add('hidden');
        addInitialInventoryItem();
    }
}

function resetFormState() {
    productsDisplayDiv.innerHTML = '';
    document.querySelectorAll('#productCategories input[type="checkbox"]').forEach(c => c.checked = false);
    addInitialInventoryItem();
    toggleVisitSections(visitTypeSelect.value);
}

document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    addInitialInventoryItem();
    visitForm.addEventListener('submit', handleSubmit);
    visitTypeSelect.addEventListener('change', e => toggleVisitSections(e.target.value));
    addInventoryItemBtn.addEventListener('click', addInventoryItem);

    inventoryItemsContainer.addEventListener('click', e => {
        if (e.target.classList.contains('removeInventoryItem')) {
            if (inventoryItemsContainer.children.length > 1) {
                e.target.closest('.inventory-item').remove();
            } else {
                showWarningMessage('يجب أن يحتوي قسم الجرد على منتج واحد على الأقل.');
            }
        }
    });

    toggleVisitSections(visitTypeSelect.value);
});
