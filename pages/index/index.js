// index.js
const app = getApp()
const { envList } = require('../../envList.js');

Page({
  data: {
    userInfo: null,
    defaultImage: '/images/default.jpg',
    userInfoss:null,
    fileID:null
  },
  onLoad(options) {
    this.checkAuth();
  },
  checkAuth() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          this.getUserInfo();
        };
      }
    });
  },
  checkUserInDatabase(userInfo) {
    const db = wx.cloud.database();
    db.collection('userlist').where({
      openId: userInfo.openId // 假设 userInfo 包含 openId 字段
    }).get({
      success: (res) => {
        if (res.data.length === 0) {
          // 用户不存在，插入用户信息
          this.insertUserInfo(userInfo);
        } else {
          
        }
      },
      fail: (err) => {
        console.error('检查用户信息失败', err);
        wx.showToast({
          title: '检查用户信息失败',
          icon: 'none'
        });
      }
    });
  },
  insertUserInfo(userInfo) {
    const db = wx.cloud.database();
    db.collection('userlist').add({
      data: userInfo,
      success: (res) => {
        console.log('用户信息插入成功', res);
        wx.showToast({
          title: '用户信息保存成功',
          icon: 'none'
        });
      },
      fail: (err) => {
        console.error('用户信息插入失败', err);
        wx.showToast({
          title: '用户信息保存失败',
          icon: 'none'
        });
      }
    });
  },
  // upld(){
  //   let roomId = this.generateRoomId();
  //   let userInfo = app.globalData.userInfo;
  //   let createTime = new Date();
  //   wx.cloud.callFunction({
  //     name:'qrcode',
  //     data:{
  //       path:'pages/joinroom/joinroom?roomid='+roomId,
  //       roomId:roomId
  //     }
  //   }).then((res)=>{
  //     console.log(res)
  //   });

  // },
  createRoom(){
    wx.cloud.callFunction({
      name:'createroom',
      data:{
        path:"pages/joinroom/joinroom"
      }
    }).then(res=>{
      const roomId = res.result.room.roomId;
      wx.navigateTo({
        url: '/pages/room/room?roomId='+roomId,
      })
    }).catch(res=>{
      wx.showToast({
        title: '房间二维码生成失败',
        icon:'none'
      });
    });
  },
  
  // 加入房间函数
joinRoom(roomId) {
    // 获取当前用户信息
    const userInfo = app.globalData.userInfo;
    // 将用户信息存储到数据库
    // 这里使用云开发的数据库操作示例，具体操作请根据实际情况进行修改
    const db = wx.cloud.database();
    db.collection('rooms').doc(roomId).update({
      data: {
        user: userInfo
      },
      success(res) {
        console.log('加入房间成功');
      },
      fail(err) {
        console.error('加入房间失败', err);
      }
    });
  },
  generateRoomId(){
    return Date.now()+Math.random().toString(36).substr(2,8);
  },
  getUserInfo() {
    wx.login({
      success: (res) => {
        if (res.code) {
          wx.getUserInfo({
            success: (res) => {
              const userInfo = res.userInfo;
              this.setData({
                userInfo: userInfo
              });
              this.checkUserInDatabase(userInfo);
            }
          });
        }
      }
    });
  },
  onLogin(e) {
    if (e.detail.userInfo) {
      this.getUserInfo();
    }
  }
});
