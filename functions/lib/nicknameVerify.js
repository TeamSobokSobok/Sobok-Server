const nicknameVerify = (nickname) => {
  if (nickname.length > 10 || nickname.length === 0) {
    return true;
  }

  const regex = /[^a-zA-z0-9가-힣\s]/;
  return regex.test(nickname);
};

module.exports = {
  nicknameVerify,
};
