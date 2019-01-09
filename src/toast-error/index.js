import angular from 'angular';
import translate from 'angular-translate';
import '@ovh-ux/translate-async-loader';

import TucToast from '../toaster';
import TucToastError from './toast-error.service';

const moduleName = 'tucToastError';

angular
  .module(moduleName, [
    translate,
    'translate-async-loader',
    TucToast,
  ])
  .service('TucToastError', TucToastError)
  .run(/* @ngTranslationsInject ./translations */);

export default moduleName;
