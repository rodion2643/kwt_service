(function () {
  'use strict';

  if (document.body.dataset.page !== 'home') return;

  KWTForm.initForm('home-form');
  KWTForm.fillServiceSelect('home-form-service');
})();
