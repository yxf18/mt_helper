/*
 * @Author: yxf
 * @Description: 权限判断
 * @FilePath: /mt_helper/main.js
 */
"ui";
importClass("android.content.pm.PackageManager");
importClass("android.provider.Settings");
const myPackageName = context.getPackageName();
ui.layout(
    <vertical h="*" margin="5 2">
        <text textColor="red" text="此脚本需要提前设置好收货地址和支付方式！！!"/>
        <Switch h="30" text="无障碍服务" id="autoService" checked="true" />
        <Switch h="30" text="悬浮窗" id="floatyPermission" checked="true" />
        <Switch h="30" text="前台服务" id="foregroundService" checked="true" />
        <button id="startBtn" text="立即运行"/>
    </vertical>
);

refreshState();
//可以在回到界面时，刷新开关状态
ui.emitter.on("resume", function () {
    refreshState();
});

function refreshState() {
    ui.autoService.checked = auto.service != null;
    ui.floatyPermission.checked = floaty.checkPermission();
    ui.foregroundService.checked = $settings.isEnabled("foreground_service");
}

ui.autoService.on("check", function (checked) {
    setAutoService(checked);
});

ui.floatyPermission.on("check", function (checked, view) {
    //这里演示下使用startActivityForResult
    if (checked) {
        //当开启开关时，这里建议设计成检查权限并在回调中判断权限，打开自己设计的悬浮窗
        if (floaty.checkPermission()) {
            toast("打开悬浮窗");
        } else {
            //没有权限时去打开悬浮窗5
            let mIntent = app.intent({
                action: "android.settings.action.MANAGE_OVERLAY_PERMISSION",
                data: "package:" + myPackageName,
            });
            //这里把数字1作为标记
            activity.startActivityForResult(mIntent, 1);
        }
    } else {
        //当关闭开关时，这里建议设计成关闭自己设计的悬浮窗，而不是悬浮窗权限
        if (view.isPressed()) {
            //这个判断是为了防止ui.floatyPermission.setChecked(false)引起的多余的监听
            toastLog("悬浮窗已关闭");
        }
    }
});

ui.foregroundService.on("check", function (checked) {
    //这个很简单，没啥讲的
    $settings.setEnabled("foreground_service", checked);
});

ui.startBtn.on("click", function() {
    if (ui.autoService.checked&&ui.floatyPermission.checked&&ui.foregroundService.checked) {
        engines.execScriptFile("./main2.0.js");
    }else{
        toastLog('请先开启所有权限')
    }
});
function setAutoService(checked) {
    if (checked) {
        if (checkPermission("android.permission.WRITE_SECURE_SETTINGS")) {
            openAccessibility();
        } else {
            if ($shell.checkAccess("adb")) {
                shell("pm grant " + myPackageName + " android.permission.WRITE_SECURE_SETTINGS", {
                    adb: true,
                });
                toastLog("adb授权成功");
                openAccessibility();
            } else {
                if ($shell.checkAccess("root")) {
                    shell("pm grant " + myPackageName + " android.permission.WRITE_SECURE_SETTINGS", {
                        root: true,
                    });
                    toastLog("root授权成功");
                    openAccessibility();
                } else {
                    console.info("\n也可使用WRITE_SECURE_SETTINGS权限开启无障碍服务\n授权代码已复制，使用adb激活");
                    setClip("adb shell pm grant " + myPackageName + " android.permission.WRITE_SECURE_SETTINGS");
                    app.startActivity({
                        action: "android.settings.ACCESSIBILITY_SETTINGS",
                    });
                }
            }
        }
    } else if (auto.service != null) {
        auto.service.disableSelf();
    }
}

function openAccessibility() {
    let mServices = ":" + myPackageName + "/com.stardust.autojs.core.accessibility.AccessibilityService";
    let enabledServices = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES).replace(new RegExp(mServices, "g"), "");
    Settings.Secure.putString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES, "");
    //Settings.Secure.putString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES, enabledServices);
    Settings.Secure.putString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES, enabledServices + mServices);
}

function checkPermission(permission) {
    pm = context.getPackageManager();
    return PackageManager.PERMISSION_GRANTED == pm.checkPermission(permission, context.getPackageName().toString());
}
function checkSystemService(service) {
    importClass(android.app.AppOpsManager);
    appOps = context.getSystemService(context.APP_OPS_SERVICE);
    mode = appOps.checkOpNoThrow("android:get_" + service, android.os.Process.myUid(), context.getPackageName());
    return (granted = mode == AppOpsManager.MODE_ALLOWED);
}
function checkMiuiPermission(flag) {
    //flag为10021是后台弹出界面,为10016是NFC权限
    importClass(android.app.AppOpsManager);
    let appOps = context.getSystemService(context.APP_OPS_SERVICE);
    try {
        let myClass = util.java.array("java.lang.Class", 3);
        myClass[0] = java.lang.Integer.TYPE;
        myClass[1] = java.lang.Integer.TYPE;
        myClass[2] = java.lang.Class.forName("java.lang.String");
        let method = appOps.getClass().getMethod("checkOpNoThrow", myClass);
        let op = new java.lang.Integer(flag);
        result = method.invoke(appOps, op, new java.lang.Integer(android.os.Process.myUid()), context.getPackageName());
        return result == AppOpsManager.MODE_ALLOWED;
    } catch (err) {
        console.error(err);
    }
}