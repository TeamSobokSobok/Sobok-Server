const dayjs = require('dayjs');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
dayjs.extend(isSameOrBefore);

const dateCalcurator = (start, end, day) => {
  let startDate = dayjs(start);
  const endDate = dayjs(end);
  let dayList = [];
  let dateList = [];

  const daySplit = day.split(', ');
  // 입력받은 요일 숫자로 변경
  daySplit.forEach((element) => {
    if (element === '일') dayList.push(0);
    if (element === '월') dayList.push(1);
    if (element === '화') dayList.push(2);
    if (element === '수') dayList.push(3);
    if (element === '목') dayList.push(4);
    if (element === '금') dayList.push(5);
    if (element === '토') dayList.push(6);
  });

  while (startDate.isSameOrBefore(endDate)) {
    if (dayList.includes(startDate.get('d'))) {
      dateList.push(startDate);
    }

    startDate = startDate.add(1, 'day');
  }

  return dateList;
};

module.exports = {
  dateCalcurator,
};
