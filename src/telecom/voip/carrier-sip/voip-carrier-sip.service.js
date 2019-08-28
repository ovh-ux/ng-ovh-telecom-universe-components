import merge from 'lodash/merge';
import VoipCarrierSipLine from './voip-carrier-sip.class';

export default class {
  /* @ngInject */
  constructor($q, OvhApiTelephony) {
    this.$q = $q;
    this.OvhApiTelephony = OvhApiTelephony;
  }

  fetchAll(billingAccount) {
    return this.OvhApiTelephony.CarrierSip().v6().query({
      billingAccount,
    }).$promise.then(carrierSipLines => this.$q.all(carrierSipLines
      .map(carrierSip => this.fetchSingleCarrierSip(
        billingAccount,
        carrierSip,
      ))));
  }

  fetchSingleCarrierSip(billingAccount, serviceName) {
    return this.OvhApiTelephony.CarrierSip().v6().get({
      billingAccount,
      serviceName,
    }).$promise.then(carrierSip => new VoipCarrierSipLine(merge(carrierSip, { billingAccount })));
  }
}
