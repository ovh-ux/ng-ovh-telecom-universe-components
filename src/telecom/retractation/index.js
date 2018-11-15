import angular from 'angular';
import translate from 'angular-translate';
import translateAsyncLoader from '@ovh-ux/translate-async-loader';
import tucTelecomRetractation from './telecom-retractation.component';

const moduleName = 'tucTelecomRetractation';

angular
  .module(moduleName, [
    translate,
    translateAsyncLoader,
  ])
  .component('tucTelecomRetractation', tucTelecomRetractation)
  .run(/* @ngTranslationsInject ./translations */);

export default moduleName;
