import angular from 'angular';
import translate from 'angular-translate';
import translateAsyncLoader from '@ovh-ux/translate-async-loader';

import tucElapsedTimeDirective from './elapsed-time.directive';
import TucElapsedTimePeriodicUpdater from './elapsed-time-periodic-updater.service';

const moduleName = 'tucElapsedTime';

angular
  .module(moduleName, [
    translate,
    translateAsyncLoader,
  ])
  .directive('tucElapsedTime', tucElapsedTimeDirective)
  .service('TucElapsedTimePeriodicUpdater', TucElapsedTimePeriodicUpdater)
  .run(/* @ngTranslationsInject ./translations */);

export default moduleName;
