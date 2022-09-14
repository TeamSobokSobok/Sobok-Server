module.exports = {
  NULL_VALUE: '필요한 값이 없습니다',
  OUT_OF_VALUE: '파라미터 값이 잘못되었습니다',
  NO_AUTHENTICATED: '접근 권한이 없습니다',
  DB_ERROR: '데이터베이스 오류',
  INTERNAL_SERVER_ERROR: '서버 내 오류',

  // 회원가입
  CREATED_USER: '회원 가입 성공',
  DELETE_USER: '회원 탈퇴 성공',
  ALREADY_EMAIL: '이미 사용중인 이메일입니다.',
  ALREADY_NICKNAME: '이미 사용중인 닉네임입니다.',
  USEABLE_NICKNAME: '사용 가능한 닉네임입니다.',
  ALREADY_SOCIALID: '이미 사용중인 소셜 아이디입니다. ',
  NOT_SIGNED_UP: '회원가입을 하지 않은 사용자입니다.',
  UPDATE_NICKNAME: '닉네임 변경 성공',

  // 로그인
  LOGIN_SUCCESS: '로그인 성공',
  LOGIN_FAIL: '로그인 실패',
  NO_USER: '존재하지 않는 회원입니다.',
  MISS_MATCH_PW: '비밀번호가 맞지 않습니다.',
  WRONG_USERNAME_CONVENTION: '닉네임 형식에 맞지 않습니다.',
  WRONG_EMAIL_CONVENTION: '이메일 형식에 맞지 않는 메일 주소입니다.',
  WRONG_PASSWORD_CONVENTION: '비밀번호 형식에 맞지 않는 메일 주소입니다.',
  LOGOUT_SUCCESS: '로그아웃 성공',

  // 유저
  READ_PILL_LIST: '약 리스트 조회 성공',
  READ_PILL: '약 상세조회 성공',
  READ_USER_INFO: '유저 정보 조회 성공',

  // 토큰
  TOKEN_EXPIRED: '토큰이 만료되었습니다.',
  TOKEN_INVALID: '토큰이 유효하지 않습니다.',
  TOKEN_EMPTY: '토큰이 없습니다.',

  // 그룹
  READ_ALL_GROUP: '그룹 정보 불러오기 성공',
  READ_USER_NAME: '유저 이름 불러오기 성공',
  UPDATE_MEMBER_NAME: '멤버 이름 수정 성공',
  CREATED_SEND_GROUP: '캘린더 공유 요청 성공',
  READ_GROUP_STATUS: '공유 상태 조회 성공',
  ALREADY_SEND_GROUP: '이미 캘린더 공유 요청이 되었습니다.',
  ALREADY_GROUP: '이미 캘린더가 공유된 상대입니다',
  UPDATE_SEND_GROUP: '캘린더 공유 수정 성공',
  ENABLE_SEND_GROUP: '자신에게 캘린더 공유 요청을 할 수 없습니다.',
  NO_MEMBER: '캘린더 공유가 되지 않은 상태입니다.',

  // 스케줄
  READ_MY_CALENDAR: '내 캘린더 조회 성공',
  READ_MY_SCHEDULE: '내 스케줄 조회 성공',
  READ_MEMBER_CALENDAR: '멤버 캘린더 조회 성공',
  READ_MEMBER_SCHEDULE: '멤버 약 스케줄 조회 성공',
  UPDATE_SCHEDULE_CHECK: '스케줄 체크 완료 성공',
  UPDATE_SCHEDULE_UNCHECK: '스케줄 체크 미완료 성공',

  // 약추가
  PILL_ADDITION_SUCCESS: '약 추가 성공',
  PILL_COUNT_OVER: '약 추가 가능 개수 초과',
  PILL_TRANSMIT_SUCCESS: '약 전송 성공',
  PILL_COUNT_SUCCESS: '약 복용 개수 조회',
  PILL_MODIFY_SUCCESS: '약 수정 성공',
  PILL_STOP_SUCCESS: '약 중단 성공',
  PILL_DELETE_SUCCESS: '약 삭제 성공',
  ALREADY_PILL_STOP: '이미 중단된 약입니다',
  NO_PILL: '존재하지 않는 약입니다',
  NO_PILL_SEND: '전송된 약이 존재하지 않습니다',

  // 알림
  NOTICE_GET_SUCCESS: '알림 리스트 조회 성공',
  PILL_GET_SUCCESS: '약 조회 성공',
  PILL_ACCEPT_SUCCESS: '약 받기 성공',
  PILL_REFUSE_SUCCESS: '약 거절 성공',
  PILL_UNAUTHORIZED: '해당 약에 권한이 없습니다',
  ALREADY_PILL_ACCEPT: '이미 처리된 약입니다.',
  WRONG_PILL_STATE: '잘못된 약 상태입니다.',

  // 스티커
  READ_ALL_STICKER: '스티커 전체 조회 성공',
  READ_ALL_SEND_STICKER: '전송받은 스티커 전체 조회 성공',
  CREATED_STICKER: '스티커 전송 성공',
  UPDATE_STICKER: '스티커 수정 성공',
  ENABLE_SEND_STICKER: '스티커를 전송할 수 없습니다.',
  ALREADY_SEND_STICKER: '이미 스티커를 전송했습니다.',
};
