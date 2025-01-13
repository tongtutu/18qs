// pages/room/room.js
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    roomId:'',
    userList:'',
    circle:'null',
    showAddUserModal:false,
    defaultUserSwitch:false,
    newUser:{
      id:'',
      name:'',
      bgcolor:''
    },
    rooml:{
      createTime:'',
      roomId:'',
      status:'',
      fileId:''
    },
    _swicthvalue:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let roomId = options.roomId;
    this.setData({
      roomId
    });
    this.getRoomUsers(roomId);
    this.getCircle(roomId);
  },
  async getCircle(roomId){
    try{ 
      //console.log(roomId)
      const res = await db.collection('records').where({roomId:roomId,}).get();
      //console.log(res);
      const circle = res.data;
      if(circle.length>0){
        this.setData({
          circle,
          hasCircle:true
        });
      }else{
        this.setData({
          circle,
          hasCircle:false
        });
      }
    }catch(err){
    }
  },
  //数据库查询操作
  async getRoomUsers(roomId) {
    // 这里使用云开发的数据库操作示例，具体操作请根据实际情况进行修改
   try{ 
    //console.log(roomId)
    const res = await db.collection('rooms').where({roomId:roomId,}).get();
    //console.log(res);
    const userList = res.data;
    const rooml =res.data[0];
    this.setData({
      "rooml.createTime":rooml.createTime,
      "rooml.roomId":rooml.roomId,
      "rooml.fileId":rooml.fileID,
      "rooml.status":0
    });
    userList.sort((a,b)=>{
      if(a.usertype === '-1' && b.usertype !== '-1'){
        return 1;
      }
      if(a.usertype !=='-1' && b.usertype === '-1'){
        return -1;
      }
    });
    this.setData({
      userList
    });
  }catch(err){
  }
  const tbid=roomId.substr(10, 17);
  //console.log(this.data.userList);
    const exists = this.data.userList.some(userid => userid.userid && userid.userid === tbid);
    //console.log(exists);
    this.setData({
      defaultUserSwitch:exists
    });
  },


  //添加用户弹出层判断
  showAddUserModal() {
    this.setData({
      showAddUserModal: true
    });
  },
  closeAddUserModal() {
    this.setData({
      showAddUserModal: false
    });
  },
  inputUserName(event) {
    const name = event.detail.value;
    this.setData({
      'newUser.name': name
    });
  },
 // 添加新用户
 addUser() {
  const userid = Date.now().toString(36) + Math.random().toString(36).substring(2);
  const bgcolor = 'rgb('+Math.floor(Math.random() * 256)+','+Math.floor(Math.random() * 256)+ ',' +Math.floor(Math.random() * 256)+')';
  this.setData({
    "newUser.userid":userid,
    "newUser.bgcolor":bgcolor
  });
  const newUser = this.data.newUser;

  // 将新用户信息存储到数据库
  // 这里使用云开发的数据库操作示例，具体操作请根据实际情况进行修改
  db.collection('rooms').add({
    data: {
      createTime:this.data.rooml.createTime,
      fileID:this.data.rooml.fileId,
      roomId:this.data.rooml.roomId,
      status:this.data.rooml.status,
      userid:this.data.newUser.userid,
      userbgcolor:this.data.newUser.bgcolor,
      username:this.data.newUser.name,
      usertype:"0"
    },
    success: res => {
      //console.log('添加新用户成功');
      this.closeAddUserModal();
      this.getRoomUsers(this.data.roomId);
    },
    fail: err => {
      console.error('添加新用户失败', err);
    }
  });
},
 // 切换台板开关选项
 switchDefaultUser(event) {
  const value = event.detail.checked;
  this.setData({
    defaultUserSwitch: value
  });
  if (value) {
    // 加入台板
    this.joinDefaultUser();
  }else{
    //删除台板
    //console.log('删除台板')
    this.removeDefaultUser();
  }
},
// 加入台板
joinDefaultUser() {
// 获取当前用户信息
  const tbid=this.data.rooml.roomId.substr(10, 17);
  this.setData({
    "newUser.id":tbid,
    "newUser.name":'台',
    "newUser.bgcolor":'rgb(0,132,255)'
  })
  // 将用户信息添加到房间的用户数组中
  // 这里使用云开发的数据库操作示例，具体操作请根据实际情况进行修改
  const newUser = this.data.newUser;
  db.collection('rooms').add({
    data: {
      createTime:this.data.rooml.createTime,
      fileID:this.data.rooml.fileId,
      roomId:this.data.rooml.roomId,
      status:this.data.rooml.status,
      userid:this.data.newUser.id,
      userbgcolor:this.data.newUser.bgcolor,
      username:this.data.newUser.name,
      usertype:'-1'
          },
    success: res => {
      //console.log('加入默认用户成功');
      this.getRoomUsers(this.data.roomId);
    },
    fail: err => {
      console.error('加入默认用户失败', err);
    }
  });
},
//删除台板
async removeDefaultUser(){
  const _ = db.command;
  const targetUserId = this.data.rooml.roomId.substr(10, 17); // 目标用户 ID
    db.collection('rooms').where({
      "userid":targetUserId
    }).remove({
      success:res =>{
        // console.log(res)
        this.getRoomUsers(this.data.roomId);
      }
    });
},
  
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  async onReady() {
    const roomId=this.data.roomId;
    const fileId = 'cloud://qs18-7gbvrks1dfa10227.7173-qs18-7gbvrks1dfa10227-1322614343/qrcode/'+roomId+'.png'; // 云存储中的文件 ID
    // console.log(fileId);
    wx.cloud.getTempFileURL({
      fileList: [fileId],
      success: (res) => {
        const tempUrl = res.fileList[0].tempFileURL;
        this.setData({
          imageUrl: tempUrl
        });
       
      },
      fail: (err) => {
        console.error(err);
      }
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },
  /**
   * 计分函数，用于处理房间内的得分逻辑。
   * @function scoring
   */
  scoring(){
    const roomId = this.data.roomId;
    if (!roomId ) {
      console.error('Room ID is not set, cannot navigate to record page.');
      wx.showToast({
        title: '房间ID未设置',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    db.collection("rooms").where({
      roomId: roomId
    }).get().then(res => {
      const userList = res.data;
      if (userList.length < 2) {
        //console.error('Not enough users in the room, cannot navigate to scoring page.');
        wx.showToast({
          title: '至少需要2人',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      //console.log('Navigating to scoring page with roomId:', roomId);
      wx.navigateTo({
        url: '/pages/scoring/scoring?roomId=' + roomId,
      });
    }).catch(err => {
      //console.error('Error fetching users:', err);
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none',
        duration: 2000
      });
    });
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log('页面被卸载');
    this.removeRoomUsers();
  },
  async removeRoomUsers(){
    const _ = db.command;
    const roomId = this.data.roomId; // 目标用户 ID
      db.collection('rooms').where({
        "roomId":roomId,
        "status":0
      }).remove();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})