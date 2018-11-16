export default /* @ngInject */ ($timeout, $q) => function (func, wait, immediate) {
  let timeout;
  let deferred = $q.defer();

  return function (...args) {
    const later = function () {
      timeout = null;
      if (!immediate) {
        deferred.resolve(func.apply(this, args));
        deferred = $q.defer();
      }
    };
    const callNow = immediate && !timeout;

    if (timeout) {
      $timeout.cancel(timeout);
    }
    timeout = $timeout(later, wait);

    if (callNow) {
      deferred.resolve(func.apply(this, args));
      deferred = $q.defer();
    }
    return deferred.promise;
  };
};
