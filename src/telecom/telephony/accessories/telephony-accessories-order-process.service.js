import angular from 'angular';
import each from 'lodash/each';
import fill from 'lodash/fill';
import filter from 'lodash/filter';
import map from 'lodash/map';

export default /* @ngInject */ function (
  $q,
  OvhApiTelephony,
  OvhApiOrder,
  TUC_TELEPHONY_LINE_PHONE_ACCESSORIES,
) {
  const self = this;
  let orderProcess = null;

  /*= ==============================
    =            HELPERS            =
    =============================== */

  self.getOrderProcess = function getOrderProcess() {
    return orderProcess;
  };

  self.getPriceStruct = function getPriceStruct(value) {
    return {
      currencyCode: 'EUR',
      text: `${value.toFixed(2)} €`,
      value,
    };
  };

  function getAccessoryList() {
    let list = [];

    each(
      filter(
        orderProcess.accessoriesList,
        accessory => accessory.quantity > 0,
      ),
      (accessory) => {
        list = list.concat(fill(new Array(accessory.quantity), accessory.name));
      },
    );

    return list;
  }

  /* -----  End of HELPERS  ------*/

  /*= ==================================
    =            ACCESSORIES            =
    =================================== */

  self.getAvailableAccessories = function getAvailableAccessories(country) {
    if (!orderProcess.accessoriesList) {
      return OvhApiTelephony.v6().accessories({
        country: country || 'fr',
      }).$promise.then((accessoriesList) => {
        orderProcess.accessoriesList = map(
          accessoriesList,
          accessory => angular.extend(accessory, {
            url: TUC_TELEPHONY_LINE_PHONE_ACCESSORIES[accessory.name]
              ? TUC_TELEPHONY_LINE_PHONE_ACCESSORIES[accessory.name].url : null,
            img: TUC_TELEPHONY_LINE_PHONE_ACCESSORIES[accessory.name]
              ? TUC_TELEPHONY_LINE_PHONE_ACCESSORIES[accessory.name].img : null,
            quantity: 0,
          }),
        );

        return orderProcess;
      });
    }
    return $q.when(orderProcess);
  };

  /* -----  End of ACCESSORIES  ------*/

  /*= ===============================
    =            CHECKOUT            =
    ================================ */

  self.getOrderCheckout = function getOrderCheckout() {
    return OvhApiOrder.Telephony().v6().getAccessories({
      billingAccount: orderProcess.billingAccount,
      accessories: getAccessoryList(),
      retractation: true,
      shippingContactId: orderProcess.shipping.contact
        ? orderProcess.shipping.contact.id : undefined,
      mondialRelayId: orderProcess.shipping.mode === 'mondialRelay'
        && orderProcess.shipping.relay ? orderProcess.shipping.relay.id : null,
    }).$promise;
  };

  self.orderCheckout = function () {
    return OvhApiOrder.Telephony().v6().orderAccessories({
      billingAccount: orderProcess.billingAccount,
    }, {
      accessories: getAccessoryList(),
      retractation: orderProcess.retract,
      shippingContactId: orderProcess.shipping.contact
        ? orderProcess.shipping.contact.id : undefined,
      mondialRelayId: orderProcess.shipping.mode === 'mondialRelay' ? orderProcess.shipping.relay.id : null,
    }).$promise;
  };

  /* -----  End of CHECKOUT  ------*/

  /*= =====================================
    =            INITIALIZATION            =
    ====================================== */

  self.init = function (billingAccount) {
    orderProcess = {
      billingAccount,
      currentView: 'choice',
      accessoriesList: null,
      shipping: {
        mode: null,
        contact: null,
        relay: null,
      },
      retract: null,
    };

    return orderProcess;
  };

  /* -----  End of INITIALIZATION  ------*/
}
