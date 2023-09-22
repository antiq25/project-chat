/*
Template Name: HUD - Responsive Bootstrap 5 Admin Template
Version: 2.2.0
Author: Sean Ngu
Website: http://www.seantheme.com/hud/
*/

import { createPopup } from 'https://unpkg.com/@picmo/popup-picker@latest/dist/index.js?module';

var handleRenderPickmo = function() {
	const selectionContainer = document.querySelector('#selection-outer');
  const emoji = document.querySelector('#selection-emoji');
  const name = document.querySelector('#selection-name');
  const trigger = document.querySelector('#trigger');

  const picker = createPopup({}, {
    referenceElement: trigger,
    triggerElement: trigger,
    position: 'right-end'
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



var handleMobileMessengerToggler = function() {
	$(document).on('click', '[data-toggle="messenger-content"]', function(e) {
		e.preventDefault();
		
		$('.messenger').toggleClass('messenger-content-toggled');
	});
};


$(() => {
  handleRenderPickmo();
  handleMobileMessengerToggler();
});
