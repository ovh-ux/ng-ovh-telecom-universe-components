import angular from 'angular';
import translate from 'angular-translate';
import translateAsyncLoader from '@ovh-ux/translate-async-loader';
import 'angular-ui-bootstrap';

import tucResiliationReason, { templateConfirmation } from './resiliation-reason.component';

const moduleName = 'tucResiliation';

angular
  .module(moduleName, [
    translate,
    translateAsyncLoader,
    'ui.bootstrap',
  ])
  .component('tucResiliationReason', tucResiliationReason)
  .run(/* @ngInject */($templateCache) => {
    $templateCache.put('resiliation.modal.html', templateConfirmation);
  })
  .run(/* @ngTranslationsInject ./translations */);

export default moduleName;
