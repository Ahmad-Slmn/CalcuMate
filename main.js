const screen = document.getElementById('screen');
const keys = document.querySelectorAll('.key');
let operations = [];

// check if operations exist in local storage
if (localStorage.getItem("operations")) {
    operations = JSON.parse(localStorage.getItem("operations"))
}

let timer = null;

keys.forEach(key => {
    key.addEventListener('mousedown', () => {
        timer = setTimeout(() => {
            if (key.getAttribute('value') === 'clear') {
                screen.value = '';
            }
        }, 800);
    });

    key.addEventListener('mouseup', () => {
        clearTimeout(timer);
        const value = key.getAttribute('value');
        if (value === 'clear') {
            if (screen.value.length > 0) {
                screen.value = screen.value.slice(0, -1);
            }
        } else if (value === '%') {
            if (screen.value.length > 0 && !isNaN(screen.value)) {
                const result = parseFloat(screen.value) / 100;
                screen.value = result.toString();
                operations.push(screen.value + " % = " + result);
                // show result on screen
                screen.value = result.toString();
            }
        } else if (value === '+') {
            if (screen.value.length > 0 && !isNaN(screen.value.slice(-1))) {
                screen.value += value;
            }
        } else if (value === '-') {
            if (screen.value.length > 0 && !isNaN(screen.value.slice(-1))) {
                screen.value += value;
            }
        } else if (value === '*') {
            if (screen.value.length > 0 && !isNaN(screen.value.slice(-1))) {
                screen.value += value;
            }
        } else if (value === '/') {
            if (screen.value.length > 0 && !isNaN(screen.value.slice(-1))) {
                screen.value += value;
            }
        } else if (value === '=') {
    const operation = screen.value.trim();
    if (operation) {
        const invalidChars = /[^0-9\+\-\*\/\%\.]/g;
        if (operation.match(invalidChars)) {
            alert('يرجى إدخال عملية رياضية صحيحة');
        } else {
            const operands = operation.split(/(\+|\-|\*|\/|%)/).map(operand => operand.trim());
            if (operands.length > 1) {
                const result = eval(operation);
                operations.push(operation + " = " + result);
                // save operations to local storage
                localStorage.setItem("operations", JSON.stringify(operations));
                // show result on screen
                screen.value = result.toString();
            }
        }
    } else {
        alert('يرجى إدخال عملية رياضية ');
    }
}
 else {
            screen.value += value;
        }
    });


});

const historyBtn = document.getElementById('history-btn');
const modal = document.getElementById('history-modal');
const modalClose = document.getElementsByClassName('close')[0];
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

historyBtn.onclick = function () {
    modal.style.display = 'block';
    historyList.innerHTML = '';
    operations.forEach(operation => {
        const listItem = document.createElement('li');
        listItem.innerText = operation;
        historyList.appendChild(listItem);
    });
}
modalClose.onclick = function () {
    modal.style.display = 'none';
}

clearHistoryBtn.onclick = function () {
    operations = [];
    localStorage.removeItem("operations");
    historyList.innerHTML = '';
}

const copyBtn = document.getElementById('copy-btn');

copyBtn.onclick = function () {
    if (operations.length > 0) {
        const textArea = document.createElement('textarea');
        textArea.value = operations.join('\n');
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('تم نسخ السجل إلى الحافظة بنجاح!');
    } else {
        alert('لا يوجد سجل للنسخ.');
    }
}

window.addEventListener("load", function () {

    setTimeout(function () {
        document.body.style.overflow = "auto";
        document.querySelector(".loader").style.display = "none"


    }, 3000);
});
