import _ from 'lodash';

import templateModal from './modal/telephony-bulk-action-modal.html';

export default /* @ngInject */ function (
  $q,
  $translate,
  $translatePartialLoader,
  $uibModal,
  tucTelephonyBulkActionUpdatedServicesContainer,
) {
  const self = this;

  self.loading = {
    init: false,
  };

  self.previouslyUpdatedServices = [];

  /* =============================
    =            EVENTS            =
    ============================== */

  self.onBulkActionBtnClick = function () {
    if (self.onOpen && _.isFunction(self.onOpen())) {
      self.onOpen()();
    }

    return $uibModal.open({
      template: templateModal,
      controller: 'tucTelephonyBulkActionModalCtrl',
      controllerAs: '$ctrl',
      resolve: {
        modalBindings: {
          serviceType: self.serviceType,
          billingAccount: self.billingAccount,
          serviceName: self.serviceName,
          bulkInfos: self.bulkInfos,
          getBulkParams: self.getBulkParams,
          filterServices: self.filterServices,
          previouslyUpdatedServices: self.previouslyUpdatedServices,
        },
      },
    })
      .result.then((data) => {
        if (self.onSuccess && _.isFunction(self.onSuccess())) {
          self.onSuccess()(data);
        }

        if (_.isArray(data.success)) {
          tucTelephonyBulkActionUpdatedServicesContainer.storeUpdatedServices(data.success);
        }
      })
      .catch((error) => {
        if (_.get(error, 'type') === 'API' && self.onError && _.isFunction(self.onError())) {
          self.onError()(error);
        }
        return $q.reject(error);
      });
  };

  /* -----  End of EVENTS  ------ */


  /* =====================================
    =            INITIALIZATION            =
    ====================================== */

  function getTranslations() {
    $translatePartialLoader.addPart('../components/telecom/telephony/bulkAction');
    return $translate.refresh();
  }

  self.$onInit = function () {
    self.loading.init = true;

    self.previouslyUpdatedServices = tucTelephonyBulkActionUpdatedServicesContainer
      .getUpdatedServices();

    // check for attributes
    // check for serviceType : line or number - default to line
    if (['line', 'number'].indexOf(self.serviceType)) {
      self.serviceType = 'line';
    }

    // load translation
    return getTranslations().finally(() => {
      self.loading.init = false;
    });
  };

  /* -----  End of INITIALIZATION  ------ */
}
