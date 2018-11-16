import angular from 'angular';
import _ from 'lodash';

export default /* @ngInject */ function TucPackMediator($q, OvhApiPackXdsl, OvhApiXdsl) {
  const self = this;

  self.fetchLinesByIds = function (ids) {
    if (!angular.isArray(ids) || ids.length === 0) {
      return $q.when([]);
    }

    // chunkify to avoids "request too large" error
    return $q
      .all(_.map(_.chunk(ids, 200), chunkIds => OvhApiXdsl.Lines().v7()
        .query()
        .batch('serviceName', [''].concat(chunkIds), ',')
        .expand()
        .execute().$promise))
      .then(chunkResult => _.flatten(chunkResult)).then(result => _.flatten(result));
  };

  self.fetchPackAccessByIds = function (ids) {
    if (!angular.isArray(ids) || ids.length === 0) {
      return $q.when([]);
    }

    // chunkify to avoids "request too large" error
    return $q.all(_.map(_.chunk(ids, 200), chunkIds => OvhApiPackXdsl.v7().access().batch('packName', [''].concat(chunkIds), ',').execute().$promise)).then(chunkResult => _.flatten(chunkResult)).then(result => _.flatten(result));
  };

  self.fetchXdslByIds = function (ids) {
    if (!angular.isArray(ids) || ids.length === 0) {
      return $q.when([]);
    }

    // chunkify to avoids "request too large" error
    return $q
      .all(_.map(_.chunk(ids, 200), chunkIds => OvhApiXdsl.v7()
        .query()
        .batch('serviceName', [''].concat(chunkIds), ',')
        .expand()
        .execute().$promise))
      .then(chunkResult => _.flatten(chunkResult)).then(result => _.flatten(result));
  };

  self.fetchXdslByNumber = function () {
    return OvhApiXdsl.Lines().v7().get().aggregate('serviceName')
      .execute().$promise.then(result => self.fetchXdslByIds(_.map(result, (item) => {
        if (item && item.path) {
          const match = /\/xdsl\/([^/]+)/.exec(item.path);
          return match && match.length >= 2 ? match[1] : null;
        }
        return null;
      })));
  };

  self.fetchPacks = function () {
    const request = OvhApiPackXdsl.v7().query().sort(['description', 'offerDescription', 'packName']);
    let packList = [];
    return request.expand().execute().$promise.then((result) => {
      packList = _.pluck(result, 'value');
      angular.forEach(packList, (pack) => {
        _.set(pack, 'xdsl', []);
      });
    }).then(() => self.fetchPackAccessByIds(_.pluck(packList, 'packName')).then((result) => {
      angular.forEach(result, (access) => {
        if (access.path && angular.isArray(access.value)) {
          const match = /\/pack\/xdsl\/([^/]+)/.exec(access.path);
          const packId = match && match.length === 2 ? match[1] : null;
          const pack = _.find(packList, { packName: packId });
          if (pack) {
            pack.xdsl = pack.xdsl.concat(_.map(access.value, id => ({ accessName: id })));
          }
        }
      });
    })).then(() => {
      // fetch xdsl details of each xdsl
      const xdslIds = _.pluck(_.flatten(_.pluck(packList, 'xdsl')), 'accessName');
      return self.fetchXdslByIds(xdslIds).then((result) => {
        angular.forEach(result, (xdsl) => {
          angular.forEach(packList, (pack) => {
            const found = _.find(pack.xdsl, { accessName: xdsl.key });
            if (found) {
              _.assign(found, xdsl.value);
            }
          });
        });
      });
    }).then(() => {
      // fetch line of each xdsl
      const xdslIds = _.pluck(_.flatten(_.pluck(packList, 'xdsl')), 'accessName');
      return self.fetchLinesByIds(xdslIds).then((lines) => {
        angular.forEach(lines, (result) => {
          if (result.path) {
            const match = /\/xdsl\/([^/]+)/.exec(result.path);
            const xdslId = match && match.length === 2 ? match[1] : null;
            angular.forEach(packList, (pack) => {
              const found = _.find(pack.xdsl, { accessName: xdslId });
              if (found) {
                found.line = result.value;
              }
            });
          }
        });
      });
    })
      .then(() => packList);
  };

  self.fetchXdsl = function (xdslType) {
    const request = OvhApiXdsl.v7().query().addFilter('accessType', 'eq', xdslType).sort(['description', 'accessName']);
    let xdslList = [];
    return request.expand().execute().$promise.then((result) => {
      xdslList = xdslList.concat(_.pluck(result, 'value'));
    }).then(() => {
      angular.forEach(xdslList, (sdsl) => {
        _.set(sdsl, 'lines', []);
      });
      return self.fetchLinesByIds(_.pluck(xdslList, 'accessName')).then((lines) => {
        angular.forEach(lines, (result) => {
          if (result.path) {
            const match = /\/xdsl\/([^/]+)/.exec(result.path);
            const sdslId = match && match.length === 2 ? match[1] : null;
            const sdsl = _.find(xdslList, { accessName: sdslId });
            if (sdsl) {
              sdsl.lines.push(result.value);
            }
          }
        });
        return xdslList;
      });
    });
  };

  self.getPackStatus = function (packId) {
    return OvhApiPackXdsl.v6().getServiceInfos({
      packId,
    }).$promise.then(info => info.status).catch(() => 'error');
  };

  /*= ======================================
    =            SIDEBAR HELPERS            =
    ======================================= */

  self.getCount = function () {
    return $q.all({
      pack: OvhApiPackXdsl.v7().query().execute().$promise,
      xdsl: OvhApiXdsl.v7().query().addFilter('status', 'ne', 'deleting').execute().$promise,
    }).then(result => result.pack.length + result.xdsl.length);
  };
}
