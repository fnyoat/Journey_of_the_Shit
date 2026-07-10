//=============================================================================
// fnyoat_WindowForJOS.ts
//=============================================================================

/*:
 * @plugindesc 赤石之旅窗口
 * @author fnyoat
 *
 * @help 这个插件专为赤石之旅准备
 * 为赤石之旅提供游戏弹窗
 * 专供所以无插件命令
 * 
 */

Imported = Imported || {};
Imported.fnyoat_WindowForJOS = true;

window.fnyoat = window.fnyoat || {};
fnyoat.parameters = PluginManager.parameters('fnyoat_WindowForJOS');

//=============================================================================
// 游戏评价弹窗功能 - 使用PowerShell直接显示WinForms对话框
//=============================================================================

fnyoat.openGameRatingWindow = function(): Promise<boolean> {
    try {
        let win: any;
        let foundMethod = '';

        try {
            if (typeof nw !== 'undefined' && nw.Window) {
                win = nw.Window;
                foundMethod = 'nw.Window';
            } else if (window.nw && window.nw.Window) {
                win = window.nw.Window;
                foundMethod = 'window.nw.Window';
            } else {
                const gui = require('nw.gui');
                win = gui.Window;
                foundMethod = 'gui.Window';
            }
        } catch(e) {
            try {
                const gui = window.nw.gui;
                win = gui.Window;
                foundMethod = 'window.nw.gui.Window';
            } catch(e2) {
                throw new Error('无法找到Window API: ' + (e as Error).message + ', ' + (e2 as Error).message);
            }
        }

        console.log('使用窗口API: ' + foundMethod);

        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const windowWidth = 320;
        const windowHeight = 210;

        const ratingWindow = win.open('about:blank', {
            title: '游戏评价问卷',
            width: windowWidth,
            height: windowHeight,
            x: Math.floor((screenWidth - windowWidth) / 2),
            y: Math.floor((screenHeight - windowHeight) / 2),
            frame: false,
            resizable: false,
            always_on_top: true,
            show: false
        });

        if (!ratingWindow) {
            throw new Error('窗口创建失败，返回值为空');
        }

        return new Promise(function(resolve, reject) {
            ratingWindow.on('loaded', function() {
                const winDocument = ratingWindow.window.document;

                winDocument.body.style.margin = '0';
                winDocument.body.style.padding = '0';
                winDocument.body.style.fontFamily = '"Microsoft YaHei", sans-serif';
                winDocument.body.style.backgroundColor = '#f0f0f0';
                winDocument.body.style.overflow = 'hidden';
                winDocument.body.style.userSelect = 'none';

                winDocument.body.innerHTML = `
<div style="background: linear-gradient(180deg, #e0e0e0 0%, #c0c0c0 100%); height: 30px; display: flex; align-items: center; padding: 0 8px; border-bottom: 1px solid #999; cursor: move; -webkit-app-region: drag;">
    <div style="width: 16px; height: 16px; margin-right: 6px; background: #f0a040; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">★</div>
    <div style="font-size: 12px; color: #333; flex: 1;">游戏评价问卷</div>
</div>
<div style="padding: 15px 20px;">
    <div style="font-size: 13px; color: #333; margin-bottom: 8px;">请评价您对本游戏的期望</div>
    <div style="font-size: 11px; color: #888; margin-bottom: 15px;">0 = 最低评价  ·  10 = 最高评价</div>
    <input type="text" id="ratingInput" value="5" style="width: 100%; box-sizing: border-box; height: 28px; text-align: center; font-size: 14px; border: 1px solid #999; border-radius: 2px; margin-bottom: 20px;" />
    <div style="display: flex; justify-content: center; gap: 20px;">
        <button id="okBtn" style="width: 75px; height: 30px; background: linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 50%, #d0d0d0 100%); border: 1px solid #999; border-radius: 3px; font-size: 12px; cursor: pointer;">确定</button>
        <button id="cancelBtn" style="width: 75px; height: 30px; background: linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 50%, #d0d0d0 100%); border: 1px solid #999; border-radius: 3px; font-size: 12px; cursor: pointer;">取消</button>
    </div>
</div>
                `;

                const okBtn = winDocument.getElementById('okBtn');
                const cancelBtn = winDocument.getElementById('cancelBtn');
                const ratingInput = winDocument.getElementById('ratingInput') as HTMLInputElement;

                okBtn.onclick = function() {
                    const ratingValue = parseInt(ratingInput.value);
                    if (!isNaN(ratingValue) && ratingValue >= 0 && ratingValue <= 10) {
                        fnyoat.lastGameRating = ratingValue;
                        $gameVariables.setValue(100, ratingValue);
                        ratingWindow.close();
                        console.log('游戏评分已提交: ' + ratingValue);
                        resolve(true);
                    } else {
                        ratingWindow.window.alert('请输入0-10之间的有效数字！');
                    }
                };

                cancelBtn.onclick = function() {
                    ratingWindow.close();
                    console.log('用户点击了取消');
                    resolve(false);
                };

                function addButtonHover(btn: HTMLElement) {
                    btn.onmouseover = function() {
                        btn.style.background = 'linear-gradient(180deg, #e8f4ff 0%, #c8e0f0 50%, #b8d0e8 100%)';
                        btn.style.border = '1px solid #7da2ce';
                    };
                    btn.onmouseout = function() {
                        btn.style.background = 'linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 50%, #d0d0d0 100%)';
                        btn.style.border = '1px solid #999';
                    };
                }

                addButtonHover(okBtn);
                addButtonHover(cancelBtn);

                ratingWindow.show();
                ratingWindow.focus();
                ratingInput.focus();
                ratingInput.select();
            });

            ratingWindow.on('closed', function() {
                resolve(false);
            });
        });

    } catch(e) {
        console.log('HTML窗口不可用，使用备用方案: ' + (e as Error).message);
        console.log('错误详情:', (e as Error).stack);
        const rating = window.prompt('请评价您对本游戏的期望\n(请输入0-10之间的数字，0为最低评价，10为最高评价)', '5');

        if (rating !== null) {
            const ratingValue = parseInt(rating);
            if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 10) {
                window.alert('请输入0-10之间的有效数字！');
                return fnyoat.openGameRatingWindow();
            }
            fnyoat.lastGameRating = ratingValue;
            $gameVariables.setValue(100, ratingValue);
            console.log('游戏评分已提交: ' + ratingValue);
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }
};

// 获取评分
fnyoat.getLastGameRating = function(): number {
    return fnyoat.lastGameRating || 0;
};

//=============================================================================
// 同意请求弹窗功能 - 显示权限请求对话框
//=============================================================================

fnyoat.openPermissionRequestWindow = function(requesterId?: string, requesterName?: string, resourceName?: string): Promise<boolean> {
    try {
        let win: any;
        let foundMethod = '';

        try {
            if (typeof nw !== 'undefined' && nw.Window) {
                win = nw.Window;
                foundMethod = 'nw.Window';
            } else if (window.nw && window.nw.Window) {
                win = window.nw.Window;
                foundMethod = 'window.nw.Window';
            } else {
                const gui = require('nw.gui');
                win = gui.Window;
                foundMethod = 'gui.Window';
            }
        } catch(e) {
            try {
                const gui = window.nw.gui;
                win = gui.Window;
                foundMethod = 'window.nw.gui.Window';
            } catch(e2) {
                throw new Error('无法找到Window API: ' + (e as Error).message + ', ' + (e2 as Error).message);
            }
        }

        console.log('使用窗口API: ' + foundMethod);

        const displayId = requesterId || '0001';
        const displayName = requesterName || '孤流';
        const displayResource = resourceName || '纸条';

        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const windowWidth = 380;
        const windowHeight = 160;

        const permissionWindow = win.open('about:blank', {
            title: '权限请求',
            width: windowWidth,
            height: windowHeight,
            x: Math.floor((screenWidth - windowWidth) / 2),
            y: Math.floor((screenHeight - windowHeight) / 2),
            frame: false,
            resizable: false,
            always_on_top: true,
            show: false
        });

        if (!permissionWindow) {
            throw new Error('窗口创建失败，返回值为空');
        }

        return new Promise(function(resolve, reject) {
            permissionWindow.on('loaded', function() {
                const winDocument = permissionWindow.window.document;

                winDocument.body.style.margin = '0';
                winDocument.body.style.padding = '0';
                winDocument.body.style.fontFamily = '"Microsoft YaHei", sans-serif';
                winDocument.body.style.backgroundColor = '#f0f0f0';
                winDocument.body.style.overflow = 'hidden';
                winDocument.body.style.userSelect = 'none';

                winDocument.body.innerHTML = `
<div style="background: linear-gradient(180deg, #e0e0e0 0%, #c0c0c0 100%); height: 30px; display: flex; align-items: center; padding: 0 8px; border-bottom: 1px solid #999; cursor: move; -webkit-app-region: drag;">
    <div style="width: 16px; height: 16px; margin-right: 6px; background: #4a90d9; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">?</div>
    <div style="font-size: 12px; color: #333; flex: 1;">权限请求</div>
</div>
<div style="padding: 20px 30px; text-align: center;">
    <div style="font-size: 14px; color: #333; margin-bottom: 25px; line-height: 1.6;">
        是否允许${displayId}(${displayName})访问"${displayResource}"？
    </div>
    <div style="display: flex; justify-content: center; gap: 20px;">
        <button id="allowBtn" style="width: 100px; height: 30px; background: linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 50%, #d0d0d0 100%); border: 1px solid #999; border-radius: 3px; font-size: 12px; cursor: pointer;">允许</button>
        <button id="denyBtn" style="width: 100px; height: 30px; background: linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 50%, #d0d0d0 100%); border: 1px solid #999; border-radius: 3px; font-size: 12px; cursor: pointer;">拒绝</button>
    </div>
</div>
                `;

                const allowBtn = winDocument.getElementById('allowBtn');
                const denyBtn = winDocument.getElementById('denyBtn');

                allowBtn.onclick = function() {
                    fnyoat.lastPermissionResult = true;
                    permissionWindow.close();
                    console.log('用户允许了请求');
                    resolve(true);
                };

                denyBtn.onclick = function() {
                    fnyoat.lastPermissionResult = false;
                    permissionWindow.close();
                    console.log('用户拒绝了请求');
                    resolve(false);
                };

                allowBtn.onmouseover = function() {
                    allowBtn.style.background = 'linear-gradient(180deg, #e8f4ff 0%, #c8e0f0 50%, #b8d0e8 100%)';
                    allowBtn.style.border = '1px solid #7da2ce';
                };
                allowBtn.onmouseout = function() {
                    allowBtn.style.background = 'linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 50%, #d0d0d0 100%)';
                    allowBtn.style.border = '1px solid #999';
                };

                denyBtn.onmouseover = function() {
                    denyBtn.style.background = 'linear-gradient(180deg, #e8f4ff 0%, #c8e0f0 50%, #b8d0e8 100%)';
                    denyBtn.style.border = '1px solid #7da2ce';
                };
                denyBtn.onmouseout = function() {
                    denyBtn.style.background = 'linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 50%, #d0d0d0 100%)';
                    denyBtn.style.border = '1px solid #999';
                };

                permissionWindow.show();
                permissionWindow.focus();
            });

            permissionWindow.on('closed', function() {
                fnyoat.lastPermissionResult = false;
                resolve(false);
            });
        });

    } catch(e) {
        console.log('HTML窗口不可用，使用备用方案: ' + (e as Error).message);
        console.log('错误详情:', (e as Error).stack);
        const displayId = requesterId || '0001';
        const displayName = requesterName || '孤流';
        const displayResource = resourceName || '纸条';
        const result = window.confirm('是否允许' + displayId + '(' + displayName + ')访问"' + displayResource + '"？');
        fnyoat.lastPermissionResult = result;
        return Promise.resolve(result);
    }
};

// 获取权限请求结果
fnyoat.getLastPermissionResult = function(): boolean {
    return fnyoat.lastPermissionResult || false;
};
