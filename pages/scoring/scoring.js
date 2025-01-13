// pages/scoring/scoring.js
const app = getApp();
const db = wx.cloud.database();
Page({
  data: {
    circle: 0,
    users: [],
    roomId: '',
    hasCircle: false,
    selectedResults: {},
    maxNameLength: 6
  },

  onLoad: function (options) {
    let roomId = options.roomId;
    this.setData({
      roomId
    });
    this.getCircle(roomId);
    this.getUsers(roomId);
  },

  async getCircle(roomId) {
    try {
      const res = await db.collection('records').where({ roomId:roomId }).get();
      const circle = res.data.length;
      if (circle === 0) {
        this.setData({
          circle: 0,
          hasCircle: false
        });
      } else {
        this.setData({
          circle: circle,
          hasCircle: true
        });
      }
    } catch (err) {
      console.error('Error fetching circle:', err);
    }
  },

  async getUsers(roomId) {
    try {
      const res = await db.collection('rooms').where({roomId:roomId}).get();
      const users = res.data;
      users.sort((a,b)=>{
        if(a.usertype === '-1' && b.usertype !== '-1'){
          return 1;
        }
        if(a.usertype !=='-1' && b.usertype === '-1'){
          return -1;
        }
      });
      this.setData({
        users
      });
      const processedusers = users.map(user=>({
        ...user,
        displayUsername:this.truncateUsername(user.username),
        score:'',
        result:'win'
      }));
      this.setData({
        users:processedusers
      });
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  },
  truncateUsername: function (username) {
    const maxLength = this.data.maxNameLength;
    if (username.length > maxLength) {
      return username.slice(0, maxLength) + '...';
    }
    return username;
  },
  onRadioChange: function(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.key;
    const users = this.data.users;
    const user = this.data.users[index];
    const selectedResults = this.data.selectedResults;
    console.log(index)
    users[index].result = e.detail.key;
    if (value === 'win') {
      user.resultColor = 'win-color'; // 设置胜的颜色类
      selectedResults[user.userid].result = 'win';
    } else if (value === 'lose') {
      user.resultColor = 'lose-color'; // 设置负的颜色类
      selectedResults[user.userid].result = 'lose';
    }
    this.setData({
      users: users,
      selectedResults: selectedResults
    });
  },
  onScoreChange: function (e) {
    const index = e.currentTarget.dataset.index;
    const users = this.data.users;
    users[index].score = e.detail.value;
    this.setData({
      users: users
    });//console.log(users)
  },
  onScoreInput: function (event) {
    const {index} = event.currentTarget.dataset;
    const value = event.detail.value;
    const users = this.data.users;
    const userIndex = users.findIndex(user => user.userid === index);
    //console.log(userIndex);
    //console.log(users)
    if (userIndex !== -1) {
      users[userIndex].score = value;
      this.setData({
        users: users
      });
      //console.log(this.data.users)
    }
  },
  onScoreFocus: function (event) {
    const { index } = event.currentTarget.dataset;
    const users = this.data.users;
    const userIndex = users.findIndex(user => user.userid === index);
    const hasScores = users.every((user, idx) => idx !== userIndex && user.score);
    console.log(hasScores)
    //console.log(users)
    if (hasScores) {// 最后一个输入框获取焦点时触发计算
      this.calculateData();
    }
  },

  calculateData: function () {
    const users = this.data.users;
    // 这里添加你的计算逻辑
    // 例如：根据胜负计算得分
    const totalScore = users.reduce((sum, user) => {
      const score = parseFloat(user.score) || 0;
      if (user.result === 'win') {
        return sum + score;
      } else {
        return sum - score;
      }
    }, 0);

    console.log('总分:', totalScore);

    // 更新页面上的相关数据
    this.setData({
      totalScore: totalScore
    });
  },

  onSubmit: async function () {
    const record = {
      roomId: this.data.roomId,
      circle: this.data.circle + 1,
      openid: this.data.users.map(user => user.openid),
      scores: this.data.users.map(user => parseInt(user.score)),
      createTime: new Date().getTime(),
      active: 1,
      status: this.data.hasCircle ? 1 : 0
    };

    try {
      await db.collection('records').add({ data: record });
      if (!this.data.hasCircle) {
        // 更新 rooms 表中所有参与该房间的游戏用户的状态
        await db.collection('rooms').doc(this.data.roomId).update({
          data: {
            users: this.data.users.map(user => ({ ...user, status: 1 }))
          }
        });
      }
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      });
    } catch (err) {
      console.error('Error submitting record:', err);
      wx.showToast({
        title: '提交失败',
        icon: 'none'
      });
    }
  },

  onCancel: function () {
    wx.navigateBack();
  }
});