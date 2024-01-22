/*
 * @Author: yxf
 * @Description: 美团买菜优化版
 * @FilePath: /mt_helper/main2.0.js
 */
const PSD = '0000';

events.on("exit", function () {
  console.error('[ 结束运行 ]', new Date().toLocaleString())
});

// 解锁手机屏幕
function unLock() {
  if (!device.isScreenOn()) {
    device.wakeUp(); // 唤醒屏幕
    swipe(500, 2000, 500, 1000, 201); // 滑动以唤出 输入密码界面
    const password = PSD; //这里换成自己的手机解锁密码
    for (let i = 0; i < password.length; i++) {
      let position = text(password[i]).findOne().bounds(); //找到数字对应的坐标
      click(position.centerX(), position.centerY()); //点击相应坐标
    }
  }
}

//抢菜流程
function robVeg() {
  unLock();
  sleep(500);
  launchApp("美团买菜");
  console.show();
  console.info('[ 启动美团买菜助手1.0.2 yxf ]', new Date().toLocaleString())
  waitForPackage("com.meituan.retail.v.android", 200);
  auto.waitFor(); // 确保开启无障碍服务，阻塞
  const btn_skip = text('跳过').findOne(1000);
  if (btn_skip) {
    btn_skip.parent().click();
    console.info("[ 已跳过首屏广告 ]");
  } else {
    console.verbose("[ 无首屏广告 ]");
  }
  sleep(2000);
  gotoBuyCar(); // 进入购物车
  sleep(1000);
  checkAll(); // 全选
  submitOrder(0); // 结算
}

robVeg();

//打开购物车页面
function gotoBuyCar() {
  const cartBtn = className('android.widget.RelativeLayout').find(3);
  // const cartBtn = bounds(648, 2161, 864, 2291).clickable(true);
  // const cartBtn = boundsContains(648,2161,864,2291).clickable(true);

  if (cartBtn) {
    cartBtn.click();
    console.info('[ 已进入购物车 ]')
  } else {
    console.error('[ 没找到购物车-error ]')
    exit();
  }
}

//勾选全部商品
function checkAll() {
  const isCheckedAll = textStartsWith("结算(").exists();
  if (text("全选").exists()) {
    // 如果没有全选，则点击全选按钮
    !isCheckedAll && click('全选');
  } else {
    console.error("没找到全选按钮");
    exit();
  }
}

function onSuccess() {
  console.info('[ 恭喜抢菜成功 ]')
  const music = "/storage/emulated/0/netease/cloudmusic/Music/赵紫骅 - 可乐.mp3";
  media.playMusic(music);
  sleep(media.getMusicDuration());
  exit();
}

function submitOrder(count) {
  click('结算');
  click('我知道了');
  if (click('极速支付')) {
    onSuccess()
  };

  sleep(500);
  if (count > 10000) {
    console.error("[ 抢菜1.4小时，没抢到, 结束抢菜。。。] ");
    exit();
  }
  submitOrder(++count);
}
