import angular from 'angular';
import translate from 'angular-translate';
import translateAsyncLoader from '@ovh-ux/translate-async-loader';

import tucInputFileChangeDirective from './input-file-change.directive';
import tucInputFileDirective from './input-file.directive';
import './input-file.less';

const moduleName = 'tucInputFile';

angular
  .module(moduleName, [
    translate,
    translateAsyncLoader,
  ])
  .directive('tucInputFileChange', tucInputFileChangeDirective)
  .directive('tucInputFile', tucInputFileDirective)
  .run(/* @ngTranslationsInject ./translations */);

export default moduleName;
