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

        // If the value is a number, add it to the screen
        else if (!isNaN(value) || value === '.') {
            screen.value += value;
        }

        // If the value is an operator, add it to the screen if the last character is a number
        else if (value === '+' || value === '-' || value === '×' || value === '÷' || value === '%') {
            if (screen.value.length > 0 && (!isNaN(screen.value.slice(-1)) || screen.value.slice(-1) === '%')) {
                // Change division symbol from '/' to '÷'
                if (value === '/') {
                    screen.value += '÷';
                }
                // Change multiplication symbol from '*' to '×'
                else if (value === '*') {
                    screen.value += '×';
                } else {
                    screen.value += value;
                }
            }
        }

        // If the value is '=', evaluate the expression and store the operation in an array
        else if (value === '=') {
            const operation = screen.value.trim();
            if (operation) {
                const invalidChars = /[^0-9\+\-\÷\×\%\.\(\)]/g;
                if (operation.match(invalidChars)) {
                    alert('Please enter a valid arithmetic operation');
                } else {

                    // The regex has been modified here to use the required arithmetic symbols.
                    const operands = operation.split(/(\+|\-|\×|\÷|\%)/).map(operand => operand.trim());
                    if (operands.length > 1) {
                        // The replace() function was used to replace the original arithmetic operators (/ and *) with the required symbols (÷ and ×).
                        const result = eval(operation.replace(/\×/g, '*').replace(/\÷/g, '/').replace(/\%/g, '/100'));
                        const date = new Date();
                        const operationDate = document.createElement('span');
                        operationDate.innerText = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
                        operationDate.classList.add("Operation-Date");
                        const operationElem = document.createElement('div');
                        const operationText = document.createElement('span');
                        operationText.innerText = operation.replace(/\×/g, '×').replace(/\÷/g, '÷').replace(/\%/g, '%') + " = " + result;
                        operationText.classList.add("Operation-Text");
                        operationElem.appendChild(operationText);
                        operationElem.appendChild(operationDate);
                        operations.push(operationElem.outerHTML);
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
const recordBtn = document.getElementById('record-btn');
const modal = document.getElementById('record-modal');
const modalClose = document.getElementsByClassName('close')[0];
const recordList = document.getElementById('record-list');
const clearrecordBtn = document.getElementById('clear-record-btn')


// Show record modal when record button is clicked
recordBtn.onclick = function () {
    modal.style.display = 'block';
    recordList.innerHTML = '';
    // Loop through operations in reverse order and append them to the record list
    operations.slice().reverse().forEach(operation => {
        const operationElem = document.createElement('li');
        operationElem.innerHTML = operation;
        recordList.appendChild(operationElem);
        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'Delete';
        deleteBtn.onclick = function () {
            operationElem.remove();
            operations.splice(operations.indexOf(operationElem.outerHTML), 1);
            localStorage.setItem("operations", JSON.stringify(operations));
        };
        operationElem.appendChild(deleteBtn);
    });
}


// Hide record modal when close button is clicked
modalClose.onclick = function () {
    modal.style.display = 'none';
}

// Clear record and remove from local storage when clear record button is clicked
clearrecordBtn.addEventListener('click', function () {

    if (operations.length === 0) {
        alert("There is no record to delete!");
        return;
    }

    // Create the confirmation element and add it to the page.
    const confirmDelete = document.createElement('div');
    confirmDelete.classList.add('confirm-delete');
    confirmDelete.innerHTML = `
        <div class="confirm-delete-message">
            <p>Are you sure you want to clear all records?</p>
            <button class="confirm-delete-yes">yes</button>
            <button class="confirm-delete-no">no</button>
        </div>
    `;
    modal.appendChild(confirmDelete);

    // Assign a function to the "yes" button to delete the item and remove the confirmation element from the page.

    const confirmDeleteYes = document.querySelector('.confirm-delete-yes');
    confirmDeleteYes.addEventListener('click', function () {
        operations = [];
        localStorage.removeItem("operations");
        recordList.innerHTML = '';
        confirmDelete.remove();
    });

    // Assign a function to the "no" button to remove the confirmation element from the page.
    const confirmDeleteNo = document.querySelector('.confirm-delete-no');
    confirmDeleteNo.addEventListener('click', function () {
        confirmDelete.remove();
    });
});

// Update check Record function to improve readability and ease of future modifications
function checkrecord() {
    if (recordList.children.length === 0) {
        recordList.innerHTML = "The record is empty.";
        recordList.style.textAlign = "center";
    } else {

        recordList.style.textAlign = "left";
    }
}

// Call check Record function to update the display
setInterval(checkrecord, );


// Copy record to clipboard when copy button is clicked
const copyBtn = document.getElementById('copy-btn');

copyBtn.onclick = function () {
    if (operations.length > 0) {
        const operationsToCopy = operations.map(operation => {
            if (typeof operation === 'string') {
                const operationElem = document.createElement('div');
                operationElem.innerHTML = operation;
                return operationElem.innerText;
            }
        }).filter(text => text !== undefined);
        const textArea = document.createElement('textarea');
        textArea.value = operationsToCopy.join('\n') + '\n';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Record copied to clipboard successfully!');
    } else {
        alert('No record to copy.')
    }
}

// Change Theme Color On Click
if (localStorage.getItem("color") !== null) {
    localStorage.getItem("color");
    Array.from(document.querySelectorAll(".colors-list li")).forEach(function (element) {
        element.classList.remove("active");
        if (element.getAttribute("data-value") === localStorage.getItem("color")) {
            element.classList.add("active");
        }
    });
}

// Get Calculator element
var calculator = document.querySelector(".calculator");

// Apply stored color on page load
if (localStorage.getItem("color") !== null) {
    calculator.classList.add(localStorage.getItem("color"));
}

Array.from(document.querySelectorAll(".colors-list li")).forEach(function (element) {
    element.addEventListener("click", function () {
        element.classList.add("active");
        Array.from(
            element.parentNode.querySelectorAll(
                "li:not([data-value='" + element.getAttribute("data-value") + "'])"
            )
        ).forEach(function (el) {
            el.classList.remove("active");
        });
        var selectedColor = element.getAttribute("data-value");
        localStorage.setItem("color", selectedColor);
        calculator.className = "calculator " + selectedColor;
    });
});
