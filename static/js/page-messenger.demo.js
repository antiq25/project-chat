import { createPopup } from 'https://unpkg.com/@picmo/popup-picker@latest/dist/index.js?module';

var handleRenderPickmo = function() {
	const selectionContainer = document.querySelector('#selection-outer');
  const emoji = document.querySelector('selection-emoji');
  const name = document.querySelector('selection-name');
  const trigger = document.querySelector('#trigger');

  const picker = createPopup({}, {
    referenceElement: trigger,
    triggerElement: trigger,
    position: 'right-end',
    emoji: emoji, // emoji element  (optional)
    name: name // name element (optional)  

  });

  trigger.addEventListener('click', () => {
    picker.toggle();
  });

  picker.addEventListener('emoji:select', (selection) => {
    $('#message').val($('#message').val() + selection.emoji)

    if (selectionContainer) {
      selectionContainer.classList.remove('d-none');
  }
    });
};

var handleChatScrollBottom = function() {
  var elm = document.getElementById('chatbox');
	elm.scrollTop = elm.scrollHeight - elm.clientHeight;
};



$(() => {
  handleRenderPickmo();
  handleChatScrollBottom();
});
