const axios = require("axios");
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

  async fetchUsers() {
    try {
      const { data } = await axios.get(`${this.url}/users.json`);
      const users = transformService.fbObjectToArray(data);
      return users;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new ApiService("https://marketer-bot-default-rtdb.firebaseio.com");
