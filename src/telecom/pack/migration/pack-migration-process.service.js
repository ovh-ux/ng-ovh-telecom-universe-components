import angular from 'angular';
import _ from 'lodash';

/**
 *  Service used to share data between differents steps of the pack migration process.
 */
export default /* @ngInject */ function ($q, OvhApiPackXdsl, Poller) {
  const self = this;
  let migrationProcess = null;

  self.status = {
    init: false,
    migrate: false,
    success: false,
  };

  self.currentPack = {};

  /*= ==============================
    =            PROCESS            =
    =============================== */

  self.getMigrationProcess = function () {
    return migrationProcess;
  };

  /* -----  End of PROCESS  ------*/

  /*= ==============================
    =            HELPERS            =
    =============================== */

  self.getPriceStruct = function (value) {
    // pack will be our model to build price struct
    return {
      currencyCode: migrationProcess.pack.offerPrice.currencyCode,
      text: migrationProcess.pack.offerPrice.text.replace(/\d+(?:[.,]\d+)?/, value.toFixed(2)),
      value,
    };
  };

  self.getOptionsSelected = function () {
    return _.filter(_.values(migrationProcess.selectedOffer.options), option => option.optional && option.choosedValue > 0 && option.name !== 'gtr_ovh');
  };

  /* -----  End of HELPERS  ------*/

  /*= =======================================
    =            TASKS MANAGEMENT            =
    ======================================== */

  function getMigrationTaskByStatus(taskStatus) {
    return OvhApiPackXdsl.Task().v6().query({
      packName: migrationProcess.pack.packName,
      function: 'pendingMigration',
      status: taskStatus,
    }).$promise;
  }

  self.checkForPendingMigration = function () {
    return $q.all({
      todo: getMigrationTaskByStatus('todo'),
      doing: getMigrationTaskByStatus('doing'),
    }).then(tasksIds => tasksIds.todo.concat(tasksIds.doing));
  };

  self.startMigration = function () {
    const postParams = {
      acceptContracts: true,
      offerName: migrationProcess.selectedOffer.offerName,
    };

    // options post params
    const migrationOptions = _.map(self.getOptionsSelected(), option => ({
      name: option.name,
      quantity: option.choosedValue,
    }));

    if (migrationProcess.selectedOffer.options.gtr_ovh
      && migrationProcess.selectedOffer.options.gtr_ovh.selected) {
      migrationOptions.push({
        name: 'gtr_ovh',
        quantity: 1,
      });
    }

    postParams.options = migrationOptions;

    // shipping post params
    if (migrationProcess.selectedOffer.needNewModem && migrationProcess.shipping.mode === 'mondialRelay') {
      postParams.mondialRelayId = migrationProcess.shipping.relay.id;
    } else if (migrationProcess.selectedOffer.needNewModem && migrationProcess.shipping.mode === 'transporter') {
      postParams.nicShipping = migrationProcess.shipping.address.id;
    }

    // sub service to delete post params
    if (migrationProcess.selectedOffer.subServicesToDelete.length) {
      postParams.subServicesToDelete = [];
      angular.forEach(migrationProcess.selectedOffer.subServicesToDelete, (subService) => {
        postParams.subServicesToDelete = postParams
          .subServicesToDelete.concat(_.map(_.filter(subService.services, {
            selected: true,
          }), service => ({
            service: service.name,
            type: subService.type,
          })));
      });
    }

    // building details post params
    _.assign(postParams, {
      buildingReference: migrationProcess.selectedOffer.buildingReference,
      stair: migrationProcess.selectedOffer.stair,
      floor: migrationProcess.selectedOffer.floor,
    });

    // OTP post params
    _.assign(postParams, {
      otp: migrationProcess.selectedOffer.pto,
    });

    if (migrationProcess.selectedOffer.pto && migrationProcess.selectedOffer.ptoReference) {
      _.assign(postParams, {
        otpReference: migrationProcess.selectedOffer.ptoReference,
      });
    }

    return OvhApiPackXdsl.v6().migrate({
      packName: migrationProcess.pack.packName,
    }, postParams).$promise;
  };

  self.startTaskPolling = function () {
    return Poller.poll(['/pack/xdsl', migrationProcess.pack.packName, 'tasks', migrationProcess.migrationTaskId].join('/'), null, {
      namespace: 'xdsl_pack_migration',
    });
  };

  self.stopTaskPolling = function () {
    Poller.kill({
      namespace: 'xdsl_pack_migration',
    });
  };

  /* -----  End of TASKS MANAGEMENT  ------*/

  /*= ===================================
    =            CURRENT PACK            =
    ==================================== */

  function getPackService() {
    return OvhApiPackXdsl.v6().get({
      packId: migrationProcess.pack.packName,
    }).$promise.then((serviceDetails) => {
      angular.extend(migrationProcess.pack, serviceDetails);
    });
  }

  function getPackOptions() {
    return OvhApiPackXdsl.v6().getServices({
      packId: migrationProcess.pack.packName,
    }).$promise.then((packOptions) => {
      migrationProcess.pack.options = _.indexBy(packOptions, 'name');
    });
  }

  function getPackDetails() {
    return $q.allSettled([
      getPackService(),
      getPackOptions(),
    ]);
  }

  /* -----  End of CURRENT PACK  ------*/

  /*= =============================
    =            OFFERS            =
    ============================== */

  function getMigrationOffers() {
    return Poller.poll(['/pack/xdsl', migrationProcess.pack.packName, 'migration/offers'].join('/'), null, {
      postData: {},
      successRule: {
        status(elem) {
          return elem.status === 'error' || elem.status === 'ok';
        },
      },
      method: 'post',
    }).then((pollResult) => {
      if (!pollResult.error) {
        _.set(pollResult, 'result.offers', _.map(pollResult.result.offers, (offer) => {
          _.set(offer, 'displayedPrice', offer.price);
          _.set(offer, 'totalSubServiceToDelete', 0);
          _.each(offer.subServicesToDelete, (subService) => {
            offer.totalSubServiceToDelete += subService.numberToDelete; // eslint-disable-line
            return offer.totalSubServiceToDelete;
          });
          angular.forEach(offer.subServicesToDelete, (subService) => {
            _.set(subService, 'services', _.map(subService.services, (service, index, originalArray) => ({
              name: service,
              selected: originalArray.length === subService.numberToDelete,
            })));
          });
          _.set(offer, 'options', _.indexBy(offer.options, 'name'));
          _.set(offer, 'buildings', pollResult.result.buildings);
          return offer;
        }));
      }

      migrationProcess.migrationOffers = pollResult;
    });
  }

  self.initOffersView = function () {
    return $q.all({
      pack: getPackDetails(),
      offers: getMigrationOffers(),
    }).then(() => migrationProcess);
  };

  self.selectOffer = function (offer) {
    migrationProcess.selectedOffer = offer;
    if (_.includes(migrationProcess.selectedOffer.offerName.toLowerCase(), 'ftth')) {
      // Check if the current offer is already FTTH
      if (_.includes(migrationProcess.pack.offerDescription.toLowerCase(), 'ftth')) {
        migrationProcess.currentStep = 'serviceDelete';
      } else {
        migrationProcess.currentStep = 'buildingDetails';
      }
    } else if (migrationProcess.selectedOffer.totalSubServiceToDelete > 0) {
      migrationProcess.currentStep = 'serviceDelete';
    } else if (migrationProcess.selectedOffer.needNewModem) {
      migrationProcess.currentStep = 'shipping';
    } else {
      migrationProcess.currentStep = 'confirm';
    }
  };

  /* -----  End of OFFERS  ------*/

  /*= =====================================
    =            INITIALIZATION            =
    ====================================== */

  self.cancelMigration = function () {
    migrationProcess.shipping = {
      mode: null,
      relay: null,
      address: null,
    };

    migrationProcess.currentStep = 'offers';
    migrationProcess.selectedOffer = null;
  };

  self.init = function (packName) {
    migrationProcess = {
      pack: {
        packName,
      },
      shipping: {
        mode: null,
        relay: null,
        address: null,
      },
      migrationOffers: null,
      currentStep: '',
      selectedOffer: null,
    };
    return migrationProcess;
  };

  /* -----  End of INITIALIZATION  ------*/
}
