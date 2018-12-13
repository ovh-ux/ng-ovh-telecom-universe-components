import angular from 'angular';
import moment from 'moment';

/**
 *  @ngdoc service
 *  @name managerApp.service:tucBankHolidays
 *
 *  @description
 *  <p>This service allow the manager to retrieve bank holidays date for countries which are
 *    defined into BANK_HOLIDAYS constants table.</p>
 */
export default class {
  /* @ngInject */
  constructor(BANK_HOLIDAYS) {
    this.BANK_HOLIDAYS = BANK_HOLIDAYS;
  }

  /* eslint-disable */
  /**
   *  Get the Easter day according to https://www.irt.org/articles/js052/index.htm
   */
  getEaster(Y) {
    const C = Math.floor(Y / 100);
    const N = Y - (19 * Math.floor(Y / 19));
    const K = Math.floor((C - 17) / 25);
    let I = C - Math.floor(C / 4) - Math.floor((C - K) / 3) + (19 * N) + 15;
    I -= (30 * Math.floor(I / 30));
    I -= (Math.floor(I / 28) * (1 - (Math.floor(I / 28) * Math.floor(29 / (I + 1)) * Math.floor((21 - N) / 11))));
    let J = Y + Math.floor(Y / 4) + I + 2 - C + Math.floor(C / 4);
    J -= (7 * Math.floor(J / 7));
    const L = I - J;
    const M = 3 + Math.floor((L + 40) / 44);
    const D = L + 28 - (31 * Math.floor(M / 4));

    return [Y, _.padLeft(M, 2, '0'), _.padLeft(D, 2, '0')].join('-');
  }
  /* eslint-enable */

  /**
   *  @ngdoc method
   *  @name managerApp.service:tucBankHolidays#getSpecialBankHoliday
   *  @methodOf managerApp.service:tucBankHolidays
   *
   *  @description
   *  Retrieve special bank holiday from easter day.
   *
   *  @param {String} bankDayName
   *  @param {Date} easterDay
   *  @param {Integer} year
   *
   *  @return date for special bank holiday
   */
  static getSpecialBankHoliday(bankDayName, easterDay, year) {
    switch (bankDayName) {
      case 'easter_monday':
        return moment(easterDay).add(1, 'day');
      case 'ascension_day':
        // ascension is 40 days after easter
        return moment(easterDay).add(39, 'day');
      case 'whit_monday':
        // whit sunday (Pentecost) is 50 days after easter
        return moment(easterDay).add(50, 'day');
      case 'good_friday':
        // friday before easter
        return moment(easterDay).subtract(2, 'day');
      case 'may_day':
        // The May Day bank holiday falls on the first Monday in May
        return moment().year(year).month(4).startOf('month')
          .startOf('isoWeek');
      case 'spring_bank_holiday':
        // last monday in May
        return moment().year(year).month(4).endOf('month')
          .startOf('isoWeek');
      case 'summer_bank_holiday':
        // last monday in August
        return moment().year(year).month(7).endOf('month')
          .startOf('isoWeek');
      default:
        return null;
    }
  }

  /**
   *  @ngdoc method
   *  @name managerApp.service:tucBankHolidays#getBankHolidays
   *  @methodOf managerApp.service:tucBankHolidays
   *
   *  @description
   *  Retrieve the list of bank holidays for a country and a year,
   *  calculated on an interval (start and end dates into the modalData.schelduler)
   *
   *  @param {String} country
   *  @param {Integer} year
   *  @param {Object} modalData  this modal contains a scheduler with categories,
   *                             start and end dates
   *
   *  @return list of bank holidays
   */
  getBankHolidays(country, year, modalData) {
    const countryBankHolidays = this.BANK_HOLIDAYS[country];
    const easterDayOfYear = this.getEaster(year);
    let bankHolidayDate;
    const holidaysList = [];

    angular.forEach(countryBankHolidays, (bankDay) => {
      bankHolidayDate = bankDay.date ? moment([year, bankDay.date].join('-'))
        : this.getSpecialBankHoliday(bankDay.name, easterDayOfYear, year);

      if (moment().subtract(1, 'day').isBefore(bankHolidayDate)) {
        const isBankHolidayInEventRange = modalData.scheduler.isEventInExistingRange({
          categories: 'holidays',
          dateStart: bankHolidayDate.toDate(),
          dateEnd: moment(bankHolidayDate).endOf('day').toDate(),
        });
        holidaysList.push({
          name: bankDay.name,
          date: bankHolidayDate,
          active: true,
          disabled: isBankHolidayInEventRange,
        });
      }
    });
    return holidaysList;
  }

  /**
   *  @ngdoc method
   *  @name managerApp.service:tucBankHolidays#checkIsBankHoliday
   *  @methodOf managerApp.service:tucBankHolidays
   *
   *  @description
   *  Check if the param date for a country is a bank holiday date.
   *
   *  @param {String} country
   *  @param {Date} dateToCheck
   *
   *  @return boolean
   */
  checkIsBankHoliday(country, dateToCheck) {
    const countryBankHolidays = this.BANK_HOLIDAYS[country];
    const year = dateToCheck.getFullYear();
    const easterDayOfYear = this.getEaster(year);
    let bankHolidayDate;

    let isBankHoliday = false;
    angular.forEach(countryBankHolidays, (bankDay) => {
      bankHolidayDate = bankDay.date ? moment([year, bankDay.date].join('-'))
        : this.getSpecialBankHoliday(bankDay.name, easterDayOfYear, year);

      if (bankHolidayDate.format('YYYY-MM-DD') === moment(dateToCheck).format('YYYY-MM-DD')) {
        isBankHoliday = true;
      }
    });
    return isBankHoliday;
  }
}
