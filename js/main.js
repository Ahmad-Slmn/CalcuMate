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
        // Call the function to play sound
        playSound();
        // Call the function to play vibration
        vibrate();
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
setInterval(checkrecord);

// Copy record to clipboard when copy button is clicked
const copyBtn = document.getElementById('copy-btn');

// When the copy button is clicked, copy the operations to clipboard
copyBtn.onclick = function () {
    if (operations.length > 0) {
        // Map each operation to a string and filter out any undefined values
        const operationsToCopy = operations.map(operation => {
            if (typeof operation === 'string') {
                const operationElem = document.createElement('div');
                operationElem.innerHTML = operation;
                return operationElem.innerText;
            }
        }).filter(text => text !== undefined);

        // Create a textarea element, set its value to the operations to copy, and add it to the DOM
        const textArea = document.createElement('textarea');
        textArea.value = operationsToCopy.join('\n') + '\n';
        document.body.appendChild(textArea);

        // Select the textarea's text and copy it to clipboard, then remove the textarea and show an alert
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Record copied to clipboard successfully!');
    } else {
        alert('No record to copy.')
    }
}

// Set the width of the reset-options button equal to the width of the option-box element

let optionBoxWidth = document.querySelector('.settings-box .option-box').offsetWidth;

document.querySelector('.settings-box .reset-options').style.width = optionBoxWidth + "px";

// When an li element in the .screen ul is clicked, toggle the .settings-box element's "show" class
document.querySelectorAll('.screen ul li').forEach(function (element) {
    element.onclick = function () {
        document.querySelector(".settings-box").classList.toggle("show");
    };
});

// When any element is clicked outside of the .settings-box and .screen ul li elements, remove the "show" class from the .settings-box element
document.addEventListener('click', function (event) {
    if (!event.target.matches('.settings-box') && !event.target.matches('.screen ul li')) {
        document.querySelector('.settings-box').classList.remove('show');
    }
});


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

// Apply stored color on page load
if (localStorage.getItem("color") !== null) {
    document.querySelector("body").classList.add(localStorage.getItem("color"));
}

// Add click event listener to each element in the .colors-list
Array.from(document.querySelectorAll(".colors-list li")).forEach(function (element) {
    element.addEventListener("click", function () {
        // Add "active" class to clicked element and remove it from its siblings
        element.classList.add("active");
        Array.from(
            element.parentNode.querySelectorAll(
                "li:not([data-value='" + element.getAttribute("data-value") + "'])"
            )
        ).forEach(function (el) {
            el.classList.remove("active");
        });
        // Store selected color in localStorage and set body background color to the selected color
        var selectedColor = element.getAttribute("data-value");
        localStorage.setItem("color", selectedColor);
        document.querySelector("body").className = selectedColor;
    });
});

// Initialize isSoundOn variable
let isSoundOn = false;

// Define function to play sound
function playSound() {
    // If sound is on, create an audio object and play the "click" sound
    if (isSoundOn) {
        const audio = new Audio('click.wav');
        audio.play();
    }
}

// Add click event listener to the sound control element
const soundControl = document.querySelector('.sound-option');
soundControl.addEventListener('click', (event) => {
    const target = event.target;
    // If "yes" button is clicked, set isSoundOn to true and update localStorage and button classes
    if (target.dataset.value === 'yes') {
        isSoundOn = true;
        localStorage.setItem('isSoundOn', true);
        target.classList.add('active');
        target.nextElementSibling.classList.remove('active');
    }
    // If "no" button is clicked, set isSoundOn to false and update localStorage and button classes
    else if (target.dataset.value === 'no') {
        isSoundOn = false;
        localStorage.setItem('isSoundOn', false);
        target.classList.add('active');
        target.previousElementSibling.classList.remove('active');
    }
});

// Check if sound setting is stored in localStorage and update isSoundOn variable and button classes accordingly
const storedSoundSetting = localStorage.getItem('isSoundOn');
if (storedSoundSetting !== null) {
    isSoundOn = JSON.parse(storedSoundSetting);
    const yesOption = document.querySelector('.sound-option .yes');
    const noOption = document.querySelector('.sound-option .no');
    if (!isSoundOn) {
        noOption.classList.add('active');
        yesOption.classList.remove('active');
    } else {
        yesOption.classList.add('active');
        noOption.classList.remove('active');
    }
}

let isVibrationOn = false;

function vibrate() {
    // If vibration is on, vibrate the device for 50 milliseconds
    if (isVibrationOn && 'vibrate' in window.navigator) {
        window.navigator.vibrate(50);
    }
}


// Add click event listener to the vibration control element
const vibrationControl = document.querySelector('.vibration-option');
vibrationControl.addEventListener('click', (event) => {
    const target = event.target;
    // If "yes" button is clicked, set isVibrationOn to true and update localStorage and button classes
    if (target.dataset.value === 'yes') {
        isVibrationOn = true;
        localStorage.setItem('isVibrationOn', true);
        target.classList.add('active');
        target.nextElementSibling.classList.remove('active');
    }
    // If "no" button is clicked, set isVibrationOn to false and update localStorage and button classes
    else if (target.dataset.value === 'no') {
        isVibrationOn = false;
        localStorage.setItem('isVibrationOn', false);
        target.classList.add('active');
        target.previousElementSibling.classList.remove('active');
    }
});

function evaluate() {
    const expression = expressionDisplay.textContent;
    try {
        const result = math.evaluate(expression);
        if (isNaN(result)) {
            resultDisplay.textContent = 'Error';
        } else {
            resultDisplay.textContent = result;
            vibrate();
        }
    } catch (error) {
        resultDisplay.textContent = 'Error';
    }
}

// Check if vibration setting is stored in localStorage and update isVibrationOn variable and button classes accordingly
const storedVibrationSetting = localStorage.getItem('isVibrationOn');
if (storedVibrationSetting !== null) {
    isVibrationOn = JSON.parse(storedVibrationSetting);
    const yesOption = document.querySelector('.vibration-option .yes');
    const noOption = document.querySelector('.vibration-option .no');
    if (!isVibrationOn) {
        noOption.classList.add('active');
        yesOption.classList.remove('active');
    } else {
        yesOption.classList.add('active');
        noOption.classList.remove('active');
    }
}

// Attach a click event listener to the "reset-options" element
document.querySelector(".reset-options").onclick = function () {

    // Hide the settings box when the reset button is clicked
    document.querySelector(".settings-box").classList.toggle("show");

    // Remove the "color" and "isSoundOn" items from local storage
    ["color", "isSoundOn", "isVibrationOn"].forEach(function (key) {
        localStorage.removeItem(key);
    });

    // Reload the page to apply the default settings
    window.location.reload()
}
