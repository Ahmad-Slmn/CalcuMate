const screen = document.getElementById('screen');
const keys = document.querySelectorAll('.key');

keys.forEach(key => {
    key.addEventListener('click', () => {
        const value = key.getAttribute('value');
        if (value === 'clear') {
            screen.value = '';
        } else if (value === '=') {
            screen.value = eval(screen.value);
        } else {
            screen.value += value;
        }
    });
});

window.addEventListener("load", function () {

    setTimeout(function () {
        document.body.style.overflow = "auto";
        document.querySelector(".loader").style.display = "none"


    }, 3000);
});
