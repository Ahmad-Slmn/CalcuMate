const screenElement = document.getElementById('screen');
const screenBoxHeight = document.querySelector('.screen').offsetHeight;
screenElement.style.height = `${screenBoxHeight}px`;

// السماح بالنسخ واللصق في شاشة الآلة الحاسبة
screenElement.removeAttribute('disabled');

const keys = document.querySelectorAll('.key');
let operations = JSON.parse(localStorage.getItem("operations")) || [];
let timer = null;
let inactivityTimeout;
const INACTIVITY_DELAY = 120000; // 2 دقائق

// مؤقت عدم النشاط لإخفاء الشاشة تدريجياً
function dimScreen() {
    screenElement.style.opacity = "0.3";
    showMessage("Sleep Mode Activated", "error");
}

function wakeScreen() {
    if (screenElement.style.opacity !== "1") {
        screenElement.style.opacity = "1";
        showMessage("Waking up...", "success");
    }
    resetInactivityTimer();
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(dimScreen, INACTIVITY_DELAY);
}

// دعم اللصق في شاشة الآلة الحاسبة
screenElement.addEventListener('paste', e => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    screenElement.value += text;
    wakeScreen();
});

// دعم الإدخال من لوحة المفاتيح مع دعم الوظائف العلمية الأساسية
document.addEventListener('keydown', e => {
    const allowedKeys = '0123456789.+-*/()%()^';
    const scientificMap = {
        s: 'sin(',
        c: 'cos(',
        t: 'tan(',
        l: 'log(',
        r: 'sqrt('
    };
    const key = e.key;

    // منع الحدث من التكرار أو الوصول لعناصر أخرى
    e.preventDefault();
    e.stopPropagation();

    if (allowedKeys.includes(key)) {
        screenElement.value += key;
        wakeScreen();
    } else if (key.toLowerCase() in scientificMap) {
        screenElement.value += scientificMap[key.toLowerCase()];
        wakeScreen();
    } else if (key === 'Enter') {
        document.querySelector('.key.equal')?.click();
    } else if (key === 'Backspace') {
        screenElement.value = screenElement.value.slice(0, -1);
    }
});

// رسالة عرض تنبيه مع صوت
function showMessage(text, type = 'error', parent = document.body) {
    const msg = document.createElement('div');
    msg.className = 'calc-message';
    msg.innerText = text;
    msg.style.cssText = `
    background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
    color: #fff;
    padding: 12px 20px;
    position: fixed;
    top: 0;
    left: 50%;
    min-width: fit-content;
    transform: translateX(-50%);
    border-radius: 6px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 9999;
  `;
    parent.appendChild(msg);
    const beep = new Audio('sounds/notify.mp3');
    beep.play().catch(() => {});
    setTimeout(() => {
        msg.style.opacity = '1';
    }, 30);
    setTimeout(() => {
        msg.style.opacity = '0';
        setTimeout(() => msg.remove(), 1000);
    }, 2000);
}

// متغير لتعريف الجهاز اللمسي
let isTouchDevice = false;

// مساعدة المؤقت للضغط الطويل
function clearTimer() {
    clearTimeout(timer);
}

function handleLongPress(key) {
    timer = setTimeout(() => {
        if (key.value === 'clear') screenElement.value = '';
    }, 800);
}

// معالجة ضغط الأزرار
function handleKeyPress(key) {
    const value = key.value;
    const MAX_LENGTH = 60;

    if (screenElement.value.length >= MAX_LENGTH && !['backspace', 'clear', '='].includes(value)) {
        showMessage(`Input limit of ${MAX_LENGTH} characters reached`, "error");
        return;
    }

    switch (value) {
        case 'backspace':
            screenElement.value = screenElement.value.slice(0, -1);
            break;
        case 'clear':
            screenElement.value = '';
            break;
        case '.':
            if (!isNaN(screenElement.value.slice(-1))) screenElement.value += '.';
            break;
        case 'MR':
            const mem = localStorage.getItem('memory');
            if (mem) screenElement.value += mem;
            break;
        case 'MC':
            localStorage.removeItem('memory');
            updateMemoryUI();
            break;
        case 'M+':
        case 'M-':
            const screenVal = parseFloat(screenElement.value.trim());
            if (!isNaN(screenVal)) {
                let memVal = parseFloat(localStorage.getItem('memory')) || 0;
                memVal = value === 'M+' ? memVal + screenVal : memVal - screenVal;
                localStorage.setItem('memory', memVal.toString());
                updateMemoryUI();
            }
            break;
        case '%':
            if (!isNaN(screenElement.value.slice(-1))) screenElement.value += '%';
            break;
        case '+':
        case '-':
        case '×':
        case '÷':
        case '(':
        case ')':
            handleBracketAndOperator(value);
            break;
        case '=':
            const success = evaluateOperation();
            if (!success) {
                // لا تفعل شيء إضافي لأن رسالة الخطأ تظهر في evaluateOperation
                return;
            }
            break;
        default:
            screenElement.value += value;
    }
}


// دعم التعامل مع الأقواس والمشغلين بشكل خاص
function handleBracketAndOperator(value) {
  const lastChar = screenElement.value.slice(-1);
    
  if (value === '(') {
    // القوس الفاتح مسموح دائمًا
    screenElement.value += '(';
    return;
  }

  if (value === ')') {
    const openCount = (screenElement.value.match(/\(/g) || []).length;
    const closeCount = (screenElement.value.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      screenElement.value += ')';
    } else {
      showMessage("No matching opening bracket.", "error");
    }
    return;
  }

  // العمليات الحسابية الأخرى: + - × ÷
  if (screenElement.value.length === 0) {
    showMessage("Cannot start with an operator. Please enter a number first.", "error");
  } else if (!isNaN(lastChar) || ['%', ')'].includes(lastChar)) {
    screenElement.value += value;
  } else {
    showMessage("Operator must follow a number or closing bracket.", "error");
  }
}



// تقييم التعبير الحسابي مع فحوصات متقدمة للأخطاء
function evaluateOperation() {
    let operation = screenElement.value.trim();

    if (!operation) {
        showMessage("Please enter an arithmetic operation", "error");
        return false;
    }

    // تحقق إذا كانت القيمة مجرد رقم فقط بدون أي عمليات حسابية
    const isOnlyNumber = /^-?\d+(\.\d+)?$/.test(operation);
    if (isOnlyNumber) {
        showMessage("Please enter a valid arithmetic expression, not just a number.", "error");
        return false;
    }

    const lastChar = operation.slice(-1);
    if (['+', '-', '*', '/', '.', '×', '÷'].includes(lastChar)) {
        showMessage("Operation can't end with an operator", "error");
        highlightErrorPosition(operation.length - 1);
        return false;
    }

    const openBrackets = (operation.match(/\(/g) || []).length;
    const closeBrackets = (operation.match(/\)/g) || []).length;
    if (openBrackets !== closeBrackets) {
        showMessage("Mismatched parentheses detected. Please check your brackets.", "error");
        if (openBrackets > closeBrackets) {
            showMessage("Suggestion: Add closing ')' bracket.", "error");
            highlightErrorPosition(findLastUnclosedBracket(operation));
        } else {
            showMessage("Suggestion: Remove extra closing ')' bracket.", "error");
            highlightErrorPosition(findExtraClosingBracket(operation));
        }
        return false;
    }

    if (/[^0-9+\-÷×%().*/^a-z]/i.test(operation)) {
        showMessage("Invalid characters detected. Only numbers and operators are allowed.", "error");
        highlightErrorPosition(findFirstInvalidCharPosition(operation));
        return false;
    }

    if (/[[\+\-\*/]{2,}/.test(operation)) {
        showMessage("Invalid sequence of operators detected. Please correct.", "error");
        highlightErrorPosition(findOperatorSequencePosition(operation));
        return false;
    }

    try {
        operation = operation.replace(/(\d+(\.\d+)?)%/g, (match, p1, _, offset, str) => {
            let prefix = str.slice(0, offset);
            let matchPrev = prefix.match(/(\d+(\.\d+)?|\([^()]+\))\s*$/);
            return matchPrev ? `(${matchPrev[1]}*${p1}/100)` : `(${p1}/100)`;
        });

        const expression = operation
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/sin/gi, 'sin')
            .replace(/cos/gi, 'cos')
            .replace(/tan/gi, 'tan')
            .replace(/log/gi, 'log10')
            .replace(/sqrt/gi, 'sqrt');

        const result = math.evaluate(expression);
        clearErrorHighlight();

        const pad = num => String(num).padStart(2, '0');
        const date = new Date();
        const timestamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        const operationHTML = `
      <div>
        <span class="Operation-Text">${operation} = ${result}</span>
        <span class="Operation-Date">${timestamp}</span>
      </div>
    `;

        operations.push(operationHTML);
        localStorage.setItem("operations", JSON.stringify(operations));
        screenElement.value = result.toString();

        return true; // عملية ناجحة
    } catch (e) {
        let message = "Error evaluating the expression";
        if (e.message.includes("Parenthesis")) {
            message = "Mismatched parentheses detected. Please check your brackets.";
            showMessage(message, "error");
            highlightErrorPosition(findLastUnclosedBracket(operation));
        } else if (e.message.includes("Unexpected")) {
            message = "Unexpected character or operator detected.";
            showMessage(message, "error");
            highlightErrorPosition(findFirstInvalidCharPosition(operation));
        } else if (e.message.includes("divide by zero")) {
            message = "Cannot divide by zero.";
            showMessage(message, "error");
        } else {
            message = e.message;
            showMessage(message, "error");
        }
        return false; // فشل في التقييم
    }
}



// تمييز موقع الخطأ
function highlightErrorPosition(pos) {
    clearErrorHighlight();
    if (pos == null || pos < 0 || pos >= screenElement.value.length) return;
    const val = screenElement.value;
    showMessage(`Error near character #${pos + 1}: "${val[pos]}"`, "error");
}

// تنظيف التمييز (مستقبلًا يمكن تطويرها)
function clearErrorHighlight() {}

// إيجاد مواضع الأقواس غير المغلقة أو الزائدة
function findLastUnclosedBracket(str) {
    let stack = [];
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '(') stack.push(i);
        else if (str[i] === ')') stack.pop();
    }
    return stack.length > 0 ? stack[stack.length - 1] : null;
}

function findExtraClosingBracket(str) {
    let stack = [];
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '(') stack.push(i);
        else if (str[i] === ')') {
            if (stack.length === 0) return i;
            stack.pop();
        }
    }
    return null;
}

function findFirstInvalidCharPosition(str) {
    for (let i = 0; i < str.length; i++) {
        if (!/[\d+\-*/%^().a-z]/i.test(str[i])) return i;
    }
    return null;
}

function findOperatorSequencePosition(str) {
    const regex = /[\+\-\*/]{2,}/;
    const match = regex.exec(str);
    return match ? match.index : null;
}

// التعامل مع أحداث اللمس والماوس للأزرار
keys.forEach(key => {
    key.addEventListener('touchstart', () => {
        isTouchDevice = true;
        key.classList.add('no-effects');
        playSound();
        vibrate();
        handleLongPress(key);
        setTimeout(() => key.classList.remove('no-effects'), 100);
    });
    key.addEventListener('touchend', () => {
        clearTimer();
        handleKeyPress(key);
    });
    key.addEventListener('mousedown', () => {
        if (isTouchDevice) return;
        playSound();
        vibrate();
        handleLongPress(key);
    });
    key.addEventListener('mouseup', () => {
        if (isTouchDevice) return;
        clearTimer();
        handleKeyPress(key);
    });
});

// نسخ محتوى شاشة الآلة الحاسبة
document.getElementById('copy-display-btn').addEventListener('click', () => {
    const value = screenElement.value.trim();
    if (!value) {
        showMessage("Nothing to copy!", "error");
        return;
    }
    navigator.clipboard.writeText(value)
        .then(() => showMessage("Copied!", "success"))
        .catch(() => showMessage("Copy failed", "error"));
});



// العناصر الأساسية
const historyBtn = document.getElementById('history-btn');
const modal = document.getElementById('history-modal');
const modalClose = modal.querySelector('.close');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const copyBtn = document.getElementById('copy-btn');

const optionBoxWidth = document.querySelector('.settings-box .option-box').offsetWidth;
document.querySelector('.settings-box .reset-options').style.width = `${optionBoxWidth}px`;

const colorsListItems = Array.from(document.querySelectorAll('.colors-list li'));
const soundControl = document.querySelector('.sound-option');
const vibrationControl = document.querySelector('.vibration-option');

const autoClearInput = document.getElementById('autoClearDateTime');
const setAutoClearBtn = document.getElementById('setAutoClearBtn');
const cancelAutoClearBtn = document.getElementById('cancelAutoClearBtn');
const autoClearStatus = document.getElementById('autoClearStatus');

const confirmActionModal = document.getElementById('confirmActionModal');
const confirmActionMessage = document.getElementById('confirmActionMessage');
const confirmActionYesBtn = document.getElementById('confirmActionYesBtn');
const confirmActionNoBtn = document.getElementById('confirmActionNoBtn');

let autoClearTime = localStorage.getItem('autoClearTime');
let countdownInterval;
let isSoundOn = JSON.parse(localStorage.getItem('isSoundOn')) || false;
let isVibrationOn = JSON.parse(localStorage.getItem('isVibrationOn')) || false;

// دالة إظهار رسائل المستخدم
function showMessage(text, type = 'error', parent = document.body) {
    const msg = document.createElement('div');
    msg.className = 'calc-message';
    msg.innerText = text;
    msg.style.cssText = `
    background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
    color: #fff; padding: 12px 20px; position: fixed; top: 0; left: 50%;
    min-width: fit-content; transform: translateX(-50%); border-radius: 6px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15); opacity: 0; transition: opacity 0.3s ease;
    z-index: 9999;
  `;
    parent.appendChild(msg);
    new Audio('sounds/notify.mp3').play().catch(() => {});
    setTimeout(() => (msg.style.opacity = '1'), 30);
    setTimeout(() => {
        msg.style.opacity = '0';
        setTimeout(() => msg.remove(), 1000);
    }, 2000);
}

// عرض تاريخ العمليات (History)
function renderHistory() {
    historyList.innerHTML = '';
    if (operations.length === 0) {
        historyList.textContent = "The history is empty.";
        historyList.style.textAlign = 'center';
        return;
    }
    historyList.style.textAlign = 'left';

    operations.slice().reverse().forEach((opHTML) => {
        const li = document.createElement('li');
        li.innerHTML = opHTML;

        // زر نسخ العملية
        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy';
        copyBtn.style.marginLeft = '10px';
        copyBtn.onclick = () => {
            const opTextSpan = li.querySelector('.Operation-Text');
            if (opTextSpan) {
                navigator.clipboard.writeText(opTextSpan.textContent)
                    .then(() => showMessage("Operation copied!", "success"))
                    .catch(() => showMessage("Copy failed", "error"));
            }
        };

        // زر حذف العملية
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.marginLeft = '10px';
        deleteBtn.onclick = () => {
            const idx = operations.indexOf(opHTML);
            if (idx > -1) {
                operations.splice(idx, 1);
                localStorage.setItem("operations", JSON.stringify(operations));
                renderHistory();
                if (operations.length === 0) {
                    clearAutoClearSchedule();
                    showMessage("Auto-clear canceled because history is empty.", "success");
                }
                showMessage("Selected history has been deleted.", 'error', modal);
            }
        };

        li.append(copyBtn, deleteBtn);
        historyList.appendChild(li);
    });
}

// مسح جدول الحذف التلقائي
function clearAutoClearSchedule() {
    autoClearTime = null;
    localStorage.removeItem('autoClearTime');
    updateAutoClearUI();
}

// نسخ كامل التاريخ
copyBtn.onclick = () => {
    if (!operations.length) return showMessage('No history to copy.', 'error');

    const operationsText = operations
        .map(op => {
            const el = document.createElement('div');
            el.innerHTML = op;
            return el.innerText;
        })
        .filter(Boolean)
        .join('\n') + '\n';

    navigator.clipboard.writeText(operationsText)
        .then(() => showMessage("History copied successfully", "success"))
        .catch(() => showMessage("Copy failed", "error"));
};

// فتح وإغلاق النافذة
historyBtn.onclick = () => {
    modal.classList.add('show');
    renderHistory();
};

[modalClose, modal].forEach(el =>
    el.addEventListener('click', e => {
        if (e.target === modalClose || e.target === modal) modal.classList.remove('show');
    })
);

// مسح كل التاريخ مع تأكيد
clearHistoryBtn.onclick = async () => {
    if (!operations.length) return showMessage("There is no history to delete!", "error");
    const confirm = await showConfirmAction("Are you sure you want to clear all history?");
    if (!confirm) return;
    operations = [];
    localStorage.removeItem("operations");
    renderHistory();
    clearAutoClearSchedule();
    showMessage("All history have been deleted", "success");
};

// عرض وإخفاء صندوق الإعدادات
document.querySelectorAll('.screen ul li').forEach(li =>
    li.onclick = () => document.querySelector('.settings-box').classList.toggle('show')
);

document.addEventListener('click', e => {
    if (!e.target.closest('.settings-box') && !e.target.closest('.screen ul li'))
        document.querySelector('.settings-box').classList.remove('show');
});

// إدارة الألوان
if (localStorage.getItem('color')) {
    colorsListItems.forEach(el => el.classList.toggle('active', el.dataset.value === localStorage.getItem('color')));
    document.body.classList.add(localStorage.getItem('color'));
}
colorsListItems.forEach(el =>
    el.onclick = () => {
        colorsListItems.forEach(i => i.classList.remove('active'));
        el.classList.add('active');
        localStorage.setItem('color', el.dataset.value);
        document.body.className = el.dataset.value;
    }
);

// تشغيل/إيقاف الصوت
function toggleSound(target, val) {
    isSoundOn = val;
    localStorage.setItem('isSoundOn', val);
    target.classList.add('active');
    target.parentElement.querySelector(`[data-value="${!val ? 'yes' : 'no'}"]`).classList.remove('active');
}
soundControl.onclick = ({
    target
}) => {
    if (['yes', 'no'].includes(target.dataset.value)) toggleSound(target, target.dataset.value === 'yes');
};
soundControl.querySelector('span[data-value="yes"]').classList.toggle('active', isSoundOn);
soundControl.querySelector('span[data-value="no"]').classList.toggle('active', !isSoundOn);

function playSound() {
    if (isSoundOn) new Audio('sounds/click.mp3').play();
}

// تشغيل/إيقاف الاهتزاز
vibrationControl.onclick = ({
    target
}) => {
    if (['yes', 'no'].includes(target.dataset.value)) {
        isVibrationOn = target.dataset.value === 'yes';
        localStorage.setItem('isVibrationOn', isVibrationOn);
        target.classList.add('active');
        const sibling = target.dataset.value === 'yes' ? target.nextElementSibling : target.previousElementSibling;
        sibling.classList.remove('active');
    }
};

function vibrate() {
    if (isVibrationOn && navigator.vibrate) navigator.vibrate(50);
}

// مؤشرات وأزرار الذاكرة
const memoryButtons = document.querySelectorAll('.memory');
const memoryIndicator = document.querySelector('.screen > span');
const visibilityButtons = document.querySelectorAll('[data-value="show"], [data-value="hidden"]');

// تحديث الذاكرة والمؤشر
function updateMemoryUI(value = localStorage.getItem('activeButtonValue') || 'hidden') {
    const hasMemory = localStorage.getItem('memory') !== null;
    visibilityButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.value === value));

    memoryButtons.forEach(btn => {
        if (value === 'show') {
            btn.style.display = 'block';
            setTimeout(() => requestAnimationFrame(() => (btn.style.opacity = '1')), 100);
        } else {
            btn.style.opacity = '0';
            setTimeout(() => requestAnimationFrame(() => (btn.style.display = 'none')), 200);
        }
    });

    memoryIndicator.style.display = (value === 'show' && hasMemory) ? 'block' : 'none';
}

// حدث عند النقر على زر التحكم في الذاكرة
visibilityButtons.forEach(button => {
    button.addEventListener('click', () => {
        const value = button.dataset.value;
        localStorage.setItem('activeButtonValue', value);
        updateMemoryUI(value);
    });
});

// التهيئة عند تحميل الصفحة
updateMemoryUI();


// إعادة تعيين الإعدادات
document.querySelector('.reset-options').onclick = () => {
    document.querySelector('.settings-box').classList.remove('show');
  ['color', 'isSoundOn', 'isVibrationOn', 'activeButtonValue'].forEach(k => localStorage.removeItem(k));
    window.location.reload();
};

// زر المشاركة
document.querySelector('.shareBtn').onclick = () => {
    if (navigator.share) {
        navigator.share({
            title: 'My App',
            text: 'Check out this cool app!',
            url: window.location.href,
        }).catch(e => console.log(`Error while sharing: ${e}`));
    } else {
        console.log('Social Share API not supported in this browser.');
    }
};

// رابط التغذية الراجعة
document.querySelector('.feedbackLink').onclick = e => {
    e.preventDefault();
    window.location.href = `mailto:support@myapp.com?subject=${encodeURIComponent('Feedback for My App')}&body=${encodeURIComponent('Dear team,\n\nI would like to provide some feedback on your app.\n\nSincerely,\n[Your Name]')}`;
};

// فتح الشاشة عند التفاعل
['keydown', 'mousedown', 'touchstart'].forEach(evt => document.addEventListener(evt, wakeScreen));
resetInactivityTimer();

// نافذة التأكيد (Modal) باستخدام Promise
function showConfirmAction(message) {
    return new Promise((resolve) => {
        const [textPart, timePart] = message.split(' at ');
        document.getElementById('confirmActionMessageText').textContent = textPart.trim();
        document.getElementById('confirmActionMessageTime').textContent = timePart ? `at ${timePart.trim()}` : '';

        confirmActionModal.style.display = 'flex';

        function cleanUp() {
            confirmActionYesBtn.removeEventListener('click', onYes);
            confirmActionNoBtn.removeEventListener('click', onNo);
            confirmActionModal.style.display = 'none';
        }

        function onYes() {
            cleanUp();
            resolve(true);
        }

        function onNo() {
            cleanUp();
            resolve(false);
        }

        confirmActionYesBtn.addEventListener('click', onYes);
        confirmActionNoBtn.addEventListener('click', onNo);
    });
}


// تحديث واجهة الحذف التلقائي
function updateAutoClearUI() {
    clearInterval(countdownInterval);
    if (!autoClearTime) {
        autoClearStatus.textContent = "No auto-clear scheduled.";
        autoClearStatus.className = "status-text default";
        autoClearInput.value = "";
        Object.assign(autoClearStatus.style, {
            backgroundColor: '',
            color: '',
            border: '',
            padding: '',
            borderRadius: '',
            fontWeight: '',
            textAlign: '',
            marginTop: '',
            transition: ''
        });
        return;
    }

    const clearDate = new Date(autoClearTime);
    autoClearInput.value = clearDate.toISOString().slice(0, 16);

    function updateCountdown() {
        const now = new Date();
        const remaining = clearDate - now;

        if (remaining <= 0) {
            clearInterval(countdownInterval);
            Object.assign(autoClearStatus.style, {
                backgroundColor: "#d9534f",
                color: "#fff",
                padding: "10px 15px",
                borderRadius: "6px",
                fontWeight: "bold",
                textAlign: "center",
                marginTop: "10px",
                transition: "all 0.4s ease"
            });
            autoClearStatus.textContent = "Auto clear will happen any moment now...";
            return;
        }

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        autoClearStatus.textContent = `⏳ Time left: ${hours}h ${minutes}m ${seconds}s to auto clear.`;
        Object.assign(autoClearStatus.style, {
            padding: "10px 15px",
            borderRadius: "6px",
            fontWeight: "bold",
            textAlign: "left",
            marginTop: "10px",
            transition: "all 0.4s ease"
        });

        if (remaining > 3600000) { // أكثر من ساعة
            Object.assign(autoClearStatus.style, {
                backgroundColor: "#e0f7e9",
                color: "#2e7d32",
                border: "1px solid #81c784"
            });
        } else if (remaining > 1800000) { // بين 30 دقيقة وساعة
            Object.assign(autoClearStatus.style, {
                backgroundColor: "#fff3cd",
                color: "#856404",
                border: "1px solid #ffeeba"
            });
        } else { // أقل من 30 دقيقة
            Object.assign(autoClearStatus.style, {
                backgroundColor: "#f8d7da",
                color: "#721c24",
                border: "1px solid #f5c6cb"
            });
        }
    }

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// فحص الحذف التلقائي وتنفيذه إذا حان الوقت
function checkAutoClear() {
    if (!autoClearTime) return;
    const now = new Date();
    const clearDate = new Date(autoClearTime);
    if (now >= clearDate) {
        operations = [];
        localStorage.removeItem("operations");
        renderHistory();
        showMessage("History cleared automatically at set time.", "success");
        clearAutoClearSchedule();
    } else {
        updateAutoClearUI();
    }
}
setInterval(checkAutoClear, 60000);

// إعدادات الحذف التلقائي
setAutoClearBtn.onclick = () => {
    const selectedTime = autoClearInput.value;
    if (!selectedTime) return showMessage("Please select a valid date and time.", "error");
    if (!operations.length) return showMessage("Cannot schedule auto clear because the history is empty.", "error");

    const selectedDate = new Date(selectedTime);
    const now = new Date();

    if (selectedDate <= now) return showMessage("Selected time must be in the future.", "error");
    if (autoClearTime && new Date(autoClearTime) > now) return showMessage("There is already a scheduled auto-clear. Please cancel it before setting a new one.", "error");

    autoClearTime = selectedTime;
    localStorage.setItem('autoClearTime', autoClearTime);
    updateAutoClearUI();
    showMessage("Auto clear time set successfully.", "success");
};

// إلغاء الحذف التلقائي مع تأكيد
cancelAutoClearBtn.onclick = async () => {
    if (!autoClearTime) return showMessage("No auto clear scheduled to cancel.", "error");

    const confirmCancel = await showConfirmAction(`Are you sure you want to cancel the scheduled auto clear at ${new Date(autoClearTime).toLocaleString()}?`);
    if (!confirmCancel) return showMessage("Auto clear cancellation aborted.", "error");

    clearAutoClearSchedule();
    showMessage("Auto clear schedule has been canceled.", "success");
};

// تهيئة واجهة المستخدم للحذف التلقائي عند التحميل
if (autoClearTime) {
    updateAutoClearUI();
    checkAutoClear();
} else {
    autoClearStatus.textContent = "No auto-clear scheduled.";
}