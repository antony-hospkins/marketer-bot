const { Markup } = require("telegraf");

module.exports = (buttons) => {
  return Markup.inlineKeyboard(
    buttons.map((button) => {
      return [Markup.button.callback(button.title, button.id)];
    })
  );
};
