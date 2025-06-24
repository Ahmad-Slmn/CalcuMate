const screenElement = document.getElementById('screen');
const screenBoxHeight = document.querySelector('.screen').offsetHeight;
screenElement.style.height = `${screenBoxHeight}px`;

// إزالة خاصية التعطيل للسماح بالنسخ واللصق
screenElement.removeAttribute('disabled');

const keys = document.querySelectorAll('.key');
let operations = JSON.parse(localStorage.getItem("operations")) || [];
let timer = null;

const memoryButtons = document.querySelectorAll('.memory');
const memoryIndicator = document.querySelector('.screen > span');

function showMemoryIndicator() {
    memoryIndicator.style.display = localStorage.getItem('memory') !== null && localStorage.getItem('activeButtonValue') === 'show' ? 'block' : 'none';
}

showMemoryIndicator();
memoryButtons.forEach(btn => btn.addEventListener('click', showMemoryIndicator));

// دعم اللصق داخل شاشة الآلة الحاسبة
screenElement.addEventListener('paste', e => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    screenElement.value += text;
});

// دعم الإدخال من لوحة المفاتيح
document.addEventListener('keydown', e => {
    const allowedKeys = '0123456789.+-*/()%()';
    const key = e.key;
    if (allowedKeys.includes(key)) {
        screenElement.value += key;
    } else if (key === 'Enter') {
        document.querySelector('.key.equal').click();
    } else if (key === 'Backspace') {
        screenElement.value = screenElement.value.slice(0, -1);
    }
});

function showMessage(text, type = 'error', parent = document.body) {
  const msg = document.createElement('div');
  msg.className = 'calc-message';
  msg.innerText = text;

  // تعيين اللون حسب نوع الرسالة
  msg.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336'; // أخضر أو أحمر
  msg.style.color = '#fff';
  msg.style.padding = '12px 20px';
  msg.style.position = 'fixed';
  msg.style.top = '0';
  msg.style.left = '50%';
  msg.style.minWidth = 'fit-content';
  msg.style.transform = 'translateX(-50%)';
  msg.style.borderRadius = '6px';
  msg.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
  msg.style.opacity = '0';
  msg.style.transition = 'opacity 0.3s ease';
  msg.style.zIndex = '9999';

  parent.appendChild(msg);

  // تشغيل صوت التنبيه
  const beep = new Audio('sounds/notify.mp3');
  beep.play().catch(() => {});

  setTimeout(() => { msg.style.opacity = '1'; }, 30);
  setTimeout(() => {
    msg.style.opacity = '0';
    setTimeout(() => msg.remove(), 1000);
  }, 2000);
}


function clearTimer() {
    clearTimeout(timer);
}

function handleLongPress(key) {
    timer = setTimeout(() => {
        if (key.value === 'clear') screenElement.value = '';
    }, 800);
}

// مقتطف رئيسي فقط من الكود المعدل المتعلق بالأزرار
let isTouchDevice = false;

keys.forEach(key => {
  // عند اللمس: أضف الكلاس ثم أزله بعد وقت قصير
  key.addEventListener('touchstart', () => {
    isTouchDevice = true;
    key.classList.add('no-active');
    setTimeout(() => key.classList.remove('no-active'), 100); // إزالة بعد 100ms
    playSound();
    vibrate();
    handleLongPress(key);
  });

  key.addEventListener('touchend', () => {
    clearTimer();
    handleKeyPress(key);
  });

  // مخصص للماوس فقط
  key.addEventListener('mousedown', e => {
    if (isTouchDevice) return;
    playSound();
    vibrate();
    handleLongPress(key);
  });

  key.addEventListener('mouseup', e => {
    if (isTouchDevice) return;
    clearTimer();
    handleKeyPress(key);
  });
});


function clearTimer() {
  clearTimeout(timer);
}

function handleLongPress(key) {
  timer = setTimeout(() => {
    if (key.value === 'clear') screenElement.value = '';
  }, 800);
}

function handleKeyPress(key) {
  const value = key.value;

  if (value === 'backspace') {
    screenElement.value = screenElement.value.slice(0, -1);
    return;
  }

  if (value === 'clear') {
    screenElement.value = '';
    return;
  }

  if (value === '.') {
    if (!isNaN(screenElement.value.slice(-1))) {
      screenElement.value += value;
    }
    return;
  }

  if (value === 'MR') {
    const mem = localStorage.getItem('memory');
    if (mem) screenElement.value += mem;
    return;
  }

  if (value === 'MC') {
    localStorage.removeItem('memory');
    return;
  }

  if (value === 'M+' || value === 'M-') {
    const screenVal = parseFloat(screenElement.value.trim());
    if (!isNaN(screenVal)) {
      let memVal = parseFloat(localStorage.getItem('memory')) || 0;
      memVal = value === 'M+' ? memVal + screenVal : memVal - screenVal;
      localStorage.setItem('memory', memVal.toString());
    }
    return;
  }

  if (value === '%') {
    const lastChar = screenElement.value.slice(-1);
    if (!isNaN(lastChar)) {
      screenElement.value += '%';
    }
    return;
  }

  if (["+", "-", "×", "÷", "(", ")"].includes(value)) {
    const lastChar = screenElement.value.slice(-1);
    if (
      screenElement.value.length > 0 &&
      (!isNaN(lastChar) || lastChar === '%' || lastChar === '(' || lastChar === ')')
    ) {
      screenElement.value += value;
    } else if (value === '(') {
      screenElement.value += value;
    }
    return;
  }

  if (value === '=') {
  let operation = screenElement.value.trim();
  if (!operation) {
    showMessage("Please enter an arithmetic operation");
    return;
  }

  // تحقق من أن العملية تحتوي على عامل حسابي على الأقل
  if (!/[+\-×÷]/.test(operation)) {
    showMessage("Please enter a valid arithmetic operation with operator", "error");
    return;
  }

  if (/[^0-9+\-÷×%().]/.test(operation)) {
    showMessage("Please enter a valid arithmetic operation", "error");
    return;
  }

  try {
    operation = operation.replace(/(\d+(\.\d+)?)%/g, (match, p1, p2, offset, str) => {
      let prefix = str.slice(0, offset);
      let matchPrev = prefix.match(/(\d+(\.\d+)?|\([^()]+\))\s*$/);
      if (matchPrev) {
        let prevNumberOrExpr = matchPrev[1];
        return `(${prevNumberOrExpr}*${p1}/100)`;
      } else {
        return `(${p1}/100)`;
      }
    });

    const expression = operation.replace(/×/g, '*').replace(/÷/g, '/');
    const result = math.evaluate(expression);

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
  } catch {
    showMessage("Error evaluating the expression.", "error");
  }
  return;
}

  screenElement.value += value;
}




// نسخ محتوى شاشة الآلة الحاسبة (عملية أو نتيجة)
document.getElementById('copy-display-btn').addEventListener('click', () => {
    const value = screenElement.value.trim();

    if (value === '') {
        showMessage("Nothing to copy!", "error");
        return;
    }

    navigator.clipboard.writeText(value)
        .then(() => showMessage("Copied!", "success"))
        .catch(() => showMessage("Copy failed", "error"));
});



// Modal and History
const historyBtn = document.getElementById('history-btn');
const modal = document.getElementById('history-modal');
const modalClose = modal.querySelector('.close');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

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

        // زر النسخ
        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy';
        copyBtn.style.marginLeft = '10px';
        copyBtn.onclick = () => {
            const opTextSpan = li.querySelector('.Operation-Text');
            if (opTextSpan) {
                const textToCopy = opTextSpan.textContent;
                navigator.clipboard.writeText(textToCopy)
                    .then(() => showMessage("Operation copied!", "success"))
                    .catch(() => showMessage("Copy failed", "error"));
            }
        };

        // زر الحذف
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.marginLeft = '10px';
        deleteBtn.onclick = () => {
            const idx = operations.indexOf(opHTML);
            if (idx > -1) {
                operations.splice(idx, 1);
                localStorage.setItem("operations", JSON.stringify(operations));
                renderHistory();
                showMessage("Selected history has been deleted.", 'error', modal);
            }
        };

        // نضيف زر النسخ أولاً ثم زر الحذف
        li.appendChild(copyBtn);
        li.appendChild(deleteBtn);

        historyList.appendChild(li);
    });
}


historyBtn.addEventListener('click', () => {
    modal.classList.add('show');
    renderHistory();
});

[modalClose, modal].forEach(el =>
    el.addEventListener('click', e => {
        if (e.target === modalClose || e.target === modal) {
            modal.classList.remove('show');
        }
    })
);

clearHistoryBtn.addEventListener('click', () => {
    if (operations.length === 0) {
        showMessage("There is no history to delete!", "error");
        return;
    }

    const confirmDelete = document.createElement('div');
    confirmDelete.className = 'confirm-delete';
    confirmDelete.innerHTML = `
    <div class="confirm-delete-message">
      <p>Are you sure you want to clear all history?</p>
      <button class="confirm-delete-yes">yes</button>
      <button class="confirm-delete-no">no</button>
    </div>
  `;
    modal.appendChild(confirmDelete);

    confirmDelete.querySelector('.confirm-delete-yes').onclick = () => {
        operations = [];
        localStorage.removeItem("operations");
        renderHistory();
        confirmDelete.remove();
        showMessage("All history have been deleted", "success");
    };

    confirmDelete.querySelector('.confirm-delete-no').onclick = () => {
        confirmDelete.remove();
    };
});

// Copy History to Clipboard
const copyBtn = document.getElementById('copy-btn');

copyBtn.onclick = () => {
    if (!operations.length) return showMessage('No history to copy.', 'error');

    const operationsText = operations
        .map(op => {
            if (typeof op === 'string') {
                const el = document.createElement('div');
                el.innerHTML = op;
                return el.innerText;
            }
        })
        .filter(Boolean)
        .join('\n') + '\n';

    const textArea = document.createElement('textarea');
    textArea.value = operationsText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showMessage("History copied successfully", "success");
};

// Settings Box Width Sync
const optionBoxWidth = document.querySelector('.settings-box .option-box').offsetWidth;
document.querySelector('.settings-box .reset-options').style.width = `${optionBoxWidth}px`;

// Toggle Settings Box
document.querySelectorAll('.screen ul li').forEach(li => {
    li.onclick = () => document.querySelector('.settings-box').classList.toggle('show');
});

document.addEventListener('click', e => {
    if (!e.target.closest('.settings-box') && !e.target.closest('.screen ul li')) {
        document.querySelector('.settings-box').classList.remove('show');
    }
});

// Theme Color Handling
const colorsListItems = Array.from(document.querySelectorAll('.colors-list li'));
const savedColor = localStorage.getItem('color');
if (savedColor) {
    colorsListItems.forEach(el => el.classList.toggle('active', el.dataset.value === savedColor));
    document.body.classList.add(savedColor);
}

colorsListItems.forEach(el => {
    el.addEventListener('click', () => {
        colorsListItems.forEach(i => i.classList.remove('active'));
        el.classList.add('active');
        localStorage.setItem('color', el.dataset.value);
        document.body.className = el.dataset.value;
    });
});

// Sound Control
let isSoundOn = JSON.parse(localStorage.getItem('isSoundOn')) || false;
const soundControl = document.querySelector('.sound-option');
const toggleSound = (target, val) => {
    isSoundOn = val;
    localStorage.setItem('isSoundOn', val);
    target.classList.add('active');
    target.parentElement.querySelector(`[data-value="${!val ? 'yes' : 'no'}"]`).classList.remove('active');
};

soundControl.addEventListener('click', ({
    target
}) => {
    if (['yes', 'no'].includes(target.dataset.value)) {
        toggleSound(target, target.dataset.value === 'yes');
    }
});

soundControl.querySelector('span[data-value="yes"]').classList.toggle('active', isSoundOn);
soundControl.querySelector('span[data-value="no"]').classList.toggle('active', !isSoundOn);

function playSound() {
    if (isSoundOn) new Audio('sounds/click.mp3').play();
}

// Vibration Control
let isVibrationOn = JSON.parse(localStorage.getItem('isVibrationOn')) || false;
const vibrationControl = document.querySelector('.vibration-option');

vibrationControl.addEventListener('click', ({
    target
}) => {
    if (target.dataset.value === 'yes' || target.dataset.value === 'no') {
        isVibrationOn = target.dataset.value === 'yes';
        localStorage.setItem('isVibrationOn', isVibrationOn);
        target.classList.add('active');
        const sibling = target.dataset.value === 'yes' ? target.nextElementSibling : target.previousElementSibling;
        sibling.classList.remove('active');
    }
});

function vibrate() {
    if (isVibrationOn && navigator.vibrate) navigator.vibrate(50);
}

// Memory Buttons Visibility
const buttons = document.querySelectorAll('[data-value="show"], [data-value="hidden"]');
const activeButtonValue = localStorage.getItem('activeButtonValue') || 'hidden';

function updateMemoryVisibility(value) {
    memoryButtons.forEach(item => {
        if (value === 'show') {
            item.style.display = 'block';
            setTimeout(() => requestAnimationFrame(() => (item.style.opacity = '1')), 100);
        } else {
            item.style.opacity = '0';
            setTimeout(() => {
                requestAnimationFrame(() => {
                    item.style.display = 'none';
                });
            }, 200);
        }
    });
}

buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.value === activeButtonValue));
updateMemoryVisibility(activeButtonValue);

buttons.forEach(button => {
    button.addEventListener('click', () => {
        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        localStorage.setItem('activeButtonValue', button.dataset.value);
        updateMemoryVisibility(button.dataset.value);
    });
});

// Reset Options
document.querySelector('.reset-options').onclick = () => {
    document.querySelector('.settings-box').classList.remove('show');
  ['color', 'isSoundOn', 'isVibrationOn', 'activeButtonValue'].forEach(k => localStorage.removeItem(k));
    window.location.reload();
};

// Share Button
const shareBtn = document.querySelector('.shareBtn');
shareBtn.addEventListener('click', () => {
    if (navigator.share) {
        navigator
            .share({
                title: 'My App',
                text: 'Check out this cool app!',
                url: window.location.href,
            })
            .then(() => console.log('Share was successful.'))
            .catch(e => console.log(`Error while sharing: ${e}`));
    } else {
        console.log('Social Share API not supported in this browser.');
    }
});

// Feedback Link
const feedbackLink = document.querySelector('.feedbackLink');
feedbackLink.addEventListener('click', e => {
    e.preventDefault();
    const subject = encodeURIComponent('Feedback for My App');
    const body = encodeURIComponent('Dear team,\n\nI would like to provide some feedback on your app.\n\nSincerely,\n[Your Name]');
    window.location.href = `mailto:support@myapp.com?subject=${subject}&body=${body}`;
});