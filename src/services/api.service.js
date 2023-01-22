const axios = require("axios");
const { getUnixTime } = require("../helpers");
const transformService = require("./transform.service");

class ApiService {
  constructor(baseUrl) {
    this.url = baseUrl;
  }

  async addUser(user) {
    try {
      const { data } = await axios.post(`${this.url}/users.json`, user);
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  async updateUser(id, user) {
    try {
      const { data } = await axios.patch(`${this.url}/users/${id}.json`, user);
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  async fetchUsers() {
    try {
      const { data } = await axios.get(`${this.url}/users.json`);
      const users = transformService.fbObjectToArray(data ?? {});
      return users;
    } catch (error) {
      console.log(error);
    }
  }

  async fetchUsersByPeriod(start, end) {
    const UNIX_ONE_DAY = 86399;
    const users = await this.fetchUsers();
    // Temp we filter users in front, but later it will filter in backend by params (start, end)
    // TODO: Temp
    const passing = users?.filter((u) => {
      return (
        u?.started_at >= start &&
        u?.started_at <= end + UNIX_ONE_DAY &&
        u?.stages?.some((s) => s?.status === "pending")
      );
    });

    // ...
    const passedSuccessfully = users.filter(
      (u) => u?.finished_at && u?.started_at >= start && u?.started_at <= end + UNIX_ONE_DAY
    );

    // ...
    const passedUnsuccessfully = users.filter((u) => u?.started_at < getUnixTime() - 1209600);

    return {
      passing: passing.length,
      passedSuccessfully: passedSuccessfully.length,
      passedUnsuccessfully: passedUnsuccessfully.length,
    };
  }

  async fetchUserByUsername(username) {
    // Temp we filter users in front, but later it will filter in backend by params (username)
    // TODO: Temp
    try {
      const users = await this.fetchUsers();
      return users?.find((u) => u?.username === username);
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new ApiService("https://marketer-bot-default-rtdb.firebaseio.com");
