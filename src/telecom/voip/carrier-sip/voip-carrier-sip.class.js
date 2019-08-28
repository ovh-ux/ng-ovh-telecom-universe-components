export default class VoipCarrierSipLine {
  /* @ngInject */
  constructor(options) {
    this.billingAccount = options.billingAccount;
    this.description = options.description;
    this.serviceName = options.serviceName;
    this.serviceType = options.serviceType;
  }

  getDisplayedName() {
    return this.description || this.serviceName;
  }
}
