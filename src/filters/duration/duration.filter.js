import isFinite from 'lodash/isFinite';
import moment from 'moment';

export default /* @ngInject */ $filter => function (seconds) {
  if (isFinite(seconds)) {
    return $filter('date')(moment.unix(seconds).toDate(), 'HH:mm:ss', 'UTC');
  }
  return '-';
};
