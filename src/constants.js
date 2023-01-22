const admin = {};
const user = {};

const constants = {
  steps: {
    START_BOT: "START_BOT",
    ADAPTATION_CONTENT: "ADAPTATION_CONTENT",
    HOW_WE_WORK: "HOW_WE_WORK",
    ABOUT_THE_PLATFORM: "ABOUT_THE_PLATFORM",
    STAGES_OF_WORK: "STAGES_OF_WORK",
    DISTRIBUTION_OF_PROFILES: "DISTRIBUTION_OF_PROFILES",
    ABOUT_COMMUNICATION: "ABOUT_COMMUNICATION",
    EXTRA_INFO_ABOUT_PLATFORM: "EXTRA_INFO_ABOUT_PLATFORM",
    CONTRACT: "CONTRACT",
    // ...
    MAIN_MENU: "MAIN_MENU",
    GENERAL_STATISTICS: "GENERAL_STATISTICS",
    SEARCH_USER: "SEARCH_USER",
  },
  commands: {
    POST: "post",
  },
};

const buttons = {
  BACK_BUTTON: { text: "⬅️ Назад" },
  COMMON_STATISTICS: { text: "📊 Общая статистика" },
  ACTIVE_USERS: { text: "👥 Активные участники" },
  SEARCH_USER: { text: "🔍 Поиск участника" },
};

module.exports = { buttons, constants };
