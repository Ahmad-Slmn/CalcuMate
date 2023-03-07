
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
