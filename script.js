// ✅ رابط تطبيق Google Apps Script المنشور
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyPflRJCq7ijV9vAKVIu4ESWoXgrBw_0GGPKBhHOO9PH_DUmdfLqZE91WBsIT7wV0yhcw/exec';

// 🔽 تعريف المتغيرات العامة للبيانات
let appData = {
    products: [],
    inventoryProducts: [],
    salesReps: [],
    customers: [],
    outcomes: [],
    purposes: [],
    types: [],
    isLoaded: false
};

// 🔽 تجميع عناصر DOM المستخدمة
const DOM = {
    form: document.getElementById('visitForm'),
    entryUserName: document.getElementById('entryUserName'),
    salesRepName: document.getElementById('salesRepName'),
    customerName: document.getElementById('customerName'),
    customerList: document.getElementById('customerList'),
    visitType: document.getElementById('visitType'),
    visitPurpose: document.getElementById('visitPurpose'),
    visitOutcome: document.getElementById('visitOutcome'),
    customerType: document.getElementById('customerType'),
    notes: document.getElementById('notes'),
    inventoryNotes: document.getElementById('inventoryNotes'),
    productCategories: document.getElementById('productCategories'),
    productsDisplay: document.getElementById('productsDisplay'),
    inventorySection: document.getElementById('inventorySection'),
    inventoryList: document.getElementById('inventoryList'),
    inventoryItemsContainer: document.getElementById('inventoryItemsContainer'),
    addInventoryItemBtn: document.getElementById('addInventoryItem'),
    normalVisitRelatedFields: document.getElementById('normalVisitRelatedFields'),
    normalProductSection: document.getElementById('normalProductSection'),
    submitBtn: document.getElementById('submitBtn'),
    loadingSpinner: document.getElementById('loadingSpinner')
};

// ✅ رسائل التنبيه باستخدام مكتبة SweetAlert2
const showMessage = {
    success: (title = '✅ تم الإرسال!', text = 'تم إرسال النموذج بنجاح.') => Swal.fire({ title, text, icon: 'success', confirmButtonText: 'ممتاز' }),
    error: (message = 'حدث خطأ أثناء إرسال النموذج.') => Swal.fire({ title: '❌ فشل الإرسال', text: message, icon: 'error', confirmButtonText: 'موافق' }),
    warning: (message) => Swal.fire({ title: '⚠️ تنبيه', text: message, icon: 'warning', confirmButtonText: 'موافق' })
};

// ✅ وظائف مساعدة لتوليد معرفات وتنسيق التواريخ
const utils = {
    generateUniqueID: (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    formatDate: (date) => date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }),
    formatTime: (date) => date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    formatTimestamp: (date) => date.toLocaleString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
};

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
        showMessage.error(`فشل تحميل البيانات الأساسية من ${url}. يرجى التحقق من الملف والمحاولة مرة أخرى.`);
        return [];
    }
}

// ✅ دالة رئيسية لتحميل جميع البيانات عند بدء التشغيل
async function loadAllData() {
    DOM.submitBtn.disabled = true;
    try {
        const [
            products, inventoryProducts, salesReps, customers, outcomes, purposes, types
        ] = await Promise.all([
            fetchJsonData('products.json'),
            fetchJsonData('inventory_products.json'),
            fetchJsonData('sales_representatives.json'),
            fetchJsonData('customers_main.json'),
            fetchJsonData('visit_outcomes.json'),
            fetchJsonData('visit_purposes.json'),
            fetchJsonData('visit_types.json')
        ]);

        appData.products = products;
        appData.inventoryProducts = inventoryProducts;
        appData.salesReps = salesReps;
        appData.customers = customers;
        appData.outcomes = outcomes;
        appData.purposes = purposes;
        appData.types = types;

        populateSelect(DOM.salesRepName, appData.salesReps, 'Sales_Rep_Name_AR', 'Sales_Rep_Name_AR');
        populateSelect(DOM.visitType, appData.types, 'Visit_Type_Name_AR', 'Visit_Type_Name_AR');
        populateSelect(DOM.visitPurpose, appData.purposes);
        populateSelect(DOM.visitOutcome, appData.outcomes);
        
        populateCustomerDatalist();
        populateInventoryDatalist();
        setupProductCategories();
        
        appData.isLoaded = true;
        DOM.submitBtn.disabled = false;
        console.log("✅ تم تحميل جميع البيانات الأساسية بنجاح.");
    } catch (error) {
        showMessage.error("فشل تحميل البيانات الأساسية. يرجى إعادة تحميل الصفحة.");
    }
}

// ✅ وظائف لتعبئة القوائم المنسدلة والداتاليستات
function populateSelect(select, list, valueKey, textKey) {
    select.innerHTML = '<option value="">اختر...</option>';
    if (Array.isArray(list) && list.length > 0) {
        list.forEach(item => {
            const option = document.createElement('option');
            option.value = (valueKey && typeof item === 'object') ? item[valueKey] : item;
            option.textContent = (textKey && typeof item === 'object') ? item[textKey] : item;
            select.appendChild(option);
        });
    }
}

function populateCustomerDatalist() {
    DOM.customerList.innerHTML = '';
    if (appData.customers && appData.customers.length > 0) {
        appData.customers.forEach(c => {
            const option = document.createElement('option');
            option.value = c.Customer_Name_AR;
            DOM.customerList.appendChild(option);
        });
    }
}

function populateInventoryDatalist() {
    DOM.inventoryList.innerHTML = '';
    if (appData.inventoryProducts && appData.inventoryProducts.length > 0) {
        appData.inventoryProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.Product_Name_AR;
            for (const key in product) {
                const camelKey = key.replace(/_(\w)/g, (_, c) => c.toUpperCase());
                option.dataset[camelKey] = product[key];
            }
            DOM.inventoryList.appendChild(option);
        });
    }
}

// ✅ إدارة المنتجات للزيارات العادية
let productCategories = {};
function setupProductCategories() {
    DOM.productCategories.innerHTML = '';
    productCategories = {};
    if (appData.products && appData.products.length > 0) {
        appData.products.forEach(p => {
            productCategories[p.Category] = productCategories[p.Category] || [];
            productCategories[p.Category].push(p);
        });

        for (const category in productCategories) {
            const div = document.createElement('div');
            div.className = 'flex items-center';
            div.innerHTML = `
                <input type="checkbox" id="cat-${category}" value="${category}" class="h-5 w-5 cursor-pointer">
                <label for="cat-${category}" class="ml-2">${category}</label>
            `;
            DOM.productCategories.appendChild(div);
        }
    }
}

function toggleProductsDisplay(category, show) {
    const products = productCategories[category];
    if (!products) return;

    if (show) {
        const fragment = document.createDocumentFragment();
        products.forEach(product => {
            const uniqueId = utils.generateUniqueID('status');
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
            fragment.appendChild(div);
        });
        DOM.productsDisplay.appendChild(fragment);
    } else {
        DOM.productsDisplay.querySelectorAll(`[data-category="${category}"]`).forEach(el => el.remove());
    }
}

// ✅ وظائف إدارة عناصر الجرد
function addInventoryItem() {
    const template = `
        <div class="inventory-item border p-4 rounded relative bg-white">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label>المنتج</label><input type="text" name="Inventory_Product_Name_AR" list="inventoryList" placeholder="اسم المنتج"></div>
                <div><label>الكمية</label><input type="number" name="Inventory_Quantity" min="0" placeholder="الكمية"></div>
                <div><label>تاريخ الانتهاء</label><input type="date" name="Expiration_Date"></div>
                <div><label>الوحدة</label>
                    <select name="Unit_Label">
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
    DOM.inventoryItemsContainer.appendChild(item);
}

function addInitialInventoryItem() {
    DOM.inventoryItemsContainer.innerHTML = '';
    addInventoryItem();
}

// ✅ دالة لجمع بيانات الزيارة العادية
function collectNormalVisitData(now) {
    if (!DOM.visitPurpose.value || !DOM.visitOutcome.value || !DOM.customerType.value) {
        showMessage.warning('يرجى تعبئة حقول الغرض والنتيجة ونوع العميل.');
        return null;
    }

    const available = [], unavailable = [];
    const productsDivs = DOM.productsDisplay.querySelectorAll('.product-item');
    let allProductsChecked = true;

    productsDivs.forEach(div => {
        const name = div.querySelector('label').textContent;
        const selected = div.querySelector('input[type="radio"]:checked');
        if (selected) {
            (selected.value === 'متوفر' ? available : unavailable).push(name);
        } else {
            allProductsChecked = false;
        }
    });
    
    if (productsDivs.length > 0 && !allProductsChecked) {
        showMessage.warning('يرجى تحديد حالة جميع المنتجات المحددة.');
        return null;
    }

    const customer = appData.customers.find(c => c.Customer_Name_AR === DOM.customerName.value);
    
    return {
        Visit_ID: utils.generateUniqueID('VISIT'),
        Customer_Name_AR: DOM.customerName.value,
        Customer_Code: customer?.Customer_Code || '',
        Sales_Rep_Name_AR: DOM.salesRepName.value,
        Visit_Date: utils.formatDate(now),
        Visit_Time: utils.formatTime(now),
        Visit_Purpose: DOM.visitPurpose.value,
        Visit_Outcome: DOM.visitOutcome.value,
        Visit_Type_Name_AR: DOM.visitType.value,
        Entry_User_Name: DOM.entryUserName.value,
        Timestamp: utils.formatTimestamp(now),
        Customer_Type: DOM.customerType.value,
        Notes: DOM.notes.value || '',
        Available_Products_Names: available.join(', '),
        Unavailable_Products_Names: unavailable.join(', ')
    };
}

// ✅ دالة لجمع بيانات الجرد
function collectInventoryData(now) {
    const collectedInventoryData = [];
    const inventoryItems = DOM.inventoryItemsContainer.querySelectorAll('.inventory-item');
    let hasValidItem = false;

    for (const div of inventoryItems) {
        const productName = div.querySelector('[name="Inventory_Product_Name_AR"]')?.value || '';
        const quantity = div.querySelector('[name="Inventory_Quantity"]')?.value || '';
        const unitLabel = div.querySelector('[name="Unit_Label"]')?.value || '';
        const expirationDate = div.querySelector('[name="Expiration_Date"]')?.value || '';

        if (!productName && !quantity && !unitLabel && !expirationDate) continue;

        if (!productName || !quantity || !unitLabel || !expirationDate) {
            showMessage.warning('يرجى تعبئة جميع حقول الجرد لكل منتج. إذا لم تكن بحاجة للسطر، يمكنك حذفه.');
            return null;
        }
        
        hasValidItem = true;

        const selectedOption = DOM.inventoryList.querySelector(`option[value="${productName}"]`);
        const productDetails = selectedOption ? selectedOption.dataset : {};
        const customer = appData.customers.find(c => c.Customer_Name_AR === DOM.customerName.value);
        
        collectedInventoryData.push({
            Inventory_ID: utils.generateUniqueID('INV'),
            Timestamp: utils.formatTimestamp(now),
            Entry_User_Name: DOM.entryUserName.value,
            Sales_Rep_Name_AR: DOM.salesRepName.value,
            Customer_Name_AR: DOM.customerName.value,
            Customer_Code: customer?.Customer_Code || '',
            Product_Name_AR: productName,
            Product_Code: productDetails.productCode || '',
            Category: productDetails.category || '',
            Package_Type: productDetails.packageType || '',
            Unit_Size: productDetails.unitSize || '',
            Quantity: quantity,
            Expiration_Date: expirationDate,
            Unit_Label: unitLabel,
            Notes: DOM.inventoryNotes.value || ''
        });
    }
    
    if (!hasValidItem) {
        showMessage.warning('يجب إدخال بيانات منتج واحد على الأقل في قسم الجرد.');
        return null;
    }

    return collectedInventoryData;
}

// ✅ دالة رئيسية للتحقق من البيانات وإرسالها
async function handleSubmit(event) {
    event.preventDefault();

    if (!appData.isLoaded) {
        showMessage.warning('البيانات الأساسية لم يتم تحميلها بعد. يرجى الانتظار أو إعادة تحميل الصفحة.');
        return;
    }

    DOM.submitBtn.disabled = true;
    DOM.loadingSpinner.classList.remove('hidden');

    const now = new Date();
    let payload = null;

    if (!DOM.entryUserName.value || !DOM.salesRepName.value || !DOM.customerName.value || !DOM.visitType.value) {
        showMessage.warning('يرجى تعبئة جميع الحقول الأساسية (اسم الموظف، المندوب، العميل، ونوع الزيارة).');
        DOM.submitBtn.disabled = false;
        DOM.loadingSpinner.classList.add('hidden');
        return;
    }

    if (DOM.visitType.value === 'جرد استثنائي') {
        const inventoryData = collectInventoryData(now);
        if (inventoryData) {
            payload = { sheetName: 'Inventory_Logs', data: inventoryData };
        }
    } else {
        const visitData = collectNormalVisitData(now);
        if (visitData) {
            payload = { sheetName: 'Visit_Logs', data: [visitData] };
        }
    }

    if (!payload) {
        DOM.submitBtn.disabled = false;
        DOM.loadingSpinner.classList.add('hidden');
        return;
    }

    try {
        console.log("📤 Sending payload:", payload);
        const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`خطأ من الخادم: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
            showMessage.success();
            DOM.form.reset();
            resetFormState();
        } else {
            throw new Error(result.error || 'فشل الخادم في معالجة الطلب.');
        }

    } catch (error) {
        console.error("❌ فشل الإرسال:", error);
        if (error.message.includes('Failed to fetch')) {
            showMessage.error('فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.');
        } else {
            showMessage.error('حدث خطأ أثناء إرسال البيانات: ' + error.message);
        }
    } finally {
        DOM.submitBtn.disabled = false;
        DOM.loadingSpinner.classList.add('hidden');
    }
}

// ✅ تبديل الأقسام حسب نوع الزيارة
function toggleVisitSections(type) {
    const isInventory = type === 'جرد استثنائي';
    DOM.normalVisitRelatedFields.classList.toggle('hidden', isInventory);
    DOM.normalProductSection.classList.toggle('hidden', isInventory);
    DOM.inventorySection.classList.toggle('hidden', !isInventory);
    if (isInventory) {
        addInitialInventoryItem();
    }
}

// ✅ إعادة تهيئة النموذج بعد الإرسال الناجح
function resetFormState() {
    DOM.productsDisplay.innerHTML = '';
    DOM.productCategories.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    toggleVisitSections(DOM.visitType.value);
}

// ✅ أحداث الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    addInitialInventoryItem();
    DOM.form.addEventListener('submit', handleSubmit);
    DOM.visitType.addEventListener('change', e => toggleVisitSections(e.target.value));
    DOM.addInventoryItemBtn.addEventListener('click', addInventoryItem);

    // استخدام Event Delegation لحذف عناصر الجرد
    DOM.inventoryItemsContainer.addEventListener('click', e => {
        if (e.target.classList.contains('removeInventoryItem')) {
            if (DOM.inventoryItemsContainer.children.length > 1) {
                e.target.closest('.inventory-item').remove();
            } else {
                showMessage.warning('يجب أن يحتوي قسم الجرد على منتج واحد على الأقل.');
            }
        }
    });

    // استخدام Event Delegation لعرض منتجات الزيارة
    DOM.productCategories.addEventListener('change', e => {
        if (e.target.type === 'checkbox') {
            toggleProductsDisplay(e.target.value, e.target.checked);
        }
    });

    toggleVisitSections(DOM.visitType.value);
});
