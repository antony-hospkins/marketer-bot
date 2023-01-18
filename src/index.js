require("dotenv").config();
const { Telegraf } = require("telegraf");
const constants = require("./constants");
const renderButtons = require("./helpers");
const { userMessages } = require("./content");
const gsService = require("./services/gs.service");
const LocalSession = require("telegraf-session-local");
const apiService = require("./services/api.service.js");

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(new LocalSession({ database: "session.json" }).middleware());

bot.start(async (ctx) => {
  const { from } = ctx.message;
  const isPermissions = await gsService.checkPermissions(from?.id);

  if (isPermissions) {
    return ctx.reply("Что-бы воспользоваться меню администратора введите комманду /menu");
  } else {
    ctx.session.current_step = constants.steps.START_BOT;
    ctx.session.userData = {
      id: from?.id,
      username: from?.username,
      stages: {
        0: { title: "Бот запущен коммандой /start", status: "pending" },
        1: { title: "Короткое содержание", status: "coming" },
        4: { title: "Как мы работаем", status: "coming" },
        5: { title: "Рабочий контент", status: "coming" },
      },
    };

    ctx.reply(userMessages?.[0]?.message);
    // const data = await apiService.addUser(ctx.session.userData);
    return;
  }
});

bot.command("menu", (ctx) => {
  bot.telegram.sendMessage(ctx.chat.id, "Вы находитесь в главном меню администратора", {
    reply_markup: {
      keyboard: [[{ text: "Пользователи" }, { text: "Статистика" }]],
      resize_keyboard: true,
      // one_time_keyboard: true,
    },
  });
});

bot.hears("Пользователи", (ctx) => {
  ctx.reply("heeey");
});

bot.hears("Статистика", (ctx) => {
  bot.telegram.sendMessage(ctx.chat.id, "Выберите какая статистика Вас интересует", {
    reply_markup: {
      keyboard: [[{ text: "Найти стажера" }, { text: "Получить статистику" }], [{ text: "Назад" }]],
      resize_keyboard: true,
      // one_time_keyboard: true,
    },
  });
});

bot.on("message", async (ctx) => {
  // const stages = ["START_BOT", "ADAPTATION_CONTENT", "HOW_WE_WORK", ""];

  if (ctx.session.current_step === constants.steps.START_BOT) {
    // ctx.session.userData.platform_username = ctx.update.message.text;
    ctx.session.current_step = constants.steps.ADAPTATION_CONTENT;

    return ctx.reply(
      userMessages?.[1]?.message,
      renderButtons([{ title: "Далее", id: "next-button" }])
    );
  }

  // ...

  if (ctx.session.current_step === constants.steps.ABOUT_THE_PLATFORM) {
    if (ctx?.update?.message?.photo) {
      ctx.session.current_step = constants.steps.STAGES_OF_WORK;
      // ctx.session.userData.selected_lesson = id;

      return ctx.reply(
        userMessages?.[4]?.message,
        renderButtons([{ title: "Далее", id: "next-button" }])
      );
    } else {
      return ctx.reply("Пожалуйста, отправь скриншот личного кабинета на платформе");
    }
  }
});

const onClickButton = (id) => {
  bot.action(id, async (ctx) => {
    await ctx.answerCbQuery();

    try {
      if (ctx.session.current_step === constants.steps.ADAPTATION_CONTENT) {
        ctx.session.current_step = constants.steps.HOW_WE_WORK;
        // ctx.session.userData.selected_block = id;

        return ctx.reply(
          userMessages?.[2]?.message,
          renderButtons([{ title: "Далее", id: "next-button" }])
        );
      }

      if (ctx.session.current_step === constants.steps.HOW_WE_WORK) {
        ctx.session.current_step = constants.steps.ABOUT_THE_PLATFORM;
        // ctx.session.userData.selected_lesson = id;

        return ctx.reply(userMessages?.[3]?.message);
      }

      if (ctx.session.current_step === constants.steps.STAGES_OF_WORK) {
        ctx.session.current_step = constants.steps.DISTRIBUTION_OF_PROFILES;
        // ctx.session.userData.selected_lesson = id;

        return ctx.reply(
          userMessages?.[5]?.message,
          renderButtons([{ title: "Далее", id: "next-button" }])
        );
      }

      if (ctx.session.current_step === constants.steps.DISTRIBUTION_OF_PROFILES) {
        ctx.session.current_step = constants.steps.ABOUT_COMMUNICATION;
        // ctx.session.userData.selected_lesson = id;

        return ctx.reply(
          userMessages?.[6]?.message,
          renderButtons([{ title: "Далее", id: "next-button" }])
        );
      }

      if (ctx.session.current_step === constants.steps.ABOUT_COMMUNICATION) {
        ctx.session.current_step = constants.steps.EXTRA_INFO_ABOUT_PLATFORM;
        // ctx.session.userData.selected_lesson = id;

        return ctx.replyWithHTML(
          userMessages?.[7]?.message,
          renderButtons([{ title: "Далее", id: "next-button" }])
        );
      }

      if (ctx.session.current_step === constants.steps.EXTRA_INFO_ABOUT_PLATFORM) {
        ctx.session.current_step = constants.steps.CONTRACT;
        // ctx.session.userData.selected_lesson = id;

        return ctx.replyWithHTML(
          userMessages?.[8]?.message
          // renderButtons([{ title: "Готов приступать", id: "ready-button" }])
        );
      }
      // ============================
      if (ctx.session.current_step === constants.steps.START_BOT && id === "users-list") {
        const data = await apiService.fetchUsers();

        let message = ``;

        data.forEach((user) => {
          message = `${message} \n\n Пользователь @${user?.username}

Прогресс:
${user?.stages
  ?.map((stage) => stage?.title && ` - ${stage?.title}\n`)
  .join("")
  .split(",")}`;
        });

        ctx.reply(message);
      }
    } catch (error) {
      // ...
    }
  });
};

[{ title: "Далее", id: "next-button" }].forEach((button) => onClickButton(button.id));
// ...
[{ title: "Готов", id: "ready-button" }].forEach((button) => onClickButton(button.id));

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
