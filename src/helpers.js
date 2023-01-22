const { Markup } = require("telegraf");

const renderButtons = (buttons) => {
  return Markup.inlineKeyboard(
    buttons.map((button) => {
      return [Markup.button.callback(button.title, button.id)];
    })
  );
};

const getUnixTime = (date) => {
  if (date) {
    return Math.floor(new Date(date) / 1000);
  }

  return Math.floor(Date.now() / 1000);
};

module.exports = { renderButtons, getUnixTime };
