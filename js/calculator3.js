/**
 * Created by Nancy Vasilyeva <gothness@ymail.com>
 * Date: 12.07.2017
 */

"use strict";


// Экран вывода информации
let display;

// Лог-окно
let logWindow;

// Массив операторов c экранированными символами.
// Используется далее в регулярных выражениях
let shieldedOperators = [];

let calculatorBinds = {
    'one': () => displayInput('1'),
    'two': () => displayInput('2'),
    'three': () => displayInput('3'),
    'four': () => displayInput('4'),
    'five': () => displayInput('5'),
    'six': () => displayInput('6'),
    'seven': () => displayInput('7'),
    'eight': () => displayInput('8'),
    'nine': () => displayInput('9'),
    'zero': () => displayInput('0'),
    'delimiter': () => displayInput('.'),
    'backspace': () => displayDelete(),
    'clear': () => display.value = '',
    'div': () => displayInput('/'),
    'mul': () => displayInput('*'),
    'sub': () => displayInput('-'),
    'sum': () => displayInput('+'),
    'lbracket': () => displayInput('('),
    'rbracket': () => displayInput(')'),
    'power2': () => displayInput('^2'),
    'powerX': () => displayInput('^'),
    'root2': () => displayInput('^0.5'),
    'root3': () => displayInput('^(1/3)'),
    'memoryState': fMemoryState,
    'memoryRead': fMemoryRead,
    'equality' : equality,

    'sin': () => displayInput('sin '),
    'cos': () => displayInput('cos '),
    'tg': () => displayInput('tg '),
    'arcsin': () => displayInput('arcsin '),
    'arccos': () => displayInput('arccos '),
    'arctg': () => displayInput('arctg '),
    'logarithm2': () => displayInput('log2 '),
    'logarithmE': () => displayInput('ln '),
    'logarithm10': () => displayInput('lg '),
    'factorial': () => displayInput('!'),
    'pi': () => displayInput('pi'),
    'euler': () => displayInput('e'),
    'abs': () => displayInput('abs '),
    'plusMinus': fPlusMinus,
};


/**
 * Изменение знака числа, которого касается каретка
 */
function fPlusMinus() {

    let selEnd = display.selectionEnd;
    let str1 = display.value.slice(0,selEnd);
    let str2 = display.value.slice(selEnd, display.value.length);
        
    let numberStart = str1.search(/[0-9\.,]+$/);

    if (numberStart == -1 && /[0-9\.,]/.test(str2[0]))
        numberStart = str1.length;

    if (numberStart == -1) {
        logWindowOut('<br><span style="color: blue">Каретка не на цифре, операция смены знака не может быть применена</span>');
        display.focus();
        return; }
        
    // Смена знака.
    // Вначале отдельно обрабатывается случай, когда изменяется отрицательное число,
    // стоящее в начале строки
    let newRegExp = new RegExp('(' + shieldedOperators.join('|') + '|\\()(\\s*)-(\\s*)(\\d*[\\.,]?\\d*)$','');
    if (/^\s*-\s*[0-9\.,]*$/.test(str1))
        str1 = str1.replace(/^\s*-\s*([0-9\.,]*)$/, '$1');
    else if (newRegExp.test(str1))
        str1 = str1.replace(newRegExp, '$1$2$4');
    else
        str1 = str1.replace((/([0-9\.,]*)$/), '-$1');

    display.value = str1+str2;
    display.selectionEnd = str1.length;
    display.focus();
}


/**
 * Действие по нажатию кнопки "равно"
 */
function equality() {

    try {
        display.value = calculate(calculateFormat(display.value));
        display.select();
        display.focus();
    } catch (err) {
        logWindowOut('<span style="color: red">'+err+'</span>');
        console.error(err);
        alert('Выражение не может быть вычислено');
    }

}

// Анонимная самовызывающаяся функция, выполняющаяся при запуске системы
(function() {

    // Привязываем объекты к переменным
    display = document.getElementById('display');
    logWindow = document.getElementById('logWindow');

    // Очищаем дисплей
    // (поскольку при перезагрузке его содержимое сохраняется)
    display.value = '';

    // Если в sessionStorage.memory сохранено значение, то помещаем его во всплывающую посказку
    if (sessionStorage.memory)
        document.getElementById('memoryRead').title = sessionStorage.memory;

    // Если с прошлого сеанса сохранились какие-то заметки,
    // то загружаем их в поле заметок
    // и помещаем значок на переключателе
    if (localStorage.calculatorNote) {
        document.getElementById('noteWindow').value = localStorage.calculatorNote;
        document.getElementById('tfNote').checked = true;
    }

    // Делаем поле заметок и лог видимыми или невидимыми в зависимости от положения
    // соответствующих переключателей
    changeField(document.getElementById('tfNote').value, document.getElementById('tfNote').checked);
    changeField(document.getElementById('tfLog').value, document.getElementById('tfLog').checked);

    // Прикрепление к кнопкам функций-обработчиков,
    // прописанных нами в объекте calculatorBinds.
    // Обращаю внимание, что в отличие от Нэнсиного кода,
    // этот выполняется уже после загрузки всего документа
    for (let t in calculatorBinds) 
        document.getElementById(t).addEventListener('click', calculatorBinds[t]);

    // Добавляем к полю ввода обработчик нажатия клавиш
    display.addEventListener('keypress', function(e) {
        if (e.keyCode==13 || e.charCode==61) {
            //останавливаем дальнейшую обработку нажатия, чтобы '=' не пропечатывалось
            e.preventDefault();
            //запускаем функцию вычисления
            equality(); }
    });

    // Прикрепляем к переключателям слушатели их срабатывания
    document.getElementById('unitRad').addEventListener('change',function(){
        changeUnit(this.value) });
    document.getElementById('unitGrad').addEventListener('change',function(){
        changeUnit(this.value) });
    document.getElementById('tfNote').addEventListener('change',function(){
        changeField(this.value, this.checked) });
    document.getElementById('tfLog').addEventListener('change',function(){
        changeField(this.value, this.checked) });

    // Прикрепляем к объекту windows событие,
    // которое в момент выгрузки сохранит содержание поле заметок или
    // уничтожит в памяти ранее имевшиеся там записи
    window.addEventListener('beforeunload', function() {
        if (document.getElementById('noteWindow').value.trim() !== '')
            localStorage.calculatorNote = document.getElementById('noteWindow').value;
        else if (localStorage.calculatorNote)
            localStorage.removeItem('calculatorNote');
    });

    // Заполняем массив операторов, экранируя командные символы
    // Информация черпается из объектов calcMethods2 и calcMethods1.
    // На первом шаге образуется переменная, содержащая в себе функцию,
    // экранирующую операторы
    let escape =
        value => value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    Object.keys(calcMethods2).forEach(
        (item, i, arr) => shieldedOperators.push(escape(item))
    );
    Object.keys(calcMethods1).forEach(
        (item, i, arr) => shieldedOperators.push(escape(item))
    );
    
    // Передаём фокус на поле ввода калькулятора
    display.focus();

})();


function changeUnit(arg) {
    let str = display.value.trim();
    if (isNumber(str))
        display.value = arg == 'rad' ?
            gradRad(parseFloat(str)) :
            radGrad(parseFloat(str));
}


function changeField(elem, state) {
    document.getElementById(elem).style.display = state ? 'block' : 'none';
}


// Формируем метод, позволяющий выводить сообщения в лог-окно.
// Количество параметров может быть любым,
// каждый выводится в отдельной строке
function logWindowOut() {

    // Выводим полученные функцией аргументы,
    // беря их из свойства arguments.
    // Благодаря этому приёму мы можем динамически определить число переданных параметров
    for (let i=0; i<arguments.length; i++)
        logWindow.innerHTML += Array.isArray(arguments[i]) ? '<br>'+arguments[i].join(' &nbsp;') : '<br>'+arguments[i];

    // Перематываем окно вниз
    logWindow.scrollTop = logWindow.scrollHeight - logWindow.clientHeight;
}


/**
 * Функция сохранения содержимого окна ввода в память
 */
function fMemoryState() {
    
    let selStart = display.selectionStart;
    let selEnd = display.selectionEnd;
    
    sessionStorage.memory = selStart == selEnd ? display.value : display.value.slice(selStart,selEnd);
     
    document.getElementById('memoryRead').title = sessionStorage.memory;
    if (sessionStorage.memory != '')
        logWindowOut('<br><span style="color: blue">память &nbsp;&larr;&nbsp; '+sessionStorage.memory+'</span>');
    else
        logWindowOut('<br><span style="color: blue">Очистка памяти</span>');
    
    display.focus();
}


/**
 * Функция помещения содержимого памяти на экран
 */
function fMemoryRead() {
    if (sessionStorage.memory !== undefined && sessionStorage.memory !== '') {
        displayInput(sessionStorage.memory);
        logWindowOut('<br><span style="color: blue">'+sessionStorage.memory+' &nbsp;&rarr;&nbsp; дисплей</span>');
    } else 
        logWindowOut('<br><span style="color: blue">Память пуста</span>');
}


/**
 * Задаём функцию ввода нового символа в окно ввода
 */
function displayInput(newCh) {

    let str = display.value;
    let selStart = display.selectionStart;
    display.value = str.slice(0,selStart)+newCh+str.slice(display.selectionEnd,str.length);
    display.selectionEnd = selStart+newCh.length;
    display.focus(); 
}


/**
 * Задаём функцию удаления части окна ввода
 */
function displayDelete() {

    let str = display.value;
    let selStart = display.selectionStart;
    let selEnd = display.selectionEnd;
    
    if (selEnd > 0 && selStart == selEnd) {
        display.value = str.slice(0,selStart-1)+str.slice(display.selectionEnd,str.length);
        display.selectionEnd = selStart-1;
    } else {
        display.value = str.slice(0,selStart)+str.slice(selEnd,str.length);
        display.selectionEnd = selStart;
    }

    display.focus();  
}