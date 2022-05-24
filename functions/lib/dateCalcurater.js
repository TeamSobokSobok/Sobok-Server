const dayjs = require('dayjs');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
dayjs.extend(isSameOrBefore);

const termCalcurator = (start, end) => {
  const startDate = dayjs(start);
  const endDate = dayjs(end);

  return endDate.diff(startDate, 'd');
};

const dateCalcurator = (term, start, takeInterval, day, specific) => {
  let dateList = [];
  let convertWeek = [];
  let startDate = dayjs(start);
  const weekNumber = {
    일: 0,
    월: 1,
    화: 2,
    수: 3,
    목: 4,
    금: 5,
    토: 6,
  };

  // 약을 매일 복용할 때
  if (takeInterval === 1) {
    for (day = 0; day <= term; day++) {
      dateList.push(startDate.add(day, 'day').format('YYYY-MM-DD'));
    }
  }

  // 약을 특정 요일마다 복용할 때
  // ex) 월, 수, 금
  if (takeInterval === 2) {
    const week = day.split(', ');

    // 입력받은 요일 숫자로 변환
    for (let convert = 0; convert < week.length; convert++) {
      convertWeek.push(weekNumber[week[convert]]);
    }

    // 해당 요일만 날짜 추가
    for (day = 0; day <= term; day++) {
      if (convertWeek.includes(startDate.get('day'))) {
        dateList.push(startDate.format('YYYY-MM-DD'));
      }
      startDate = startDate.add(1, 'day');
    }
  }

  // 약을 특정 간격마다 복용할 때
  if (takeInterval === 3) {
    // 입력받은 숫자와 주기 분리
    const number = specific.substring(0, 1);
    const unit = specific.substring(1);
    let dayCount;

    if (unit === 'day') {
      dayCount = number;
    }

    if (unit === 'week') {
      dayCount = number * 7;
    }

    if (unit === 'month') {
      dayCount = number * 30;
    }

    const endDate = startDate.add(term, 'day');
    while (startDate.isSameOrBefore(endDate)) {
      dateList.push(startDate.format('YYYY-MM-DD'));
      startDate = startDate.add(dayCount, 'day');
    }
  }

  return dateList;
};

module.exports = {
  termCalcurator,
  dateCalcurator,
};
