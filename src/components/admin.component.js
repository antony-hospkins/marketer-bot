class AdminComponent {
  constructor() {
    // ...
  }

  getAdminUsername() {}

  getUserProgress(progress) {
    // { username, stages: [ { title: '', status: 'done | pending | coming' } ] }
    // done "✅"
    // pending "⏳"
    // coming "🟡"
  }
}
