import angular from 'angular';
import CSV from 'CSV-JS';
import filter from 'lodash/filter';
import map from 'lodash/map';
import reduce from 'lodash/reduce';

export default /* @ngInject */ function (
  $scope,
  $q,
  $translate,
  $uibModalInstance,
  data,
  TUC_TELECOM_TELEPHONY_ABBREVIATED_NUMBERS_PAGINATION_PER_PAGE,
) {
  const self = this;

  function readerLoaded(e) {
    if (e.loaded > 50000) {
      // Over 50ko, stop to avoid browser crash
      self.errorLoading = $translate.instant('telephony_abbreviated_numbers_import_loading_oversize');
      $scope.$digest();
      return;
    }
    const csvDetectType = CSV.DETECT_TYPES;
    CSV.DETECT_TYPES = false;
    try {
      const csv = CSV.parse(e.target.result);
      self.sample = map(csv, (line) => {
        const abbrObj = {
          abbreviatedNumber: {
            value: line[0] || '???',
            isValid: self.pattern.regexp.test(line[0]),
          },
          destinationNumber: {
            value: line[1] || '???',
            isValid: self.numberPattern.test(line[1]),
          },
          name: {
            value: line[2] || '???',
            isValid: self.namePattern.test(line[2]),
          },
          surname: {
            value: line[3] || '???',
            isValid: self.namePattern.test(line[3]),
          },
        };
        abbrObj.isValid = reduce(
          Object.keys(abbrObj),
          (total, elt) => total && abbrObj[elt].isValid,
          true,
        );
        return abbrObj;
      });
      self.loading.getFile = false;
      self.canImport = true;
      $scope.$digest();
    } catch (err) {
      if (err) {
        self.errorLoading = $translate.instant('telephony_abbreviated_numbers_import_loading_bad_content');
      }
    }
    CSV.DETECT_TYPES = csvDetectType;
  }

  function readerError() {
    self.errorLoading = $translate.instant('telephony_abbreviated_numbers_import_loading_fatal');
    $scope.$digest();
  }

  function readerProgress(e) {
    self.total = e.total * 2; // keep half time to parse csv
    self.progress = e.loaded;
    $scope.$digest();
  }

  this.loading = {
    getFile: false,
    updating: false,
  };

  this.perPage = TUC_TELECOM_TELEPHONY_ABBREVIATED_NUMBERS_PAGINATION_PER_PAGE;

  angular.extend(this, data);

  this.numberPattern = /^00\d{2,3}[\s\d]+$/;
  this.namePattern = /^[a-zA-Z0-9\s]+$/;

  this.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };

  this.close = function () {
    $uibModalInstance.close(this.imported);
  };

  this.loadCsv = function (file) {
    self.total = 10000;
    self.progress = 0;
    self.canImport = false;
    self.loaded = [];
    self.sample = [];
    if (file) {
      delete this.errorLoading;
      if (/\.csv$/i.test(file.name)) {
        this.loading.getFile = true;
        const reader = new FileReader();
        reader.onloadend = readerLoaded;
        reader.onabort = readerError;
        reader.onerror = readerError;
        reader.onprogress = readerProgress;
        reader.onloadstart = readerProgress;
        reader.readAsText(file, 'UTF-8');
      } else {
        this.errorLoading = $translate.instant('telephony_abbreviated_numbers_import_loading_error');
      }
    } else {
      this.loading.getFile = false;
      delete self.errorLoading;
    }
  };

  this.send = function () {
    this.importing = true;
    this.imported = [];
    const validData = map(
      filter(this.sample, 'isValid'),
      elt => ({
        abbreviatedNumber: elt.abbreviatedNumber.value,
        destinationNumber: elt.destinationNumber.value,
        name: elt.name.value,
        surname: elt.surname.value,
      }),
    );
    this.total = validData.length;
    this.rejected = this.sample.length - this.total;
    this.progress = this.rejected;
    return $q.all(map(
      validData,
      elt => $q.when(self.saveCallback({ value: elt })).then(
        () => {
          self.imported.push(elt);
        },
        () => {
          self.rejected += 1;
        },
      ).finally(() => {
        self.progress += 1;
      }),
    )).finally(() => {
      self.done = true;
    });
  };
}
