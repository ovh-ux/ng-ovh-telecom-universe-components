import angular from 'angular';
import translate from 'angular-translate';
import translateAsyncLoader from '@ovh-ux/translate-async-loader';
import 'ovh-ui-angular';

import tucShippingModeSelectionCtrl from './shipping-mode-selection.controller';
import tucShippingModeSelection from './shipping-mode-selection.component';

import './shipping-mode-selection.less';

const moduleName = 'tucShippingModeSelection';

angular
  .module(moduleName, [
    'oui',
    translate,
    translateAsyncLoader,
  ])
  .controller('tucShippingModeSelectionCtrl', tucShippingModeSelectionCtrl)
  .component('tucShippingModeSelection', tucShippingModeSelection)
  .run(/* @ngTranslationsInject ./translations */);

export default moduleName;
