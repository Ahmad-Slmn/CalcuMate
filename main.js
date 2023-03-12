// Get the element with the ID "screen" and store it in a variable
const screen = document.getElementById('screen');

// Get all elements with the "key" class and store them in a NodeList
const keys = document.querySelectorAll('.key');

// Declare an array to store operations and try to load previous data from localStorage
let operations = [];
if (localStorage.getItem("operations")) {
    operations = JSON.parse(localStorage.getItem("operations"));
}

// Declare a variable to store a timer reference
let timer = null;


// The forEach method is used to apply the click event to each key
keys.forEach(key => {
    // Add a mousedown event listener to the key
    key.addEventListener('mousedown', () => {
        // Set a timer to execute after 800ms
        timer = setTimeout(() => {
            // If the value of the key is 'clear', clear the screen
            if (key.getAttribute('value') === 'clear') {
                screen.value = '';
            }
        }, 800);
    });

    // Add a mouseup event listener to the key
    key.addEventListener('mouseup', () => {
        // Clear the timer set by the mousedown event listener
        clearTimeout(timer);
        // Get the value of the key
        const value = key.getAttribute('value');
        // If the value is 'clear', remove the last character from the screen
        if (value === 'clear') {
            if (screen.value.length > 0) {
                screen.value = screen.value.slice(0, -1);
            }
        }
        // If the value is '%', calculate the percentage and store the operation in an array
        else if (value === '%') {
            if (screen.value.length > 0 && !isNaN(screen.value)) {
                const result = parseFloat(screen.value) / 100;
                screen.value = result.toString();
                const date = new Date();
                const operation = screen.value + " % = " + result + "  " + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
                operations.push(operation);
                localStorage.setItem("operations", JSON.stringify(operations));
            }
        }
        // If the value is an operator, add it to the screen if the last character is a number
        else if (value === '+' || value === '-' || value === '*' || value === '/') {
            if (screen.value.length > 0 && !isNaN(screen.value.slice(-1))) {
                screen.value += value;
            }
        }
        // If the value is '=', evaluate the expression and store the operation in an array
        else if (value === '=') {
            const operation = screen.value.trim();
            if (operation) {
                const invalidChars = /[^0-9\+\-\*\/\%\.]/g;
                if (operation.match(invalidChars)) {
                    alert('Please enter a valid arithmetic operation');
                } else {
                    const operands = operation.split(/(\+|\-|\*|\/|%)/).map(operand => operand.trim());
                    if (operands.length > 1) {
                        const result = eval(operation);
                        const date = new Date();
                        const operationStr = operation + " = " + result + "  " + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
                        operations.push(operationStr);

                        screen.value = result.toString();

                        localStorage.setItem("operations", JSON.stringify(operations));
                    }
                }
            } else {
                alert('Please enter an arithmetic operation');
            }
        }
        // For any other key, append its value to the screen
        else {
            screen.value += value;
        }
    });
});

// Select DOM elements
const historyBtn = document.getElementById('history-btn');
const modal = document.getElementById('history-modal');
const modalClose = document.getElementsByClassName('close')[0];
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// Show history modal when history button is clicked
historyBtn.onclick = function () {
    modal.style.display = 'block';
    historyList.innerHTML = '';
    // Loop through operations and append them to the history list
    operations.forEach(operation => {
        const listItem = document.createElement('li');
        listItem.innerText = operation;
        historyList.appendChild(listItem);
    });
}

// Hide history modal when close button is clicked
modalClose.onclick = function () {
    modal.style.display = 'none';
}

// Clear history and remove from local storage when clear history button is clicked
clearHistoryBtn.onclick = function () {
    operations = [];
    localStorage.removeItem("operations");
    historyList.innerHTML = '';
}

// Copy history to clipboard when copy button is clicked
const copyBtn = document.getElementById('copy-btn');

copyBtn.onclick = function () {
    if (operations.length > 0) {
        const textArea = document.createElement('textarea');
        textArea.value = operations.join('\n');
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('History copied to clipboard successfully!');
    } else {
        alert('No history to copy.');
    }
}

// Remove the loading spinner after page load
window.addEventListener("load", function () {
    setTimeout(function () {
        document.body.style.overflow = "auto";
        document.querySelector(".loader").style.display = "none"
    }, 3000);
});
