// Get the element with the ID "screen" and store it in a variable
const screen = document.getElementById('screen');

// Set the Height of the Screen to the Height of the screenBoxHeight

let screenBoxHeight = document.querySelector('.screen').offsetHeight;

screen.style.height = screenBoxHeight + "px";


// Get all elements with the "key" class and store them in a NodeList
const keys = document.querySelectorAll('.key');

// Declare an array to store operations and try to load previous data from localStorage
let operations = [];
if (localStorage.getItem("operations")) {
    operations = JSON.parse(localStorage.getItem("operations"));
}

// Declare a variable to store a timer reference
let timer = null;

// Function to check if 'memory' is present in localStorage
// and if 'activeButtonValue' is set to 'show'.
// If true, display the span element, else hide it.
function checkLocalStorage() {
    if (localStorage.getItem('memory') !== null &&
        localStorage.getItem('activeButtonValue') === 'show') {
        document.querySelector('.screen > span').style.display = "block";
    } else {
        document.querySelector('.screen > span').style.display = "none";
    }
}

// Call the function once on page load
checkLocalStorage();

// Get all elements with class 'memory' and add a click event listener
// that calls the 'checkLocalStorage' function when clicked.
const memoryButtons = document.querySelectorAll('.memory');
memoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Call The Function to check if 'memory' Is Not Empty
        checkLocalStorage();
    });
});


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

    key.addEventListener('touchstart', () => {
        timer = setTimeout(() => {
            // If the value of the key is 'clear', clear the screen
            if (key.getAttribute('value') === 'clear') {
                screen.value = '';
            }
        }, 800);
    });

    key.addEventListener('mouseup', () => {
        clearTimeout(timer);
    });

    key.addEventListener('touchend', () => {
        clearTimeout(timer);
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
        } else if (value === '.') {
            if (!isNaN(screen.value.slice(-1))) {
                screen.value += value;
            }
        }

        // If the value is 'MR', retrieve the value from localStorage and display it on the screen
        else if (value === 'MR') {
            const memoryValue = localStorage.getItem('memory');
            if (memoryValue) {
                screen.value += memoryValue;
            }
        }

        // If the value is 'MC', clear the memory in localStorage
        else if (value === 'MC') {
            localStorage.removeItem('memory');
        }

        // If the value is 'M+', add the screen value to the memory in localStorage
        else if (value === 'M+') {
            const screenValue = screen.value.trim();
            if (screenValue) {
                const memoryValue = localStorage.getItem('memory');
                const newValue = memoryValue ? parseFloat(memoryValue) + parseFloat(screenValue) : parseFloat(screenValue);
                localStorage.setItem('memory', newValue.toString());
            }
        }

        // If the value is 'M-', subtract the screen value from the memory in localStorage
        else if (value === 'M-') {
            const screenValue = screen.value.trim();
            if (screenValue) {
                const memoryValue = localStorage.getItem('memory');
                const newValue = memoryValue ? parseFloat(memoryValue) - parseFloat(screenValue) : -parseFloat(screenValue);
                localStorage.setItem('memory', newValue.toString());
            }
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
                // Create a success message element
                const successMsg = document.createElement("div");
                successMsg.classList.add("success-message");
                successMsg.innerText = "Please enter an arithmetic operation";
                successMsg.style.backgroundColor = "red";
                document.body.appendChild(successMsg);
                // Fade in the success message
                setTimeout(function () {
                    successMsg.style.opacity = "1";
                }, 30);

                // Fade out the success message after 2 seconds
                setTimeout(function () {
                    successMsg.style.opacity = "0";
                    setTimeout(function () {
                        successMsg.parentNode.removeChild(successMsg);
                    }, 1000);
                }, 2000);

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
const clearRecordBtn = document.getElementById('clear-record-btn')


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
            // Create a success message element
            const successMsg = document.createElement("div");
            successMsg.classList.add("success-message");
            successMsg.innerText = "Selected record has been deleted.";
            successMsg.style.backgroundColor = "red";
            modal.appendChild(successMsg);
            // Fade in the success message
            setTimeout(function () {
                successMsg.style.opacity = "1";
            }, 30);

            // Fade out the success message after 2 seconds
            setTimeout(function () {
                successMsg.style.opacity = "0";
                setTimeout(function () {
                    successMsg.parentNode.removeChild(successMsg);
                }, 1000);
            }, 2000);
        };
        operationElem.appendChild(deleteBtn);
    });
}


// Hide record modal when close button is clicked
modalClose.onclick = function () {
    modal.style.display = 'none';
}

// Clear record and remove from local storage when clear record button is clicked
clearRecordBtn.addEventListener('click', function () {

    if (operations.length === 0) {
        const successMsg = document.createElement("div");
        successMsg.classList.add("success-message");
        successMsg.innerText = "There is no record to delete!";
        modal.appendChild(successMsg);
        successMsg.style.backgroundColor = "red";

        // Fade in the success message
        setTimeout(function () {
            successMsg.style.opacity = "1";
        }, 30);

        // Fade out the success message after 2 seconds
        setTimeout(function () {
            successMsg.style.opacity = "0";
            setTimeout(function () {
                successMsg.parentNode.removeChild(successMsg);
            }, 1000);
        }, 2000);
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
        // Create a success message element
        const successMsg = document.createElement("div");
        successMsg.classList.add("success-message");
        successMsg.innerText = "All records have been deleted.";
        successMsg.style.backgroundColor = "red";
        modal.appendChild(successMsg);
        // Fade in the success message
        setTimeout(function () {
            successMsg.style.opacity = "1";
        }, 30);

        // Fade out the success message after 2 seconds
        setTimeout(function () {
            successMsg.style.opacity = "0";
            setTimeout(function () {
                successMsg.parentNode.removeChild(successMsg);
            }, 1000);
        }, 2000);

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
        // Create a success message element
        const successMsg = document.createElement("div");
        successMsg.classList.add("success-message");
        successMsg.innerText = "Record copied successfully";
        modal.appendChild(successMsg);
        // Fade in the success message
        setTimeout(function () {
            successMsg.style.opacity = "1";
        }, 30);

        // Fade out the success message after 2 seconds
        setTimeout(function () {
            successMsg.style.opacity = "0";
            setTimeout(function () {
                successMsg.parentNode.removeChild(successMsg);
            }, 1000);
        }, 2000);

    } else {
        const successMsg = document.createElement("div");
        successMsg.classList.add("success-message");
        successMsg.innerText = "No record to copy.";
        modal.appendChild(successMsg);
        successMsg.style.backgroundColor = "red";

        // Fade in the success message
        setTimeout(function () {
            successMsg.style.opacity = "1";
        }, 30);

        // Fade out the success message after 2 seconds
        setTimeout(function () {
            successMsg.style.opacity = "0";
            setTimeout(function () {
                successMsg.parentNode.removeChild(successMsg);
            }, 1000);
        }, 2000);

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

// Initialize sound settings to off by default
let isSoundOn = false;

// Get the sound control element from the DOM
const soundControl = document.querySelector('.sound-option');

// Function to play the sound when triggered
function playSound() {
    // If sound is on, play the click sound
    if (isSoundOn) new Audio('click.wav').play();
}

// Function to toggle sound on and off and update the UI
function toggleSound(target, value) {
    // Update the sound setting variable and local storage
    isSoundOn = value;
    localStorage.setItem('isSoundOn', value);
    // Add the 'active' class to the clicked button and remove it from the other button
    target.classList.add('active');
    target.parentElement.querySelector(`[data-value="${!value ? 'yes' : 'no'}"]`).classList.remove('active');
}

// Add a click event listener to the sound control element
soundControl.addEventListener('click', ({
    target
}) => {
    // If a 'yes' or 'no' button is clicked, toggle the sound setting
    if (['yes', 'no'].includes(target.dataset.value)) {
        toggleSound(target, target.dataset.value === 'yes');
    }
});

// Check local storage for a saved sound setting and update the UI accordingly
const storedSoundSetting = localStorage.getItem('isSoundOn');
if (storedSoundSetting !== null) {
    // Update the sound setting variable with the saved setting
    isSoundOn = JSON.parse(storedSoundSetting);
    // Get references to the 'yes' and 'no' buttons
    const yesOption = soundControl.querySelector('span[data-value="yes"]');
    const noOption = soundControl.querySelector('span[data-value="no"]');
    // Add or remove the 'active' class from the buttons based on the saved sound setting
    yesOption.classList.toggle('active', isSoundOn);
    noOption.classList.toggle('active', !isSoundOn);
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

// Get all buttons with data-value="show" or data-value="hidden"
const buttons = document.querySelectorAll('[data-value="show"], [data-value="hidden"]');

// Get the value of the active button from localStorage
const activeButtonValue = localStorage.getItem('activeButtonValue');

// If there is an active button value in localStorage
if (activeButtonValue) {
    // Find the active button by its data-value attribute
    const activeButton = document.querySelector(`[data-value="${activeButtonValue}"]`);

    // If the active button exists and is not already active
    if (activeButton && !activeButton.classList.contains('active')) {
        // Remove the active class from all buttons
        buttons.forEach(button => button.classList.remove('active'));

        // Add the active class to the active button
        activeButton.classList.add('active');

        // Show or hide the "memory" elements based on the data-value of the active button
        if (activeButton.dataset.value === 'show') {
            memoryButtons.forEach(item => {
                item.style.opacity = '1';
                item.style.display = 'block';
            });
        } else if (activeButton.dataset.value === 'hidden') {
            memoryButtons.forEach(item => {
                item.style.opacity = '0';
                item.style.display = 'none';
            });
        }
    }
}

// Add a click event listener to each button
buttons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove the active class from all buttons
        buttons.forEach(btn => btn.classList.remove('active'));

        // Add the active class to the clicked button
        button.classList.add('active');

        // Store the data-value of the clicked button in localStorage
        localStorage.setItem('activeButtonValue', button.dataset.value);

        // Show or hide the "memoryButtons" elements based on the data-value of the clicked button
        if (button.dataset.value === 'show') {
            memoryButtons.forEach(item => {
                item.style.opacity = '0';
                item.style.display = 'block';
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        item.style.opacity = '1';
                    });
                }, 100);
            });
        } else if (button.dataset.value === 'hidden') {
            memoryButtons.forEach(item => {
                item.style.opacity = '1';
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        item.style.opacity = '0';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 200);
                    });
                });
            });
        }

        // Call The Function to check if 'memory' Is Not Empty
        checkLocalStorage();
    });
});

// Attach a click event listener to the "reset-options" element
document.querySelector(".reset-options").onclick = function () {

    // Hide the settings box when the reset button is clicked
    document.querySelector(".settings-box").classList.toggle("show");

    // Remove the "color" and "isSoundOn" items from local storage
    ["color", "isSoundOn", "isVibrationOn", "activeButtonValue"].forEach(function (key) {
        localStorage.removeItem(key);
    });

    // Reload the page to apply the default settings
    window.location.reload()
}


// Get the share button element
const shareBtn = document.querySelector('.shareBtn');

// Add a click event listener to the share button
shareBtn.addEventListener('click', () => {
    // Check if the browser supports the Social Share API
    if (navigator.share) {
        // If the browser supports the API, create the share data
        const shareData = {
            title: 'My App',
            text: 'Check out this cool app!',
            url: window.location.href
        };
        // Share the data using the Social Share API
        navigator.share(shareData)
            .then(() => {
                console.log('Share was successful.');
            })
            .catch((error) => {
                console.log(`An error occurred while sharing: ${error}`);
            });
    } else {
        // If the browser doesn't support the API, display an error message
        console.log('Social Share API not supported in this browser.');
    }
});

// Get the feedback link element
const feedbackLink = document.querySelector('.feedbackLink');

// Add a click event listener to the feedback link
feedbackLink.addEventListener('click', (event) => {
    // Prevent the link from navigating to a new page
    event.preventDefault();

    // Create the email data
    const emailData = {
        subject: 'Feedback for My App',
        body: 'Dear team,\n\nI would like to provide some feedback on your app.\n\nSincerely,\n[Your Name]'
    };

    // Create the mailto link
    const mailtoLink = `mailto:support@myapp.com?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;

    // Open the default email app with the mailto link
    window.location.href = mailtoLink;
});
