require("dotenv").config();
const { Telegraf } = require("telegraf");
const moment = require("moment");
const { constants, buttons } = require("./constants");
const { renderButtons, getUnixTime } = require("./helpers");
const { userMessages } = require("./content");
const gsService = require("./services/gs.service");
const LocalSession = require("telegraf-session-local");
const apiService = require("./services/api.service.js");

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(new LocalSession({ database: "session.json" }).middleware());

bot.start(async (ctx) => {
  const { from } = ctx.message;
  const isPermissions = await gsService.checkPermissions(from?.id);
  // const dayOfTheStatistics = moment().endOf("month").format("YYYY.MM.DD");

  // const dayOfTheStatisticsUnix = getUnixTime(dayOfTheStatistics) + 86400;
  // const currentDayUnix = getUnixTime();

  // const sendStatisticsIn = dayOfTheStatisticsUnix - currentDayUnix;

  if (isPermissions) {
    // setTimeout(() => {
    //   // it will send in the first day of the month (00:00:00)
    //   ctx.reply("Отчёт за ");
    // }, sendStatisticsIn);

    // return ctx.reply("Что-бы воспользоваться меню администратора введите комманду /menu");
    const chatId = ctx.chat.id;
    ctx.session.current_step = constants.steps.MAIN_MENU;
    bot.telegram.sendMessage(chatId, "Вы находитесь в главном меню администратора", {
      reply_markup: {
        keyboard: [[buttons.COMMON_STATISTICS, buttons.ACTIVE_USERS], [buttons.SEARCH_USER]],
        resize_keyboard: true,
      },
    });
  } else {
    ctx.session.current_step = constants.steps.START_BOT;

    ctx.reply(userMessages?.[0]?.message);

    const user = await apiService.fetchUserByUsername(from?.username);
    const isExist = user?.id;

    if (!isExist) {
      ctx.session.userData = {
        id: from?.id,
        username: from?.username,
        started_at: getUnixTime(),
        stages: {
          0: { title: "Бот запущен коммандой /start", status: "pending" },
          1: { title: "Короткое содержание", status: "coming" },
          2: { title: "Как мы работаем", status: "coming" },
          3: { title: "Рабочий контент", status: "coming" },
          4: { title: "Начало сотрудничества", status: "coming" },
          5: { title: "Правила передачи аккаунтов", status: "coming" },
          6: { title: "О коммуникации", status: "coming" },
          7: { title: "Детальная инструкция по работе на платформе", status: "coming" },
          8: { title: "Контракт", status: "coming" },
        },
      };

      const data = await apiService.addUser(ctx.session.userData);

      ctx.session.userData = {
        ...ctx.session.userData,
        fbId: data?.name,
      };
    }

    return;
  }
});

bot.on("message", async (ctx) => {
  const chatId = ctx.chat.id;
  // for menu ------------------------
  if (ctx?.update?.message?.text === "⬅️ Назад") {
    ctx.session.current_step = constants.steps.MAIN_MENU;

    return bot.telegram.sendMessage(chatId, "Вы находитесь в главном меню администратора", {
      reply_markup: {
        keyboard: [[buttons.COMMON_STATISTICS, buttons.ACTIVE_USERS], [buttons.SEARCH_USER]],
        resize_keyboard: true,
      },
    });
  }

  if (ctx.session.current_step === constants.steps.MAIN_MENU) {
    switch (ctx?.update?.message?.text) {
      case "📊 Общая статистика": {
        ctx.session.current_step = constants.steps.GENERAL_STATISTICS;

        return bot.telegram.sendMessage(
          chatId,
          "Введите период за который хотите получить статистику в формате ДД.ММ.ГГГГ - ДД.ММ.ГГГГ",
          {
            reply_markup: {
              keyboard: [[buttons.BACK_BUTTON]],
              resize_keyboard: true,
            },
          }
        );
      }
      case "👥 Активные участники": {
        await ctx.replyWithHTML(
          "Список участников которые проходят адаптацию: \n\n<i>(Запустили бота не более 2х недель назад)</i>"
        );

        const data = await apiService.fetchUsers();

        await ctx.replyWithHTML(
          data
            ?.map(
              (i) =>
                `<b>Маркетолог @${
                  i?.username
                }</b>\n\n<i>Прогресс по прохождению бота:</i>\n${i?.stages
                  ?.map(
                    (s) =>
                      ` - ${s.title} ${s?.status === "done" ? "✅" : ""}${
                        s?.status === "pending" ? "⏳" : ""
                      }${s?.status === "coming" ? "🟡" : ""}\n`
                  )
                  .join("")}\n`
            )
            .join("")
        );
        return;
      }
      case "🔍 Поиск участника": {
        ctx.session.current_step = constants.steps.SEARCH_USER;

        return bot.telegram.sendMessage(
          chatId,
          "Введите username участника которого хотите найти",
          {
            reply_markup: {
              keyboard: [[buttons.BACK_BUTTON]],
              resize_keyboard: true,
            },
          }
        );
      }
    }
  }

  // ---------------------------------
  if (ctx.session.current_step === constants.steps.GENERAL_STATISTICS) {
    const [start, end] = ctx?.update?.message?.text.split("-")?.map((i) => i.trim());

    if (start && end) {
      const startUnixTime = getUnixTime(start.split(".").reverse());
      const endUnixTime = getUnixTime(end.split(".").reverse());

      const { passing, passedSuccessfully, passedUnsuccessfully } =
        await apiService.fetchUsersByPeriod(startUnixTime, endUnixTime);

      ctx.session.current_step = constants.steps.MAIN_MENU;
      return ctx.reply(`Период: ${ctx?.update?.message?.text}

${passing} - в процессе прохождения бота
${passedSuccessfully} - успешно прошли бота
${passedUnsuccessfully} - не прошли бота`);
    } else {
      return ctx.reply(
        `Вы вводите некорректный период!\n\nВведите период в формате ДД.ММ.ГГГГ - ДД.ММ.ГГГГ`
      );
    }
  }

  if (ctx.session.current_step === constants.steps.SEARCH_USER) {
    const username = ctx?.update?.message?.text;
    const user = await apiService.fetchUserByUsername(username);

    if (user) {
      ctx.session.current_step = constants.steps.MAIN_MENU;
      return ctx.reply(
        `Маркетолог @${user?.username}\n\nЗапустил бота коммандой /start ${new Date(
          user?.started_at * 1000
        ).toLocaleString()}`
      );
    } else {
      return ctx.reply(`Такой пользователь не проходил/проходит бота`);
    }
  }

  // ---------------------------------
  if (ctx.session.current_step === constants.steps.START_BOT) {
    const { fbId, stages } = ctx.session.userData;

    if (fbId) {
      apiService.updateUser(fbId, {
        stages: {
          ...stages,
          0: { ...stages["0"], status: "done" },
          1: { ...stages["1"], status: "pending" },
        },
      });
    }

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

      const { fbId, stages } = ctx.session.userData;
      if (fbId) {
        apiService.updateUser(fbId, {
          stages: {
            ...stages,
            0: { ...stages["0"], status: "done" },
            1: { ...stages["1"], status: "done" },
            2: { ...stages["2"], status: "done" },
            3: { ...stages["3"], status: "done" },
            4: { ...stages["4"], status: "pending" },
          },
        });
      }

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

        const { fbId, stages } = ctx.session.userData;
        if (fbId) {
          apiService.updateUser(fbId, {
            stages: {
              ...stages,
              0: { ...stages["0"], status: "done" },
              1: { ...stages["1"], status: "done" },
              2: { ...stages["2"], status: "pending" },
            },
          });
        }

        return ctx.reply(
          userMessages?.[2]?.message,
          renderButtons([{ title: "Далее", id: "next-button" }])
        );
      }

      if (ctx.session.current_step === constants.steps.HOW_WE_WORK) {
        ctx.session.current_step = constants.steps.ABOUT_THE_PLATFORM;

        const { fbId, stages } = ctx.session.userData;

        if (fbId) {
          apiService.updateUser(fbId, {
            stages: {
              ...stages,
              0: { ...stages["0"], status: "done" },
              1: { ...stages["1"], status: "done" },
              2: { ...stages["2"], status: "done" },
              3: { ...stages["3"], status: "pending" },
            },
          });
        }

        return ctx.reply(userMessages?.[3]?.message);
      }

      if (ctx.session.current_step === constants.steps.STAGES_OF_WORK) {
        ctx.session.current_step = constants.steps.DISTRIBUTION_OF_PROFILES;

        const { fbId, stages } = ctx.session.userData;

        if (fbId) {
          apiService.updateUser(fbId, {
            stages: {
              ...stages,
              0: { ...stages["0"], status: "done" },
              1: { ...stages["1"], status: "done" },
              2: { ...stages["2"], status: "done" },
              3: { ...stages["3"], status: "done" },
              4: { ...stages["4"], status: "done" },
              5: { ...stages["5"], status: "pending" },
            },
          });
        }

        return ctx.reply(
          userMessages?.[5]?.message,
          renderButtons([{ title: "Далее", id: "next-button" }])
        );
      }

      if (ctx.session.current_step === constants.steps.DISTRIBUTION_OF_PROFILES) {
        ctx.session.current_step = constants.steps.ABOUT_COMMUNICATION;

        const { fbId, stages } = ctx.session.userData;

        if (fbId) {
          apiService.updateUser(fbId, {
            stages: {
              ...stages,
              0: { ...stages["0"], status: "done" },
              1: { ...stages["1"], status: "done" },
              2: { ...stages["2"], status: "done" },
              3: { ...stages["3"], status: "done" },
              4: { ...stages["4"], status: "done" },
              5: { ...stages["5"], status: "done" },
              6: { ...stages["6"], status: "pending" },
            },
          });
        }

        return ctx.reply(
          userMessages?.[6]?.message,
          renderButtons([{ title: "Далее", id: "next-button" }])
        );
      }

      if (ctx.session.current_step === constants.steps.ABOUT_COMMUNICATION) {
        ctx.session.current_step = constants.steps.EXTRA_INFO_ABOUT_PLATFORM;

        const { fbId, stages } = ctx.session.userData;

        if (fbId) {
          apiService.updateUser(fbId, {
            stages: {
              ...stages,
              0: { ...stages["0"], status: "done" },
              1: { ...stages["1"], status: "done" },
              2: { ...stages["2"], status: "done" },
              3: { ...stages["3"], status: "done" },
              4: { ...stages["4"], status: "done" },
              5: { ...stages["5"], status: "done" },
              6: { ...stages["6"], status: "done" },
              7: { ...stages["7"], status: "pending" },
            },
          });
        }

        return ctx.replyWithHTML(
          userMessages?.[7]?.message,
          renderButtons([{ title: "Далее", id: "next-button" }])
        );
      }

      if (ctx.session.current_step === constants.steps.EXTRA_INFO_ABOUT_PLATFORM) {
        ctx.session.current_step = constants.steps.CONTRACT;

        const { fbId, stages } = ctx.session.userData;

        if (fbId) {
          apiService.updateUser(fbId, {
            stages: {
              ...stages,
              0: { ...stages["0"], status: "done" },
              1: { ...stages["1"], status: "done" },
              2: { ...stages["2"], status: "done" },
              3: { ...stages["3"], status: "done" },
              4: { ...stages["4"], status: "done" },
              5: { ...stages["5"], status: "done" },
              6: { ...stages["6"], status: "done" },
              7: { ...stages["7"], status: "done" },
              8: { ...stages["8"], status: "done" },
            },
          });
        }

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
